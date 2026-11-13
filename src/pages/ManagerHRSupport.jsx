import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/ManagerHRSupport.css";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"];

const ManagerHRSupport = () => {
  const [activeTab, setActiveTab] = useState("create");

  // Create request
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // My requests
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Request details
  const [selectedRequest, setSelectedRequest] = useState(null);

  const getErrorMessage = (err) => {
    const data = err?.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    return err?.message || "Something went wrong. Please try again.";
  };

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/helpdesk/my");

      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setRequests([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleCreateRequest = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();

    if (!cleanSubject) {
      setError("Please enter a request subject.");
      return;
    }

    if (!cleanDescription) {
      setError("Please describe your issue or request.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/helpdesk", {
        subject: cleanSubject,
        description: cleanDescription,
      });

      const message =
        typeof response.data === "string"
          ? response.data
          : "Your request has been submitted successfully.";

      setSuccess(message);
      setSubject("");
      setDescription("");

      // Refresh the request list after successful submission.
      await loadRequests();

      // Display the newly submitted request list.
      setActiveTab("requests");
      setFilterStatus("ALL");
      setSearchTerm("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setSubject("");
    setDescription("");
    setError("");
    setSuccess("");
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      OPEN: "Open",
      IN_PROGRESS: "In Progress",
      RESOLVED: "Resolved",
      REJECTED: "Rejected",
    };

    return labels[String(status || "").toUpperCase()] || status || "Unknown";
  };

  const getStatusClass = (status) => {
    return String(status || "")
      .toLowerCase()
      .replaceAll("_", "-");
  };

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const status = String(request.status || "").toUpperCase();

      const matchesStatus = filterStatus === "ALL" || status === filterStatus;

      const matchesSearch =
        !query ||
        String(request.id ?? "").includes(query) ||
        String(request.subject || "")
          .toLowerCase()
          .includes(query) ||
        String(request.description || "")
          .toLowerCase()
          .includes(query) ||
        String(request.response || "")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [requests, filterStatus, searchTerm]);

  const counts = useMemo(() => {
    const result = {
      ALL: requests.length,
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      REJECTED: 0,
    };

    requests.forEach((request) => {
      const status = String(request.status || "").toUpperCase();

      if (Object.prototype.hasOwnProperty.call(result, status)) {
        result[status] += 1;
      }
    });

    return result;
  }, [requests]);

  const openRequestsTab = async () => {
    setActiveTab("requests");
    setError("");
    setSuccess("");
    await loadRequests();
  };

  return (
    <main className="mhs-page">
      {/* Page Header */}
      <header className="mhs-header">
        <div className="mhs-header-content">
          <span className="mhs-eyebrow">MANAGER WORKSPACE</span>

          <h1>HR Support</h1>

          <p>
            Contact HR, track your requests, and view responses from your
            support team.
          </p>
        </div>

        <div className="mhs-header-icon" aria-hidden="true">
          <span>?</span>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="mhs-alert mhs-alert-error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mhs-alert mhs-alert-success" role="status">
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            ×
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section className="mhs-summary">
        <article className="mhs-summary-card">
          <div className="mhs-summary-icon mhs-icon-blue">📋</div>

          <div>
            <span>Total Requests</span>
            <strong>{loading ? "…" : counts.ALL}</strong>
          </div>
        </article>

        <article className="mhs-summary-card">
          <div className="mhs-summary-icon mhs-icon-orange">◷</div>

          <div>
            <span>Open Requests</span>
            <strong>{loading ? "…" : counts.OPEN + counts.IN_PROGRESS}</strong>
          </div>
        </article>

        <article className="mhs-summary-card">
          <div className="mhs-summary-icon mhs-icon-green">✓</div>

          <div>
            <span>Completed Requests</span>
            <strong>{loading ? "…" : counts.RESOLVED + counts.REJECTED}</strong>
          </div>
        </article>
      </section>

      {/* Two Tabs */}
      <nav className="mhs-tabs" aria-label="HR Support sections">
        <button
          type="button"
          className={activeTab === "create" ? "active" : ""}
          onClick={() => {
            setActiveTab("create");
            setError("");
            setSuccess("");
          }}
        >
          <span aria-hidden="true">＋</span>
          Create Request
        </button>

        <button
          type="button"
          className={activeTab === "requests" ? "active" : ""}
          onClick={openRequestsTab}
        >
          <span aria-hidden="true">▤</span>
          My Requests
          <span className="mhs-tab-count">{requests.length}</span>
        </button>
      </nav>

      {/* TAB 1: CREATE REQUEST */}
      {activeTab === "create" && (
        <section className="mhs-panel">
          <div className="mhs-panel-heading">
            <div>
              <h2>Create Support Request</h2>

              <p>
                Submit a question, workplace concern, or HR-related request.
              </p>
            </div>

            <span className="mhs-section-symbol" aria-hidden="true">
              ✎
            </span>
          </div>

          <div className="mhs-information">
            <span className="mhs-information-icon" aria-hidden="true">
              ℹ
            </span>

            <p>
              Your request will be routed according to your reporting hierarchy.
            </p>
          </div>

          <form className="mhs-form" onSubmit={handleCreateRequest}>
            <div className="mhs-field">
              <label htmlFor="mhs-subject">
                Subject <span>*</span>
              </label>

              <input
                id="mhs-subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="e.g. Attendance correction request"
                maxLength={150}
                required
              />

              <small>Briefly describe the purpose of your request.</small>
            </div>

            <div className="mhs-field">
              <label htmlFor="mhs-description">
                Description <span>*</span>
              </label>

              <textarea
                id="mhs-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explain your issue or request in detail..."
                rows={7}
                maxLength={3000}
                required
              />

              <div className="mhs-character-count">
                {description.length}/3000 characters
              </div>
            </div>

            <div className="mhs-form-footer">
              <button
                type="button"
                className="mhs-button mhs-button-clear"
                onClick={handleClearForm}
                disabled={submitting}
              >
                Clear Form
              </button>

              <button
                type="submit"
                className="mhs-button mhs-button-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="mhs-spinner" aria-hidden="true" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">➤</span>
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TAB 2: MY REQUESTS */}
      {activeTab === "requests" && (
        <section className="mhs-panel">
          <div className="mhs-panel-heading mhs-requests-heading">
            <div>
              <h2>My Requests</h2>

              <p>Track your submitted requests, statuses, and HR responses.</p>
            </div>

            <button
              type="button"
              className="mhs-button mhs-button-refresh"
              onClick={loadRequests}
              disabled={loading}
            >
              <span aria-hidden="true">↻</span>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Status Filters */}
          <div className="mhs-status-filters">
            <button
              type="button"
              className={filterStatus === "ALL" ? "selected" : ""}
              onClick={() => setFilterStatus("ALL")}
            >
              All
              <span>{counts.ALL}</span>
            </button>

            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                className={filterStatus === status ? "selected" : ""}
                onClick={() => setFilterStatus(status)}
              >
                {getStatusLabel(status)}
                <span>{counts[status]}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mhs-toolbar">
            <div className="mhs-search">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by request ID, subject, description, or response..."
                aria-label="Search support requests"
              />
            </div>

            <span className="mhs-results-count">
              {filteredRequests.length} request(s)
            </span>
          </div>

          {loading ? (
            <div className="mhs-loading">
              <span className="mhs-spinner mhs-spinner-blue" />
              <p>Loading your requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="mhs-empty">
              <div className="mhs-empty-icon" aria-hidden="true">
                📭
              </div>

              <h3>
                {requests.length === 0
                  ? "No requests yet"
                  : "No matching requests"}
              </h3>

              <p>
                {requests.length === 0
                  ? "Create a support request and it will appear here."
                  : "Try another status filter or search term."}
              </p>

              {requests.length === 0 && (
                <button
                  type="button"
                  className="mhs-button mhs-button-primary"
                  onClick={() => {
                    setActiveTab("create");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Create Your First Request
                </button>
              )}
            </div>
          ) : (
            <div className="mhs-table-wrapper">
              <table className="mhs-table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Submitted</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                    <th>HR Response</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="mhs-request-cell">
                          <strong>
                            {request.subject || "Untitled Request"}
                          </strong>

                          <small>Request #{request.id}</small>
                        </div>
                      </td>

                      <td>{formatDate(request.createdAt)}</td>

                      <td>{formatDate(request.updatedAt)}</td>

                      <td>
                        <span
                          className={`mhs-status-badge ${getStatusClass(
                            request.status,
                          )}`}
                        >
                          <span className="mhs-status-dot" />
                          {getStatusLabel(request.status)}
                        </span>
                      </td>

                      <td>
                        <div className="mhs-response-preview">
                          {request.response
                            ? request.response.length > 55
                              ? `${request.response.slice(0, 55)}...`
                              : request.response
                            : "Awaiting response"}
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="mhs-view-button"
                          onClick={() => setSelectedRequest(request)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* REQUEST DETAILS MODAL */}
      {selectedRequest && (
        <div
          className="mhs-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRequest(null);
            }
          }}
        >
          <section
            className="mhs-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mhs-modal-title"
          >
            <header className="mhs-modal-header">
              <div>
                <span className="mhs-eyebrow">HR SUPPORT</span>

                <h2 id="mhs-modal-title">Request Details</h2>

                <p>Request #{selectedRequest.id}</p>
              </div>

              <button
                type="button"
                className="mhs-modal-close"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close request details"
              >
                ×
              </button>
            </header>

            <div className="mhs-modal-body">
              <div className="mhs-modal-title-row">
                <h3>{selectedRequest.subject || "Untitled Request"}</h3>

                <span
                  className={`mhs-status-badge ${getStatusClass(
                    selectedRequest.status,
                  )}`}
                >
                  <span className="mhs-status-dot" />
                  {getStatusLabel(selectedRequest.status)}
                </span>
              </div>

              <div className="mhs-detail-grid">
                <div className="mhs-detail-item">
                  <span>Submitted On</span>
                  <strong>{formatDate(selectedRequest.createdAt)}</strong>
                </div>

                <div className="mhs-detail-item">
                  <span>Last Updated</span>
                  <strong>{formatDate(selectedRequest.updatedAt)}</strong>
                </div>

                <div className="mhs-detail-item">
                  <span>Resolved On</span>
                  <strong>{formatDate(selectedRequest.resolvedAt)}</strong>
                </div>
              </div>

              <div className="mhs-detail-section">
                <h4>Request Description</h4>

                <p className="mhs-detail-text">
                  {selectedRequest.description || "No description provided."}
                </p>
              </div>

              <div className="mhs-detail-section">
                <h4>HR Response</h4>

                <div
                  className={
                    selectedRequest.response
                      ? "mhs-response-box"
                      : "mhs-response-box mhs-response-pending"
                  }
                >
                  {selectedRequest.response ||
                    "HR has not provided a response yet. Check back later."}
                </div>
              </div>
            </div>

            <footer className="mhs-modal-footer">
              <button
                type="button"
                className="mhs-button mhs-button-primary"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
};

export default ManagerHRSupport;
