import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import "../styles/admin-dashboard.css";
import "../styles/ManagerDashboard.css";
import ManagerHRSupport from "./ManagerHRSupport";

function ManagerDashboard() {
  const [isHRSupportOpen, setIsHRSupportOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState([]);

  // Load the unread notification count.
  useEffect(() => {
    let isMounted = true;

    const loadUnreadCount = async () => {
      try {
        const response = await api.get("/notifications/unread");
        const data = response.data;

        let unreadList = [];

        if (Array.isArray(data)) {
          unreadList = data.filter(
            (notification) => notification.readStatus === false,
          );
        } else if (Array.isArray(data?.content)) {
          unreadList = data.content.filter(
            (notification) => notification.readStatus === false,
          );
        } else if (Array.isArray(data?.notifications)) {
          unreadList = data.notifications.filter(
            (notification) => notification.readStatus === false,
          );
        }

        if (isMounted) {
          setUnreadNotifications(unreadList);

          if (
            Array.isArray(data) ||
            Array.isArray(data?.content) ||
            Array.isArray(data?.notifications)
          ) {
            setUnreadCount(unreadList.length);
          } else if (typeof data?.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          } else if (typeof data?.count === "number") {
            setUnreadCount(data.count);
          } else if (typeof data?.totalUnread === "number") {
            setUnreadCount(data.totalUnread);
          } else if (typeof data === "number") {
            setUnreadCount(data);
          } else {
            setUnreadCount(0);
          }
        }
      } catch (error) {
        console.error("Failed to load unread notifications:", error);
      }
    };

    loadUnreadCount();

    const intervalId = window.setInterval(loadUnreadCount, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  // Close the HR Support drawer when Escape is pressed.
  useEffect(() => {
    if (!isHRSupportOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsHRSupportOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isHRSupportOpen]);

  return (
    <div className="manager-dashboard-page">
      {/* Dashboard Header */}
      <header className="admin-header">
        <div>
          <p className="header-label">MANAGER DASHBOARD</p>
          <h1>Manager Dashboard</h1>
          <p className="header-subtitle">
            Manage your team and daily operations
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="manager-support-button"
            onClick={() => setIsHRSupportOpen(true)}
          >
            <span>🎧</span>
            HR Support
          </button>

          {/* Notification Bell and Dropdown */}
          <div className="manager-notification-wrapper">
            <button
              type="button"
              className="manager-notification-button"
              title="Notifications"
              aria-label="Open notifications"
              aria-expanded={isNotificationOpen}
              onClick={() => setIsNotificationOpen((previous) => !previous)}
            >
              <span className="manager-bell-icon">🔔</span>

              {unreadCount > 0 && (
                <span className="manager-notification-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <>
                <button
                  type="button"
                  className="manager-notification-dismiss"
                  aria-label="Close notifications"
                  onClick={() => setIsNotificationOpen(false)}
                />

                <section
                  className="manager-notification-dropdown"
                  aria-label="Recent unread notifications"
                >
                  <div className="manager-notification-dropdown-header">
                    <div>
                      <h3>Notifications</h3>
                      <p>{unreadCount} unread</p>
                    </div>

                    <button
                      type="button"
                      className="manager-notification-refresh"
                      title="Refresh notifications"
                      onClick={async () => {
                        try {
                          const response = await api.get(
                            "/notifications/unread",
                          );
                          const data = response.data;

                          if (Array.isArray(data)) {
                            const unread = data.filter(
                              (item) => item.readStatus === false,
                            );

                            setUnreadNotifications(unread);
                            setUnreadCount(unread.length);
                          }
                        } catch (error) {
                          console.error(
                            "Failed to refresh notifications:",
                            error,
                          );
                        }
                      }}
                    >
                      ↻
                    </button>
                  </div>

                  <div className="manager-notification-dropdown-body">
                    {unreadNotifications.length === 0 ? (
                      <div className="manager-notification-empty">
                        <span>🔔</span>
                        <p>No unread notifications.</p>
                      </div>
                    ) : (
                      unreadNotifications.slice(0, 5).map((notification) => (
                        <Link
                          key={notification.id}
                          to="/manager/notifications"
                          className="manager-notification-preview"
                          onClick={() => setIsNotificationOpen(false)}
                        >
                          <span className="manager-notification-preview-dot" />

                          <div>
                            <strong>
                              {(
                                notification.notificationType || "Notification"
                              ).replace(/_/g, " ")}
                            </strong>

                            <p>{notification.message}</p>

                            {notification.createdAt && (
                              <small>
                                {new Date(
                                  notification.createdAt,
                                ).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </small>
                            )}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  <Link
                    to="/manager/notifications"
                    className="manager-notification-view-all"
                    onClick={() => setIsNotificationOpen(false)}
                  >
                    View All Notifications →
                  </Link>
                </section>
              </>
            )}
          </div>

          <Link to="/manager/notifications" className="manager-profile-link">
            <div className="admin-avatar">M</div>

            <div>
              <strong>Manager Portal</strong>
              <span>TEAM MANAGEMENT</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Team Overview */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Team Overview</h2>
            <p>Access your assigned team and monitor daily activities.</p>
          </div>
        </div>

        <div className="overview-grid">
          <Link to="/manager/team" className="overview-card">
            <div className="overview-icon">♙</div>
            <div>
              <span>TEAM</span>
              <strong>My Team</strong>
            </div>
          </Link>

          <Link to="/manager/attendance" className="overview-card">
            <div className="overview-icon">◷</div>
            <div>
              <span>ATTENDANCE</span>
              <strong>Team Attendance</strong>
            </div>
          </Link>

          <Link to="/manager/leave-requests" className="overview-card">
            <div className="overview-icon">▢</div>
            <div>
              <span>LEAVE</span>
              <strong>Leave Requests</strong>
            </div>
          </Link>

          <Link to="/manager/payroll" className="overview-card">
            <div className="overview-icon">₹</div>
            <div>
              <span>PAYROLL</span>
              <strong>Team Payroll</strong>
            </div>
          </Link>

          <Link to="/manager/performance-reviews" className="overview-card">
            <div className="overview-icon">★</div>
            <div>
              <span>PERFORMANCE</span>
              <strong>Performance Reviews</strong>
            </div>
          </Link>
        </div>
      </section>

      {/* Team Operations */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Team Operations</h2>
            <p>Manage assigned employees and their operational activities.</p>
          </div>
        </div>

        <div className="management-grid">
          <Link to="/manager/team" className="management-card">
            <span className="management-icon">♙</span>
            <div>
              <h3>My Team</h3>
              <p>
                View your assigned employees and their permitted profile
                information.
              </p>
            </div>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/manager/attendance" className="management-card">
            <span className="management-icon">◷</span>
            <div>
              <h3>Team Attendance</h3>
              <p>Review attendance records for employees assigned to you.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/manager/leave-requests" className="management-card">
            <span className="management-icon">▢</span>
            <div>
              <h3>Leave Requests</h3>
              <p>
                Review pending employee leave requests and make approval
                decisions.
              </p>
            </div>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/manager/payroll" className="management-card">
            <span className="management-icon">₹</span>
            <div>
              <h3>Team Payroll</h3>
              <p>View payroll information for employees assigned to you.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/manager/performance-reviews" className="management-card">
            <span className="management-icon">★</span>
            <div>
              <h3>Performance Reviews</h3>
              <p>Create and view performance reviews for assigned employees.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* Account and Support */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Account & Support</h2>
            <p>Access your account information and important updates.</p>
          </div>
        </div>

        <div className="security-grid">
          <Link to="/manager/profile" className="security-card">
            <span>♙</span>
            <div>
              <h3>My Profile</h3>
              <p>View and update your manager profile.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/manager/notifications" className="security-card">
            <span>◌</span>
            <div>
              <h3>Notifications</h3>
              <p>View important notifications and updates.</p>
            </div>
            <span className="card-arrow">→</span>
          </Link>

          <button
            type="button"
            className="security-card manager-hr-support-card"
            onClick={() => setIsHRSupportOpen(true)}
          >
            <span>▣</span>
            <div>
              <h3>HR Support</h3>
              <p>Create requests, track their status, and view HR responses.</p>
            </div>
            <span className="card-arrow">→</span>
          </button>
        </div>
      </section>

      {/* HR Support Slide-In Panel */}
      {isHRSupportOpen && (
        <div
          className="manager-support-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsHRSupportOpen(false);
            }
          }}
        >
          <aside
            className="manager-support-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="HR Support"
          >
            <button
              type="button"
              className="manager-support-close"
              onClick={() => setIsHRSupportOpen(false)}
              aria-label="Close HR Support"
            >
              ×
            </button>

            <ManagerHRSupport />
          </aside>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;
