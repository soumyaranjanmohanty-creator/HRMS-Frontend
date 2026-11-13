import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/HRHelpdesk.css";

function HRHelpdesk() {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("GENERAL");
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const [responses, setResponses] = useState({});
  const [statuses, setStatuses] = useState({});

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/helpdesk/hr");

      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load HR Helpdesk requests:", err);

      setError(
        err.response?.status === 403
          ? "Access denied. Please log in with an HR account."
          : err.response?.data?.message ||
              "Unable to load helpdesk requests. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUnlockRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/unlock-requests/HR");

      setUnlockRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load account unlock requests:", err);

      setError(
        err.response?.status === 403
          ? "Access denied. Please log in with an HR account."
          : err.response?.data?.message ||
              "Unable to load account unlock requests. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/helpdesk/hr/history");

      setHistoryRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load request history:", err);

      setError(
        err.response?.status === 403
          ? "Access denied. Please log in with an HR account."
          : err.response?.data?.message ||
              "Unable to load request history. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUnlock = async (requestId) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this account unlock request?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(requestId);
      setError("");

      await api.post(`/unlock-requests/${requestId}/approve`);

      alert("Account unlocked successfully.");

      await loadUnlockRequests();
    } catch (err) {
      console.error("Failed to approve unlock request:", err);

      setError(
        err.response?.data?.message ||
          "Unable to approve the account unlock request.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleProcess = async (requestId) => {
    const responseText = responses[requestId]?.trim();

    if (!responseText) {
      alert("Please enter a response before submitting.");
      return;
    }

    const status = statuses[requestId] || "RESOLVED";

    try {
      setProcessingId(requestId);
      setError("");

      const params = new URLSearchParams();
      params.append("status", status);
      params.append("response", responseText);

      await api.post(`/helpdesk/${requestId}/process?${params.toString()}`);

      alert("Helpdesk request updated successfully.");

      setResponses((previous) => ({
        ...previous,
        [requestId]: "",
      }));

      await loadRequests();
    } catch (err) {
      console.error("Failed to process helpdesk request:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update this request. Please try again.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString();
  };

  const getStatusClass = (status) => {
    switch ((status || "").toUpperCase()) {
      case "OPEN":
        return "hr-helpdesk-status-open";

      case "IN_PROGRESS":
        return "hr-helpdesk-status-progress";

      case "RESOLVED":
        return "hr-helpdesk-status-resolved";

      case "REJECTED":
        return "hr-helpdesk-status-rejected";

      default:
        return "hr-helpdesk-status-default";
    }
  };

  return (
    <div className="hr-helpdesk-page">
      <div className="hr-helpdesk-heading">
        <div>
          <h1>HR Helpdesk</h1>
          <p>
            Review and respond to support requests submitted by managers and
            employees.
          </p>
        </div>

        <button
          type="button"
          className="hr-helpdesk-refresh"
          onClick={loadRequests}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* HR Helpdesk Tabs */}
      <div className="hr-helpdesk-tabs">
        <button
          type="button"
          className={activeTab === "GENERAL" ? "active" : ""}
          onClick={() => {
            setActiveTab("GENERAL");
            loadRequests();
          }}
        >
          General Requests
        </button>

        <button
          type="button"
          className={activeTab === "UNLOCK" ? "active" : ""}
          onClick={() => {
            setActiveTab("UNLOCK");
            loadUnlockRequests();
          }}
        >
          Account Unlock Requests
        </button>

        <button
          type="button"
          className={activeTab === "HISTORY" ? "active" : ""}
          onClick={() => {
            setActiveTab("HISTORY");
            loadHistoryRequests();
          }}
        >
          Request History
        </button>
      </div>

      {error && (
        <div className="hr-helpdesk-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="hr-helpdesk-message">
          {activeTab === "GENERAL"
            ? "Loading general requests..."
            : activeTab === "UNLOCK"
              ? "Loading account unlock requests..."
              : "Loading request history..."}
        </div>
      ) : activeTab === "GENERAL" ? (
        (() => {
          const openRequests = requests.filter((request) =>
            ["OPEN", "IN_PROGRESS"].includes(
              (request.status || "").toUpperCase(),
            ),
          );

          return openRequests.length === 0 ? (
            <div className="hr-helpdesk-empty">
              <div className="hr-helpdesk-empty-icon">📭</div>
              <h2>No Open General Requests</h2>
              <p>
                There are currently no open general requests awaiting your
                attention.
              </p>
            </div>
          ) : (
            <div className="hr-helpdesk-request-list">
              {openRequests.map((request) => {
                const status = (request.status || "").toUpperCase();

                return (
                  <article
                    className="hr-helpdesk-request-card"
                    key={request.id}
                  >
                    <div className="hr-helpdesk-request-header">
                      <div>
                        <span className="hr-helpdesk-request-id">
                          Request #{request.id}
                        </span>
                        <h2>{request.subject || "Untitled Request"}</h2>
                      </div>

                      <span
                        className={`hr-helpdesk-status ${getStatusClass(status)}`}
                      >
                        {status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="hr-helpdesk-request-meta">
                      <span>
                        <strong>Requester:</strong>{" "}
                        {request.requesterEmail || "—"}
                      </span>
                      <span>
                        <strong>Role:</strong> {request.requesterRole || "—"}
                      </span>
                      <span>
                        <strong>Created:</strong>{" "}
                        {formatDate(request.createdAt)}
                      </span>
                    </div>

                    <div className="hr-helpdesk-description">
                      <h3>Description</h3>
                      <p>{request.description || "No description provided."}</p>
                    </div>

                    {request.response && (
                      <div className="hr-helpdesk-existing-response">
                        <h3>Previous Response</h3>
                        <p>{request.response}</p>
                      </div>
                    )}

                    <div className="hr-helpdesk-action">
                      <h3>Respond to Request</h3>

                      <label htmlFor={`status-${request.id}`}>
                        Update Status
                      </label>

                      <select
                        id={`status-${request.id}`}
                        value={statuses[request.id] || "RESOLVED"}
                        onChange={(event) =>
                          setStatuses((previous) => ({
                            ...previous,
                            [request.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>

                      <label htmlFor={`response-${request.id}`}>
                        Your Response
                      </label>

                      <textarea
                        id={`response-${request.id}`}
                        rows="3"
                        placeholder="Write a response to the manager or employee..."
                        value={responses[request.id] || ""}
                        onChange={(event) =>
                          setResponses((previous) => ({
                            ...previous,
                            [request.id]: event.target.value,
                          }))
                        }
                      />

                      <button
                        type="button"
                        className="hr-helpdesk-submit"
                        disabled={processingId === request.id}
                        onClick={() => handleProcess(request.id)}
                      >
                        {processingId === request.id
                          ? "Submitting..."
                          : "Submit Response"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })()
      ) : activeTab === "UNLOCK" ? (
        unlockRequests.length === 0 ? (
          <div className="hr-helpdesk-empty">
            <div className="hr-helpdesk-empty-icon">🔓</div>
            <h2>No Account Unlock Requests</h2>
            <p>There are currently no pending account unlock requests.</p>
          </div>
        ) : (
          <div className="hr-helpdesk-request-list">
            {unlockRequests
              .filter(
                (request) => (request.status || "").toUpperCase() === "OPEN",
              )
              .map((request) => (
                <article className="hr-helpdesk-request-card" key={request.id}>
                  <div className="hr-helpdesk-request-header">
                    <div>
                      <span className="hr-helpdesk-request-id">
                        Request #{request.id}
                      </span>
                      <h2>{request.subject || "Account Unlock Request"}</h2>
                    </div>

                    <span
                      className={`hr-helpdesk-status ${getStatusClass(request.status)}`}
                    >
                      {(request.status || "OPEN").replace("_", " ")}
                    </span>
                  </div>

                  <div className="hr-helpdesk-request-meta">
                    <span>
                      <strong>Requester:</strong>{" "}
                      {request.requesterEmail || "—"}
                    </span>
                    <span>
                      <strong>Role:</strong> {request.requesterRole || "—"}
                    </span>
                    <span>
                      <strong>Created:</strong> {formatDate(request.createdAt)}
                    </span>
                  </div>

                  <div className="hr-helpdesk-description">
                    <h3>Description</h3>
                    <p>{request.description || "No description provided."}</p>
                  </div>

                  <div className="hr-helpdesk-unlock-actions">
                    <button
                      type="button"
                      className="hr-helpdesk-approve"
                      disabled={processingId === request.id}
                      onClick={() => handleApproveUnlock(request.id)}
                    >
                      {processingId === request.id
                        ? "Approving..."
                        : "Approve & Unlock Account"}
                    </button>
                  </div>
                </article>
              ))}
          </div>
        )
      ) : historyRequests.length === 0 ? (
        <div className="hr-helpdesk-empty">
          <div className="hr-helpdesk-empty-icon">📋</div>
          <h2>No Request History</h2>
          <p>There are no processed requests in your history.</p>
        </div>
      ) : (
        <div className="hr-helpdesk-history">
          <h2>Request History</h2>
          <p>View previously processed helpdesk requests.</p>

          <div className="hr-helpdesk-history-table-wrapper">
            <table className="hr-helpdesk-history-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Subject</th>
                  <th>Requester</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>

              <tbody>
                {historyRequests.map((request) => {
                  const status = (request.status || "").toUpperCase();
                  const isUnlock =
                    (request.requestType || "").toUpperCase() ===
                    "ACCOUNT_UNLOCK";

                  return (
                    <tr key={`${request.requestType}-${request.id}`}>
                      <td>{request.id}</td>
                      <td>
                        {isUnlock
                          ? "Account Unlock Request"
                          : request.subject || "General Helpdesk Request"}
                      </td>
                      <td>{request.requesterEmail || "—"}</td>
                      <td>{request.requesterRole || "—"}</td>
                      <td>{isUnlock ? "ACCOUNT_UNLOCK" : "GENERAL"}</td>
                      <td>
                        <span
                          className={`hr-helpdesk-status ${getStatusClass(status)}`}
                        >
                          {status.replace("_", " ")}
                        </span>
                      </td>
                      <td>{formatDate(request.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRHelpdesk;
