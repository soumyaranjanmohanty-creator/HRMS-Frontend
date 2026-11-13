import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/admin-dashboard.css";
import "../styles/HRDashboard.css";

function HRDashboard() {
  const [showSupport, setShowSupport] = useState(false);
  const [activeSupportTab, setActiveSupportTab] = useState("new");

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");

  const notificationRef = useRef(null);

  // Support form state
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [supportError, setSupportError] = useState("");
  const [supportSuccess, setSupportSuccess] = useState("");

  // Load HR support requests
  async function loadMyRequests() {
    try {
      setLoadingRequests(true);
      setSupportError("");

      const response = await api.get("/helpdesk/my");

      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load HR support requests:", error);

      setSupportError(
        error.response?.data?.message ||
          "Unable to load your support requests. Please try again.",
      );
    } finally {
      setLoadingRequests(false);
    }
  }

  // Load unread notifications
  async function loadUnreadNotifications() {
    try {
      setNotificationError("");

      const response = await api.get("/notifications/unread");
      const data = Array.isArray(response.data) ? response.data : [];

      setNotifications(data);
      setUnreadCount(data.length);
    } catch (error) {
      console.error("Failed to load HR notifications:", error);
      setNotificationError("Unable to load notifications.");
    }
  }

  // Toggle notification popup
  function toggleNotifications() {
    const nextState = !showNotifications;

    setShowNotifications(nextState);

    if (nextState) {
      loadUnreadNotifications();
    }
  }

  // Load notification count when dashboard opens
  useEffect(() => {
    loadUnreadNotifications();
  }, []);

  // Close notification popup when clicking outside
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Open HR support drawer
  function openSupport() {
    setShowSupport(true);
    setActiveSupportTab("new");
    setSupportError("");
    setSupportSuccess("");
  }

  // Close HR support drawer
  function closeSupport() {
    setShowSupport(false);
    setSupportError("");
    setSupportSuccess("");
  }

  // Submit support request to ADMIN
  async function handleSubmitRequest(event) {
    event.preventDefault();

    if (!subject.trim() || !description.trim()) {
      setSupportError("Please enter both a subject and description.");
      return;
    }

    try {
      setSubmitting(true);
      setSupportError("");
      setSupportSuccess("");

      const response = await api.post("/helpdesk", {
        subject: subject.trim(),
        description: description.trim(),
      });

      setSupportSuccess(
        typeof response.data === "string"
          ? response.data
          : "Your support request was submitted successfully.",
      );

      setSubject("");
      setDescription("");

      await loadMyRequests();
      setActiveSupportTab("requests");
    } catch (error) {
      console.error("Failed to submit HR support request:", error);

      setSupportError(
        error.response?.data?.message ||
          (typeof error.response?.data === "string"
            ? error.response.data
            : "Unable to submit your support request. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Switch support drawer tabs
  function handleSupportTab(tab) {
    setActiveSupportTab(tab);
    setSupportError("");
    setSupportSuccess("");

    if (tab === "requests") {
      loadMyRequests();
    }
  }

  // Format support request dates
  function formatDate(dateValue) {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime()) ? dateValue : date.toLocaleString();
  }

  // Format notification dates
  function formatNotificationDate(dateValue) {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString();
  }

  // Format support request status
  function statusClass(status) {
    return String(status || "OPEN")
      .toLowerCase()
      .replaceAll("_", "-");
  }

  return (
    <div className="hr-dashboard-page">
      {/* HR Dashboard Header */}
      <header className="admin-header">
        <div>
          <p className="header-label">HR DASHBOARD</p>
          <h1>HR Dashboard</h1>
          <p className="header-subtitle">Manage workforce operations</p>
        </div>

        <div className="admin-header-actions">
          {/* HR Support Button */}
          <button
            type="button"
            className="hr-support-button"
            onClick={openSupport}
          >
            <span>🎧</span>
            Support
          </button>

          {/* Notification Bell and Popup */}
          <div className="notification-dropdown" ref={notificationRef}>
            <button
              type="button"
              className="notification-button"
              aria-label={`Notifications, ${unreadCount} unread`}
              aria-expanded={showNotifications}
              title="Notifications"
              onClick={toggleNotifications}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown-panel">
                <div className="notification-dropdown-header">
                  <div>
                    <h3>Notifications</h3>
                    <span>{unreadCount} unread</span>
                  </div>

                  <button
                    type="button"
                    className="notification-dropdown-refresh"
                    onClick={loadUnreadNotifications}
                    aria-label="Refresh notifications"
                    title="Refresh notifications"
                  >
                    ↻
                  </button>
                </div>

                {notificationError && (
                  <p className="notification-dropdown-error">
                    {notificationError}
                  </p>
                )}

                {!notificationError && notifications.length === 0 && (
                  <div className="notification-dropdown-empty">
                    <span>🔔</span>
                    <p>No unread notifications.</p>
                  </div>
                )}

                {!notificationError && notifications.length > 0 && (
                  <div className="notification-dropdown-list">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        className="notification-dropdown-item"
                        key={notification.id}
                      >
                        <span className="notification-dropdown-dot" />

                        <div className="notification-dropdown-item-content">
                          <strong>
                            {notification.notificationType ===
                            "NEW_HELPDESK_REQUEST"
                              ? "Helpdesk Request"
                              : notification.notificationType ===
                                  "ACCOUNT_UNLOCK_REQUEST"
                                ? "Account Unlock Request"
                                : notification.notificationType ||
                                  "Notification"}
                          </strong>

                          <p>{notification.message || "-"}</p>

                          <span>
                            {formatNotificationDate(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  to="/hr/notifications"
                  className="notification-dropdown-view-all"
                  onClick={() => setShowNotifications(false)}
                >
                  View All Notifications →
                </Link>
              </div>
            )}
          </div>

          {/* HR Profile */}
          <Link to="/hr/profile" className="hr-profile-link">
            <div className="admin-avatar">HR</div>

            <div>
              <strong>HR Profile</strong>
              <span>HUMAN RESOURCES</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Workforce Overview */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Workforce Overview</h2>
            <p>Access workforce records and organizational information.</p>
          </div>
        </div>

        <div className="overview-grid">
          <Link to="/hr/manager-management" className="overview-card">
            <div className="overview-icon">♙</div>
            <div>
              <span>Managers</span>
              <strong>Manage Managers</strong>
            </div>
          </Link>

          <Link to="/hr/employee-management" className="overview-card">
            <div className="overview-icon">♙</div>
            <div>
              <span>Employees</span>
              <strong>Manage Employees</strong>
            </div>
          </Link>

          <Link to="/hr/departments" className="overview-card">
            <div className="overview-icon">▤</div>
            <div>
              <span>Organization</span>
              <strong>Departments</strong>
            </div>
          </Link>

          <Link to="/hr/designations" className="overview-card">
            <div className="overview-icon">▤</div>
            <div>
              <span>Organization</span>
              <strong>Designations</strong>
            </div>
          </Link>
        </div>
      </section>

      {/* Workforce Operations */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Workforce Operations</h2>
            <p>Access the main HR operational areas.</p>
          </div>
        </div>

        <div className="management-grid">
          <Link to="/hr/attendance" className="management-card">
            <span className="management-icon">◷</span>
            <div>
              <h3>Attendance</h3>
              <p>Review employee attendance records.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/hr/leave-management" className="management-card">
            <span className="management-icon">▢</span>
            <div>
              <h3>Leave Management</h3>
              <p>Access workforce leave management.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/hr/payroll" className="management-card">
            <span className="management-icon">₹</span>
            <div>
              <h3>Payroll</h3>
              <p>Access payroll and salary operations.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/hr/performance-reviews" className="management-card">
            <span className="management-icon">★</span>
            <div>
              <h3>Performance Reviews</h3>
              <p>Access employee performance reviews.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/hr/helpdesk" className="management-card">
            <span className="management-icon">▣</span>
            <div>
              <h3>HR Helpdesk</h3>
              <p>Manage helpdesk requests from managers and employees.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* Account & System Access */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Account & System Access</h2>
            <p>Access your HR account and important system updates.</p>
          </div>
        </div>

        <div className="security-grid">
          <Link to="/hr/profile" className="security-card">
            <span>♙</span>
            <div>
              <h3>My Profile</h3>
              <p>View your HR account and profile information.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/hr/notifications" className="security-card">
            <span>◌</span>
            <div>
              <h3>Notifications</h3>
              <p>View important workforce notifications.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* HR Support Drawer */}
      {showSupport && (
        <div
          className="hr-support-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSupport();
            }
          }}
        >
          <aside
            className="hr-support-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hr-support-title"
          >
            <div className="hr-support-drawer-header">
              <div>
                <span className="hr-support-eyebrow">HRMS SUPPORT CENTER</span>
                <h2 id="hr-support-title">Admin Support</h2>
                <p>Contact ADMIN and track your support requests.</p>
              </div>

              <button
                type="button"
                className="hr-support-close"
                onClick={closeSupport}
                aria-label="Close support panel"
              >
                ×
              </button>
            </div>

            <div className="hr-support-tabs">
              <button
                type="button"
                className={activeSupportTab === "new" ? "active" : ""}
                onClick={() => handleSupportTab("new")}
              >
                New Request
              </button>

              <button
                type="button"
                className={activeSupportTab === "requests" ? "active" : ""}
                onClick={() => handleSupportTab("requests")}
              >
                My Requests
              </button>
            </div>

            {supportSuccess && (
              <div className="hr-support-message success" role="status">
                ✓ {supportSuccess}
              </div>
            )}

            {supportError && (
              <div className="hr-support-message error" role="alert">
                {supportError}
              </div>
            )}

            {activeSupportTab === "new" && (
              <form className="hr-support-form" onSubmit={handleSubmitRequest}>
                <div className="hr-support-info">
                  <strong>Contact the ADMIN</strong>
                  <p>
                    Use this form for administrative assistance. Your request
                    will be routed to ADMIN.
                  </p>
                </div>

                <div className="hr-support-field">
                  <label htmlFor="hr-support-subject">
                    Subject <span>*</span>
                  </label>

                  <input
                    id="hr-support-subject"
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Enter the request subject"
                    maxLength={150}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="hr-support-field">
                  <label htmlFor="hr-support-description">
                    Description <span>*</span>
                  </label>

                  <textarea
                    id="hr-support-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Explain how ADMIN can assist you..."
                    rows={6}
                    maxLength={3000}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="hr-support-form-footer">
                  <span>Fields marked * are required.</span>

                  <button
                    type="submit"
                    className="hr-support-submit"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            )}

            {activeSupportTab === "requests" && (
              <div className="hr-support-requests">
                <div className="hr-support-requests-heading">
                  <div>
                    <h3>My Support Requests</h3>
                    <p>Track your requests and ADMIN responses.</p>
                  </div>

                  <button
                    type="button"
                    className="hr-support-refresh"
                    onClick={loadMyRequests}
                    disabled={loadingRequests}
                    aria-label="Refresh support requests"
                    title="Refresh"
                  >
                    ↻
                  </button>
                </div>

                {loadingRequests && (
                  <div className="hr-support-empty">
                    Loading your requests...
                  </div>
                )}

                {!loadingRequests && !supportError && requests.length === 0 && (
                  <div className="hr-support-empty">
                    <span>▤</span>
                    <strong>No requests yet</strong>
                    <p>Your submitted support requests will appear here.</p>
                  </div>
                )}

                {!loadingRequests && requests.length > 0 && (
                  <div className="hr-support-request-list">
                    {requests.map((request) => (
                      <article
                        className="hr-support-request-card"
                        key={request.id}
                      >
                        <div className="hr-support-request-top">
                          <span>Request #{request.id}</span>

                          <span
                            className={`hr-support-status ${statusClass(
                              request.status,
                            )}`}
                          >
                            {request.status || "OPEN"}
                          </span>
                        </div>

                        <h4>{request.subject || "Support Request"}</h4>

                        <p className="hr-support-request-description">
                          {request.description || "-"}
                        </p>

                        <div className="hr-support-request-meta">
                          <span>Submitted</span>
                          <strong>{formatDate(request.createdAt)}</strong>
                        </div>

                        <div className="hr-support-response">
                          <span>ADMIN Response</span>
                          <p>
                            {request.response?.trim()
                              ? request.response
                              : "No response has been added yet."}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default HRDashboard;
