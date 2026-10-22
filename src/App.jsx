import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PortalLayout from "./components/layout/PortalLayout";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import PatientRegisterPage from "./pages/auth/PatientRegisterPage";
import HospitalRegisterPage from "./pages/auth/HospitalRegisterPage";

// Patient Portal Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import MedicalRecordsPage from "./pages/patient/MedicalRecordsPage";
import MedicationsPage from "./pages/patient/MedicationsPage";
import VisitHistoryPage from "./pages/patient/VisitHistoryPage";
import AppointmentsPage from "./pages/patient/AppointmentsPage";
import EmergencyInfoPage from "./pages/patient/EmergencyInfoPage";
import PatientAiAssistantPage from "./pages/patient/PatientAiAssistantPage";

// Hospital Portal Pages
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import PatientSearchPage from "./pages/hospital/PatientSearchPage";
import AddRecordPage from "./pages/hospital/AddRecordPage";
import AddPrescriptionPage from "./pages/hospital/AddPrescriptionPage";
import EmergencyAccessPage from "./pages/hospital/EmergencyAccessPage";
import VisitManagementPage from "./pages/hospital/VisitManagementPage";

// Root redirect handler
function RootRedirect() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return role === "hospital" ? (
    <Navigate to="/hospital/dashboard" replace />
  ) : (
    <Navigate to="/patient/dashboard" replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/patient" element={<PatientRegisterPage />} />
            <Route path="/register/hospital" element={<HospitalRegisterPage />} />

            {/* Patient Portal (Protected, role="patient") */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedRole="patient">
                  <PortalLayout portalType="patient" />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/patient/dashboard" replace />} />
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="records" element={<MedicalRecordsPage />} />
              <Route path="medications" element={<MedicationsPage />} />
              <Route path="visits" element={<VisitHistoryPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="emergency" element={<EmergencyInfoPage />} />
              <Route path="assistant" element={<PatientAiAssistantPage />} />
            </Route>

            {/* Hospital Portal (Protected, role="hospital") */}
            <Route
              path="/hospital"
              element={
                <ProtectedRoute allowedRole="hospital">
                  <PortalLayout portalType="hospital" />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/hospital/dashboard" replace />} />
              <Route path="dashboard" element={<HospitalDashboard />} />
              <Route path="patients" element={<PatientSearchPage />} />
              <Route path="add-record" element={<AddRecordPage />} />
              <Route path="add-prescription" element={<AddPrescriptionPage />} />
              <Route path="emergency-access" element={<EmergencyAccessPage />} />
              <Route path="visits" element={<VisitManagementPage />} />
            </Route>

            {/* Root & Catch-all Fallbacks */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
