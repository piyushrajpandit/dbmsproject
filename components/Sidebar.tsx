"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Bed,
  ClipboardList,
  Receipt,
  Menu,
  X,
  Activity,
  Database,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Doctors", href: "/doctors", icon: Stethoscope },
    { name: "Wards & Beds", href: "/wards", icon: Bed },
    { name: "Admissions", href: "/admissions", icon: ClipboardList },
    { name: "Billing", href: "/billing", icon: Receipt },
    { name: "Database Schema", href: "/relations", icon: Database },
  ];

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="flex md:hidden items-center justify-between bg-[#0d0d15] border-b border-gray-800 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-green-400" />
          <span className="text-white font-bold tracking-wide">SmartHospital</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-white focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Overlay for Mobile Drawer */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0d0d15] border-r border-gray-800 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header (hidden on mobile header bar, shown in panel) */}
        <div className="hidden md:flex items-center gap-2.5 px-6 py-6 border-b border-gray-800/60">
          <Activity className="h-7 w-7 text-green-400 animate-pulse" />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight tracking-wider">
              SmartHospital
            </h1>
            <span className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase">
              Management System
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-green-500/10 text-green-400 border-l-2 border-green-400 font-semibold"
                    : "text-gray-400 hover:bg-gray-800/30 hover:text-gray-200 border-l-2 border-transparent"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-green-400" : "text-gray-500 group-hover:text-gray-300"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-gray-800/60 text-center">
          <p className="text-[11px] text-gray-500 font-medium">
            Smart Hospital Management
          </p>
          <p className="text-[9px] text-gray-600 mt-0.5">Version 1.0.0</p>
        </div>
      </aside>
    </>
  );
}
