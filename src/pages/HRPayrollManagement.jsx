import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/HRPayrollManagement.css";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const INITIAL_SALARY_FORM = {
  basicSalary: "",
  hra: "",
  conveyanceAllowance: "",
  otherAllowances: "",
  pf: "",
  professionalTax: "",
  incomeTax: "",
  otherDeductions: "",
};

function HRPayrollManagement() {
  const [activeSection, setActiveSection] = useState("records");
  const [activeRecordTab, setActiveRecordTab] = useState("team");

  // Team payroll selection
  const [selectedRole, setSelectedRole] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Payroll period
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );

  // Payroll data
  const [payroll, setPayroll] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [personalPayrollHistory, setPersonalPayrollHistory] = useState([]);
  const [personalHistoryLoaded, setPersonalHistoryLoaded] = useState(false);

  // Salary structure
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [salaryEditMode, setSalaryEditMode] = useState(false);
  const [salaryForm, setSalaryForm] = useState(INITIAL_SALARY_FORM);
  const [mySalaryStructure, setMySalaryStructure] = useState(null);
  const [mySalaryLoading, setMySalaryLoading] = useState(false);
  const [mySalaryLoaded, setMySalaryLoaded] = useState(false);

  // Current HR account
  const [myProfile, setMyProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // General UI state
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadMyProfile();
  }, []);

  // Load the authenticated HR user's profile.
  // This component does not allow HR to select another HR account.
  const loadMyProfile = async () => {
    try {
      setProfileLoading(true);
      setError("");

      const authData = JSON.parse(localStorage.getItem("authData") || "{}");

      const userId = authData.userId;

      if (!userId) {
        throw new Error("Logged-in user ID was not found.");
      }

      const response = await api.get(`/users/${userId}`);
      setMyProfile(response.data);
    } catch (err) {
      console.error("Failed to load HR profile:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load your HR profile.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const resetPayrollResults = () => {
    setPayroll(null);
    setPayrollHistory([]);
  };

  const loadUsersByRole = async (role) => {
    clearMessages();
    setSelectedUserId("");
    setUsers([]);
    resetPayrollResults();
    setSalaryStructure(null);
    setSalaryEditMode(false);

    if (!role) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(`/users/role/${role}`);

      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(
        err.response?.data?.message || "Failed to load users for this role.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (event) => {
    const role = event.target.value;

    setSelectedRole(role);
    loadUsersByRole(role);
  };

  const handleUserChange = (event) => {
    setSelectedUserId(event.target.value);

    resetPayrollResults();
    setSalaryStructure(null);
    setSalaryEditMode(false);
    setSalaryForm(INITIAL_SALARY_FORM);

    clearMessages();
  };

  const validateTeamSelection = () => {
    if (!selectedRole || !selectedUserId) {
      setError("Please select a role and user.");
      return false;
    }

    if (!["MANAGER", "EMPLOYEE"].includes(selectedRole)) {
      setError("HR can manage payroll only for Managers and Employees.");
      return false;
    }

    return true;
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined || amount === "") {
      return "-";
    }

    return `₹${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
      ? dateValue
      : date.toLocaleString("en-IN");
  };

  const getStatusClass = (status) => {
    return String(status || "UNKNOWN").toLowerCase();
  };

  const getErrorMessage = (err, fallback) => {
    return (
      err.response?.data?.message ||
      (typeof err.response?.data === "string" ? err.response.data : fallback)
    );
  };

  // View a specific team payroll record.
  const handleViewTeamPayroll = async () => {
    if (!validateTeamSelection()) {
      return;
    }

    if (!selectedMonth || !selectedYear) {
      setError("Please select the payroll month and year.");
      return;
    }

    try {
      setLoading(true);
      clearMessages();
      resetPayrollResults();

      const response = await api.get(`/payroll/${selectedUserId}`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
        },
      });

      setPayroll(response.data);
    } catch (err) {
      console.error("Failed to load team payroll:", err);

      setError(
        getErrorMessage(err, "Payroll was not found for the selected period."),
      );
    } finally {
      setLoading(false);
    }
  };

  // View the selected Manager's or Employee's payroll history.
  const handleViewTeamHistory = async () => {
    if (!validateTeamSelection()) {
      return;
    }

    try {
      setLoading(true);
      clearMessages();
      resetPayrollResults();

      const response = await api.get(`/payroll/history/${selectedUserId}`);

      setPayrollHistory(Array.isArray(response.data) ? response.data : []);

      if (!Array.isArray(response.data) || response.data.length === 0) {
        setSuccess("No payroll history was found for this user.");
      }
    } catch (err) {
      console.error("Failed to load team payroll history:", err);

      setError(getErrorMessage(err, "Failed to load payroll history."));
    } finally {
      setLoading(false);
    }
  };

  // Load HR's own payroll history.
  const handleViewMyPayrollHistory = async () => {
    if (!myProfile?.id) {
      setError(
        "Your HR profile is not available. Please refresh and try again.",
      );
      return;
    }

    try {
      setLoading(true);
      clearMessages();
      setPersonalHistoryLoaded(false);
      setPersonalPayrollHistory([]);

      const response = await api.get(`/payroll/history/${myProfile.id}`);

      setPersonalPayrollHistory(
        Array.isArray(response.data) ? response.data : [],
      );

      setPersonalHistoryLoaded(true);

      if (!Array.isArray(response.data) || response.data.length === 0) {
        setSuccess("No personal payroll history was found.");
      }
    } catch (err) {
      console.error("Failed to load personal payroll history:", err);

      setError(getErrorMessage(err, "Failed to load your payroll history."));
    } finally {
      setLoading(false);
    }
  };

  // Load the logged-in HR user's own salary structure.
  const handleViewMySalaryDetails = async () => {
    if (!myProfile?.id) {
      setError(
        "Your HR profile is not available. Please refresh and try again.",
      );
      return;
    }

    try {
      setMySalaryLoading(true);
      setMySalaryLoaded(false);
      setMySalaryStructure(null);
      clearMessages();

      const response = await api.get(`/salary/${myProfile.id}`);

      setMySalaryStructure(response.data);
      setMySalaryLoaded(true);
    } catch (err) {
      console.error("Failed to load personal salary structure:", err);

      setMySalaryStructure(null);
      setMySalaryLoaded(true);

      setError(getErrorMessage(err, "Unable to load your salary structure."));
    } finally {
      setMySalaryLoading(false);
    }
  };

  // Download HR's own payslip as a PDF.
  const handleDownloadMyPayslip = async (record) => {
    if (!myProfile?.id) {
      setError("Your HR profile is not available.");
      return;
    }

    if (Number(record.userId) !== Number(myProfile.id)) {
      setError("You can download only your own payslips.");
      return;
    }

    if (record.status !== "PAID") {
      setError("A payslip can be downloaded only after payroll is PAID.");
      return;
    }

    try {
      setDownloadingId(record.id);
      clearMessages();

      const response = await api.get(`/payroll/${record.id}/payslip`, {
        responseType: "blob",
      });

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = `Payslip_${record.payrollMonth}_${record.payrollYear}.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setSuccess("Your payslip was downloaded successfully.");
    } catch (err) {
      console.error("Failed to download personal payslip:", err);

      setError(
        getErrorMessage(
          err,
          "Failed to download your payslip. Please try again.",
        ),
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // Generate payroll for a Manager or Employee.
  const handleGeneratePayroll = async () => {
    if (!validateTeamSelection()) {
      return;
    }

    if (!selectedMonth || !selectedYear) {
      setError("Please select the payroll month and year.");
      return;
    }

    try {
      setLoading(true);
      clearMessages();
      resetPayrollResults();

      const response = await api.post(
        `/payroll/generate/${selectedUserId}`,
        null,
        {
          params: {
            month: selectedMonth,
            year: selectedYear,
          },
        },
      );

      setPayroll(response.data);
      setSuccess("Payroll generated successfully.");
    } catch (err) {
      console.error("Failed to generate payroll:", err);

      setError(getErrorMessage(err, "Failed to generate payroll."));
    } finally {
      setLoading(false);
    }
  };

  // View the selected user's salary structure.
  const handleViewSalaryStructure = async () => {
    if (!validateTeamSelection()) {
      return;
    }

    try {
      setLoading(true);
      clearMessages();
      setSalaryStructure(null);
      setSalaryEditMode(false);

      const response = await api.get(`/salary/${selectedUserId}`);

      setSalaryStructure(response.data);
    } catch (err) {
      console.error("Failed to load salary structure:", err);

      setError(
        getErrorMessage(
          err,
          "Salary structure was not found for the selected user.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditSalaryStructure = () => {
    if (!salaryStructure) {
      return;
    }

    setSalaryForm({
      basicSalary: salaryStructure.basicSalary ?? "",
      hra: salaryStructure.hra ?? "",
      conveyanceAllowance: salaryStructure.conveyanceAllowance ?? "",
      otherAllowances: salaryStructure.otherAllowances ?? "",
      pf: salaryStructure.pf ?? "",
      professionalTax: salaryStructure.professionalTax ?? "",
      incomeTax: salaryStructure.incomeTax ?? "",
      otherDeductions: salaryStructure.otherDeductions ?? "",
    });

    setSalaryEditMode(true);
    clearMessages();
  };

  // Start a new salary structure for the selected user.
  const handleCreateSalaryStructure = () => {
    setSalaryStructure(null);
    setSalaryForm(INITIAL_SALARY_FORM);
    setSalaryEditMode(true);
    clearMessages();
  };

  const handleSalaryInputChange = (event) => {
    const { name, value } = event.target;

    setSalaryForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveSalaryStructure = async () => {
    if (!validateTeamSelection()) {
      return;
    }

    const fields = Object.entries(salaryForm);

    if (fields.some(([, value]) => value === "")) {
      setError("Please fill in all salary structure fields.");
      return;
    }

    if (
      fields.some(
        ([, value]) => !Number.isFinite(Number(value)) || Number(value) < 0,
      )
    ) {
      setError("Salary amounts must be valid non-negative numbers.");
      return;
    }

    try {
      setLoading(true);
      clearMessages();

      const requestBody = {
        basicSalary: Number(salaryForm.basicSalary),
        hra: Number(salaryForm.hra),
        conveyanceAllowance: Number(salaryForm.conveyanceAllowance),
        otherAllowances: Number(salaryForm.otherAllowances),
        pf: Number(salaryForm.pf),
        professionalTax: Number(salaryForm.professionalTax),
        incomeTax: Number(salaryForm.incomeTax),
        otherDeductions: Number(salaryForm.otherDeductions),
      };

      const response = await api.post(`/salary/${selectedUserId}`, requestBody);

      setSalaryStructure(response.data);
      setSalaryEditMode(false);
      setSuccess("Salary structure saved successfully.");
    } catch (err) {
      console.error("Failed to save salary structure:", err);

      setError(getErrorMessage(err, "Failed to save salary structure."));
    } finally {
      setLoading(false);
    }
  };

  const handleMainTabChange = (tab) => {
    setActiveSection(tab);
    clearMessages();
    resetPayrollResults();
    setSalaryStructure(null);
    setSalaryEditMode(false);
  };

  const handleRecordTabChange = (tab) => {
    setActiveRecordTab(tab);
    clearMessages();
    resetPayrollResults();

    if (tab === "my") {
      setPersonalPayrollHistory([]);
      setPersonalHistoryLoaded(false);
    }
  };

  const renderRoleAndUserSelector = () => (
    <div className="payroll-form-grid">
      <div className="payroll-form-group">
        <label htmlFor="hr-payroll-role">Role</label>

        <select
          id="hr-payroll-role"
          value={selectedRole}
          onChange={handleRoleChange}
          disabled={loading}
        >
          <option value="">Select Role</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </div>

      <div className="payroll-form-group">
        <label htmlFor="hr-payroll-user">User</label>

        <select
          id="hr-payroll-user"
          value={selectedUserId}
          onChange={handleUserChange}
          disabled={!selectedRole || loading}
        >
          <option value="">Select User</option>

          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} — ID {user.id}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderPayrollDetails = (record, heading = "Payroll Details") => {
    if (!record) {
      return null;
    }

    return (
      <div className="payroll-details">
        <div className="payroll-details-header">
          <div>
            <h3>{heading}</h3>
            <p>{record.userName || "Payroll Record"}</p>
          </div>

          <span className={`payroll-status ${getStatusClass(record.status)}`}>
            {record.status || "UNKNOWN"}
          </span>
        </div>

        <div className="payroll-detail-grid">
          <div>
            <span>Payroll ID</span>
            <strong>{record.id ?? "-"}</strong>
          </div>

          <div>
            <span>User ID</span>
            <strong>{record.userId ?? "-"}</strong>
          </div>

          <div>
            <span>Payroll Period</span>
            <strong>
              {record.payrollMonth}/{record.payrollYear}
            </strong>
          </div>

          <div>
            <span>Basic Salary</span>
            <strong>{formatAmount(record.basicSalary)}</strong>
          </div>

          <div>
            <span>Total Allowances</span>
            <strong>{formatAmount(record.totalAllowances)}</strong>
          </div>

          <div>
            <span>Total Deductions</span>
            <strong>{formatAmount(record.totalDeductions)}</strong>
          </div>

          <div>
            <span>Absence Deduction</span>
            <strong>{formatAmount(record.absenceDeduction)}</strong>
          </div>

          <div>
            <span>Gross Salary</span>
            <strong>{formatAmount(record.grossSalary)}</strong>
          </div>

          <div>
            <span>Net Salary</span>
            <strong>{formatAmount(record.netSalary)}</strong>
          </div>

          <div>
            <span>Generated Date</span>
            <strong>{formatDate(record.generatedDate)}</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderPayrollHistoryTable = (records, { personal = false } = {}) => (
    <div className="payroll-table-wrapper">
      <table className="payroll-table">
        <thead>
          <tr>
            <th>Payroll ID</th>
            {!personal && <th>User</th>}
            <th>Period</th>
            <th>Basic Salary</th>
            <th>Gross Salary</th>
            <th>Net Salary</th>
            <th>Status</th>
            <th>Generated Date</th>
            {personal && <th>Payslip</th>}
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.id}</td>

              {!personal && (
                <td>
                  {record.userName || "-"}
                  <br />
                  <small>ID: {record.userId ?? "-"}</small>
                </td>
              )}

              <td>
                {record.payrollMonth}/{record.payrollYear}
              </td>

              <td>{formatAmount(record.basicSalary)}</td>
              <td>{formatAmount(record.grossSalary)}</td>
              <td>{formatAmount(record.netSalary)}</td>

              <td>
                <span
                  className={`payroll-status ${getStatusClass(record.status)}`}
                >
                  {record.status || "UNKNOWN"}
                </span>
              </td>

              <td>{formatDate(record.generatedDate)}</td>

              {personal && (
                <td>
                  {record.status === "PAID" ? (
                    <button
                      type="button"
                      className="payroll-primary-button"
                      onClick={() => handleDownloadMyPayslip(record)}
                      disabled={downloadingId === record.id}
                    >
                      {downloadingId === record.id
                        ? "Downloading..."
                        : "Download PDF"}
                    </button>
                  ) : (
                    <span className="payroll-payslip-unavailable">
                      Available when PAID
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSalaryStructure = () => {
    if (!salaryStructure) {
      return null;
    }

    const salaryFields = [
      ["Basic Salary", "basicSalary"],
      ["HRA", "hra"],
      ["Conveyance Allowance", "conveyanceAllowance"],
      ["Other Allowances", "otherAllowances"],
      ["PF", "pf"],
      ["Professional Tax", "professionalTax"],
      ["Income Tax", "incomeTax"],
      ["Other Deductions", "otherDeductions"],
    ];

    return (
      <div className="payroll-details">
        <div className="payroll-details-header">
          <div>
            <h3>Salary Structure</h3>
            <p>{salaryStructure.userName || "Selected User"}</p>
          </div>

          <span className="payroll-status paid">ACTIVE</span>
        </div>

        <div className="payroll-detail-grid">
          <div>
            <span>Salary Structure ID</span>
            <strong>{salaryStructure.id ?? "-"}</strong>
          </div>

          <div>
            <span>User ID</span>
            <strong>{salaryStructure.userId ?? selectedUserId}</strong>
          </div>

          {salaryFields.map(([label, field]) => (
            <div key={field}>
              <span>{label}</span>
              <strong>{formatAmount(salaryStructure[field])}</strong>
            </div>
          ))}
        </div>

        <div className="payroll-action-area">
          <button
            type="button"
            className="payroll-primary-button"
            onClick={handleEditSalaryStructure}
          >
            Edit Salary Structure
          </button>
        </div>
      </div>
    );
  };

  // Display the logged-in HR user's salary structure in read-only mode.
  const renderMySalaryDetails = () => {
    if (!mySalaryStructure) {
      return null;
    }

    const fields = [
      ["Basic Salary", "basicSalary"],
      ["House Rent Allowance (HRA)", "hra"],
      ["Conveyance Allowance", "conveyanceAllowance"],
      ["Other Allowances", "otherAllowances"],
      ["Provident Fund (PF)", "pf"],
      ["Professional Tax", "professionalTax"],
      ["Income Tax", "incomeTax"],
      ["Other Deductions", "otherDeductions"],
    ];

    const basicSalary = Number(mySalaryStructure.basicSalary || 0);

    const totalAllowances =
      Number(mySalaryStructure.hra || 0) +
      Number(mySalaryStructure.conveyanceAllowance || 0) +
      Number(mySalaryStructure.otherAllowances || 0);

    const totalDeductions =
      Number(mySalaryStructure.pf || 0) +
      Number(mySalaryStructure.professionalTax || 0) +
      Number(mySalaryStructure.incomeTax || 0) +
      Number(mySalaryStructure.otherDeductions || 0);

    const grossSalary = basicSalary + totalAllowances;

    return (
      <div className="payroll-details">
        <div className="payroll-details-header">
          <div>
            <h3>My Salary Details</h3>
            <p>{myProfile?.name || "HR Account"}</p>
          </div>

          <span className="payroll-status paid">VIEW ONLY</span>
        </div>

        <div className="payroll-detail-grid">
          <div>
            <span>Salary Structure ID</span>
            <strong>{mySalaryStructure.id ?? "-"}</strong>
          </div>

          <div>
            <span>Employee ID</span>
            <strong>{myProfile?.id ?? "-"}</strong>
          </div>

          {fields.map(([label, field]) => (
            <div key={field}>
              <span>{label}</span>
              <strong>{formatAmount(mySalaryStructure[field])}</strong>
            </div>
          ))}

          <div>
            <span>Total Allowances</span>
            <strong>{formatAmount(totalAllowances)}</strong>
          </div>

          <div>
            <span>Gross Salary</span>
            <strong>{formatAmount(grossSalary)}</strong>
          </div>

          <div>
            <span>Configured Deductions</span>
            <strong>{formatAmount(totalDeductions)}</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderSalaryForm = () => {
    const fields = [
      ["Basic Salary", "basicSalary"],
      ["HRA", "hra"],
      ["Conveyance Allowance", "conveyanceAllowance"],
      ["Other Allowances", "otherAllowances"],
      ["PF", "pf"],
      ["Professional Tax", "professionalTax"],
      ["Income Tax", "incomeTax"],
      ["Other Deductions", "otherDeductions"],
    ];

    return (
      <div className="payroll-details">
        <div className="payroll-details-header">
          <div>
            <h3>
              {salaryStructure
                ? "Edit Salary Structure"
                : "Create Salary Structure"}
            </h3>
            <p>
              {salaryStructure?.userName ||
                users.find((user) => String(user.id) === String(selectedUserId))
                  ?.name ||
                "Selected User"}
            </p>
          </div>
        </div>

        <div className="payroll-form-grid">
          {fields.map(([label, field]) => (
            <div className="payroll-form-group" key={field}>
              <label htmlFor={`salary-${field}`}>{label}</label>

              <input
                id={`salary-${field}`}
                type="number"
                name={field}
                value={salaryForm[field]}
                onChange={handleSalaryInputChange}
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
          ))}
        </div>

        <div className="payroll-form-actions">
          <button
            type="button"
            className="payroll-primary-button"
            onClick={handleSaveSalaryStructure}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Salary Structure"}
          </button>

          <button
            type="button"
            className="payroll-cancel-button"
            onClick={() => {
              setSalaryEditMode(false);
              clearMessages();
            }}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="payroll-page hr-payroll-page">
      <div className="payroll-page-header">
        <h1>Payroll Management</h1>
        <p>
          Manage team payroll, salary structures, and your personal payroll
          records.
        </p>
      </div>

      <div className="payroll-tabs">
        <button
          type="button"
          className={activeSection === "records" ? "active" : ""}
          onClick={() => handleMainTabChange("records")}
        >
          Payroll Records
        </button>

        <button
          type="button"
          className={activeSection === "generate" ? "active" : ""}
          onClick={() => handleMainTabChange("generate")}
        >
          Generate Payroll
        </button>

        <button
          type="button"
          className={activeSection === "salary" ? "active" : ""}
          onClick={() => handleMainTabChange("salary")}
        >
          Salary Structure
        </button>
      </div>

      {success && (
        <div className="payroll-success-notification" role="status">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="payroll-error-notification" role="alert">
          <span>!</span>
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: PAYROLL RECORDS */}
      {activeSection === "records" && (
        <div className="payroll-card">
          <div className="payroll-card-header">
            <h2>Payroll Records</h2>
            <p>
              View payroll records for your team or review your own payroll
              history.
            </p>
          </div>

          <div className="payroll-subtabs">
            <button
              type="button"
              className={activeRecordTab === "team" ? "active" : ""}
              onClick={() => handleRecordTabChange("team")}
            >
              Team Payroll
            </button>

            <button
              type="button"
              className={activeRecordTab === "my" ? "active" : ""}
              onClick={() => handleRecordTabChange("my")}
            >
              My Payroll
            </button>
          </div>

          {activeRecordTab === "team" && (
            <>
              {renderRoleAndUserSelector()}

              <div className="payroll-form-grid payroll-period-grid">
                <div className="payroll-form-group">
                  <label htmlFor="team-payroll-month">Month</label>

                  <select
                    id="team-payroll-month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select Month</option>

                    {MONTHS.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="payroll-form-group">
                  <label htmlFor="team-payroll-year">Year</label>

                  <select
                    id="team-payroll-year"
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    disabled={loading}
                  >
                    {Array.from(
                      { length: 6 },
                      (_, index) => new Date().getFullYear() - 2 + index,
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="payroll-form-actions">
                <button
                  type="button"
                  className="payroll-primary-button"
                  onClick={handleViewTeamPayroll}
                  disabled={loading}
                >
                  View Payroll
                </button>

                <button
                  type="button"
                  className="payroll-secondary-button"
                  onClick={handleViewTeamHistory}
                  disabled={loading}
                >
                  View History
                </button>
              </div>

              {loading && (
                <div className="payroll-loading">Loading team payroll...</div>
              )}

              {!loading &&
                payroll &&
                activeSection === "records" &&
                activeRecordTab === "team" &&
                renderPayrollDetails(payroll)}

              {!loading && payrollHistory.length > 0 && (
                <div className="payroll-history">
                  <div className="payroll-history-header">
                    <h3>Team Payroll History</h3>
                    <p>Previous payroll records for the selected user.</p>
                  </div>

                  {renderPayrollHistoryTable(payrollHistory)}
                </div>
              )}
            </>
          )}

          {activeRecordTab === "my" && (
            <div className="payroll-personal-section">
              <div className="payroll-personal-summary">
                <div>
                  <span>Employee</span>
                  <strong>{myProfile?.name || "HR Account"}</strong>
                </div>

                <div>
                  <span>Account ID</span>
                  <strong>{myProfile?.id ?? "-"}</strong>
                </div>

                <div>
                  <span>Role</span>
                  <strong>HR</strong>
                </div>
              </div>

              <div className="payroll-form-actions">
                <button
                  type="button"
                  className="payroll-primary-button"
                  onClick={handleViewMySalaryDetails}
                  disabled={mySalaryLoading || profileLoading || !myProfile?.id}
                >
                  {mySalaryLoading
                    ? "Loading Salary Details..."
                    : "View My Salary Details"}
                </button>
              </div>

              {mySalaryLoading && (
                <div className="payroll-loading">
                  Loading your salary structure...
                </div>
              )}

              {!mySalaryLoading && mySalaryLoaded && mySalaryStructure && (
                <div className="payroll-my-salary-results">
                  {renderMySalaryDetails()}
                </div>
              )}

              {!mySalaryLoading && mySalaryLoaded && !mySalaryStructure && (
                <div className="payroll-empty-state">
                  No salary structure was returned for your account.
                </div>
              )}

              <div className="payroll-form-actions">
                <button
                  type="button"
                  className="payroll-primary-button"
                  onClick={handleViewMyPayrollHistory}
                  disabled={loading || profileLoading || !myProfile?.id}
                >
                  {loading ? "Loading..." : "View My Payroll History"}
                </button>
              </div>

              {profileLoading && (
                <div className="payroll-loading">
                  Loading your HR profile...
                </div>
              )}

              {loading && (
                <div className="payroll-loading">
                  Loading your payroll history...
                </div>
              )}

              {!loading &&
                personalHistoryLoaded &&
                personalPayrollHistory.length === 0 && (
                  <div className="payroll-empty-state">
                    No personal payroll records are available.
                  </div>
                )}

              {!loading && personalPayrollHistory.length > 0 && (
                <div className="payroll-history">
                  <div className="payroll-history-header">
                    <h3>My Payroll History</h3>
                    <p>
                      Payslips are downloadable only after payroll is marked as
                      PAID.
                    </p>
                  </div>

                  {renderPayrollHistoryTable(personalPayrollHistory, {
                    personal: true,
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GENERATE PAYROLL */}
      {activeSection === "generate" && (
        <div className="payroll-card">
          <div className="payroll-card-header">
            <h2>Generate Payroll</h2>
            <p>Generate payroll for Managers and Employees.</p>
          </div>

          {renderRoleAndUserSelector()}

          <div className="payroll-form-grid payroll-period-grid">
            <div className="payroll-form-group">
              <label htmlFor="generate-payroll-month">Month</label>

              <select
                id="generate-payroll-month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                disabled={loading}
              >
                <option value="">Select Month</option>

                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="payroll-form-group">
              <label htmlFor="generate-payroll-year">Year</label>

              <select
                id="generate-payroll-year"
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                disabled={loading}
              >
                {Array.from(
                  { length: 6 },
                  (_, index) => new Date().getFullYear() - 2 + index,
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="payroll-form-actions">
            <button
              type="button"
              className="payroll-primary-button"
              onClick={handleGeneratePayroll}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Payroll"}
            </button>
          </div>

          {loading && (
            <div className="payroll-loading">Generating payroll...</div>
          )}

          {!loading &&
            payroll &&
            activeSection === "generate" &&
            renderPayrollDetails(payroll, "Generated Payroll")}
        </div>
      )}

      {/* TAB 3: SALARY STRUCTURE */}
      {activeSection === "salary" && (
        <div className="payroll-card">
          <div className="payroll-card-header">
            <h2>Salary Structure</h2>
            <p>
              View, create, and update salary structures for Managers and
              Employees.
            </p>
          </div>

          {renderRoleAndUserSelector()}

          <div className="payroll-form-actions">
            <button
              type="button"
              className="payroll-primary-button"
              onClick={handleViewSalaryStructure}
              disabled={loading}
            >
              View Salary Structure
            </button>

            <button
              type="button"
              className="payroll-primary-button"
              onClick={handleCreateSalaryStructure}
              disabled={loading || !selectedUserId}
            >
              Create Salary Structure
            </button>
          </div>

          {loading && (
            <div className="payroll-loading">Loading salary structure...</div>
          )}

          {!loading &&
            salaryStructure &&
            !salaryEditMode &&
            renderSalaryStructure()}

          {!loading && salaryEditMode && renderSalaryForm()}
        </div>
      )}
    </div>
  );
}

export default HRPayrollManagement;
