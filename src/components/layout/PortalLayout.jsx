import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import PatientSidebar from "./PatientSidebar";
import HospitalSidebar from "./HospitalSidebar";

export default function PortalLayout({ portalType }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        currentRole={portalType}
      />
      <div className="flex-1 flex overflow-hidden">
        {portalType === "hospital" ? (
          <HospitalSidebar
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        ) : (
          <PatientSidebar
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        )}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
