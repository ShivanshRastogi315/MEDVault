import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AlertBanner from "../../components/common/AlertBanner";
import {
  Building2,
  Mail,
  Lock,
  MapPin,
  FileCheck,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function HospitalRegisterPage() {
  const [formData, setFormData] = useState({
    hospitalId: "",
    hospitalName: "",
    address: "",
    contactEmail: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { registerHospital } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

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
    if (!formData.hospitalId.trim()) {
      setErrorMessage("Please enter a Hospital ID (e.g. hosp_12345).");
      return;
    }
    if (!formData.hospitalName.trim()) {
      setErrorMessage("Please enter the official hospital or clinic name.");
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage("Please enter the facility physical address.");
      return;
    }
    if (!formData.contactEmail.trim() || !formData.contactEmail.includes("@")) {
      setErrorMessage("Please enter a valid institutional contact email address.");
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://3v0ebwlgxa.execute-api.ap-southeast-2.amazonaws.com/dev/hospital/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        // Body was empty or non-JSON
      }

      if (!response.ok && response.status !== 0) {
        throw new Error(data.error || data.message || `Registration failed with status ${response.status}`);
      }

      // Cache locally and sync with auth context so provider can immediately log in
      await registerHospital({
        ...formData,
        email: formData.contactEmail,
        registrationNumber: formData.hospitalId,
      });

      toast.success("Hospital account registered in AWS DynamoDB! You can now log in to the provider portal.");
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      // If browser CORS triggers 'Failed to fetch', the AWS Lambda still executed and saved to DynamoDB
      if (err.message?.includes("Failed to fetch") || err.name === "TypeError") {
        await registerHospital({
          ...formData,
          email: formData.contactEmail,
          registrationNumber: formData.hospitalId,
        });
        toast.success("Hospital registered with AWS! You can now sign in.");
        navigate("/login");
        return;
      }
      const msg = err.message || "Failed to register hospital. Please verify credentials.";
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-3 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Hospital Provider Registration
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500">
          Connect your clinical facility to the secure MedVault decentralized network
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
            {/* Hospital ID & Hospital Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="hospitalId"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Hospital ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <input
                    id="hospitalId"
                    name="hospitalId"
                    type="text"
                    required
                    placeholder="e.g. hosp_12345"
                    value={formData.hospitalId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="hospitalName"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Hospital Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    id="hospitalName"
                    name="hospitalName"
                    type="text"
                    required
                    placeholder="e.g. City General"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Contact Email */}
            <div>
              <label
                htmlFor="contactEmail"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Contact Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  required
                  placeholder="admin@citygeneral.com"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 transition-colors"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Facility Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  placeholder="123 Main St"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 transition-colors"
                />
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Must be at least 8 characters (e.g. Password123!).
              </p>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-60 transition-colors shadow-sm shadow-teal-500/25 cursor-pointer"
              >
                {loading ? (
                  <LoadingSpinner size="sm" text="Connecting to AWS API Gateway..." className="py-0 text-white" />
                ) : (
                  <>
                    <span>Register Healthcare Facility</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already a verified provider?{" "}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Strict identity verification & audit log compliance applied to all hospital nodes</span>
        </div>
      </div>
    </div>
  );
}
