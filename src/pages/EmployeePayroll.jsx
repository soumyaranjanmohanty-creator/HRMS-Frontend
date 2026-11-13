import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/EmployeePayroll.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getEmployeeId = () => {
  try {
    const authData = localStorage.getItem("authData");

    if (!authData) {
      return null;
    }

    const data = JSON.parse(authData);

    return (
      data.userId ??
      data.id ??
      data.user?.id ??
      data.employeeId ??
      data.user?.userId ??
      null
    );
  } catch (error) {
    console.error("Failed to retrieve employee ID:", error);
    return null;
  }
};

const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getPayrollMonth = (month) => {
  const numericMonth = Number(month);

  if (numericMonth < 1 || numericMonth > 12) {
    return "Unknown Month";
  }

  return MONTHS[numericMonth - 1];
};

const normalizeStatus = (status) => String(status || "UNKNOWN").toUpperCase();

const getStatusClass = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "PAID") return "employee-payroll-status-paid";
  if (normalized === "GENERATED") {
    return "employee-payroll-status-generated";
  }

  return "employee-payroll-status-default";
};

const EmployeePayroll = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const [employeeId, setEmployeeId] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1),
  );

  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );

  const [payroll, setPayroll] = useState(null);
  const [history, setHistory] = useState([]);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [salaryError, setSalaryError] = useState("");

  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const [payrollError, setPayrollError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo(() => {
    const years = [];

    for (let year = currentYear; year >= 2000; year--) {
      years.push(year);
    }

    return years;
  }, [currentYear]);

  useEffect(() => {
    setEmployeeId(getEmployeeId());
  }, []);

  const loadPayroll = useCallback(async () => {
    if (!employeeId) {
      setPayroll(null);
      setPayrollError("Employee ID was not found. Please log in again.");
      return;
    }

    setLoadingPayroll(true);
    setPayrollError("");
    setPayroll(null);

    try {
      const response = await api.get(`/payroll/${employeeId}`, {
        params: {
          month: Number(selectedMonth),
          year: Number(selectedYear),
        },
      });

      setPayroll(response.data || null);
    } catch (error) {
      console.error("Failed to load payroll:", error);

      const status = error.response?.status;

      if (status === 404) {
        setPayrollError("No payroll record was found for the selected month.");
      } else if (status === 401 || status === 403) {
        setPayrollError(
          "You are not authorized to view this payroll. Please log in again if your session has expired.",
        );
      } else {
        setPayrollError(
          error.response?.data?.message ||
            "Unable to load payroll details. Please try again.",
        );
      }
    } finally {
      setLoadingPayroll(false);
    }
  }, [employeeId, selectedMonth, selectedYear]);

  const loadHistory = useCallback(async () => {
    if (!employeeId) {
      setHistory([]);
      setHistoryError("Employee ID was not found. Please log in again.");
      return;
    }

    setLoadingHistory(true);
    setHistoryError("");

    try {
      const response = await api.get(`/payroll/history/${employeeId}`);

      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load payroll history:", error);

      setHistory([]);

      setHistoryError(
        error.response?.data?.message ||
          "Unable to load payroll history. Please try again.",
      );
    } finally {
      setLoadingHistory(false);
    }
  }, [employeeId]);

  // Load the logged-in Employee's own salary structure.
  const loadSalaryStructure = useCallback(async () => {
    if (!employeeId) {
      setSalaryStructure(null);
      setSalaryError("Employee ID was not found. Please log in again.");
      return;
    }

    setLoadingSalary(true);
    setSalaryError("");
    setSalaryStructure(null);

    try {
      const response = await api.get(`/salary/${employeeId}`);

      setSalaryStructure(response.data || null);

      if (!response.data) {
        setSalaryError("No salary structure was found for your account.");
      }
    } catch (error) {
      console.error("Failed to load employee salary structure:", error);

      setSalaryError(
        error.response?.data?.message ||
          "Unable to load your salary structure. Please try again.",
      );
    } finally {
      setLoadingSalary(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId && activeTab === "overview") {
      loadPayroll();
    }
  }, [employeeId, activeTab, loadPayroll]);

  useEffect(() => {
    if (employeeId && activeTab === "history") {
      loadHistory();
    }
  }, [employeeId, activeTab, loadHistory]);

  useEffect(() => {
    if (employeeId && activeTab === "payslips") {
      loadHistory();
    }
  }, [employeeId, activeTab, loadHistory]);

  const downloadPayslip = async (payrollRecord) => {
    if (!payrollRecord?.id) {
      setDownloadError("Payroll ID is missing.");
      return;
    }

    if (normalizeStatus(payrollRecord.status) !== "PAID") {
      setDownloadError(
        "A payslip can only be downloaded after payroll is marked PAID.",
      );
      return;
    }

    setDownloadingId(payrollRecord.id);
    setDownloadError("");
    setSuccessMessage("");

    try {
      const response = await api.get(`/payroll/${payrollRecord.id}/payslip`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `payslip-${payrollRecord.payrollMonth}-${payrollRecord.payrollYear}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage("Payslip downloaded successfully.");
    } catch (error) {
      console.error("Payslip download failed:", error);

      setDownloadError(
        "Unable to download the payslip. Check the payroll status and try again.",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const paidPayrolls = useMemo(
    () => history.filter((record) => normalizeStatus(record.status) === "PAID"),
    [history],
  );

  const totalPaid = useMemo(
    () =>
      paidPayrolls.reduce(
        (total, record) => total + Number(record.netSalary || 0),
        0,
      ),
    [paidPayrolls],
  );

  const getNetSalary = (record) => Number(record?.netSalary || 0);

  const getGrossSalary = (record) => Number(record?.grossSalary || 0);

  const getTotalDeductions = (record) => Number(record?.totalDeductions || 0);

  const getAbsenceDeduction = (record) => Number(record?.absenceDeduction || 0);

  const getTotalAllowances = (record) => Number(record?.totalAllowances || 0);

  const renderStatus = (status) => (
    <span className={`employee-payroll-status ${getStatusClass(status)}`}>
      <span className="employee-payroll-status-dot" />
      {normalizeStatus(status)}
    </span>
  );

  const renderSalaryStructure = () => {
    if (!salaryStructure) {
      return null;
    }

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

    const components = [
      ["Salary Structure ID", salaryStructure.id],
      ["Employee ID", salaryStructure.userId ?? employeeId],
      ["Basic Salary", formatCurrency(salaryStructure.basicSalary)],
      ["House Rent Allowance (HRA)", formatCurrency(salaryStructure.hra)],
      [
        "Conveyance Allowance",
        formatCurrency(salaryStructure.conveyanceAllowance),
      ],
      ["Other Allowances", formatCurrency(salaryStructure.otherAllowances)],
      ["Provident Fund (PF)", formatCurrency(salaryStructure.pf)],
      ["Professional Tax", formatCurrency(salaryStructure.professionalTax)],
      ["Income Tax", formatCurrency(salaryStructure.incomeTax)],
      ["Other Deductions", formatCurrency(salaryStructure.otherDeductions)],
    ];

    return (
      <div className="employee-payroll-details-card employee-salary-structure-card">
        <div className="employee-payroll-details-heading">
          <div>
            <h2>My Salary Structure</h2>
            <p>Your assigned salary components and deductions.</p>
          </div>

          <span className="employee-payroll-status employee-payroll-status-paid">
            VIEW ONLY
          </span>
        </div>

        <div className="employee-salary-components-grid">
          {components.map(([label, value]) => (
            <div className="employee-payroll-detail-row" key={label}>
              <span>{label}</span>
              <strong>
                {value === null || value === undefined || value === ""
                  ? "—"
                  : value}
              </strong>
            </div>
          ))}
        </div>

        <div className="employee-salary-totals">
          <div>
            <span>Total Allowances</span>
            <strong>{formatCurrency(allowances)}</strong>
          </div>

          <div>
            <span>Total Salary Deductions</span>
            <strong>{formatCurrency(deductions)}</strong>
          </div>

          <div>
            <span>Gross Salary</span>
            <strong>{formatCurrency(grossSalary)}</strong>
          </div>
        </div>

        <div className="employee-payroll-information">
          <span className="employee-payroll-information-icon">i</span>
          <p>
            This salary structure is read-only. Your monthly payroll may also
            include absence deductions and other payroll adjustments.
          </p>
        </div>
      </div>
    );
  };

  const renderEmptyState = (title, description) => (
    <div className="employee-payroll-empty">
      <div className="employee-payroll-empty-icon">₹</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );

  return (
    <div className="employee-payroll-page">
      <div className="employee-payroll-header">
        <div>
          <span className="employee-payroll-eyebrow">
            EMPLOYEE SELF SERVICE
          </span>

          <h1>My Payroll</h1>

          <p>
            View your salary details, payroll history, and available payslips.
          </p>
        </div>

        <div className="employee-payroll-header-icon">₹</div>
      </div>

      <div className="employee-payroll-tabs">
        <button
          type="button"
          className={
            activeTab === "overview"
              ? "employee-payroll-tab active"
              : "employee-payroll-tab"
          }
          onClick={() => {
            setActiveTab("overview");
            setDownloadError("");
            setSuccessMessage("");
          }}
        >
          <span className="employee-payroll-tab-icon">▦</span>
          Payroll Overview
        </button>

        <button
          type="button"
          className={
            activeTab === "history"
              ? "employee-payroll-tab active"
              : "employee-payroll-tab"
          }
          onClick={() => {
            setActiveTab("history");
            setDownloadError("");
            setSuccessMessage("");
          }}
        >
          <span className="employee-payroll-tab-icon">◷</span>
          Payroll History
        </button>

        <button
          type="button"
          className={
            activeTab === "payslips"
              ? "employee-payroll-tab active"
              : "employee-payroll-tab"
          }
          onClick={() => {
            setActiveTab("payslips");
            setDownloadError("");
            setSuccessMessage("");
          }}
        >
          <span className="employee-payroll-tab-icon">▤</span>
          Payslips
        </button>
        <button
          type="button"
          className={
            activeTab === "salary"
              ? "employee-payroll-tab active"
              : "employee-payroll-tab"
          }
          onClick={() => {
            setActiveTab("salary");
            setSalaryError("");
            setDownloadError("");
            setSuccessMessage("");
          }}
        >
          <span className="employee-payroll-tab-icon">₹</span>
          Salary Details
        </button>
      </div>

      {downloadError && (
        <div className="employee-payroll-alert error">
          <span>!</span>
          <p>{downloadError}</p>
          <button
            type="button"
            onClick={() => setDownloadError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="employee-payroll-alert success">
          <span>✓</span>
          <p>{successMessage}</p>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* TAB 1: PAYROLL OVERVIEW */}
      {activeTab === "overview" && (
        <section className="employee-payroll-content">
          <div className="employee-payroll-section-heading">
            <div>
              <h2>Salary Overview</h2>
              <p>Review your payroll information for a selected month.</p>
            </div>

            <button
              type="button"
              className="employee-payroll-refresh"
              onClick={loadPayroll}
              disabled={loadingPayroll}
            >
              {loadingPayroll ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          <div className="employee-payroll-filter-card">
            <div className="employee-payroll-filter-field">
              <label htmlFor="payroll-month">Payroll Month</label>

              <select
                id="payroll-month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div className="employee-payroll-filter-field">
              <label htmlFor="payroll-year">Payroll Year</label>

              <select
                id="payroll-year"
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="employee-payroll-primary-button"
              onClick={loadPayroll}
              disabled={loadingPayroll}
            >
              View Payroll
            </button>
          </div>

          {loadingPayroll ? (
            <div className="employee-payroll-loading">
              <div className="employee-payroll-spinner" />
              <p>Loading your payroll details...</p>
            </div>
          ) : payrollError ? (
            <div className="employee-payroll-alert error">
              <span>!</span>
              <p>{payrollError}</p>
            </div>
          ) : payroll ? (
            <>
              <div className="employee-payroll-summary">
                <div className="employee-payroll-summary-card net">
                  <div className="employee-payroll-summary-top">
                    <span>Net Salary</span>
                    <span className="employee-payroll-summary-icon">₹</span>
                  </div>

                  <h3>{formatCurrency(payroll.netSalary)}</h3>

                  <p>Amount after payroll deductions</p>
                </div>

                <div className="employee-payroll-summary-card gross">
                  <div className="employee-payroll-summary-top">
                    <span>Gross Salary</span>
                    <span className="employee-payroll-summary-icon">↗</span>
                  </div>

                  <h3>{formatCurrency(payroll.grossSalary)}</h3>

                  <p>Salary before deductions</p>
                </div>

                <div className="employee-payroll-summary-card deductions">
                  <div className="employee-payroll-summary-top">
                    <span>Total Deductions</span>
                    <span className="employee-payroll-summary-icon">−</span>
                  </div>

                  <h3>{formatCurrency(payroll.totalDeductions)}</h3>

                  <p>Including absence deductions</p>
                </div>

                <div className="employee-payroll-summary-card status">
                  <div className="employee-payroll-summary-top">
                    <span>Payment Status</span>
                    <span className="employee-payroll-summary-icon">✓</span>
                  </div>

                  <div className="employee-payroll-status-value">
                    {renderStatus(payroll.status)}
                  </div>

                  <p>
                    {payroll.status === "PAID"
                      ? "Payroll marked as paid"
                      : "Awaiting payment completion"}
                  </p>
                </div>
              </div>

              <div className="employee-payroll-details-card">
                <div className="employee-payroll-details-heading">
                  <div>
                    <h2>Salary Breakdown</h2>
                    <p>
                      {getPayrollMonth(payroll.payrollMonth)}{" "}
                      {payroll.payrollYear}
                    </p>
                  </div>

                  {renderStatus(payroll.status)}
                </div>

                <div className="employee-payroll-details-grid">
                  <div className="employee-payroll-detail-row">
                    <span>Basic Salary</span>
                    <strong>{formatCurrency(payroll.basicSalary)}</strong>
                  </div>

                  <div className="employee-payroll-detail-row">
                    <span>Total Allowances</span>
                    <strong className="positive">
                      +{formatCurrency(payroll.totalAllowances)}
                    </strong>
                  </div>

                  <div className="employee-payroll-detail-row">
                    <span>Gross Salary</span>
                    <strong>{formatCurrency(payroll.grossSalary)}</strong>
                  </div>

                  <div className="employee-payroll-detail-row">
                    <span>Standard Deductions</span>
                    <strong className="negative">
                      {formatCurrency(
                        getTotalDeductions(payroll) -
                          getAbsenceDeduction(payroll),
                      )}
                    </strong>
                  </div>

                  <div className="employee-payroll-detail-row">
                    <span>Absence Deduction</span>
                    <strong className="negative">
                      {formatCurrency(payroll.absenceDeduction)}
                    </strong>
                  </div>

                  <div className="employee-payroll-detail-row">
                    <span>Total Deductions</span>
                    <strong className="negative">
                      {formatCurrency(payroll.totalDeductions)}
                    </strong>
                  </div>
                </div>

                <div className="employee-payroll-net-row">
                  <div>
                    <span>Final Net Salary</span>
                    <small>
                      Payroll for {getPayrollMonth(payroll.payrollMonth)}{" "}
                      {payroll.payrollYear}
                    </small>
                  </div>

                  <strong>{formatCurrency(payroll.netSalary)}</strong>
                </div>

                <div className="employee-payroll-record-footer">
                  <span>Payroll ID: #{payroll.id}</span>

                  <span>Generated: {formatDate(payroll.generatedDate)}</span>
                </div>
              </div>

              <div className="employee-payroll-information">
                <span className="employee-payroll-information-icon">i</span>

                <p>
                  Your salary figures are taken from the payroll record
                  generated by HR or Admin. Payslips become available for
                  download only after the payroll status changes to PAID.
                </p>
              </div>
            </>
          ) : (
            renderEmptyState(
              "No payroll available",
              "Select a different month or year to view another payroll record.",
            )
          )}
        </section>
      )}

      {/* TAB : PAYROLL HISTORY */}
      {activeTab === "history" && (
        <section className="employee-payroll-content">
          <div className="employee-payroll-section-heading">
            <div>
              <h2>Payroll History</h2>
              <p>Review your previous payroll records and payment statuses.</p>
            </div>

            <button
              type="button"
              className="employee-payroll-refresh"
              onClick={loadHistory}
              disabled={loadingHistory}
            >
              {loadingHistory ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {!loadingHistory && !historyError && (
            <div className="employee-payroll-history-stats">
              <div className="employee-payroll-history-stat">
                <span>Total Records</span>
                <strong>{history.length}</strong>
              </div>

              <div className="employee-payroll-history-stat">
                <span>Paid Records</span>
                <strong>{paidPayrolls.length}</strong>
              </div>

              <div className="employee-payroll-history-stat">
                <span>Total Net Salary Paid</span>
                <strong>{formatCurrency(totalPaid)}</strong>
              </div>
            </div>
          )}

          {loadingHistory ? (
            <div className="employee-payroll-loading">
              <div className="employee-payroll-spinner" />
              <p>Loading payroll history...</p>
            </div>
          ) : historyError ? (
            <div className="employee-payroll-alert error">
              <span>!</span>
              <p>{historyError}</p>
            </div>
          ) : history.length === 0 ? (
            renderEmptyState(
              "No payroll history",
              "Your payroll records will appear here once payroll has been generated.",
            )
          ) : (
            <div className="employee-payroll-table-card">
              <div className="employee-payroll-table-heading">
                <div>
                  <h3>Payroll Records</h3>
                  <p>
                    {history.length} record
                    {history.length === 1 ? "" : "s"} found
                  </p>
                </div>
              </div>

              <div className="employee-payroll-table-wrapper">
                <table className="employee-payroll-table">
                  <thead>
                    <tr>
                      <th>Payroll Period</th>
                      <th>Basic Salary</th>
                      <th>Gross Salary</th>
                      <th>Deductions</th>
                      <th>Net Salary</th>
                      <th>Generated Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div className="employee-payroll-period">
                            <strong>
                              {getPayrollMonth(record.payrollMonth)}
                            </strong>
                            <span>{record.payrollYear}</span>
                          </div>
                        </td>

                        <td>{formatCurrency(record.basicSalary)}</td>

                        <td>{formatCurrency(record.grossSalary)}</td>

                        <td>{formatCurrency(record.totalDeductions)}</td>

                        <td className="employee-payroll-net-cell">
                          {formatCurrency(record.netSalary)}
                        </td>

                        <td>{formatDate(record.generatedDate)}</td>

                        <td>{renderStatus(record.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="employee-payroll-table-note">
                Showing your own payroll records only.
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB : SALARY DETAILS */}
      {activeTab === "salary" && (
        <section className="employee-payroll-content">
          <div className="employee-payroll-section-heading">
            <div>
              <h2>My Salary Details</h2>
              <p>
                View your basic salary, allowances, deductions, and gross
                salary.
              </p>
            </div>

            <button
              type="button"
              className="employee-payroll-refresh"
              onClick={loadSalaryStructure}
              disabled={loadingSalary}
            >
              {loadingSalary ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {loadingSalary ? (
            <div className="employee-payroll-loading">
              <div className="employee-payroll-spinner" />
              <p>Loading your salary structure...</p>
            </div>
          ) : salaryError ? (
            <div className="employee-payroll-alert error">
              <span>!</span>
              <p>{salaryError}</p>
            </div>
          ) : salaryStructure ? (
            renderSalaryStructure()
          ) : (
            <div className="employee-payroll-empty">
              <div className="employee-payroll-empty-icon">₹</div>
              <h3>Your salary information</h3>
              <p>Click Refresh to load your salary structure.</p>
            </div>
          )}
        </section>
      )}

      {/* TAB : PAYSLIPS */}
      {activeTab === "payslips" && (
        <section className="employee-payroll-content">
          <div className="employee-payroll-section-heading">
            <div>
              <h2>My Payslips</h2>
              <p>Download PDF payslips for payroll records marked as paid.</p>
            </div>

            <button
              type="button"
              className="employee-payroll-refresh"
              onClick={loadHistory}
              disabled={loadingHistory}
            >
              {loadingHistory ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          <div className="employee-payroll-payslip-notice">
            <span className="employee-payroll-information-icon">i</span>

            <p>
              Only payroll records with <strong>PAID</strong> status can be
              downloaded as PDF payslips. Records still marked GENERATED are not
              available for download.
            </p>
          </div>

          {loadingHistory ? (
            <div className="employee-payroll-loading">
              <div className="employee-payroll-spinner" />
              <p>Loading your payslips...</p>
            </div>
          ) : historyError ? (
            <div className="employee-payroll-alert error">
              <span>!</span>
              <p>{historyError}</p>
            </div>
          ) : history.length === 0 ? (
            renderEmptyState(
              "No payslips available",
              "Your payslips will appear here when payroll records are generated.",
            )
          ) : (
            <div className="employee-payroll-payslip-list">
              {history.map((record) => {
                const isPaid = normalizeStatus(record.status) === "PAID";

                const isDownloading = downloadingId === record.id;

                return (
                  <article
                    className="employee-payroll-payslip-card"
                    key={record.id}
                  >
                    <div className="employee-payroll-payslip-icon">
                      <span>PDF</span>
                    </div>

                    <div className="employee-payroll-payslip-info">
                      <h3>
                        {getPayrollMonth(record.payrollMonth)}{" "}
                        {record.payrollYear} Payslip
                      </h3>

                      <p>Payroll ID: #{record.id}</p>

                      <div className="employee-payroll-payslip-meta">
                        <span>
                          Generated: {formatDate(record.generatedDate)}
                        </span>

                        {renderStatus(record.status)}
                      </div>

                      <strong className="employee-payroll-payslip-amount">
                        {formatCurrency(record.netSalary)}
                      </strong>
                    </div>

                    <div className="employee-payroll-payslip-action">
                      <button
                        type="button"
                        className={
                          isPaid
                            ? "employee-payroll-download-button"
                            : "employee-payroll-download-button disabled"
                        }
                        disabled={!isPaid || isDownloading}
                        onClick={() => downloadPayslip(record)}
                        title={
                          isPaid
                            ? "Download PDF payslip"
                            : "Payslip available after payroll is marked PAID"
                        }
                      >
                        {isDownloading
                          ? "Downloading..."
                          : isPaid
                            ? "↓ Download PDF"
                            : "Not Available"}
                      </button>

                      {!isPaid && <small>Awaiting payment</small>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default EmployeePayroll;
