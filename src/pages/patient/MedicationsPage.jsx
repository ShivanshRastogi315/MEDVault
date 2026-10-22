import { useState, useEffect } from "react";
import {
  apiRequest,
  ENDPOINTS,
  getStoredUserId,
  getStoredUserData,
  getPrescriptionsForPatient,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AlertBanner from "../../components/common/AlertBanner";
import {
  Pill,
  LayoutGrid,
  List,
  Calendar,
  Building2,
  Clock,
  Sun,
  Moon,
  Sunset,
  AlertCircle,
  CheckCircle2,
  Filter,
} from "lucide-react";

export default function MedicationsPage() {
  const { user, userId } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // 'card' or 'table'
  const [statusFilter, setStatusFilter] = useState("Active"); // 'Active', 'Discontinued', 'All'

  const toast = useToast();

  const activePatientId =
    user?.patientId ||
    user?.id ||
    userId ||
    getStoredUserId() ||
    getStoredUserData()?.patientId ||
    getStoredUserData()?.id ||
    "MV-PAT-4770";

  useEffect(() => {
    fetchMedications();

    const handleUpdate = () => {
      fetchMedications();
    };
    window.addEventListener("medvault_prescriptions_updated", handleUpdate);
    return () => window.removeEventListener("medvault_prescriptions_updated", handleUpdate);
  }, [activePatientId]);

  const fetchMedications = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `${ENDPOINTS.getPatientMedications || ENDPOINTS.currentMedications}?patientId=${encodeURIComponent(activePatientId)}`;
      const res = await apiRequest(endpoint);
      let list = [];
      if (res.active || res.past) {
        list = [
          ...(res.active || []).map((m, idx) => ({ ...m, id: m.id || m.medicationId || `med-act-${idx}`, status: m.status || "Active" })),
          ...(res.past || []).map((m, idx) => ({ ...m, id: m.id || m.medicationId || `med-pst-${idx}`, status: m.status || "Discontinued" })),
        ];
      } else if (Array.isArray(res)) {
        list = res;
      } else {
        list = res.data || res.medications || [];
      }

      // Merge with shared prescriptions
      const sharedMeds = getPrescriptionsForPatient(activePatientId, user?.email);
      const combined = [...sharedMeds, ...list];
      const unique = combined.filter(
        (m, idx, self) =>
          idx === self.findIndex((t) => (t.medicationId || t.id) === (m.medicationId || m.id))
      );

      setMedications(unique);
    } catch (err) {
      const sharedMeds = getPrescriptionsForPatient(activePatientId, user?.email);
      if (sharedMeds.length > 0) {
        setMedications(sharedMeds);
      } else if (err.isNotFound || err.status === 404) {
        setMedications([]);
      } else {
        const msg = err.message || "Failed to retrieve medications.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const list = Array.isArray(medications) ? medications : [];
  const filteredMeds = list.filter((m) => {
    if (statusFilter === "All") return true;
    return m?.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-6 h-6 text-blue-600" />
            Medications & Prescriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Current pharmaceutical regimen, dosage administration schedule, and historical medications.
          </p>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex items-center gap-3">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("Active")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "Active"
                  ? "bg-white text-blue-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active ({medications.filter((m) => m.status === "Active").length})
            </button>
            <button
              onClick={() => setStatusFilter("Discontinued")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "Discontinued"
                  ? "bg-white text-slate-800 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Discontinued ({medications.filter((m) => m.status === "Discontinued").length})
            </button>
            <button
              onClick={() => setStatusFilter("All")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "All"
                  ? "bg-white text-slate-800 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({medications.length})
            </button>
          </div>

          {/* Table vs Card switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "card"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Card View"
              aria-label="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <AlertBanner
          type="error"
          title="Medication Data Error"
          message={error}
          actions={
            <button
              onClick={fetchMedications}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          }
        />
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" text="Loading prescription records..." />
        </div>
      ) : filteredMeds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">
            {medications.length === 0 ? "0 Prescriptions Recorded" : "No medications found"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {medications.length === 0
              ? "There are currently 0 active or historical pharmaceutical courses in your database chart."
              : `No records match the current status filter (${statusFilter}).`}
          </p>
        </div>
      ) : viewMode === "card" ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeds.map((med) => {
            const isActive = med.status === "Active";
            return (
              <div
                key={med.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-2xs ${
                  isActive
                    ? "border-slate-200 hover:border-blue-300 hover:shadow-xs"
                    : "border-slate-200/60 bg-slate-50/50 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {med.status}
                    </span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {med.dosage}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {med.medicineName}
                  </h3>

                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    Frequency: <span className="font-normal">{med.frequency}</span>
                  </p>

                  {/* Timings Badges */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-400 mr-1">Timings:</span>
                    <span
                      className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        med.timings?.morning
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-slate-50 text-slate-400 border-slate-100 opacity-50"
                      }`}
                    >
                      <Sun className="w-3 h-3 text-amber-500" /> Morning
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        med.timings?.afternoon
                          ? "bg-sky-50 text-sky-800 border-sky-200"
                          : "bg-slate-50 text-slate-400 border-slate-100 opacity-50"
                      }`}
                    >
                      <Sunset className="w-3 h-3 text-sky-500" /> Noon
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        med.timings?.night
                          ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                          : "bg-slate-50 text-slate-400 border-slate-100 opacity-50"
                      }`}
                    >
                      <Moon className="w-3 h-3 text-indigo-500" /> Night
                    </span>
                  </div>

                  {/* Instructions */}
                  {med.instructions && (
                    <div className="mt-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-700">Instructions:</span> {med.instructions}
                    </div>
                  )}

                  {med.discontinueReason && (
                    <div className="mt-2 text-xs bg-rose-50/70 p-2 rounded-xl border border-rose-100 text-rose-700">
                      <span className="font-semibold">Discontinued Reason:</span> {med.discontinueReason}
                    </div>
                  )}
                </div>

                {/* Footer Dates & Hospital */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Duration:</span>
                    <span className="font-medium text-slate-700 font-mono">
                      {med.startDate} → {med.endDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Prescribed by:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[170px]">
                      {med.prescribingHospital}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Medicine & Dosage</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Daily Timings</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Prescribing Provider</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredMeds.map((med) => {
                  const isActive = med.status === "Active";
                  return (
                    <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{med.medicineName}</span>
                        <span className="text-[11px] text-blue-700 font-semibold">{med.dosage}</span>
                      </td>
                      <td className="py-3 px-4 font-medium">{med.frequency}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[10px] font-semibold">
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              med.timings?.morning ? "bg-amber-100 text-amber-800" : "text-slate-300"
                            }`}
                          >
                            M
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              med.timings?.afternoon ? "bg-sky-100 text-sky-800" : "text-slate-300"
                            }`}
                          >
                            A
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              med.timings?.night ? "bg-indigo-100 text-indigo-800" : "text-slate-300"
                            }`}
                          >
                            N
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {med.startDate} → {med.endDate}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 block truncate max-w-[150px]">
                          {med.prescribingHospital}
                        </span>
                        <span className="text-[10px] text-slate-400">{med.prescribingDoctor}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {med.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
