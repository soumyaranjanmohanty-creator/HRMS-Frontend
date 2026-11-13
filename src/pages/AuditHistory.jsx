import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/AuditHistory.css";

function AuditHistory() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/audit-logs");

      setAuditLogs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load audit history:", err);
      setError(
        err.response?.status === 403
          ? "You are not authorized to view audit history."
          : "Failed to load audit history. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime()) ? dateValue : date.toLocaleString();
  }

  const filteredLogs = auditLogs.filter((log) => {
    const searchableValues = [
      log.id,
      log.action,
      log.targetUserId,
      log.targetUserEmail,
      log.changedBy,
      log.previousValue,
      log.newValue,
      log.leaveId,
      log.helpdeskRequestId,
      log.rejectionReason,
    ];

    return searchableValues.some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / recordsPerPage);

  const startIndex = (currentPage - 1) * recordsPerPage;

  const currentLogs = filteredLogs.slice(
    startIndex,
    startIndex + recordsPerPage,
  );

  return (
    <div className="audit-history-page">
      <div className="audit-history-header">
        <div>
          <p className="audit-history-eyebrow">SECURITY & MONITORING</p>

          <h1>Audit History</h1>

          <p className="audit-history-subtitle">
            Review recorded administrative activities and changes across your
            workforce system.
          </p>
        </div>

        <button
          type="button"
          className="audit-refresh-button"
          onClick={loadAuditLogs}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      <div className="audit-summary-grid">
        <div className="audit-summary-card">
          <span>Total Audit Records</span>
          <strong>{auditLogs.length}</strong>
        </div>

        <div className="audit-summary-card">
          <span>Matching Records</span>
          <strong>{filteredLogs.length}</strong>
        </div>
      </div>

      <div className="audit-history-panel">
        <div className="audit-panel-header">
          <div>
            <h2>Activity Records</h2>
            <p>Search and review recorded system changes.</p>
          </div>

          <input
            type="search"
            className="audit-search-input"
            placeholder="Search audit records..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search audit records"
          />
        </div>

        {error && (
          <div className="audit-error">
            <p>{error}</p>

            <button type="button" onClick={loadAuditLogs}>
              Try Again
            </button>
          </div>
        )}

        {!error && loading && (
          <div className="audit-message">Loading audit records...</div>
        )}

        {!error && !loading && filteredLogs.length === 0 && (
          <div className="audit-message">
            <h3>No Audit Records Found</h3>
            <p>
              {auditLogs.length === 0
                ? "No audit records are currently available."
                : "No records match your search."}
            </p>
          </div>
        )}

        {!error && !loading && filteredLogs.length > 0 && (
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Action</th>
                  <th>Changed By</th>
                  <th>Target User</th>
                  <th>Previous Value</th>
                  <th>New Value</th>
                  <th>Leave ID</th>
                  <th>Helpdesk ID</th>
                  <th>Date & Time</th>
                </tr>
              </thead>

              <tbody>
                {currentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.id ?? "-"}</td>

                    <td>
                      <span className="audit-action-badge">
                        {log.action || "-"}
                      </span>
                    </td>

                    <td>{log.changedBy || "-"}</td>

                    <td>
                      <div className="audit-target-user">
                        <strong>{log.targetUserEmail || "-"}</strong>

                        {log.targetUserId != null && (
                          <span>ID: {log.targetUserId}</span>
                        )}
                      </div>
                    </td>

                    <td className="audit-value-cell">
                      {log.previousValue || "-"}
                    </td>

                    <td className="audit-value-cell">{log.newValue || "-"}</td>

                    <td>{log.leaveId ?? "-"}</td>

                    <td>{log.helpdeskRequestId ?? "-"}</td>

                    <td>{formatDate(log.changedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!error && !loading && filteredLogs.length > 0 && (
          <div className="audit-table-footer">
            <span>
              Showing {filteredLogs.length === 0 ? 0 : startIndex + 1}
              {" - "}
              {Math.min(startIndex + recordsPerPage, filteredLogs.length)}
              {" of "}
              {filteredLogs.length} records
            </span>

            <div className="audit-pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => page - 1)}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {Math.max(totalPages, 1)}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditHistory;
