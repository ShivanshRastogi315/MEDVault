import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  LayoutDashboard,
  Search,
  FilePlus2,
  Pill,
  Siren,
  BedDouble,
  LogOut,
  Building2,
  X,
  ShieldAlert,
} from "lucide-react";

export default function HospitalSidebar({ mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info("Logged out of Hospital Portal");
    navigate("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/hospital/dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "Patient Records",
      path: "/hospital/patients",
      icon: Search,
      badge: "Lookup",
    },
    {
      name: "Add Record",
      path: "/hospital/add-record",
      icon: FilePlus2,
      badge: "Upload",
    },
    {
      name: "Add Prescription",
      path: "/hospital/add-prescription",
      icon: Pill,
      badge: null,
    },
    {
      name: "Emergency Access",
      path: "/hospital/emergency-access",
      icon: Siren,
      badge: "FAST ER",
      badgeColor: "bg-rose-100 text-rose-700 font-bold animate-pulse",
    },
    {
      name: "Visit Management",
      path: "/hospital/visits",
      icon: BedDouble,
      badge: "Admissions",
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">MedVault</h2>
            <p className="text-[11px] font-medium text-teal-600">Hospital Staff Portal</p>
          </div>
        </div>

        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hospital Mini Info */}
      <div className="px-4 py-3 bg-gradient-to-r from-teal-50/70 to-blue-50/70 border-b border-slate-100">
        <div className="text-xs">
          <p className="font-semibold text-slate-800 truncate">
            {user?.hospitalName || user?.name || "Medical Center"}
          </p>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span className="font-mono">{user?.registrationNumber || user?.hospitalId || user?.id || "Active Node"}</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
              ER Ready
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Clinical Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-teal-600 text-white shadow-sm shadow-teal-500/25 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-white" : "text-slate-500"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : item.badgeColor || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer with Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
