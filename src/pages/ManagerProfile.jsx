import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/admin-profile.css";
import "../styles/ManagerProfile.css";

function ManagerProfile() {
  const [profile, setProfile] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Personal information
  const [personalEmail, setPersonalEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  // Emergency contact
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactRelationship, setEmergencyContactRelationship] =
    useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactAddress, setEmergencyContactAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load department and designation master data
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
      console.error("Failed to load department/designation data:", err);
      setDepartments([]);
      setDesignations([]);
    }
  };

  // Resolve department name
  const getDepartmentName = (departmentId) => {
    if (departmentId == null) return "—";

    const department = departments.find(
      (item) => String(item.id) === String(departmentId),
    );

    return department?.name || "—";
  };

  // Resolve designation name
  const getDesignationName = (designationId) => {
    if (designationId == null) return "—";

    const designation = designations.find(
      (item) => String(item.id) === String(designationId),
    );

    return designation?.name || "—";
  };

  // Load the logged-in Manager's profile
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const authData = JSON.parse(localStorage.getItem("authData") || "null");

      if (!authData || !authData.userId) {
        setProfile(null);
        setError("User information not found. Please log in again.");
        return;
      }

      const response = await api.get(`/users/${authData.userId}`);
      const data = response.data;

      setProfile(data);

      setPersonalEmail(data.personalEmail || "");
      setPhoneNumber(data.phoneNumber || "");
      setAddress(data.address || "");

      setEmergencyContactName(data.emergencyContactName || "");
      setEmergencyContactRelationship(data.emergencyContactRelationship || "");
      setEmergencyContactPhone(data.emergencyContactPhone || "");
      setEmergencyContactAddress(data.emergencyContactAddress || "");
    } catch (err) {
      console.error("Failed to load Manager profile:", err);

      setProfile(null);
      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Unable to load your profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadMasterData();
  }, []);

  // Save personal information
  const handleProfileSave = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      setSavingProfile(true);

      const response = await api.put("/users/me/profile", {
        personalEmail,
        phoneNumber,
        address,
      });

      setMessage(
        typeof response.data === "string"
          ? response.data
          : "Personal information updated successfully.",
      );

      await loadProfile();
    } catch (err) {
      console.error("Manager profile update failed:", err);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Unable to update personal information.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Save emergency contact information
  const handleEmergencySave = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      setSavingEmergency(true);

      const response = await api.put("/users/me/emergency-contact", {
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone,
        emergencyContactAddress,
      });

      setMessage(
        typeof response.data === "string"
          ? response.data
          : "Emergency contact updated successfully.",
      );

      await loadProfile();
    } catch (err) {
      console.error("Manager emergency contact update failed:", err);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Unable to update emergency contact.",
      );
    } finally {
      setSavingEmergency(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="manager-profile-page">
        <div className="profile-loading">Loading your profile...</div>
      </div>
    );
  }

  // Error state
  if (!profile) {
    return (
      <div className="manager-profile-page">
        <div className="profile-error">
          {error || "Profile information is not available."}
        </div>

        <button
          type="button"
          className="profile-save-button"
          onClick={loadProfile}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="manager-profile-page">
      {/* Page Header */}
      <header className="profile-page-header">
        <div>
          <p className="profile-header-label">MANAGER PORTAL</p>

          <h1>My Profile</h1>

          <p className="profile-header-subtitle">
            View your account and employment information, update your personal
            details, and manage your emergency contact information.
          </p>
        </div>

        <div className="profile-role-badge">MANAGER</div>
      </header>

      {/* Success Message */}
      {message && (
        <div className="profile-message success" role="status">
          ✓ {message}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="profile-message error" role="alert">
          {error}
        </div>
      )}

      {/* 1. Account Information */}
      <section className="profile-section">
        <div className="profile-section-header">
          <div>
            <h2>Account Information</h2>
            <p>Your official workforce account information.</p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-field">
            <label>Manager ID</label>
            <div className="profile-readonly">
              {profile.id ?? "—"}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Full Name</label>
            <div className="profile-readonly">
              {profile.name || "—"}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Official Email</label>
            <div className="profile-readonly">
              {profile.email || "—"}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Role</label>
            <div className="profile-readonly">
              {profile.role || "—"}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Personal Information */}
      <section className="profile-section">
        <div className="profile-section-header">
          <div>
            <h2>Personal Information</h2>
            <p>Update your personal contact information.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave}>
          <div className="profile-grid">
            <div className="profile-field">
              <label htmlFor="managerPersonalEmail">Personal Email</label>
              <input
                id="managerPersonalEmail"
                type="email"
                value={personalEmail}
                onChange={(event) => setPersonalEmail(event.target.value)}
                placeholder="Enter personal email"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="managerPhoneNumber">Phone Number</label>
              <input
                id="managerPhoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="profile-field profile-field-full">
              <label htmlFor="managerAddress">Address</label>
              <textarea
                id="managerAddress"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Enter your address"
                rows="3"
              />
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="submit"
              className="profile-save-button"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save Personal Information"}
            </button>
          </div>
        </form>
      </section>

      {/* 3. Employment Information */}
      <section className="profile-section">
        <div className="profile-section-header">
          <div>
            <h2>Employment Information</h2>
            <p>
              Official employment information is managed by authorized
              administration.
            </p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-field">
            <label>Department</label>
            <div className="profile-readonly">
              {getDepartmentName(profile.departmentId)}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Designation</label>
            <div className="profile-readonly">
              {getDesignationName(profile.designationId)}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Joining Date</label>
            <div className="profile-readonly">
              {profile.joiningDate || "—"}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Employment Type</label>
            <div className="profile-readonly">
              {profile.employmentType || "—"}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Work Location</label>
            <div className="profile-readonly">
              {profile.workLocation || "—"}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Account Status</label>
            <div className="profile-readonly">
              {profile.status || "—"}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Reporting Authority */}
      <section className="profile-section">
        <div className="profile-section-header">
          <div>
            <h2>Reporting Authority</h2>
            <p>Your reporting authority recorded in the workforce system.</p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-field">
            <label>Reporting Authority Name</label>
            <div className="profile-readonly">
              {profile.reportingAuthorityName || "—"}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Reporting Authority Email</label>
            <div className="profile-readonly">
              {profile.reportingAuthorityEmail || "—"}
              <span aria-label="Non-editable">🔒</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Emergency Contact */}
      <section className="profile-section">
        <div className="profile-section-header">
          <div>
            <h2>Emergency Contact</h2>
            <p>
              Manage the emergency contact information associated with your
              account.
            </p>
          </div>
        </div>

        <form onSubmit={handleEmergencySave}>
          <div className="profile-grid">
            <div className="profile-field">
              <label htmlFor="managerEmergencyName">Contact Name</label>
              <input
                id="managerEmergencyName"
                type="text"
                value={emergencyContactName}
                onChange={(event) =>
                  setEmergencyContactName(event.target.value)
                }
                placeholder="Enter contact name"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="managerEmergencyRelationship">Relationship</label>
              <input
                id="managerEmergencyRelationship"
                type="text"
                value={emergencyContactRelationship}
                onChange={(event) =>
                  setEmergencyContactRelationship(event.target.value)
                }
                placeholder="Example: Father, Mother, Spouse"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="managerEmergencyPhone">Contact Number</label>
              <input
                id="managerEmergencyPhone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(event) =>
                  setEmergencyContactPhone(event.target.value)
                }
                placeholder="Enter emergency contact number"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="managerEmergencyAddress">Contact Address</label>
              <input
                id="managerEmergencyAddress"
                type="text"
                value={emergencyContactAddress}
                onChange={(event) =>
                  setEmergencyContactAddress(event.target.value)
                }
                placeholder="Enter emergency contact address"
              />
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="submit"
              className="profile-save-button"
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

export default ManagerProfile;
