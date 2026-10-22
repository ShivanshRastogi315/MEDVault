import { useState, useEffect } from "react";
import {
  apiRequest,
  ENDPOINTS,
  getStoredUserId,
  getStoredUserData,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AlertBanner from "../../components/common/AlertBanner";
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Droplet,
  Phone,
  User,
  HeartPulse,
  Activity,
  Lock,
  Info,
  Building2,
  FileHeart,
  ShieldCheck,
} from "lucide-react";

export default function EmergencyInfoPage() {
  const { user, userId } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
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
    fetchEmergencyData();
  }, [activePatientId]);

  const fetchEmergencyData = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = user || { id: activePatientId, patientId: activePatientId };

      // 1. Fetch patient profile
      try {
        const profRes = await apiRequest(
          `${ENDPOINTS.getPatientProfile || ENDPOINTS.patientProfile}?patientId=${encodeURIComponent(activePatientId)}`
        );
        const resolved = profRes.data || profRes.patient || profRes.profile || profRes;
        if (resolved && typeof resolved === "object") {
          data = { ...data, ...resolved };
        }
      } catch (profErr) {
        if (!profErr.isNotFound && profErr.status !== 401 && profErr.status !== 404) {
          console.warn("Emergency profile note:", profErr.message);
        }
      }

      // 2. Fetch live emergency access code
      try {
        const codeRes = await apiRequest(
          `${ENDPOINTS.getEmergencyCode || ENDPOINTS.emergencyCode}?patientId=${encodeURIComponent(activePatientId)}`
        );
        const code = codeRes.code || codeRes.emergencyCode || codeRes.data?.code;
        if (code) {
          data = { ...data, emergencyCode: code };
        }
      } catch {
        // Fallback gracefully
      }

      setProfile(data);
    } catch (err) {
      const msg = err.message || "Failed to load emergency medical information.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    setRegenerating(true);
    try {
      const res = await apiRequest(
        `${ENDPOINTS.getEmergencyCode || ENDPOINTS.emergencyCode}?patientId=${encodeURIComponent(activePatientId)}`,
        {
          method: "POST",
          body: { patientId: activePatientId },
        }
      );
      const newCode = res.emergencyCode || res.code || res.data?.emergencyCode || res.data?.code;
      if (newCode) {
        setProfile((prev) => ({
          ...prev,
          emergencyCode: newCode,
        }));
        toast.success(`Emergency Code regenerated: ${newCode}`);
      } else {
        toast.success(res.message || "Emergency code updated.");
        fetchEmergencyData();
      }
    } catch (err) {
      toast.error(err.message || "Failed to regenerate emergency access code.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!profile?.emergencyCode) return;
    navigator.clipboard.writeText(profile.emergencyCode);
    setCopiedCode(true);
    toast.success("Emergency code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text="Retrieving critical emergency health data..." />
      </div>
    );
  }

  const allergies = profile?.allergies || [];
  const chronicConditions = profile?.chronicConditions || [];
  const emergencyContact = profile?.emergencyContact || null;

  // Calculate age from DOB if available
  const calculateAge = (dobString) => {
    if (!dobString) return null;
    try {
      const birthDate = new Date(dobString);
      const diff = Date.now() - birthDate.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return null;
    }
  };

  const computedAge = calculateAge(profile?.dob) || profile?.age || "—";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            High Clinical Priority
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
          Emergency Medical Profile & Access Code
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Crucial medical data made accessible to emergency clinicians, first responders, and trauma centers.
        </p>
      </div>

      {error && (
        <AlertBanner
          type="error"
          title="Profile Fetch Error"
          message={error}
          actions={
            <button
              onClick={fetchEmergencyData}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          }
        />
      )}

      {/* Emergency Access Code Generator Box */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="w-4 h-4" />
              <span>Decentralized Emergency Token</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Instant ER Clinical Access Pass
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              In an emergency or unconscious triage, ambulance paramedics and hospital staff can enter this pass in their Hospital Portal to unlock your blood group, severe allergies, active medications, and resuscitation directives.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-300">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Access expires automatically upon hospital discharge.</span>
            </div>
          </div>

          {/* Generator Display & Actions */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-700 flex flex-col items-center gap-4 min-w-[280px]">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Active Emergency Pass
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-wider">
                {profile?.emergencyCode || "Not Generated"}
              </span>
              {profile?.emergencyCode && (
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-600 cursor-pointer"
                  title="Copy code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>

            <button
              onClick={handleRegenerateCode}
              disabled={regenerating}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin text-teal-400" : ""}`} />
              {regenerating ? "Generating New Code..." : "Regenerate Emergency Code"}
            </button>
          </div>
        </div>
      </div>

      {/* Critical Medical Alert: ALLERGIES HIGHLIGHTED IN RED */}
      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-rose-950 flex items-center gap-2">
              CRITICAL DRUG & SUBSTANCE ALLERGIES
              <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                Red Alert
              </span>
            </h3>
            <p className="text-xs text-rose-800 mt-0.5">
              Administering contraindicated medications may cause life-threatening anaphylaxis.
            </p>
          </div>
        </div>

        {allergies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allergies.map((allergy) => (
              <div
                key={allergy.id || allergy.allergen}
                className="bg-white rounded-xl border-2 border-rose-200 p-4 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <h4 className="font-extrabold text-sm text-rose-950">
                      {allergy.allergen}
                    </h4>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      {allergy.severity}
                    </span>
                  </div>
                  <p className="text-xs text-rose-900 mt-1">
                    <strong className="text-rose-950">Reaction:</strong> {allergy.reaction}
                  </p>
                </div>

                {allergy.notes && (
                  <div className="mt-3 pt-2 border-t border-rose-100 text-[11px] font-medium text-rose-700">
                    {allergy.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-rose-200 bg-white/80 text-center">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Critical Allergies Documented</h4>
            <p className="text-xs text-slate-500 mt-1">
              No known pharmacological adverse reactions or severe food allergies recorded in this health vault.
            </p>
          </div>
        )}
      </div>

      {/* Vitals, Blood Group & Chronic Conditions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blood Group & Primary Clinical Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Droplet className="w-5 h-5 fill-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Blood Group & Transfusion Compatibility
              </h3>
              <p className="text-[11px] text-slate-500">
                Validated laboratory serology confirmation
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">
                Confirmed Blood Type
              </span>
              <span className="text-3xl font-black text-rose-900 block mt-0.5">
                {profile?.bloodGroup || "—"}
              </span>
              <span className="text-[11px] text-rose-700">
                {profile?.bloodGroup ? "Recorded in Vault" : "Pending Record"}
              </span>
            </div>
            {profile?.bloodGroup && (
              <div className="text-right text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Transfusion Status:</p>
                <p className="text-xs font-mono font-bold text-rose-700">Type {profile.bloodGroup}</p>
                <p className="text-[10px] text-slate-500 mt-1">Crossmatch on admission</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block font-medium">Date of Birth:</span>
              <span className="font-bold text-slate-800">
                {profile?.dob || "—"} {computedAge !== "—" ? `(Age ${computedAge})` : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Biological Gender:</span>
              <span className="font-bold text-slate-800">{profile?.gender || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Organ Donor Status:</span>
              <span className="font-bold text-slate-700">{profile?.organDonor ? "Registered Donor" : "Not Specified"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Resuscitation Directive:</span>
              <span className="font-bold text-blue-700">{profile?.resuscitationDirective || "Standard Clinical Protocol"}</span>
            </div>
          </div>
        </div>

        {/* Chronic Health Conditions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Chronic Diagnoses & Systemic Conditions
                </h3>
                <p className="text-[11px] text-slate-500">
                  Active pre-existing conditions recorded in patient vault
                </p>
              </div>
            </div>

            {chronicConditions.length > 0 ? (
              <div className="space-y-3">
                {chronicConditions.map((cond, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{cond.condition}</h4>
                      {cond.diagnosedDate && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Diagnosed: <span className="font-mono">{cond.diagnosedDate}</span>
                        </p>
                      )}
                    </div>
                    {cond.status && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                        {cond.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <HeartPulse className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">0 Chronic Diagnoses</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No chronic systemic conditions recorded in this health passport.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Encrypted health record synchronized with MedVault Cloud.</span>
          </div>
        </div>
      </div>

      {/* Primary Emergency Contact */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Registered Emergency Contacts & Next-of-Kin
            </h3>
            <p className="text-[11px] text-slate-500">
              Immediate clinical notification recipients for emergency triage and consent
            </p>
          </div>
        </div>

        {emergencyContact?.name ? (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 text-sm">
                {emergencyContact.name}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                Primary ({emergencyContact.relationship || "Contact"})
              </span>
            </div>
            <div className="space-y-1 text-slate-700">
              <p className="flex items-center gap-2 font-medium">
                <span>Phone:</span>
                <a
                  href={`tel:${emergencyContact.phone}`}
                  className="font-bold text-blue-700 hover:underline"
                >
                  {emergencyContact.phone}
                </a>
              </p>
              {emergencyContact.altPhone && (
                <p className="flex items-center gap-2 text-slate-500">
                  <span>Alternate:</span>
                  <span>{emergencyContact.altPhone}</span>
                </p>
              )}
              {emergencyContact.address && (
                <p className="text-slate-500 text-[11px] pt-1">
                  <span>Address:</span> {emergencyContact.address}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
            <Phone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Emergency Contacts Registered</h4>
            <p className="text-xs text-slate-400 mt-1">
              Add your designated next-of-kin or emergency guardian contact information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
