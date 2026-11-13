import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/ManagerManagement.css";

function ManagerManagement() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedManager, setSelectedManager] = useState(null);
  const [profileManagerId, setProfileManagerId] = useState("");
  const [editingManager, setEditingManager] = useState(false);
  const [editManagerData, setEditManagerData] = useState({});
  const [editAccount, setEditAccount] = useState(false);
  const [editPersonal, setEditPersonal] = useState(false);
  const [editEmployment, setEditEmployment] = useState(false);
  const [editEmergency, setEditEmergency] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedAssignEmployeeId, setSelectedAssignEmployeeId] = useState("");
  const [selectedAssignManagerId, setSelectedAssignManagerId] = useState("");

  const handlePromoteEmployee = async () => {
    setError("");
    setSuccess("");

    if (!selectedEmployeeId) {
      setError("Please select an employee.");
      return;
    }

    try {
      await api.post(`/users/${selectedEmployeeId}/promote-to-manager`);

      setSuccess("Employee promoted to Manager successfully.");

      const response = await api.get("/users/role/MANAGER");
      setManagers(response.data);

      const employeeResponse = await api.get("/users/role/EMPLOYEE");
      setEmployees(employeeResponse.data);

      setSelectedEmployeeId("");
    } catch (error) {
      console.error("Failed to promote employee:", error);
      setError("Failed to promote employee.");
    }
  };

  const handleDemoteManager = async () => {
    setError("");
    setSuccess("");

    if (!selectedManagerId) {
      setError("Please select a manager.");
      return;
    }

    try {
      await api.post(`/users/${selectedManagerId}/demote-to-employee`);

      setSuccess("Manager demoted to Employee successfully.");

      const response = await api.get("/users/role/MANAGER");
      setManagers(response.data);

      const employeeResponse = await api.get("/users/role/EMPLOYEE");
      setEmployees(employeeResponse.data);

      setSelectedManagerId("");
    } catch (error) {
      console.error("Failed to demote manager:", error);
      setError("Failed to demote manager.");
    }
  };

  const handleAssignManager = async () => {
    setError("");
    setSuccess("");

    if (!selectedAssignEmployeeId) {
      setError("Please select an employee.");
      return;
    }

    if (!selectedAssignManagerId) {
      setError("Please select a manager.");
      return;
    }

    try {
      await api.post(
        `/users/${selectedAssignEmployeeId}/assign-manager/${selectedAssignManagerId}`,
      );

      setSuccess("Manager assigned to Employee successfully.");

      const employeeResponse = await api.get("/users/role/EMPLOYEE");
      setEmployees(employeeResponse.data);

      setSelectedAssignEmployeeId("");
      setSelectedAssignManagerId("");
    } catch (error) {
      console.error("Failed to assign manager:", error);
      setError("Failed to assign manager.");
    }
  };

  const handleViewManager = async (managerId) => {
    setError("");

    try {
      const response = await api.get(`/users/${managerId}`);

      setSelectedManager(response.data);

      setEditManagerData({
        name: response.data.name || "",
        personalEmail: response.data.personalEmail || "",
        phoneNumber: response.data.phoneNumber || "",
        address: response.data.address || "",
        joiningDate: response.data.joiningDate || "",
        status: response.data.status || "",
        departmentId: response.data.departmentId || "",
        designationId: response.data.designationId || "",
        emergencyContactName: response.data.emergencyContactName || "",
        emergencyContactRelationship:
          response.data.emergencyContactRelationship || "",
        emergencyContactPhone: response.data.emergencyContactPhone || "",
        emergencyContactAddress: response.data.emergencyContactAddress || "",
      });
    } catch (error) {
      console.error("Failed to load manager profile:", error);
      setError("Failed to load manager profile.");
    }
  };

  const handleSaveAccount = async () => {
    setError("");
    setSuccess("");

    try {
      await api.put(`/users/${selectedManager.id}/profile`, {
        name: editManagerData.name,
      });

      const response = await api.get(`/users/${selectedManager.id}`);

      setSelectedManager(response.data);

      setEditManagerData({
        ...editManagerData,
        name: response.data.name || "",
      });

      setEditAccount(false);
      setSuccess("Account information updated successfully.");
    } catch (error) {
      console.error("Failed to update account information:", error);
      setError("Failed to update account information.");
    }
  };

  const handleSavePersonal = async () => {
    setError("");
    setSuccess("");

    try {
      await api.put(`/users/${selectedManager.id}/profile`, {
        personalEmail: editManagerData.personalEmail,
        phoneNumber: editManagerData.phoneNumber,
        address: editManagerData.address,
      });

      const response = await api.get(`/users/${selectedManager.id}`);

      setSelectedManager({
        ...response.data,
        personalEmail: editManagerData.personalEmail,
        phoneNumber: editManagerData.phoneNumber,
        address: editManagerData.address,
      });

      setEditManagerData({
        ...editManagerData,
        personalEmail: editManagerData.personalEmail,
        phoneNumber: editManagerData.phoneNumber,
        address: editManagerData.address,
      });

      setEditPersonal(false);
      setSuccess("Personal information updated successfully.");
    } catch (error) {
      console.error("Failed to update personal information:", error);
      setError("Failed to update personal information.");
    }
  };

  const handleSaveEmployment = async () => {
    setError("");
    setSuccess("");

    try {
      await api.put(`/users/${selectedManager.id}/profile`, {
        joiningDate: editManagerData.joiningDate,
      });

      if (editManagerData.departmentId) {
        await api.put(
          `/users/${selectedManager.id}/department/${editManagerData.departmentId}`,
        );
      }

      if (editManagerData.designationId) {
        await api.put(
          `/users/${selectedManager.id}/designation/${editManagerData.designationId}`,
        );
      }

      const response = await api.get(`/users/${selectedManager.id}`);

      setSelectedManager({
        ...response.data,
        personalEmail: editManagerData.personalEmail,
        phoneNumber: editManagerData.phoneNumber,
        address: editManagerData.address,
      });

      setEditManagerData({
        ...editManagerData,
        joiningDate: response.data.joiningDate || "",
        departmentId: response.data.departmentId || "",
        designationId: response.data.designationId || "",
      });

      setEditEmployment(false);
      setSuccess("Employment information updated successfully.");
    } catch (error) {
      console.error("Failed to update employment information:", error);
      setError("Failed to update employment information.");
    }
  };

  const handleSaveEmergency = async () => {
    setError("");
    setSuccess("");

    try {
      await api.put(`/users/${selectedManager.id}/emergency-contact`, {
        emergencyContactName: editManagerData.emergencyContactName,
        emergencyContactRelationship:
          editManagerData.emergencyContactRelationship,
        emergencyContactPhone: editManagerData.emergencyContactPhone,
        emergencyContactAddress: editManagerData.emergencyContactAddress,
      });

      const response = await api.get(`/users/${selectedManager.id}`);

      setSelectedManager({
        ...response.data,
        personalEmail: editManagerData.personalEmail,
        phoneNumber: editManagerData.phoneNumber,
        address: editManagerData.address,
      });

      setEditManagerData({
        ...editManagerData,
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
      setError("Failed to update emergency contact.");
    }
  };

  useEffect(() => {
    const loadManagers = async () => {
      const loadDepartments = async () => {
        try {
          const response = await api.get("/departments");
          setDepartments(response.data);
        } catch (error) {
          console.error("Failed to load departments:", error);
        }
      };

      const loadEmployees = async () => {
        try {
          const response = await api.get("/users/role/EMPLOYEE");
          setEmployees(response.data);
        } catch (error) {
          console.error("Failed to load employee accounts:", error);
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

      loadDepartments();
      loadDesignations();
      loadEmployees();

      setLoading(true);
      setError("");

      try {
        const response = await api.get("/users/role/MANAGER");
        setManagers(response.data);
      } catch (error) {
        console.error("Failed to load manager accounts:", error);
        setError("Failed to load manager accounts.");
      } finally {
        setLoading(false);
      }
    };

    loadManagers();
  }, []);
  return (
    <div className="manager-management">
      <div className="page-header">
        <h1>Manager Management</h1>
        <p>Manage manager accounts, profiles and role responsibilities.</p>
      </div>

      <div className="manager-tabs">
        <button
          className={activeTab === "accounts" ? "active" : ""}
          onClick={() => setActiveTab("accounts")}
        >
          Manager Accounts
        </button>

        <button
          className={activeTab === "profiles" ? "active" : ""}
          onClick={() => setActiveTab("profiles")}
        >
          Manager Profiles
        </button>

        <button
          className={activeTab === "actions" ? "active" : ""}
          onClick={() => setActiveTab("actions")}
        >
          Role Actions
        </button>
      </div>

      {activeTab === "accounts" && (
        <div className="manager-section">
          <h2>Manager Accounts</h2>

          {!loading && !error && managers.length > 0 && (
            <table className="manager-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Official Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {managers.map((manager) => (
                  <tr key={manager.id}>
                    <td>{manager.id}</td>
                    <td>{manager.name}</td>
                    <td>{manager.email}</td>
                    <td>{manager.department?.name || "-"}</td>
                    <td>{manager.designation?.name || "-"}</td>
                    <td>{manager.status || "-"}</td>
                    <td>
                      <button onClick={() => handleViewManager(manager.id)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {loading && <p>Loading manager accounts...</p>}

          {error && <p>{error}</p>}
          {success && <p>{success}</p>}

          {!loading && !error && managers.length === 0 && (
            <p>No manager accounts found.</p>
          )}

          {selectedManager && (
            <div className="manager-profile-card">
              <h3>Manager Profile</h3>
              <p>
                <strong>ID:</strong> {selectedManager.id}
              </p>
              <p>
                <strong>Name:</strong> {selectedManager.name}
              </p>
              <p>
                <strong>Official Email:</strong> {selectedManager.email}
              </p>
              <p>
                <strong>Role:</strong> {selectedManager.role}
              </p>
              <p>
                <strong>Status:</strong> {selectedManager.status}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "profiles" && (
        <div className="manager-section">
          <h2>Manager Profiles</h2>

          <div className="manager-profile-search">
            <div className="form-group">
              <label>Select Manager</label>
              <select
                value={profileManagerId}
                onChange={(event) => setProfileManagerId(event.target.value)}
              >
                <option value="">Select Manager</option>

                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} — {manager.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="manager-profile-view-button"
            disabled={!profileManagerId}
            onClick={() => handleViewManager(profileManagerId)}
          >
            View Manager Profile
          </button>
          {selectedManager && (
            <div className="manager-profile-card">
              {success && (
                <div className="manager-success-notification">
                  <span className="manager-success-icon">✓</span>
                  <span>{success}</span>
                </div>
              )}
              <div className="manager-profile-section">
                <div className="manager-profile-card-header">
                  <div>
                    <h3>Account Information</h3>
                    <p>Manager account information.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditAccount(!editAccount)}
                  >
                    {editAccount ? "Cancel" : "Edit"}
                  </button>
                </div>

                <div className="manager-profile-grid">
                  <div className="manager-profile-field">
                    <label>User ID</label>
                    <div className="manager-profile-input locked">
                      <span>{selectedManager.id}</span>
                      <span className="manager-profile-lock">🔒</span>
                    </div>
                  </div>

                  <div className="manager-profile-field">
                    <label>Full Name</label>

                    {editAccount ? (
                      <input
                        type="text"
                        value={editManagerData.name}
                        onChange={(event) =>
                          setEditManagerData({
                            ...editManagerData,
                            name: event.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="manager-profile-input">
                        <span>{selectedManager.name || "—"}</span>
                      </div>
                    )}
                  </div>

                  <div className="manager-profile-field">
                    <label>Official Email</label>
                    <div className="manager-profile-input locked">
                      <span>{selectedManager.email || "—"}</span>
                      <span className="manager-profile-lock">🔒</span>
                    </div>
                  </div>

                  <div className="manager-profile-field">
                    <label>Role</label>
                    <div className="manager-profile-input locked">
                      <span>{selectedManager.role || "—"}</span>
                      <span className="manager-profile-lock">🔒</span>
                    </div>
                  </div>

                  <div className="manager-profile-field">
                    <label>Account Status</label>
                    <div className="manager-status-display">
                      {selectedManager.status || "—"}
                    </div>
                  </div>
                </div>

                {editAccount && (
                  <div className="manager-profile-save-area">
                    <button type="button" onClick={handleSaveAccount}>
                      Save Account Information
                    </button>
                  </div>
                )}
              </div>

              <div className="manager-profile-section">
                <div className="manager-profile-card-header">
                  <div>
                    <h3>Personal Information</h3>
                    <p>Personal contact information of the manager.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!editPersonal) {
                        setEditManagerData({
                          ...editManagerData,
                          personalEmail: selectedManager.personalEmail || "",
                          phoneNumber: selectedManager.phoneNumber || "",
                          address: selectedManager.address || "",
                        });
                      }

                      setEditPersonal(!editPersonal);
                    }}
                  >
                    {editPersonal ? "Cancel" : "Edit"}
                  </button>
                </div>

                {editPersonal ? (
                  <div className="manager-profile-grid">
                    <div className="manager-profile-field">
                      <label>Personal Email</label>
                      <input
                        type="email"
                        value={editManagerData.personalEmail}
                        onChange={(event) =>
                          setEditManagerData({
                            ...editManagerData,
                            personalEmail: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="manager-profile-field">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        value={editManagerData.phoneNumber}
                        onChange={(event) =>
                          setEditManagerData({
                            ...editManagerData,
                            phoneNumber: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="manager-profile-field">
                      <label>Address</label>
                      <textarea
                        value={editManagerData.address}
                        onChange={(event) =>
                          setEditManagerData({
                            ...editManagerData,
                            address: event.target.value,
                          })
                        }
                        rows="3"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="manager-profile-grid">
                    <div className="manager-profile-field">
                      <label>Personal Email</label>
                      <div className="manager-profile-input">
                        <span>{selectedManager.personalEmail || "—"}</span>
                      </div>
                    </div>

                    <div className="manager-profile-field">
                      <label>Phone Number</label>
                      <div className="manager-profile-input">
                        <span>{selectedManager.phoneNumber || "—"}</span>
                      </div>
                    </div>

                    <div className="manager-profile-field">
                      <label>Address</label>
                      <div className="manager-profile-input">
                        <span>{selectedManager.address || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {editPersonal && (
                  <div className="manager-profile-save-area">
                    <button type="button" onClick={handleSavePersonal}>
                      Save Personal Information
                    </button>
                  </div>
                )}
              </div>

              <div className="manager-profile-section">
                <div className="manager-profile-card-header">
                  <div>
                    <h3>Employment Information</h3>
                    <p>Employment details of the manager.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditEmployment(!editEmployment)}
                  >
                    {editEmployment ? "Cancel" : "Edit"}
                  </button>
                </div>

                {editEmployment ? (
                  <div className="manager-profile-grid">
                    {/* Joining Date - Locked */}
                    <div className="manager-profile-field">
                      <label>Joining Date</label>
                      <div className="manager-profile-input locked">
                        <span>{selectedManager.joiningDate || "-"}</span>
                        <span className="manager-profile-lock">🔒</span>
                      </div>
                    </div>

                    {/* Department - Editable */}
                    <div className="manager-profile-field">
                      <label>Department</label>
                      <select
                        value={editManagerData.departmentId}
                        onChange={(event) =>
                          setEditManagerData({
                            ...editManagerData,
                            departmentId: event.target.value,
                          })
                        }
                      >
                        <option value="">Select Department</option>

                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Designation - Editable */}
                    <div className="manager-profile-field">
                      <label>Designation</label>
                      <select
                        value={editManagerData.designationId}
                        onChange={(event) =>
                          setEditManagerData({
                            ...editManagerData,
                            designationId: event.target.value,
                          })
                        }
                      >
                        <option value="">Select Designation</option>

                        {designations.map((designation) => (
                          <option key={designation.id} value={designation.id}>
                            {designation.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Employment Type - Locked */}
                    <div className="manager-profile-field">
                      <label>Employment Type</label>
                      <div className="manager-profile-input locked">
                        <span>{selectedManager.employmentType || "-"}</span>
                        <span className="manager-profile-lock">🔒</span>
                      </div>
                    </div>

                    {/* Work Location - Locked */}
                    <div className="manager-profile-field">
                      <label>Work Location</label>
                      <div className="manager-profile-input locked">
                        <span>{selectedManager.workLocation || "-"}</span>
                        <span className="manager-profile-lock">🔒</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="manager-profile-grid">
                    {/* Joining Date */}
                    <div className="manager-profile-field">
                      <label>Joining Date</label>
                      <div className="manager-profile-input locked">
                        <span>{selectedManager.joiningDate || "-"}</span>
                        <span className="manager-profile-lock">🔒</span>
                      </div>
                    </div>

                    {/* Department */}
                    <div className="manager-profile-field">
                      <label>Department</label>
                      <div className="manager-profile-input">
                        <span>
                          {departments.find(
                            (department) =>
                              String(department.id) ===
                              String(selectedManager.departmentId),
                          )?.name || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Designation */}
                    <div className="manager-profile-field">
                      <label>Designation</label>
                      <div className="manager-profile-input">
                        <span>
                          {designations.find(
                            (designation) =>
                              String(designation.id) ===
                              String(selectedManager.designationId),
                          )?.name || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Employment Type */}
                    <div className="manager-profile-field">
                      <label>Employment Type</label>
                      <div className="manager-profile-input locked">
                        <span>{selectedManager.employmentType || "-"}</span>
                        <span className="manager-profile-lock">🔒</span>
                      </div>
                    </div>

                    {/* Work Location */}
                    <div className="manager-profile-field">
                      <label>Work Location</label>
                      <div className="manager-profile-input locked">
                        <span>{selectedManager.workLocation || "-"}</span>
                        <span className="manager-profile-lock">🔒</span>
                      </div>
                    </div>
                  </div>
                )}

                {editEmployment && (
                  <div className="manager-profile-save-area">
                    <button type="button" onClick={handleSaveEmployment}>
                      Save Employment Information
                    </button>
                  </div>
                )}
              </div>

              <div className="manager-profile-section">
                <div className="manager-profile-card-header">
                  <div>
                    <h3>Reporting Authority</h3>
                    <p>Reporting authority details of the manager.</p>
                  </div>
                </div>

                <div className="manager-profile-grid">
                  <div className="manager-profile-field">
                    <label>Reporting Authority Name</label>
                    <div className="manager-profile-input locked">
                      <span>
                        {selectedManager.reportingAuthorityName || "-"}
                      </span>
                      <span className="manager-profile-lock">🔒</span>
                    </div>
                  </div>

                  <div className="manager-profile-field">
                    <label>Reporting Authority Email</label>
                    <div className="manager-profile-input locked">
                      <span>
                        {selectedManager.reportingAuthorityEmail || "-"}
                      </span>
                      <span className="manager-profile-lock">🔒</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="manager-profile-section">
                <div className="manager-profile-card-header">
                  <div>
                    <h3>Emergency Contact</h3>
                    <p>Emergency contact details of the manager.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditEmergency(!editEmergency)}
                  >
                    {editEmergency ? "Cancel" : "Edit"}
                  </button>
                </div>

                {editEmergency ? (
                  <div className="manager-profile-grid">
                    <div className="manager-profile-field">
                      <label>Name</label>
                      <input
                        type="text"
                        value={editManagerData.emergencyContactName}
                        onChange={(event) =>
                          setEditManagerData({
                            ...editManagerData,
                            emergencyContactName: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="manager-profile-field">
                      <label>Relationship</label>
                      <input
                        type="text"
                        value={editManagerData.emergencyContactRelationship}
                        onChange={(event) =>
                          setEditManagerData({
                            ...editManagerData,
                            emergencyContactRelationship: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="manager-profile-field">
                      <label>Phone</label>
                      <input
                        type="text"
                        value={editManagerData.emergencyContactPhone}
                        onChange={(event) =>
                          setEditManagerData({
                            ...editManagerData,
                            emergencyContactPhone: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="manager-profile-field">
                      <label>Address</label>
                      <textarea
                        value={editManagerData.emergencyContactAddress}
                        onChange={(event) =>
                          setEditManagerData({
                            ...editManagerData,
                            emergencyContactAddress: event.target.value,
                          })
                        }
                        rows="3"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="manager-profile-grid">
                    <div className="manager-profile-field">
                      <label>Name</label>
                      <div className="manager-profile-input">
                        <span>
                          {selectedManager.emergencyContactName || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="manager-profile-field">
                      <label>Relationship</label>
                      <div className="manager-profile-input">
                        <span>
                          {selectedManager.emergencyContactRelationship || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="manager-profile-field">
                      <label>Phone</label>
                      <div className="manager-profile-input">
                        <span>
                          {selectedManager.emergencyContactPhone || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="manager-profile-field">
                      <label>Address</label>
                      <div className="manager-profile-input">
                        <span>
                          {selectedManager.emergencyContactAddress || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {editEmergency && (
                  <div className="manager-profile-save-area">
                    <button type="button" onClick={handleSaveEmergency}>
                      Save Emergency Contact
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "actions" && (
        <div className="manager-section">
          <h2>Role Actions</h2>
          <p>Manage employee and manager role responsibilities.</p>

          {error && <p>{error}</p>}
          {success && (
            <div className="manager-success-notification">
              <span className="manager-success-icon">✓</span>
              <span>{success}</span>
            </div>
          )}

          <div className="manager-profile-section">
            <div className="manager-profile-card-header">
              <div>
                <h3>Promote Employee to Manager</h3>
                <p>Select an employee to promote to Manager.</p>
              </div>
            </div>

            <div className="manager-profile-grid">
              <div className="manager-profile-field">
                <label>Employee</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(event) =>
                    setSelectedEmployeeId(event.target.value)
                  }
                >
                  <option value="">Select Employee</option>

                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} — {employee.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="manager-profile-save-area">
              <button type="button" onClick={handlePromoteEmployee}>
                Promote to Manager
              </button>
            </div>
          </div>

          <div className="manager-profile-section">
            <div className="manager-profile-card-header">
              <div>
                <h3>Demote Manager to Employee</h3>
                <p>Select a manager to change the role to Employee.</p>
              </div>
            </div>

            <div className="manager-profile-grid">
              <div className="manager-profile-field">
                <label>Manager</label>
                <select
                  value={selectedManagerId}
                  onChange={(event) => setSelectedManagerId(event.target.value)}
                >
                  <option value="">Select Manager</option>

                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} — {manager.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="manager-profile-save-area">
              <button type="button" onClick={handleDemoteManager}>
                Demote to Employee
              </button>
            </div>
          </div>

          <div className="manager-profile-section">
            <div className="manager-profile-card-header">
              <div>
                <h3>Assign Manager to Employee</h3>
                <p>Select an employee and assign a manager.</p>
              </div>
            </div>

            <div className="manager-profile-grid">
              <div className="manager-profile-field">
                <label>Employee</label>
                <select
                  value={selectedAssignEmployeeId}
                  onChange={(event) =>
                    setSelectedAssignEmployeeId(event.target.value)
                  }
                >
                  <option value="">Select Employee</option>

                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} — {employee.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="manager-profile-field">
                <label>Manager</label>
                <select
                  value={selectedAssignManagerId}
                  onChange={(event) =>
                    setSelectedAssignManagerId(event.target.value)
                  }
                >
                  <option value="">Select Manager</option>

                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} — {manager.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="manager-profile-save-area">
              <button type="button" onClick={handleAssignManager}>
                Assign Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerManagement;
