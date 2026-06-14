"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PlusCircle, Search, Trash2, UserPlus, AlertTriangle, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";

interface PatientItem {
  _id: string;
  patient_name: string;
  dob: string;
  gender: string;
  blood_group: string;
  contact: string;
  email: string;
  address?: string;
  medical_history?: string;
  createdAt: string;
}

function PatientsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State definitions
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);

  // Form inputs state
  const [formData, setFormData] = useState({
    patient_name: "",
    dob: "",
    gender: "Male",
    blood_group: "A+",
    contact: "",
    email: "",
    address: "",
    medical_history: "",
  });

  // Fetch all patients
  async function fetchPatients() {
    try {
      setLoading(true);
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Could not retrieve patients.");
      const data = await res.json();
      setPatients(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load patients list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients();
  }, []);

  // Handle URL search parameters for quick-links
  useEffect(() => {
    if (searchParams.get("openForm") === "true") {
      setIsFormOpen(true);
      // Clear parameter from URL bar to prevent opening again on refresh
      const params = new URLSearchParams(searchParams.toString());
      params.delete("openForm");
      router.replace(`/patients?${params.toString()}`);
    }
  }, [searchParams, router]);

  // Form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check contact contains only digits and is max 10
    if (!/^\d{1,10}$/.test(formData.contact)) {
      toast.error("Contact number must be numeric and maximum of 10 digits.");
      return;
    }

    try {
      const url = editPatientId ? `/api/patients/${editPatientId}` : "/api/patients";
      const method = editPatientId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${editPatientId ? "update" : "register"} patient.`);
      }

      toast.success(editPatientId ? "Patient record updated successfully!" : "Patient registered successfully!");
      setIsFormOpen(false);
      setEditPatientId(null);
      // Reset form
      setFormData({
        patient_name: "",
        dob: "",
        gender: "Male",
        blood_group: "A+",
        contact: "",
        email: "",
        address: "",
        medical_history: "",
      });
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    }
  };

  // Delete patient handler
  const handleDeleteConfirm = async () => {
    if (!deletePatientId) return;

    try {
      const res = await fetch(`/api/patients/${deletePatientId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete patient.");
      }

      toast.success("Patient record deleted successfully");
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete patient");
    } finally {
      setDeletePatientId(null);
    }
  };

  // Filter patients based on search queries
  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    return (
      patient.patient_name.toLowerCase().includes(query) ||
      patient.contact.includes(query) ||
      patient.email.toLowerCase().includes(query) ||
      patient._id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Patients Registry</h2>
          <p className="text-sm text-gray-400">
            Search, filter, register, and manage medical files of patients.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-lg bg-green-400 hover:bg-green-500 text-black text-xs font-bold transition-all shadow-lg shadow-green-500/10 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          Register Patient
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-[#0d0d15] border border-gray-800 rounded-lg px-4.5 py-3.5 max-w-md">
        <Search className="h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name, contact, email or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-sm text-gray-300 w-full placeholder-gray-500"
        />
      </div>

      {/* Patients Table */}
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-gray-800/40 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-semibold">No patient files found</p>
              <p className="text-xs text-gray-600 mt-1">Try refining your search filter or add a new patient.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="py-3 px-4 rounded-l-lg">Patient ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const birthDate = new Date(patient.dob);
                  const age = new Date().getFullYear() - birthDate.getFullYear();
                  return (
                    <tr key={patient._id} className="table-row text-xs text-gray-300">
                      <td className="py-3.5 px-4 font-mono text-gray-500">
                        {patient._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {patient.patient_name}
                      </td>
                      <td className="py-3.5 px-4">
                        {age} yrs / <span className="text-gray-400">{patient.gender}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 font-bold text-[10px] rounded bg-gray-800 text-green-400 border border-gray-700">
                          {patient.blood_group}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>{patient.contact}</div>
                        <div className="text-[10px] text-gray-500">{patient.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditPatientId(patient._id);
                            setFormData({
                              patient_name: patient.patient_name,
                              dob: patient.dob ? new Date(patient.dob).toISOString().split("T")[0] : "",
                              gender: patient.gender,
                              blood_group: patient.blood_group,
                              contact: patient.contact,
                              email: patient.email,
                              address: patient.address || "",
                              medical_history: patient.medical_history || "",
                            });
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors inline-block"
                        >
                          <Pencil className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => setDeletePatientId(patient._id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors inline-block"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal - Register/Edit Patient Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditPatientId(null);
          setFormData({
            patient_name: "",
            dob: "",
            gender: "Male",
            blood_group: "A+",
            contact: "",
            email: "",
            address: "",
            medical_history: "",
          });
        }}
        title={editPatientId ? "Edit Patient Details" : "Register New Patient"}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                className="form-input"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Gender *</label>
              <select
                className="form-input"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Blood Group *</label>
              <select
                className="form-input"
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Contact Number *</label>
              <input
                type="text"
                required
                placeholder="10-digit number"
                className="form-input"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Address</label>
            <input
              type="text"
              placeholder="123 Hospital St, City"
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Medical History</label>
            <textarea
              placeholder="Allergies, chronic conditions, prior surgeries..."
              rows={3}
              className="form-input"
              value={formData.medical_history}
              onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditPatientId(null);
                setFormData({
                  patient_name: "",
                  dob: "",
                  gender: "Male",
                  blood_group: "A+",
                  contact: "",
                  email: "",
                  address: "",
                  medical_history: "",
                });
              }}
              className="px-4.5 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 text-sm font-semibold rounded-lg bg-green-400 hover:bg-green-500 text-black shadow-lg shadow-green-500/10 transition-colors"
            >
              {editPatientId ? "Save Changes" : "Register Patient"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal - Delete Patient */}
      <Modal
        isOpen={deletePatientId !== null}
        onClose={() => setDeletePatientId(null)}
        title="Confirm Deletion"
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        type="danger"
      >
        <div className="flex items-start gap-3.5">
          <span className="p-2.5 rounded-lg bg-red-500/10 text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Delete Patient Record?</p>
            <p className="text-xs text-gray-400 mt-1">
              Warning: This will permanently delete the patient medical file from the database. This action is irreversible.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-500 text-sm">Loading registry...</div>}>
      <PatientsContent />
    </Suspense>
  );
}
