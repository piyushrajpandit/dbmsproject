"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PlusCircle, ClipboardList, Activity, CheckCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";

interface PatientOption {
  _id: string;
  patient_name: string;
}

interface DoctorOption {
  _id: string;
  doctor_name: string;
  specialization: string;
}

interface BedOption {
  _id: string;
  bed_number: string;
  type: string;
  ward_id: {
    _id: string;
    ward_name: string;
  };
}

interface AdmissionItem {
  _id: string;
  patient_id: { _id: string; patient_name: string };
  doctor_id: { _id: string; doctor_name: string };
  bed_id: { _id: string; bed_number: string };
  ward_id: { _id: string; ward_name: string };
  admission_date: string;
  discharge_date?: string;
  status: "Admitted" | "Discharged" | "Critical";
}

function AdmissionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State definitions
  const [admissions, setAdmissions] = useState<AdmissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dropdown options states
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [availableBeds, setAvailableBeds] = useState<BedOption[]>([]);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dischargeId, setDischargeId] = useState<string | null>(null);

  // Form input states
  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    bed_id: "",
    ward_name: "", // Read-only helper for UI
    admission_date: new Date().toISOString().split("T")[0], // default to today
    status: "Admitted",
  });

  // Fetch admissions list
  async function fetchAdmissions() {
    try {
      setLoading(true);
      const res = await fetch("/api/admissions");
      if (!res.ok) throw new Error("Could not fetch admissions.");
      const data = await res.json();
      setAdmissions(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load admissions");
    } finally {
      setLoading(false);
    }
  }

  // Fetch dropdown options for the form
  async function fetchFormOptions() {
    try {
      const [resPatients, resDoctors, resBeds] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/doctors"),
        fetch("/api/beds?available=true"),
      ]);

      if (!resPatients.ok || !resDoctors.ok || !resBeds.ok) {
        throw new Error("Failed to load options.");
      }

      const pData = await resPatients.json();
      const dData = await resDoctors.json();
      const bData = await resBeds.json();

      setPatients(pData);
      setDoctors(dData);
      setAvailableBeds(bData);

      // Pre-select defaults if items exist
      if (pData.length > 0 && dData.length > 0 && bData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          patient_id: pData[0]._id,
          doctor_id: dData[0]._id,
          bed_id: bData[0]._id,
          ward_name: bData[0].ward_id?.ward_name || "",
        }));
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load form selection options.");
    }
  }

  useEffect(() => {
    fetchAdmissions();
  }, []);

  // Fetch form items when opening the form
  useEffect(() => {
    if (isFormOpen) {
      fetchFormOptions();
    }
  }, [isFormOpen]);

  // Handle URL parameter deep links
  useEffect(() => {
    if (searchParams.get("openForm") === "true") {
      setIsFormOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("openForm");
      router.replace(`/admissions?${params.toString()}`);
    }
  }, [searchParams, router]);

  // Auto-fill ward based on bed selection
  const handleBedChange = (selectedBedId: string) => {
    const bedObj = availableBeds.find((bed) => bed._id === selectedBedId);
    setFormData((prev) => ({
      ...prev,
      bed_id: selectedBedId,
      ward_name: bedObj?.ward_id?.ward_name || "",
    }));
  };

  // Submit Admission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_id || !formData.doctor_id || !formData.bed_id) {
      toast.error("Please fill all required selections.");
      return;
    }

    const inputDate = new Date(formData.admission_date);
    if (inputDate > new Date(Date.now() + 60000)) {
      toast.error("Admission date cannot be set in the future.");
      return;
    }

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: formData.patient_id,
          doctor_id: formData.doctor_id,
          bed_id: formData.bed_id,
          admission_date: formData.admission_date,
          status: formData.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create admission.");
      }

      toast.success("Patient admitted successfully!");
      setIsFormOpen(false);
      fetchAdmissions();
    } catch (err: any) {
      toast.error(err.message || "Failed to create admission record");
    }
  };

  // Confirm Discharge Patient
  const handleDischargeConfirm = async () => {
    if (!dischargeId) return;

    try {
      const res = await fetch(`/api/admissions/${dischargeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discharge" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to discharge patient.");
      }

      toast.success("Patient discharged. Bed has been released.");
      fetchAdmissions();
    } catch (err: any) {
      toast.error(err.message || "Failed to process discharge");
    } finally {
      setDischargeId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Admitted":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Admitted
          </span>
        );
      case "Critical":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            Critical
          </span>
        );
      case "Discharged":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-500/10 text-gray-400 border border-gray-500/20">
            Discharged
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Patient Admissions</h2>
          <p className="text-sm text-gray-400">
            Manage hospital admissions, discharges, bed assignments, and emergency conditions.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-lg bg-green-400 hover:bg-green-500 text-black text-xs font-bold transition-all shadow-lg shadow-green-500/10 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          Admit Patient
        </button>
      </div>

      {/* Admissions Table */}
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-gray-800/40 rounded animate-pulse" />
              ))}
            </div>
          ) : admissions.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-semibold">No admissions registered</p>
              <p className="text-xs text-gray-600 mt-1">
                Admit a patient to initiate clinical beds allocations.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="py-3 px-4 rounded-l-lg">Admission ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Bed & Ward</th>
                  <th className="py-3 px-4">Admission Date</th>
                  <th className="py-3 px-4">Discharge Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((admission) => (
                  <tr key={admission._id} className="table-row text-xs text-gray-300">
                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {admission._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {admission.patient_id?.patient_name || <span className="text-gray-600">N/A</span>}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {admission.doctor_id?.doctor_name || <span className="text-gray-600">N/A</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-gray-400">
                        {admission.ward_id?.ward_name || "N/A"}
                      </span>
                      {" — "}
                      <span className="font-semibold text-white">
                        Bed {admission.bed_id?.bed_number || "N/A"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {new Date(admission.admission_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {admission.discharge_date
                        ? new Date(admission.discharge_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(admission.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {admission.status === "Admitted" && (
                        <button
                          onClick={() => setDischargeId(admission._id)}
                          className="px-3 py-1.5 rounded-lg border border-gray-800 hover:border-green-400/40 text-gray-400 hover:text-green-400 text-[10px] font-bold transition-all bg-[#0a0a0f]"
                        >
                          Discharge
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal - Admit Patient Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Admit Patient to Clinical Ward"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="form-label">Select Patient *</label>
            <select
              required
              className="form-input"
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
            >
              {patients.length === 0 && <option value="">No patients found. Register one first.</option>}
              {patients.map((pat) => (
                <option key={pat._id} value={pat._id}>
                  {pat.patient_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Attending Doctor *</label>
            <select
              required
              className="form-input"
              value={formData.doctor_id}
              onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
            >
              {doctors.length === 0 && <option value="">No doctors found. Add one first.</option>}
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.doctor_name} — {doc.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Available Bed *</label>
              <select
                required
                className="form-input"
                value={formData.bed_id}
                onChange={(e) => handleBedChange(e.target.value)}
              >
                {availableBeds.length === 0 && (
                  <option value="">No available beds. Free up or add beds.</option>
                )}
                {availableBeds.map((bed) => (
                  <option key={bed._id} value={bed._id}>
                    Bed {bed.bed_number} ({bed.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Assigned Ward (Auto-filled)</label>
              <input
                type="text"
                readOnly
                placeholder="Select a bed to autofill"
                className="form-input bg-gray-900 border-gray-800 text-gray-500 cursor-not-allowed"
                value={formData.ward_name}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Admission Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Admission Status *</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Admitted">Admitted</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4.5 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={patients.length === 0 || doctors.length === 0 || availableBeds.length === 0}
              className="px-4.5 py-2 text-sm font-semibold rounded-lg bg-green-400 hover:bg-green-500 text-black shadow-lg shadow-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Admission
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal - Discharge */}
      <Modal
        isOpen={dischargeId !== null}
        onClose={() => setDischargeId(null)}
        title="Discharge Patient"
        onConfirm={handleDischargeConfirm}
        confirmText="Confirm Discharge"
        type="success"
      >
        <div className="flex items-start gap-3.5">
          <span className="p-2.5 rounded-lg bg-green-500/10 text-green-400">
            <CheckCircle className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Confirm Patient Discharge?</p>
            <p className="text-xs text-gray-400 mt-1">
              Warning: Discharging the patient will mark their assigned clinical bed as &quot;Available&quot; and record today&apos;s date as the discharge date.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdmissionsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-500 text-sm">Loading admissions...</div>}>
      <AdmissionsContent />
    </Suspense>
  );
}
