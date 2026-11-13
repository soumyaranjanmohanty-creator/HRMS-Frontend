import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/HRManagerManagement.css";

// Keep reusable components outside the main component.
// This prevents input fields from losing focus while typing.

function ProfileField({ label, value, locked = false }) {
  return (
    <div className="hr-manager-profile-field">
      <label>{label}</label>

      <div className="hr-manager-profile-readonly">
        <span>{value || "—"}</span>
        {locked && <span aria-label="Not editable">🔒</span>}
      </div>
    </div>
  );
}

function EditField({
  label,
  name,
  value,
  type = "text",
  required = false,
  onChange,
}) {
  return (
    <div className="hr-manager-edit-field">
      <label htmlFor={`manager-edit-${name}`}>{label}</label>
      <input
        id={`manager-edit-${name}`}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}

function EditActions({ onSave, onCancel, profileSaving }) {
  return (
    <div className="hr-manager-edit-actions">
      <button
        type="button"
        className="hr-manager-save-button"
        onClick={onSave}
        disabled={profileSaving}
      >
        {profileSaving ? "Saving..." : "Save Changes"}
      </button>

      <button
        type="button"
        className="hr-manager-cancel-button"
        onClick={onCancel}
        disabled={profileSaving}
      >
        Cancel
      </button>
    </div>
  );
}

export default function HRManagerManagement() {
  const [activeTab, setActiveTab] = useState("create");

  // Department and designation options
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Create Manager Account form
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
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Manager List & Profiles
  const [managers, setManagers] = useState([]);
  const [managerListLoading, setManagerListLoading] = useState(false);
  const [managerListError, setManagerListError] = useState("");
  const [managerSearch, setManagerSearch] = useState("");
  const [selectedManager, setSelectedManager] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Manager profile editing
  const [editAccount, setEditAccount] = useState(false);
  const [editPersonal, setEditPersonal] = useState(false);
  const [editEmployment, setEditEmployment] = useState(false);
  const [editEmergency, setEditEmergency] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Assign Employees
  const [assignmentManagers, setAssignmentManagers] = useState([]);
  const [assignmentEmployees, setAssignmentEmployees] = useState([]);
  const [assignmentManagerId, setAssignmentManagerId] = useState("");
  const [assignmentTeam, setAssignmentTeam] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentTeamLoading, setAssignmentTeamLoading] = useState(false);
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [assignmentError, setAssignmentError] = useState("");

  // Role Actions
  const [actionEmployees, setActionEmployees] = useState([]);
  const [actionManagers, setActionManagers] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const [editManagerData, setEditManagerData] = useState({
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

  // Load department and designation options
  useEffect(() => {
    const loadFormOptions = async () => {
      setOptionsLoading(true);

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
        console.error("Failed to load departments/designations:", err);

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

  // Load manager list when the list tab opens
  useEffect(() => {
    if (activeTab !== "list") {
      return;
    }

    const loadManagers = async () => {
      setManagerListLoading(true);
      setManagerListError("");

      try {
        const response = await api.get("/users/role/MANAGER");

        setManagers(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Failed to load managers:", err);

        setManagerListError(
          err.response?.data?.message ||
            "Failed to load manager accounts. Please try again.",
        );
      } finally {
        setManagerListLoading(false);
      }
    };

    loadManagers();
  }, [activeTab]);

  // Load managers and employees when Assign Employees opens
  useEffect(() => {
    if (activeTab !== "assign") {
      return;
    }

    const loadAssignmentData = async () => {
      setAssignmentLoading(true);
      setAssignmentError("");

      try {
        const [managerResponse, employeeResponse] = await Promise.all([
          api.get("/users/role/MANAGER"),
          api.get("/users/role/EMPLOYEE"),
        ]);

        const managerData = Array.isArray(managerResponse.data)
          ? managerResponse.data
          : [];

        const employeeData = Array.isArray(employeeResponse.data)
          ? employeeResponse.data
          : [];

        setAssignmentManagers(managerData);
        setAssignmentEmployees(employeeData);

        console.log("Assignment managers:", managerData);
        console.log("Assignment employees:", employeeData);

        if (managerData.length === 0) {
          setAssignmentError(
            "The managers API returned no records. Check the browser console.",
          );
        }
      } catch (err) {
        console.error("Failed to load assignment data:", err);

        setAssignmentError(
          err.response?.data?.message ||
            "Failed to load managers and employees. Please check the API response.",
        );
      } finally {
        setAssignmentLoading(false);
      }
    };

    loadAssignmentData();
  }, [activeTab]);

  // Load the selected manager's team whenever the manager changes
  useEffect(() => {
    if (activeTab !== "assign" || !assignmentManagerId) {
      setAssignmentTeam([]);
      return;
    }

    let cancelled = false;

    const loadAssignmentTeam = async () => {
      setAssignmentTeamLoading(true);
      setAssignmentError("");

      try {
        const response = await api.get(`/managers/${assignmentManagerId}/team`);

        if (!cancelled) {
          setAssignmentTeam(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        console.error("Failed to load manager team:", err);

        if (!cancelled) {
          setAssignmentTeam([]);
          setAssignmentError(
            err.response?.data?.message ||
              "Failed to load employees for the selected manager.",
          );
        }
      } finally {
        if (!cancelled) {
          setAssignmentTeamLoading(false);
        }
      }
    };

    loadAssignmentTeam();

    return () => {
      cancelled = true;
    };
  }, [activeTab, assignmentManagerId]);

  // Load data for Role Actions
  useEffect(() => {
    if (activeTab !== "actions") {
      return;
    }

    const loadRoleActionData = async () => {
      setActionLoading(true);
      setActionError("");
      setActionMessage("");

      try {
        const [employeeResponse, managerResponse] = await Promise.all([
          api.get("/users/role/EMPLOYEE"),
          api.get("/users/role/MANAGER"),
        ]);

        setActionEmployees(employeeResponse.data);
        setActionManagers(managerResponse.data);
      } catch (error) {
        console.error("Failed to load Role Actions data:", error);

        setActionError(
          error.response?.data?.message ||
            "Failed to load employees and managers. Please try again.",
        );
      } finally {
        setActionLoading(false);
      }
    };

    loadRoleActionData();
  }, [activeTab]);

  // Get department name
  const getDepartmentName = (manager) => {
    if (manager?.department?.name) {
      return manager.department.name;
    }

    const department = departments.find(
      (item) => String(item.id) === String(manager?.departmentId),
    );

    return department?.name || "—";
  };

  // Get designation name
  const getDesignationName = (manager) => {
    if (manager?.designation?.name) {
      return manager.designation.name;
    }

    const designation = designations.find(
      (item) => String(item.id) === String(manager?.designationId),
    );

    return designation?.name || "—";
  };

  // Normalize date for an HTML date input
  const normalizeDate = (value) => {
    if (!value) {
      return "";
    }

    return String(value).substring(0, 10);
  };

  // Populate the editing form from the selected manager
  const populateEditData = (manager) => {
    setEditManagerData({
      name: manager.name || "",
      personalEmail: manager.personalEmail || "",
      phoneNumber: manager.phoneNumber || "",
      address: manager.address || "",
      joiningDate: normalizeDate(manager.joiningDate),
      departmentId: manager.departmentId ?? manager.department?.id ?? "",
      designationId: manager.designationId ?? manager.designation?.id ?? "",
      emergencyContactName: manager.emergencyContactName || "",
      emergencyContactRelationship: manager.emergencyContactRelationship || "",
      emergencyContactPhone: manager.emergencyContactPhone || "",
      emergencyContactAddress: manager.emergencyContactAddress || "",
    });
  };

  // Reset all edit modes
  const resetEditModes = () => {
    setEditAccount(false);
    setEditPersonal(false);
    setEditEmployment(false);
    setEditEmergency(false);
  };

  // Open a manager profile
  const handleViewManagerProfile = async (managerId) => {
    setProfileLoading(true);
    setManagerListError("");
    setProfileSuccess("");
    setProfileError("");
    setSelectedManager(null);
    resetEditModes();

    try {
      const response = await api.get(`/users/${managerId}`);

      setSelectedManager(response.data);
      populateEditData(response.data);
    } catch (err) {
      console.error("Failed to load manager profile:", err);

      setManagerListError(
        err.response?.data?.message ||
          "Failed to load manager profile. Please try again.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // Refresh selected profile and manager list after an update
  const refreshManagerProfile = async (managerId) => {
    const response = await api.get(`/users/${managerId}`);

    setSelectedManager(response.data);
    populateEditData(response.data);

    const managersResponse = await api.get("/users/role/MANAGER");

    setManagers(
      Array.isArray(managersResponse.data) ? managersResponse.data : [],
    );
  };

  // Handle Create Manager Account changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create Manager Account
  const handleCreateManager = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        personalEmail: formData.personalEmail.trim(),
        role: "MANAGER",
        departmentId: Number(formData.departmentId),
        designationId: Number(formData.designationId),
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType,
        workLocation: formData.workLocation.trim(),
      };

      const response = await api.post("/register", payload);

      setMessage(
        response.data?.message ||
          `Manager account created successfully. Name: ${
            response.data.name || formData.name
          }, Email: ${response.data.email || formData.email}`,
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
      console.error("Create Manager error:", err);

      const responseData = err.response?.data;

      setError(
        responseData?.message ||
          (typeof responseData === "string"
            ? responseData
            : `Failed to create manager account${
                err.response?.status ? ` (HTTP ${err.response.status})` : ""
              }.`),
      );
    } finally {
      setLoading(false);
    }
  };

  // Update editing form fields
  const handleEditManagerChange = (event) => {
    const { name, value } = event.target;

    setEditManagerData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Handle errors returned by backend
  const getApiError = (err, fallbackMessage) => {
    const responseData = err.response?.data;

    if (responseData?.message) {
      return responseData.message;
    }

    if (typeof responseData === "string") {
      return responseData;
    }

    return fallbackMessage;
  };

  // Start editing a section
  const startEditing = (section) => {
    if (!selectedManager) {
      return;
    }

    setProfileSuccess("");
    setProfileError("");

    // Restore original values before editing
    populateEditData(selectedManager);

    resetEditModes();

    if (section === "account") {
      setEditAccount(true);
    }

    if (section === "personal") {
      setEditPersonal(true);
    }

    if (section === "employment") {
      setEditEmployment(true);
    }

    if (section === "emergency") {
      setEditEmergency(true);
    }
  };

  // Cancel editing and restore saved values
  const cancelEditing = () => {
    if (selectedManager) {
      populateEditData(selectedManager);
    }

    resetEditModes();
    setProfileError("");
    setProfileSuccess("");
  };

  // Save Account Information
  const handleSaveAccount = async () => {
    if (!selectedManager) {
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      await api.put(`/users/${selectedManager.id}/profile`, {
        name: editManagerData.name.trim(),
      });

      await refreshManagerProfile(selectedManager.id);

      setEditAccount(false);
      setProfileSuccess("Manager account information updated successfully.");
    } catch (err) {
      console.error("Failed to update manager account:", err);

      setProfileError(
        getApiError(err, "Failed to update manager account information."),
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Save Personal Information
  const handleSavePersonal = async () => {
    if (!selectedManager) {
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      await api.put(`/users/${selectedManager.id}/profile`, {
        personalEmail: editManagerData.personalEmail.trim(),
        phoneNumber: editManagerData.phoneNumber.trim(),
        address: editManagerData.address.trim(),
      });

      await refreshManagerProfile(selectedManager.id);

      setEditPersonal(false);
      setProfileSuccess("Manager personal information updated successfully.");
    } catch (err) {
      console.error("Failed to update manager personal information:", err);

      setProfileError(
        getApiError(err, "Failed to update manager personal information."),
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Save Employment Information
  const handleSaveEmployment = async () => {
    if (!selectedManager) {
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      await api.put(`/users/${selectedManager.id}/profile`, {
        joiningDate: editManagerData.joiningDate || null,
      });

      if (
        editManagerData.departmentId &&
        String(editManagerData.departmentId) !==
          String(
            selectedManager.departmentId ??
              selectedManager.department?.id ??
              "",
          )
      ) {
        await api.put(
          `/users/${selectedManager.id}/department/${Number(
            editManagerData.departmentId,
          )}`,
        );
      }

      if (
        editManagerData.designationId &&
        String(editManagerData.designationId) !==
          String(
            selectedManager.designationId ??
              selectedManager.designation?.id ??
              "",
          )
      ) {
        await api.put(
          `/users/${selectedManager.id}/designation/${Number(
            editManagerData.designationId,
          )}`,
        );
      }

      await refreshManagerProfile(selectedManager.id);

      setEditEmployment(false);
      setProfileSuccess("Manager employment information updated successfully.");
    } catch (err) {
      console.error("Failed to update manager employment information:", err);

      setProfileError(
        getApiError(err, "Failed to update manager employment information."),
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Save Emergency Contact Information
  const handleSaveEmergency = async () => {
    if (!selectedManager) {
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      await api.put(`/users/${selectedManager.id}/emergency-contact`, {
        emergencyContactName: editManagerData.emergencyContactName.trim(),
        emergencyContactRelationship:
          editManagerData.emergencyContactRelationship.trim(),
        emergencyContactPhone: editManagerData.emergencyContactPhone.trim(),
        emergencyContactAddress: editManagerData.emergencyContactAddress.trim(),
      });

      await refreshManagerProfile(selectedManager.id);

      setEditEmergency(false);
      setProfileSuccess("Manager emergency contact updated successfully.");
    } catch (err) {
      console.error("Failed to update manager emergency contact:", err);

      setProfileError(
        getApiError(err, "Failed to update manager emergency contact."),
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Promote an Employee to Manager
  const handlePromoteEmployee = async (employeeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to promote this employee to Manager?",
    );

    if (!confirmed) {
      return;
    }

    setActionProcessing(true);
    setActionError("");
    setActionMessage("");

    try {
      const response = await api.post(
        `/users/${employeeId}/promote-to-manager`,
      );

      setActionMessage(
        typeof response.data === "string"
          ? response.data
          : "Employee promoted to Manager successfully.",
      );

      const [employeeResponse, managerResponse] = await Promise.all([
        api.get("/users/role/EMPLOYEE"),
        api.get("/users/role/MANAGER"),
      ]);

      setActionEmployees(
        Array.isArray(employeeResponse.data) ? employeeResponse.data : [],
      );

      setActionManagers(
        Array.isArray(managerResponse.data) ? managerResponse.data : [],
      );
    } catch (error) {
      console.error("Failed to promote employee:", error);

      setActionError(
        error.response?.data?.message ||
          (typeof error.response?.data === "string"
            ? error.response.data
            : "Failed to promote employee. Please try again."),
      );
    } finally {
      setActionProcessing(false);
    }
  };

  // Demote a Manager to Employee
  const handleDemoteManager = async (managerId) => {
    // Check whether the manager still has assigned employees.
    setActionProcessing(true);
    setActionError("");
    setActionMessage("");

    try {
      const teamResponse = await api.get(`/managers/${managerId}/team`);

      const team = Array.isArray(teamResponse.data) ? teamResponse.data : [];

      if (team.length > 0) {
        setActionError(
          "This manager has assigned employees. Reassign those employees before demoting the manager.",
        );
        return;
      }

      const confirmed = window.confirm(
        "Are you sure you want to demote this Manager to Employee?",
      );

      if (!confirmed) {
        return;
      }

      const response = await api.post(`/users/${managerId}/demote-to-employee`);

      setActionMessage(
        typeof response.data === "string"
          ? response.data
          : "Manager demoted to Employee successfully.",
      );

      const [employeeResponse, managerResponse] = await Promise.all([
        api.get("/users/role/EMPLOYEE"),
        api.get("/users/role/MANAGER"),
      ]);

      setActionEmployees(
        Array.isArray(employeeResponse.data) ? employeeResponse.data : [],
      );

      setActionManagers(
        Array.isArray(managerResponse.data) ? managerResponse.data : [],
      );
    } catch (error) {
      console.error("Failed to demote manager:", error);

      setActionError(
        error.response?.data?.message ||
          (typeof error.response?.data === "string"
            ? error.response.data
            : "Failed to demote manager. Please try again."),
      );
    } finally {
      setActionProcessing(false);
    }
  };

  // Assign an employee to the selected manager
  const handleAssignEmployee = async () => {
    if (!assignmentManagerId || !assignmentEmployeeId) {
      setAssignmentError("Select both a manager and an employee.");
      setAssignmentMessage("");
      return;
    }

    setAssignmentError("");
    setAssignmentMessage("");

    try {
      await api.post(
        `/users/${assignmentEmployeeId}/assign-manager/${assignmentManagerId}`,
      );

      setAssignmentMessage(
        "Employee assigned to the selected manager successfully.",
      );

      setAssignmentEmployeeId("");

      // Refresh the selected manager's team and employee list
      const [teamResponse, employeeResponse] = await Promise.all([
        api.get(`/managers/${assignmentManagerId}/team`),
        api.get("/users/role/EMPLOYEE"),
      ]);

      setAssignmentTeam(
        Array.isArray(teamResponse.data) ? teamResponse.data : [],
      );

      setAssignmentEmployees(
        Array.isArray(employeeResponse.data) ? employeeResponse.data : [],
      );
    } catch (err) {
      console.error("Failed to assign employee:", err);

      setAssignmentError(
        err.response?.data?.message ||
          "Failed to assign employee. Please try again.",
      );
    }
  };

  // Get the selected manager for the Assign Employees section
  const selectedAssignmentManager = assignmentManagers.find(
    (manager) => String(manager.id) === String(assignmentManagerId),
  );

  // Get IDs of employees already assigned to this manager
  const assignedEmployeeIds = new Set(
    assignmentTeam.map((employee) => String(employee.id)),
  );

  // Filter employees by ID, name, or email
  const filteredAssignmentEmployees = assignmentEmployees.filter((employee) => {
    const search = assignmentSearch.trim().toLowerCase();

    return (
      !search ||
      String(employee.id ?? "")
        .toLowerCase()
        .includes(search) ||
      (employee.name || "").toLowerCase().includes(search) ||
      (employee.email || "").toLowerCase().includes(search)
    );
  });

  // Filter managers by name or official email
  const filteredManagers = managers.filter((manager) => {
    const search = managerSearch.trim().toLowerCase();

    return (
      !search ||
      (manager.name || "").toLowerCase().includes(search) ||
      (manager.email || "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="hr-manager-management">
      {/* Page Header */}
      <div className="hr-manager-page-header">
        <div>
          <h1>Manager Management</h1>
          <p>
            Create and manage Manager accounts, employee assignments, and role
            changes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="hr-manager-tabs">
        <button
          type="button"
          className={activeTab === "create" ? "active" : ""}
          onClick={() => setActiveTab("create")}
        >
          Create Manager Account
        </button>

        <button
          type="button"
          className={activeTab === "list" ? "active" : ""}
          onClick={() => setActiveTab("list")}
        >
          Manager List & Profiles
        </button>

        <button
          type="button"
          className={activeTab === "assign" ? "active" : ""}
          onClick={() => setActiveTab("assign")}
        >
          Assign Employees
        </button>

        <button
          type="button"
          className={activeTab === "actions" ? "active" : ""}
          onClick={() => setActiveTab("actions")}
        >
          Role Actions
        </button>
      </div>

      {/* TAB 1: CREATE MANAGER ACCOUNT */}
      {activeTab === "create" && (
        <section className="hr-manager-card">
          <div className="hr-manager-section-heading">
            <div>
              <h2>Create Manager Account</h2>
              <p>Create a new Manager account according to the HR hierarchy.</p>
            </div>
          </div>

          {message && <div className="hr-manager-success">{message}</div>}

          {error && <div className="hr-manager-error">{error}</div>}

          <form className="hr-manager-form" onSubmit={handleCreateManager}>
            <div className="hr-manager-form-grid">
              <div className="hr-manager-form-group">
                <label htmlFor="manager-name">Full Name</label>
                <input
                  id="manager-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="hr-manager-form-group">
                <label htmlFor="manager-email">Official Email</label>
                <input
                  id="manager-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter official email"
                  required
                />
              </div>

              <div className="hr-manager-form-group">
                <label htmlFor="manager-personal-email">Personal Email</label>
                <input
                  id="manager-personal-email"
                  type="email"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleChange}
                  placeholder="Enter personal email"
                  required
                />
              </div>

              <div className="hr-manager-form-group">
                <label htmlFor="manager-joining-date">Joining Date</label>
                <input
                  id="manager-joining-date"
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="hr-manager-form-group">
                <label htmlFor="manager-employment-type">Employment Type</label>
                <select
                  id="manager-employment-type"
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

              <div className="hr-manager-form-group">
                <label htmlFor="manager-work-location">Work Location</label>
                <input
                  id="manager-work-location"
                  type="text"
                  name="workLocation"
                  value={formData.workLocation}
                  onChange={handleChange}
                  placeholder="Enter work location"
                  required
                />
              </div>

              <div className="hr-manager-form-group">
                <label htmlFor="manager-department">Department</label>
                <select
                  id="manager-department"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                  disabled={optionsLoading || departments.length === 0}
                >
                  <option value="">
                    {optionsLoading
                      ? "Loading departments..."
                      : departments.length === 0
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

              <div className="hr-manager-form-group">
                <label htmlFor="manager-designation">Designation</label>
                <select
                  id="manager-designation"
                  name="designationId"
                  value={formData.designationId}
                  onChange={handleChange}
                  required
                  disabled={optionsLoading || designations.length === 0}
                >
                  <option value="">
                    {optionsLoading
                      ? "Loading designations..."
                      : designations.length === 0
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

            <div className="hr-manager-form-actions">
              <button type="submit" disabled={loading || optionsLoading}>
                {loading ? "Creating..." : "Create Manager Account"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TAB 2: MANAGER LIST & PROFILES */}
      {activeTab === "list" && (
        <section className="hr-manager-card">
          <div className="hr-manager-section-heading">
            <div>
              <h2>Manager List & Profiles</h2>
              <p>View manager accounts and manage their profile information.</p>
            </div>
          </div>

          {managerListError && (
            <div className="hr-manager-error">{managerListError}</div>
          )}

          <div className="hr-manager-search">
            <input
              type="text"
              placeholder="Search by manager name or email..."
              value={managerSearch}
              onChange={(event) => setManagerSearch(event.target.value)}
              aria-label="Search managers by name or email"
            />
          </div>

          {managerListLoading ? (
            <p className="hr-manager-empty">Loading manager accounts...</p>
          ) : (
            <>
              <div className="hr-manager-table-wrapper">
                <table className="hr-manager-table">
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
                    {filteredManagers.map((manager) => (
                      <tr key={manager.id}>
                        <td>{manager.id}</td>
                        <td>{manager.name || "—"}</td>
                        <td>{manager.email || "—"}</td>
                        <td>{getDepartmentName(manager)}</td>
                        <td>{getDesignationName(manager)}</td>
                        <td>
                          <span
                            className={`hr-manager-status hr-manager-status-${(
                              manager.status || "unknown"
                            ).toLowerCase()}`}
                          >
                            {manager.status || "Unknown"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="hr-manager-view-button"
                            onClick={() => handleViewManagerProfile(manager.id)}
                            disabled={profileLoading}
                          >
                            {profileLoading ? "Loading..." : "View Profile"}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredManagers.length === 0 && (
                      <tr>
                        <td colSpan="7" className="hr-manager-table-empty">
                          {managers.length === 0
                            ? "No manager accounts found."
                            : "No managers match your search."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Selected Manager Profile */}
              {selectedManager && (
                <div className="hr-manager-profile">
                  <div className="hr-manager-profile-header">
                    <div>
                      <h3>Manager Profile</h3>
                      <p>Detailed account information</p>
                    </div>

                    <button
                      type="button"
                      className="hr-manager-close-button"
                      onClick={() => {
                        setSelectedManager(null);
                        resetEditModes();
                        setProfileSuccess("");
                        setProfileError("");
                      }}
                    >
                      Close
                    </button>
                  </div>

                  {profileSuccess && (
                    <div className="hr-manager-success">{profileSuccess}</div>
                  )}

                  {profileError && (
                    <div className="hr-manager-error">{profileError}</div>
                  )}

                  {/* ACCOUNT INFORMATION */}
                  <section className="hr-manager-profile-section">
                    <div className="hr-manager-profile-section-header">
                      <div>
                        <h4>Account Information</h4>
                        <p>
                          Official account information. Official email, user ID,
                          role, and status are read-only.
                        </p>
                      </div>

                      {!editAccount && (
                        <button
                          type="button"
                          className="hr-manager-edit-button"
                          onClick={() => startEditing("account")}
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {editAccount ? (
                      <>
                        <div className="hr-manager-profile-grid">
                          <ProfileField
                            label="User ID"
                            value={selectedManager.id}
                            locked
                          />

                          <EditField
                            label="Full Name"
                            name="name"
                            value={editManagerData.name}
                            onChange={handleEditManagerChange}
                            required
                          />

                          <ProfileField
                            label="Official Email"
                            value={selectedManager.email}
                            locked
                          />

                          <ProfileField
                            label="Role"
                            value={selectedManager.role}
                            locked
                          />

                          <ProfileField
                            label="Account Status"
                            value={selectedManager.status}
                            locked
                          />
                        </div>

                        <EditActions
                          onSave={handleSaveAccount}
                          onCancel={cancelEditing}
                          profileSaving={profileSaving}
                        />
                      </>
                    ) : (
                      <div className="hr-manager-profile-grid">
                        <ProfileField
                          label="User ID"
                          value={selectedManager.id}
                          locked
                        />

                        <ProfileField
                          label="Full Name"
                          value={selectedManager.name}
                        />

                        <ProfileField
                          label="Official Email"
                          value={selectedManager.email}
                          locked
                        />

                        <ProfileField
                          label="Role"
                          value={selectedManager.role}
                          locked
                        />

                        <ProfileField
                          label="Account Status"
                          value={selectedManager.status}
                          locked
                        />
                      </div>
                    )}
                  </section>

                  {/* PERSONAL INFORMATION */}
                  <section className="hr-manager-profile-section">
                    <div className="hr-manager-profile-section-header">
                      <div>
                        <h4>Personal Information</h4>
                        <p>Personal contact information for the manager.</p>
                      </div>

                      {!editPersonal && (
                        <button
                          type="button"
                          className="hr-manager-edit-button"
                          onClick={() => startEditing("personal")}
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {editPersonal ? (
                      <>
                        <div className="hr-manager-profile-grid">
                          <EditField
                            label="Personal Email"
                            name="personalEmail"
                            type="email"
                            value={editManagerData.personalEmail}
                            onChange={handleEditManagerChange}
                            required
                          />

                          <EditField
                            label="Phone Number"
                            name="phoneNumber"
                            value={editManagerData.phoneNumber}
                            onChange={handleEditManagerChange}
                          />

                          <EditField
                            label="Address"
                            name="address"
                            value={editManagerData.address}
                            onChange={handleEditManagerChange}
                          />
                        </div>

                        <EditActions
                          onSave={handleSavePersonal}
                          onCancel={cancelEditing}
                          profileSaving={profileSaving}
                        />
                      </>
                    ) : (
                      <div className="hr-manager-profile-grid">
                        <ProfileField
                          label="Personal Email"
                          value={selectedManager.personalEmail}
                        />

                        <ProfileField
                          label="Phone Number"
                          value={selectedManager.phoneNumber}
                        />

                        <ProfileField
                          label="Address"
                          value={selectedManager.address}
                        />
                      </div>
                    )}
                  </section>

                  {/* EMPLOYMENT INFORMATION */}
                  <section className="hr-manager-profile-section">
                    <div className="hr-manager-profile-section-header">
                      <div>
                        <h4>Employment Information</h4>
                        <p>
                          Employment information managed by authorized HR
                          personnel.
                        </p>
                      </div>

                      {!editEmployment && (
                        <button
                          type="button"
                          className="hr-manager-edit-button"
                          onClick={() => startEditing("employment")}
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {editEmployment ? (
                      <>
                        <div className="hr-manager-profile-grid">
                          <div className="hr-manager-edit-field">
                            <label htmlFor="manager-edit-departmentId">
                              Department
                            </label>

                            <select
                              id="manager-edit-departmentId"
                              name="departmentId"
                              value={editManagerData.departmentId}
                              onChange={handleEditManagerChange}
                              required
                            >
                              <option value="">Select department</option>

                              {departments.map((department) => (
                                <option
                                  key={department.id}
                                  value={department.id}
                                >
                                  {department.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="hr-manager-edit-field">
                            <label htmlFor="manager-edit-designationId">
                              Designation
                            </label>

                            <select
                              id="manager-edit-designationId"
                              name="designationId"
                              value={editManagerData.designationId}
                              onChange={handleEditManagerChange}
                              required
                            >
                              <option value="">Select designation</option>

                              {designations.map((designation) => (
                                <option
                                  key={designation.id}
                                  value={designation.id}
                                >
                                  {designation.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <EditField
                            label="Joining Date"
                            name="joiningDate"
                            type="date"
                            value={editManagerData.joiningDate}
                            onChange={handleEditManagerChange}
                          />

                          <ProfileField
                            label="Employment Type"
                            value={selectedManager.employmentType}
                            locked
                          />

                          <ProfileField
                            label="Work Location"
                            value={selectedManager.workLocation}
                            locked
                          />
                        </div>

                        <EditActions
                          onSave={handleSaveEmployment}
                          onCancel={cancelEditing}
                          profileSaving={profileSaving}
                        />
                      </>
                    ) : (
                      <div className="hr-manager-profile-grid">
                        <ProfileField
                          label="Department"
                          value={getDepartmentName(selectedManager)}
                        />

                        <ProfileField
                          label="Designation"
                          value={getDesignationName(selectedManager)}
                        />

                        <ProfileField
                          label="Joining Date"
                          value={normalizeDate(selectedManager.joiningDate)}
                        />

                        <ProfileField
                          label="Employment Type"
                          value={selectedManager.employmentType}
                          locked
                        />

                        <ProfileField
                          label="Work Location"
                          value={selectedManager.workLocation}
                          locked
                        />
                      </div>
                    )}
                  </section>

                  {/* REPORTING AUTHORITY */}
                  <section className="hr-manager-profile-section">
                    <div className="hr-manager-profile-section-header">
                      <div>
                        <h4>Reporting Authority</h4>
                        <p>Reporting authority details of the manager.</p>
                      </div>
                    </div>

                    <div className="hr-manager-profile-grid">
                      <ProfileField
                        label="Reporting Authority ID"
                        value={selectedManager.managerId}
                        locked
                      />

                      <ProfileField
                        label="Reporting Authority Name"
                        value={selectedManager.reportingAuthorityName}
                        locked
                      />

                      <ProfileField
                        label="Reporting Authority Email"
                        value={selectedManager.reportingAuthorityEmail}
                        locked
                      />
                    </div>
                  </section>

                  {/* EMERGENCY CONTACT */}
                  <section className="hr-manager-profile-section">
                    <div className="hr-manager-profile-section-header">
                      <div>
                        <h4>Emergency Contact</h4>
                        <p>
                          Emergency contact information associated with this
                          manager account.
                        </p>
                      </div>

                      {!editEmergency && (
                        <button
                          type="button"
                          className="hr-manager-edit-button"
                          onClick={() => startEditing("emergency")}
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {editEmergency ? (
                      <>
                        <div className="hr-manager-profile-grid">
                          <EditField
                            label="Contact Name"
                            name="emergencyContactName"
                            value={editManagerData.emergencyContactName}
                            onChange={handleEditManagerChange}
                          />

                          <EditField
                            label="Relationship"
                            name="emergencyContactRelationship"
                            value={editManagerData.emergencyContactRelationship}
                            onChange={handleEditManagerChange}
                          />

                          <EditField
                            label="Emergency Contact Number"
                            name="emergencyContactPhone"
                            value={editManagerData.emergencyContactPhone}
                            onChange={handleEditManagerChange}
                          />

                          <EditField
                            label="Contact Address"
                            name="emergencyContactAddress"
                            value={editManagerData.emergencyContactAddress}
                            onChange={handleEditManagerChange}
                          />
                        </div>

                        <EditActions
                          onSave={handleSaveEmergency}
                          onCancel={cancelEditing}
                          profileSaving={profileSaving}
                        />
                      </>
                    ) : (
                      <div className="hr-manager-profile-grid">
                        <ProfileField
                          label="Contact Name"
                          value={selectedManager.emergencyContactName}
                        />

                        <ProfileField
                          label="Relationship"
                          value={selectedManager.emergencyContactRelationship}
                        />

                        <ProfileField
                          label="Emergency Contact Number"
                          value={selectedManager.emergencyContactPhone}
                        />

                        <ProfileField
                          label="Contact Address"
                          value={selectedManager.emergencyContactAddress}
                        />
                      </div>
                    )}
                  </section>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* TAB 3: ASSIGN EMPLOYEES */}
      {activeTab === "assign" && (
        <section className="hr-manager-card">
          <div className="hr-manager-section-heading">
            <div>
              <h2>Assign Employees</h2>
              <p>
                Select a manager, assign an employee, and review that manager's
                team.
              </p>
            </div>
          </div>

          {assignmentMessage && (
            <div className="hr-manager-success" role="status">
              {assignmentMessage}
            </div>
          )}

          {assignmentError && (
            <div className="hr-manager-error" role="alert">
              {assignmentError}
            </div>
          )}

          {assignmentLoading ? (
            <p className="hr-manager-empty">
              Loading managers and employees...
            </p>
          ) : (
            <>
              <div className="hr-manager-form-grid">
                <div className="hr-manager-form-group">
                  <label htmlFor="assignment-manager">Select Manager</label>

                  <select
                    id="assignment-manager"
                    value={assignmentManagerId}
                    onChange={(event) => {
                      setAssignmentManagerId(event.target.value);
                      setAssignmentMessage("");
                      setAssignmentError("");
                    }}
                    disabled={assignmentManagers.length === 0}
                  >
                    <option value="">
                      {assignmentManagers.length === 0
                        ? "No managers available"
                        : "Select a manager"}
                    </option>

                    {assignmentManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name || "Unnamed Manager"} (ID: {manager.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="hr-manager-form-group">
                  <label htmlFor="assignment-employee">Select Employee</label>

                  <select
                    id="assignment-employee"
                    value={assignmentEmployeeId}
                    onChange={(event) => {
                      setAssignmentEmployeeId(event.target.value);
                      setAssignmentMessage("");
                      setAssignmentError("");
                    }}
                    disabled={
                      !assignmentManagerId || assignmentEmployees.length === 0
                    }
                  >
                    <option value="">
                      {assignmentEmployees.length === 0
                        ? "No employees available"
                        : "Select an employee"}
                    </option>

                    {assignmentEmployees
                      .filter(
                        (employee) =>
                          !assignedEmployeeIds.has(String(employee.id)),
                      )
                      .map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name || "Unnamed Employee"} — ID:{" "}
                          {employee.id}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="hr-manager-form-actions">
                <button
                  type="button"
                  onClick={handleAssignEmployee}
                  disabled={
                    !assignmentManagerId ||
                    !assignmentEmployeeId ||
                    assignmentTeamLoading
                  }
                >
                  Assign Employee
                </button>
              </div>

              <section className="hr-manager-profile-section">
                <div className="hr-manager-profile-section-header">
                  <div>
                    <h4>
                      Assigned Employees
                      {selectedAssignmentManager
                        ? ` — ${selectedAssignmentManager.name || "Manager"}`
                        : ""}
                    </h4>

                    <p>
                      {selectedAssignmentManager
                        ? `Manager ID: ${selectedAssignmentManager.id}`
                        : "Choose a manager to view their assigned employees."}
                    </p>
                  </div>
                </div>

                <div className="hr-manager-search">
                  <input
                    type="text"
                    placeholder="Search employees by ID, name, or email..."
                    value={assignmentSearch}
                    onChange={(event) =>
                      setAssignmentSearch(event.target.value)
                    }
                    aria-label="Search employees"
                  />
                </div>

                {assignmentTeamLoading ? (
                  <p className="hr-manager-empty">
                    Loading assigned employees...
                  </p>
                ) : (
                  <div className="hr-manager-table-wrapper">
                    <table className="hr-manager-table">
                      <thead>
                        <tr>
                          <th>Employee ID</th>
                          <th>Name</th>
                          <th>Official Email</th>
                          <th>Department</th>
                          <th>Designation</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {assignmentTeam
                          .filter((employee) => {
                            const search = assignmentSearch
                              .trim()
                              .toLowerCase();

                            return (
                              !search ||
                              String(employee.id ?? "")
                                .toLowerCase()
                                .includes(search) ||
                              (employee.name || "")
                                .toLowerCase()
                                .includes(search) ||
                              (employee.email || "")
                                .toLowerCase()
                                .includes(search)
                            );
                          })
                          .map((employee) => (
                            <tr key={employee.id}>
                              <td>{employee.id}</td>
                              <td>{employee.name || "—"}</td>
                              <td>{employee.email || "—"}</td>
                              <td>{getDepartmentName(employee)}</td>
                              <td>{getDesignationName(employee)}</td>
                              <td>
                                <span
                                  className={`hr-manager-status hr-manager-status-${(
                                    employee.status || "unknown"
                                  ).toLowerCase()}`}
                                >
                                  {employee.status || "Unknown"}
                                </span>
                              </td>
                            </tr>
                          ))}

                        {assignmentTeam.filter((employee) => {
                          const search = assignmentSearch.trim().toLowerCase();

                          return (
                            !search ||
                            String(employee.id ?? "")
                              .toLowerCase()
                              .includes(search) ||
                            (employee.name || "")
                              .toLowerCase()
                              .includes(search) ||
                            (employee.email || "")
                              .toLowerCase()
                              .includes(search)
                          );
                        }).length === 0 && (
                          <tr>
                            <td colSpan="6" className="hr-manager-table-empty">
                              {assignmentTeam.length === 0
                                ? "No employees are assigned to this manager yet."
                                : "No assigned employees match your search."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      )}

      {/* TAB 4: ROLE ACTIONS */}
      {activeTab === "actions" && (
        <section className="hr-manager-card">
          <div className="hr-manager-section-heading">
            <div>
              <h2>Role Actions</h2>
              <p>
                Promote employees to managers and demote managers to employees.
              </p>
            </div>
          </div>

          {actionMessage && (
            <div className="hr-manager-success" role="status">
              {actionMessage}
            </div>
          )}

          {actionError && (
            <div className="hr-manager-error" role="alert">
              {actionError}
            </div>
          )}

          {actionLoading ? (
            <p className="hr-manager-empty">
              Loading employees and managers...
            </p>
          ) : (
            <>
              {/* PROMOTE EMPLOYEE */}
              <section className="hr-manager-profile-section">
                <div className="hr-manager-profile-section-header">
                  <div>
                    <h4>Promote Employee to Manager</h4>
                    <p>Select an employee to change their role to Manager.</p>
                  </div>
                </div>

                <div className="hr-manager-table-wrapper">
                  <table className="hr-manager-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Official Email</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {actionEmployees.map((employee) => (
                        <tr key={employee.id}>
                          <td>{employee.id}</td>
                          <td>{employee.name || "—"}</td>
                          <td>{employee.email || "—"}</td>
                          <td>
                            <span
                              className={`hr-manager-status hr-manager-status-${(
                                employee.status || "unknown"
                              ).toLowerCase()}`}
                            >
                              {employee.status || "Unknown"}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="hr-manager-view-button"
                              onClick={() => handlePromoteEmployee(employee.id)}
                              disabled={actionProcessing}
                            >
                              {actionProcessing ? "Processing..." : "Promote"}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {actionEmployees.length === 0 && (
                        <tr>
                          <td colSpan="5" className="hr-manager-table-empty">
                            No employee accounts available for promotion.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* DEMOTE MANAGER */}
              <section className="hr-manager-profile-section">
                <div className="hr-manager-profile-section-header">
                  <div>
                    <h4>Demote Manager to Employee</h4>
                    <p>
                      Managers with assigned employees cannot be demoted until
                      their teams have been reassigned.
                    </p>
                  </div>
                </div>

                <div className="hr-manager-table-wrapper">
                  <table className="hr-manager-table">
                    <thead>
                      <tr>
                        <th>Manager ID</th>
                        <th>Name</th>
                        <th>Official Email</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {actionManagers.map((manager) => (
                        <tr key={manager.id}>
                          <td>{manager.id}</td>
                          <td>{manager.name || "—"}</td>
                          <td>{manager.email || "—"}</td>
                          <td>
                            <span
                              className={`hr-manager-status hr-manager-status-${(
                                manager.status || "unknown"
                              ).toLowerCase()}`}
                            >
                              {manager.status || "Unknown"}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="hr-manager-view-button"
                              onClick={() => handleDemoteManager(manager.id)}
                              disabled={actionProcessing}
                            >
                              {actionProcessing ? "Processing..." : "Demote"}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {actionManagers.length === 0 && (
                        <tr>
                          <td colSpan="5" className="hr-manager-table-empty">
                            No manager accounts available for demotion.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </section>
      )}
    </div>
  );
}
