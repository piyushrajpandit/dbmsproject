"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Stethoscope,
  Bed,
  Receipt,
  PlusCircle,
  Eye,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface OverviewStats {
  totalPatients: number;
  totalDoctors: number;
  availableBeds: number;
  totalBills: number;
}

interface AdmissionItem {
  _id: string;
  patient_id: { _id: string; patient_name: string };
  doctor_id: { _id: string; doctor_name: string };
  bed_id: { _id: string; bed_number: string };
  ward_id: { _id: string; ward_name: string };
  admission_date: string;
  status: "Admitted" | "Discharged" | "Critical";
}

export default function Dashboard() {
  const [stats, setStats] = useState<OverviewStats>({
    totalPatients: 0,
    totalDoctors: 0,
    availableBeds: 0,
    totalBills: 0,
  });
  const [recentAdmissions, setRecentAdmissions] = useState<AdmissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [resPatients, resDoctors, resBeds, resBills, resAdmissions] =
          await Promise.all([
            fetch("/api/patients"),
            fetch("/api/doctors"),
            fetch("/api/beds?available=true"),
            fetch("/api/billing"),
            fetch("/api/admissions"),
          ]);

        if (
          !resPatients.ok ||
          !resDoctors.ok ||
          !resBeds.ok ||
          !resBills.ok ||
          !resAdmissions.ok
        ) {
          throw new Error("Failed to load dashboard data.");
        }

        const patients = await resPatients.json();
        const doctors = await resDoctors.json();
        const beds = await resBeds.json();
        const bills = await resBills.json();
        const admissions = await resAdmissions.json();

        setStats({
          totalPatients: patients.length,
          totalDoctors: doctors.length,
          availableBeds: beds.length,
          totalBills: bills.length,
        });

        setRecentAdmissions(admissions.slice(0, 5));
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load dashboard parameters");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "text-blue-400 bg-blue-500/10",
      description: "Registered clinical records",
    },
    {
      title: "Total Doctors",
      value: stats.totalDoctors,
      icon: Stethoscope,
      color: "text-purple-400 bg-purple-500/10",
      description: "Attending active staff",
    },
    {
      title: "Available Beds",
      value: stats.availableBeds,
      icon: Bed,
      color: "text-green-400 bg-green-500/10",
      description: "Ready for immediate occupancy",
    },
    {
      title: "Total Bills Generated",
      value: stats.totalBills,
      icon: Receipt,
      color: "text-yellow-400 bg-yellow-500/10",
      description: "Invoiced financial items",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Admitted":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Admitted
          </span>
        );
      case "Critical":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            Critical
          </span>
        );
      case "Discharged":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-gray-500/10 text-gray-400 border border-gray-500/20">
            Discharged
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Dashboard</h2>
          <p className="text-sm text-gray-400">
            Real-time analytics and clinical operation statistics.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-[#0d0d15] px-3.5 py-2 rounded-lg border border-gray-800">
          <Activity className="h-4 w-4 text-green-400 animate-pulse" />
          <span>System status: Online</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="dashboard-card animate-pulse flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-28 bg-gray-800 rounded"></div>
                  <div className="h-8 w-8 bg-gray-800 rounded-lg"></div>
                </div>
                <div className="h-8 w-12 bg-gray-800 rounded"></div>
                <div className="h-3 w-36 bg-gray-800 rounded mt-1"></div>
              </div>
            ))
          : statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="dashboard-card flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-gray-400">{card.title}</p>
                    <span className={`p-2 rounded-lg ${card.color}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">
                      {card.value}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Quick Actions Panel */}
      <div className="dashboard-card">
        <h3 className="text-base font-bold text-white mb-4 tracking-wide">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/patients?openForm=true"
            className="flex items-center gap-3 p-3.5 rounded-lg bg-[#12121a] hover:bg-[#161622] border border-gray-800 hover:border-green-400/50 text-gray-300 hover:text-white transition-all group"
          >
            <PlusCircle className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Add Patient</span>
          </Link>
          <Link
            href="/doctors?openForm=true"
            className="flex items-center gap-3 p-3.5 rounded-lg bg-[#12121a] hover:bg-[#161622] border border-gray-800 hover:border-green-400/50 text-gray-300 hover:text-white transition-all group"
          >
            <PlusCircle className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Add Doctor</span>
          </Link>
          <Link
            href="/admissions?openForm=true"
            className="flex items-center gap-3 p-3.5 rounded-lg bg-[#12121a] hover:bg-[#161622] border border-gray-800 hover:border-green-400/50 text-gray-300 hover:text-white transition-all group"
          >
            <PlusCircle className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Add Admission</span>
          </Link>
          <Link
            href="/patients"
            className="flex items-center gap-3 p-3.5 rounded-lg bg-[#12121a] hover:bg-[#161622] border border-gray-800 hover:border-green-400/50 text-gray-300 hover:text-white transition-all group"
          >
            <Eye className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">View Records</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="dashboard-card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Recent Admissions
            </h3>
            <p className="text-xs text-gray-400">List of the last 5 admitted patients.</p>
          </div>
          <Link
            href="/admissions"
            className="text-xs text-green-400 hover:text-green-300 font-semibold flex items-center gap-1 group"
          >
            View All Admissions
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-gray-800/40 rounded animate-pulse" />
              ))}
            </div>
          ) : recentAdmissions.length === 0 ? (
            <div className="text-center py-10">
              <Activity className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No recent admissions found</p>
              <Link
                href="/admissions?openForm=true"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:underline"
              >
                Admit a Patient now
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="py-3 px-4 rounded-l-lg">Admission ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Ward / Bed</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAdmissions.map((admission) => (
                  <tr key={admission._id} className="table-row text-xs text-gray-300">
                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {admission._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {admission.patient_id?.patient_name || "N/A"}
                    </td>
                    <td className="py-3.5 px-4">
                      {admission.doctor_id?.doctor_name || "N/A"}
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
                    <td className="py-3.5 px-4">{getStatusBadge(admission.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
