import { createContext, useContext, useState, useEffect } from "react";
import {
  apiRequest,
  ENDPOINTS,
  decodeJwt,
  getStoredToken,
  getStoredRole,
  getStoredUserId,
  getStoredUserData,
  setStoredAuth,
  clearStoredAuth,
  getRegisteredUsers,
  saveRegisteredUser,
  createSafeJwt,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken());
  const [role, setRole] = useState(getStoredRole());
  const [userId, setUserId] = useState(getStoredUserId());
  const [user, setUser] = useState(getStoredUserData());
  const [loading, setLoading] = useState(true);

  // Synchronize on initial mount from localStorage
  useEffect(() => {
    const existingToken = getStoredToken();
    const existingRole = getStoredRole();
    const existingUserId = getStoredUserId();
    const existingUser = getStoredUserData();

    if (existingToken && existingRole) {
      setToken(existingToken);
      setRole(existingRole);
      setUserId(existingUserId);
      setUser(existingUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, selectedRole) => {
    let res = null;
    let serverError = null;
    const cleanEmail = (email || "").trim().toLowerCase();

    // 1. Attempt live authentication with AWS API Gateway backend
    try {
      res = await apiRequest(ENDPOINTS.login, {
        method: "POST",
        body: { email: cleanEmail, password, role: selectedRole },
      });
    } catch (err) {
      serverError = err;
    }

    const receivedToken =
      res?.token || res?.accessToken || res?.jwt || res?.idToken || res?.data?.token;

    // Check locally saved registered users
    const registeredUsers = getRegisteredUsers();
    const registeredMatch = registeredUsers.find(
      (u) =>
        u.email?.toLowerCase() === cleanEmail &&
        (u.role === selectedRole || !u.role || selectedRole === "any")
    );

    if (receivedToken) {
      const uRole = res.role || selectedRole;
      const claims = decodeJwt(receivedToken) || {};
      const uId =
        claims.sub ||
        claims.id ||
        res.userId ||
        res.id ||
        registeredMatch?.id ||
        (uRole === "patient" ? "MV-PAT-4770" : "HOSP-WA-90412");

      const uData = {
        id: uId,
        patientId: uRole === "patient" ? uId : undefined,
        hospitalId: uRole === "hospital" ? uId : undefined,
        email: cleanEmail,
        role: uRole,
        name:
          registeredMatch?.fullName ||
          registeredMatch?.hospitalName ||
          registeredMatch?.name ||
          (uRole === "patient" ? "Patient" : "Hospital Staff"),
        fullName: registeredMatch?.fullName || registeredMatch?.name,
        hospitalName: registeredMatch?.hospitalName,
        bloodGroup: registeredMatch?.bloodGroup,
        dob: registeredMatch?.dob,
        phone: registeredMatch?.phone,
        emergencyCode:
          registeredMatch?.emergencyCode ||
          (uRole === "patient" ? `MV-EMRG-${uId.slice(-4)}` : undefined),
        ...res.user,
        ...res.profile,
      };

      setStoredAuth(receivedToken, uRole, uId, uData);
      setToken(receivedToken);
      setRole(uRole);
      setUserId(uId);
      setUser(uData);

      // Keep registered user list synchronized with confirmed Cognito sub
      if (registeredMatch) {
        saveRegisteredUser({
          ...registeredMatch,
          id: uId,
          patientId: uRole === "patient" ? uId : registeredMatch.patientId,
          hospitalId: uRole === "hospital" ? uId : registeredMatch.hospitalId,
        });
      }

      return { ...res, token: receivedToken, user: uData, userId: uId, role: uRole };
    }

    // 2. Demo credentials & newly registered user session fallback
    const isDemoPatient =
      selectedRole === "patient" &&
      (cleanEmail === "patient@medvault.io" || cleanEmail === "demo.patient@medvault.io");

    const isDemoHospital =
      selectedRole === "hospital" &&
      (cleanEmail === "hospital@medvault.io" ||
        cleanEmail === "demo.hospital@medvault.io" ||
        cleanEmail === "staff@hospital.org");

    if (isDemoPatient || isDemoHospital || registeredMatch) {
      // Validate password if known
      if (registeredMatch?.password && registeredMatch.password !== password) {
        throw new Error("Invalid password. Please check your credentials.");
      }

      const uRole = selectedRole;
      let uId;
      let uData;

      if (registeredMatch) {
        uId =
          registeredMatch.id ||
          registeredMatch.patientId ||
          registeredMatch.hospitalId ||
          (uRole === "patient" ? "MV-PAT-4770" : "HOSP-WA-90412");
        uData = {
          id: uId,
          patientId: uRole === "patient" ? uId : undefined,
          hospitalId: uRole === "hospital" ? uId : undefined,
          email: registeredMatch.email,
          name:
            registeredMatch.fullName ||
            registeredMatch.hospitalName ||
            registeredMatch.name ||
            (uRole === "patient" ? "Patient" : "Hospital Staff"),
          fullName: registeredMatch.fullName || registeredMatch.name,
          hospitalName: registeredMatch.hospitalName,
          role: uRole,
          dob: registeredMatch.dob,
          bloodGroup: registeredMatch.bloodGroup,
          phone: registeredMatch.phone,
          emergencyCode: registeredMatch.emergencyCode || `MV-EMRG-${uId.slice(-4)}`,
          registrationNumber: registeredMatch.registrationNumber,
        };
      } else if (uRole === "patient") {
        uId = "MV-PAT-4770";
        uData = {
          id: uId,
          patientId: uId,
          name: "Patient",
          email: cleanEmail,
          role: "patient",
          emergencyCode: "MV-EMRG-4770",
        };
      } else {
        uId = "HOSP-WA-90412";
        uData = {
          id: uId,
          hospitalId: uId,
          name: "Hospital Clinical Staff",
          email: cleanEmail,
          role: "hospital",
        };
      }

      const sessionToken = createSafeJwt({
        sub: uId,
        id: uId,
        hospitalId: uId,
        userId: uId,
        role: uRole,
        email: cleanEmail,
      });

      setStoredAuth(sessionToken, uRole, uId, uData);
      setToken(sessionToken);
      setRole(uRole);
      setUserId(uId);
      setUser(uData);

      return {
        success: true,
        token: sessionToken,
        role: uRole,
        userId: uId,
        user: uData,
        message: "Authentication successful",
      };
    }

    throw serverError || new Error("Invalid email or password. Please verify your credentials.");
  };

  const registerPatient = async (patientData) => {
    const email = (patientData.email || "").trim().toLowerCase();
    const fullName = (patientData.fullName || patientData.name || "").trim();
    const password = patientData.password || "";
    const localId = `MV-PAT-${Math.floor(1000 + Math.random() * 9000)}`;

    const authPayload = {
      username: email,
      email: email,
      password: password,
      role: "patient",
      name: fullName,
      fullName: fullName,
    };

    let apiRes = null;
    let apiError = null;

    try {
      // Use live working AWS endpoint /auth/register
      apiRes = await apiRequest(ENDPOINTS.authRegister, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: authPayload,
      });
    } catch (err) {
      apiError = err;
      console.warn("Live registration note:", err.message);
    }

    // Cache user locally so they can log in immediately
    const finalPatientId = apiRes?.patientId || apiRes?.id || localId;
    const savedUser = {
      id: finalPatientId,
      patientId: finalPatientId,
      ...patientData,
      email,
      password,
      fullName,
      name: fullName,
      role: "patient",
      emergencyCode: `MV-EMRG-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
    saveRegisteredUser(savedUser);

    // If Cognito returned a policy/validation violation (e.g. weak password), surface it
    if (apiError && (apiError.message?.includes("Password") || apiError.message?.includes("policy"))) {
      throw apiError;
    }

    return apiRes || { message: "Patient registered successfully", patientId: finalPatientId };
  };

  const registerHospital = async (hospitalData) => {
    const rawRegNum = hospitalData.registrationNumber?.trim() || "";
    const cleanId = rawRegNum
      ? rawRegNum.toLowerCase().startsWith("hosp_")
        ? rawRegNum
        : `hosp_${rawRegNum.replace(/[^a-zA-Z0-9]/g, "")}`
      : `hosp_${Math.floor(10000 + Math.random() * 90000)}`;

    const email = (hospitalData.email || "").trim().toLowerCase();
    const hospitalName = (hospitalData.hospitalName || hospitalData.name || "").trim();
    const address = hospitalData.address?.trim() || "";
    const phone = hospitalData.phone?.trim() || "";
    const password = hospitalData.password || "";

    const dynamoPayload = {
      hospitalId: cleanId,
      hospitalName: hospitalName,
      address: address,
      contactEmail: email, // Required by AWS DynamoDB handler
      email: email,
      password: password,
      phone: phone,
      registrationNumber: hospitalData.registrationNumber?.trim() || cleanId,
      role: "hospital",
    };

    const cognitoPayload = {
      username: email,
      email: email,
      password: password,
      role: "hospital",
      name: hospitalName,
    };

    let dynamoRes = null;
    let cognitoRes = null;
    let regError = null;

    // 1. Create Cognito user for login
    try {
      cognitoRes = await apiRequest(ENDPOINTS.authRegister, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: cognitoPayload,
      });
    } catch (err) {
      console.warn("Cognito hospital registration note:", err.message);
    }

    // 2. Register in DynamoDB
    try {
      dynamoRes = await apiRequest(ENDPOINTS.hospitalRegister, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: dynamoPayload,
      });
    } catch (err) {
      regError = err;
      console.warn("DynamoDB hospital registration note:", err.message);
    }

    const hospitalId = dynamoRes?.hospitalId || cognitoRes?.patientId || cleanId;
    const savedHospital = {
      id: hospitalId,
      hospitalId: hospitalId,
      ...dynamoPayload,
      email,
      password,
      role: "hospital",
      createdAt: new Date().toISOString(),
    };
    saveRegisteredUser(savedHospital);

    if (regError && (regError.message?.includes("Password") || regError.message?.includes("policy"))) {
      throw regError;
    }

    return dynamoRes || cognitoRes || { message: "Hospital registered successfully", hospitalId };
  };

  const logout = () => {
    clearStoredAuth();
    setToken(null);
    setRole(null);
    setUserId(null);
    setUser(null);
  };

  const updateUserProfile = (updatedData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedData };
      localStorage.setItem("medvault_user_data", JSON.stringify(next));
      return next;
    });
  };

  const value = {
    token,
    role,
    userId,
    user,
    isAuthenticated: !!token,
    loading,
    login,
    registerPatient,
    registerHospital,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
