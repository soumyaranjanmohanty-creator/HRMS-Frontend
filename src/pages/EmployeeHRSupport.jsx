import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import "../styles/EmployeeHRSupport.css";

const STATUS_OPTIONS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"];

function EmployeeHRSupport() {
  const [activeTab, setActiveTab] = useState("create");

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/helpdesk/my");

      const data = response.data;

      let requestList = [];

      if (Array.isArray(data)) {
        requestList = data;
      } else if (Array.isArray(data?.content)) {
        requestList = data.content;
      } else if (Array.isArray(data?.requests)) {
        requestList = data.requests;
      } else if (Array.isArray(data?.data)) {
        requestList = data.data;
      } else {
        throw new Error(
          "The server returned an unexpected request-history format.",
        );
      }

      setRequests(requestList);
    } catch (err) {
      console.error("Failed to load employee helpdesk requests:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Unable to load your request history.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();

    if (!trimmedSubject || !trimmedDescription) {
      setError("Please enter both a subject and a description.");
      return;
    }

    if (trimmedSubject.length < 3) {
      setError("The subject must contain at least 3 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/helpdesk", {
        subject: trimmedSubject,
        description: trimmedDescription,
      });

      setSuccess(
        response.data?.message ||
          "Your request has been submitted successfully.",
      );

      setSubject("");
      setDescription("");

      await loadRequests();

      setActiveTab("history");
    } catch (err) {
      console.error("Failed to submit employee helpdesk request:", err);

      setError(
        err.response?.data?.message ||
          (typeof err.response?.data === "string" ? err.response.data : null) ||
          "Unable to submit your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const status = String(request.status || "").toUpperCase();

    const matchesStatus = statusFilter === "ALL" || status === statusFilter;

    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      [
        request.id,
        request.subject,
        request.description,
        request.status,
        request.response,
        request.createdAt,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(searchText));

    return matchesStatus && matchesSearch;
  });

  const getStatusClass = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "OPEN":
        return "ehs-status-open";

      case "IN_PROGRESS":
        return "ehs-status-progress";

      case "RESOLVED":
        return "ehs-status-resolved";

      case "REJECTED":
        return "ehs-status-rejected";

      default:
        return "ehs-status-default";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return String(status)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCount = (status) => {
    if (status === "ALL") {
      return requests.length;
    }

    return requests.filter(
      (request) => String(request.status || "").toUpperCase() === status,
    ).length;
  };

  return (
    <div className="employee-hr-support">
      {/* Header */}
      <div className="ehs-header">
        <div className="ehs-header-icon">🎧</div>

        <div className="ehs-header-content">
          <span className="ehs-eyebrow">EMPLOYEE SERVICES</span>
          <h2>HR Support</h2>

          <p>Submit a request to HR and track its progress.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="ehs-summary-grid">
        <div className="ehs-summary-card">
          <span className="ehs-summary-icon ehs-summary-blue">▤</span>

          <div>
            <span>Total Requests</span>
            <strong>{requests.length}</strong>
          </div>
        </div>

        <div className="ehs-summary-card">
          <span className="ehs-summary-icon ehs-summary-orange">◷</span>

          <div>
            <span>Pending</span>

            <strong>
              {
                requests.filter((request) =>
                  ["OPEN", "IN_PROGRESS"].includes(
                    String(request.status || "").toUpperCase(),
                  ),
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="ehs-summary-card">
          <span className="ehs-summary-icon ehs-summary-green">✓</span>

          <div>
            <span>Resolved</span>

            <strong>
              {
                requests.filter((request) =>
                  ["RESOLVED", "REJECTED"].includes(
                    String(request.status || "").toUpperCase(),
                  ),
                ).length
              }
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ehs-tabs">
        <button
          type="button"
          className={activeTab === "create" ? "active" : ""}
          onClick={() => {
            setActiveTab("create");
            setError("");
            setSuccess("");
          }}
        >
          <span>＋</span>
          Create Request
        </button>

        <button
          type="button"
          className={activeTab === "history" ? "active" : ""}
          onClick={() => {
            setActiveTab("history");
            setError("");
            setSuccess("");
            loadRequests();
          }}
        >
          <span>▤</span>
          My Requests
          <span className="ehs-tab-count">{requests.length}</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="ehs-message ehs-error-message" role="alert">
          <span>!</span>
          <p>{typeof error === "string" ? error : "Request failed."}</p>

          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="ehs-message ehs-success-message" role="status">
          <span>✓</span>
          <p>{success}</p>

          <button type="button" onClick={() => setSuccess("")}>
            ×
          </button>
        </div>
      )}

      {/* Create Request Tab */}
      {activeTab === "create" && (
        <section className="ehs-panel">
          <div className="ehs-panel-heading">
            <div>
              <h3>Create a Support Request</h3>

              <p>Describe your concern so HR can review it.</p>
            </div>

            <span className="ehs-panel-heading-icon">✎</span>
          </div>

          <form className="ehs-form" onSubmit={handleSubmit}>
            <div className="ehs-form-group">
              <label htmlFor="ehs-subject">
                Request Subject <span>*</span>
              </label>

              <input
                id="ehs-subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Example: Attendance correction request"
                maxLength={150}
                required
              />

              <small>Use a short, clear title for your request.</small>
            </div>

            <div className="ehs-form-group">
              <label htmlFor="ehs-description">
                Request Description <span>*</span>
              </label>

              <textarea
                id="ehs-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explain your concern and include relevant details..."
                rows={6}
                maxLength={3000}
                required
              />

              <div className="ehs-character-count">
                {description.length}/3000 characters
              </div>
            </div>

            <div className="ehs-routing-note">
              <span>ⓘ</span>

              <div>
                <strong>Request routing</strong>

                <p>
                  Employee support requests are routed to HR 
                </p>
              </div>
            </div>

            <div className="ehs-form-actions">
              <button
                type="button"
                className="ehs-secondary-button"
                onClick={() => {
                  setSubject("");
                  setDescription("");
                  setError("");
                  setSuccess("");
                }}
                disabled={submitting}
              >
                Clear Form
              </button>

              <button
                type="submit"
                className="ehs-primary-button"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="ehs-button-spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Request
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* My Requests Tab */}
      {activeTab === "history" && (
        <section className="ehs-panel">
          <div className="ehs-panel-heading ehs-history-heading">
            <div>
              <h3>My Request History</h3>

              <p>Track your requests and review HR responses.</p>
            </div>

            <button
              type="button"
              className="ehs-refresh-button"
              onClick={loadRequests}
              disabled={loading}
              title="Refresh request history"
            >
              ↻
            </button>
          </div>

          {/* Status filters */}
          <div className="ehs-status-filters">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                className={statusFilter === status ? "active" : ""}
                onClick={() => setStatusFilter(status)}
              >
                {status === "ALL" ? "All" : formatStatus(status)}

                <span>{getCount(status)}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="ehs-search-wrapper">
            <span>⌕</span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subject, request ID, or status..."
              aria-label="Search support requests"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Request list */}
          <div className="ehs-request-list">
            {loading ? (
              <div className="ehs-state-message">
                <span className="ehs-loading-spinner" />
                <p>Loading your requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="ehs-state-message">
                <span className="ehs-empty-icon">▤</span>

                <h4>No requests found</h4>

                <p>
                  {requests.length === 0
                    ? "You have not submitted any support requests yet."
                    : "Try another status filter or search term."}
                </p>

                {requests.length === 0 && (
                  <button
                    type="button"
                    className="ehs-primary-button"
                    onClick={() => setActiveTab("create")}
                  >
                    Create Your First Request
                  </button>
                )}
              </div>
            ) : (
              filteredRequests.map((request) => (
                <article key={request.id} className="ehs-request-card">
                  <div className="ehs-request-card-top">
                    <div className="ehs-request-id">
                      <span>REQUEST ID</span>
                      <strong>#{request.id}</strong>
                    </div>

                    <span
                      className={`ehs-status-badge ${getStatusClass(
                        request.status,
                      )}`}
                    >
                      {formatStatus(request.status)}
                    </span>
                  </div>

                  <h4>{request.subject || "Support Request"}</h4>

                  <p className="ehs-request-description">
                    {request.description || "No description provided."}
                  </p>

                  <div className="ehs-request-meta">
                    <span>◷ {formatDate(request.createdAt)}</span>

                    {request.updatedAt &&
                      request.updatedAt !== request.createdAt && (
                        <span>Updated: {formatDate(request.updatedAt)}</span>
                      )}
                  </div>

                  {request.response && (
                    <div className="ehs-response-preview">
                      <strong>HR Response</strong>

                      <p>{request.response}</p>
                    </div>
                  )}

                  <div className="ehs-request-card-footer">
                    <button
                      type="button"
                      className="ehs-view-details-button"
                      onClick={() => setSelectedRequest(request)}
                    >
                      View Details
                      <span>→</span>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {!loading && filteredRequests.length > 0 && (
            <div className="ehs-results-footer">
              Showing {filteredRequests.length} of {requests.length} requests
            </div>
          )}
        </section>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div
          className="ehs-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRequest(null);
            }
          }}
        >
          <section
            className="ehs-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ehs-details-title"
          >
            <div className="ehs-modal-header">
              <div>
                <span>REQUEST DETAILS</span>

                <h3 id="ehs-details-title">Request #{selectedRequest.id}</h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close request details"
              >
                ×
              </button>
            </div>

            <div className="ehs-modal-body">
              <div className="ehs-detail-row">
                <span>Subject</span>
                <strong>{selectedRequest.subject || "—"}</strong>
              </div>

              <div className="ehs-detail-row">
                <span>Status</span>

                <strong>
                  <span
                    className={`ehs-status-badge ${getStatusClass(
                      selectedRequest.status,
                    )}`}
                  >
                    {formatStatus(selectedRequest.status)}
                  </span>
                </strong>
              </div>

              <div className="ehs-detail-row">
                <span>Submitted On</span>

                <strong>{formatDate(selectedRequest.createdAt)}</strong>
              </div>

              <div className="ehs-detail-description">
                <span>Description</span>

                <p>
                  {selectedRequest.description || "No description provided."}
                </p>
              </div>

              <div className="ehs-detail-description">
                <span>HR Response</span>

                <p>
                  {selectedRequest.response ||
                    "HR has not provided a response yet."}
                </p>
              </div>

              {selectedRequest.resolvedAt && (
                <div className="ehs-detail-row">
                  <span>Resolved On</span>

                  <strong>{formatDate(selectedRequest.resolvedAt)}</strong>
                </div>
              )}
            </div>

            <div className="ehs-modal-footer">
              <button
                type="button"
                className="ehs-primary-button"
                onClick={() => setSelectedRequest(null)}
              >
                Close Details
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default EmployeeHRSupport;
