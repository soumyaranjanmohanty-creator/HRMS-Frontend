import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/LeaveManagement.css";

function LeaveManagement() {
  const [activeSection, setActiveSection] = useState("pending");

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [hrLeaves, setHrLeaves] = useState([]);

  const [selectedLeave, setSelectedLeave] = useState(null);

  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadLeaveData();
  }, []);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      setError("");

      const [pendingResponse, hrLeavesResponse] = await Promise.all([
        api.get("/leave/pending"),
        api.get("/leave/hr-leaves"),
      ]);

      setPendingLeaves(
        (pendingResponse.data || []).filter(
          (leave) => leave.user?.role?.name === "HR",
        ),
      );

      setHrLeaves(hrLeavesResponse.data || []);
    } catch (error) {
      console.error("Failed to load leave data:", error);
      setError("Failed to load leave data.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewLeave = (leave) => {
    setSelectedLeave(leave);
    setActiveSection("details");
    setError("");
    setSuccess("");
  };

  const handleApprove = async (leaveId) => {
    try {
      setError("");
      setSuccess("");

      await api.post(`/leave/${leaveId}/approve`);

      setSuccess("Leave request approved successfully.");

      setSelectedLeave(null);

      await loadLeaveData();
    } catch (error) {
      console.error("Failed to approve leave:", error);
      setError("Failed to approve leave request.");
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
      setRejectionReason("");
      setSelectedLeave(null);

      setSuccess("Leave request rejected successfully.");

      await loadLeaveData();
    } catch (error) {
      console.error("Failed to reject leave:", error);
      setError("Failed to reject leave request.");
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return date;
  };

  const getHrName = (leave) => {
    return leave?.user?.name || "-";
  };

  const getApproverName = (leave) => {
    if (leave?.approver?.name) {
      return leave.approver.name;
    }

    if (leave?.approvedBy?.name) {
      return leave.approvedBy.name;
    }

    return "-";
  };

  return (
    <div className="leave-page">
      <div className="leave-page-header">
        <h1>Leave Management</h1>
        <p>Manage HR leave requests and approval workflow.</p>
      </div>

      <div className="leave-tabs">
        <button
          type="button"
          className={activeSection === "pending" ? "active" : ""}
          onClick={() => {
            setActiveSection("pending");
            setSelectedLeave(null);
            setShowRejectBox(false);
            setError("");
            setSuccess("");
          }}
        >
          Pending Leave Requests
        </button>

        <button
          type="button"
          className={activeSection === "details" ? "active" : ""}
          onClick={() => {
            setActiveSection("details");
            setShowRejectBox(false);
            setError("");
          }}
        >
          HR Leave Details
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
          <span>{error}</span>
        </div>
      )}

      {loading && <p>Loading leave data...</p>}

      {!loading && activeSection === "pending" && (
        <div className="leave-card">
          <div className="leave-card-header">
            <h2>Pending Leave Requests</h2>
            <p>HR leave requests waiting for Admin approval.</p>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="leave-empty-state">
              No pending HR leave requests.
            </div>
          ) : (
            <div className="leave-table-wrapper">
              <table className="leave-table">
                <thead>
                  <tr>
                    <th>Leave ID</th>
                    <th>HR Name</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingLeaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.id}</td>

                      <td className="leave-name">{getHrName(leave)}</td>

                      <td>{leave.leaveType || "-"}</td>

                      <td>{formatDate(leave.startDate)}</td>

                      <td>{formatDate(leave.endDate)}</td>

                      <td>{leave.numberOfDays ?? "-"}</td>

                      <td>
                        <span className="leave-status pending">
                          {leave.status}
                        </span>
                      </td>

                      <td className="leave-actions">
                        <button
                          type="button"
                          className="leave-view-button"
                          onClick={() => handleViewLeave(leave)}
                        >
                          View
                        </button>

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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && activeSection === "details" && (
        <div className="leave-details-section">
          <div className="leave-card-header">
            <h2>HR Leave Details</h2>
            <p>All HR leave requests and their complete information.</p>
          </div>

          {hrLeaves.length === 0 ? (
            <div className="leave-empty-state">No HR leave requests found.</div>
          ) : (
            <div className="leave-details-list">
              {hrLeaves.map((leave) => (
                <div className="leave-detail-card" key={leave.id}>
                  <div className="leave-detail-card-header">
                    <div>
                      <h3>Leave Request #{leave.id}</h3>
                      <p>{getHrName(leave)}</p>
                    </div>

                    <span
                      className={`leave-status ${String(
                        leave.status || "",
                      ).toLowerCase()}`}
                    >
                      {leave.status}
                    </span>
                  </div>

                  <div className="leave-detail-grid">
                    <div>
                      <span>Leave ID</span>
                      <strong>{leave.id}</strong>
                    </div>

                    <div>
                      <span>HR Name</span>
                      <strong>{getHrName(leave)}</strong>
                    </div>

                    <div>
                      <span>Leave Type</span>
                      <strong>{leave.leaveType || "-"}</strong>
                    </div>

                    <div>
                      <span>Start Date</span>
                      <strong>{formatDate(leave.startDate)}</strong>
                    </div>

                    <div>
                      <span>End Date</span>
                      <strong>{formatDate(leave.endDate)}</strong>
                    </div>

                    <div>
                      <span>Number of Days</span>
                      <strong>{leave.numberOfDays ?? "-"}</strong>
                    </div>

                    <div>
                      <span>Applied Date</span>
                      <strong>{formatDate(leave.appliedDate)}</strong>
                    </div>

                    <div>
                      <span>Approver</span>
                      <strong>{getApproverName(leave)}</strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <strong>{leave.status || "-"}</strong>
                    </div>

                    <div>
                      <span>Approval/Rejection Date</span>
                      <strong>{formatDate(leave.approvalRejectionDate)}</strong>
                    </div>

                    <div className="leave-detail-full">
                      <span>Reason</span>
                      <strong>{leave.reason || "-"}</strong>
                    </div>

                    <div className="leave-detail-full">
                      <span>Rejection Reason</span>
                      <strong>{leave.approvalRejectionReason || "-"}</strong>
                    </div>
                  </div>

                  {leave.status === "PENDING" && (
                    <div className="leave-detail-actions">
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showRejectBox && selectedLeave && (
        <div className="leave-modal-overlay">
          <div className="leave-reject-modal">
            <h2>Reject Leave Request</h2>

            <p>
              Leave Request #{selectedLeave.id} — {getHrName(selectedLeave)}
            </p>

            <label>Rejection Reason</label>

            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Enter rejection reason"
              rows="5"
            />

            <div className="leave-modal-actions">
              <button
                type="button"
                className="leave-cancel-button"
                onClick={() => {
                  setShowRejectBox(false);
                  setRejectionReason("");
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

export default LeaveManagement;
