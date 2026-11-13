import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/ManagerPayroll.css";

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

function ManagerPayroll() {
  const currentDate = new Date();

  const [activeTab, setActiveTab] = useState("records");

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(
    String(currentDate.getMonth() + 1),
  );

  const [selectedYear, setSelectedYear] = useState(
    String(currentDate.getFullYear()),
  );

  const [payroll, setPayroll] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [salaryStructure, setSalaryStructure] = useState(null);

  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [salaryLoaded, setSalaryLoaded] = useState(false);

  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the authenticated Manager's profile.
  useEffect(() => {
    loadMyProfile();
  }, []);

  const loadMyProfile = async () => {
    try {
      setProfileLoading(true);
      setError("");

      const authData = JSON.parse(localStorage.getItem("authData") || "{}");

      const userId = authData.userId;

      if (!userId) {
        throw new Error("Your account ID was not found. Please sign in again.");
      }

      const response = await api.get(`/users/${userId}`);

      setProfile(response.data);
    } catch (err) {
      console.error("Failed to load Manager profile:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to load your profile. Please refresh the page.",
        ),
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const getErrorMessage = (err, fallback) => {
    return (
      err.response?.data?.message ||
      (typeof err.response?.data === "string" ? err.response.data : fallback)
    );
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined || amount === "") {
      return "—";
    }

    return `₹${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatMonth = (month, year) => {
    const monthName = MONTHS.find(
      (item) => Number(item.value) === Number(month),
    )?.label;

    return `${monthName || month} ${year}`;
  };

  const getStatusClass = (status) => {
    return String(status || "UNKNOWN").toLowerCase();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearMessages();
  };

  // TAB 1: View own payroll for a selected month and year.
  const handleViewPayroll = async () => {
    if (!profile?.id) {
      setError("Your Manager profile is not available.");
      return;
    }

    if (!selectedMonth || !selectedYear) {
      setError("Please select a payroll month and year.");
      return;
    }

    try {
      setLoading(true);
      clearMessages();

      setPayroll(null);
      setRecordsLoaded(false);

      const response = await api.get(`/payroll/${profile.id}`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
        },
      });

      setPayroll(response.data);
      setRecordsLoaded(true);
    } catch (err) {
      console.error("Failed to load payroll:", err);

      setPayroll(null);
      setRecordsLoaded(true);

      setError(
        getErrorMessage(
          err,
          "No payroll record was found for the selected period.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  // TAB 2: View own salary structure.
  const handleViewSalary = async () => {
    if (!profile?.id) {
      setError("Your Manager profile is not available.");
      return;
    }

    try {
      setLoading(true);
      clearMessages();

      setSalaryStructure(null);
      setSalaryLoaded(false);

      const response = await api.get(`/salary/${profile.id}`);

      setSalaryStructure(response.data);
      setSalaryLoaded(true);
    } catch (err) {
      console.error("Failed to load salary structure:", err);

      setSalaryStructure(null);
      setSalaryLoaded(true);

      setError(getErrorMessage(err, "Unable to load your salary structure."));
    } finally {
      setLoading(false);
    }
  };

  // TAB 3: View own payroll history.
  const handleViewHistory = async () => {
    if (!profile?.id) {
      setError("Your Manager profile is not available.");
      return;
    }

    try {
      setLoading(true);
      clearMessages();

      setPayrollHistory([]);
      setHistoryLoaded(false);

      const response = await api.get(`/payroll/history/${profile.id}`);

      const records = Array.isArray(response.data) ? response.data : [];

      setPayrollHistory(records);
      setHistoryLoaded(true);

      if (records.length === 0) {
        setSuccess("No payroll history is available yet.");
      }
    } catch (err) {
      console.error("Failed to load payroll history:", err);

      setPayrollHistory([]);
      setHistoryLoaded(false);

      setError(getErrorMessage(err, "Unable to load your payroll history."));
    } finally {
      setLoading(false);
    }
  };

  // Download only the logged-in Manager's own paid payslip.
  const handleDownloadPayslip = async (record) => {
    if (!profile?.id) {
      setError("Your Manager profile is not available.");
      return;
    }

    if (Number(record.userId) !== Number(profile.id)) {
      setError("You can download only your own payslips.");
      return;
    }

    if (String(record.status || "").toUpperCase() !== "PAID") {
      setError("A payslip is available only after payroll is marked PAID.");
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
      console.error("Failed to download payslip:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to download the payslip. Please try again.",
        ),
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const renderPayrollDetails = (record) => {
    if (!record) {
      return null;
    }

    const details = [
      ["Payroll ID", record.id],
      ["Employee ID", record.userId],
      ["Payroll Period", formatMonth(record.payrollMonth, record.payrollYear)],
      ["Basic Salary", formatAmount(record.basicSalary)],
      ["Total Allowances", formatAmount(record.totalAllowances)],
      ["Gross Salary", formatAmount(record.grossSalary)],
      ["Total Deductions", formatAmount(record.totalDeductions)],
      ["Absence Deduction", formatAmount(record.absenceDeduction)],
      ["Net Salary", formatAmount(record.netSalary)],
      ["Generated Date", formatDate(record.generatedDate)],
    ];

    return (
      <div className="mp-details-card">
        <div className="mp-details-heading">
          <div>
            <span className="mp-eyebrow">PAYROLL STATEMENT</span>
            <h3>{formatMonth(record.payrollMonth, record.payrollYear)}</h3>
            <p>{record.userName || profile?.name || "Manager"}</p>
          </div>

          <span className={`mp-status ${getStatusClass(record.status)}`}>
            {record.status || "UNKNOWN"}
          </span>
        </div>

        <div className="mp-details-grid">
          {details.map(([label, value]) => (
            <div className="mp-detail-item" key={label}>
              <span>{label}</span>
              <strong>
                {value === null || value === undefined || value === ""
                  ? "—"
                  : value}
              </strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSalaryDetails = () => {
    if (!salaryStructure) {
      return null;
    }

    const details = [
      ["Salary Structure ID", salaryStructure.id],
      ["Employee ID", salaryStructure.userId],
      ["Basic Salary", formatAmount(salaryStructure.basicSalary)],
      ["House Rent Allowance (HRA)", formatAmount(salaryStructure.hra)],
      [
        "Conveyance Allowance",
        formatAmount(salaryStructure.conveyanceAllowance),
      ],
      ["Other Allowances", formatAmount(salaryStructure.otherAllowances)],
      ["Provident Fund (PF)", formatAmount(salaryStructure.pf)],
      ["Professional Tax", formatAmount(salaryStructure.professionalTax)],
      ["Income Tax", formatAmount(salaryStructure.incomeTax)],
      ["Other Deductions", formatAmount(salaryStructure.otherDeductions)],
    ];

    const allowances =
      Number(salaryStructure.hra || 0) +
      Number(salaryStructure.conveyanceAllowance || 0) +
      Number(salaryStructure.otherAllowances || 0);

    const deductions =
      Number(salaryStructure.pf || 0) +
      Number(salaryStructure.professionalTax || 0) +
      Number(salaryStructure.incomeTax || 0) +
      Number(salaryStructure.otherDeductions || 0);

    const grossSalary = Number(salaryStructure.basicSalary || 0) + allowances;

    return (
      <div className="mp-details-card">
        <div className="mp-details-heading">
          <div>
            <span className="mp-eyebrow">MY COMPENSATION</span>
            <h3>Salary Structure</h3>
            <p>{salaryStructure.userName || profile?.name || "Manager"}</p>
          </div>

          <span className="mp-status active">VIEW ONLY</span>
        </div>

        <div className="mp-details-grid">
          {details.map(([label, value]) => (
            <div className="mp-detail-item" key={label}>
              <span>{label}</span>
              <strong>
                {value === null || value === undefined || value === ""
                  ? "—"
                  : value}
              </strong>
            </div>
          ))}
        </div>

        <div className="mp-salary-summary">
          <div>
            <span>Total Allowances</span>
            <strong>{formatAmount(allowances)}</strong>
          </div>

          <div>
            <span>Total Salary Deductions</span>
            <strong>{formatAmount(deductions)}</strong>
          </div>

          <div>
            <span>Gross Salary</span>
            <strong>{formatAmount(grossSalary)}</strong>
          </div>
        </div>

        <p className="mp-note">
          This page is read-only. Salary structures can be managed only through
          the authorized payroll administration workflow.
        </p>
      </div>
    );
  };

  const renderHistoryTable = () => {
    if (payrollHistory.length === 0) {
      return (
        <div className="mp-empty-state">
          <div className="mp-empty-icon">▤</div>
          <h3>No payroll records found</h3>
          <p>Your available payroll history will appear here.</p>
        </div>
      );
    }

    return (
      <div className="mp-table-wrapper">
        <table className="mp-table">
          <thead>
            <tr>
              <th>Payroll ID</th>
              <th>Period</th>
              <th>Basic Salary</th>
              <th>Gross Salary</th>
              <th>Total Deductions</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Generated Date</th>
              <th>Payslip</th>
            </tr>
          </thead>

          <tbody>
            {payrollHistory.map((record) => (
              <tr key={record.id}>
                <td>#{record.id}</td>

                <td>{formatMonth(record.payrollMonth, record.payrollYear)}</td>

                <td>{formatAmount(record.basicSalary)}</td>
                <td>{formatAmount(record.grossSalary)}</td>
                <td>{formatAmount(record.totalDeductions)}</td>
                <td className="mp-net-amount">
                  {formatAmount(record.netSalary)}
                </td>

                <td>
                  <span
                    className={`mp-status ${getStatusClass(record.status)}`}
                  >
                    {record.status || "UNKNOWN"}
                  </span>
                </td>

                <td>{formatDate(record.generatedDate)}</td>

                <td>
                  {String(record.status || "").toUpperCase() === "PAID" ? (
                    <button
                      type="button"
                      className="mp-download-button"
                      onClick={() => handleDownloadPayslip(record)}
                      disabled={downloadingId === record.id}
                    >
                      {downloadingId === record.id
                        ? "Downloading..."
                        : "Download PDF"}
                    </button>
                  ) : (
                    <span className="mp-unavailable">Not available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="mp-page">
      <header className="mp-page-header">
        <div>
          <span className="mp-eyebrow">MANAGER PORTAL</span>
          <h1>Payroll</h1>
          <p>
            View your payroll statements, salary structure, and payment history.
          </p>
        </div>

        <div className="mp-profile-badge">
          <div className="mp-avatar">
            {(profile?.name || "M").charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{profile?.name || "Manager"}</strong>
            <span>MANAGER</span>
          </div>
        </div>
      </header>

      <section className="mp-summary-grid">
        <div className="mp-summary-card">
          <div className="mp-summary-icon blue">₹</div>
          <div>
            <span>PAYROLL ACCESS</span>
            <strong>My Payroll</strong>
            <p>Personal payroll records</p>
          </div>
        </div>

        <div className="mp-summary-card">
          <div className="mp-summary-icon purple">▤</div>
          <div>
            <span>PAYMENT HISTORY</span>
            <strong>{payrollHistory.length}</strong>
            <p>Records loaded in this session</p>
          </div>
        </div>

        <div className="mp-summary-card">
          <div className="mp-summary-icon green">✓</div>
          <div>
            <span>PAYSLIPS</span>
            <strong>
              {
                payrollHistory.filter(
                  (record) =>
                    String(record.status || "").toUpperCase() === "PAID",
                ).length
              }
            </strong>
            <p>Paid records in loaded history</p>
          </div>
        </div>
      </section>

      <section className="mp-main-card">
        <div className="mp-tabs" role="tablist" aria-label="Payroll sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "records"}
            className={activeTab === "records" ? "active" : ""}
            onClick={() => handleTabChange("records")}
          >
            <span>▣</span>
            Payroll Records
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "salary"}
            className={activeTab === "salary" ? "active" : ""}
            onClick={() => handleTabChange("salary")}
          >
            <span>₹</span>
            Salary Details
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "history"}
            className={activeTab === "history" ? "active" : ""}
            onClick={() => handleTabChange("history")}
          >
            <span>◷</span>
            My Payroll
          </button>
        </div>

        {error && (
          <div className="mp-alert error" role="alert">
            <span>!</span>
            <p>{error}</p>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mp-alert success" role="status">
            <span>✓</span>
            <p>{success}</p>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setSuccess("")}
            >
              ×
            </button>
          </div>
        )}

        {profileLoading && (
          <div className="mp-loading">
            <span className="mp-spinner" />
            Loading your Manager profile...
          </div>
        )}

        {!profileLoading && profile && (
          <>
            {/* TAB 1: PAYROLL RECORDS */}
            {activeTab === "records" && (
              <div className="mp-tab-content">
                <div className="mp-section-heading">
                  <div>
                    <span className="mp-eyebrow">MONTHLY STATEMENT</span>
                    <h2>Payroll Records</h2>
                    <p>
                      Select a month and year to view your payroll statement.
                    </p>
                  </div>
                </div>

                <div className="mp-filter-panel">
                  <div className="mp-form-group">
                    <label htmlFor="mp-record-month">Payroll Month</label>
                    <select
                      id="mp-record-month"
                      value={selectedMonth}
                      onChange={(event) => setSelectedMonth(event.target.value)}
                      disabled={loading}
                    >
                      {MONTHS.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mp-form-group">
                    <label htmlFor="mp-record-year">Payroll Year</label>
                    <select
                      id="mp-record-year"
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(event.target.value)}
                      disabled={loading}
                    >
                      {Array.from(
                        { length: 7 },
                        (_, index) => currentDate.getFullYear() - 3 + index,
                      ).map((year) => (
                        <option key={year} value={String(year)}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="mp-primary-button"
                    onClick={handleViewPayroll}
                    disabled={loading || profileLoading}
                  >
                    {loading ? "Loading..." : "View Payroll"}
                  </button>
                </div>

                {loading && (
                  <div className="mp-loading">
                    <span className="mp-spinner" />
                    Loading payroll statement...
                  </div>
                )}

                {!loading && recordsLoaded && payroll && (
                  <div className="mp-results">
                    {renderPayrollDetails(payroll)}
                  </div>
                )}

                {!loading && recordsLoaded && !payroll && !error && (
                  <div className="mp-empty-state">
                    <div className="mp-empty-icon">₹</div>
                    <h3>No payroll statement found</h3>
                    <p>
                      No payroll record is available for the selected month and
                      year.
                    </p>
                  </div>
                )}

                {!recordsLoaded && !loading && (
                  <div className="mp-empty-state compact">
                    <div className="mp-empty-icon">₹</div>
                    <h3>Select a payroll period</h3>
                    <p>Choose a month and year, then click View Payroll.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SALARY DETAILS */}
            {activeTab === "salary" && (
              <div className="mp-tab-content">
                <div className="mp-section-heading">
                  <div>
                    <span className="mp-eyebrow">COMPENSATION</span>
                    <h2>Salary Details</h2>
                    <p>
                      View your assigned salary structure and its components.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mp-primary-button"
                    onClick={handleViewSalary}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "View Salary Details"}
                  </button>
                </div>

                {loading && (
                  <div className="mp-loading">
                    <span className="mp-spinner" />
                    Loading salary structure...
                  </div>
                )}

                {!loading && salaryLoaded && salaryStructure && (
                  <div className="mp-results">{renderSalaryDetails()}</div>
                )}

                {!loading && salaryLoaded && !salaryStructure && !error && (
                  <div className="mp-empty-state">
                    <div className="mp-empty-icon">₹</div>
                    <h3>Salary structure unavailable</h3>
                    <p>No salary structure was returned by the server.</p>
                  </div>
                )}

                {!salaryLoaded && !loading && (
                  <div className="mp-empty-state compact">
                    <div className="mp-empty-icon">₹</div>
                    <h3>Your salary information</h3>
                    <p>
                      Click View Salary Details to load your salary structure.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MY PAYROLL */}
            {activeTab === "history" && (
              <div className="mp-tab-content">
                <div className="mp-section-heading">
                  <div>
                    <span className="mp-eyebrow">PAYMENT HISTORY</span>
                    <h2>My Payroll</h2>
                    <p>
                      View your historical payroll records and download
                      available payslips.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mp-primary-button"
                    onClick={handleViewHistory}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load Payroll History"}
                  </button>
                </div>

                {loading && (
                  <div className="mp-loading">
                    <span className="mp-spinner" />
                    Loading payroll history...
                  </div>
                )}

                {!loading && historyLoaded && renderHistoryTable()}

                {!historyLoaded && !loading && (
                  <div className="mp-empty-state compact">
                    <div className="mp-empty-icon">◷</div>
                    <h3>Your payroll history</h3>
                    <p>
                      Click Load Payroll History to view your previous payroll
                      records.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <footer className="mp-footer">
        <span>MyWorkforce Solutions</span>
        <span>Manager Payroll Portal</span>
      </footer>
    </div>
  );
}

export default ManagerPayroll;
