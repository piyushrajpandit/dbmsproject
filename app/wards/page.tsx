"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Bed, Home, AlertCircle, RefreshCw, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";

interface BedItem {
  _id: string;
  bed_number: string;
  ward_id: string;
  type: "General" | "ICU" | "Paediatric";
  status_available: boolean;
}

interface WardItem {
  _id: string;
  ward_name: string;
  ward_number: string;
  capacity: number;
  beds: BedItem[];
  availableBedsCount: number;
}

export default function WardsPage() {
  const [wards, setWards] = useState<WardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal open states
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [editWardId, setEditWardId] = useState<string | null>(null);

  // Form states
  const [wardForm, setWardForm] = useState({
    ward_name: "",
    ward_number: "",
    capacity: "",
  });

  const [bedForm, setBedForm] = useState({
    bed_number: "",
    ward_id: "",
    type: "General",
    status_available: "true", // string to handle dropdown boolean values
  });

  // Fetch all wards and their beds
  async function fetchWards() {
    try {
      setLoading(true);
      const res = await fetch("/api/wards");
      if (!res.ok) throw new Error("Could not retrieve wards data.");
      const data = await res.json();
      setWards(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load wards and beds");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWards();
  }, []);

  // Submit Ward Form
  const handleWardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const capacityNum = Number(wardForm.capacity);
    if (isNaN(capacityNum) || capacityNum < 1) {
      toast.error("Capacity must be at least 1.");
      return;
    }

    try {
      const url = editWardId ? `/api/wards/${editWardId}` : "/api/wards";
      const method = editWardId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...wardForm,
          capacity: capacityNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${editWardId ? "update" : "create"} ward.`);
      }

      toast.success(editWardId ? "Ward details updated successfully!" : "Ward added successfully!");
      setIsWardModalOpen(false);
      setEditWardId(null);
      setWardForm({ ward_name: "", ward_number: "", capacity: "" });
      fetchWards();
    } catch (err: any) {
      toast.error(err.message || "Failed to save ward");
    }
  };

  // Submit Bed Form
  const handleBedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bedForm.ward_id) {
      toast.error("Please select a ward.");
      return;
    }

    try {
      const res = await fetch("/api/beds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bed_number: bedForm.bed_number,
          ward_id: bedForm.ward_id,
          type: bedForm.type,
          status_available: bedForm.status_available === "true",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create bed.");
      }

      toast.success("Bed added successfully!");
      setIsBedModalOpen(false);
      setBedForm({
        bed_number: "",
        ward_id: "",
        type: "General",
        status_available: "true",
      });
      fetchWards();
    } catch (err: any) {
      toast.error(err.message || "Failed to add bed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Wards & Beds</h2>
          <p className="text-sm text-gray-400">
            Monitor bed allocations, ward capacity occupancy, and check patient distributions.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => setIsWardModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-800 bg-[#0d0d15] hover:bg-[#12121a] text-gray-200 text-xs font-bold transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-green-400" />
            Add Ward
          </button>
          <button
            onClick={() => {
              // Pre-fill first ward selection if wards exist
              if (wards.length > 0) {
                setBedForm((prev) => ({ ...prev, ward_id: wards[0]._id }));
              }
              setIsBedModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-lg bg-green-400 hover:bg-green-500 text-black text-xs font-bold transition-all shadow-lg shadow-green-500/10 cursor-pointer"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            Add Bed
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="dashboard-card animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-32 bg-gray-800 rounded"></div>
                <div className="h-4 w-20 bg-gray-800 rounded"></div>
              </div>
              <hr className="border-gray-800" />
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, bIdx) => (
                  <div key={bIdx} className="h-14 bg-gray-800/40 rounded-lg"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : wards.length === 0 ? (
        <div className="dashboard-card text-center py-14 max-w-lg mx-auto">
          <Home className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-semibold">No Wards Registered</p>
          <p className="text-xs text-gray-600 mt-1 mb-4">
            Initialize a ward first, then add clinical beds to it.
          </p>
          <button
            onClick={() => setIsWardModalOpen(true)}
            className="px-4 py-2 text-xs font-bold bg-green-400 hover:bg-green-500 text-black rounded-lg transition-colors cursor-pointer"
          >
            Add Ward Directory
          </button>
        </div>
      ) : (
        /* Wards List Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wards.map((ward) => (
            <div key={ward._id} className="dashboard-card flex flex-col justify-between">
              <div>
                {/* Ward title */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                      {ward.ward_name}
                      <button
                        onClick={() => {
                          setEditWardId(ward._id);
                          setWardForm({
                            ward_name: ward.ward_name,
                            ward_number: ward.ward_number,
                            capacity: String(ward.capacity),
                          });
                          setIsWardModalOpen(true);
                        }}
                        className="p-1 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors inline-block"
                        title="Edit Ward Details"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </h3>
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                      Ward Number: {ward.ward_number}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-400">
                      Beds Available: {ward.availableBedsCount} / {ward.capacity}
                    </span>
                    <div className="text-[9px] text-gray-600 font-medium mt-0.5">
                      Max Capacity: {ward.capacity}
                    </div>
                  </div>
                </div>

                <hr className="border-gray-800/60 my-4" />

                {/* Ward Beds Grid */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Beds Directory
                  </h4>
                  {ward.beds.length === 0 ? (
                    <div className="text-center py-4 bg-[#12121a] rounded-lg border border-dashed border-gray-800/80">
                      <AlertCircle className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                      <p className="text-[11px] text-gray-500">No beds configured under this ward.</p>
                      <button
                        onClick={() => {
                          setBedForm((prev) => ({ ...prev, ward_id: ward._id }));
                          setIsBedModalOpen(true);
                        }}
                        className="text-[10px] text-green-400 hover:underline mt-1 font-semibold"
                      >
                        Add Bed
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {ward.beds.map((bed) => (
                        <div
                          key={bed._id}
                          className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-2 transition-all ${
                            bed.status_available
                              ? "bg-green-500/5 border-green-500/10 hover:border-green-400/30 text-green-400"
                              : "bg-red-500/5 border-red-500/10 hover:border-red-400/30 text-red-400"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold tracking-wide">
                              Bed {bed.bed_number}
                            </span>
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                bed.status_available ? "bg-green-400 animate-pulse" : "bg-red-500"
                              }`}
                            />
                          </div>
                          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">
                            {bed.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Create/Edit Ward */}
      <Modal
        isOpen={isWardModalOpen}
        onClose={() => {
          setIsWardModalOpen(false);
          setEditWardId(null);
          setWardForm({ ward_name: "", ward_number: "", capacity: "" });
        }}
        title={editWardId ? "Edit Ward Details" : "Create New Ward"}
      >
        <form onSubmit={handleWardSubmit} className="space-y-4">
          <div>
            <label className="form-label">Ward Name *</label>
            <input
              type="text"
              required
              placeholder="Intensive Care Unit (ICU)"
              className="form-input"
              value={wardForm.ward_name}
              onChange={(e) => setWardForm({ ...wardForm, ward_name: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Ward Number *</label>
            <input
              type="text"
              required
              placeholder="ICU-100"
              className="form-input"
              value={wardForm.ward_number}
              onChange={(e) => setWardForm({ ...wardForm, ward_number: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Bed Capacity (Maximum) *</label>
            <input
              type="number"
              required
              min={1}
              placeholder="12"
              className="form-input"
              value={wardForm.capacity}
              onChange={(e) => setWardForm({ ...wardForm, capacity: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => {
                setIsWardModalOpen(false);
                setEditWardId(null);
                setWardForm({ ward_name: "", ward_number: "", capacity: "" });
              }}
              className="px-4.5 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 text-sm font-semibold rounded-lg bg-green-400 hover:bg-green-500 text-black shadow-lg shadow-green-500/10 transition-colors"
            >
              {editWardId ? "Save Changes" : "Create Ward"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal - Add Bed */}
      <Modal
        isOpen={isBedModalOpen}
        onClose={() => setIsBedModalOpen(false)}
        title="Add Bed allocation"
      >
        <form onSubmit={handleBedSubmit} className="space-y-4">
          <div>
            <label className="form-label">Select Ward *</label>
            <select
              required
              className="form-input"
              value={bedForm.ward_id}
              onChange={(e) => setBedForm({ ...bedForm, ward_id: e.target.value })}
            >
              {wards.length === 0 && <option value="">No wards available. Create a ward first.</option>}
              {wards.map((ward) => (
                <option key={ward._id} value={ward._id}>
                  {ward.ward_name} ({ward.ward_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Bed Number / Code *</label>
            <input
              type="text"
              required
              placeholder="Bed-07"
              className="form-input"
              value={bedForm.bed_number}
              onChange={(e) => setBedForm({ ...bedForm, bed_number: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Bed Classification *</label>
            <select
              className="form-input"
              value={bedForm.type}
              onChange={(e) => setBedForm({ ...bedForm, type: e.target.value as any })}
            >
              <option value="General">General</option>
              <option value="ICU">ICU</option>
              <option value="Paediatric">Paediatric</option>
            </select>
          </div>

          <div>
            <label className="form-label">Initial Status *</label>
            <select
              className="form-input"
              value={bedForm.status_available}
              onChange={(e) => setBedForm({ ...bedForm, status_available: e.target.value })}
            >
              <option value="true">Available (Unoccupied)</option>
              <option value="false">Occupied (Reserved)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setIsBedModalOpen(false)}
              className="px-4.5 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={wards.length === 0}
              className="px-4.5 py-2 text-sm font-semibold rounded-lg bg-green-400 hover:bg-green-500 text-black shadow-lg shadow-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Bed
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
