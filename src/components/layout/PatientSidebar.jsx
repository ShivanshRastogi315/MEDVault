import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  apiRequest,
  ENDPOINTS,
  getStoredToken,
  getStoredUserId,
  getStoredUserData,
} from "../../services/api";
import {
  LayoutDashboard,
  FolderLock,
  Pill,
  History,
  CalendarClock,
  ShieldAlert,
  LogOut,
  X,
  Droplet,
  User,
  BotMessageSquare,
} from "lucide-react";

export default function PatientSidebar({ mobileOpen, onCloseMobile }) {
  const { user, userId, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Track dynamic counts from live API updates
  const [recordsCount, setRecordsCount] = useState(() => {
    const cached = localStorage.getItem("medvault_patient_records_count");
    return cached !== null && !isNaN(parseInt(cached, 10)) ? parseInt(cached, 10) : null;
  });
  const [medsCount, setMedsCount] = useState(null);
  const [apptsCount, setApptsCount] = useState(null);

  const activePatientId =
    user?.patientId ||
    user?.id ||
    userId ||
    getStoredUserId() ||
    getStoredUserData()?.patientId ||
    getStoredUserData()?.id ||
    "MV-PAT-4770";

  useEffect(() => {
    const handleCountUpdate = (e) => {
      if (e.detail?.count !== undefined && !isNaN(e.detail.count)) {
        setRecordsCount(e.detail.count);
      } else {
        const cached = localStorage.getItem("medvault_patient_records_count");
        if (cached !== null && !isNaN(parseInt(cached, 10))) {
          setRecordsCount(parseInt(cached, 10));
        }
      }
    };

    window.addEventListener("medvault_records_updated", handleCountUpdate);
    window.addEventListener("storage", handleCountUpdate);

    fetchLiveCounts();

    return () => {
      window.removeEventListener("medvault_records_updated", handleCountUpdate);
      window.removeEventListener("storage", handleCountUpdate);
    };
  }, [user, userId, activePatientId]);

  const fetchLiveCounts = async () => {
    const token = getStoredToken();
    if (!token) return;

    // 1. Records count
    try {
      const recEndpoint = `${ENDPOINTS.getPatientRecords || ENDPOINTS.medicalRecords}?patientId=${encodeURIComponent(activePatientId)}`;
      const res = await apiRequest(recEndpoint);
      const list = Array.isArray(res) ? res : res.data || res.records || [];
      const count = list.length;
      setRecordsCount(count);
      localStorage.setItem("medvault_patient_records_count", count.toString());
    } catch {
      // Graceful fallback
    }

    // 2. Medications count
    try {
      const medsEndpoint = `${ENDPOINTS.getPatientMedications || ENDPOINTS.currentMedications}?patientId=${encodeURIComponent(activePatientId)}`;
      const mRes = await apiRequest(medsEndpoint);
      if (mRes.active) {
        setMedsCount(mRes.active.length);
      } else if (Array.isArray(mRes)) {
        setMedsCount(mRes.filter((m) => m.status === "Active").length);
      } else {
        setMedsCount(0);
      }
    } catch {
      setMedsCount(null);
    }

    // 3. Appointments count
    try {
      const apptsEndpoint = `${ENDPOINTS.getAppointments || ENDPOINTS.appointments}?patientId=${encodeURIComponent(activePatientId)}`;
      const aRes = await apiRequest(apptsEndpoint);
      if (aRes.upcoming) {
        setApptsCount(aRes.upcoming.length);
      } else if (Array.isArray(aRes)) {
        setApptsCount(aRes.length);
      } else {
        setApptsCount(0);
      }
    } catch {
      setApptsCount(null);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info("Logged out of MedVault");
    navigate("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/patient/dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "Medical Records",
      path: "/patient/records",
      icon: FolderLock,
      badge: recordsCount !== null ? `${recordsCount} Docs` : null,
    },
    {
      name: "Medications",
      path: "/patient/medications",
      icon: Pill,
      badge: medsCount !== null && medsCount > 0 ? `${medsCount} Active` : null,
    },
    {
      name: "Visit History",
      path: "/patient/visits",
      icon: History,
      badge: null,
    },
    {
      name: "Appointments",
      path: "/patient/appointments",
      icon: CalendarClock,
      badge: apptsCount !== null && apptsCount > 0 ? `${apptsCount} Upcoming` : null,
    },
    {
      name: "Emergency Info",
      path: "/patient/emergency",
      icon: ShieldAlert,
      badge: null,
    },
    {
      name: "AI Assistant",
      path: "/patient/assistant",
      icon: BotMessageSquare,
      badge: "AI",
      badgeColor: "bg-teal-100 text-teal-800 font-bold",
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <span className="font-extrabold text-sm tracking-tight">MV</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">MedVault</h2>
            <p className="text-[11px] font-medium text-teal-600">Patient Health Portal</p>
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

      {/* Patient Mini ID Card */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50/70 to-teal-50/70 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {user?.fullName?.[0] || user?.name?.[0] || "P"}
            </div>
            <div>
              <p className="font-semibold text-slate-800 truncate max-w-[120px]">
                {user?.fullName || user?.name || "Patient"}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {user?.patientId || user?.id || activePatientId}
              </p>
            </div>
          </div>
          {user?.bloodGroup && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-rose-200 text-rose-700 font-bold text-[11px] shadow-2xs">
              <Droplet className="w-3 h-3 text-rose-500 fill-rose-500" />
              {user.bloodGroup}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Health Management
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
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-semibold"
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
