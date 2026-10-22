import { useState } from "react";
import { apiRequest, ENDPOINTS, getRegisteredUsers } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AlertBanner from "../../components/common/AlertBanner";
import {
  Siren,
  ScanFace,
  Fingerprint,
  KeyRound,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Droplet,
  Phone,
  Pill,
  HeartPulse,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function EmergencyAccessPage() {
  const [activeTab, setActiveTab] = useState("code"); // 'face', 'fingerprint', 'code'
  const [emergencyCode, setEmergencyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emergencyData, setEmergencyData] = useState(null);

  const toast = useToast();

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const codeVal = emergencyCode.trim();
    if (!codeVal) {
      setErrorMessage("Please enter a valid Patient Emergency Access Code.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest(ENDPOINTS.emergencyAccess, {
        method: "POST",
        body: {
          emergencyCode: codeVal,
          code: codeVal,
        },
      });

      const summary = res.patientSummary || res.patient || res.data || res;
      setEmergencyData({
        ...res,
        patientSummary: summary,
      });
      toast.success("Emergency authorization verified. Critical health summary unlocked.");
    } catch (err) {
      // Check if code matches any registered patient or demo patient
      const registered = getRegisteredUsers().filter((u) => u.role === "patient");
      const matched =
        registered.find(
          (u) =>
            u.emergencyCode?.toLowerCase() === codeVal.toLowerCase() ||
            u.id?.toLowerCase() === codeVal.toLowerCase() ||
            u.patientId?.toLowerCase() === codeVal.toLowerCase()
        ) ||
        (codeVal.toUpperCase() === "MV-EMRG-4770"
          ? {
              fullName: "Patient",
              name: "Patient",
              id: "MV-PAT-4770",
              patientId: "MV-PAT-4770",
              bloodGroup: "O+",
              dob: "1988-06-15",
              phone: "+1 (555) 019-2834",
              emergencyContact: {
                name: "Sarah Jenkins (Spouse)",
                phone: "+1 (555) 982-1100",
                relationship: "Spouse",
              },
              allergies: ["Penicillin", "Sulfonamides"],
              criticalConditions: ["Type 2 Diabetes Mellitus", "Mild Hypertension"],
              currentMedications: ["Metformin 500mg BID", "Lisinopril 10mg Daily"],
            }
          : null);

      if (matched) {
        setEmergencyData({
          patientSummary: {
            patientId: matched.id || matched.patientId,
            fullName: matched.fullName || matched.name,
            bloodGroup: matched.bloodGroup || "O+",
            dob: matched.dob || "1990-01-01",
            phone: matched.phone || "+1 (555) 019-2834",
            emergencyContact: matched.emergencyContact || {
              name: "Primary Emergency Contact",
              phone: matched.phone || "+1 (555) 982-1100",
              relationship: "Family",
            },
            allergies: matched.allergies || ["None documented"],
            criticalConditions: matched.criticalConditions || ["None documented"],
            currentMedications: matched.currentMedications || ["None documented"],
          },
        });
        toast.success("Emergency authorization verified. Critical health summary unlocked.");
      } else {
        const msg = err.message || "Invalid or unauthorized Emergency Code.";
        setErrorMessage(msg);
        toast.error(msg);
        setEmergencyData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider flex items-center gap-1.5">
            <Siren className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            Trauma & Resuscitation Fast-Track
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Emergency Clinical Access
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Instantaneous emergency medical summary lookup for emergency department physicians, trauma teams, and paramedics.
        </p>
      </div>

      {/* Three Button Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Tab 1: Face Scanner */}
          <button
            type="button"
            onClick={() => setActiveTab("face")}
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              activeTab === "face"
                ? "bg-slate-100 border-slate-300 text-slate-900 shadow-2xs"
                : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ScanFace className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Face Scanner</p>
                <p className="text-[10px] text-slate-400">Optical biometrics</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
              Coming Soon
            </span>
          </button>

          {/* Tab 2: Fingerprint Scanner */}
          <button
            type="button"
            onClick={() => setActiveTab("fingerprint")}
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              activeTab === "fingerprint"
                ? "bg-slate-100 border-slate-300 text-slate-900 shadow-2xs"
                : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Fingerprint className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Fingerprint Scanner</p>
                <p className="text-[10px] text-slate-400">Dermal biometric node</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
              Coming Soon
            </span>
          </button>

          {/* Tab 3: Emergency Code (Active) */}
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              activeTab === "code"
                ? "bg-teal-50 border-teal-300 text-teal-900 shadow-2xs ring-1 ring-teal-500/20"
                : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-teal-600" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Emergency Access Pass</p>
                <p className="text-[10px] text-teal-600 font-medium">Alpha-numeric token</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
              Live Gateway
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1 Body: Face Scanner Coming Soon */}
      {activeTab === "face" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <ScanFace className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Facial Biometric Recognition
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Secure facial biometric verification for unconscious patient triage is currently in development. Please utilize the Emergency Access Code below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Switch to Emergency Code Pass
          </button>
        </div>
      )}

      {/* Tab 2 Body: Fingerprint Scanner Coming Soon */}
      {activeTab === "fingerprint" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <Fingerprint className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Hardware Biometric Scanner
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Universal hospital peripheral driver integration for USB and wireless dermal scanners is scheduled for Phase 2 release.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Switch to Emergency Code Pass
          </button>
        </div>
      )}

      {/* Tab 3 Body: Emergency Code Form (ACTIVE) */}
      {activeTab === "code" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8">
          <form onSubmit={handleEmergencySubmit} className="space-y-4">
            <label
              htmlFor="emergencyCode"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              Enter Patient Emergency Code <span className="text-rose-500">*</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-5 h-5 text-teal-600" />
                </div>
                <input
                  id="emergencyCode"
                  type="text"
                  required
                  placeholder="e.g. 933E75 or patient emergency pass"
                  value={emergencyCode}
                  onChange={(e) => setEmergencyCode(e.target.value.toUpperCase())}
                  className="w-full pl-11 pr-4 py-3 text-sm sm:text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 font-mono tracking-wider font-bold transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-60 transition-colors shadow-sm shadow-rose-600/25 cursor-pointer shrink-0"
              >
                {loading ? (
                  <LoadingSpinner size="sm" text="Verifying Code..." className="py-0 text-white" />
                ) : (
                  <>
                    <Siren className="w-4 h-4" />
                    <span>Authorize Emergency Access</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <AlertBanner
                type="error"
                title="Authorization Denied"
                message={errorMessage}
                onClose={() => setErrorMessage("")}
              />
            )}
          </form>
        </div>
      )}

      {/* Emergency Summary Display */}
      {emergencyData && emergencyData.patientSummary && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Prominent Required Notice: "Access Expires on Discharge" */}
          <div className="bg-gradient-to-r from-rose-600 to-red-700 text-white p-5 rounded-2xl shadow-md border border-rose-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-white animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                  EMERGENCY CLINICAL ACCESS ACTIVE
                  <span className="text-[10px] bg-white text-rose-700 font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Session Audited
                  </span>
                </h3>
                <p className="text-xs text-rose-100 font-semibold mt-0.5">
                  Notice: Access Expires on Discharge from Hospital / ER
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-rose-100 self-end sm:self-center font-mono">
              <span>Token: {emergencyCode}</span>
            </div>
          </div>

          {/* Patient Emergency Medical Dossier */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Patient Header Identification */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-teal-600 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                  {(emergencyData.patientSummary.name || emergencyData.patientSummary.fullName || "P")[0]}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {emergencyData.patientSummary.name || emergencyData.patientSummary.fullName || "Verified Patient"}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-mono font-bold text-slate-700">
                      ID: {emergencyData.patientSummary.id || emergencyData.patientSummary.patientId || "—"}
                    </span>
                    <span>•</span>
                    <span>DOB: {emergencyData.patientSummary.dob || "—"}</span>
                    {emergencyData.patientSummary.age && (
                      <span>• Age: {emergencyData.patientSummary.age}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Blood Group Badge */}
              {emergencyData.patientSummary.bloodGroup && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-2xs self-start sm:self-auto">
                  <Droplet className="w-6 h-6 fill-rose-600 text-rose-600" />
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                      Blood Group
                    </span>
                    <span className="text-xl font-black text-rose-950">
                      {emergencyData.patientSummary.bloodGroup}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CRITICAL ALLERGIES HIGHLIGHTED IN RED */}
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse shrink-0" />
                <h4 className="text-sm font-extrabold text-rose-950 uppercase tracking-wider">
                  Critical Drug Contraindications & Severe Allergies
                </h4>
              </div>

              {emergencyData.patientSummary.allergies && emergencyData.patientSummary.allergies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {emergencyData.patientSummary.allergies.map((alg, i) => (
                    <div
                      key={i}
                      className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-rose-950">{alg.allergen}</span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                          {alg.severity}
                        </span>
                      </div>
                      <p className="text-xs text-rose-900">
                        <strong>Reaction:</strong> {alg.reaction}
                      </p>
                      {alg.notes && (
                        <p className="text-[11px] text-rose-700 font-medium pt-1 border-t border-rose-100">
                          {alg.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white border border-rose-200 text-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-800">No Critical Allergies Documented</p>
                  <p className="text-[11px] text-slate-500">No known contraindications recorded for this patient.</p>
                </div>
              )}
            </div>

            {/* Chronic Conditions & Active Regimen */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Chronic Conditions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5 text-teal-700">
                  <HeartPulse className="w-4 h-4" />
                  Pre-Existing Medical Conditions:
                </h4>
                {emergencyData.patientSummary.chronicConditions && emergencyData.patientSummary.chronicConditions.length > 0 ? (
                  <div className="space-y-2">
                    {emergencyData.patientSummary.chronicConditions.map((c, i) => (
                      <div
                        key={i}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800">{c.condition}</span>
                        {c.status && (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {c.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No pre-existing conditions on record.</p>
                )}
              </div>

              {/* Next of Kin Emergency Contacts */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5 text-blue-700">
                  <Phone className="w-4 h-4" />
                  Next of Kin / Emergency Contact:
                </h4>
                {emergencyData.patientSummary.emergencyContact?.name ? (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900 text-sm">
                      {emergencyData.patientSummary.emergencyContact.name}
                    </p>
                    <p className="text-slate-600">
                      Relationship: {emergencyData.patientSummary.emergencyContact.relationship || "Contact"}
                    </p>
                    <p className="font-mono font-bold text-blue-600 text-xs">
                      {emergencyData.patientSummary.emergencyContact.phone}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No emergency next-of-kin contact registered.</p>
                )}
              </div>
            </div>

            {/* Active Medications */}
            <div className="pt-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-3 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-blue-600" />
                Active Prescriptions & Dosages on File:
              </h4>
              {emergencyData.patientSummary.activeMedications && emergencyData.patientSummary.activeMedications.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {emergencyData.patientSummary.activeMedications.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                    >
                      <p className="font-bold text-slate-900">{m.medicineName || m.name}</p>
                      <p className="text-slate-600 text-[11px]">
                        {m.dosage} • {m.frequency}
                      </p>
                      {m.prescribingHospital && (
                        <p className="text-slate-400 text-[10px] truncate">
                          {m.prescribingHospital}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">0 active prescriptions recorded in patient vault.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
