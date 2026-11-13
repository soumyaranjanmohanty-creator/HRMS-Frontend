import { useState } from "react";
import api from "../services/api";
import "../styles/PayrollManagement.css";

function PayrollManagement() {
  const [activeSection, setActiveSection] = useState("records");
  const [activePayrollAction, setActivePayrollAction] = useState("view");

  const [selectedRole, setSelectedRole] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("2026");

  const [payroll, setPayroll] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);

  const [salaryStructure, setSalaryStructure] = useState(null);
  const [salaryEditMode, setSalaryEditMode] = useState(false);

  const [salaryForm, setSalaryForm] = useState({
    basicSalary: "",
    hra: "",
    conveyanceAllowance: "",
    otherAllowances: "",
    pf: "",
    professionalTax: "",
    incomeTax: "",
    otherDeductions: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsersByRole = async (role) => {
    try {
      setError("");
      setSuccess("");
      setSelectedUserId("");
      setPayroll(null);
      setPayrollHistory([]);
      setSalaryStructure(null);
      setSalaryEditMode(false);

      if (!role) {
        setUsers([]);
        return;
      }

      const response = await api.get(`/users/role/${role}`);
      setUsers(response.data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
      setError("Failed to load users.");
    }
  };

  const handleViewPayroll = async () => {
    if (!selectedUserId || !selectedMonth || !selectedYear) {
      setError("Please select user, month, and year.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setPayroll(null);
      setPayrollHistory([]);

      const response = await api.get(`/payroll/${selectedUserId}`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
        },
      });

      setPayroll(response.data);
    } catch (error) {
      console.error("Failed to load payroll:", error);
      setError("Payroll not found for the selected period.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async () => {
    if (!selectedUserId) {
      setError("Please select a user.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setPayrollHistory([]);
      setPayroll(null);

      const response = await api.get(`/payroll/history/${selectedUserId}`);

      setPayrollHistory(response.data || []);
    } catch (error) {
      console.error("Failed to load payroll history:", error);
      setError("Failed to load payroll history.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!selectedUserId || !selectedMonth || !selectedYear) {
      setError("Please select user, month, and year.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setPayroll(null);
      setPayrollHistory([]);

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
    } catch (error) {
      console.error("Failed to generate payroll:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to generate payroll.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) {
      return "-";
    }

    return `₹${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return date.replace("T", " ");
  };

  const handleMarkAsPaid = async (payrollId) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await api.post(`/payroll/${payrollId}/mark-paid`);

      setPayroll(response.data);
      setSuccess("Payroll marked as paid successfully.");
    } catch (error) {
      console.error("Failed to mark payroll as paid:", error);
      setError("Failed to mark payroll as paid.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSalaryStructure = async () => {
    if (!selectedUserId) {
      setError("Please select a user.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setSalaryStructure(null);
      setSalaryEditMode(false);

      const response = await api.get(`/salary/${selectedUserId}`);

      setSalaryStructure(response.data);
    } catch (error) {
      console.error("Failed to load salary structure:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Salary structure not found for the selected user.");
      }
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
    setError("");
    setSuccess("");
  };

  const handleSalaryInputChange = (event) => {
    const { name, value } = event.target;

    setSalaryForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveSalaryStructure = async () => {
    if (!selectedUserId) {
      setError("Please select a user.");
      return;
    }

    if (
      salaryForm.basicSalary === "" ||
      salaryForm.hra === "" ||
      salaryForm.conveyanceAllowance === "" ||
      salaryForm.otherAllowances === "" ||
      salaryForm.pf === "" ||
      salaryForm.professionalTax === "" ||
      salaryForm.incomeTax === "" ||
      salaryForm.otherDeductions === ""
    ) {
      setError("Please fill all salary structure fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

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
    } catch (error) {
      console.error("Failed to save salary structure:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to save salary structure.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderUserSelector = () => (
    <div className="payroll-form-grid">
      <div className="payroll-form-group">
        <label>Role</label>

        <select
          value={selectedRole}
          onChange={(event) => {
            const role = event.target.value;
            setSelectedRole(role);
            loadUsersByRole(role);
          }}
        >
          <option value="">Select Role</option>
          <option value="HR">HR</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </div>

      <div className="payroll-form-group">
        <label>User</label>

        <select
          value={selectedUserId}
          onChange={(event) => {
            setSelectedUserId(event.target.value);
            setSalaryStructure(null);
            setSalaryEditMode(false);
          }}
          disabled={!selectedRole}
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

  return (
    <div className="payroll-page">
      <div className="payroll-page-header">
        <h1>Payroll Management</h1>
        <p>Manage payroll, salary structures, and payment operations.</p>
      </div>

      <div className="payroll-tabs">
        <button
          type="button"
          className={activeSection === "records" ? "active" : ""}
          onClick={() => {
            setActiveSection("records");
            setError("");
            setSuccess("");
          }}
        >
          Payroll Records
        </button>

        <button
          type="button"
          className={activeSection === "generate" ? "active" : ""}
          onClick={() => {
            setActiveSection("generate");
            setError("");
            setSuccess("");
          }}
        >
          Generate Payroll
        </button>

        <button
          type="button"
          className={activeSection === "salary" ? "active" : ""}
          onClick={() => {
            setActiveSection("salary");
            setError("");
            setSuccess("");
            setPayroll(null);
            setPayrollHistory([]);
          }}
        >
          Salary Structure
        </button>
      </div>

      {success && (
        <div className="payroll-success-notification">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="payroll-error-notification">
          <span>!</span>
          <span>{error}</span>
        </div>
      )}

      {/* =========================
          PAYROLL RECORDS
          ========================= */}
      {activeSection === "records" && (
        <div className="payroll-card">
          <div className="payroll-card-header">
            <h2>Payroll Records</h2>
            <p>View employee payroll and payroll history.</p>
          </div>

          {renderUserSelector()}

          <div className="payroll-form-grid">
            <div className="payroll-form-group">
              <label>Month</label>

              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              >
                <option value="">Select Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div className="payroll-form-group">
              <label>Year</label>

              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              >
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>
          </div>

          <div className="payroll-form-actions">
            <button
              type="button"
              className={
                activePayrollAction === "view"
                  ? "payroll-primary-button"
                  : "payroll-secondary-button"
              }
              onClick={() => {
                setActivePayrollAction("view");
                handleViewPayroll();
              }}
            >
              View Payroll
            </button>

            <button
              type="button"
              className={
                activePayrollAction === "history"
                  ? "payroll-primary-button"
                  : "payroll-secondary-button"
              }
              onClick={() => {
                setActivePayrollAction("history");
                handleViewHistory();
              }}
            >
              View History
            </button>
          </div>

          {loading && <div className="payroll-loading">Loading payroll...</div>}

          {!loading && payroll && (
            <div className="payroll-details">
              <div className="payroll-details-header">
                <div>
                  <h3>Payroll Details</h3>
                  <p>{payroll.userName}</p>
                </div>

                <span
                  className={`payroll-status ${String(
                    payroll.status || "",
                  ).toLowerCase()}`}
                >
                  {payroll.status}
                </span>
              </div>

              <div className="payroll-detail-grid">
                <div>
                  <span>Payroll ID</span>
                  <strong>{payroll.id}</strong>
                </div>

                <div>
                  <span>User ID</span>
                  <strong>{payroll.userId}</strong>
                </div>

                <div>
                  <span>Payroll Period</span>
                  <strong>
                    {payroll.payrollMonth}/{payroll.payrollYear}
                  </strong>
                </div>

                <div>
                  <span>Basic Salary</span>
                  <strong>{formatAmount(payroll.basicSalary)}</strong>
                </div>

                <div>
                  <span>Total Allowances</span>
                  <strong>{formatAmount(payroll.totalAllowances)}</strong>
                </div>

                <div>
                  <span>Total Deductions</span>
                  <strong>{formatAmount(payroll.totalDeductions)}</strong>
                </div>

                <div>
                  <span>Absence Deduction</span>
                  <strong>{formatAmount(payroll.absenceDeduction)}</strong>
                </div>

                <div>
                  <span>Gross Salary</span>
                  <strong>{formatAmount(payroll.grossSalary)}</strong>
                </div>

                <div>
                  <span>Net Salary</span>
                  <strong>{formatAmount(payroll.netSalary)}</strong>
                </div>

                <div>
                  <span>Generated Date</span>
                  <strong>{formatDate(payroll.generatedDate)}</strong>
                </div>
              </div>

              {payroll.status === "GENERATED" && (
                <div className="payroll-action-area">
                  <button
                    type="button"
                    className="payroll-paid-button"
                    onClick={() => handleMarkAsPaid(payroll.id)}
                  >
                    Mark as Paid
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && payrollHistory.length > 0 && (
            <div className="payroll-history">
              <div className="payroll-history-header">
                <h3>Payroll History</h3>
                <p>Previous payroll records for this user.</p>
              </div>

              <div className="payroll-table-wrapper">
                <table className="payroll-table">
                  <thead>
                    <tr>
                      <th>Payroll ID</th>
                      <th>Period</th>
                      <th>Basic Salary</th>
                      <th>Gross Salary</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                      <th>Generated Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payrollHistory.map((record) => (
                      <tr key={record.id}>
                        <td>{record.id}</td>

                        <td>
                          {record.payrollMonth}/{record.payrollYear}
                        </td>

                        <td>{formatAmount(record.basicSalary)}</td>

                        <td>{formatAmount(record.grossSalary)}</td>

                        <td>{formatAmount(record.netSalary)}</td>

                        <td>
                          <span
                            className={`payroll-status ${String(
                              record.status || "",
                            ).toLowerCase()}`}
                          >
                            {record.status}
                          </span>
                        </td>

                        <td>{formatDate(record.generatedDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================
          GENERATE PAYROLL
          ========================= */}
      {activeSection === "generate" && (
        <div className="payroll-card">
          <div className="payroll-card-header">
            <h2>Generate Payroll</h2>
            <p>Generate payroll for HR, Managers, and Employees.</p>
          </div>

          {renderUserSelector()}

          <div className="payroll-form-grid">
            <div className="payroll-form-group">
              <label>Month</label>

              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              >
                <option value="">Select Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div className="payroll-form-group">
              <label>Year</label>

              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              >
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>
          </div>

          <div className="payroll-form-actions">
            <button
              type="button"
              className="payroll-primary-button"
              onClick={handleGeneratePayroll}
            >
              Generate Payroll
            </button>
          </div>

          {loading && (
            <div className="payroll-loading">Generating payroll...</div>
          )}

          {!loading && payroll && (
            <div className="payroll-details">
              <div className="payroll-details-header">
                <div>
                  <h3>Generated Payroll</h3>
                  <p>{payroll.userName}</p>
                </div>

                <span
                  className={`payroll-status ${String(
                    payroll.status || "",
                  ).toLowerCase()}`}
                >
                  {payroll.status}
                </span>
              </div>

              <div className="payroll-detail-grid">
                <div>
                  <span>Payroll ID</span>
                  <strong>{payroll.id}</strong>
                </div>

                <div>
                  <span>User ID</span>
                  <strong>{payroll.userId}</strong>
                </div>

                <div>
                  <span>Payroll Period</span>
                  <strong>
                    {payroll.payrollMonth}/{payroll.payrollYear}
                  </strong>
                </div>

                <div>
                  <span>Basic Salary</span>
                  <strong>{formatAmount(payroll.basicSalary)}</strong>
                </div>

                <div>
                  <span>Total Allowances</span>
                  <strong>{formatAmount(payroll.totalAllowances)}</strong>
                </div>

                <div>
                  <span>Total Deductions</span>
                  <strong>{formatAmount(payroll.totalDeductions)}</strong>
                </div>

                <div>
                  <span>Absence Deduction</span>
                  <strong>{formatAmount(payroll.absenceDeduction)}</strong>
                </div>

                <div>
                  <span>Gross Salary</span>
                  <strong>{formatAmount(payroll.grossSalary)}</strong>
                </div>

                <div>
                  <span>Net Salary</span>
                  <strong>{formatAmount(payroll.netSalary)}</strong>
                </div>

                <div>
                  <span>Generated Date</span>
                  <strong>{formatDate(payroll.generatedDate)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================
          SALARY STRUCTURE
          ========================= */}
      {activeSection === "salary" && (
        <div className="payroll-card">
          <div className="payroll-card-header">
            <h2>Salary Structure</h2>
            <p>
              Create, view, and update salary structures for HR, Managers, and
              Employees.
            </p>
          </div>

          {renderUserSelector()}

          <div className="payroll-form-actions">
            <button
              type="button"
              className="payroll-primary-button"
              onClick={handleViewSalaryStructure}
            >
              View Salary Structure
            </button>
          </div>

          {loading && (
            <div className="payroll-loading">Loading salary structure...</div>
          )}

          {!loading && salaryStructure && !salaryEditMode && (
            <div className="payroll-details">
              <div className="payroll-details-header">
                <div>
                  <h3>Salary Structure</h3>
                  <p>{salaryStructure.userName}</p>
                </div>

                <span className="payroll-status">ACTIVE</span>
              </div>

              <div className="payroll-detail-grid">
                <div>
                  <span>Salary Structure ID</span>
                  <strong>{salaryStructure.id}</strong>
                </div>

                <div>
                  <span>User ID</span>
                  <strong>{salaryStructure.userId}</strong>
                </div>

                <div>
                  <span>Basic Salary</span>
                  <strong>{formatAmount(salaryStructure.basicSalary)}</strong>
                </div>

                <div>
                  <span>HRA</span>
                  <strong>{formatAmount(salaryStructure.hra)}</strong>
                </div>

                <div>
                  <span>Conveyance Allowance</span>
                  <strong>
                    {formatAmount(salaryStructure.conveyanceAllowance)}
                  </strong>
                </div>

                <div>
                  <span>Other Allowances</span>
                  <strong>
                    {formatAmount(salaryStructure.otherAllowances)}
                  </strong>
                </div>

                <div>
                  <span>PF</span>
                  <strong>{formatAmount(salaryStructure.pf)}</strong>
                </div>

                <div>
                  <span>Professional Tax</span>
                  <strong>
                    {formatAmount(salaryStructure.professionalTax)}
                  </strong>
                </div>

                <div>
                  <span>Income Tax</span>
                  <strong>{formatAmount(salaryStructure.incomeTax)}</strong>
                </div>

                <div>
                  <span>Other Deductions</span>
                  <strong>
                    {formatAmount(salaryStructure.otherDeductions)}
                  </strong>
                </div>
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
          )}

          {!loading && salaryEditMode && (
            <div className="payroll-details">
              <div className="payroll-details-header">
                <div>
                  <h3>Edit Salary Structure</h3>
                  <p>{salaryStructure?.userName}</p>
                </div>
              </div>

              <div className="payroll-form-grid">
                <div className="payroll-form-group">
                  <label>Basic Salary</label>

                  <input
                    type="number"
                    name="basicSalary"
                    value={salaryForm.basicSalary}
                    onChange={handleSalaryInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="payroll-form-group">
                  <label>HRA</label>

                  <input
                    type="number"
                    name="hra"
                    value={salaryForm.hra}
                    onChange={handleSalaryInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="payroll-form-group">
                  <label>Conveyance Allowance</label>

                  <input
                    type="number"
                    name="conveyanceAllowance"
                    value={salaryForm.conveyanceAllowance}
                    onChange={handleSalaryInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="payroll-form-group">
                  <label>Other Allowances</label>

                  <input
                    type="number"
                    name="otherAllowances"
                    value={salaryForm.otherAllowances}
                    onChange={handleSalaryInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="payroll-form-group">
                  <label>PF</label>

                  <input
                    type="number"
                    name="pf"
                    value={salaryForm.pf}
                    onChange={handleSalaryInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="payroll-form-group">
                  <label>Professional Tax</label>

                  <input
                    type="number"
                    name="professionalTax"
                    value={salaryForm.professionalTax}
                    onChange={handleSalaryInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="payroll-form-group">
                  <label>Income Tax</label>

                  <input
                    type="number"
                    name="incomeTax"
                    value={salaryForm.incomeTax}
                    onChange={handleSalaryInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="payroll-form-group">
                  <label>Other Deductions</label>

                  <input
                    type="number"
                    name="otherDeductions"
                    value={salaryForm.otherDeductions}
                    onChange={handleSalaryInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="payroll-form-actions">
                <button
                  type="button"
                  className="payroll-primary-button"
                  onClick={handleSaveSalaryStructure}
                >
                  Save Salary Structure
                </button>

                <button
                  type="button"
                  className="payroll-secondary-button"
                  onClick={() => {
                    setSalaryEditMode(false);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PayrollManagement;
