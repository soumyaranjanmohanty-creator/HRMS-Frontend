import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/Notifications.css";

function Notifications() {
  const [activeTab, setActiveTab] = useState("all");

  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);

  const [selectedNotification, setSelectedNotification] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const [allResponse, unreadResponse] = await Promise.all([
        api.get("/notifications"),
        api.get("/notifications/unread"),
      ]);

      setNotifications(Array.isArray(allResponse.data) ? allResponse.data : []);

      setUnreadNotifications(
        Array.isArray(unreadResponse.data) ? unreadResponse.data : [],
      );
    } catch (error) {
      console.error("Failed to load notifications:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load notifications. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const readNotifications = notifications.filter(
    (notification) => notification.readStatus === true,
  );

  const displayedNotifications =
    activeTab === "unread"
      ? unreadNotifications
      : activeTab === "read"
        ? readNotifications
        : notifications;

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString();
  };

  const getNotificationCategory = (type) => {
    switch (type) {
      case "NEW_HELPDESK_REQUEST":
        return "Helpdesk Request";

      case "ACCOUNT_UNLOCK_REQUEST":
        return "Account Unlock Request";

      default:
        return type || "Notification";
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <span className="notifications-eyebrow">SECURITY & MONITORING</span>

          <h1>Notifications</h1>

          <p>View important workforce notifications.</p>
        </div>

        <button
          type="button"
          className="notifications-refresh-button"
          onClick={loadNotifications}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Notification Summary */}
      <div className="notification-summary">
        <div className="notification-summary-card">
          <span>Total Notifications</span>
          <h2>{notifications.length}</h2>
        </div>

        <div className="notification-summary-card">
          <span>Unread Notifications</span>
          <h2>{unreadNotifications.length}</h2>
        </div>
      </div>

      {/* Notification Tabs */}
      <div className="notification-tabs">
        <button
          type="button"
          className={activeTab === "all" ? "active" : ""}
          onClick={() => {
            setActiveTab("all");
            setSelectedNotification(null);
          }}
        >
          All Notifications
          <span className="notification-tab-count">{notifications.length}</span>
        </button>

        <button
          type="button"
          className={activeTab === "unread" ? "active" : ""}
          onClick={() => {
            setActiveTab("unread");
            setSelectedNotification(null);
          }}
        >
          Unread Notifications
          <span className="notification-tab-count">
            {unreadNotifications.length}
          </span>
        </button>

        <button
          type="button"
          className={activeTab === "read" ? "active" : ""}
          onClick={() => {
            setActiveTab("read");
            setSelectedNotification(null);
          }}
        >
          Read Notifications
          <span className="notification-tab-count">
            {readNotifications.length}
          </span>
        </button>
      </div>

      {/* Notification Content */}
      <div className="notifications-content">
        <div className="notifications-content-header">
          <h2>
            {activeTab === "all" && "All Notifications"}

            {activeTab === "unread" && "Unread Notifications"}

            {activeTab === "read" && "Read Notifications"}
          </h2>

          <span>{displayedNotifications.length} notification(s)</span>
        </div>

        {error && (
          <div className="notifications-error">
            <span>{error}</span>

            <button type="button" onClick={loadNotifications}>
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="notifications-empty-state">
            Loading notifications...
          </div>
        )}

        {!loading && !error && displayedNotifications.length === 0 && (
          <div className="notifications-empty-state">
            No notifications found.
          </div>
        )}

        {!loading && !error && displayedNotifications.length > 0 && (
          <div className="notifications-table-wrapper">
            <table className="notifications-table">
              <thead>
                <tr>
                  <th>Notification ID</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Date & Time</th>
                  <th>Read Status</th>
                  <th>Related Request ID</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {displayedNotifications.map((notification) => (
                  <tr key={notification.id}>
                    <td>{notification.id}</td>

                    <td>
                      <span className="notification-type">
                        {getNotificationCategory(notification.notificationType)}
                      </span>
                    </td>

                    <td className="notification-message-cell">
                      {notification.message || "-"}
                    </td>

                    <td>{formatDate(notification.createdAt)}</td>

                    <td>
                      <span
                        className={`notification-status ${
                          notification.readStatus ? "read" : "unread"
                        }`}
                      >
                        {notification.readStatus ? "Read" : "Unread"}
                      </span>
                    </td>

                    <td>{notification.relatedRequestId ?? "-"}</td>

                    <td>
                      <div className="notification-action-buttons">
                        <button
                          type="button"
                          className="notification-view-button"
                          onClick={() => setSelectedNotification(notification)}
                        >
                          View Details
                        </button>

                        {!notification.readStatus && (
                          <button
                            type="button"
                            className="notification-mark-read-button"
                            onClick={async () => {
                              try {
                                await api.put(
                                  `/notifications/${notification.id}/read`,
                                );

                                await loadNotifications();

                                if (
                                  selectedNotification?.id === notification.id
                                ) {
                                  setSelectedNotification({
                                    ...notification,
                                    readStatus: true,
                                  });
                                }
                              } catch (error) {
                                console.error(
                                  "Failed to mark notification as read:",
                                  error,
                                );
                                setError(
                                  "Failed to mark notification as read. Please try again.",
                                );
                              }
                            }}
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notification Details */}
      {selectedNotification && (
        <div className="notification-details">
          <div className="notification-details-header">
            <div>
              <h2>Notification Details</h2>
              <p>Review the complete notification information.</p>
            </div>

            <button
              type="button"
              className="notification-close-button"
              onClick={() => setSelectedNotification(null)}
            >
              Close
            </button>
          </div>

          <div className="notification-detail-grid">
            <div>
              <span>Notification ID</span>
              <strong>{selectedNotification.id}</strong>
            </div>

            <div>
              <span>Notification Type</span>
              <strong>
                {getNotificationCategory(selectedNotification.notificationType)}
              </strong>
            </div>

            <div>
              <span>Recipient</span>
              <strong>{selectedNotification.recipientEmail || "-"}</strong>
            </div>

            <div>
              <span>Created Date</span>
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
              <strong>{selectedNotification.relatedRequestId ?? "-"}</strong>
            </div>
          </div>

          <div className="notification-detail-message">
            <span>Complete Message</span>
            <p>{selectedNotification.message || "-"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
