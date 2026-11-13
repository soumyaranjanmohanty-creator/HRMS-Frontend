import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/HRLeaveManagement.css";

function HRLeaveManagement() {
  const [activeTab, setActiveTab] = useState("pending");

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showRejectBox, setShowRejectBox] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "CASUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab) => {
    try {
      setLoading(true);
      setError("");

      if (tab === "pending") {
        const response = await api.get("/leave/pending");
        setPendingLeaves(response.data || []);
      }

      if (tab === "team") {
        const response = await api.get("/leave/hr-leaves");
        setTeamLeaves(response.data || []);
      }

      if (tab === "myLeave") {
        const [leavesResponse, balanceResponse] = await Promise.all([
          api.get("/leave/my-leaves"),
          api.get("/leave/balance"),
        ]);

        setMyLeaves(leavesResponse.data || []);
        setLeaveBalance(balanceResponse.data || null);
      }
    } catch (err) {
      console.error("Failed to load leave data:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to load leave data.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    setSuccess("");
    setShowRejectBox(false);
    setSelectedLeave(null);
  };

  const handleApplyLeave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!leaveForm.startDate || !leaveForm.endDate) {
      setError("Please select both start date and end date.");
      return;
    }

    if (leaveForm.endDate < leaveForm.startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    if (!leaveForm.reason.trim()) {
      setError("Please enter the reason for leave.");
      return;
    }

    try {
      await api.post("/leave/apply", {
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason.trim(),
      });

      setSuccess("Leave application submitted successfully.");

      setLeaveForm({
        leaveType: "CASUAL",
        startDate: "",
        endDate: "",
        reason: "",
      });

      await loadTabData("myLeave");
    } catch (err) {
      console.error("Failed to apply for leave:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to submit leave application.",
      );
    }
  };

  const handleApprove = async (leaveId) => {
    if (!window.confirm("Are you sure you want to approve this leave?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.post(`/leave/${leaveId}/approve`);

      setSuccess("Leave request approved successfully.");

      await loadTabData(activeTab);
    } catch (err) {
      console.error("Failed to approve leave:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to approve leave request.",
      );
    }
  };

  const handleOpenReject = (leave) => {
    setSelectedLeave(leave);
    setRejectionReason("");
    setShowRejectBox(true);
    setError("");
    setSuccess("");
  };

  const handleReject = async () => {
    if (!selectedLeave) {
      return;
    }

    if (!rejectionReason.trim()) {
      setError("Rejection reason is required.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.post(`/leave/${selectedLeave.id}/reject`, null, {
        params: {
          rejectionReason: rejectionReason.trim(),
        },
      });

      setShowRejectBox(false);
      setSelectedLeave(null);
      setRejectionReason("");

      setSuccess("Leave request rejected successfully.");

      await loadTabData(activeTab);
    } catch (err) {
      console.error("Failed to reject leave:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to reject leave request.",
      );
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = String(value).split("T")[0];
    const parts = date.split("-");

    if (parts.length !== 3) {
      return value;
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const getUserName = (leave) => {
    return leave?.user?.name || "—";
  };

  const getApproverName = (leave) => {
    return leave?.approver?.name || "—";
  };

  const getStatusClass = (status) => {
    return String(status || "").toLowerCase();
  };

  const renderStatus = (status) => (
    <span className={`leave-status ${getStatusClass(status)}`}>
      {status || "—"}
    </span>
  );

  const renderLeaveTable = (leaves, showActions = false) => {
    if (leaves.length === 0) {
      return <div className="leave-empty-state">No leave records found.</div>;
    }

    return (
      <div className="leave-table-wrapper">
        <table className="leave-table">
          <thead>
            <tr>
              <th>Leave ID</th>
              <th>Employee / Manager</th>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {leaves.map((leave) => (
              <tr key={leave.id}>
                <td>{leave.id}</td>

                <td className="leave-name">{getUserName(leave)}</td>

                <td>{leave.leaveType || "—"}</td>

                <td>{formatDate(leave.startDate)}</td>

                <td>{formatDate(leave.endDate)}</td>

                <td>{leave.numberOfDays ?? "—"}</td>

                <td>{renderStatus(leave.status)}</td>

                <td>
                  <div className="leave-actions">
                    <button
                      type="button"
                      className="leave-view-button"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowDetails(true);
                      }}
                    >
                      View Details
                    </button>

                    {showActions && leave.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          className="leave-approve-button"
                          onClick={() => handleApprove(leave.id)}
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          className="leave-reject-button"
                          onClick={() => handleOpenReject(leave)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="leave-page">
      <div className="leave-page-header">
        <h1>Leave Management</h1>
        <p>Manage team leave requests and your personal leave applications.</p>
      </div>

      <div className="leave-tabs">
        <button
          type="button"
          className={activeTab === "pending" ? "active" : ""}
          onClick={() => handleTabChange("pending")}
        >
          Pending Leave Requests
        </button>

        <button
          type="button"
          className={activeTab === "team" ? "active" : ""}
          onClick={() => handleTabChange("team")}
        >
          Team Leave Records
        </button>

        <button
          type="button"
          className={activeTab === "myLeave" ? "active" : ""}
          onClick={() => handleTabChange("myLeave")}
        >
          My Leave
        </button>
      </div>

      {success && (
        <div className="leave-success-notification">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="leave-error-notification">
          <span>!</span>
          <span>
            {typeof error === "string" ? error : "The request failed."}
          </span>
        </div>
      )}

      {loading && <p>Loading leave data...</p>}

      {!loading && activeTab === "pending" && (
        <div className="leave-card">
          <div className="leave-card-header">
            <h2>Pending Leave Requests</h2>
            <p>Review and process leave requests assigned to you.</p>
          </div>

          {renderLeaveTable(pendingLeaves, true)}
        </div>
      )}

      {!loading && activeTab === "team" && (
        <div className="leave-card">
          <div className="leave-card-header">
            <h2>Team Leave Records</h2>
            <p>View leave applications within your HR hierarchy.</p>
          </div>

          {renderLeaveTable(teamLeaves)}
        </div>
      )}

      {!loading && activeTab === "myLeave" && (
        <div className="leave-details-section">
          <div className="leave-card">
            <div className="leave-card-header">
              <h2>My Leave Balance</h2>
              <p>Your current-year leave entitlement and usage.</p>
            </div>

            {leaveBalance ? (
              <div className="leave-detail-grid">
                <div>
                  <span>Year</span>
                  <strong>{leaveBalance.year}</strong>
                </div>

                <div>
                  <span>Earned Leave Remaining</span>
                  <strong>
                    {leaveBalance.earnedTotal - leaveBalance.earnedUsed} /{" "}
                    {leaveBalance.earnedTotal}
                  </strong>
                </div>

                <div>
                  <span>Sick Leave Remaining</span>
                  <strong>
                    {leaveBalance.sickTotal - leaveBalance.sickUsed} /{" "}
                    {leaveBalance.sickTotal}
                  </strong>
                </div>

                <div>
                  <span>Casual Leave Remaining</span>
                  <strong>
                    {leaveBalance.casualTotal - leaveBalance.casualUsed} /{" "}
                    {leaveBalance.casualTotal}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="leave-empty-state">
                Leave balance is unavailable.
              </div>
            )}
          </div>

          <div className="leave-card">
            <div className="leave-card-header">
              <h2>Apply for Leave</h2>
              <p>Submit a new personal leave application.</p>
            </div>

            <form className="hr-leave-form" onSubmit={handleApplyLeave}>
              <div className="hr-leave-form-grid">
                <div className="hr-leave-field">
                  <label htmlFor="leaveType">Leave Type</label>

                  <select
                    id="leaveType"
                    value={leaveForm.leaveType}
                    onChange={(event) =>
                      setLeaveForm({
                        ...leaveForm,
                        leaveType: event.target.value,
                      })
                    }
                  >
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="EARNED">Earned Leave</option>
                  </select>
                </div>

                <div className="hr-leave-field">
                  <label htmlFor="startDate">Start Date</label>

                  <input
                    id="startDate"
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(event) =>
                      setLeaveForm({
                        ...leaveForm,
                        startDate: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="hr-leave-field">
                  <label htmlFor="endDate">End Date</label>

                  <input
                    id="endDate"
                    type="date"
                    min={leaveForm.startDate || undefined}
                    value={leaveForm.endDate}
                    onChange={(event) =>
                      setLeaveForm({
                        ...leaveForm,
                        endDate: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="hr-leave-field hr-leave-reason">
                  <label htmlFor="reason">Reason for Leave</label>

                  <textarea
                    id="reason"
                    rows="4"
                    value={leaveForm.reason}
                    onChange={(event) =>
                      setLeaveForm({
                        ...leaveForm,
                        reason: event.target.value,
                      })
                    }
                    placeholder="Enter the reason for your leave"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="leave-approve-button">
                Submit Leave Application
              </button>
            </form>
          </div>

          <div className="leave-card">
            <div className="leave-card-header">
              <h2>My Leave History</h2>
              <p>Track your previous and current applications.</p>
            </div>

            {renderLeaveTable(myLeaves)}
          </div>
        </div>
      )}

      {showDetails && selectedLeave && (
        <div className="leave-modal-overlay">
          <div className="leave-reject-modal">
            <h2>Leave Request Details</h2>

            <p>
              <strong>Leave ID:</strong> {selectedLeave.id}
            </p>
            <p>
              <strong>Employee / Manager:</strong> {getUserName(selectedLeave)}
            </p>
            <p>
              <strong>Leave Type:</strong> {selectedLeave.leaveType || "—"}
            </p>
            <p>
              <strong>Start Date:</strong> {formatDate(selectedLeave.startDate)}
            </p>
            <p>
              <strong>End Date:</strong> {formatDate(selectedLeave.endDate)}
            </p>
            <p>
              <strong>Number of Days:</strong>{" "}
              {selectedLeave.numberOfDays ?? "—"}
            </p>
            <p>
              <strong>Status:</strong> {selectedLeave.status || "—"}
            </p>
            <p>
              <strong>Application Reason:</strong> {selectedLeave.reason || "—"}
            </p>
            <p>
              <strong>Rejection Reason:</strong>{" "}
              {selectedLeave.approvalRejectionReason || "—"}
            </p>
            <p>
              <strong>Approver:</strong> {getApproverName(selectedLeave)}
            </p>

            <div className="leave-modal-actions">
              <button
                type="button"
                className="leave-cancel-button"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedLeave(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectBox && selectedLeave && (
        <div className="leave-modal-overlay">
          <div className="leave-reject-modal">
            <h2>Reject Leave Request</h2>

            <p>
              Leave Request #{selectedLeave.id} — {getUserName(selectedLeave)}
            </p>

            <label htmlFor="rejectionReason">Rejection Reason</label>

            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Enter rejection reason"
              rows="5"
              required
            />

            <div className="leave-modal-actions">
              <button
                type="button"
                className="leave-cancel-button"
                onClick={() => {
                  setShowRejectBox(false);
                  setSelectedLeave(null);
                  setRejectionReason("");
                  setError("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="leave-confirm-reject-button"
                onClick={handleReject}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRLeaveManagement;
