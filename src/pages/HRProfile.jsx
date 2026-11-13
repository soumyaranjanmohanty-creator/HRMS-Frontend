import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/admin-profile.css";

function HRProfile() {
  const [profile, setProfile] = useState(null);

  // Department and designation master data
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

  // Load departments and designations from the existing backend APIs
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
      console.error("Failed to load departments and designations:", err);

      // Keep the profile usable even if master data cannot be loaded.
      setDepartments([]);
      setDesignations([]);
    }
  };

  // Find a department name using its ID
  const getDepartmentName = (departmentId) => {
    if (departmentId == null) {
      return "—";
    }

    const department = departments.find(
      (item) => String(item.id) === String(departmentId),
    );

    return department?.name || "—";
  };

  // Find a designation name using its ID
  const getDesignationName = (designationId) => {
    if (designationId == null) {
      return "—";
    }

    const designation = designations.find(
      (item) => String(item.id) === String(designationId),
    );

    return designation?.name || "—";
  };

  // Load the logged-in HR user's profile
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const authData = JSON.parse(localStorage.getItem("authData") || "null");

      if (!authData || !authData.userId) {
        setError("User information not found. Please login again.");
        setProfile(null);
        return;
      }

      const response = await api.get(`/users/${authData.userId}`);
      const data = response.data;

      setProfile(data);

      // Personal information
      setPersonalEmail(data.personalEmail || "");
      setPhoneNumber(data.phoneNumber || "");
      setAddress(data.address || "");

      // Emergency contact
      setEmergencyContactName(data.emergencyContactName || "");
      setEmergencyContactRelationship(data.emergencyContactRelationship || "");
      setEmergencyContactPhone(data.emergencyContactPhone || "");
      setEmergencyContactAddress(data.emergencyContactAddress || "");
    } catch (err) {
      console.error("Failed to load HR profile:", err);

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

  // Save editable personal information
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
      console.error("HR profile update failed:", err);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Unable to update personal information.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Save editable emergency contact information
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
      console.error("HR emergency contact update failed:", err);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Unable to update emergency contact.",
      );
    } finally {
      setSavingEmergency(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-profile-page">
        <div className="profile-loading">Loading your profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="admin-profile-page">
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
    <div className="admin-profile-page">
      {/* Page Header */}
      <header className="profile-page-header">
        <div>
          <p className="profile-header-label">HUMAN RESOURCES</p>

          <h1>My Profile</h1>

          <p className="profile-header-subtitle">
            View your HR account and employment information, and manage your
            personal details and emergency contact information.
          </p>
        </div>

        <div className="profile-role-badge">HR</div>
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
            <label>Employee ID</label>
            <div className="profile-readonly">
              {profile.id ?? "—"}
              <span>🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Full Name</label>
            <div className="profile-readonly">
              {profile.name || "—"}
              <span>🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Official Email</label>
            <div className="profile-readonly">
              {profile.email || "—"}
              <span>🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Role</label>
            <div className="profile-readonly">
              {profile.role || "—"}
              <span>🔒</span>
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
              <label htmlFor="hrPersonalEmail">Personal Email</label>
              <input
                id="hrPersonalEmail"
                type="email"
                value={personalEmail}
                onChange={(event) => setPersonalEmail(event.target.value)}
                placeholder="Enter personal email"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="hrPhoneNumber">Phone Number</label>
              <input
                id="hrPhoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="profile-field profile-field-full">
              <label htmlFor="hrAddress">Address</label>
              <textarea
                id="hrAddress"
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
              <span>🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Designation</label>
            <div className="profile-readonly">
              {getDesignationName(profile.designationId)}
              <span>🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Joining Date</label>
            <div className="profile-readonly">
              {profile.joiningDate || "—"}
              <span>🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Employment Type</label>
            <div className="profile-readonly">
              {profile.employmentType || "—"}
              <span>🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Work Location</label>
            <div className="profile-readonly">
              {profile.workLocation || "—"}
              <span>🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Account Status</label>
            <div className="profile-status">{profile.status || "—"}</div>
          </div>
        </div>
      </section>

      {/* 4. Reporting Authority */}
      <section className="profile-section">
        <div className="profile-section-header">
          <div>
            <h2>Reporting Authority</h2>
            <p>Your reporting authority as recorded in the workforce system.</p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-field">
            <label>Reporting Authority Name</label>
            <div className="profile-readonly">
              {profile.reportingAuthorityName || "—"}
              <span>🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Reporting Authority Email</label>
            <div className="profile-readonly">
              {profile.reportingAuthorityEmail || "—"}
              <span>🔒</span>
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
              <label htmlFor="hrEmergencyName">Contact Name</label>
              <input
                id="hrEmergencyName"
                type="text"
                value={emergencyContactName}
                onChange={(event) =>
                  setEmergencyContactName(event.target.value)
                }
                placeholder="Enter contact name"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="hrEmergencyRelationship">Relationship</label>
              <input
                id="hrEmergencyRelationship"
                type="text"
                value={emergencyContactRelationship}
                onChange={(event) =>
                  setEmergencyContactRelationship(event.target.value)
                }
                placeholder="Example: Father, Mother, Spouse"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="hrEmergencyPhone">Contact Number</label>
              <input
                id="hrEmergencyPhone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(event) =>
                  setEmergencyContactPhone(event.target.value)
                }
                placeholder="Enter emergency contact number"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="hrEmergencyAddress">Contact Address</label>
              <input
                id="hrEmergencyAddress"
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

export default HRProfile;
