import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/EmployeeManagement.css";

function EmployeeManagement() {
  const [activeTab, setActiveTab] = useState("accounts");

  // Employee Accounts
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedPromoteEmployeeId, setSelectedPromoteEmployeeId] =
    useState("");

  // Employee Profiles
  const [profileEmployeeId, setProfileEmployeeId] = useState("");
  const [selectedProfileEmployee, setSelectedProfileEmployee] = useState(null);
  const [editAccountInfo, setEditAccountInfo] = useState(false);
  const [editEmployeeName, setEditEmployeeName] = useState("");
  const [editPersonalInfo, setEditPersonalInfo] = useState(false);
  const [editEmploymentInfo, setEditEmploymentInfo] = useState(false);
  const [editEmployeeJoiningDate, setEditEmployeeJoiningDate] = useState("");
  const [editEmployeeDepartmentId, setEditEmployeeDepartmentId] = useState("");
  const [editEmployeeDesignationId, setEditEmployeeDesignationId] =
    useState("");
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editEmployeePersonalEmail, setEditEmployeePersonalEmail] =
    useState("");
  const [editEmployeePhone, setEditEmployeePhone] = useState("");
  const [editEmployeeAddress, setEditEmployeeAddress] = useState("");
  const [editEmergencyContact, setEditEmergencyContact] = useState(false);
  const [editEmergencyContactName, setEditEmergencyContactName] = useState("");
  const [
    editEmergencyContactRelationship,
    setEditEmergencyContactRelationship,
  ] = useState("");
  const [editEmergencyContactPhone, setEditEmergencyContactPhone] =
    useState("");
  const [editEmergencyContactAddress, setEditEmergencyContactAddress] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/users/role/EMPLOYEE");
        setEmployees(response.data);
        const designationResponse = await api.get("/designations");
        setDesignations(designationResponse.data);
        const departmentResponse = await api.get("/departments");
        setDepartments(departmentResponse.data);
      } catch (error) {
        console.error("Failed to load employee accounts:", error);
        setError("Failed to load employee accounts.");
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const handleSaveEmploymentInfo = async () => {
    try {
      await api.put(
        `/users/${selectedProfileEmployee.id}/department/${editEmployeeDepartmentId}`,
      );

      await api.put(
        `/users/${selectedProfileEmployee.id}/designation/${editEmployeeDesignationId}`,
      );

      const response = await api.get(`/users/${selectedProfileEmployee.id}`);

      setSelectedProfileEmployee(response.data);
      setEditEmploymentInfo(false);
      setSuccess("Employment Information updated successfully.");
    } catch (error) {
      console.error("Failed to update employee employment information:", error);
      setError("Failed to update employee employment information.");
    }
  };

  // Employee Accounts -> View
  const handleViewEmployee = async (employeeId) => {
    try {
      const response = await api.get(`/users/${employeeId}`);
      setSelectedEmployee(response.data);
    } catch (error) {
      console.error("Failed to load employee account:", error);
      setError("Failed to load employee account.");
    }
  };

  const handlePromoteEmployee = async () => {
    if (!selectedPromoteEmployeeId) {
      return;
    }

    try {
      await api.post(`/users/${selectedPromoteEmployeeId}/promote-to-manager`);

      setSuccess("Employee promoted to Manager successfully.");
      setSelectedPromoteEmployeeId("");
    } catch (error) {
      console.error("Failed to promote employee:", error);
      setError("Failed to promote employee to Manager.");
    }
  };

  // Employee Profiles -> View Employee Profile
  const handleViewEmployeeProfile = async () => {
    if (!profileEmployeeId) {
      return;
    }

    try {
      const response = await api.get(`/users/${profileEmployeeId}`);
      setSelectedProfileEmployee(response.data);
      setEditEmployeePersonalEmail(response.data.personalEmail || "");
      setEditEmployeePhone(response.data.phoneNumber || "");
      setEditEmployeeAddress(response.data.address || "");
    } catch (error) {
      console.error("Failed to load employee profile:", error);
      setError("Failed to load employee profile.");
    }
  };

  const handleEditAccountInfo = () => {
    setEditEmployeeName(selectedProfileEmployee.name || "");
    setEditAccountInfo(true);
  };

  const handleCancelAccountInfo = () => {
    setEditAccountInfo(false);
    setEditEmployeeName("");
  };

  const handleSaveAccountInfo = async () => {
    try {
      await api.put(`/users/${selectedProfileEmployee.id}/profile`, {
        name: editEmployeeName,
        personalEmail: selectedProfileEmployee.personalEmail || "",
        phoneNumber: selectedProfileEmployee.phoneNumber || "",
        address: selectedProfileEmployee.address || "",
      });

      const response = await api.get(`/users/${selectedProfileEmployee.id}`);

      setSelectedProfileEmployee(response.data);
      setEditAccountInfo(false);
      setSuccess("Account Information updated successfully.");
    } catch (error) {
      console.error("Failed to update employee account information:", error);
      setError("Failed to update employee account information.");
    }
  };

  const handleEditPersonalInfo = () => {
    setEditEmployeePersonalEmail(selectedProfileEmployee.personalEmail || "");
    setEditEmployeePhone(selectedProfileEmployee.phoneNumber || "");
    setEditEmployeeAddress(selectedProfileEmployee.address || "");
    setEditPersonalInfo(true);
  };

  const handleCancelPersonalInfo = () => {
    setEditPersonalInfo(false);
    setEditEmployeePersonalEmail("");
    setEditEmployeePhone("");
    setEditEmployeeAddress("");
  };

  const handleSavePersonalInfo = async () => {
    try {
      await api.put(`/users/${selectedProfileEmployee.id}/profile`, {
        name: selectedProfileEmployee.name,
        personalEmail: editEmployeePersonalEmail,
        phoneNumber: editEmployeePhone,
        address: editEmployeeAddress,
      });

      const response = await api.get(`/users/${selectedProfileEmployee.id}`);

      setSelectedProfileEmployee(response.data);
      setEditPersonalInfo(false);
      setSuccess("Personal Information updated successfully.");
    } catch (error) {
      console.error("Failed to update employee personal information:", error);
      setError("Failed to update employee personal information.");
    }
  };

  const handleEditEmploymentInfo = () => {
    setEditEmployeeJoiningDate(selectedProfileEmployee.joiningDate || "");
    setEditEmployeeDepartmentId(selectedProfileEmployee.departmentId || "");
    setEditEmployeeDesignationId(
      String(selectedProfileEmployee.designationId || ""),
    );
    setEditEmploymentInfo(true);
  };

  const handleCancelEmploymentInfo = () => {
    setEditEmploymentInfo(false);
    setEditEmployeeJoiningDate("");
    setEditEmployeeDepartmentId("");
    setEditEmployeeDesignationId("");
  };

  const handleEditEmergencyContact = () => {
    setEditEmergencyContactName(
      selectedProfileEmployee.emergencyContactName || "",
    );
    setEditEmergencyContactRelationship(
      selectedProfileEmployee.emergencyContactRelationship || "",
    );
    setEditEmergencyContactPhone(
      selectedProfileEmployee.emergencyContactPhone || "",
    );
    setEditEmergencyContactAddress(
      selectedProfileEmployee.emergencyContactAddress || "",
    );
    setEditEmergencyContact(true);
  };

  const handleCancelEmergencyContact = () => {
    setEditEmergencyContact(false);
    setEditEmergencyContactName("");
    setEditEmergencyContactRelationship("");
    setEditEmergencyContactPhone("");
    setEditEmergencyContactAddress("");
  };

  const handleSaveEmergencyContact = async () => {
    try {
      await api.put(`/users/${selectedProfileEmployee.id}/emergency-contact`, {
        emergencyContactName: editEmergencyContactName,
        emergencyContactRelationship: editEmergencyContactRelationship,
        emergencyContactPhone: editEmergencyContactPhone,
        emergencyContactAddress: editEmergencyContactAddress,
      });

      const response = await api.get(`/users/${selectedProfileEmployee.id}`);

      setSelectedProfileEmployee(response.data);
      setEditEmergencyContact(false);
      setSuccess("Emergency Contact updated successfully.");
    } catch (error) {
      console.error("Failed to update emergency contact:", error);
      setError("Failed to update emergency contact.");
    }
  };

  return (
    <div className="employee-management">
      <div className="page-header">
        <h1>Employee Management</h1>
        <p>Manage employee accounts, profiles and role responsibilities.</p>
      </div>

      <div className="employee-tabs">
        <button
          className={activeTab === "accounts" ? "active" : ""}
          onClick={() => setActiveTab("accounts")}
        >
          Employee Accounts
        </button>

        <button
          className={activeTab === "profiles" ? "active" : ""}
          onClick={() => setActiveTab("profiles")}
        >
          Employee Profiles
        </button>

        <button
          className={activeTab === "actions" ? "active" : ""}
          onClick={() => setActiveTab("actions")}
        >
          Role Actions
        </button>
      </div>

      {/* Employee Accounts */}
      {activeTab === "accounts" && (
        <div className="employee-section">
          <h2>Employee Accounts</h2>

          {!loading && !error && employees.length > 0 && (
            <table className="employee-table">
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
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.id}</td>
                    <td>{employee.name}</td>
                    <td>{employee.email}</td>
                    <td>{employee.department?.name || "-"}</td>
                    <td>{employee.designation?.name || "-"}</td>
                    <td>{employee.status || "-"}</td>
                    <td>
                      <button onClick={() => handleViewEmployee(employee.id)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {loading && <p>Loading employee accounts...</p>}

          {error && <p>{error}</p>}

          {!loading && !error && employees.length === 0 && (
            <p>No employee accounts found.</p>
          )}

          {selectedEmployee && (
            <div className="employee-profile-card">
              <h3>Employee Profile</h3>

              <p>
                <strong>ID:</strong> {selectedEmployee.id}
              </p>

              <p>
                <strong>Name:</strong> {selectedEmployee.name}
              </p>

              <p>
                <strong>Official Email:</strong> {selectedEmployee.email}
              </p>

              <p>
                <strong>Role:</strong> {selectedEmployee.role}
              </p>

              <p>
                <strong>Status:</strong> {selectedEmployee.status}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Employee Profiles */}
      {activeTab === "profiles" && (
        <div className="employee-section">
          {success && (
            <div className="employee-success-notification">
              <span>✓</span>
              <span>{success}</span>
            </div>
          )}
          <h2>Employee Profiles</h2>

          <div className="employee-profile-search">
            <div className="form-group">
              <label>Select Employee</label>

              <select
                value={profileEmployeeId}
                onChange={(event) => {
                  setProfileEmployeeId(event.target.value);
                  setSelectedProfileEmployee(null);
                  setError("");
                }}
              >
                <option value="">Select Employee</option>

                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleViewEmployeeProfile}
              disabled={!profileEmployeeId}
            >
              View Employee Profile
            </button>
          </div>

          {selectedProfileEmployee && (
            <div className="employee-profile-card">
              <div className="employee-profile-section">
                <div className="employee-profile-card-header">
                  <div>
                    <h3>Account Information</h3>
                    <p>Official employee account information.</p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      editAccountInfo
                        ? handleCancelAccountInfo
                        : handleEditAccountInfo
                    }
                  >
                    {editAccountInfo ? "Cancel" : "Edit"}
                  </button>
                </div>

                <div className="employee-profile-grid">
                  <div className="employee-profile-field">
                    <label>Employee ID</label>
                    <div className="employee-profile-input locked">
                      <span>{selectedProfileEmployee.id}</span>
                      <span className="employee-profile-lock">🔒</span>
                    </div>
                  </div>

                  <div className="employee-profile-field">
                    <label>Full Name</label>

                    {editAccountInfo ? (
                      <input
                        type="text"
                        value={editEmployeeName}
                        onChange={(e) => setEditEmployeeName(e.target.value)}
                      />
                    ) : (
                      <div className="employee-profile-input">
                        <span>{selectedProfileEmployee.name || "—"}</span>
                      </div>
                    )}
                  </div>

                  <div className="employee-profile-field">
                    <label>Official Email</label>
                    <div className="employee-profile-input locked">
                      <span>{selectedProfileEmployee.email || "—"}</span>
                      <span className="employee-profile-lock">🔒</span>
                    </div>
                  </div>

                  <div className="employee-profile-field">
                    <label>Role</label>
                    <div className="employee-profile-input locked">
                      <span>{selectedProfileEmployee.role || "—"}</span>
                      <span className="employee-profile-lock">🔒</span>
                    </div>
                  </div>

                  <div className="employee-profile-field">
                    <label>Account Status</label>
                    <div className="employee-status-display">
                      {selectedProfileEmployee.status || "—"}
                    </div>
                  </div>
                </div>

                {editAccountInfo && (
                  <div className="employee-profile-save-area">
                    <button type="button" onClick={handleSaveAccountInfo}>
                      Save Account Information
                    </button>
                  </div>
                )}
              </div>

              <div className="employee-profile-section">
                <div className="employee-profile-card-header">
                  <div>
                    <h3>Personal Information</h3>
                    <p>Personal contact information of the employee.</p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      editPersonalInfo
                        ? handleCancelPersonalInfo
                        : handleEditPersonalInfo
                    }
                  >
                    {editPersonalInfo ? "Cancel" : "Edit"}
                  </button>
                </div>

                <div className="employee-profile-grid">
                  <div className="employee-profile-field">
                    <label>Personal Email</label>

                    {editPersonalInfo ? (
                      <input
                        type="email"
                        value={editEmployeePersonalEmail}
                        onChange={(e) =>
                          setEditEmployeePersonalEmail(e.target.value)
                        }
                      />
                    ) : (
                      <div className="employee-profile-input">
                        <span>
                          {selectedProfileEmployee.personalEmail || "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="employee-profile-field">
                    <label>Phone Number</label>

                    {editPersonalInfo ? (
                      <input
                        type="text"
                        value={editEmployeePhone}
                        onChange={(e) => setEditEmployeePhone(e.target.value)}
                      />
                    ) : (
                      <div className="employee-profile-input">
                        <span>
                          {selectedProfileEmployee.phoneNumber || "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="employee-profile-field">
                    <label>Address</label>

                    {editPersonalInfo ? (
                      <input
                        type="text"
                        value={editEmployeeAddress}
                        onChange={(e) => setEditEmployeeAddress(e.target.value)}
                      />
                    ) : (
                      <div className="employee-profile-input">
                        <span>{selectedProfileEmployee.address || "—"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {editPersonalInfo && (
                  <div className="employee-profile-save-area">
                    <button type="button" onClick={handleSavePersonalInfo}>
                      Save Personal Information
                    </button>
                  </div>
                )}
              </div>

              <div className="employee-profile-section">
                <div className="employee-profile-card-header">
                  <div>
                    <h3>Employment Information</h3>
                    <p>Employment details of the employee.</p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      editEmploymentInfo
                        ? handleCancelEmploymentInfo
                        : handleEditEmploymentInfo
                    }
                  >
                    {editEmploymentInfo ? "Cancel" : "Edit"}
                  </button>
                </div>

                <div className="employee-profile-grid">
                  <div className="employee-profile-field">
                    <label>Joining Date</label>
                    <div className="employee-profile-input locked">
                      <span>{selectedProfileEmployee.joiningDate || "—"}</span>
                      <span className="employee-profile-lock">🔒</span>
                    </div>
                  </div>

                  <div className="employee-profile-field">
                    <label>Department</label>

                    {editEmploymentInfo ? (
                      <select
                        value={editEmployeeDepartmentId}
                        onChange={(e) =>
                          setEditEmployeeDepartmentId(e.target.value)
                        }
                      >
                        <option value="">Select Department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="employee-profile-input">
                        <span>
                          {departments.find(
                            (department) =>
                              String(department.id) ===
                              String(selectedProfileEmployee.departmentId),
                          )?.name || "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="employee-profile-field">
                    <label>Designation</label>

                    {editEmploymentInfo ? (
                      <select
                        value={editEmployeeDesignationId}
                        onChange={(e) =>
                          setEditEmployeeDesignationId(e.target.value)
                        }
                      >
                        <option value="">Select Designation</option>
                        {designations.map((designation) => (
                          <option key={designation.id} value={designation.id}>
                            {designation.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="employee-profile-input">
                        <div className="employee-profile-input">
                          <span>
                            {designations.find(
                              (designation) =>
                                String(designation.id) ===
                                String(selectedProfileEmployee.designationId),
                            )?.name || "—"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="employee-profile-field">
                    <label>Employment Type</label>
                    <div className="employee-profile-input locked">
                      <span>
                        {selectedProfileEmployee.employmentType || "—"}
                      </span>
                      <span className="employee-profile-lock">🔒</span>
                    </div>
                  </div>

                  <div className="employee-profile-field">
                    <label>Work Location</label>
                    <div className="employee-profile-input locked">
                      <span>{selectedProfileEmployee.workLocation || "—"}</span>
                      <span className="employee-profile-lock">🔒</span>
                    </div>
                  </div>
                </div>

                {editEmploymentInfo && (
                  <div className="employee-profile-save-area">
                    <button type="button" onClick={handleSaveEmploymentInfo}>
                      Save Employment Information
                    </button>
                  </div>
                )}
              </div>

              <div className="employee-profile-section">
                <div className="employee-profile-card-header">
                  <div>
                    <h3>Reporting Authority</h3>
                    <p>Reporting authority of the employee.</p>
                  </div>
                </div>

                <div className="employee-profile-grid">
                  <div className="employee-profile-field">
                    <label>Name</label>
                    <div className="employee-profile-input locked">
                      <span>
                        {selectedProfileEmployee.reportingAuthorityName || "—"}
                      </span>
                      <span className="employee-profile-lock">🔒</span>
                    </div>
                  </div>

                  <div className="employee-profile-field">
                    <label>Email</label>
                    <div className="employee-profile-input locked">
                      <span>
                        {selectedProfileEmployee.reportingAuthorityEmail || "—"}
                      </span>
                      <span className="employee-profile-lock">🔒</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="employee-profile-section">
                <div className="employee-profile-card-header">
                  <div>
                    <h3>Emergency Contact</h3>
                    <p>Emergency contact information of the employee.</p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      editEmergencyContact
                        ? handleCancelEmergencyContact
                        : handleEditEmergencyContact
                    }
                  >
                    {editEmergencyContact ? "Cancel" : "Edit"}
                  </button>
                </div>

                <div className="employee-profile-grid">
                  <div className="employee-profile-field">
                    <label>Name</label>

                    {editEmergencyContact ? (
                      <input
                        type="text"
                        value={editEmergencyContactName}
                        onChange={(e) =>
                          setEditEmergencyContactName(e.target.value)
                        }
                      />
                    ) : (
                      <div className="employee-profile-input">
                        <span>
                          {selectedProfileEmployee.emergencyContactName || "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="employee-profile-field">
                    <label>Relationship</label>

                    {editEmergencyContact ? (
                      <input
                        type="text"
                        value={editEmergencyContactRelationship}
                        onChange={(e) =>
                          setEditEmergencyContactRelationship(e.target.value)
                        }
                      />
                    ) : (
                      <div className="employee-profile-input">
                        <span>
                          {selectedProfileEmployee.emergencyContactRelationship ||
                            "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="employee-profile-field">
                    <label>Phone</label>

                    {editEmergencyContact ? (
                      <input
                        type="text"
                        value={editEmergencyContactPhone}
                        onChange={(e) =>
                          setEditEmergencyContactPhone(e.target.value)
                        }
                      />
                    ) : (
                      <div className="employee-profile-input">
                        <span>
                          {selectedProfileEmployee.emergencyContactPhone || "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="employee-profile-field">
                    <label>Address</label>

                    {editEmergencyContact ? (
                      <input
                        type="text"
                        value={editEmergencyContactAddress}
                        onChange={(e) =>
                          setEditEmergencyContactAddress(e.target.value)
                        }
                      />
                    ) : (
                      <div className="employee-profile-input">
                        <span>
                          {selectedProfileEmployee.emergencyContactAddress ||
                            "—"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {editEmergencyContact && (
                  <div className="employee-profile-save-area">
                    <button type="button" onClick={handleSaveEmergencyContact}>
                      Save Emergency Contact
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Role Actions */}
      {activeTab === "actions" && (
        <div className="employee-section">
          {success && (
            <div className="employee-success-notification">
              <span>✓</span>
              <span>{success}</span>
            </div>
          )}
          <h2>Role Actions</h2>
          <p>Manage employee role responsibilities.</p>

          <div className="employee-profile-search">
            <div className="form-group">
              <label>Select Employee</label>

              <select
                value={selectedPromoteEmployeeId}
                onChange={(event) =>
                  setSelectedPromoteEmployeeId(event.target.value)
                }
              >
                <option value="">Select Employee</option>

                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePromoteEmployee}
              disabled={!selectedPromoteEmployeeId}
            >
              Promote to Manager
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeManagement;
