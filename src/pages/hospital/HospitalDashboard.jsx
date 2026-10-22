import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  apiRequest,
  ENDPOINTS,
  getStoredToken,
  getStoredUserId,
  getStoredUserData,
  getRegisteredUsers,
  getSharedRecords,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AlertBanner from "../../components/common/AlertBanner";
import {
  Building2,
  Users,
  BedDouble,
  FilePlus2,
  Siren,
  Search,
  Pill,
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Phone,
  MapPin,
} from "lucide-react";

export default function HospitalDashboard() {
  const { user, userId } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [liveStats, setLiveStats] = useState({
    totalPatients: 0,
    activeAdmissions: 0,
    recordsAddedToday: 0,
    emergencyAccessesToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const activeHospitalId =
    user?.hospitalId ||
    user?.id ||
    userId ||
    getStoredUserId() ||
    getStoredUserData()?.hospitalId ||
    getStoredUserData()?.id ||
    "HOSP-WA-90412";

  useEffect(() => {
    fetchHospitalData();
  }, [activeHospitalId]);

  const fetchHospitalData = async () => {
    setLoading(true);
    setError(null);

    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    let currentProfile = user || {
      id: activeHospitalId,
      hospitalId: activeHospitalId,
      hospitalName: user?.hospitalName || user?.name || "Medical Center",
    };

    // 1. Fetch Hospital Profile from AWS
    try {
      const endpoint = `${ENDPOINTS.getHospitalProfile || ENDPOINTS.hospitalProfile}?hospitalId=${encodeURIComponent(activeHospitalId)}`;
      const res = await apiRequest(endpoint);
      const resolved = res.data || res.hospital || res.profile || res;
      if (resolved && typeof resolved === "object") {
        currentProfile = { ...currentProfile, ...resolved };
      }
    } catch (err) {
      if (!err.isNotFound && err.status !== 401 && err.status !== 404) {
        console.warn("Hospital profile notice:", err.message);
      }
    }
    setHospital(currentProfile);

    // 2. Fetch live metrics from AWS endpoints & shared store
    try {
      const [patientsRes, visitsRes] = await Promise.allSettled([
        apiRequest(ENDPOINTS.searchPatient, {
          method: "POST",
          body: { query: "patient" },
        }),
        apiRequest(ENDPOINTS.visitHistory),
      ]);

      const registeredPatientCount = getRegisteredUsers().filter((u) => u.role === "patient").length + 1; // +1 for demo patient
      const apiPatientCount =
        patientsRes.status === "fulfilled" && Array.isArray(patientsRes.value)
          ? patientsRes.value.length
          : patientsRes.status === "fulfilled" && patientsRes.value?.patients
          ? patientsRes.value.patients.length
          : 0;

      const patientCount = Math.max(apiPatientCount, registeredPatientCount);

      const visitList =
        visitsRes.status === "fulfilled" && Array.isArray(visitsRes.value)
          ? visitsRes.value
          : visitsRes.status === "fulfilled" && visitsRes.value?.visits
          ? visitsRes.value.visits
          : [];

      const activeVisitsCount = visitList.filter(
        (v) => v.status === "Active" || !v.dischargeDate
      ).length;

      const sharedRecordsCount = getSharedRecords().length;

      setLiveStats({
        totalPatients: patientCount,
        activeAdmissions: activeVisitsCount,
        recordsAddedToday: sharedRecordsCount,
        emergencyAccessesToday: currentProfile.stats?.emergencyAccessesToday || 0,
      });
    } catch (statErr) {
      console.warn("Could not retrieve dynamic hospital stats:", statErr.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text="Retrieving hospital institutional profile from AWS..." />
      </div>
    );
  }

  const hospitalName =
    hospital?.hospitalName || hospital?.name || "Hospital Clinical Center";
  const regNumber =
    hospital?.registrationNumber || hospital?.hospitalId || hospital?.id || "Active Node";

  return (
    <div className="space-y-6">
      {error && (
        <AlertBanner
          type="error"
          title="Hospital Profile Notice"
          message={error}
          actions={
            <button
              onClick={fetchHospitalData}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          }
        />
      )}

      {/* Hospital Hero Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
              Healthcare Provider Node
            </span>
            <span className="text-xs text-teal-200 font-mono">
              Reg #{regNumber}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {hospitalName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-teal-100 max-w-xl">
            {hospital?.department || "Clinical Inpatient & Outpatient Department"} • Synchronized with MedVault Cloud
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-teal-200">
            {hospital?.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {hospital.address}
              </span>
            )}
            {hospital?.address && hospital?.phone && <span>•</span>}
            {hospital?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {hospital.phone}
              </span>
            )}
          </div>
        </div>

        {/* Quick Emergency Action Trigger */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
          <Link
            to="/hospital/emergency-access"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-rose-600/30"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            Fast Emergency Access
          </Link>
          <Link
            to="/hospital/patients"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Lookup Patient Vault
          </Link>
        </div>
      </div>

      {/* Summary Counts KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <Link
          to="/hospital/patients"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Treated Patients
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {liveStats.totalPatients.toLocaleString()}
            </h3>
            <p className="text-[11px] text-teal-600 mt-1 group-hover:underline flex items-center gap-1">
              Search patient directory <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <Users className="w-6 h-6" />
          </div>
        </Link>

        {/* Active Admissions */}
        <Link
          to="/hospital/visits"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Admissions
            </p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">
              {liveStats.activeAdmissions}
            </h3>
            <p className="text-[11px] text-blue-600 mt-1 group-hover:underline flex items-center gap-1">
              Manage in-patients & discharge <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <BedDouble className="w-6 h-6" />
          </div>
        </Link>

        {/* Records Added Today */}
        <Link
          to="/hospital/add-record"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Records Added Today
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {liveStats.recordsAddedToday}
            </h3>
            <p className="text-[11px] text-emerald-600 mt-1 group-hover:underline flex items-center gap-1">
              Upload new clinical document <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <FilePlus2 className="w-6 h-6" />
          </div>
        </Link>

        {/* Emergency Accesses Today */}
        <Link
          to="/hospital/emergency-access"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Emergency Accesses
            </p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">
              {liveStats.emergencyAccessesToday}
            </h3>
            <p className="text-[11px] text-rose-600 mt-1 group-hover:underline flex items-center gap-1">
              Verify emergency passcode <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Siren className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* Clinical Workflow Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          Clinical Operations Quick Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/hospital/patients"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all flex items-start gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700">
                Patient Search
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Query clinical records by MedVault ID
              </p>
            </div>
          </Link>

          <Link
            to="/hospital/add-record"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all flex items-start gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FilePlus2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                Upload Record
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Add lab reports, scans & summaries
              </p>
            </div>
          </Link>

          <Link
            to="/hospital/add-prescription"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all flex items-start gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                Add Prescription
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Prescribe medications & dosages
              </p>
            </div>
          </Link>

          <Link
            to="/hospital/visits"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all flex items-start gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <BedDouble className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                Visit Admissions
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Admit patients & generate discharge notes
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
