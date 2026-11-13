import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/admin-dashboard.css";
import "../styles/ManagerDashboard.css";
import "../styles/ManagerLeaveManagement.css";

const TABS = [
  { id: "pending", label: "Pending Requests", icon: "◷" },
  { id: "history", label: "Team Leave History", icon: "▤" },
  { id: "my-leave", label: "My Leave", icon: "♙" },
];

const LEAVE_TYPES = ["EARNED", "SICK", "CASUAL"];

const EMPTY_BALANCE = {
  earnedTotal: 0,
  earnedUsed: 0,
  sickTotal: 0,
  sickUsed: 0,
  casualTotal: 0,
  casualUsed: 0,
};

function getErrorMessage(error, fallback) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    (typeof error.response?.data === "string" ? error.response.data : "") ||
    error.message ||
    fallback
  );
}

function getLeaveType(leave) {
  return String(leave.leaveType || "").toUpperCase();
}

function getEmployeeName(leave) {
  return leave.user?.name || leave.employeeName || leave.userName || "Employee";
}

function getEmployeeId(leave) {
  return leave.user?.id ?? leave.userId ?? "—";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status) {
  if (!status) return "Unknown";

  return String(status)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusClass(status) {
  switch (String(status || "").toUpperCase()) {
    case "APPROVED":
      return "mlm-status-approved";
    case "REJECTED":
      return "mlm-status-rejected";
    case "PENDING":
      return "mlm-status-pending";
    default:
      return "mlm-status-default";
  }
}

function getRemaining(total, used) {
  return Math.max(0, Number(total || 0) - Number(used || 0));
}

function ManagerLeaveManagement() {
  const [activeTab, setActiveTab] = useState("pending");

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(EMPTY_BALANCE);

  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingMyLeave, setLoadingMyLeave] = useState(true);

  const [pendingError, setPendingError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [myLeaveError, setMyLeaveError] = useState("");

  const [teamSearch, setTeamSearch] = useState("");
  const [teamStatus, setTeamStatus] = useState("ALL");
  const [teamLeaveType, setTeamLeaveType] = useState("ALL");
  const [teamStartDate, setTeamStartDate] = useState("");
  const [teamEndDate, setTeamEndDate] = useState("");

  const [myStatus, setMyStatus] = useState("ALL");

  const [form, setForm] = useState({
    leaveType: "EARNED",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [processingLeaveId, setProcessingLeaveId] = useState(null);

  const [decisionDialog, setDecisionDialog] = useState(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const loadPendingLeaves = useCallback(async () => {
    setLoadingPending(true);
    setPendingError("");

    try {
      const response = await api.get("/leave/pending");

      setPendingLeaves(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setPendingError(
        getErrorMessage(error, "Unable to load pending leave requests."),
      );
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const loadTeamLeaves = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError("");

    try {
      const response = await api.get("/leave/manager-leaves");

      setTeamLeaves(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setHistoryError(
        getErrorMessage(error, "Unable to load team leave history."),
      );
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadMyLeave = useCallback(async () => {
    setLoadingMyLeave(true);
    setMyLeaveError("");

    try {
      const [leaveResponse, balanceResponse] = await Promise.all([
        api.get("/leave/my-leaves"),
        api.get("/leave/balance"),
      ]);

      setMyLeaves(Array.isArray(leaveResponse.data) ? leaveResponse.data : []);

      setLeaveBalance({
        ...EMPTY_BALANCE,
        ...(balanceResponse.data || {}),
      });
    } catch (error) {
      setMyLeaveError(
        getErrorMessage(error, "Unable to load your leave information."),
      );
    } finally {
      setLoadingMyLeave(false);
    }
  }, []);

  useEffect(() => {
    loadPendingLeaves();
    loadTeamLeaves();
    loadMyLeave();
  }, [loadPendingLeaves, loadTeamLeaves, loadMyLeave]);

  const refreshLeaveData = async () => {
    await Promise.all([loadPendingLeaves(), loadTeamLeaves(), loadMyLeave()]);
  };

  const filteredTeamLeaves = useMemo(() => {
    const search = teamSearch.trim().toLowerCase();

    return teamLeaves.filter((leave) => {
      const employeeName = getEmployeeName(leave).toLowerCase();
      const employeeEmail = String(
        leave.user?.email || leave.employeeEmail || "",
      ).toLowerCase();
      const employeeId = String(getEmployeeId(leave));

      const matchesSearch =
        !search ||
        employeeName.includes(search) ||
        employeeEmail.includes(search) ||
        employeeId.includes(search);

      const matchesStatus =
        teamStatus === "ALL" ||
        String(leave.status || "").toUpperCase() === teamStatus;

      const matchesType =
        teamLeaveType === "ALL" || getLeaveType(leave) === teamLeaveType;

      const startDate = String(leave.startDate || "").slice(0, 10);
      const endDate = String(leave.endDate || "").slice(0, 10);

      const matchesStartDate = !teamStartDate || endDate >= teamStartDate;

      const matchesEndDate = !teamEndDate || startDate <= teamEndDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    teamLeaves,
    teamSearch,
    teamStatus,
    teamLeaveType,
    teamStartDate,
    teamEndDate,
  ]);

  const filteredMyLeaves = useMemo(() => {
    if (myStatus === "ALL") return myLeaves;

    return myLeaves.filter(
      (leave) => String(leave.status || "").toUpperCase() === myStatus,
    );
  }, [myLeaves, myStatus]);

  const teamStats = useMemo(
    () => ({
      total: teamLeaves.length,
      pending: teamLeaves.filter(
        (leave) => String(leave.status).toUpperCase() === "PENDING",
      ).length,
      approved: teamLeaves.filter(
        (leave) => String(leave.status).toUpperCase() === "APPROVED",
      ).length,
      rejected: teamLeaves.filter(
        (leave) => String(leave.status).toUpperCase() === "REJECTED",
      ).length,
    }),
    [teamLeaves],
  );

  const openDecisionDialog = (leave, decision) => {
    setActionError("");
    setDecisionReason("");

    setDecisionDialog({
      leave,
      decision,
    });
  };

  const closeDecisionDialog = () => {
    if (processingLeaveId !== null) return;

    setDecisionDialog(null);
    setDecisionReason("");
  };

  const submitDecision = async () => {
    if (!decisionDialog) return;

    const { leave, decision } = decisionDialog;

    if (decision === "REJECT" && !decisionReason.trim()) {
      setActionError("Please provide a rejection reason.");
      return;
    }

    setProcessingLeaveId(leave.id);
    setActionError("");
    setSuccessMessage("");

    try {
      if (decision === "APPROVE") {
        await api.post(`/leave/${leave.id}/approve`);

        setSuccessMessage(
          `Leave request from ${getEmployeeName(leave)} approved successfully.`,
        );
      } else {
        await api.post(`/leave/${leave.id}/reject`, null, {
          params: {
            rejectionReason: decisionReason.trim(),
          },
        });

        setSuccessMessage(
          `Leave request from ${getEmployeeName(leave)} rejected successfully.`,
        );
      }

      setDecisionDialog(null);
      setDecisionReason("");

      await refreshLeaveData();
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Unable to process this leave request."),
      );
    } finally {
      setProcessingLeaveId(null);
    }
  };

  const handleApplyLeave = async (event) => {
    event.preventDefault();

    setActionError("");
    setSuccessMessage("");

    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setActionError("Please complete all leave application fields.");
      return;
    }

    if (form.endDate < form.startDate) {
      setActionError("End date cannot be earlier than start date.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/leave/apply", {
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      });

      setSuccessMessage(
        "Your leave application has been submitted successfully.",
      );

      setForm({
        leaveType: "EARNED",
        startDate: "",
        endDate: "",
        reason: "",
      });

      await refreshLeaveData();
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Unable to submit your leave application."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearTeamFilters = () => {
    setTeamSearch("");
    setTeamStatus("ALL");
    setTeamLeaveType("ALL");
    setTeamStartDate("");
    setTeamEndDate("");
  };

  const renderLeaveStatus = (status) => (
    <span className={`mlm-status ${getStatusClass(status)}`}>
      {formatStatus(status)}
    </span>
  );

  const renderEmptyState = (title, description) => (
    <div className="mlm-empty-state">
      <div className="mlm-empty-icon">▤</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );

  const renderLoading = (message) => (
    <div className="mlm-state" role="status">
      <div className="mlm-spinner" />
      <h3>{message}</h3>
      <p>Please wait while the information is retrieved.</p>
    </div>
  );

  const renderError = (message, onRetry) => (
    <div className="mlm-state mlm-error-state" role="alert">
      <h3>Unable to Load Information</h3>
      <p>{message}</p>
      <button type="button" className="mlm-secondary-button" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );

  const renderLeaveTable = (leaves, showEmployee, showDecision) => (
    <div className="mlm-table-wrapper">
      <table className="mlm-table">
        <thead>
          <tr>
            {showEmployee && <th>Employee</th>}
            <th>Leave Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            {!showDecision && <th>Applied Date</th>}
            <th>Days</th>
            <th>Reason</th>
            <th>Status</th>
            {showDecision && <th>Action</th>}
            {!showDecision && <th>Decision Details</th>}
          </tr>
        </thead>

        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id}>
              {showEmployee && (
                <td>
                  <div className="mlm-employee-cell">
                    <div className="mlm-avatar">
                      {getEmployeeName(leave).charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <strong>{getEmployeeName(leave)}</strong>
                      <span>Employee ID: #{getEmployeeId(leave)}</span>
                    </div>
                  </div>
                </td>
              )}

              <td>
                <span className="mlm-leave-type">
                  {formatStatus(getLeaveType(leave))}
                </span>
              </td>

              <td>{formatDate(leave.startDate)}</td>
              <td>{formatDate(leave.endDate)}</td>

              {!showDecision && <td>{formatDate(leave.appliedDate)}</td>}

              <td>{leave.numberOfDays ?? "—"}</td>

              <td>
                <button
                  type="button"
                  className="mlm-view-details-button"
                  onClick={() => setSelectedLeave(leave)}
                >
                  View Details
                </button>
              </td>

              <td>{renderLeaveStatus(leave.status)}</td>

              {showDecision ? (
                <td>
                  <div className="mlm-action-group">
                    <button
                      type="button"
                      className="mlm-approve-button"
                      disabled={processingLeaveId !== null}
                      onClick={() => openDecisionDialog(leave, "APPROVE")}
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      className="mlm-reject-button"
                      disabled={processingLeaveId !== null}
                      onClick={() => openDecisionDialog(leave, "REJECT")}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              ) : (
                <td>
                  <div className="mlm-decision-details">
                    {leave.approvalRejectionDate && (
                      <span>
                        Decision date: {formatDate(leave.approvalRejectionDate)}
                      </span>
                    )}

                    <span>
                      {leave.approvalRejectionReason ||
                        (String(leave.status || "").toUpperCase() === "APPROVED"
                          ? "Approved"
                          : String(leave.status || "").toUpperCase() ===
                              "PENDING"
                            ? "Awaiting decision"
                            : "—")}
                    </span>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPendingTab = () => (
    <>
      <div className="mlm-section-heading">
        <div>
          <h2>Pending Leave Requests</h2>
          <p>Review leave applications submitted by your assigned employees.</p>
        </div>

        <span className="mlm-count-badge">{pendingLeaves.length} Pending</span>
      </div>

      {loadingPending
        ? renderLoading("Loading Pending Requests")
        : pendingError
          ? renderError(pendingError, loadPendingLeaves)
          : pendingLeaves.length === 0
            ? renderEmptyState(
                "No Pending Requests",
                "There are no pending leave requests assigned to you.",
              )
            : renderLeaveTable(pendingLeaves, true, true)}
    </>
  );

  const renderHistoryTab = () => (
    <>
      <div className="mlm-section-heading">
        <div>
          <h2>Team Leave History</h2>
          <p>
            Review leave requests and decisions for your assigned employees.
          </p>
        </div>

        <span className="mlm-count-badge">
          {filteredTeamLeaves.length} Records
        </span>
      </div>

      <div className="mlm-stat-grid">
        <div className="mlm-stat-card">
          <span>Total Requests</span>
          <strong>{teamStats.total}</strong>
        </div>

        <div className="mlm-stat-card mlm-stat-pending">
          <span>Pending</span>
          <strong>{teamStats.pending}</strong>
        </div>

        <div className="mlm-stat-card mlm-stat-approved">
          <span>Approved</span>
          <strong>{teamStats.approved}</strong>
        </div>

        <div className="mlm-stat-card mlm-stat-rejected">
          <span>Rejected</span>
          <strong>{teamStats.rejected}</strong>
        </div>
      </div>

      <div className="mlm-filter-panel">
        <div className="mlm-filter-search">
          <label htmlFor="mlm-team-search">Search Employees</label>
          <input
            id="mlm-team-search"
            type="search"
            placeholder="Search by employee name, ID, or email..."
            value={teamSearch}
            onChange={(event) => setTeamSearch(event.target.value)}
          />
        </div>

        <div className="mlm-filter-field">
          <label htmlFor="mlm-team-status">Status</label>
          <select
            id="mlm-team-status"
            value={teamStatus}
            onChange={(event) => setTeamStatus(event.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="mlm-filter-field">
          <label htmlFor="mlm-team-type">Leave Type</label>
          <select
            id="mlm-team-type"
            value={teamLeaveType}
            onChange={(event) => setTeamLeaveType(event.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="EARNED">Earned Leave</option>
            <option value="SICK">Sick Leave</option>
            <option value="CASUAL">Casual Leave</option>
          </select>
        </div>

        <div className="mlm-filter-field">
          <label htmlFor="mlm-team-start">From Date</label>
          <input
            id="mlm-team-start"
            type="date"
            value={teamStartDate}
            onChange={(event) => setTeamStartDate(event.target.value)}
          />
        </div>

        <div className="mlm-filter-field">
          <label htmlFor="mlm-team-end">To Date</label>
          <input
            id="mlm-team-end"
            type="date"
            min={teamStartDate || undefined}
            value={teamEndDate}
            onChange={(event) => setTeamEndDate(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="mlm-clear-button"
          onClick={clearTeamFilters}
        >
          Clear Filters
        </button>
      </div>

      {loadingHistory
        ? renderLoading("Loading Team Leave History")
        : historyError
          ? renderError(historyError, loadTeamLeaves)
          : filteredTeamLeaves.length === 0
            ? renderEmptyState(
                "No Matching Leave Records",
                "No team leave records match the selected search and filters.",
              )
            : renderLeaveTable(filteredTeamLeaves, true, false)}
    </>
  );

  const renderBalanceCards = () => {
    const balances = [
      {
        key: "earned",
        label: "Earned Leave",
        total: leaveBalance.earnedTotal,
        used: leaveBalance.earnedUsed,
      },
      {
        key: "sick",
        label: "Sick Leave",
        total: leaveBalance.sickTotal,
        used: leaveBalance.sickUsed,
      },
      {
        key: "casual",
        label: "Casual Leave",
        total: leaveBalance.casualTotal,
        used: leaveBalance.casualUsed,
      },
    ];

    return (
      <div className="mlm-balance-grid">
        {balances.map((balance) => (
          <div className="mlm-balance-card" key={balance.key}>
            <div className="mlm-balance-card-heading">
              <span>{balance.label}</span>
              <span className="mlm-balance-icon">◷</span>
            </div>

            <div className="mlm-balance-remaining">
              <strong>{getRemaining(balance.total, balance.used)}</strong>
              <span>days remaining</span>
            </div>

            <div className="mlm-balance-progress">
              <div
                style={{
                  width: `${
                    Number(balance.total) > 0
                      ? Math.min(
                          100,
                          (Number(balance.used) / Number(balance.total)) * 100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="mlm-balance-details">
              <span>Total: {balance.total} days</span>
              <span>Used: {balance.used} days</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMyLeaveTab = () => (
    <>
      <div className="mlm-section-heading">
        <div>
          <h2>My Leave</h2>
          <p>Apply for leave and manage your personal leave information.</p>
        </div>
      </div>

      {loadingMyLeave ? (
        renderLoading("Loading Your Leave Information")
      ) : myLeaveError ? (
        renderError(myLeaveError, loadMyLeave)
      ) : (
        <>
          <section className="mlm-subsection">
            <div className="mlm-subsection-heading">
              <div>
                <h3>My Leave Balance</h3>
                <p>Your current-year leave entitlement and usage.</p>
              </div>
            </div>

            {renderBalanceCards()}
          </section>

          <section className="mlm-subsection">
            <div className="mlm-subsection-heading">
              <div>
                <h3>Apply for Leave</h3>
                <p>
                  Submit your leave application for approval by your assigned
                  approver.
                </p>
              </div>
            </div>

            <form className="mlm-leave-form" onSubmit={handleApplyLeave}>
              <div className="mlm-form-field">
                <label htmlFor="mlm-leave-type">Leave Type *</label>
                <select
                  id="mlm-leave-type"
                  value={form.leaveType}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      leaveType: event.target.value,
                    }))
                  }
                  required
                >
                  {LEAVE_TYPES.map((type) => (
                    <option value={type} key={type}>
                      {formatStatus(type)} Leave
                    </option>
                  ))}
                </select>
              </div>

              <div className="mlm-form-field">
                <label htmlFor="mlm-start-date">Start Date *</label>
                <input
                  id="mlm-start-date"
                  type="date"
                  value={form.startDate}
                  max={form.endDate || undefined}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      startDate: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="mlm-form-field">
                <label htmlFor="mlm-end-date">End Date *</label>
                <input
                  id="mlm-end-date"
                  type="date"
                  value={form.endDate}
                  min={form.startDate || undefined}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      endDate: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="mlm-form-field mlm-form-full">
                <label htmlFor="mlm-leave-reason">Reason for Leave *</label>
                <textarea
                  id="mlm-leave-reason"
                  rows="4"
                  maxLength={1000}
                  placeholder="Explain why you are requesting leave..."
                  value={form.reason}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      reason: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="mlm-form-footer">
                <span>{form.reason.length}/1000 characters</span>

                <button
                  type="submit"
                  className="mlm-primary-button"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Leave Request"}
                </button>
              </div>
            </form>

            <p className="mlm-approver-note">
              Your request will be sent to your assigned approver.
            </p>
          </section>

          <section className="mlm-subsection">
            <div className="mlm-subsection-heading">
              <div>
                <h3>My Leave History</h3>
                <p>Track the status and decision details of your requests.</p>
              </div>

              <select
                aria-label="Filter personal leave history by status"
                className="mlm-history-status-filter"
                value={myStatus}
                onChange={(event) => setMyStatus(event.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {myLeaves.length === 0
              ? renderEmptyState(
                  "No Personal Leave Requests",
                  "Your submitted leave applications will appear here.",
                )
              : filteredMyLeaves.length === 0
                ? renderEmptyState(
                    "No Matching Requests",
                    "No personal leave requests match this status.",
                  )
                : renderLeaveTable(filteredMyLeaves, false, false)}
          </section>
        </>
      )}
    </>
  );

  return (
    <div className="mlm-page">
      <header className="admin-header">
        <div>
          <p className="header-label">MANAGER PORTAL</p>
          <h1>Leave Management</h1>
          <p className="header-subtitle">
            Manage team leave requests and your personal leave.
          </p>
        </div>
      </header>

      <section className="mlm-overview">
        <div className="mlm-overview-icon">▢</div>

        <div>
          <h2>Leave Operations</h2>
          <p>
            Review employee leave requests, explore team leave history, and
            manage your personal leave balance.
          </p>
        </div>
      </section>

      {(successMessage || actionError) && (
        <div
          className={`mlm-alert ${
            actionError ? "mlm-alert-error" : "mlm-alert-success"
          }`}
          role={actionError ? "alert" : "status"}
        >
          <span>{actionError ? "!" : "✓"}</span>
          <p>{actionError || successMessage}</p>

          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => {
              setActionError("");
              setSuccessMessage("");
            }}
          >
            ×
          </button>
        </div>
      )}

      <section className="mlm-content-card">
        <div className="mlm-tabs" role="tablist" aria-label="Leave Management">
          {TABS.map((tab) => (
            <button
              type="button"
              role="tab"
              id={`mlm-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`mlm-panel-${tab.id}`}
              className={`mlm-tab ${
                activeTab === tab.id ? "mlm-tab-active" : ""
              }`}
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setActionError("");
                setSuccessMessage("");
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === "pending" && pendingLeaves.length > 0 && (
                <span className="mlm-tab-count">{pendingLeaves.length}</span>
              )}
            </button>
          ))}
        </div>

        <div
          className="mlm-tab-panel"
          role="tabpanel"
          id={`mlm-panel-${activeTab}`}
          aria-labelledby={`mlm-tab-${activeTab}`}
        >
          {activeTab === "pending" && renderPendingTab()}
          {activeTab === "history" && renderHistoryTab()}
          {activeTab === "my-leave" && renderMyLeaveTab()}
        </div>
      </section>

      {decisionDialog && (
        <div className="mlm-modal-backdrop">
          <section
            className="mlm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mlm-modal-title"
          >
            <div className="mlm-modal-heading">
              <div
                className={`mlm-modal-icon ${
                  decisionDialog.decision === "REJECT"
                    ? "mlm-modal-icon-danger"
                    : ""
                }`}
              >
                {decisionDialog.decision === "APPROVE" ? "✓" : "!"}
              </div>

              <button
                type="button"
                className="mlm-modal-close"
                aria-label="Close dialog"
                disabled={processingLeaveId !== null}
                onClick={closeDecisionDialog}
              >
                ×
              </button>
            </div>

            <h2 id="mlm-modal-title">
              {decisionDialog.decision === "APPROVE"
                ? "Approve Leave Request?"
                : "Reject Leave Request?"}
            </h2>

            <p className="mlm-modal-description">
              Request from{" "}
              <strong>{getEmployeeName(decisionDialog.leave)}</strong> for{" "}
              <strong>
                {formatStatus(getLeaveType(decisionDialog.leave))} Leave
              </strong>{" "}
              from <strong>{formatDate(decisionDialog.leave.startDate)}</strong>{" "}
              to <strong>{formatDate(decisionDialog.leave.endDate)}</strong>.
            </p>

            {decisionDialog.decision === "REJECT" && (
              <div className="mlm-form-field mlm-modal-reason">
                <label htmlFor="mlm-rejection-reason">Rejection Reason *</label>
                <textarea
                  id="mlm-rejection-reason"
                  rows="4"
                  maxLength={1000}
                  placeholder="Explain why this request is being rejected..."
                  value={decisionReason}
                  onChange={(event) => setDecisionReason(event.target.value)}
                  required
                />
              </div>
            )}

            {actionError && (
              <p className="mlm-modal-error" role="alert">
                {actionError}
              </p>
            )}

            <div className="mlm-modal-actions">
              <button
                type="button"
                className="mlm-secondary-button"
                disabled={processingLeaveId !== null}
                onClick={closeDecisionDialog}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  decisionDialog.decision === "APPROVE"
                    ? "mlm-approve-button"
                    : "mlm-reject-button"
                }
                disabled={processingLeaveId !== null}
                onClick={submitDecision}
              >
                {processingLeaveId !== null
                  ? "Processing..."
                  : decisionDialog.decision === "APPROVE"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedLeave && (
        <div
          className="mlm-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedLeave(null);
            }
          }}
        >
          <section
            className="mlm-modal mlm-leave-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mlm-leave-details-title"
          >
            <div className="mlm-modal-heading">
              <div className="mlm-modal-icon">📋</div>

              <button
                type="button"
                className="mlm-modal-close"
                aria-label="Close leave details"
                onClick={() => setSelectedLeave(null)}
              >
                ×
              </button>
            </div>

            <h2 id="mlm-leave-details-title">Leave Request Details</h2>

            <p className="mlm-modal-description">
              Complete information about this leave request.
            </p>

            <div className="mlm-leave-details-grid">
              <div className="mlm-leave-detail-item">
                <span>Employee Name</span>
                <strong>{getEmployeeName(selectedLeave)}</strong>
              </div>

              <div className="mlm-leave-detail-item">
                <span>Employee ID</span>
                <strong>#{getEmployeeId(selectedLeave)}</strong>
              </div>

              <div className="mlm-leave-detail-item">
                <span>Leave Type</span>
                <strong>
                  {formatStatus(getLeaveType(selectedLeave))} Leave
                </strong>
              </div>

              <div className="mlm-leave-detail-item">
                <span>Status</span>
                <strong>{formatStatus(selectedLeave.status)}</strong>
              </div>

              <div className="mlm-leave-detail-item">
                <span>Start Date</span>
                <strong>{formatDate(selectedLeave.startDate)}</strong>
              </div>

              <div className="mlm-leave-detail-item">
                <span>End Date</span>
                <strong>{formatDate(selectedLeave.endDate)}</strong>
              </div>

              <div className="mlm-leave-detail-item">
                <span>Total Days</span>
                <strong>{selectedLeave.numberOfDays ?? "—"}</strong>
              </div>

              <div className="mlm-leave-detail-item">
                <span>Applied Date</span>
                <strong>{formatDate(selectedLeave.appliedDate)}</strong>
              </div>

              <div className="mlm-leave-detail-item mlm-leave-detail-full">
                <span>Reason for Leave</span>
                <p>{selectedLeave.reason || "No reason provided."}</p>
              </div>

              {selectedLeave.approvalRejectionDate && (
                <div className="mlm-leave-detail-item mlm-leave-detail-full">
                  <span>Decision Date</span>
                  <strong>
                    {formatDate(selectedLeave.approvalRejectionDate)}
                  </strong>
                </div>
              )}

              {selectedLeave.approvalRejectionReason && (
                <div className="mlm-leave-detail-item mlm-leave-detail-full">
                  <span>Decision Remarks</span>
                  <p>{selectedLeave.approvalRejectionReason}</p>
                </div>
              )}
            </div>

            <div className="mlm-modal-actions">
              <button
                type="button"
                className="mlm-secondary-button"
                onClick={() => setSelectedLeave(null)}
              >
                Close
              </button>

              {String(selectedLeave.status || "").toUpperCase() ===
                "PENDING" && (
                <>
                  <button
                    type="button"
                    className="mlm-approve-button"
                    onClick={() => {
                      const leave = selectedLeave;
                      setSelectedLeave(null);
                      openDecisionDialog(leave, "APPROVE");
                    }}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    className="mlm-reject-button"
                    onClick={() => {
                      const leave = selectedLeave;
                      setSelectedLeave(null);
                      openDecisionDialog(leave, "REJECT");
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ManagerLeaveManagement;
