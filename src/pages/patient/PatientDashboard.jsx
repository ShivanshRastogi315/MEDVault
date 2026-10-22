import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  apiRequest,
  ENDPOINTS,
  getStoredToken,
  getStoredUserId,
  getStoredUserData,
  getRecordsForPatient,
  getPrescriptionsForPatient,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AlertBanner from "../../components/common/AlertBanner";
import {
  User,
  Droplet,
  Pill,
  FolderLock,
  CalendarClock,
  ShieldAlert,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  Phone,
  Clock,
  FileText,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function PatientDashboard() {
  const { user, userId } = useAuth();
  const [profile, setProfile] = useState(null);
  const [medications, setMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

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
    fetchDashboardData();

    const handleUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener("medvault_records_updated", handleUpdate);
    window.addEventListener("medvault_prescriptions_updated", handleUpdate);
    return () => {
      window.removeEventListener("medvault_records_updated", handleUpdate);
      window.removeEventListener("medvault_prescriptions_updated", handleUpdate);
    };
  }, [activePatientId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Profile
      let patientData = user || {
        id: activePatientId,
        patientId: activePatientId,
        name: user?.fullName || user?.name || "Patient",
      };

      try {
        const profRes = await apiRequest(
          `${ENDPOINTS.getPatientProfile || ENDPOINTS.patientProfile}?patientId=${encodeURIComponent(activePatientId)}`
        );
        const resolved = profRes.data || profRes.patient || profRes.profile || profRes;
        if (resolved && typeof resolved === "object") {
          patientData = { ...patientData, ...resolved };
        }
      } catch (profErr) {
        // Handle 404/not found gracefully without throwing red network banners
        if (!profErr.isNotFound && profErr.status !== 401 && profErr.status !== 404) {
          console.warn("Patient profile notice:", profErr.message);
        }
      }

      // 2. Fetch Emergency Code if not in profile
      if (!patientData.emergencyCode) {
        try {
          const codeRes = await apiRequest(
            `${ENDPOINTS.getEmergencyCode || ENDPOINTS.emergencyCode}?patientId=${encodeURIComponent(activePatientId)}`
          );
          const resolvedCode = codeRes.code || codeRes.emergencyCode || codeRes.data?.code;
          if (resolvedCode) {
            patientData.emergencyCode = resolvedCode;
          }
        } catch {
          // Graceful fallback
        }
      }
      setProfile(patientData);

      // 3. Fetch Medications
      try {
        const medsRes = await apiRequest(
          `${ENDPOINTS.getPatientMedications || ENDPOINTS.currentMedications}?patientId=${encodeURIComponent(activePatientId)}`
        );
        let apiMedsList = [];
        if (medsRes.active || medsRes.past) {
          apiMedsList = [
            ...(medsRes.active || []).map((m) => ({ ...m, status: m.status || "Active" })),
            ...(medsRes.past || []).map((m) => ({ ...m, status: m.status || "Discontinued" })),
          ];
        } else if (Array.isArray(medsRes)) {
          apiMedsList = medsRes;
        } else {
          apiMedsList = medsRes.data || medsRes.medications || [];
        }

        const sharedMeds = getPrescriptionsForPatient(activePatientId, user?.email);
        const combinedMeds = [...sharedMeds, ...apiMedsList];
        const uniqueMeds = combinedMeds.filter(
          (m, idx, self) => idx === self.findIndex((t) => (t.medicationId || t.id) === (m.medicationId || m.id))
        );
        setMedications(uniqueMeds);
      } catch {
        setMedications(getPrescriptionsForPatient(activePatientId, user?.email));
      }

      // 4. Fetch Appointments
      try {
        const apptsRes = await apiRequest(
          `${ENDPOINTS.getAppointments || ENDPOINTS.appointments}?patientId=${encodeURIComponent(activePatientId)}`
        );
        let apptsList = [];
        if (apptsRes.upcoming || apptsRes.past) {
          apptsList = [
            ...(apptsRes.upcoming || []).map((a) => ({ ...a, status: a.status || "Upcoming" })),
            ...(apptsRes.past || []).map((a) => ({ ...a, status: a.status || "Completed" })),
          ];
        } else if (Array.isArray(apptsRes)) {
          apptsList = apptsRes;
        } else {
          apptsList = apptsRes.data || apptsRes.appointments || [];
        }
        setAppointments(apptsList);
      } catch {
        setAppointments([]);
      }

      // 5. Fetch Medical Records
      try {
        const recsRes = await apiRequest(
          `${ENDPOINTS.getPatientRecords || ENDPOINTS.medicalRecords}?patientId=${encodeURIComponent(activePatientId)}`
        );
        const apiRecsList = Array.isArray(recsRes) ? recsRes : recsRes.data || recsRes.records || [];
        const sharedRecs = getRecordsForPatient(activePatientId, user?.email, user?.fullName || user?.name);
        let localRecs = [];
        try {
          localRecs = JSON.parse(localStorage.getItem(`medvault_patient_records_${activePatientId}`) || "[]");
        } catch {}

        const combinedRecs = [...sharedRecs, ...localRecs, ...apiRecsList];
        const uniqueRecs = combinedRecs.filter(
          (r, idx, self) => idx === self.findIndex((t) => (t.recordId || t.id) === (r.recordId || r.id))
        );

        setRecords(uniqueRecs);
        localStorage.setItem("medvault_patient_records_count", uniqueRecs.length.toString());
      } catch {
        const sharedRecs = getRecordsForPatient(activePatientId, user?.email, user?.fullName || user?.name);
        setRecords(sharedRecs);
      }
    } catch (err) {
      console.warn("Dashboard sync notice:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmergencyCode = () => {
    if (!profile?.emergencyCode) return;
    navigator.clipboard.writeText(profile.emergencyCode);
    setCopiedCode(true);
    toast.success("Emergency access code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text="Retrieving patient clinical profile from AWS..." />
      </div>
    );
  }

  const activeMedications = Array.isArray(medications)
    ? medications.filter((m) => m?.status === "Active")
    : [];
  const nextAppointment =
    Array.isArray(appointments) && appointments.length > 0 ? appointments[0] : null;

  const displayName = profile?.fullName || profile?.name || "Patient";
  const displayId = profile?.patientId || profile?.id || activePatientId;
  const allergiesList = profile?.allergies || [];
  const chronicList = profile?.chronicConditions || [];
  const emergencyContact = profile?.emergencyContact || null;

  return (
    <div className="space-y-6">
      {error && (
        <AlertBanner
          type="error"
          title="Network Notice"
          message={error}
          actions={
            <button
              onClick={fetchDashboardData}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          }
        />
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
              Personal Vault
            </span>
            <span className="text-xs text-blue-100 font-mono">
              ID: {displayId}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-blue-100 max-w-xl">
            Your encrypted health passport is active on AWS Cloud. Authorized medical providers can securely access your records using your verification code during emergency triage.
          </p>
        </div>

        {/* Emergency Code Quick Card in Welcome Banner */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 w-full sm:w-auto min-w-[220px]">
          <div className="flex items-center justify-between gap-2 text-xs text-blue-100 mb-1.5">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              Emergency Access Code
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 bg-slate-900/40 px-3 py-2 rounded-lg border border-white/10">
            <span className="font-mono text-base font-bold tracking-wider text-emerald-300">
              {profile?.emergencyCode || "Not Generated"}
            </span>
            {profile?.emergencyCode && (
              <button
                onClick={handleCopyEmergencyCode}
                className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white cursor-pointer"
                title="Copy code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          <p className="text-[10px] text-blue-200 mt-1.5">
            Paramedics can unlock critical emergency data with this code.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Group */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Blood Type
            </p>
            <h3 className="text-2xl font-black text-rose-600 mt-1 flex items-baseline gap-1">
              {profile?.bloodGroup || "—"}
              {profile?.bloodGroup && (
                <span className="text-xs font-normal text-slate-400">Validated</span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {profile?.bloodGroup ? "Serology Recorded" : "Pending Serology Record"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Droplet className="w-6 h-6 fill-rose-500 text-rose-500" />
          </div>
        </div>

        {/* Active Medications */}
        <Link
          to="/patient/medications"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Prescriptions
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {activeMedications.length}
            </h3>
            <p className="text-[11px] text-blue-600 mt-1 group-hover:underline flex items-center gap-1">
              View daily schedule <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Pill className="w-6 h-6" />
          </div>
        </Link>

        {/* Medical Records */}
        <Link
          to="/patient/records"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Clinical Documents
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {records.length}
            </h3>
            <p className="text-[11px] text-teal-600 mt-1 group-hover:underline flex items-center gap-1">
              Browse uploaded records <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <FolderLock className="w-6 h-6" />
          </div>
        </Link>

        {/* Upcoming Appointments */}
        <Link
          to="/patient/appointments"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Appointments
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {appointments.length}
            </h3>
            <p className="text-[11px] text-purple-600 mt-1 group-hover:underline flex items-center gap-1">
              Next: {nextAppointment?.date || "None scheduled"} <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <CalendarClock className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* Critical Medical Info Section: Allergies & Emergency Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Known Allergies */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Known Drug & Food Allergies
                </h3>
                <p className="text-[11px] text-slate-500">
                  Critical medical alerts flagged for healthcare providers
                </p>
              </div>
            </div>
            <Link
              to="/patient/emergency"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
            >
              Full Emergency File <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {allergiesList.length > 0 ? (
            <div className="space-y-3">
              {allergiesList.map((allergy) => (
                <div
                  key={allergy.id || allergy.allergen}
                  className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-ping" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-rose-950">
                          {allergy.allergen}
                        </h4>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                          {allergy.severity}
                        </span>
                      </div>
                      <p className="text-xs text-rose-800 mt-0.5">
                        <span className="font-semibold">Reaction:</span> {allergy.reaction}
                      </p>
                    </div>
                  </div>
                  {allergy.notes && (
                    <span className="text-xs font-medium text-rose-700 bg-white/70 px-2.5 py-1 rounded-lg border border-rose-200 self-start sm:self-center">
                      {allergy.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No known drug or food allergies on record</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No adverse pharmacological reactions have been registered in your health passport.
              </p>
            </div>
          )}

          {/* Chronic Conditions */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Chronic Clinical Diagnoses:
            </h4>
            {chronicList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {chronicList.map((cond, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>{cond.condition}</span>
                    {cond.status && <span className="text-[10px] text-slate-400">({cond.status})</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No chronic medical conditions recorded.</p>
            )}
          </div>
        </div>

        {/* Emergency Contact & Vital Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Emergency Contact
                </h3>
                <p className="text-[11px] text-slate-500">
                  Designated next-of-kin for clinical notification
                </p>
              </div>
            </div>

            {emergencyContact?.name ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Full Name:</span>
                  <span className="text-xs font-bold text-slate-900">
                    {emergencyContact.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Relationship:</span>
                  <span className="text-xs font-medium text-slate-800">
                    {emergencyContact.relationship || "Contact"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Primary Phone:</span>
                  <a
                    href={`tel:${emergencyContact.phone}`}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    {emergencyContact.phone}
                  </a>
                </div>
                {emergencyContact.address && (
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-tight">
                    <span className="font-medium text-slate-600">Address:</span>{" "}
                    {emergencyContact.address}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
                <Phone className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">No emergency contact registered</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Register your next-of-kin details under Emergency Info.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              to="/patient/emergency"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Manage Emergency Access Pass
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Current Active Meds & Next Appointment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Meds Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-600" />
              Current Active Regimen
            </h3>
            <Link
              to="/patient/medications"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              All Medications ({medications.length}) <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {activeMedications.length > 0 ? (
            <div className="space-y-3">
              {activeMedications.slice(0, 3).map((med, idx) => (
                <div
                  key={med.id || idx}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{med.medicineName || med.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      {med.dosage} • {med.frequency}
                    </p>
                  </div>
                  {med.timings && (
                    <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">
                      {med.timings.morning && <span className="text-amber-600">M</span>}
                      {med.timings.afternoon && <span className="text-blue-600">A</span>}
                      {med.timings.night && <span className="text-purple-600">N</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <Pill className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">0 Active Prescriptions</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No current pharmaceutical courses recorded in your chart.
              </p>
            </div>
          )}
        </div>

        {/* Upcoming Appointment Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-purple-600" />
                Next Clinical Appointment
              </h3>
              <Link
                to="/patient/appointments"
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
              >
                Schedule / Details <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {nextAppointment ? (
              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-950">
                    {nextAppointment.department || "Consultation"}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                    {nextAppointment.status || "Upcoming"}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-800">
                  {nextAppointment.reason || "Routine Clinical Review"}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    {nextAppointment.date} {nextAppointment.time ? `at ${nextAppointment.time}` : ""}
                  </span>
                  {nextAppointment.doctorName && <span>{nextAppointment.doctorName}</span>}
                </div>
                {nextAppointment.hospitalName && (
                  <p className="text-[10px] text-slate-400">{nextAppointment.hospitalName}</p>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <CalendarClock className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">0 Scheduled Appointments</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No upcoming outpatient or specialist consultations booked.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Need to schedule a follow-up?</span>
            <Link
              to="/patient/appointments"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Book Follow-up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
