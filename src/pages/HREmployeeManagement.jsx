import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/HREmployeeManagement.css";

// Lock indicator for read-only fields
const ReadOnlyLock = () => (
  <span
    className="hr-employee-lock-icon"
    title="This field cannot be edited here"
    aria-label="Read-only field"
  >
    🔒
  </span>
);

export default function HREmployeeManagement() {
  const [activeTab, setActiveTab] = useState("create");

  // Department and designation options
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Employee List & Profiles
  const [employees, setEmployees] = useState([]);
  // Assign Employee
  const [managers, setManagers] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");

  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedAssignmentEmployeeId, setSelectedAssignmentEmployeeId] =
    useState("");

  const [managerTeam, setManagerTeam] = useState([]);
  const [managerTeamLoading, setManagerTeamLoading] = useState(false);
  const [managerTeamError, setManagerTeamError] = useState("");
  const [employeeListLoading, setEmployeeListLoading] = useState(false);
  const [employeeListError, setEmployeeListError] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [editAccount, setEditAccount] = useState(false);
  const [editPersonal, setEditPersonal] = useState(false);
  const [editEmployment, setEditEmployment] = useState(false);
  const [editEmergency, setEditEmergency] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [editEmployeeData, setEditEmployeeData] = useState({
    name: "",
    personalEmail: "",
    phoneNumber: "",
    address: "",
    joiningDate: "",
    departmentId: "",
    designationId: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    emergencyContactAddress: "",
  });

  // Create Employee Account form
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

  // Load department and designation options
  useEffect(() => {
    const loadFormOptions = async () => {
      setOptionsLoading(true);
      setError("");

      try {
        const [departmentResponse, designationResponse] = await Promise.all([
          api.get("/departments"),
          api.get("/designations"),
        ]);

        setDepartments(
          Array.isArray(departmentResponse.data) ? departmentResponse.data : [],
        );

        setDesignations(
          Array.isArray(designationResponse.data)
            ? designationResponse.data
            : [],
        );
      } catch (err) {
        console.error("Failed to load departments and designations:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load departments and designations.",
        );
      } finally {
        setOptionsLoading(false);
      }
    };

    loadFormOptions();
  }, []);

  // Load employee list when Employee List & Profiles opens
  useEffect(() => {
    if (activeTab !== "list") {
      return;
    }

    const loadEmployees = async () => {
      setEmployeeListLoading(true);
      setEmployeeListError("");

      try {
        const response = await api.get("/users/role/EMPLOYEE");

        setEmployees(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Failed to load employees:", err);

        setEmployeeListError(
          err.response?.data?.message ||
            "Failed to load employee accounts. Please try again.",
        );
      } finally {
        setEmployeeListLoading(false);
      }
    };

    loadEmployees();
  }, [activeTab]);

  // Load employees and managers when Assign Employee opens
  useEffect(() => {
    if (activeTab !== "assign") {
      return;
    }

    const loadAssignmentOptions = async () => {
      setAssignmentLoading(true);
      setAssignmentError("");
      setAssignmentSuccess("");

      try {
        const [employeeResponse, managerResponse] = await Promise.all([
          api.get("/users/role/EMPLOYEE"),
          api.get("/users/role/MANAGER"),
        ]);

        setEmployees(
          Array.isArray(employeeResponse.data) ? employeeResponse.data : [],
        );

        setManagers(
          Array.isArray(managerResponse.data) ? managerResponse.data : [],
        );
      } catch (err) {
        console.error("Failed to load assignment options:", err);

        setAssignmentError(
          err.response?.data?.message ||
            "Failed to load employees and managers. Please try again.",
        );
      } finally {
        setAssignmentLoading(false);
      }
    };

    loadAssignmentOptions();
  }, [activeTab]);

  // Normalize date for an HTML date input
  const normalizeDate = (value) => {
    if (!value) {
      return "";
    }

    return String(value).substring(0, 10);
  };

  // Populate editing fields from the selected employee
  const populateEditData = (employee) => {
    setEditEmployeeData({
      name: employee.name || "",
      personalEmail: employee.personalEmail || "",
      phoneNumber: employee.phoneNumber || "",
      address: employee.address || "",
      joiningDate: normalizeDate(employee.joiningDate),
      departmentId: employee.departmentId ?? employee.department?.id ?? "",
      designationId: employee.designationId ?? employee.designation?.id ?? "",
      emergencyContactName: employee.emergencyContactName || "",
      emergencyContactRelationship: employee.emergencyContactRelationship || "",
      emergencyContactPhone: employee.emergencyContactPhone || "",
      emergencyContactAddress: employee.emergencyContactAddress || "",
    });
  };

  // Reset profile editing modes
  const resetEditModes = () => {
    setEditAccount(false);
    setEditPersonal(false);
    setEditEmployment(false);
    setEditEmergency(false);
  };

  // Retrieve an employee's complete profile
  const handleViewEmployeeProfile = async (employeeId) => {
    setProfileLoading(true);
    setEmployeeListError("");
    setProfileSuccess("");
    setProfileError("");
    setSelectedEmployee(null);
    resetEditModes();

    try {
      const response = await api.get(`/users/${employeeId}`);

      setSelectedEmployee(response.data);
      populateEditData(response.data);
    } catch (err) {
      console.error("Failed to load employee profile:", err);

      setEmployeeListError(
        err.response?.data?.message ||
          "Failed to load employee profile. Please try again.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle profile edit form changes
  const handleEditEmployeeChange = (event) => {
    const { name, value } = event.target;

    setEditEmployeeData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Get a readable API error message
  const getEmployeeApiError = (err, fallbackMessage) => {
    return (
      err.response?.data?.message ||
      err.response?.data?.error ||
      fallbackMessage
    );
  };

  // Refresh the selected employee profile and employee list
  const refreshEmployeeProfile = async (employeeId) => {
    const response = await api.get(`/users/${employeeId}`);

    setSelectedEmployee(response.data);
    populateEditData(response.data);

    const listResponse = await api.get("/users/role/EMPLOYEE");

    setEmployees(Array.isArray(listResponse.data) ? listResponse.data : []);
  };

  // Start editing a profile section
  const startEditingEmployeeSection = (section) => {
    if (!selectedEmployee) {
      return;
    }

    populateEditData(selectedEmployee);
    setProfileSuccess("");
    setProfileError("");

    if (section === "account") {
      setEditAccount(true);
    } else if (section === "personal") {
      setEditPersonal(true);
    } else if (section === "employment") {
      setEditEmployment(true);
    } else if (section === "emergency") {
      setEditEmergency(true);
    }
  };

  // Cancel editing a profile section
  const cancelEditingEmployeeSection = (section) => {
    if (selectedEmployee) {
      populateEditData(selectedEmployee);
    }

    if (section === "account") {
      setEditAccount(false);
    } else if (section === "personal") {
      setEditPersonal(false);
    } else if (section === "employment") {
      setEditEmployment(false);
    } else if (section === "emergency") {
      setEditEmergency(false);
    }

    setProfileError("");
    setProfileSuccess("");
  };

  // Save employee account information
  const handleSaveEmployeeAccount = async () => {
    if (!selectedEmployee) {
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      await api.put(`/users/${selectedEmployee.id}/profile`, {
        name: editEmployeeData.name.trim(),
      });

      await refreshEmployeeProfile(selectedEmployee.id);

      setEditAccount(false);
      setProfileSuccess("Employee account information updated successfully.");
    } catch (err) {
      console.error("Failed to update employee account:", err);

      setProfileError(
        getEmployeeApiError(
          err,
          "Failed to update employee account information.",
        ),
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Save employee personal information
  const handleSaveEmployeePersonal = async () => {
    if (!selectedEmployee) {
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      await api.put(`/users/${selectedEmployee.id}/profile`, {
        personalEmail: editEmployeeData.personalEmail.trim(),
        phoneNumber: editEmployeeData.phoneNumber.trim(),
        address: editEmployeeData.address.trim(),
      });

      await refreshEmployeeProfile(selectedEmployee.id);

      setEditPersonal(false);
      setProfileSuccess("Personal information updated successfully.");
    } catch (err) {
      console.error("Failed to update personal information:", err);

      setProfileError(
        getEmployeeApiError(err, "Failed to update personal information."),
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Save employee employment information
  const handleSaveEmployeeEmployment = async () => {
    if (!selectedEmployee) {
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      await api.put(`/users/${selectedEmployee.id}/profile`, {
        joiningDate: editEmployeeData.joiningDate || null,
      });

      if (
        editEmployeeData.departmentId &&
        String(
          selectedEmployee.departmentId ??
            selectedEmployee.department?.id ??
            "",
        ) !== String(editEmployeeData.departmentId)
      ) {
        await api.put(
          `/users/${selectedEmployee.id}/department/${editEmployeeData.departmentId}`,
        );
      }

      if (
        editEmployeeData.designationId &&
        String(
          selectedEmployee.designationId ??
            selectedEmployee.designation?.id ??
            "",
        ) !== String(editEmployeeData.designationId)
      ) {
        await api.put(
          `/users/${selectedEmployee.id}/designation/${editEmployeeData.designationId}`,
        );
      }

      await refreshEmployeeProfile(selectedEmployee.id);

      setEditEmployment(false);
      setProfileSuccess("Employment information updated successfully.");
    } catch (err) {
      console.error("Failed to update employment information:", err);

      setProfileError(
        getEmployeeApiError(err, "Failed to update employment information."),
      );

      try {
        await refreshEmployeeProfile(selectedEmployee.id);
      } catch (refreshError) {
        console.error("Failed to refresh employee profile:", refreshError);
      }
    } finally {
      setProfileSaving(false);
    }
  };

  // Save employee emergency contact information
  const handleSaveEmployeeEmergency = async () => {
    if (!selectedEmployee) {
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      await api.put(`/users/${selectedEmployee.id}/emergency-contact`, {
        emergencyContactName: editEmployeeData.emergencyContactName.trim(),
        emergencyContactRelationship:
          editEmployeeData.emergencyContactRelationship.trim(),
        emergencyContactPhone: editEmployeeData.emergencyContactPhone.trim(),
        emergencyContactAddress:
          editEmployeeData.emergencyContactAddress.trim(),
      });

      await refreshEmployeeProfile(selectedEmployee.id);

      setEditEmergency(false);
      setProfileSuccess("Emergency contact updated successfully.");
    } catch (err) {
      console.error("Failed to update emergency contact:", err);

      setProfileError(
        getEmployeeApiError(
          err,
          "Failed to update emergency contact information.",
        ),
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Assign an employee to a manager
  const handleAssignEmployee = async (event) => {
    event.preventDefault();

    setAssignmentError("");
    setAssignmentSuccess("");

    if (!selectedManagerId || !selectedAssignmentEmployeeId) {
      setAssignmentError("Please select both a manager and an employee.");
      return;
    }

    setAssignmentSaving(true);

    try {
      await api.post(
        `/users/${selectedAssignmentEmployeeId}/assign-manager/${selectedManagerId}`,
      );

      setAssignmentSuccess("Employee assigned to manager successfully.");

      // Refresh employee list
      const employeeResponse = await api.get("/users/role/EMPLOYEE");

      setEmployees(
        Array.isArray(employeeResponse.data) ? employeeResponse.data : [],
      );

      // Refresh the selected manager's team
      const teamResponse = await api.get(`/managers/${selectedManagerId}/team`);

      setManagerTeam(Array.isArray(teamResponse.data) ? teamResponse.data : []);

      setSelectedAssignmentEmployeeId("");
    } catch (err) {
      console.error("Failed to assign employee:", err);

      setAssignmentError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to assign employee. Please try again.",
      );
    } finally {
      setAssignmentSaving(false);
    }
  };

  // Load the selected manager's team
  const handleLoadManagerTeam = async (managerId) => {
    setSelectedManagerId(managerId);
    setManagerTeam([]);
    setManagerTeamError("");
    setAssignmentError("");
    setAssignmentSuccess("");
    setSelectedAssignmentEmployeeId("");

    if (!managerId) {
      return;
    }

    setManagerTeamLoading(true);

    try {
      const response = await api.get(`/managers/${managerId}/team`);

      setManagerTeam(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load manager team:", err);

      setManagerTeamError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load this manager's team.",
      );
    } finally {
      setManagerTeamLoading(false);
    }
  };

  // Filter employees by ID, name, or email
  const filteredEmployees = employees.filter((employee) => {
    const search = employeeSearch.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return (
      String(employee.id ?? "")
        .toLowerCase()
        .includes(search) ||
      String(employee.name ?? "")
        .toLowerCase()
        .includes(search) ||
      String(employee.email ?? "")
        .toLowerCase()
        .includes(search)
    );
  });

  // Handle form changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create Employee Account
  const handleCreateEmployee = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        personalEmail: formData.personalEmail.trim(),
        role: "EMPLOYEE",
        departmentId: Number(formData.departmentId),
        designationId: Number(formData.designationId),
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType,
        workLocation: formData.workLocation.trim(),
      };

      const response = await api.post("/register", payload);

      setMessage(
        response.data?.message ||
          "Employee account registration submitted successfully. Follow the existing email verification and onboarding workflow.",
      );

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
    } catch (err) {
      console.error("Create Employee error:", err);

      const responseData = err.response?.data;

      setError(
        responseData?.message ||
          (typeof responseData === "string"
            ? responseData
            : `Failed to create employee account${
                err.response?.status ? ` (HTTP ${err.response.status})` : ""
              }.`),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-employee-management">
      {/* Page Header */}
      <div className="hr-employee-page-header">
        <div>
          <h1>Employee Management</h1>
          <p>
            Create employee accounts, manage employee profiles, and assign
            employees to managers.
          </p>
        </div>
      </div>

      {/* Three Tabs */}
      <div className="hr-employee-tabs">
        <button
          type="button"
          className={activeTab === "create" ? "active" : ""}
          onClick={() => setActiveTab("create")}
        >
          Create Employee Account
        </button>

        <button
          type="button"
          className={activeTab === "list" ? "active" : ""}
          onClick={() => setActiveTab("list")}
        >
          Employee List & Profiles
        </button>

        <button
          type="button"
          className={activeTab === "assign" ? "active" : ""}
          onClick={() => setActiveTab("assign")}
        >
          Assign Employee
        </button>
      </div>

      {/* TAB 1: CREATE EMPLOYEE ACCOUNT */}
      {activeTab === "create" && (
        <section className="hr-employee-card">
          <div className="hr-employee-section-heading">
            <div>
              <h2>Create Employee Account</h2>
              <p>
                Create a new Employee account according to the existing HR
                account-creation workflow.
              </p>
            </div>
          </div>

          {message && (
            <div className="hr-employee-success" role="status">
              {message}
            </div>
          )}

          {error && (
            <div className="hr-employee-error" role="alert">
              {error}
            </div>
          )}

          {optionsLoading ? (
            <p className="hr-employee-empty">
              Loading departments and designations...
            </p>
          ) : (
            <form className="hr-employee-form" onSubmit={handleCreateEmployee}>
              <div className="hr-employee-form-grid">
                {/* Full Name */}
                <div className="hr-employee-form-group">
                  <label htmlFor="employee-name">Full Name</label>

                  <input
                    id="employee-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Official Email */}
                <div className="hr-employee-form-group">
                  <label htmlFor="employee-email">Official Email</label>

                  <input
                    id="employee-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter official email"
                    required
                  />
                </div>

                {/* Personal Email */}
                <div className="hr-employee-form-group">
                  <label htmlFor="employee-personal-email">
                    Personal Email
                  </label>

                  <input
                    id="employee-personal-email"
                    type="email"
                    name="personalEmail"
                    value={formData.personalEmail}
                    onChange={handleChange}
                    placeholder="Enter personal email"
                    required
                  />
                </div>

                {/* Joining Date */}
                <div className="hr-employee-form-group">
                  <label htmlFor="employee-joining-date">Joining Date</label>

                  <input
                    id="employee-joining-date"
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Employment Type */}
                <div className="hr-employee-form-group">
                  <label htmlFor="employee-employment-type">
                    Employment Type
                  </label>

                  <select
                    id="employee-employment-type"
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

                {/* Work Location */}
                <div className="hr-employee-form-group">
                  <label htmlFor="employee-work-location">Work Location</label>

                  <input
                    id="employee-work-location"
                    type="text"
                    name="workLocation"
                    value={formData.workLocation}
                    onChange={handleChange}
                    placeholder="Enter work location"
                    required
                  />
                </div>

                {/* Department */}
                <div className="hr-employee-form-group">
                  <label htmlFor="employee-department">Department</label>

                  <select
                    id="employee-department"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    required
                    disabled={departments.length === 0}
                  >
                    <option value="">
                      {departments.length === 0
                        ? "No departments available"
                        : "Select department"}
                    </option>

                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div className="hr-employee-form-group">
                  <label htmlFor="employee-designation">Designation</label>

                  <select
                    id="employee-designation"
                    name="designationId"
                    value={formData.designationId}
                    onChange={handleChange}
                    required
                    disabled={designations.length === 0}
                  >
                    <option value="">
                      {designations.length === 0
                        ? "No designations available"
                        : "Select designation"}
                    </option>

                    {designations.map((designation) => (
                      <option key={designation.id} value={designation.id}>
                        {designation.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="hr-employee-form-actions">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    optionsLoading ||
                    departments.length === 0 ||
                    designations.length === 0
                  }
                >
                  {loading ? "Creating..." : "Create Employee Account"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* TAB 2: EMPLOYEE LIST & PROFILES */}
      {activeTab === "list" && (
        <section className="hr-employee-card">
          <div className="hr-employee-section-heading">
            <div>
              <h2>Employee List & Profiles</h2>
              <p>Search employee accounts and open their complete profiles.</p>
            </div>

            <div className="hr-employee-list-count">
              <span>Total Employees</span>
              <strong>{employees.length}</strong>
            </div>
          </div>

          {employeeListError && (
            <div className="hr-employee-error">{employeeListError}</div>
          )}

          <div className="hr-employee-search">
            <input
              type="text"
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              placeholder="Search by employee ID, name, or official email..."
              aria-label="Search employees"
            />

            {employeeSearch && (
              <button type="button" onClick={() => setEmployeeSearch("")}>
                Clear
              </button>
            )}
          </div>

          {employeeListLoading ? (
            <p className="hr-employee-empty">Loading employee accounts...</p>
          ) : (
            <div className="hr-employee-table-wrapper">
              <table className="hr-employee-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Employee</th>
                    <th>Official Email</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="hr-employee-table-empty">
                        {employees.length === 0
                          ? "No employee accounts found."
                          : "No employees match your search."}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => {
                      const departmentName =
                        employee.department?.name ||
                        departments.find(
                          (department) =>
                            String(department.id) ===
                            String(
                              employee.departmentId ??
                                employee.department?.id ??
                                "",
                            ),
                        )?.name ||
                        "—";

                      const designationName =
                        employee.designation?.name ||
                        designations.find(
                          (designation) =>
                            String(designation.id) ===
                            String(
                              employee.designationId ??
                                employee.designation?.id ??
                                "",
                            ),
                        )?.name ||
                        "—";

                      const status = String(
                        employee.status || "UNKNOWN",
                      ).toLowerCase();

                      return (
                        <tr key={employee.id}>
                          <td>#{employee.id}</td>

                          <td>
                            <div className="hr-employee-table-person">
                              <strong>{employee.name || "—"}</strong>
                              <span>{employee.role || "EMPLOYEE"}</span>
                            </div>
                          </td>

                          <td>{employee.email || "—"}</td>

                          <td>{departmentName}</td>

                          <td>{designationName}</td>

                          <td>
                            <span
                              className={`hr-employee-status hr-employee-status-${status}`}
                            >
                              {employee.status || "UNKNOWN"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="hr-employee-view-button"
                              onClick={() =>
                                handleViewEmployeeProfile(employee.id)
                              }
                              disabled={profileLoading}
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {profileLoading && (
            <p className="hr-employee-empty">Loading employee profile...</p>
          )}

          {/* Selected Employee Profile */}
          {selectedEmployee && (
            <div className="hr-employee-profile">
              <div className="hr-employee-profile-header">
                <div>
                  <h2>Employee Profile</h2>
                  <p>Employee ID: #{selectedEmployee.id}</p>
                </div>

                <button
                  type="button"
                  className="hr-employee-close-button"
                  onClick={() => {
                    setSelectedEmployee(null);
                    resetEditModes();
                    setProfileSuccess("");
                    setProfileError("");
                  }}
                >
                  Close Profile
                </button>
              </div>

              {profileSuccess && (
                <div className="hr-employee-success">{profileSuccess}</div>
              )}

              {profileError && (
                <div className="hr-employee-error">{profileError}</div>
              )}

              {/* Account Information */}
              <section className="hr-employee-profile-section">
                <div className="hr-employee-profile-section-header">
                  <div>
                    <h3>Account Information</h3>
                    <p>Employee account details and current status.</p>
                  </div>
                  {!editAccount && (
                    <button
                      type="button"
                      className="hr-employee-edit-button"
                      onClick={() => startEditingEmployeeSection("account")}
                    >
                      ✎ Edit
                    </button>
                  )}
                </div>

                <div className="hr-employee-profile-grid">
                  <div className="hr-employee-form-group">
                    <label>
                      Employee ID <ReadOnlyLock />
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.id ?? ""}
                      readOnly
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={
                        editAccount
                          ? editEmployeeData.name
                          : selectedEmployee.name || ""
                      }
                      onChange={handleEditEmployeeChange}
                      readOnly={!editAccount}
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>
                      Official Email <ReadOnlyLock />
                    </label>
                    <input
                      type="email"
                      value={selectedEmployee.email || ""}
                      readOnly
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>
                      Role <ReadOnlyLock />
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.role || "EMPLOYEE"}
                      readOnly
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>
                      Account Status <ReadOnlyLock />
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.status || "UNKNOWN"}
                      readOnly
                    />
                  </div>
                </div>

                {editAccount && (
                  <div className="hr-employee-form-actions">
                    <button
                      type="button"
                      onClick={handleSaveEmployeeAccount}
                      disabled={profileSaving}
                    >
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={() => cancelEditingEmployeeSection("account")}
                      disabled={profileSaving}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </section>

              {/* Personal Information */}
              <section className="hr-employee-profile-section">
                <div className="hr-employee-profile-section-header">
                  <div>
                    <h3>Personal Information</h3>
                    <p>Personal contact details and residential address.</p>
                  </div>

                  {!editPersonal && (
                    <button
                      type="button"
                      className="hr-employee-edit-button"
                      onClick={() => startEditingEmployeeSection("personal")}
                    >
                      ✎ Edit
                    </button>
                  )}
                </div>

                <div className="hr-employee-profile-grid">
                  <div className="hr-employee-form-group">
                    <label>Personal Email</label>
                    <input
                      type="email"
                      name="personalEmail"
                      value={
                        editPersonal
                          ? editEmployeeData.personalEmail
                          : selectedEmployee.personalEmail || ""
                      }
                      onChange={handleEditEmployeeChange}
                      readOnly={!editPersonal}
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={
                        editPersonal
                          ? editEmployeeData.phoneNumber
                          : selectedEmployee.phoneNumber || ""
                      }
                      onChange={handleEditEmployeeChange}
                      readOnly={!editPersonal}
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>Residential Address</label>
                    <textarea
                      name="address"
                      rows="3"
                      value={
                        editPersonal
                          ? editEmployeeData.address
                          : selectedEmployee.address || ""
                      }
                      onChange={handleEditEmployeeChange}
                      readOnly={!editPersonal}
                    />
                  </div>
                </div>

                {editPersonal && (
                  <div className="hr-employee-form-actions">
                    <button
                      type="button"
                      onClick={handleSaveEmployeePersonal}
                      disabled={profileSaving}
                    >
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={() => cancelEditingEmployeeSection("personal")}
                      disabled={profileSaving}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </section>

              {/* Employment Information */}
              <section className="hr-employee-profile-section">
                <div className="hr-employee-profile-section-header">
                  <div>
                    <h3>Employment Information</h3>
                    <p>Department, designation, and employment details.</p>
                  </div>

                  {!editEmployment && (
                    <button
                      type="button"
                      className="hr-employee-edit-button"
                      onClick={() => startEditingEmployeeSection("employment")}
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="hr-employee-profile-grid">
                  <div className="hr-employee-form-group">
                    <label>Joining Date</label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={
                        editEmployment
                          ? editEmployeeData.joiningDate
                          : normalizeDate(selectedEmployee.joiningDate)
                      }
                      onChange={handleEditEmployeeChange}
                      readOnly={!editEmployment}
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>Department</label>
                    <select
                      name="departmentId"
                      value={
                        editEmployment
                          ? editEmployeeData.departmentId
                          : (selectedEmployee.departmentId ??
                            selectedEmployee.department?.id ??
                            "")
                      }
                      onChange={handleEditEmployeeChange}
                      disabled={!editEmployment}
                    >
                      <option value="">Select Department</option>

                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="hr-employee-form-group">
                    <label>Designation</label>
                    <select
                      name="designationId"
                      value={
                        editEmployment
                          ? editEmployeeData.designationId
                          : (selectedEmployee.designationId ??
                            selectedEmployee.designation?.id ??
                            "")
                      }
                      onChange={handleEditEmployeeChange}
                      disabled={!editEmployment}
                    >
                      <option value="">Select Designation</option>

                      {designations.map((designation) => (
                        <option key={designation.id} value={designation.id}>
                          {designation.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="hr-employee-form-group">
                    <label>
                      Employment Type <ReadOnlyLock />
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.employmentType || "—"}
                      readOnly
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>
                      Work Location <ReadOnlyLock />
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.workLocation || "—"}
                      readOnly
                    />
                  </div>
                </div>

                {editEmployment && (
                  <div className="hr-employee-form-actions">
                    <button
                      type="button"
                      onClick={handleSaveEmployeeEmployment}
                      disabled={profileSaving}
                    >
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={() => cancelEditingEmployeeSection("employment")}
                      disabled={profileSaving}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </section>

              {/* Reporting Authority */}
              <section className="hr-employee-profile-section">
                <div className="hr-employee-profile-section-header">
                  <div>
                    <h3>Reporting Authority</h3>
                    <p>Manager responsible for this employee.</p>
                  </div>
                </div>

                <div className="hr-employee-profile-grid">
                  <div className="hr-employee-form-group">
                    <label>
                      Manager ID <ReadOnlyLock />
                    </label>
                    <input
                      type="text"
                      value={
                        selectedEmployee.managerId ??
                        selectedEmployee.manager?.id ??
                        "Not Assigned"
                      }
                      readOnly
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>
                      Manager Name <ReadOnlyLock />
                    </label>
                    <input
                      type="text"
                      value={
                        selectedEmployee.reportingAuthorityName ??
                        selectedEmployee.manager?.name ??
                        selectedEmployee.managerName ??
                        "Not Available"
                      }
                      readOnly
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>
                      Manager Email <ReadOnlyLock />
                    </label>
                    <input
                      type="email"
                      value={
                        selectedEmployee.reportingAuthorityEmail ??
                        selectedEmployee.manager?.email ??
                        selectedEmployee.managerEmail ??
                        "Not Available"
                      }
                      readOnly
                    />
                  </div>
                </div>
              </section>

              {/* Emergency Contact */}
              <section className="hr-employee-profile-section">
                <div className="hr-employee-profile-section-header">
                  <div>
                    <h3>Emergency Contact</h3>
                    <p>Contact information to use in an emergency.</p>
                  </div>

                  {!editEmergency && (
                    <button
                      type="button"
                      className="hr-employee-edit-button"
                      onClick={() => startEditingEmployeeSection("emergency")}
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="hr-employee-profile-grid">
                  <div className="hr-employee-form-group">
                    <label>Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={
                        editEmergency
                          ? editEmployeeData.emergencyContactName
                          : selectedEmployee.emergencyContactName || ""
                      }
                      onChange={handleEditEmployeeChange}
                      readOnly={!editEmergency}
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>Relationship</label>
                    <input
                      type="text"
                      name="emergencyContactRelationship"
                      value={
                        editEmergency
                          ? editEmployeeData.emergencyContactRelationship
                          : selectedEmployee.emergencyContactRelationship || ""
                      }
                      onChange={handleEditEmployeeChange}
                      readOnly={!editEmergency}
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>Contact Phone</label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={
                        editEmergency
                          ? editEmployeeData.emergencyContactPhone
                          : selectedEmployee.emergencyContactPhone || ""
                      }
                      onChange={handleEditEmployeeChange}
                      readOnly={!editEmergency}
                    />
                  </div>

                  <div className="hr-employee-form-group">
                    <label>Contact Address</label>
                    <textarea
                      name="emergencyContactAddress"
                      rows="3"
                      value={
                        editEmergency
                          ? editEmployeeData.emergencyContactAddress
                          : selectedEmployee.emergencyContactAddress || ""
                      }
                      onChange={handleEditEmployeeChange}
                      readOnly={!editEmergency}
                    />
                  </div>
                </div>

                {editEmergency && (
                  <div className="hr-employee-form-actions">
                    <button
                      type="button"
                      onClick={handleSaveEmployeeEmergency}
                      disabled={profileSaving}
                    >
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={() => cancelEditingEmployeeSection("emergency")}
                      disabled={profileSaving}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: ASSIGN EMPLOYEE */}
      {activeTab === "assign" && (
        <section className="hr-employee-card">
          <div className="hr-employee-section-heading">
            <div>
              <h2>Assign Employee</h2>
              <p>
                Assign employees to managers and review their existing teams.
              </p>
            </div>
          </div>

          {assignmentError && (
            <div className="hr-employee-error">{assignmentError}</div>
          )}

          {assignmentSuccess && (
            <div className="hr-employee-success">{assignmentSuccess}</div>
          )}

          {assignmentLoading ? (
            <p className="hr-employee-empty">
              Loading employees and managers...
            </p>
          ) : (
            <>
              <form
                className="hr-employee-form"
                onSubmit={handleAssignEmployee}
              >
                <div className="hr-employee-form-grid">
                  <div className="hr-employee-form-group">
                    <label htmlFor="assignmentManager">Select Manager</label>

                    <select
                      id="assignmentManager"
                      value={selectedManagerId}
                      onChange={(event) =>
                        handleLoadManagerTeam(event.target.value)
                      }
                      required
                    >
                      <option value="">Choose a manager</option>

                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name} (ID: {manager.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="hr-employee-form-group">
                    <label htmlFor="assignmentEmployee">Select Employee</label>

                    <select
                      id="assignmentEmployee"
                      value={selectedAssignmentEmployeeId}
                      onChange={(event) =>
                        setSelectedAssignmentEmployeeId(event.target.value)
                      }
                      required
                    >
                      <option value="">Choose an employee</option>

                      {employees
                        .filter((employee) => {
                          const alreadyInSelectedTeam = managerTeam.some(
                            (teamEmployee) =>
                              String(teamEmployee.id) === String(employee.id),
                          );

                          return (
                            String(employee.managerId ?? "") !==
                              String(selectedManagerId) &&
                            !alreadyInSelectedTeam
                          );
                        })
                        .map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} (ID: {employee.id})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="hr-employee-form-actions">
                  <button
                    type="submit"
                    disabled={
                      assignmentSaving ||
                      !selectedManagerId ||
                      !selectedAssignmentEmployeeId
                    }
                  >
                    {assignmentSaving ? "Assigning..." : "Assign Employee"}
                  </button>
                </div>
              </form>

              <div className="hr-employee-team-section">
                <div className="hr-employee-section-heading">
                  <div>
                    <h3>Manager's Team</h3>
                    <p>
                      {selectedManagerId
                        ? `Employees currently assigned to manager ID ${selectedManagerId}.`
                        : "Select a manager to view their team."}
                    </p>
                  </div>
                </div>

                {managerTeamError && (
                  <div className="hr-employee-error">{managerTeamError}</div>
                )}

                {managerTeamLoading ? (
                  <p className="hr-employee-empty">Loading manager's team...</p>
                ) : selectedManagerId ? (
                  <div className="hr-employee-table-wrapper">
                    <table className="hr-employee-table">
                      <thead>
                        <tr>
                          <th>Employee ID</th>
                          <th>Employee Name</th>
                          <th>Official Email</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {managerTeam.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="hr-employee-table-empty">
                              No employees are currently assigned to this
                              manager.
                            </td>
                          </tr>
                        ) : (
                          managerTeam.map((employee) => (
                            <tr key={employee.id}>
                              <td>#{employee.id}</td>
                              <td>{employee.name || "—"}</td>
                              <td>{employee.email || "—"}</td>
                              <td>
                                <span
                                  className={`hr-employee-status hr-employee-status-${String(
                                    employee.status || "UNKNOWN",
                                  ).toLowerCase()}`}
                                >
                                  {employee.status || "UNKNOWN"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="hr-employee-empty">
                    Choose a manager above to view their team.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
