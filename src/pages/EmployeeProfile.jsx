import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/EmployeeProfile.css";

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
};

const LockedField = ({ label, value }) => (
  <div className="employee-profile-field">
    <label>{label}</label>
    <div className="employee-profile-locked-value">
      <span>{displayValue(value)}</span>
      <span className="employee-profile-lock" aria-label="Read only">
        🔒
      </span>
    </div>
  </div>
);

const EditableField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}) => (
  <div className="employee-profile-field">
    <label htmlFor={`employee-${name}`}>{label}</label>
    <input
      id={`employee-${name}`}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      className="employee-profile-input"
    />
  </div>
);

function EmployeeProfile() {
  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [personalData, setPersonalData] = useState({
    personalEmail: "",
    phoneNumber: "",
    address: "",
  });

  const [emergencyData, setEmergencyData] = useState({
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    emergencyContactAddress: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Display empty optional values consistently.
  const displayValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    return value;
  };

  // Resolve department ID to its name.
  const getDepartmentName = (departmentId) => {
    if (departmentId === null || departmentId === undefined) {
      return "—";
    }

    const department = departments.find(
      (item) => String(item.id) === String(departmentId),
    );

    return department?.name || "—";
  };

  // Resolve designation ID to its name.
  const getDesignationName = (designationId) => {
    if (designationId === null || designationId === undefined) {
      return "—";
    }

    const designation = designations.find(
      (item) => String(item.id) === String(designationId),
    );

    return designation?.name || "—";
  };

  // Load master data used to display department and designation names.
  const loadMasterData = async () => {
    try {
      const [departmentResponse, designationResponse] = await Promise.all([
        api.get("/departments"),
        api.get("/designations"),
      ]);

      setDepartments(
        Array.isArray(departmentResponse.data) ? departmentResponse.data : [],
      );

      setDesignations(
        Array.isArray(designationResponse.data) ? designationResponse.data : [],
      );
    } catch (err) {
      console.error("Unable to load department/designation data:", err);
    }
  };

  // Load the currently authenticated employee's profile.
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const authData = JSON.parse(localStorage.getItem("authData") || "null");

      if (!authData?.userId) {
        setProfile(null);
        setError("User information not found. Please log in again.");
        return;
      }

      const response = await api.get(`/users/${authData.userId}`);
      const data = response.data;

      setProfile(data);

      setPersonalData({
        personalEmail: data.personalEmail || "",
        phoneNumber: data.phoneNumber || "",
        address: data.address || "",
      });

      setEmergencyData({
        emergencyContactName: data.emergencyContactName || "",
        emergencyContactRelationship: data.emergencyContactRelationship || "",
        emergencyContactPhone: data.emergencyContactPhone || "",
        emergencyContactAddress: data.emergencyContactAddress || "",
      });
    } catch (err) {
      console.error("Failed to load employee profile:", err);

      setProfile(null);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message ||
              "Unable to load your profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadMasterData();
  }, []);

  // Handle personal information changes.
  const handlePersonalChange = (event) => {
    const { name, value } = event.target;

    setPersonalData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Handle emergency contact changes.
  const handleEmergencyChange = (event) => {
    const { name, value } = event.target;

    setEmergencyData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Save personal email, phone number and address.
  const handlePersonalSave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    try {
      setSavingPersonal(true);

      const response = await api.put("/users/me/profile", {
        personalEmail: personalData.personalEmail,
        phoneNumber: personalData.phoneNumber,
        address: personalData.address,
      });

      setSuccess(
        typeof response.data === "string"
          ? response.data
          : "Personal information updated successfully.",
      );

      await loadProfile();
    } catch (err) {
      console.error("Failed to update personal information:", err);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message ||
              "Unable to update personal information.",
      );
    } finally {
      setSavingPersonal(false);
    }
  };

  // Save emergency contact information.
  const handleEmergencySave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    try {
      setSavingEmergency(true);

      const response = await api.put("/users/me/emergency-contact", {
        emergencyContactName: emergencyData.emergencyContactName,
        emergencyContactRelationship:
          emergencyData.emergencyContactRelationship,
        emergencyContactPhone: emergencyData.emergencyContactPhone,
        emergencyContactAddress: emergencyData.emergencyContactAddress,
      });

      setSuccess(
        typeof response.data === "string"
          ? response.data
          : "Emergency contact updated successfully.",
      );

      await loadProfile();
    } catch (err) {
      console.error("Failed to update emergency contact:", err);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message ||
              "Unable to update emergency contact.",
      );
    } finally {
      setSavingEmergency(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-profile-page">
        <div className="employee-profile-loading">Loading your profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="employee-profile-page">
        <div className="employee-profile-alert employee-profile-error">
          {error || "Employee profile could not be loaded."}
          <button type="button" onClick={loadProfile}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-profile-page">
      {/* Page Header */}
      <header className="employee-profile-header">
        <div>
          <p className="employee-profile-eyebrow">EMPLOYEE PORTAL</p>

          <h1>My Profile</h1>

          <p className="employee-profile-subtitle">
            View your account and employment information, update your personal
            details, and manage your emergency contact information.
          </p>
        </div>

        <span className="employee-profile-role-badge">
          {displayValue(profile.role)}
        </span>
      </header>

      {/* Feedback Messages */}
      {error && (
        <div
          className="employee-profile-alert employee-profile-error"
          role="alert"
        >
          {error}
          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {success && (
        <div
          className="employee-profile-alert employee-profile-success"
          role="status"
        >
          {success}
          <button type="button" onClick={() => setSuccess("")}>
            ×
          </button>
        </div>
      )}

      {/* 1. Account Information */}
      <section className="employee-profile-card">
        <div className="employee-profile-section-heading">
          <h2>Account Information</h2>
          <p>Your official workforce account information.</p>
        </div>

        <div className="employee-profile-grid">
          <LockedField label="Employee ID" value={profile.id} />

          <LockedField label="Full Name" value={profile.name} />

          <LockedField label="Official Email" value={profile.email} />

          <LockedField label="Role" value={profile.role} />
        </div>
      </section>

      {/* 2. Personal Information */}
      <section className="employee-profile-card">
        <div className="employee-profile-section-heading">
          <h2>Personal Information</h2>
          <p>Update your personal contact information.</p>
        </div>

        <form onSubmit={handlePersonalSave}>
          <div className="employee-profile-grid">
            <EditableField
              label="Personal Email"
              name="personalEmail"
              type="email"
              value={personalData.personalEmail}
              onChange={handlePersonalChange}
              required
            />

            <EditableField
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={personalData.phoneNumber}
              onChange={handlePersonalChange}
            />

            <div className="employee-profile-field employee-profile-full-width">
              <label htmlFor="employee-address">Address</label>

              <textarea
                id="employee-address"
                name="address"
                value={personalData.address}
                onChange={handlePersonalChange}
                rows={3}
                className="employee-profile-textarea"
              />
            </div>
          </div>

          <div className="employee-profile-actions">
            <button
              type="submit"
              className="employee-profile-save-button"
              disabled={savingPersonal}
            >
              {savingPersonal ? "Saving..." : "Save Personal Information"}
            </button>
          </div>
        </form>
      </section>

      {/* 3. Employment Information */}
      <section className="employee-profile-card">
        <div className="employee-profile-section-heading">
          <h2>Employment Information</h2>
          <p>
            Official employment information is managed by authorized
            administration.
          </p>
        </div>

        <div className="employee-profile-grid">
          <LockedField
            label="Department"
            value={getDepartmentName(profile.departmentId)}
          />

          <LockedField
            label="Designation"
            value={getDesignationName(profile.designationId)}
          />

          <LockedField label="Joining Date" value={profile.joiningDate} />

          <LockedField label="Employment Type" value={profile.employmentType} />

          <LockedField label="Work Location" value={profile.workLocation} />

          <LockedField label="Account Status" value={profile.status} />
        </div>
      </section>

      {/* 4. Reporting Authority */}
      <section className="employee-profile-card">
        <div className="employee-profile-section-heading">
          <h2>Reporting Authority</h2>
          <p>Your reporting manager recorded in the workforce system.</p>
        </div>

        <div className="employee-profile-grid">
          <LockedField
            label="Reporting Manager ID"
            value={profile.reportingAuthorityId}
          />

          <LockedField
            label="Reporting Manager Name"
            value={profile.reportingAuthorityName}
          />

          <div className="employee-profile-full-width">
            <LockedField
              label="Reporting Manager Email"
              value={profile.reportingAuthorityEmail}
            />
          </div>
        </div>
      </section>

      {/* 5. Emergency Contact */}
      <section className="employee-profile-card">
        <div className="employee-profile-section-heading">
          <h2>Emergency Contact</h2>
          <p>
            Manage the emergency contact information associated with your
            account.
          </p>
        </div>

        <form onSubmit={handleEmergencySave}>
          <div className="employee-profile-grid">
            <EditableField
              label="Contact Name"
              name="emergencyContactName"
              value={emergencyData.emergencyContactName}
              onChange={handleEmergencyChange}
            />

            <EditableField
              label="Relationship"
              name="emergencyContactRelationship"
              value={emergencyData.emergencyContactRelationship}
              onChange={handleEmergencyChange}
            />

            <EditableField
              label="Contact Number"
              name="emergencyContactPhone"
              type="tel"
              value={emergencyData.emergencyContactPhone}
              onChange={handleEmergencyChange}
            />

            <EditableField
              label="Contact Address"
              name="emergencyContactAddress"
              value={emergencyData.emergencyContactAddress}
              onChange={handleEmergencyChange}
            />
          </div>

          <div className="employee-profile-actions">
            <button
              type="submit"
              className="employee-profile-save-button"
              disabled={savingEmergency}
            >
              {savingEmergency ? "Saving..." : "Save Emergency Contact"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default EmployeeProfile;
