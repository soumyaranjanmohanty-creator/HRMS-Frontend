import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/EmployeeLeaveManagement.css";

function EmployeeLeaveManagement() {
  const [activeTab, setActiveTab] = useState("apply");

  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchDate, setSearchDate] = useState("");

  const [form, setForm] = useState({
    leaveType: "CASUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  // Load the employee's leave history.
  const loadLeaves = useCallback(async () => {
    const response = await api.get("/leave/my-leaves");

    setLeaves(Array.isArray(response.data) ? response.data : []);
  }, []);

  // Load the employee's current-year leave balance.
  const loadBalance = useCallback(async () => {
    const response = await api.get("/leave/balance");

    setBalance(response.data || null);
  }, []);

  // Load history and balance from the existing backend.
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([loadLeaves(), loadBalance()]);
    } catch (err) {
      console.error("Failed to load leave information:", err);

      setError(
        err.response?.data?.message ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : "Unable to load leave information. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }, [loadLeaves, loadBalance]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update a form field.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // Calculate inclusive calendar days.
  const requestedDays = useMemo(() => {
    if (!form.startDate || !form.endDate) {
      return 0;
    }

    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);

    if (end < start) {
      return 0;
    }

    return Math.floor((end - start) / 86400000) + 1;
  }, [form.startDate, form.endDate]);

  // Submit the leave application.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.startDate || !form.endDate) {
      setError("Please select both the start date and end date.");
      return;
    }

    if (form.startDate < todayString) {
      setError("Past dates cannot be selected for a new leave application.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Please provide a reason for your leave.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      };

      const response = await api.post("/leave/apply", payload);

      setSuccess(
        typeof response.data === "string"
          ? response.data
          : "Leave application submitted successfully.",
      );

      setForm({
        leaveType: "CASUAL",
        startDate: "",
        endDate: "",
        reason: "",
      });

      await loadData();

      setActiveTab("history");
    } catch (err) {
      console.error("Leave application failed:", err);

      setError(
        err.response?.data?.message ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : "Unable to submit your leave application. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Format dates for display.
  const formatDate = (value) => {
    if (!value) return "—";

    const date = String(value).slice(0, 10);
    const parts = date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Format timestamps.
  const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).replace("T", " ");
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Normalize backend status values.
  const getStatus = (leave) => String(leave?.status || "PENDING").toUpperCase();

  // Display status badges.
  const renderStatus = (status) => (
    <span
      className={`employee-leave-status status-${String(status).toLowerCase()}`}
    >
      {String(status).replace(/_/g, " ")}
    </span>
  );

  // Filter the employee's leave history.
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const matchesStatus =
        statusFilter === "ALL" || getStatus(leave) === statusFilter;

      const matchesDate =
        !searchDate ||
        String(leave.startDate || "").slice(0, 10) === searchDate ||
        String(leave.endDate || "").slice(0, 10) === searchDate;

      return matchesStatus && matchesDate;
    });
  }, [leaves, statusFilter, searchDate]);

  // Summary counts.
  const pendingCount = leaves.filter(
    (leave) => getStatus(leave) === "PENDING",
  ).length;

  const approvedCount = leaves.filter(
    (leave) => getStatus(leave) === "APPROVED",
  ).length;

  const rejectedCount = leaves.filter(
    (leave) => getStatus(leave) === "REJECTED",
  ).length;

  // Leave balance cards.
  const leaveTypes = [
    {
      key: "earned",
      label: "Earned Leave",
      total: Number(balance?.earnedTotal ?? 0),
      used: Number(balance?.earnedUsed ?? 0),
      description: "Earned leave allocation",
    },
    {
      key: "sick",
      label: "Sick Leave",
      total: Number(balance?.sickTotal ?? 0),
      used: Number(balance?.sickUsed ?? 0),
      description: "Sick leave allocation",
    },
    {
      key: "casual",
      label: "Casual Leave",
      total: Number(balance?.casualTotal ?? 0),
      used: Number(balance?.casualUsed ?? 0),
      description: "Casual leave allocation",
    },
  ];

  const totalAllocated = leaveTypes.reduce(
    (total, item) => total + item.total,
    0,
  );

  const totalUsed = leaveTypes.reduce((total, item) => total + item.used, 0);

  return (
    <div className="employee-leave-page">
      {/* HEADER */}
      <header className="employee-leave-header">
        <div>
          <p className="employee-leave-eyebrow">EMPLOYEE PORTAL</p>

          <h1>Apply for Leave</h1>

          <p className="employee-leave-subtitle">
            Submit leave applications, track approval status, and review your
            available leave balance.
          </p>
        </div>

        <button
          type="button"
          className="employee-leave-refresh"
          onClick={loadData}
          disabled={loading || submitting}
        >
          ↻ {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* FEEDBACK */}
      {error && (
        <div className="employee-leave-alert leave-alert-error" role="alert">
          <span>{error}</span>

          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="employee-leave-alert leave-alert-success" role="status">
          <span>{success}</span>

          <button type="button" onClick={() => setSuccess("")}>
            ×
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <section className="employee-leave-summary">
        <article className="leave-summary-card">
          <div className="leave-summary-icon icon-blue">▤</div>

          <div>
            <span>Total Applications</span>
            <strong>{leaves.length}</strong>
          </div>
        </article>

        <article className="leave-summary-card">
          <div className="leave-summary-icon icon-orange">◷</div>

          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </article>

        <article className="leave-summary-card">
          <div className="leave-summary-icon icon-green">✓</div>

          <div>
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>
        </article>

        <article className="leave-summary-card">
          <div className="leave-summary-icon icon-red">×</div>

          <div>
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
          </div>
        </article>
      </section>

      {/* THREE TABS */}
      <section className="employee-leave-content">
        <nav className="employee-leave-tabs" aria-label="Leave management tabs">
          <button
            type="button"
            className={activeTab === "apply" ? "active" : ""}
            onClick={() => setActiveTab("apply")}
          >
            <span>＋</span> Apply Leave
          </button>

          <button
            type="button"
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            <span>▤</span> Leave History
          </button>

          <button
            type="button"
            className={activeTab === "balance" ? "active" : ""}
            onClick={() => setActiveTab("balance")}
          >
            <span>◷</span> Leave Balance
          </button>
        </nav>

        {/* TAB 1: APPLY LEAVE */}
        {activeTab === "apply" && (
          <div className="employee-leave-tab-panel">
            <div className="leave-section-heading">
              <div>
                <h2>New Leave Application</h2>

                <p>Complete the form to submit your leave request.</p>
              </div>

              {renderStatus("PENDING")}
            </div>

            <form className="employee-leave-form" onSubmit={handleSubmit}>
              <div className="leave-form-grid">
                <div className="leave-form-group">
                  <label htmlFor="leaveType">Leave Type *</label>

                  <select
                    id="leaveType"
                    name="leaveType"
                    value={form.leaveType}
                    onChange={handleChange}
                    required
                  >
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="EARNED">Earned Leave</option>
                  </select>

                  <small>Select the type of leave you need.</small>
                </div>

                <div className="leave-form-group">
                  <label htmlFor="leaveDays">Requested Days</label>

                  <input
                    id="leaveDays"
                    type="text"
                    value={`${requestedDays} ${
                      requestedDays === 1 ? "day" : "days"
                    }`}
                    readOnly
                  />

                  <small>
                    Calculated using calendar days, including both dates.
                  </small>
                </div>

                <div className="leave-form-group">
                  <label htmlFor="startDate">Start Date *</label>

                  <input
                    id="startDate"
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    min={todayString}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="leave-form-group">
                  <label htmlFor="endDate">End Date *</label>

                  <input
                    id="endDate"
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    min={form.startDate || todayString}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="leave-form-group leave-form-full">
                  <label htmlFor="reason">Reason for Leave *</label>

                  <textarea
                    id="reason"
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    placeholder="Explain why you are requesting leave..."
                    rows={5}
                    maxLength={1000}
                    required
                  />

                  <small>{form.reason.length}/1000 characters</small>
                </div>
              </div>

              <div className="leave-form-note">
                <strong>Before submitting</strong>

                <p>
                  Your application will be submitted to the approver assigned to
                  your account.
                </p>
              </div>

              <div className="leave-form-actions">
                <button
                  type="button"
                  className="leave-reset-button"
                  onClick={() => {
                    setForm({
                      leaveType: "CASUAL",
                      startDate: "",
                      endDate: "",
                      reason: "",
                    });

                    setError("");
                    setSuccess("");
                  }}
                  disabled={submitting}
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  className="leave-submit-button"
                  disabled={submitting || loading}
                >
                  {submitting ? "Submitting..." : "Submit Application →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: LEAVE HISTORY */}
        {activeTab === "history" && (
          <div className="employee-leave-tab-panel">
            <div className="leave-section-heading">
              <div>
                <h2>Leave History</h2>

                <p>Review your submitted applications and their outcomes.</p>
              </div>
            </div>

            <div className="leave-history-filters">
              <div>
                <label htmlFor="leave-status-filter">Filter by Status</label>

                <select
                  id="leave-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="ALL">All Applications</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label htmlFor="leave-date-filter">Search by Date</label>

                <input
                  id="leave-date-filter"
                  type="date"
                  value={searchDate}
                  onChange={(event) => setSearchDate(event.target.value)}
                />
              </div>

              <button
                type="button"
                className="leave-reset-button"
                onClick={() => {
                  setStatusFilter("ALL");
                  setSearchDate("");
                }}
              >
                Clear Filters
              </button>
            </div>

            <div className="leave-history-result">
              {filteredLeaves.length} application(s) found
            </div>

            {loading ? (
              <div className="leave-empty-state">Loading leave history...</div>
            ) : filteredLeaves.length === 0 ? (
              <div className="leave-empty-state">
                <span>▤</span>

                <h3>No Leave Applications Found</h3>

                <p>
                  No applications match your filters. Submit a new application
                  or clear the filters.
                </p>

                <button
                  type="button"
                  className="leave-empty-action"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setSearchDate("");
                    setActiveTab("apply");
                  }}
                >
                  Apply for Leave
                </button>
              </div>
            ) : (
              <div className="leave-table-wrapper">
                <table className="employee-leave-table">
                  <thead>
                    <tr>
                      <th>Application ID</th>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Applied On</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLeaves.map((leave) => (
                      <tr key={leave.id}>
                        <td>LV-{leave.id}</td>

                        <td>
                          <span className="leave-type-label">
                            {leave.leaveType || "—"}
                          </span>
                        </td>

                        <td>{formatDate(leave.startDate)}</td>

                        <td>{formatDate(leave.endDate)}</td>

                        <td>{leave.numberOfDays ?? "—"}</td>

                        <td>{formatDateTime(leave.appliedDate)}</td>

                        <td>{renderStatus(getStatus(leave))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredLeaves.length > 0 && (
              <div className="leave-history-footer">
                <span>
                  Showing {filteredLeaves.length} of {leaves.length}{" "}
                  applications
                </span>

                <button type="button" onClick={loadData} disabled={loading}>
                  ↻ Refresh History
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LEAVE BALANCE */}
        {activeTab === "balance" && (
          <div className="employee-leave-tab-panel">
            <div className="leave-section-heading">
              <div>
                <h2>My Leave Balance</h2>

                <p>Review your current-year leave allocation and usage.</p>
              </div>

              {balance?.year && (
                <span className="leave-year-badge">
                  Financial Calendar Year: {balance.year}
                </span>
              )}
            </div>

            {loading ? (
              <div className="leave-empty-state">Loading leave balance...</div>
            ) : !balance ? (
              <div className="leave-empty-state">
                <h3>Leave Balance Unavailable</h3>

                <p>Unable to retrieve your leave balance.</p>

                <button
                  type="button"
                  className="leave-empty-action"
                  onClick={loadData}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="leave-balance-overview">
                  <div>
                    <span>Total Allocated</span>
                    <strong>{totalAllocated}</strong>
                    <small>Days</small>
                  </div>

                  <div>
                    <span>Total Used</span>
                    <strong>{totalUsed}</strong>
                    <small>Days</small>
                  </div>

                  <div>
                    <span>Total Remaining</span>
                    <strong>{totalAllocated - totalUsed}</strong>
                    <small>Days</small>
                  </div>
                </div>

                <div className="leave-balance-grid">
                  {leaveTypes.map((item) => {
                    const remaining = item.total - item.used;

                    const percentage =
                      item.total > 0
                        ? Math.min(
                            100,
                            Math.max(0, (item.used / item.total) * 100),
                          )
                        : 0;

                    return (
                      <article
                        className={`leave-balance-card balance-${item.key}`}
                        key={item.key}
                      >
                        <div className="leave-balance-card-header">
                          <div>
                            <span>{item.description}</span>

                            <h3>{item.label}</h3>
                          </div>

                          <span className="leave-balance-icon">◷</span>
                        </div>

                        <div className="leave-balance-number">
                          <strong>{remaining}</strong>

                          <span>days remaining</span>
                        </div>

                        <div className="leave-balance-progress">
                          <div
                            className="leave-balance-progress-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <div className="leave-balance-details">
                          <span>
                            Used: <strong>{item.used}</strong>
                          </span>

                          <span>
                            Total: <strong>{item.total}</strong>
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="leave-balance-note">
                  <strong>How your balance works</strong>

                  <p>
                    Your system initializes the current-year allocation to 15
                    earned leave days, 10 sick leave days, and 10 casual leave
                    days when a balance record is first created. According to
                    the existing service, leave is deducted when an approver
                    approves an application.
                  </p>
                </div>

                <button
                  type="button"
                  className="leave-balance-refresh"
                  onClick={loadData}
                  disabled={loading}
                >
                  ↻ Refresh Leave Balance
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default EmployeeLeaveManagement;
