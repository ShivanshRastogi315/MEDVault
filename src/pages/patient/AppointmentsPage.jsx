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
  CalendarClock,
  Building2,
  Clock,
  User,
  Plus,
  MapPin,
  Calendar,
  CheckCircle2,
  X,
  Stethoscope,
} from "lucide-react";

export default function AppointmentsPage() {
  const { user, userId } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activePatientId =
    user?.patientId ||
    user?.id ||
    userId ||
    getStoredUserId() ||
    getStoredUserData()?.patientId ||
    getStoredUserData()?.id ||
    "MV-PAT-4770";

  const [formData, setFormData] = useState({
    patientId: activePatientId,
    hospitalName: "",
    department: "",
    doctorName: "",
    date: "",
    time: "10:00 AM",
    reason: "",
    type: "Follow-up",
    location: "",
  });

  const toast = useToast();

  useEffect(() => {
    fetchAppointments();
  }, [activePatientId]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `${ENDPOINTS.getAppointments || ENDPOINTS.appointments}?patientId=${encodeURIComponent(activePatientId)}`;
      const res = await apiRequest(endpoint);
      let list = [];
      if (res.upcoming || res.past) {
        list = [
          ...(res.upcoming || []).map((a, i) => ({ ...a, id: a.id || `appt-up-${i}`, status: a.status || "Upcoming" })),
          ...(res.past || []).map((a, i) => ({ ...a, id: a.id || `appt-pst-${i}`, status: a.status || "Completed" })),
        ];
      } else if (Array.isArray(res)) {
        list = res;
      } else {
        list = res.data || res.appointments || [];
      }
      setAppointments(list);
    } catch (err) {
      if (err.isNotFound || err.status === 404) {
        setAppointments([]);
      } else {
        const msg = err.message || "Failed to load scheduled appointments.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      toast.error("Please enter the clinical reason for your visit.");
      return;
    }
    if (!formData.date) {
      toast.error("Please select a preferred appointment date.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(ENDPOINTS.appointments, {
        method: "POST",
        body: {
          ...formData,
          patientId: activePatientId,
          hospitalName: formData.hospitalName || "Regional Medical Center",
          department: formData.department || "General Medicine",
          doctorName: formData.doctorName || "Attending Physician",
          location: formData.location || "Main Clinic",
        },
      });
      toast.success("Follow-up appointment booked successfully!");
      setShowModal(false);
      setFormData({
        patientId: activePatientId,
        hospitalName: "",
        department: "",
        doctorName: "",
        date: "",
        time: "10:00 AM",
        reason: "",
        type: "Follow-up",
        location: "",
      });
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || "Failed to book appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-blue-600" />
            Clinical Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review upcoming specialist consults, routine diagnostic reviews, and preventive visits.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm shadow-blue-500/25 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Request Follow-up Visit
        </button>
      </div>

      {error && (
        <AlertBanner
          type="error"
          title="Appointments Error"
          message={error}
          actions={
            <button
              onClick={fetchAppointments}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          }
        />
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" text="Loading appointments..." />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">0 Appointments Scheduled</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            No clinical consultations or diagnostic appointments found in database.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Schedule Follow-up
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    {appt.type || "Follow-up"}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {appt.status || "Confirmed"}
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 mb-3 font-semibold">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {appt.date} at {appt.time}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {appt.reason}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{appt.hospitalName}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 pl-5">
                    Unit: <span className="text-slate-700 font-medium">{appt.department}</span>
                  </p>
                  <p className="flex items-center gap-1.5 pl-5 text-[11px] text-slate-600">
                    <Stethoscope className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{appt.doctorName}</span>
                  </p>
                  {appt.location && (
                    <p className="flex items-center gap-1.5 pl-5 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{appt.location}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Check-in 15m prior</span>
                <span className="text-blue-600 font-medium">Digital Pass Verified</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Follow-up Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-blue-600" />
                Request Follow-up Visit
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Healthcare Center
                </label>
                <input
                  type="text"
                  required
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Department / Specialty
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                    Time Slot
                  </label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Reason for Follow-up / Symptoms
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Routine blood sugar check, medication refill review"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-2xs disabled:opacity-60"
                >
                  {submitting ? (
                    <LoadingSpinner size="sm" text="Booking..." className="py-0 text-white" />
                  ) : (
                    "Confirm Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
