"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Receipt, Trash2, ShieldAlert, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";

interface AdmissionOption {
  _id: string;
  patient_id: {
    patient_name: string;
  };
  admission_date: string;
}

interface BillItem {
  _id: string;
  admission_id: {
    _id: string;
    patient_id: {
      patient_name: string;
    };
    admission_date: string;
  };
  total_amount: number;
  payment_status: "Pending" | "Paid" | "Partial";
  bill_date: string;
  createdAt: string;
}

export default function BillingPage() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteBillId, setDeleteBillId] = useState<string | null>(null);
  const [editBillId, setEditBillId] = useState<string | null>(null);

  // Form input states
  const [formData, setFormData] = useState({
    admission_id: "",
    total_amount: "",
    payment_status: "Pending",
    bill_date: new Date().toISOString().split("T")[0],
  });

  // Fetch all bills
  async function fetchBills() {
    try {
      setLoading(true);
      const res = await fetch("/api/billing");
      if (!res.ok) throw new Error("Failed to load bills.");
      const data = await res.json();
      setBills(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load billing directory");
    } finally {
      setLoading(false);
    }
  }

  // Fetch admissions for invoice dropdown linkage
  async function fetchAdmissionOptions() {
    try {
      const res = await fetch("/api/admissions");
      if (!res.ok) throw new Error("Could not retrieve admissions.");
      const data = await res.json();
      setAdmissions(data);

      if (data.length > 0 && !formData.admission_id) {
        setFormData((prev) => ({ ...prev, admission_id: data[0]._id }));
      }
    } catch (err: any) {
      toast.error("Failed to query active admissions dropdown");
    }
  }

  useEffect(() => {
    fetchBills();
  }, []);

  // Fetch options when opening form
  useEffect(() => {
    if (isFormOpen) {
      fetchAdmissionOptions();
    }
  }, [isFormOpen]);

  // Submit invoice form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number(formData.total_amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Billing total amount must be a positive number.");
      return;
    }

    if (!formData.admission_id) {
      toast.error("Please associate this invoice with an admission record.");
      return;
    }

    try {
      const url = editBillId ? `/api/billing/${editBillId}` : "/api/billing";
      const method = editBillId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admission_id: formData.admission_id,
          total_amount: amount,
          payment_status: formData.payment_status,
          bill_date: formData.bill_date,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${editBillId ? "update" : "generate"} invoice.`);
      }

      toast.success(editBillId ? "Billing invoice updated successfully!" : "Bill invoice created successfully!");
      setIsFormOpen(false);
      setEditBillId(null);
      setFormData({
        admission_id: "",
        total_amount: "",
        payment_status: "Pending",
        bill_date: new Date().toISOString().split("T")[0],
      });
      fetchBills();
    } catch (err: any) {
      toast.error(err.message || "Failed to create bill");
    }
  };

  // Delete invoice
  const handleDeleteConfirm = async () => {
    if (!deleteBillId) return;

    try {
      const res = await fetch(`/api/billing/${deleteBillId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete bill.");
      }

      toast.success("Invoice deleted successfully");
      fetchBills();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete bill");
    } finally {
      setDeleteBillId(null);
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
            Paid
          </span>
        );
      case "Pending":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse">
            Pending
          </span>
        );
      case "Partial":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Partial
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Billing & Invoices</h2>
          <p className="text-sm text-gray-400">
            Generate clinical invoices, trace patient balances, and monitor hospital collections.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-lg bg-green-400 hover:bg-green-500 text-black text-xs font-bold transition-all shadow-lg shadow-green-500/10 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          Generate Invoice
        </button>
      </div>

      {/* Invoices Table */}
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-gray-800/40 rounded animate-pulse" />
              ))}
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-semibold">No invoices generated</p>
              <p className="text-xs text-gray-600 mt-1">
                Create a bill link to log active patient payment statuses.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="py-3 px-4 rounded-l-lg">Bill ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Admission Details</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Bill Date</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill._id} className="table-row text-xs text-gray-300">
                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {bill._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {bill.admission_id?.patient_id?.patient_name || (
                        <span className="text-gray-600">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {bill.admission_id?._id
                        ? `ADM-${bill.admission_id._id.slice(-6).toUpperCase()}`
                        : "N/A"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white font-semibold">
                      ${bill.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {new Date(bill.bill_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">{getPaymentBadge(bill.payment_status)}</td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditBillId(bill._id);
                          setFormData({
                            admission_id: bill.admission_id?._id || "",
                            total_amount: String(bill.total_amount),
                            payment_status: bill.payment_status,
                            bill_date: bill.bill_date ? new Date(bill.bill_date).toISOString().split("T")[0] : "",
                          });
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors inline-block"
                      >
                        <Pencil className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => setDeleteBillId(bill._id)}
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

      {/* Modal - Generate/Edit Bill Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditBillId(null);
          setFormData({
            admission_id: "",
            total_amount: "",
            payment_status: "Pending",
            bill_date: new Date().toISOString().split("T")[0],
          });
        }}
        title={editBillId ? "Edit Invoice Details" : "Generate Invoice / Bill"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="form-label">Associate Admission *</label>
            <select
              required
              className="form-input"
              value={formData.admission_id}
              onChange={(e) => setFormData({ ...formData, admission_id: e.target.value })}
            >
              {admissions.length === 0 && <option value="">No admissions found. Admit a patient first.</option>}
              {admissions.map((adm) => {
                const date = new Date(adm.admission_date).toLocaleDateString();
                const name = adm.patient_id?.patient_name || "N/A";
                return (
                  <option key={adm._id} value={adm._id}>
                    {name} — Admitted {date} (ID: {adm._id.slice(-6).toUpperCase()})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="form-label">Total Amount ($ USD) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="450.00"
              className="form-input"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Payment Status *</label>
              <select
                className="form-input"
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
            <div>
              <label className="form-label">Bill Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.bill_date}
                onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditBillId(null);
                setFormData({
                  admission_id: "",
                  total_amount: "",
                  payment_status: "Pending",
                  bill_date: new Date().toISOString().split("T")[0],
                });
              }}
              className="px-4.5 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={admissions.length === 0}
              className="px-4.5 py-2 text-sm font-semibold rounded-lg bg-green-400 hover:bg-green-500 text-black shadow-lg shadow-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editBillId ? "Save Changes" : "Generate Invoice"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal - Delete Invoice */}
      <Modal
        isOpen={deleteBillId !== null}
        onClose={() => setDeleteBillId(null)}
        title="Confirm Invoice Deletion"
        onConfirm={handleDeleteConfirm}
        confirmText="Delete Invoice"
        type="danger"
      >
        <div className="flex items-start gap-3.5">
          <span className="p-2.5 rounded-lg bg-red-500/10 text-red-400">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Delete Billing Invoice?</p>
            <p className="text-xs text-gray-400 mt-1">
              Warning: Deleting this invoice will permanently clear this billing statement. Active payment log balances may be altered. This action is final.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
