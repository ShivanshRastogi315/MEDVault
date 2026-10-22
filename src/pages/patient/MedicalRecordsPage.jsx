import { useState, useEffect } from "react";
import {
  apiRequest,
  ENDPOINTS,
  getStoredUserId,
  getStoredUserData,
  getRecordsForPatient,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AlertBanner from "../../components/common/AlertBanner";
import {
  FolderLock,
  Download,
  Search,
  FileText,
  Calendar,
  Building2,
  Filter,
  Eye,
  CheckCircle2,
  FileCheck2,
  X,
  RefreshCw,
} from "lucide-react";

export default function MedicalRecordsPage() {
  const { user, userId } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All Records");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const toast = useToast();

  const TABS = [
    "All Records",
    "Blood Test Reports",
    "Scans & Diagnostic Reports",
    "Discharge Summaries",
    "Previous Prescriptions",
    "Other Documents",
  ];

  // Resolve active patient ID: sub, id, patientId, or MV-PAT-4770
  const activePatientId =
    user?.patientId ||
    user?.id ||
    userId ||
    getStoredUserId() ||
    getStoredUserData()?.patientId ||
    getStoredUserData()?.id ||
    "MV-PAT-4770";

  useEffect(() => {
    fetchRecords();

    const handleUpdate = () => {
      fetchRecords();
    };
    window.addEventListener("medvault_records_updated", handleUpdate);
    return () => window.removeEventListener("medvault_records_updated", handleUpdate);
  }, [activePatientId]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call ENDPOINTS.getPatientRecords with the active patient's ID
      const endpoint = `${ENDPOINTS.getPatientRecords || ENDPOINTS.medicalRecords}?patientId=${encodeURIComponent(activePatientId)}`;
      const res = await apiRequest(endpoint);
      const rawRecords = Array.isArray(res) ? res : res.data || res.records || [];

      // Normalize records so live items from AWS DynamoDB & S3 match the list view structure
      const normalizedRecords = rawRecords.map((r, index) => {
        const docType = r.documentType || r.type || "Blood Test";
        const docName = r.documentName || r.name || "Clinical Medical Document";
        const recId = r.recordId || r.id || `REC-${index + 1}`;
        const issueDate = r.date || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]);
        const downloadLink = r.fileUrl || r.downloadUrl || null;
        const fileName = r.fileName || `${docName.replace(/[^a-z0-9]/gi, "_")}.pdf`;

        return {
          ...r,
          id: recId,
          recordId: recId,
          patientId: r.patientId || activePatientId,
          documentName: docName,
          name: docName,
          documentType: docType,
          type: docType,
          date: issueDate,
          hospitalName: r.hospitalName || "Medical Provider",
          doctor: r.doctor || "Attending Clinician",
          department: r.department || (docType === "Scan" ? "Diagnostic Imaging" : "Clinical Pathology"),
          fileSize: r.fileSize || "Clinical Document",
          notes: r.notes || "",
          fileUrl: downloadLink,
          downloadUrl: downloadLink,
          fileName: fileName,
        };
      });

      // Retrieve shared records and locally cached records for this patient
      const sharedRecords = getRecordsForPatient(
        activePatientId,
        user?.email,
        user?.fullName || user?.name
      );

      let localRecords = [];
      try {
        localRecords = JSON.parse(
          localStorage.getItem(`medvault_patient_records_${activePatientId}`) || "[]"
        );
      } catch {}

      const allRecords = [...sharedRecords, ...localRecords, ...normalizedRecords];
      const uniqueRecords = allRecords.filter(
        (r, idx, self) => idx === self.findIndex((t) => (t.recordId || t.id) === (r.recordId || r.id))
      );

      setRecords(uniqueRecords);

      // Dynamically update localStorage cache and broadcast to sidebar navigation
      localStorage.setItem("medvault_patient_records_count", uniqueRecords.length.toString());
      window.dispatchEvent(
        new CustomEvent("medvault_records_count_updated", {
          detail: { count: uniqueRecords.length },
        })
      );
    } catch (err) {
      const sharedRecords = getRecordsForPatient(
        activePatientId,
        user?.email,
        user?.fullName || user?.name
      );

      let localRecords = [];
      try {
        localRecords = JSON.parse(
          localStorage.getItem(`medvault_patient_records_${activePatientId}`) || "[]"
        );
      } catch {}

      const fallbackRecords = [...sharedRecords, ...localRecords];
      const uniqueFallback = fallbackRecords.filter(
        (r, idx, self) => idx === self.findIndex((t) => (t.recordId || t.id) === (r.recordId || r.id))
      );

      if (uniqueFallback.length > 0) {
        setRecords(uniqueFallback);
      } else if (err.isNotFound || err.status === 404) {
        setRecords([]);
      } else {
        const msg = err.message || "Failed to fetch medical records.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const matchesTab = (record, tab) => {
    const docType = record.type || record.documentType || "";
    if (tab === "All Records") return true;
    if (tab === "Blood Test Reports") return docType === "Blood Test";
    if (tab === "Scans & Diagnostic Reports") return docType === "Scan";
    if (tab === "Discharge Summaries") return docType === "Discharge Summary";
    if (tab === "Previous Prescriptions") return docType === "Prescription";
    if (tab === "Other Documents")
      return docType === "Other" || !["Blood Test", "Scan", "Discharge Summary", "Prescription"].includes(docType);
    return true;
  };

  const filteredRecords = records.filter((r) => {
    const tabMatch = matchesTab(r, activeTab);
    const query = searchQuery.toLowerCase().trim();
    if (!query) return tabMatch;
    const docName = (r.documentName || r.name || "").toLowerCase();
    const hospName = (r.hospitalName || "").toLowerCase();
    const docType = (r.type || r.documentType || "").toLowerCase();
    const doctor = (r.doctor || "").toLowerCase();
    const notes = (r.notes || "").toLowerCase();
    const textMatch =
      docName.includes(query) ||
      hospName.includes(query) ||
      docType.includes(query) ||
      doctor.includes(query) ||
      notes.includes(query);
    return tabMatch && textMatch;
  });

  const handleDownload = (record) => {
    // If a cloud S3 storage URL exists, open directly in a new tab
    if (record.fileUrl && record.fileUrl !== "#") {
      window.open(record.fileUrl, "_blank", "noopener,noreferrer");
      toast.success(`Opening document: ${record.fileName || record.documentName}`);
      return;
    }

    if (record.fileBase64) {
      // Decode Base64 string into binary Blob and trigger browser download
      try {
        const byteCharacters = atob(record.fileBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const mime = record.mimeType || "application/pdf";
        const blob = new Blob([byteArray], { type: mime });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = record.fileName || `${record.documentName.replace(/[^a-z0-9]/gi, "_")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Downloaded: ${record.fileName || record.documentName}`);
        return;
      } catch (err) {
        console.warn("Could not decode Base64 directly, falling back to text report:", err);
      }
    }

    // Fallback: Generate clinical report text summary
    const reportContent = `MEDVAULT CLINICAL DOCUMENT SUMMARY
============================================================
DOCUMENT: ${record.documentName}
ID: ${record.id}
PATIENT ID: ${record.patientId}
DATE ISSUED: ${record.date}
FACILITY: ${record.hospitalName}
ATTENDING PHYSICIAN: ${record.doctor || "Medical Staff"}
DEPARTMENT: ${record.department || "Clinical Services"}
TYPE: ${record.type}
FILE SIZE: ${record.fileSize || "1.2 MB"}
============================================================
CLINICAL NOTES & FINDINGS:
${record.notes || "No additional notes provided."}

============================================================
Verified through MedVault Decentralized Encrypted Cloud
Generated: ${new Date().toLocaleString()}
`;

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${record.documentName.replace(/[^a-z0-9]/gi, "_")}_${record.date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded: ${record.documentName}`);
  };

  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case "Blood Test":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Scan":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Discharge Summary":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Prescription":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderLock className="w-6 h-6 text-blue-600" />
            Medical Records Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access, filter, and export verified digital health reports issued by authorized hospital networks.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px] max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search documents, hospitals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-2xs placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <AlertBanner
          type="error"
          title="Records Fetch Error"
          message={error}
          actions={
            <button
              onClick={fetchRecords}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          }
        />
      )}

      {/* 6 Tabs as specified */}
      <div className="border-b border-slate-200">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map((tab) => {
            const count = records.filter((r) => matchesTab(r, tab)).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content list / cards */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" text="Loading encrypted medical records..." />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">
            {records.length === 0 ? "0 Records Uploaded" : "No records found"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {records.length === 0
              ? "No clinical documents found in database for this patient vault."
              : searchQuery
              ? `No documents match "${searchQuery}". Try clearing search.`
              : `No documents available under ${activeTab}.`}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm hover:border-blue-200 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header: Document Type Badge & Date */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeBadgeStyle(
                      record.type
                    )}`}
                  >
                    {record.type}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {record.date}
                  </span>
                </div>

                {/* Document Name */}
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                  {record.documentName}
                </h3>

                {/* Hospital & Doctor Details */}
                <div className="mt-2.5 space-y-1 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{record.hospitalName}</span>
                  </p>
                  {record.doctor && (
                    <p className="text-[11px] text-slate-500 pl-5">
                      Issued by: <span className="font-semibold text-slate-600">{record.doctor}</span>
                    </p>
                  )}
                </div>

                {/* Notes snippet */}
                {record.notes && (
                  <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 leading-relaxed">
                    {record.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons: View Preview & Download */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewDoc(record)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </button>
                <button
                  onClick={() => handleDownload(record)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Detail Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setPreviewDoc(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeBadgeStyle(
                    previewDoc.type
                  )}`}
                >
                  {previewDoc.type}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {previewDoc.documentName}
                </h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Hospital Facility:</span>
                  <span className="font-semibold text-slate-800">{previewDoc.hospitalName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date of Issue:</span>
                  <span className="font-semibold text-slate-800">{previewDoc.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Physician:</span>
                  <span className="font-semibold text-slate-800">{previewDoc.doctor || "Medical Staff"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Department:</span>
                  <span className="font-semibold text-slate-800">{previewDoc.department || "Clinical Unit"}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Clinical Report & Impression:</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed text-xs">
                  {previewDoc.notes || "No detailed clinical findings recorded."}
                </div>
              </div>

              {previewDoc.fileUrl && previewDoc.fileUrl !== "#" && (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-blue-900 truncate max-w-[220px]">
                      {previewDoc.fileName || previewDoc.documentName}
                    </span>
                  </div>
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Open Live File →
                  </a>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(previewDoc)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download Report File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
