import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  User,
  Building2,
  LogOut,
  ChevronDown,
  Menu,
  ShieldCheck,
  Radio,
} from "lucide-react";

export default function Navbar({ onToggleMobileSidebar, currentRole }) {
  const { user, role, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast.info("Logged out of MedVault");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & MedVault Brand */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link
            to={role === "hospital" ? "/hospital/dashboard" : "/patient/dashboard"}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-base tracking-tighter">MV</span>
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                MedVault
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  Cloud
                </span>
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Live AWS API Gateway Connection Badge */}
        <div className="hidden md:flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
            title="All requests connected directly to AWS API Gateway"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AWS API Gateway Live</span>
          </div>

          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 capitalize">
            Active Portal: <strong className="text-slate-800">{role || currentRole}</strong>
          </div>
        </div>

        {/* Right: User profile & Logout */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
            aria-expanded={dropdownOpen}
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-semibold text-xs">
              {role === "hospital" ? (
                <Building2 className="w-4 h-4 text-teal-700" />
              ) : (
                <User className="w-4 h-4 text-blue-700" />
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || (role === "hospital" ? "Hospital Staff" : "Patient User")}
              </p>
              <p className="text-[11px] text-slate-500 capitalize">
                {role === "hospital" ? "Healthcare Provider" : "Verified Patient"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-400">Authenticated Session</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user?.email || "Signed in"}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Role: {role}
                  </span>
                </div>

                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out of MedVault
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
