import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AlertBanner from "../../components/common/AlertBanner";
import {
  User,
  Mail,
  Lock,
  Calendar,
  Droplet,
  Phone,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function PatientRegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    dob: "",
    bloodGroup: "O+",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { registerPatient } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Client-side validations
    if (!formData.fullName.trim()) {
      setErrorMessage("Please enter your full legal name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (!formData.dob) {
      setErrorMessage("Please enter your date of birth.");
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage("Please enter a valid contact phone number.");
      return;
    }

    setLoading(true);
    try {
      await registerPatient(formData);
      toast.success("Patient profile created! Please sign in with your credentials.");
      navigate("/login");
    } catch (err) {
      const msg = err.message || "Failed to register patient. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <span className="font-extrabold text-xl tracking-tighter">MV</span>
          </div>
        </div>
        <h2 className="mt-3 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Patient Registration
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500">
          Create your private MedVault health identity and digital medical archive
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-sm border border-slate-200">
          {errorMessage && (
            <div className="mb-5">
              <AlertBanner
                type="error"
                title="Registration Incomplete"
                message={errorMessage}
                onClose={() => setErrorMessage("")}
              />
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 transition-colors"
                />
              </div>
            </div>

            {/* Email & Phone grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* DOB & Blood Group grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="dob"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    required
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="bloodGroup"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Blood Group <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-500">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 transition-colors cursor-pointer"
                  >
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Min. 8 characters (e.g. Password123!)"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Must be at least 8 characters with uppercase, lowercase, numbers, and symbols (e.g. Password123!).
              </p>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 transition-colors shadow-sm shadow-blue-500/25 cursor-pointer"
              >
                {loading ? (
                  <LoadingSpinner size="sm" text="Creating Patient Vault..." className="py-0 text-white" />
                ) : (
                  <>
                    <span>Complete Patient Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Patient data stored with client-side Zero-Knowledge access policies</span>
        </div>
      </div>
    </div>
  );
}
