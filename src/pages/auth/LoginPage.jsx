import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AlertBanner from "../../components/common/AlertBanner";
import {
  Lock,
  Mail,
  User,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = location.state?.from?.pathname || (role === "hospital" ? "/hospital/dashboard" : "/patient/dashboard");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Basic client validation
    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }
    if (password.length < 4) {
      setErrorMessage("Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password, role);
      toast.success(`Welcome back! Logged in as ${role === "hospital" ? "Hospital Staff" : "Patient"}.`);
      navigate(role === "hospital" ? "/hospital/dashboard" : "/patient/dashboard", { replace: true });
    } catch (err) {
      const msg = err.message || "Failed to log in. Please check your credentials.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <span className="font-extrabold text-2xl tracking-tighter">MV</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign in to MedVault
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500">
          Cloud-based unified medical records for patients and hospitals
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-sm border border-slate-200">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5">
              <AlertBanner
                type="error"
                title="Authentication Error"
                message={errorMessage}
                onClose={() => setErrorMessage("")}
              />
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Quick Demo Credentials Helper */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Quick Login Credentials
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Password: Password123!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRole("patient");
                    setEmail("patient@medvault.io");
                    setPassword("Password123!");
                  }}
                  className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex flex-col cursor-pointer ${
                    role === "patient" && email === "patient@medvault.io"
                      ? "bg-blue-50 border-blue-300 text-blue-800 shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="font-bold">Patient Portal</span>
                  <span className="text-[10px] text-slate-500">patient@medvault.io</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole("hospital");
                    setEmail("staff@hospital.org");
                    setPassword("Password123!");
                  }}
                  className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex flex-col cursor-pointer ${
                    role === "hospital" && email === "staff@hospital.org"
                      ? "bg-teal-50 border-teal-300 text-teal-800 shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="font-bold">Hospital Staff</span>
                  <span className="text-[10px] text-slate-500">staff@hospital.org</span>
                </button>
              </div>
            </div>

            {/* Role Selector Dropdown */}
            <div>
              <label
                htmlFor="role-select"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Account Role <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-medium cursor-pointer transition-colors"
                >
                  <option value="patient">Patient (Personal Vault)</option>
                  <option value="hospital">Hospital Staff (Provider Portal)</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {role === "hospital" ? (
                    <Building2 className="w-4 h-4 text-teal-600" />
                  ) : (
                    <User className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-input"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={role === "hospital" ? "staff@hospital.org" : "you@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password-input"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Min 4 characters</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 transition-colors shadow-sm shadow-blue-500/25 cursor-pointer"
              >
                {loading ? (
                  <LoadingSpinner size="sm" text="Authenticating..." className="py-0 text-white" />
                ) : (
                  <>
                    <span>Sign In to {role === "hospital" ? "Hospital Portal" : "Patient Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Registration Links */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Need a new account?
            </p>
            <div className="flex items-center justify-center gap-4 text-xs font-medium">
              <Link
                to="/register/patient"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                Register as Patient
              </Link>
              <span className="text-slate-300">|</span>
              <Link
                to="/register/hospital"
                className="text-teal-600 hover:text-teal-700 hover:underline"
              >
                Register Hospital
              </Link>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Encrypted HIPAA & Cloud Security Compliant Architecture</span>
        </div>
      </div>
    </div>
  );
}
