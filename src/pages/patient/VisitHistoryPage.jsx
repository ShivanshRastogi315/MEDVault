import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  apiRequest,
  ENDPOINTS,
  getStoredUserId,
  getStoredUserData,
  getVisitsForPatient,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AlertBanner from "../../components/common/AlertBanner";
import {
  History,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  Stethoscope,
} from "lucide-react";

export default function VisitHistoryPage() {
  const { user, userId } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedVisits, setExpandedVisits] = useState({});
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
    fetchVisits();

    const handleUpdate = () => {
      fetchVisits();
    };
    window.addEventListener("medvault_visits_updated", handleUpdate);
    return () => window.removeEventListener("medvault_visits_updated", handleUpdate);
  }, [activePatientId]);

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `${ENDPOINTS.getPatientVisits || ENDPOINTS.visitHistory}?patientId=${encodeURIComponent(activePatientId)}`;
      const res = await apiRequest(endpoint);
      const list = Array.isArray(res) ? res : res.data || res.visits || [];
      const normalized = list.map((v, i) => ({
        ...v,
        id: v.id || v.visitId || `visit-${i + 1}`,
        hospitalName: v.hospitalName || "Medical Health System",
        reason: v.reason || "Clinical Encounter",
        date: v.date || (v.createdAt ? v.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
      }));

      const sharedVisits = getVisitsForPatient(activePatientId, user?.email);
      const combined = [...sharedVisits, ...normalized];
      const unique = combined.filter(
        (v, idx, self) => idx === self.findIndex((t) => (t.id || t.visitId) === (v.id || v.visitId))
      );

      setVisits(unique);
      if (unique.length > 0) {
        setExpandedVisits({ [unique[0].id]: true });
      }
    } catch (err) {
      const sharedVisits = getVisitsForPatient(activePatientId, user?.email);
      if (sharedVisits.length > 0) {
        setVisits(sharedVisits);
        setExpandedVisits({ [sharedVisits[0].id]: true });
      } else if (err.isNotFound || err.status === 404) {
        setVisits([]);
      } else {
        const msg = err.message || "Failed to load visit history.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (visitId) => {
    setExpandedVisits((prev) => ({
      ...prev,
      [visitId]: !prev[visitId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600" />
          Clinical Visit & Hospital History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Chronological record of inpatient admissions, emergency consultations, and specialist clinic reviews.
        </p>
      </div>

      {error && (
        <AlertBanner
          type="error"
          title="Visit History Error"
          message={error}
          actions={
            <button
              onClick={fetchVisits}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          }
        />
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" text="Loading clinical visits..." />
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">0 Visits Recorded</h3>
          <p className="text-xs text-slate-400 mt-1">
            No clinical encounters or hospital admissions found in database.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:inset-0 before:left-2.5 sm:before:left-3.5 before:w-0.5 before:bg-slate-200">
          {visits.map((visit) => {
            const isExpanded = !!expandedVisits[visit.id];

            return (
              <div key={visit.id} className="relative">
                {/* Timeline node */}
                <div className="absolute -left-6 sm:-left-8 top-5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-xs" />

                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all overflow-hidden">
                  {/* Clickable Header */}
                  <div
                    onClick={() => toggleExpand(visit.id)}
                    className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {visit.date}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {visit.status || "Completed"}
                        </span>
                        {visit.admissionType && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {visit.admissionType}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {visit.reason}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-teal-600" />
                          {visit.hospitalName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                          {visit.attendingDoctor}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        {isExpanded ? "Hide Details" : "View Clinical Details"}
                      </span>
                      <div className="p-1 rounded-lg bg-slate-100 text-slate-500">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content Area */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-4 animate-in fade-in duration-150">
                      {/* Clinical Diagnosis & Department */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Confirmed Diagnosis
                          </span>
                          <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                            {visit.diagnosis || "Clinical evaluation completed"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Department / Unit
                          </span>
                          <span className="font-medium text-slate-700 mt-0.5 block">
                            {visit.department || "General Medicine"}
                          </span>
                        </div>
                      </div>

                      {/* Treatment Summary */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Treatment & Discharge Summary
                        </h4>
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                          {visit.treatmentSummary}
                        </div>
                      </div>

                      {/* Follow-up info & related documents */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span>
                            Recommended Follow-up:{" "}
                            <strong className="text-slate-800 font-semibold">
                              {visit.followUpDate || "Routine as needed"}
                            </strong>
                          </span>
                        </div>

                        <Link
                          to="/patient/records"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Attached Lab / Imaging Records
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
