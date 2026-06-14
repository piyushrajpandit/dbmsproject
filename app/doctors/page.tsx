"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PlusCircle, Search, Trash2, ShieldAlert, Award, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";

interface DoctorItem {
  _id: string;
  doctor_name: string;
  specialization: string;
  contact?: string;
  salary?: number;
  createdAt: string;
}

function DoctorsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State definitions
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDoctorId, setDeleteDoctorId] = useState<string | null>(null);
  const [editDoctorId, setEditDoctorId] = useState<string | null>(null);

  // Form input state
  const [formData, setFormData] = useState({
    doctor_name: "",
    specialization: "",
    contact: "",
    salary: "",
  });

  // Fetch all doctors
  async function fetchDoctors() {
    try {
      setLoading(true);
      const res = await fetch("/api/doctors");
      if (!res.ok) throw new Error("Could not retrieve doctors.");
      const data = await res.json();
      setDoctors(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load doctors list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Handle URL parameters for quick-links
  useEffect(() => {
    if (searchParams.get("openForm") === "true") {
      setIsFormOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("openForm");
      router.replace(`/doctors?${params.toString()}`);
    }
  }, [searchParams, router]);

  // Form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.contact && !/^\d{1,10}$/.test(formData.contact)) {
      toast.error("Contact number must be numeric and maximum of 10 digits.");
      return;
    }

    if (formData.salary && (isNaN(Number(formData.salary)) || Number(formData.salary) < 0)) {
      toast.error("Salary must be a positive number.");
      return;
    }

    try {
      const url = editDoctorId ? `/api/doctors/${editDoctorId}` : "/api/doctors";
      const method = editDoctorId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salary: formData.salary ? Number(formData.salary) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${editDoctorId ? "update" : "add"} doctor.`);
      }

      toast.success(editDoctorId ? "Doctor profile updated successfully!" : "Doctor added successfully!");
      setIsFormOpen(false);
      setEditDoctorId(null);
      setFormData({
        doctor_name: "",
        specialization: "",
        contact: "",
        salary: "",
      });
      fetchDoctors();
    } catch (err: any) {
      toast.error(err.message || "Failed to add doctor");
    }
  };

  // Delete doctor handler
  const handleDeleteConfirm = async () => {
    if (!deleteDoctorId) return;

    try {
      const res = await fetch(`/api/doctors/${deleteDoctorId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete doctor.");
      }

      toast.success("Doctor record deleted successfully");
      fetchDoctors();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete doctor");
    } finally {
      setDeleteDoctorId(null);
    }
  };

  // Filter based on search query
  const filteredDoctors = doctors.filter((doc) => {
    const query = searchQuery.toLowerCase();
    return (
      doc.doctor_name.toLowerCase().includes(query) ||
      doc.specialization.toLowerCase().includes(query) ||
      (doc.contact && doc.contact.includes(query)) ||
      doc._id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Doctors Directory</h2>
          <p className="text-sm text-gray-400">
            Manage active hospital physicians, specialities, and contact directories.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-lg bg-green-400 hover:bg-green-500 text-black text-xs font-bold transition-all shadow-lg shadow-green-500/10 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          Add Doctor
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-[#0d0d15] border border-gray-800 rounded-lg px-4.5 py-3.5 max-w-md">
        <Search className="h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search by physician name, specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-sm text-gray-300 w-full placeholder-gray-500"
        />
      </div>

      {/* Doctors Table */}
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-gray-800/40 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-semibold">No doctors found</p>
              <p className="text-xs text-gray-600 mt-1">
                Refine the search term or add a new doctor using the panel above.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="py-3 px-4 rounded-l-lg">Doctor ID</th>
                  <th className="py-3 px-4">Physician Name</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Contact Number</th>
                  <th className="py-3 px-4">Salary</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="table-row text-xs text-gray-300">
                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {doctor._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {doctor.doctor_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/10">
                        {doctor.specialization}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{doctor.contact || "—"}</td>
                    <td className="py-3.5 px-4 font-mono">
                      {doctor.salary ? `$${doctor.salary.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditDoctorId(doctor._id);
                          setFormData({
                            doctor_name: doctor.doctor_name,
                            specialization: doctor.specialization,
                            contact: doctor.contact || "",
                            salary: doctor.salary ? String(doctor.salary) : "",
                          });
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors inline-block"
                      >
                        <Pencil className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => setDeleteDoctorId(doctor._id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors inline-block"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal - Register/Edit Doctor Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditDoctorId(null);
          setFormData({
            doctor_name: "",
            specialization: "",
            contact: "",
            salary: "",
          });
        }}
        title={editDoctorId ? "Edit Physician Profile" : "Add Physician Profile"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="form-label">Doctor Name *</label>
            <input
              type="text"
              required
              placeholder="Dr. Sarah Connor"
              className="form-input"
              value={formData.doctor_name}
              onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Specialization *</label>
            <input
              type="text"
              required
              placeholder="Cardiology, Pediatrics, Neurology..."
              className="form-input"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Contact Number</label>
            <input
              type="text"
              placeholder="10-digit phone number"
              className="form-input"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Salary (Annual)</label>
            <input
              type="number"
              placeholder="120000"
              className="form-input"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditDoctorId(null);
                setFormData({
                  doctor_name: "",
                  specialization: "",
                  contact: "",
                  salary: "",
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
              {editDoctorId ? "Save Changes" : "Register Doctor"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal - Delete Doctor */}
      <Modal
        isOpen={deleteDoctorId !== null}
        onClose={() => setDeleteDoctorId(null)}
        title="Confirm Deletion"
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        type="danger"
      >
        <div className="flex items-start gap-3.5">
          <span className="p-2.5 rounded-lg bg-red-500/10 text-red-400">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Delete Physician Record?</p>
            <p className="text-xs text-gray-400 mt-1">
              Warning: Deleting this physician record will permanently remove them from staff rosters. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-500 text-sm">Loading doctors...</div>}>
      <DoctorsContent />
    </Suspense>
  );
}
