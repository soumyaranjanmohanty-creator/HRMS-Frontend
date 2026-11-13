import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/admin-profile.css";

function AdminProfile() {
  const [profile, setProfile] = useState(null);

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

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const authData = JSON.parse(
        localStorage.getItem("authData")
      );

      if (!authData || !authData.userId) {
        setError("User information not found. Please login again.");
        return;
      }

      const response = await api.get(
        `/users/${authData.userId}`
      );

      const data = response.data;

      setProfile(data);

      // Personal information
      setPersonalEmail(data.personalEmail || "");
      setPhoneNumber(data.phoneNumber || "");
      setAddress(data.address || "");

      // Emergency contact
      setEmergencyContactName(
        data.emergencyContactName || ""
      );

      setEmergencyContactRelationship(
        data.emergencyContactRelationship || ""
      );

      setEmergencyContactPhone(
        data.emergencyContactPhone || ""
      );

      setEmergencyContactAddress(
        data.emergencyContactAddress || ""
      );

    } catch (error) {
      console.error("Failed to load profile:", error);

      if (error.response?.data) {
        setError(error.response.data);
      } else {
        setError("Unable to load profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileSave = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      setSavingProfile(true);

      const response = await api.put(
        "/users/me/profile",
        {
          personalEmail,
          phoneNumber,
          address,
        }
      );

      setMessage(response.data);

      await loadProfile();

    } catch (error) {
      console.error("Profile update failed:", error);

      if (error.response?.data) {
        setError(error.response.data);
      } else {
        setError("Unable to update profile.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEmergencySave = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      setSavingEmergency(true);

      const response = await api.put(
        "/users/me/emergency-contact",
        {
          emergencyContactName,
          emergencyContactRelationship,
          emergencyContactPhone,
          emergencyContactAddress,
        }
      );

      setMessage(response.data);

      await loadProfile();

    } catch (error) {
      console.error("Emergency contact update failed:", error);

      if (error.response?.data) {
        setError(error.response.data);
      } else {
        setError("Unable to update emergency contact.");
      }
    } finally {
      setSavingEmergency(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-profile-page">
        <div className="profile-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="admin-profile-page">
        <div className="profile-error">
          {error || "Profile information not available."}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profile-page">

      {/* Header */}
      <header className="profile-page-header">
        <div>
          <p className="profile-header-label">
            ADMINISTRATION
          </p>

          <h1>My Profile</h1>

          <p className="profile-header-subtitle">
            View your account information and manage your personal
            and emergency contact details.
          </p>
        </div>

        <div className="profile-role-badge">
          ADMIN
        </div>
      </header>

      {/* Messages */}
      {message && (
        <div className="profile-message success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="profile-message error">
          {error}
        </div>
      )}

      {/* Account Information */}
      <section className="profile-section">

        <div className="profile-section-header">
          <div>
            <h2>Account Information</h2>
            <p>
              Your official workforce account information.
            </p>
          </div>
        </div>

        <div className="profile-grid">

          <div className="profile-field">
            <label>Employee ID</label>

            <div className="profile-readonly">
              {profile.id}
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

      {/* Personal Information */}
      <section className="profile-section">

        <div className="profile-section-header">
          <div>
            <h2>Personal Information</h2>

            <p>
              You can update your personal contact information.
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSave}>

          <div className="profile-grid">

            <div className="profile-field">
              <label htmlFor="personalEmail">
                Personal Email
              </label>

              <input
                id="personalEmail"
                type="email"
                value={personalEmail}
                onChange={(event) =>
                  setPersonalEmail(event.target.value)
                }
                placeholder="Enter personal email"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="phoneNumber">
                Phone Number
              </label>

              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(event) =>
                  setPhoneNumber(event.target.value)
                }
                placeholder="Enter phone number"
              />
            </div>

            <div className="profile-field profile-field-full">
              <label htmlFor="address">
                Address
              </label>

              <textarea
                id="address"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Enter address"
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
              {savingProfile
                ? "Saving..."
                : "Save Personal Information"}
            </button>
          </div>

        </form>

      </section>

      {/* Employment Information */}
      <section className="profile-section">

        <div className="profile-section-header">
          <div>
            <h2>Employment Information</h2>

            <p>
              Official employment information is managed by
              authorized administration.
            </p>
          </div>
        </div>

        <div className="profile-grid">

          <div className="profile-field">
            <label>Department</label>

            <div className="profile-readonly">
              {profile.departmentId ?? "—"}
              <span>🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Designation</label>

            <div className="profile-readonly">
              {profile.designationId ?? "—"}
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

            <div className="profile-status">
              {profile.status || "—"}
            </div>
          </div>

        </div>

      </section>

      {/* Reporting Authority */}
      <section className="profile-section">

        <div className="profile-section-header">
          <div>
            <h2>Reporting Authority</h2>

            <p>
              Reporting information provided by the workforce system.
            </p>
          </div>
        </div>

        <div className="profile-grid">

          <div className="profile-field">
            <label>Name</label>

            <div className="profile-readonly">
              {profile.reportingAuthorityName || "—"}
              <span>🔒</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Official Email</label>

            <div className="profile-readonly">
              {profile.reportingAuthorityEmail || "—"}
              <span>🔒</span>
            </div>
          </div>

        </div>

      </section>

      {/* Emergency Contact */}
      <section className="profile-section">

        <div className="profile-section-header">
          <div>
            <h2>Emergency Contact</h2>

            <p>
              Manage the emergency contact information associated
              with your account.
            </p>
          </div>
        </div>

        <form onSubmit={handleEmergencySave}>

          <div className="profile-grid">

            <div className="profile-field">
              <label htmlFor="emergencyContactName">
                Contact Name
              </label>

              <input
                id="emergencyContactName"
                type="text"
                value={emergencyContactName}
                onChange={(event) =>
                  setEmergencyContactName(event.target.value)
                }
                placeholder="Enter emergency contact name"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="emergencyContactRelationship">
                Relationship
              </label>

              <input
                id="emergencyContactRelationship"
                type="text"
                value={emergencyContactRelationship}
                onChange={(event) =>
                  setEmergencyContactRelationship(
                    event.target.value
                  )
                }
                placeholder="Example: Father, Mother, Spouse"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="emergencyContactPhone">
                Emergency Contact Number
              </label>

              <input
                id="emergencyContactPhone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(event) =>
                  setEmergencyContactPhone(event.target.value)
                }
                placeholder="Enter emergency contact number"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="emergencyContactAddress">
                Contact Address
              </label>

              <input
                id="emergencyContactAddress"
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
              {savingEmergency
                ? "Saving..."
                : "Save Emergency Contact"}
            </button>
          </div>

        </form>

      </section>

    </div>
  );
}

export default AdminProfile;