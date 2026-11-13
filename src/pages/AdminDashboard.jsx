import { useEffect, useRef, useState } from "react";
import api from "../services/api";

function AdminDashboard() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");

  const notificationRef = useRef(null);

  useEffect(() => {
    loadUnreadNotifications();
  }, []);

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

  async function loadUnreadNotifications() {
    try {
      setNotificationError("");

      const response = await api.get("/notifications/unread");
      const data = Array.isArray(response.data) ? response.data : [];

      setNotifications(data);
      setUnreadCount(data.length);
    } catch (error) {
      console.error("Failed to load unread notifications:", error);
      setNotificationError("Unable to load notifications.");
    }
  }

  function toggleNotifications() {
    const nextState = !showNotifications;

    setShowNotifications(nextState);

    if (nextState) {
      loadUnreadNotifications();
    }
  }

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

  return (
    <>
      <header className="admin-header">
        <div>
          <p className="header-label">ADMINISTRATION</p>
          <h1>Admin Dashboard</h1>
          <p className="header-subtitle">
            Manage your workforce and organizational operations.
          </p>
        </div>

        <div className="admin-header-actions">
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

                <a
                  href="/admin/notifications"
                  className="notification-dropdown-view-all"
                >
                  View All Notifications →
                </a>
              </div>
            )}
          </div>

          <div className="admin-user">
            <div className="admin-avatar">A</div>

            <div>
              <strong>Administrator</strong>
              <span>ADMIN</span>
            </div>
          </div>
        </div>
      </header>

      {/* Overview */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Workforce Overview</h2>
            <p>Quick access to your workforce management areas.</p>
          </div>
        </div>

        <div className="overview-grid">
          <a href="/admin/hr-management" className="overview-card">
            <div className="overview-icon">♙</div>
            <div>
              <span>HR Management</span>
              <strong>Manage HR</strong>
            </div>
          </a>

          <a href="/admin/manager-management" className="overview-card">
            <div className="overview-icon">♙</div>
            <div>
              <span>Managers</span>
              <strong>Manage Managers</strong>
            </div>
          </a>

          <a href="/admin/employee-management" className="overview-card">
            <div className="overview-icon">♙</div>
            <div>
              <span>Employees</span>
              <strong>Manage Employees</strong>
            </div>
          </a>

          <a href="/admin/departments" className="overview-card">
            <div className="overview-icon">▤</div>
            <div>
              <span>Organization</span>
              <strong>Departments & Designations</strong>
            </div>
          </a>
        </div>
      </section>

      {/* Management Areas */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Management Areas</h2>
            <p>Access major workforce operations from one place.</p>
          </div>
        </div>

        <div className="management-grid">
          <a href="/admin/attendance" className="management-card">
            <span className="management-icon">◷</span>
            <div>
              <h3>Attendance</h3>
              <p>Monitor workforce attendance and records.</p>
            </div>
            <span className="card-arrow">→</span>
          </a>

          <a href="/admin/leave-management" className="management-card">
            <span className="management-icon">▢</span>
            <div>
              <h3>Leave Management</h3>
              <p>Review and manage organizational leave workflows.</p>
            </div>
            <span className="card-arrow">→</span>
          </a>

          <a href="/admin/payroll" className="management-card">
            <span className="management-icon">₹</span>
            <div>
              <h3>Payroll</h3>
              <p>Manage payroll and salary operations.</p>
            </div>
            <span className="card-arrow">→</span>
          </a>

          <a href="/admin/performance-reviews" className="management-card">
            <span className="management-icon">★</span>
            <div>
              <h3>Performance Reviews</h3>
              <p>View HR, manager, and employee performance reviews.</p>
            </div>
            <span className="card-arrow">→</span>
          </a>

          <a href="/admin/helpdesk" className="management-card">
            <span className="management-icon">▣</span>
            <div>
              <h3>Helpdesk</h3>
              <p>Manage HR requests and administrative workflows.</p>
            </div>
            <span className="card-arrow">→</span>
          </a>
        </div>
      </section>

      {/* Security */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Security & Monitoring</h2>
            <p>Review important system activity and notifications.</p>
          </div>
        </div>

        <div className="security-grid">
          <a href="/admin/notifications" className="security-card">
            <span>◌</span>
            <div>
              <h3>Notifications</h3>
              <p>View important workforce notifications.</p>
            </div>
            <span className="card-arrow">→</span>
          </a>

          <a href="/admin/audit-history" className="security-card">
            <span>▤</span>
            <div>
              <h3>Audit History</h3>
              <p>Review sensitive administrative activities.</p>
            </div>
            <span className="card-arrow">→</span>
          </a>
        </div>
      </section>
    </>
  );
}

export default AdminDashboard;
