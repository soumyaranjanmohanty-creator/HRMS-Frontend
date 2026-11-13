import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/HRManagement.css";

function HRManagement() {
  const [activeTab, setActiveTab] = useState("accounts");

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    personalEmail: "",
    departmentId: "",
    designationId: "",
    joiningDate: "",
    employmentType: "",
    workLocation: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
    loadDesignations();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  };

  const loadDesignations = async () => {
    try {
      const response = await api.get("/designations");
      setDesignations(response.data);
    } catch (error) {
      console.error("Failed to load designations:", error);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateHR = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/register", {
        name: formData.name,
        email: formData.email,
        personalEmail: formData.personalEmail,
        role: "HR",
        departmentId: Number(formData.departmentId),
        designationId: Number(formData.designationId),
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType,
        workLocation: formData.workLocation,
      });

      setMessage(response.data?.message || "HR account created successfully.");

      setFormData({
        name: "",
        email: "",
        personalEmail: "",
        departmentId: "",
        designationId: "",
        joiningDate: "",
        employmentType: "",
        workLocation: "",
      });
    } catch (error) {
      console.error("Create HR error:", error);

      setError(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to create HR account.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-management-page">
      <div className="page-header">
        <div>
          <h1>HR Management</h1>
          <p>
            Create and manage Human Resources accounts and HR administration.
          </p>
        </div>
      </div>

      <div className="hr-tabs">
        <button
          type="button"
          className={activeTab === "accounts" ? "active" : ""}
          onClick={() => setActiveTab("accounts")}
        >
          HR Accounts
        </button>

        <button
          type="button"
          className={activeTab === "profiles" ? "active" : ""}
          onClick={() => setActiveTab("profiles")}
        >
          HR Profiles
        </button>

        <button
          type="button"
          className={activeTab === "security" ? "active" : ""}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>

        <button
          type="button"
          className={activeTab === "roleAction" ? "active" : ""}
          onClick={() => setActiveTab("roleAction")}
        >
          Role Action
        </button>
      </div>

      {activeTab === "accounts" && (
        <div className="hr-section">
          <div className="section-heading">
            <div>
              <h2>Create HR Account</h2>
              <p>
                Create a new HR account according to the ADMIN → HR hierarchy.
              </p>
            </div>
          </div>

          <form className="hr-form" onSubmit={handleCreateHR}>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Official Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter official email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Personal Email</label>
                <input
                  type="email"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleChange}
                  placeholder="Enter personal email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Joining Date</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Employment Type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select employment type</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="form-group">
                <label>Work Location</label>
                <input
                  type="text"
                  name="workLocation"
                  value={formData.workLocation}
                  onChange={handleChange}
                  placeholder="Enter work location"
                  required
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select department</option>

                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Designation</label>
                <select
                  name="designationId"
                  value={formData.designationId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select designation</option>

                  {designations.map((designation) => (
                    <option key={designation.id} value={designation.id}>
                      {designation.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {message && <div className="success-message">{message}</div>}

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create HR Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "profiles" && <HRProfileSection />}

      {activeTab === "security" && <HRSecuritySection />}

      {activeTab === "roleAction" && <RoleActionSection />}
    </div>
  );
}

function getDepartmentName(departments, departmentId) {
  return (
    departments.find(
      (department) => String(department.id) === String(departmentId),
    )?.name || "—"
  );
}

function getDesignationName(designations, designationId) {
  return (
    designations.find(
      (designation) => String(designation.id) === String(designationId),
    )?.name || "—"
  );
}

function HRProfileSection() {
  const [userId, setUserId] = useState("");
  const [hrUsers, setHrUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadHRUsers = async () => {
      try {
        const response = await api.get("/users/role/HR");
        setHrUsers(response.data);
      } catch (error) {
        console.error("Failed to load HR accounts:", error);
        setError("Failed to load HR accounts.");
      }
    };

    loadHRUsers();
  }, []);

  useEffect(() => {
    const loadDepartmentsAndDesignations = async () => {
      try {
        const [departmentResponse, designationResponse] = await Promise.all([
          api.get("/departments"),
          api.get("/designations"),
        ]);

        setDepartments(departmentResponse.data);
        setDesignations(designationResponse.data);
      } catch (error) {
        console.error("Failed to load departments or designations:", error);
      }
    };

    loadDepartmentsAndDesignations();
  }, []);

  const [editAccount, setEditAccount] = useState(false);
  const [editPersonal, setEditPersonal] = useState(false);
  const [editEmployment, setEditEmployment] = useState(false);
  const [editEmergency, setEditEmergency] = useState(false);

  const [accountData, setAccountData] = useState({
    name: "",
  });

  const [personalData, setPersonalData] = useState({
    personalEmail: "",
    phoneNumber: "",
    address: "",
  });

  const [employmentData, setEmploymentData] = useState({
    joiningDate: "",
    designationId: "",
  });

  const [emergencyData, setEmergencyData] = useState({
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    emergencyContactAddress: "",
  });

  const loadHRProfile = async (event) => {
    event.preventDefault();

    setProfile(null);
    setError("");
    setSuccess("");

    if (!userId) {
      setError("Please enter an HR User ID.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.get(`/users/${userId}`);

      if (response.data.role !== "HR") {
        setError("The selected User ID does not belong to an HR account.");
        return;
      }

      const data = response.data;

      setProfile(data);

      console.log("HR Profile:", data);
      console.log("Department ID:", data.departmentId);
      console.log("Departments:", departments);

      setAccountData({
        name: data.name || "",
      });

      setPersonalData({
        personalEmail: data.personalEmail || "",
        phoneNumber: data.phoneNumber || "",
        address: data.address || "",
      });

      setEmploymentData({
        joiningDate: data.joiningDate || "",
        designationId: data.designationId || "",
      });

      setEmergencyData({
        emergencyContactName: data.emergencyContactName || "",
        emergencyContactRelationship: data.emergencyContactRelationship || "",
        emergencyContactPhone: data.emergencyContactPhone || "",
        emergencyContactAddress: data.emergencyContactAddress || "",
      });
    } catch (error) {
      console.error("Failed to load HR profile:", error);

      setError(
        error.response?.data?.message ||
          (typeof error.response?.data === "string"
            ? error.response.data
            : `Request failed with status ${
                error.response?.status || "unknown"
              }`),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (event) => {
    const { name, value } = event.target;

    setAccountData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePersonalChange = (event) => {
    const { name, value } = event.target;

    setPersonalData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEmploymentChange = (event) => {
    const { name, value } = event.target;

    setEmploymentData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEmergencyChange = (event) => {
    const { name, value } = event.target;

    setEmergencyData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const updateAccountInformation = async () => {
    try {
      setError("");
      setSuccess("");

      await api.put(`/users/${profile.id}/profile`, {
        name: accountData.name,
      });

      const response = await api.get(`/users/${profile.id}`);

      setProfile(response.data);
      setAccountData({
        name: response.data.name || "",
      });

      setEditAccount(false);
      setSuccess("Account information updated successfully.");
    } catch (error) {
      console.error("Failed to update account information:", error);

      setError(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to update account information.",
      );
    }
  };

  const updatePersonalInformation = async () => {
    try {
      setError("");
      setSuccess("");

      await api.put(`/users/${profile.id}/profile`, {
        personalEmail: personalData.personalEmail,
        phoneNumber: personalData.phoneNumber,
        address: personalData.address,
      });

      const response = await api.get(`/users/${profile.id}`);

      setProfile(response.data);

      setPersonalData({
        personalEmail: response.data.personalEmail || "",
        phoneNumber: response.data.phoneNumber || "",
        address: response.data.address || "",
      });

      setEditPersonal(false);
      setSuccess("Personal information updated successfully.");
    } catch (error) {
      console.error("Failed to update personal information:", error);

      setError(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to update personal information.",
      );
    }
  };

  const updateEmploymentInformation = async () => {
    try {
      setError("");
      setSuccess("");

      await api.put(`/users/${profile.id}/profile`, {
        designationId: employmentData.designationId
          ? Number(employmentData.designationId)
          : null,
      });

      const response = await api.get(`/users/${profile.id}`);

      setProfile(response.data);

      setEmploymentData({
        joiningDate: response.data.joiningDate || "",
        designationId: response.data.designationId || "",
      });

      setEditEmployment(false);
      setSuccess("Employment information updated successfully.");
    } catch (error) {
      console.error("Failed to update employment information:", error);

      setError(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to update employment information.",
      );
    }
  };

  const updateEmergencyContact = async () => {
    try {
      setError("");
      setSuccess("");

      await api.put(`/users/${profile.id}/emergency-contact`, emergencyData);

      const response = await api.get(`/users/${profile.id}`);

      setProfile(response.data);

      setEmergencyData({
        emergencyContactName: response.data.emergencyContactName || "",
        emergencyContactRelationship:
          response.data.emergencyContactRelationship || "",
        emergencyContactPhone: response.data.emergencyContactPhone || "",
        emergencyContactAddress: response.data.emergencyContactAddress || "",
      });

      setEditEmergency(false);
      setSuccess("Emergency contact updated successfully.");
    } catch (error) {
      console.error("Failed to update emergency contact:", error);

      setError(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to update emergency contact.",
      );
    }
  };

  return (
    <div className="hr-section">
      {/* =========================================
          HEADER
          ========================================= */}

      <div className="section-heading">
        <div>
          <div className="profile-page-label">HR MANAGEMENT</div>

          <h2>HR Profile</h2>

          <p>
            View and manage HR account, personal, employment and emergency
            contact information.
          </p>
        </div>

        {profile && <div className="profile-role-badge">HR</div>}
      </div>

      {/* =========================================
          HR SEARCH
          ========================================= */}

      <form className="hr-profile-search" onSubmit={loadHRProfile}>
        <div className="form-group">
          <label>Select HR</label>

          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          >
            <option value="">Select HR</option>

            {hrUsers.map((hr) => (
              <option key={hr.id} value={hr.id}>
                {hr.name} — {hr.email}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "View HR Profile"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {success && <div className="success-message">{success}</div>}

      {profile && (
        <div className="hr-profile-page">
          {/* =========================================
              PROFILE HEADER
              ========================================= */}

          <div className="hr-profile-header">
            <div>
              <div className="hr-profile-label">HR ACCOUNT</div>

              <h3>{profile.name}</h3>

              <p>Employee ID: {profile.id}</p>
            </div>

            <span className={`status-badge ${profile.status?.toLowerCase()}`}>
              {profile.status}
            </span>
          </div>

          {/* =========================================
              ACCOUNT INFORMATION
              ========================================= */}

          <div className="hr-profile-card">
            <div className="hr-profile-card-header">
              <div>
                <h4>Account Information</h4>

                <p>Official HR account information.</p>
              </div>

              <button
                type="button"
                onClick={() => setEditAccount(!editAccount)}
              >
                {editAccount ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="hr-profile-form-grid">
              <div className="hr-profile-field">
                <label>Employee ID</label>

                <div className="hr-profile-input locked">
                  <span>{profile.id}</span>
                  <span className="lock-icon">🔒</span>
                </div>
              </div>

              <div className="hr-profile-field">
                <label>Full Name</label>

                {editAccount ? (
                  <input
                    type="text"
                    name="name"
                    value={accountData.name}
                    onChange={handleAccountChange}
                  />
                ) : (
                  <div className="hr-profile-input">
                    <span>{profile.name || "—"}</span>
                  </div>
                )}
              </div>

              <div className="hr-profile-field">
                <label>Official Email</label>

                <div className="hr-profile-input locked">
                  <span>{profile.email || "—"}</span>
                  <span className="lock-icon">🔒</span>
                </div>
              </div>

              <div className="hr-profile-field">
                <label>Role</label>

                <div className="hr-profile-input locked">
                  <span>{profile.role || "—"}</span>
                  <span className="lock-icon">🔒</span>
                </div>
              </div>

              <div className="hr-profile-field">
                <label>Account Status</label>

                <div className="hr-status-display">{profile.status || "—"}</div>
              </div>
            </div>

            {editAccount && (
              <div className="hr-profile-save-area">
                <button type="button" onClick={updateAccountInformation}>
                  Save Account Information
                </button>
              </div>
            )}
          </div>

          {/* =========================================
              PERSONAL INFORMATION
              ========================================= */}

          <div className="hr-profile-card">
            <div className="hr-profile-card-header">
              <div>
                <h4>Personal Information</h4>

                <p>Personal contact information of the HR.</p>
              </div>

              <button
                type="button"
                onClick={() => setEditPersonal(!editPersonal)}
              >
                {editPersonal ? "Cancel" : "Edit"}
              </button>
            </div>

            {editPersonal ? (
              <>
                <div className="hr-profile-form-grid">
                  <div className="hr-profile-field">
                    <label>Personal Email</label>

                    <input
                      type="email"
                      name="personalEmail"
                      value={personalData.personalEmail}
                      onChange={handlePersonalChange}
                    />
                  </div>

                  <div className="hr-profile-field">
                    <label>Phone Number</label>

                    <input
                      type="text"
                      name="phoneNumber"
                      value={personalData.phoneNumber}
                      onChange={handlePersonalChange}
                    />
                  </div>

                  <div className="hr-profile-field full-width">
                    <label>Address</label>

                    <textarea
                      name="address"
                      value={personalData.address}
                      onChange={handlePersonalChange}
                      rows="3"
                    />
                  </div>
                </div>

                <div className="hr-profile-save-area">
                  <button type="button" onClick={updatePersonalInformation}>
                    Save Personal Information
                  </button>
                </div>
              </>
            ) : (
              <div className="hr-profile-form-grid">
                <div className="hr-profile-field">
                  <label>Personal Email</label>

                  <div className="hr-profile-input">
                    <span>{profile.personalEmail || "—"}</span>
                  </div>
                </div>

                <div className="hr-profile-field">
                  <label>Phone Number</label>

                  <div className="hr-profile-input">
                    <span>{profile.phoneNumber || "—"}</span>
                  </div>
                </div>

                <div className="hr-profile-field full-width">
                  <label>Address</label>

                  <div className="hr-profile-input large">
                    <span>{profile.address || "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =========================================
              EMPLOYMENT INFORMATION
              ========================================= */}

          <div className="hr-profile-card">
            <div className="hr-profile-card-header">
              <div>
                <h4>Employment Information</h4>

                <p>
                  Official employment information managed by authorized
                  administration.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditEmployment(!editEmployment)}
              >
                {editEmployment ? "Cancel" : "Edit"}
              </button>
            </div>

            {editEmployment ? (
              <>
                <div className="hr-profile-form-grid">
                  <div className="hr-profile-field">
                    <label>Joining Date</label>

                    <div className="hr-profile-input locked">
                      <span>{profile.joiningDate || "—"}</span>
                      <span className="lock-icon">🔒</span>
                    </div>
                  </div>

                  <div className="hr-profile-field">
                    <label>Designation</label>

                    <select
                      name="designationId"
                      value={employmentData.designationId}
                      onChange={handleEmploymentChange}
                    >
                      <option value="">Select designation</option>

                      {designations.map((designation) => (
                        <option key={designation.id} value={designation.id}>
                          {designation.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="hr-profile-field">
                    <label>Employment Type</label>

                    <div className="hr-profile-input locked">
                      <span>{profile.employmentType || "—"}</span>
                      <span className="lock-icon">🔒</span>
                    </div>
                  </div>

                  <div className="hr-profile-field">
                    <label>Work Location</label>

                    <div className="hr-profile-input locked">
                      <span>{profile.workLocation || "—"}</span>
                      <span className="lock-icon">🔒</span>
                    </div>
                  </div>

                  <div className="hr-profile-field">
                    <label>Department</label>

                    <div className="hr-profile-input locked">
                      <span>
                        {departments.find(
                          (department) =>
                            String(department.id) ===
                            String(profile.departmentId),
                        )?.name || "—"}
                      </span>

                      <span className="lock-icon">🔒</span>
                    </div>
                  </div>
                </div>

                <div className="hr-profile-save-area">
                  <button type="button" onClick={updateEmploymentInformation}>
                    Save Employment Information
                  </button>
                </div>
              </>
            ) : (
              <div className="hr-profile-form-grid">
                <div className="hr-profile-field">
                  <label>Department</label>

                  <div className="hr-profile-input locked">
                    <span>
                      {departments.find(
                        (department) =>
                          String(department.id) ===
                          String(profile.departmentId),
                      )?.name || "—"}
                    </span>

                    <span className="lock-icon">🔒</span>
                  </div>
                </div>

                <div className="hr-profile-field">
                  <label>Designation</label>

                  <div className="hr-profile-input">
                    <span>
                      {designations.find(
                        (designation) =>
                          String(designation.id) ===
                          String(profile.designationId),
                      )?.name || "—"}
                    </span>
                  </div>
                </div>

                <div className="hr-profile-field">
                  <label>Joining Date</label>

                  <div className="hr-profile-input locked">
                    <span>{profile.joiningDate || "—"}</span>

                    <span className="lock-icon">🔒</span>
                  </div>
                </div>

                <div className="hr-profile-field">
                  <label>Employment Type</label>

                  <div className="hr-profile-input locked">
                    <span>{profile.employmentType || "—"}</span>

                    <span className="lock-icon">🔒</span>
                  </div>
                </div>

                <div className="hr-profile-field">
                  <label>Work Location</label>

                  <div className="hr-profile-input locked">
                    <span>{profile.workLocation || "—"}</span>

                    <span className="lock-icon">🔒</span>
                  </div>
                </div>

                <div className="hr-profile-field">
                  <label>Account Status</label>

                  <div className="hr-status-display">
                    {profile.status || "—"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =========================================
              REPORTING AUTHORITY
              ========================================= */}

          <div className="hr-profile-card">
            <div className="hr-profile-card-header">
              <div>
                <h4>Reporting Authority</h4>

                <p>Reporting information provided by the workforce system.</p>
              </div>
            </div>

            <div className="hr-profile-form-grid">
              <div className="hr-profile-field">
                <label>Name</label>

                <div className="hr-profile-input locked">
                  <span>{profile.reportingAuthorityName || "—"}</span>

                  <span className="lock-icon">🔒</span>
                </div>
              </div>

              <div className="hr-profile-field">
                <label>Official Email</label>

                <div className="hr-profile-input locked">
                  <span>{profile.reportingAuthorityEmail || "—"}</span>

                  <span className="lock-icon">🔒</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================
              EMERGENCY CONTACT
              ========================================= */}

          <div className="hr-profile-card">
            <div className="hr-profile-card-header">
              <div>
                <h4>Emergency Contact</h4>

                <p>
                  Manage the emergency contact information associated with this
                  HR account.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditEmergency(!editEmergency)}
              >
                {editEmergency ? "Cancel" : "Edit"}
              </button>
            </div>

            {editEmergency ? (
              <>
                <div className="hr-profile-form-grid">
                  <div className="hr-profile-field">
                    <label>Contact Name</label>

                    <input
                      type="text"
                      name="emergencyContactName"
                      value={emergencyData.emergencyContactName}
                      onChange={handleEmergencyChange}
                    />
                  </div>

                  <div className="hr-profile-field">
                    <label>Relationship</label>

                    <input
                      type="text"
                      name="emergencyContactRelationship"
                      value={emergencyData.emergencyContactRelationship}
                      onChange={handleEmergencyChange}
                    />
                  </div>

                  <div className="hr-profile-field">
                    <label>Emergency Contact Number</label>

                    <input
                      type="text"
                      name="emergencyContactPhone"
                      value={emergencyData.emergencyContactPhone}
                      onChange={handleEmergencyChange}
                    />
                  </div>

                  <div className="hr-profile-field">
                    <label>Contact Address</label>

                    <input
                      type="text"
                      name="emergencyContactAddress"
                      value={emergencyData.emergencyContactAddress}
                      onChange={handleEmergencyChange}
                    />
                  </div>
                </div>

                <div className="hr-profile-save-area">
                  <button type="button" onClick={updateEmergencyContact}>
                    Save Emergency Contact
                  </button>
                </div>
              </>
            ) : (
              <div className="hr-profile-form-grid">
                <div className="hr-profile-field">
                  <label>Contact Name</label>

                  <div className="hr-profile-input">
                    <span>{profile.emergencyContactName || "—"}</span>
                  </div>
                </div>

                <div className="hr-profile-field">
                  <label>Relationship</label>

                  <div className="hr-profile-input">
                    <span>{profile.emergencyContactRelationship || "—"}</span>
                  </div>
                </div>

                <div className="hr-profile-field">
                  <label>Emergency Contact Number</label>

                  <div className="hr-profile-input">
                    <span>{profile.emergencyContactPhone || "—"}</span>
                  </div>
                </div>

                <div className="hr-profile-field">
                  <label>Contact Address</label>

                  <div className="hr-profile-input">
                    <span>{profile.emergencyContactAddress || "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HRSecuritySection() {
  const [userId, setUserId] = useState("");
  const [hrUsers, setHrUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHRUsers = async () => {
      try {
        const response = await api.get("/users/role/HR");
        setHrUsers(response.data);
      } catch (error) {
        console.error("Failed to load HR accounts:", error);
        setError("Failed to load HR accounts.");
      }
    };

    loadHRUsers();
  }, []);

  const loadHRSecurity = async (event) => {
    event.preventDefault();

    setProfile(null);
    setError("");

    if (!userId) {
      setError("Please enter an HR User ID.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.get(`/users/${userId}`);

      if (response.data.role !== "HR") {
        setError("The selected User ID does not belong to an HR account.");
        return;
      }

      setProfile(response.data);
    } catch (error) {
      console.error("Failed to load HR security information:", error);

      setError(
        error.response?.data?.message ||
          error.response?.data ||
          `Request failed with status ${error.response?.status || "unknown"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const [unlockRequests, setUnlockRequests] = useState([]);

  const loadUnlockRequests = async () => {
    try {
      const response = await api.get("/unlock-requests/ADMIN");
      setUnlockRequests(response.data);
    } catch (error) {
      console.error("Failed to load unlock requests:", error);
    }
  };

  const approveUnlockRequest = async (requestId) => {
    try {
      await api.post(`/unlock-requests/${requestId}/approve`);
      alert("Account unlocked successfully.");
      loadUnlockRequests();
    } catch (error) {
      console.error("Failed to approve unlock request:", error);
      alert("Failed to unlock account.");
    }
  };

  useEffect(() => {
    loadUnlockRequests();
  }, []);

  return (
    <div className="hr-section">
      <div className="section-heading">
        <div>
          <div className="profile-page-label">HR MANAGEMENT</div>

          <h2>HR Security</h2>

          <p>View HR account status and security information.</p>
        </div>

        {profile && <div className="profile-role-badge">HR</div>}
      </div>

      <form className="hr-profile-search" onSubmit={loadHRSecurity}>
        <div className="form-group">
          <label>Select HR</label>

          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          >
            <option value="">Select HR</option>

            {hrUsers.map((hr) => (
              <option key={hr.id} value={hr.id}>
                {hr.name} — {hr.email}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "View Security"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="hr-profile-card">
        <h4>Unlock Requests</h4>

        {unlockRequests.length === 0 ? (
          <p>No unlock requests found.</p>
        ) : (
          unlockRequests.map((request) => (
            <div key={request.id}>
              <p>Request ID: {request.id}</p>
              <p>Requester Email: {request.requesterEmail}</p>
              <p>Status: {request.status}</p>
              <p>Reason: {request.description}</p>
              {request.status === "OPEN" && (
                <button
                  type="button"
                  onClick={() => approveUnlockRequest(request.id)}
                >
                  Approve Unlock
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {profile && (
        <div className="hr-profile-page">
          <div className="hr-profile-header">
            <div>
              <div className="hr-profile-label">HR SECURITY</div>

              <h3>{profile.name || "—"}</h3>

              <p>Employee ID: {profile.id}</p>
            </div>

            <span className={`status-badge ${profile.status?.toLowerCase()}`}>
              {profile.status || "—"}
            </span>
          </div>

          <div className="hr-profile-card">
            <div className="hr-profile-card-header">
              <div>
                <h4>Account Security</h4>

                <p>Current security-related account information.</p>
              </div>
            </div>

            <div className="hr-profile-form-grid">
              <div className="hr-profile-field">
                <label>Employee ID</label>

                <div className="hr-profile-input locked">
                  <span>{profile.id}</span>
                  <span className="lock-icon">🔒</span>
                </div>
              </div>

              <div className="hr-profile-field">
                <label>Full Name</label>

                <div className="hr-profile-input locked">
                  <span>{profile.name || "—"}</span>
                  <span className="lock-icon">🔒</span>
                </div>
              </div>

              <div className="hr-profile-field">
                <label>Official Email</label>

                <div className="hr-profile-input locked">
                  <span>{profile.email || "—"}</span>
                  <span className="lock-icon">🔒</span>
                </div>
              </div>

              <div className="hr-profile-field">
                <label>Role</label>

                <div className="hr-profile-input locked">
                  <span>{profile.role || "—"}</span>
                  <span className="lock-icon">🔒</span>
                </div>
              </div>

              <div className="hr-profile-field">
                <label>Account Status</label>

                <div className="hr-status-display">{profile.status || "—"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleActionSection() {
  const [managers, setManagers] = useState([]);
  const [hrUsers, setHrUsers] = useState([]);

  const [managerId, setManagerId] = useState("");
  const [hrId, setHrId] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    setError("");

    try {
      const [managerResponse, hrResponse] = await Promise.all([
        api.get("/users/role/MANAGER"),
        api.get("/users/role/HR"),
      ]);

      setManagers(managerResponse.data);
      setHrUsers(hrResponse.data);
    } catch (error) {
      console.error("Failed to load Manager and HR accounts:", error);

      setError(
        error.response?.data?.message ||
          (typeof error.response?.data === "string"
            ? error.response.data
            : "Failed to load Manager and HR accounts."),
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedManager = managers.find(
    (manager) => String(manager.id) === String(managerId),
  );

  const handleAssignHR = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!managerId || !hrId) {
      setError("Please select both a Manager and a Reporting HR.");
      return;
    }

    if (String(managerId) === String(hrId)) {
      setError("Manager and HR must be different accounts.");
      return;
    }

    const selectedHR = hrUsers.find((hr) => String(hr.id) === String(hrId));

    const currentHRId = selectedManager?.reportingAuthorityId;

    if (currentHRId != null && String(currentHRId) === String(hrId)) {
      setError("This Manager is already assigned to the selected HR.");
      return;
    }

    const confirmed = window.confirm(
      `Assign ${selectedManager?.name || "this Manager"} to ${
        selectedHR?.name || "the selected HR"
      }?`,
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      const response = await api.put(`/users/${managerId}/assign-hr/${hrId}`);

      setSuccess(
        typeof response.data === "string"
          ? response.data
          : "Manager assigned to HR successfully.",
      );

      await loadAccounts();
    } catch (error) {
      console.error("Failed to assign Manager to HR:", error);

      setError(
        error.response?.data?.message ||
          (typeof error.response?.data === "string"
            ? error.response.data
            : "Failed to assign Manager to HR."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hr-section">
      <div className="section-heading">
        <div>
          <div className="profile-page-label">HR MANAGEMENT</div>

          <h2>Manager Reporting Authority</h2>

          <p>
            Assign or reassign Managers to the HR responsible for their
            reporting hierarchy.
          </p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <p>Loading Manager and HR accounts...</p>
      ) : (
        <form className="hr-form" onSubmit={handleAssignHR}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="role-action-manager">Select Manager</label>

              <select
                id="role-action-manager"
                value={managerId}
                onChange={(event) => {
                  setManagerId(event.target.value);
                  setSuccess("");
                  setError("");
                }}
                required
              >
                <option value="">Select Manager</option>

                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} — {manager.email} (ID: {manager.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="role-action-hr">Select Reporting HR</label>

              <select
                id="role-action-hr"
                value={hrId}
                onChange={(event) => {
                  setHrId(event.target.value);
                  setSuccess("");
                  setError("");
                }}
                required
              >
                <option value="">Select Reporting HR</option>

                {hrUsers.map((hr) => (
                  <option key={hr.id} value={hr.id}>
                    {hr.name} — {hr.email} (ID: {hr.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedManager && (
            <div className="hr-profile-card" style={{ marginTop: "24px" }}>
              <h4>Selected Manager</h4>

              <p>
                <strong>Name:</strong> {selectedManager.name}
              </p>

              <p>
                <strong>Employee ID:</strong> {selectedManager.id}
              </p>

              <p>
                <strong>Email:</strong> {selectedManager.email}
              </p>

              <p>
                <strong>Current Reporting HR:</strong>{" "}
                {selectedManager.reportingAuthorityName || "Not assigned"}
              </p>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={
                saving ||
                loading ||
                managers.length === 0 ||
                hrUsers.length === 0
              }
            >
              {saving ? "Saving Assignment..." : "Assign / Reassign HR"}
            </button>
          </div>

          {managers.length === 0 && <p>No Manager accounts are available.</p>}

          {hrUsers.length === 0 && <p>No HR accounts are available.</p>}
        </form>
      )}
    </div>
  );
}

export default HRManagement;
