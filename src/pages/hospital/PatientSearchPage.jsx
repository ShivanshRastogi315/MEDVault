import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  apiRequest,
  ENDPOINTS,
  getRegisteredUsers,
  getRecordsForPatient,
  getPrescriptionsForPatient,
  getVisitsForPatient,
} from "../../services/api";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AlertBanner from "../../components/common/AlertBanner";
import {
  Search,
  User,
  Droplet,
  Phone,
  FolderLock,
  Pill,
  History,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  Calendar,
  AlertTriangle,
  X,
  Building2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function PatientSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [patientMeds, setPatientMeds] = useState([]);
  const [patientVisits, setPatientVisits] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const toast = useToast();

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const q = searchQuery.trim().toLowerCase();

    // Default registered patients
    const demoPatient = {
      id: "MV-PAT-4770",
      patientId: "MV-PAT-4770",
      fullName: "Patient (Demo)",
      name: "Patient",
      email: "patient@medvault.io",
      bloodGroup: "O+",
      dob: "1988-06-15",
      phone: "+1 (555) 019-2834",
      emergencyCode: "MV-EMRG-4770",
      role: "patient",
    };

    const localPatients = [
      demoPatient,
      ...getRegisteredUsers().filter((u) => u.role === "patient"),
    ];

    let apiPatients = [];
    if (q) {
      try {
        const res = await apiRequest(ENDPOINTS.searchPatient, {
          method: "POST",
          body: { query: q },
        });
        apiPatients = Array.isArray(res) ? res : res.data || res.patients || [];
      } catch (err) {
        if (!err.isNotFound && err.status !== 404) {
          console.warn("API patient search notice:", err.message);
        }
      }
    }

    const filteredLocal = localPatients.filter((p) => {
      if (!q) return true;
      const name = (p.fullName || p.name || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      const id = (p.id || p.patientId || "").toLowerCase();
      const phone = (p.phone || "").toLowerCase();
      return name.includes(q) || email.includes(q) || id.includes(q) || phone.includes(q);
    });

    const combined = [...apiPatients, ...filteredLocal];
    const unique = combined.filter(
      (p, idx, self) =>
        idx ===
        self.findIndex(
          (t) =>
            (t.id || t.patientId) === (p.id || p.patientId) ||
            (t.email && p.email && t.email.toLowerCase() === p.email.toLowerCase())
        )
    );

    setPatients(unique);
    if (
      selectedPatient &&
      !unique.some((p) => (p.id || p.patientId) === (selectedPatient.id || selectedPatient.patientId))
    ) {
      setSelectedPatient(null);
    }
    setLoading(false);
  };

  const handleSelectPatient = async (patient) => {
    const pId = patient.id || patient.patientId;
    const selectedId = selectedPatient?.id || selectedPatient?.patientId;

    if (selectedId === pId) {
      setSelectedPatient(null);
      return;
    }

    setSelectedPatient(patient);
    setDetailsLoading(true);
    try {
      const [recsRes, medsRes, visitsRes] = await Promise.allSettled([
        apiRequest(`${ENDPOINTS.getPatientRecords || ENDPOINTS.medicalRecords}?patientId=${encodeURIComponent(pId)}`),
        apiRequest(`${ENDPOINTS.getPatientMedications || ENDPOINTS.currentMedications}?patientId=${encodeURIComponent(pId)}`),
        apiRequest(`${ENDPOINTS.getPatientVisits || ENDPOINTS.visitHistory}?patientId=${encodeURIComponent(pId)}`),
      ]);

      const apiRecs =
        recsRes.status === "fulfilled"
          ? Array.isArray(recsRes.value)
            ? recsRes.value
            : recsRes.value?.data || recsRes.value?.records || []
          : [];

      const sharedRecs = getRecordsForPatient(pId, patient.email, patient.fullName || patient.name);
      const combinedRecs = [...sharedRecs, ...apiRecs];
      const uniqueRecs = combinedRecs.filter(
        (r, idx, self) => idx === self.findIndex((t) => (t.recordId || t.id) === (r.recordId || r.id))
      );

      let apiMeds = [];
      if (medsRes.status === "fulfilled") {
        const mv = medsRes.value;
        if (mv?.active || mv?.past) {
          apiMeds = [
            ...(mv.active || []).map((m) => ({ ...m, status: m.status || "Active" })),
            ...(mv.past || []).map((m) => ({ ...m, status: m.status || "Discontinued" })),
          ];
        } else if (Array.isArray(mv)) {
          apiMeds = mv;
        } else {
          apiMeds = mv?.data || mv?.medications || [];
        }
      }

      const sharedMeds = getPrescriptionsForPatient(pId, patient.email);
      const combinedMeds = [...sharedMeds, ...apiMeds];
      const uniqueMeds = combinedMeds.filter(
        (m, idx, self) =>
          idx === self.findIndex((t) => (t.medicationId || t.id) === (m.medicationId || m.id))
      );

      const apiVisits =
        visitsRes.status === "fulfilled"
          ? Array.isArray(visitsRes.value)
            ? visitsRes.value
            : visitsRes.value?.data || visitsRes.value?.visits || []
          : [];

      const sharedVisits = getVisitsForPatient(pId, patient.email);
      const combinedVisits = [...sharedVisits, ...apiVisits];
      const uniqueVisits = combinedVisits.filter(
        (v, idx, self) => idx === self.findIndex((t) => (t.visitId || t.id) === (v.visitId || v.id))
      );

      setPatientRecords(uniqueRecs);
      setPatientMeds(uniqueMeds);
      setPatientVisits(uniqueVisits);
    } catch {
      setPatientRecords(getRecordsForPatient(pId, patient.email, patient.fullName || patient.name));
      setPatientMeds(getPrescriptionsForPatient(pId, patient.email));
      setPatientVisits(getVisitsForPatient(pId, patient.email));
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-teal-600" />
          Patient Records & Identity Search
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Search authorized patients across the decentralized network by Name, MedVault ID, or Phone number.
        </p>
      </div>

      {/* Top Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-teal-600" />
            </div>
            <input
              type="text"
              placeholder="Search by Patient Name or MedVault ID (e.g., MV-PAT-4770)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 font-medium transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  handleSearch();
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-60 transition-colors shadow-2xs cursor-pointer"
          >
            {loading ? (
              <LoadingSpinner size="sm" text="Searching AWS..." className="py-0 text-white" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Execute Search</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <AlertBanner
          type="error"
          title="Search Failed"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Results List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" text="Querying decentralized patient vaults from AWS..." />
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">0 Patients Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery
              ? `No patient records in the database match "${searchQuery}".`
              : "No patient records currently found in database. Newly registered patients will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Found <strong className="text-slate-800">{patients.length}</strong> matching patient profiles:
            </span>
            <span>Click any patient to expand full clinical dossier</span>
          </div>

          {patients.map((patient) => {
            const pId = patient.id || patient.patientId;
            const pName = patient.fullName || patient.name || "Patient";
            const isSelected = (selectedPatient?.id || selectedPatient?.patientId) === pId;

            return (
              <div
                key={pId}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isSelected
                    ? "border-teal-500 shadow-md ring-1 ring-teal-500/20"
                    : "border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                {/* Patient Summary Header Row (Clickable) */}
                <div
                  onClick={() => handleSelectPatient(patient)}
                  className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
                      {pName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{pName}</h3>
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {pId}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>DOB: {patient.dob || "—"}</span>
                        <span>•</span>
                        <span>Gender: {patient.gender || "—"}</span>
                        <span>•</span>
                        <span>Phone: {patient.phone || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {patient.bloodGroup && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                        <Droplet className="w-3.5 h-3.5 fill-rose-600" />
                        <span>Blood: {patient.bloodGroup}</span>
                      </div>
                    )}

                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                      {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Complete Clinical Dossier */}
                {isSelected && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-6 space-y-6 animate-in fade-in duration-150">
                    {detailsLoading ? (
                      <div className="py-6 flex justify-center">
                        <LoadingSpinner size="md" text="Loading complete clinical history from AWS..." />
                      </div>
                    ) : (
                      <>
                        {/* Quick Clinical Alert Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Allergies Alert */}
                          <div className="lg:col-span-2 bg-rose-50 border border-rose-200 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              Recorded Drug & Environmental Allergies:
                            </h4>
                            {patient.allergies && patient.allergies.length > 0 ? (
                              <div className="space-y-2">
                                {patient.allergies.map((alg, i) => (
                                  <div
                                    key={i}
                                    className="bg-white p-2.5 rounded-lg border border-rose-200 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <span className="font-bold text-rose-950">{alg.allergen}</span>
                                      <span className="text-rose-700 ml-2">Reaction: {alg.reaction}</span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                                      {alg.severity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-rose-800 italic">No known drug allergies recorded for this patient.</p>
                            )}
                          </div>

                          {/* Emergency Contact */}
                          <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-teal-700">
                              <Phone className="w-3.5 h-3.5" />
                              Next of Kin Contact:
                            </h4>
                            {patient.emergencyContact?.name ? (
                              <>
                                <p className="font-bold text-slate-800 text-sm">
                                  {patient.emergencyContact.name}
                                </p>
                                <p className="text-slate-600">
                                  Relationship: {patient.emergencyContact.relationship || "Contact"}
                                </p>
                                <p className="text-blue-600 font-semibold font-mono">
                                  {patient.emergencyContact.phone}
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No emergency next-of-kin contact on file.</p>
                            )}
                          </div>
                        </div>

                        {/* Prescriptions & Medications for this Patient */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              <Pill className="w-4 h-4 text-blue-600" />
                              Active Medications ({patientMeds.filter((m) => m.status === "Active").length})
                            </h4>
                            <Link
                              to="/hospital/add-prescription"
                              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
                            >
                              <FilePlus2 className="w-3.5 h-3.5" />
                              Prescribe New
                            </Link>
                          </div>
                          {patientMeds.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {patientMeds.slice(0, 4).map((med, idx) => (
                                <div
                                  key={med.id || idx}
                                  className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                                >
                                  <div>
                                    <p className="font-bold text-slate-900">{med.medicineName || med.name}</p>
                                    <p className="text-slate-500 text-[11px]">
                                      {med.dosage} • {med.frequency}
                                    </p>
                                  </div>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {med.status || "Active"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">0 medications currently prescribed for this patient.</p>
                          )}
                        </div>

                        {/* Recent Medical Records Attached */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              <FolderLock className="w-4 h-4 text-teal-600" />
                              Attached Medical Records ({patientRecords.length})
                            </h4>
                            <Link
                              to="/hospital/add-record"
                              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
                            >
                              <FilePlus2 className="w-3.5 h-3.5" />
                              Upload Record
                            </Link>
                          </div>
                          {patientRecords.length > 0 ? (
                            <div className="space-y-2">
                              {patientRecords.slice(0, 3).map((rec, idx) => (
                                <div
                                  key={rec.id || rec.recordId || idx}
                                  className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <p className="font-bold text-slate-900">{rec.documentName || rec.name}</p>
                                    <p className="text-slate-500 text-[11px]">
                                      {rec.documentType || rec.type} • {rec.date}
                                    </p>
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    {rec.fileSize || "Clinical Document"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">0 medical records attached in this patient vault.</p>
                          )}
                        </div>

                        {/* Quick Provider Actions Footer */}
                        <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200">
                          <Link
                            to="/hospital/add-record"
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <FilePlus2 className="w-3.5 h-3.5 text-blue-600" />
                            Add Clinical Record
                          </Link>
                          <Link
                            to="/hospital/add-prescription"
                            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
                          >
                            <Pill className="w-3.5 h-3.5" />
                            Add Prescription
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
