import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/ManagerNotifications.css";

function ManagerNotifications() {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingReadId, setMarkingReadId] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadNotifications = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccessMessage("");

      const response = await api.get("/notifications");

      const data = Array.isArray(response.data) ? response.data : [];

      setNotifications(
        [...data].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        ),
      );
    } catch (err) {
      console.error("Failed to load manager notifications:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load notifications. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const intervalId = window.setInterval(() => {
      loadNotifications(true);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => item.readStatus === false),
    [notifications],
  );

  const readNotifications = useMemo(
    () => notifications.filter((item) => item.readStatus === true),
    [notifications],
  );

  const displayedNotifications = useMemo(() => {
    let result = notifications;

    if (activeTab === "unread") {
      result = unreadNotifications;
    } else if (activeTab === "read") {
      result = readNotifications;
    }

    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return result;
    }

    return result.filter((item) => {
      if (!item.createdAt) {
        return false;
      }

      const date = new Date(item.createdAt);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      const searchableDates = [
        date.toLocaleDateString("en-IN"),
        date.toLocaleDateString("en-GB"),
        date.toISOString().slice(0, 10),
        date.toLocaleString("en-IN"),
        date.toLocaleString("en-GB"),
      ];

      return searchableDates.some((dateValue) =>
        dateValue.toLowerCase().includes(query),
      );
    });
  }, [
    notifications,
    unreadNotifications,
    readNotifications,
    activeTab,
    searchTerm,
  ]);

  const formatDate = (value) => {
    if (!value) {
      return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategory = (type) => {
    const categories = {
      NEW_HELPDESK_REQUEST: "Helpdesk Request",
      HELPDESK_STATUS_CHANGED: "Helpdesk Update",
      HELPDESK_RESOLVED: "Helpdesk Resolved",
      HELPDESK_REJECTED: "Helpdesk Rejected",
      ACCOUNT_UNLOCK_REQUEST: "Account Unlock Request",
    };

    return categories[type] || type?.replaceAll("_", " ") || "Notification";
  };

  const getCategoryClass = (type) => {
    const normalizedType = (type || "").toLowerCase();

    if (normalizedType.includes("rejected")) {
      return "rejected";
    }

    if (normalizedType.includes("resolved")) {
      return "resolved";
    }

    if (normalizedType.includes("unlock")) {
      return "unlock";
    }

    if (normalizedType.includes("helpdesk")) {
      return "helpdesk";
    }

    return "general";
  };

  const handleMarkAsRead = async (notification) => {
    if (notification.readStatus || markingReadId !== null) {
      return;
    }

    try {
      setMarkingReadId(notification.id);
      setError("");
      setSuccessMessage("");

      /*
       * IMPORTANT:
       * The latest uploaded backend ZIP does not contain this PUT endpoint.
       * This action requires the backend endpoint to be implemented first.
       */
      await api.put(`/notifications/${notification.id}/read`);

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id ? { ...item, readStatus: true } : item,
        ),
      );

      setSelectedNotification((previous) =>
        previous?.id === notification.id
          ? { ...previous, readStatus: true }
          : previous,
      );

      setSuccessMessage("Notification marked as read.");
    } catch (err) {
      console.error("Failed to mark notification as read:", err);

      setError(
        err.response?.data?.message ||
          "Could not mark this notification as read. The backend endpoint may be unavailable.",
      );
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleOpenNotification = (notification) => {
    setSelectedNotification(notification);
    setSuccessMessage("");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedNotification(null);
    setSearchTerm("");
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="manager-notifications-page">
      {/* Page Header */}
      <header className="mn-header">
        <div className="mn-header-content">
          <span className="mn-eyebrow">MANAGER PORTAL</span>

          <h1>Notifications</h1>

          <p>
            Stay informed about your requests and important workforce updates.
          </p>
        </div>

        <button
          type="button"
          className="mn-refresh-button"
          onClick={() => loadNotifications(true)}
          disabled={loading || refreshing}
        >
          <span className={refreshing ? "mn-refreshing-icon" : ""}>↻</span>

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* Summary Cards */}
      <section className="mn-summary-grid">
        <article className="mn-summary-card">
          <div className="mn-summary-icon mn-icon-total">▤</div>

          <div>
            <span>Total Notifications</span>
            <strong>{notifications.length}</strong>
          </div>
        </article>

        <article className="mn-summary-card">
          <div className="mn-summary-icon mn-icon-unread">●</div>

          <div>
            <span>Unread Notifications</span>
            <strong>{unreadNotifications.length}</strong>
          </div>
        </article>

        <article className="mn-summary-card">
          <div className="mn-summary-icon mn-icon-read">✓</div>

          <div>
            <span>Read Notifications</span>
            <strong>{readNotifications.length}</strong>
          </div>
        </article>
      </section>

      {/* Notification Tabs */}
      <section className="mn-notification-panel">
        <div className="mn-tabs" role="tablist" aria-label="Notification views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`mn-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => handleTabChange("all")}
          >
            All Notifications
            <span className="mn-tab-count">{notifications.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "unread"}
            className={`mn-tab ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => handleTabChange("unread")}
          >
            Unread
            <span className="mn-tab-count">{unreadNotifications.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "read"}
            className={`mn-tab ${activeTab === "read" ? "active" : ""}`}
            onClick={() => handleTabChange("read")}
          >
            Read
            <span className="mn-tab-count">{readNotifications.length}</span>
          </button>
        </div>

        {/* List Header and Search */}
        <div className="mn-list-toolbar">
          <div>
            <h2>
              {activeTab === "all" && "All Notifications"}
              {activeTab === "unread" && "Unread Notifications"}
              {activeTab === "read" && "Read Notifications"}
            </h2>

            <p>
              {displayedNotifications.length} notification
              {displayedNotifications.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="mn-search-wrapper mn-date-search-wrapper">
            <span aria-hidden="true">📅</span>

            <input
              type="date"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Filter notifications by date"
              title="Select a date to filter notifications"
            />

            {searchTerm && (
              <button
                type="button"
                className="mn-clear-date-button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear selected date"
                title="Clear date filter"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mn-alert mn-alert-error" role="alert">
            <span>{error}</span>

            <button type="button" onClick={() => loadNotifications(true)}>
              Retry
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mn-alert mn-alert-success" role="status">
            {successMessage}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mn-state">
            <div className="mn-loader" />
            <p>Loading notifications...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && displayedNotifications.length === 0 && (
          <div className="mn-state">
            <div className="mn-empty-icon">
              {activeTab === "unread" ? "✓" : "♧"}
            </div>

            <h3>
              {activeTab === "unread"
                ? "You're all caught up"
                : searchTerm
                  ? "No matching notifications"
                  : "No notifications yet"}
            </h3>

            <p>
              {searchTerm
                ? "Try another search term."
                : activeTab === "unread"
                  ? "You have no unread notifications."
                  : "New notifications will appear here when they arrive."}
            </p>
          </div>
        )}

        {/* Notification Cards */}
        {!loading && !error && displayedNotifications.length > 0 && (
          <div className="mn-notification-list">
            {displayedNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`mn-notification-card ${
                  notification.readStatus ? "is-read" : "is-unread"
                }`}
              >
                <div
                  className={`mn-notification-type-icon ${getCategoryClass(
                    notification.notificationType,
                  )}`}
                  aria-hidden="true"
                >
                  {notification.readStatus ? "✓" : "●"}
                </div>

                <div className="mn-notification-body">
                  <div className="mn-notification-topline">
                    <span
                      className={`mn-category-badge ${getCategoryClass(
                        notification.notificationType,
                      )}`}
                    >
                      {getCategory(notification.notificationType)}
                    </span>

                    <span
                      className={`mn-read-badge ${
                        notification.readStatus ? "read" : "unread"
                      }`}
                    >
                      {notification.readStatus ? "Read" : "Unread"}
                    </span>
                  </div>

                  <p className="mn-notification-message">
                    {notification.message || "No message provided."}
                  </p>

                  <div className="mn-notification-meta">
                    <span>◷ {formatDate(notification.createdAt)}</span>

                    {notification.relatedRequestId != null && (
                      <button
                        type="button"
                        className="mn-request-id-button"
                        onClick={() => handleOpenNotification(notification)}
                        title="View notification details"
                      >
                        Request ID: #{notification.relatedRequestId}
                      </button>
                    )}
                  </div>

                  <div className="mn-notification-actions">
                    <button
                      type="button"
                      className="mn-view-button"
                      onClick={() => handleOpenNotification(notification)}
                    >
                      View Details
                    </button>

                    {!notification.readStatus && (
                      <button
                        type="button"
                        className="mn-mark-read-button"
                        onClick={() => handleMarkAsRead(notification)}
                        disabled={markingReadId !== null}
                      >
                        {markingReadId === notification.id
                          ? "Updating..."
                          : "Mark as Read"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Notification Details Dialog */}
      {selectedNotification && (
        <div
          className="mn-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedNotification(null);
            }
          }}
        >
          <section
            className="mn-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mn-details-title"
          >
            <header className="mn-modal-header">
              <div>
                <span className="mn-eyebrow">NOTIFICATION DETAILS</span>
                <h2 id="mn-details-title">Notification Information</h2>
              </div>

              <button
                type="button"
                className="mn-close-button"
                onClick={() => setSelectedNotification(null)}
                aria-label="Close notification details"
              >
                ×
              </button>
            </header>

            <div className="mn-details-grid">
              <div>
                <span>Notification ID</span>
                <strong>{selectedNotification.id}</strong>
              </div>

              <div>
                <span>Notification Type</span>
                <strong>
                  {getCategory(selectedNotification.notificationType)}
                </strong>
              </div>

              <div>
                <span>Created At</span>
                <strong>{formatDate(selectedNotification.createdAt)}</strong>
              </div>

              <div>
                <span>Read Status</span>
                <strong>
                  {selectedNotification.readStatus ? "Read" : "Unread"}
                </strong>
              </div>

              <div>
                <span>Related Request ID</span>
                <strong>
                  {selectedNotification.relatedRequestId ?? "Not applicable"}
                </strong>
              </div>
            </div>

            <div className="mn-details-message">
              <span>Complete Message</span>
              <p>{selectedNotification.message || "No message provided."}</p>
            </div>

            {!selectedNotification.readStatus && (
              <div className="mn-modal-actions">
                <button
                  type="button"
                  className="mn-mark-read-button"
                  onClick={() => handleMarkAsRead(selectedNotification)}
                  disabled={markingReadId !== null}
                >
                  {markingReadId === selectedNotification.id
                    ? "Updating..."
                    : "Mark as Read"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default ManagerNotifications;
