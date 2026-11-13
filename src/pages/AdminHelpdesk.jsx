import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/AdminHelpdesk.css";

function AdminHelpdesk() {
  const [activeSection, setActiveSection] = useState("pending");

  const [helpdeskRequests, setHelpdeskRequests] = useState([]);
  const [unlockRequests, setUnlockRequests] = useState([]);

  const [selectedUnlockRequest, setSelectedUnlockRequest] = useState(null);
  const [selectedHelpdeskRequest, setSelectedHelpdeskRequest] = useState(null);

  const [processStatus, setProcessStatus] = useState("IN_PROGRESS");
  const [processResponse, setProcessResponse] = useState("");

  const [loading, setLoading] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadHelpdeskRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/helpdesk/admin");

      setHelpdeskRequests(response.data || []);
    } catch (error) {
      console.error("Failed to load helpdesk requests:", error);
      setError("Failed to load helpdesk requests.");
    } finally {
      setLoading(false);
    }
  };

  const loadUnlockRequests = async () => {
    try {
      setUnlockLoading(true);
      setError("");
      setSuccess("");

      const response = await api.get("/unlock-requests/ADMIN");

      setUnlockRequests(response.data || []);
    } catch (error) {
      console.error("Failed to load unlock requests:", error);
      setError("Failed to load account unlock requests.");
    } finally {
      setUnlockLoading(false);
    }
  };

  useEffect(() => {
    loadHelpdeskRequests();
  }, []);

  useEffect(() => {
    if (activeSection === "unlock") {
      loadUnlockRequests();
    }
  }, [activeSection]);

  const handleApproveUnlock = async (requestId) => {
    try {
      setUnlockLoading(true);
      setError("");
      setSuccess("");

      const response = await api.post(`/unlock-requests/${requestId}/approve`);

      setSuccess(
        response.data || "Account unlock request approved successfully.",
      );

      setSelectedUnlockRequest(null);

      await loadUnlockRequests();
      await loadHelpdeskRequests();
    } catch (error) {
      console.error("Failed to approve unlock request:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to approve account unlock request.");
      }
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleProcessHelpdeskRequest = async (event) => {
    event.preventDefault();

    if (!selectedHelpdeskRequest) {
      return;
    }

    if (!processResponse.trim()) {
      setError("Please enter a response before updating the request.");
      return;
    }

    try {
      setProcessLoading(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/helpdesk/admin/${selectedHelpdeskRequest.id}/process`,
        null,
        {
          params: {
            status: processStatus,
            response: processResponse,
          },
        },
      );

      setSuccess(response.data || "Helpdesk request updated successfully.");

      setSelectedHelpdeskRequest(null);
      setProcessStatus("IN_PROGRESS");
      setProcessResponse("");

      await loadHelpdeskRequests();
    } catch (error) {
      console.error("Failed to process helpdesk request:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data) {
        setError(String(error.response.data));
      } else {
        setError("Failed to process helpdesk request.");
      }
    } finally {
      setProcessLoading(false);
    }
  };

  const pendingRequests = helpdeskRequests.filter(
    (request) => request.status === "OPEN" || request.status === "IN_PROGRESS",
  );

  const historyRequests = helpdeskRequests.filter(
    (request) =>
      request.status === "RESOLVED" ||
      request.status === "REJECTED" ||
      request.status === "APPROVED",
  );

  return (
    <div className="helpdesk-page">
      <div className="helpdesk-page-header">
        <h1>Helpdesk</h1>
        <p>Manage HR requests and account-unlock workflows.</p>
      </div>

      <div className="helpdesk-tabs">
        <button
          type="button"
          className={activeSection === "pending" ? "active" : ""}
          onClick={() => {
            setActiveSection("pending");
            setError("");
            setSuccess("");
            setSelectedHelpdeskRequest(null);
          }}
        >
          Pending Requests
        </button>

        <button
          type="button"
          className={activeSection === "unlock" ? "active" : ""}
          onClick={() => {
            setActiveSection("unlock");
            setError("");
            setSuccess("");
            setSelectedUnlockRequest(null);
            setSelectedHelpdeskRequest(null);
          }}
        >
          Unlock Requests
        </button>

        <button
          type="button"
          className={activeSection === "history" ? "active" : ""}
          onClick={() => {
            setActiveSection("history");
            setError("");
            setSuccess("");
            setSelectedHelpdeskRequest(null);
          }}
        >
          Request History
        </button>
      </div>

      {success && (
        <div className="helpdesk-success-notification">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="helpdesk-error-notification">
          <span>!</span>
          <span>{error}</span>
        </div>
      )}

      {/* =========================
          PENDING REQUESTS
      ========================== */}
      {activeSection === "pending" && (
        <div className="helpdesk-card">
          <div className="helpdesk-card-header">
            <h2>Pending Requests</h2>
            <p>View and process HR helpdesk requests.</p>
          </div>

          {loading && (
            <div className="helpdesk-loading">Loading helpdesk requests...</div>
          )}

          {!loading && !error && pendingRequests.length === 0 && (
            <div className="helpdesk-empty-state">
              No pending helpdesk requests found.
            </div>
          )}

          {!loading && pendingRequests.length > 0 && (
            <div className="helpdesk-table-wrapper">
              <table className="helpdesk-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Subject</th>
                    <th>Requester</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.id}</td>

                      <td>{request.subject}</td>

                      <td>{request.requesterEmail}</td>

                      <td>{request.requestType}</td>

                      <td>
                        <span
                          className={`helpdesk-status ${String(
                            request.status || "",
                          ).toLowerCase()}`}
                        >
                          {request.status}
                        </span>
                      </td>

                      <td>
                        {request.createdAt
                          ? request.createdAt.replace("T", " ")
                          : "-"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="helpdesk-secondary-button"
                          onClick={() => {
                            setSelectedHelpdeskRequest(request);
                            setProcessStatus(
                              request.status === "IN_PROGRESS"
                                ? "RESOLVED"
                                : "IN_PROGRESS",
                            );
                            setProcessResponse(request.response || "");
                            setError("");
                            setSuccess("");
                          }}
                        >
                          View / Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedHelpdeskRequest && (
            <div className="helpdesk-details">
              <div className="helpdesk-details-header">
                <div>
                  <h3>Helpdesk Request Details</h3>
                  <p>Review the request and update its status.</p>
                </div>

                <span
                  className={`helpdesk-status ${String(
                    selectedHelpdeskRequest.status || "",
                  ).toLowerCase()}`}
                >
                  {selectedHelpdeskRequest.status}
                </span>
              </div>

              <div className="helpdesk-detail-grid">
                <div>
                  <span>Request ID</span>
                  <strong>{selectedHelpdeskRequest.id}</strong>
                </div>

                <div>
                  <span>Requester Email</span>
                  <strong>
                    {selectedHelpdeskRequest.requesterEmail || "-"}
                  </strong>
                </div>

                <div>
                  <span>Requester Role</span>
                  <strong>
                    {selectedHelpdeskRequest.requesterRole || "-"}
                  </strong>
                </div>

                <div>
                  <span>Target Role</span>
                  <strong>{selectedHelpdeskRequest.targetRole || "-"}</strong>
                </div>

                <div>
                  <span>Request Type</span>
                  <strong>{selectedHelpdeskRequest.requestType || "-"}</strong>
                </div>

                <div>
                  <span>Created Date</span>
                  <strong>
                    {selectedHelpdeskRequest.createdAt
                      ? selectedHelpdeskRequest.createdAt.replace("T", " ")
                      : "-"}
                  </strong>
                </div>
              </div>

              <div className="helpdesk-description">
                <span>Subject</span>
                <p>{selectedHelpdeskRequest.subject || "-"}</p>
              </div>

              <div className="helpdesk-description">
                <span>Description</span>
                <p>
                  {selectedHelpdeskRequest.description ||
                    "No description provided."}
                </p>
              </div>

              <form onSubmit={handleProcessHelpdeskRequest}>
                <div className="helpdesk-detail-grid">
                  <div>
                    <label
                      htmlFor="processStatus"
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                      }}
                    >
                      Update Status
                    </label>

                    <select
                      id="processStatus"
                      value={processStatus}
                      onChange={(event) => setProcessStatus(event.target.value)}
                      disabled={processLoading}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #dbe3ef",
                        borderRadius: "7px",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>

                <div
                  className="helpdesk-description"
                  style={{ marginTop: "20px" }}
                >
                  <label
                    htmlFor="processResponse"
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                    }}
                  >
                    Response
                  </label>

                  <textarea
                    id="processResponse"
                    value={processResponse}
                    onChange={(event) => setProcessResponse(event.target.value)}
                    placeholder="Enter your response to the requester"
                    rows="4"
                    required
                    disabled={processLoading}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      resize: "vertical",
                      padding: "10px",
                      border: "1px solid #dbe3ef",
                      borderRadius: "7px",
                    }}
                  ></textarea>
                </div>

                <div className="helpdesk-action-area">
                  <button
                    type="submit"
                    className="helpdesk-primary-button"
                    disabled={processLoading}
                  >
                    {processLoading ? "Updating..." : "Update Request"}
                  </button>

                  <button
                    type="button"
                    className="helpdesk-secondary-button"
                    disabled={processLoading}
                    onClick={() => {
                      setSelectedHelpdeskRequest(null);
                      setProcessStatus("IN_PROGRESS");
                      setProcessResponse("");
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* =========================
          UNLOCK REQUESTS
      ========================== */}
      {activeSection === "unlock" && (
        <div className="helpdesk-card">
          <div className="helpdesk-card-header">
            <h2>Account Unlock Requests</h2>
            <p>Review and approve account-unlock requests.</p>
          </div>

          {unlockLoading && (
            <div className="helpdesk-loading">
              Loading account unlock requests...
            </div>
          )}

          {!unlockLoading && unlockRequests.length === 0 && (
            <div className="helpdesk-empty-state">
              No open account unlock requests found.
            </div>
          )}

          {!unlockLoading && unlockRequests.length > 0 && (
            <div className="helpdesk-table-wrapper">
              <table className="helpdesk-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Requester</th>
                    <th>Request Type</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {unlockRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.id}</td>

                      <td>{request.requesterEmail}</td>

                      <td>{request.requestType}</td>

                      <td>
                        <span
                          className={`helpdesk-status ${String(
                            request.status || "",
                          ).toLowerCase()}`}
                        >
                          {request.status}
                        </span>
                      </td>

                      <td>
                        {request.createdAt
                          ? request.createdAt.replace("T", " ")
                          : "-"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="helpdesk-secondary-button"
                          onClick={() => {
                            setSelectedUnlockRequest(request);
                            setError("");
                            setSuccess("");
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedUnlockRequest && (
            <div className="helpdesk-details">
              <div className="helpdesk-details-header">
                <div>
                  <h3>Unlock Request Details</h3>
                  <p>Review the request before approving the account unlock.</p>
                </div>

                <span
                  className={`helpdesk-status ${String(
                    selectedUnlockRequest.status || "",
                  ).toLowerCase()}`}
                >
                  {selectedUnlockRequest.status}
                </span>
              </div>

              <div className="helpdesk-detail-grid">
                <div>
                  <span>Request ID</span>
                  <strong>{selectedUnlockRequest.id}</strong>
                </div>

                <div>
                  <span>Requester Email</span>
                  <strong>{selectedUnlockRequest.requesterEmail || "-"}</strong>
                </div>

                <div>
                  <span>Requester Role</span>
                  <strong>{selectedUnlockRequest.requesterRole || "-"}</strong>
                </div>

                <div>
                  <span>Target Role</span>
                  <strong>{selectedUnlockRequest.targetRole || "-"}</strong>
                </div>

                <div>
                  <span>Request Type</span>
                  <strong>{selectedUnlockRequest.requestType || "-"}</strong>
                </div>

                <div>
                  <span>Created Date</span>
                  <strong>
                    {selectedUnlockRequest.createdAt
                      ? selectedUnlockRequest.createdAt.replace("T", " ")
                      : "-"}
                  </strong>
                </div>
              </div>

              <div className="helpdesk-description">
                <span>Reason / Description</span>
                <p>
                  {selectedUnlockRequest.description ||
                    "No description provided."}
                </p>
              </div>

              {selectedUnlockRequest.status === "OPEN" && (
                <div className="helpdesk-action-area">
                  <button
                    type="button"
                    className="helpdesk-primary-button"
                    onClick={() =>
                      handleApproveUnlock(selectedUnlockRequest.id)
                    }
                    disabled={unlockLoading}
                  >
                    {unlockLoading ? "Approving..." : "Approve Unlock"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================
          REQUEST HISTORY
      ========================== */}
      {activeSection === "history" && (
        <div className="helpdesk-card">
          <div className="helpdesk-card-header">
            <h2>Request History</h2>
            <p>View previously processed helpdesk requests.</p>
          </div>

          {!loading && historyRequests.length === 0 && (
            <div className="helpdesk-empty-state">
              No request history found.
            </div>
          )}

          {!loading && historyRequests.length > 0 && (
            <div className="helpdesk-table-wrapper">
              <table className="helpdesk-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Subject</th>
                    <th>Requester</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created Date</th>
                  </tr>
                </thead>

                <tbody>
                  {historyRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.id}</td>

                      <td>{request.subject}</td>

                      <td>{request.requesterEmail}</td>

                      <td>{request.requestType}</td>

                      <td>
                        <span
                          className={`helpdesk-status ${String(
                            request.status || "",
                          ).toLowerCase()}`}
                        >
                          {request.status}
                        </span>
                      </td>

                      <td>
                        {request.createdAt
                          ? request.createdAt.replace("T", " ")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminHelpdesk;
