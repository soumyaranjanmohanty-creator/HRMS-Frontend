import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/admin-dashboard.css";
import "../styles/EmployeeDashboard.css";
import EmployeeHRSupport from "./EmployeeHRSupport";

function EmployeeDashboard() {
  const [isHRSupportOpen, setIsHRSupportOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState("");

  // Load unread notifications.
  useEffect(() => {
    let isMounted = true;

    const loadUnreadNotifications = async () => {
      try {
        const response = await api.get("/notifications/unread");

        if (!isMounted) return;

        const data = response.data;

        if (Array.isArray(data)) {
          const unread = data.filter(
            (notification) =>
              notification.readStatus === false ||
              notification.readStatus === "UNREAD",
          );

          setUnreadNotifications(unread);
          setUnreadCount(unread.length);
        } else {
          console.error("Unexpected unread notification response:", data);

          setNotificationError("Unable to read notification data.");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to load employee notifications:", error);

          setNotificationError("Notifications are temporarily unavailable.");
        }
      }
    };

    loadUnreadNotifications();

    const intervalId = window.setInterval(loadUnreadNotifications, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  // Close the notification dropdown when Escape is pressed.
  useEffect(() => {
    if (!isNotificationOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationOpen]);

  // Retrieve the logged-in employee's name from existing browser storage.
  const getEmployeeName = () => {
    const possibleKeys = ["user", "currentUser", "authUser"];

    for (const key of possibleKeys) {
      try {
        const storedValue = localStorage.getItem(key);

        if (!storedValue) continue;

        const user = JSON.parse(storedValue);

        if (user?.name) return user.name;
        if (user?.fullName) return user.fullName;
        if (user?.username) return user.username;
      } catch {
        // Continue checking other storage keys.
      }
    }

    return "Employee";
  };

  const employeeName = getEmployeeName();

  return (
    <div className="employee-dashboard-page">
      {/* Dashboard Header */}
      <header className="admin-header employee-dashboard-header">
        <div>
          <p className="header-label">EMPLOYEE DASHBOARD</p>

          <h1>Employee Dashboard</h1>

          <p className="header-subtitle">
            Welcome back, {employeeName}. Here's your work overview.
          </p>
        </div>

        <div className="admin-header-actions employee-header-actions">
          {/* HR Support Button */}
          <button
            type="button"
            className="employee-hr-support-button"
            onClick={() => setIsHRSupportOpen(true)}
          >
            <span>🎧</span>
            HR Support
          </button>
          {/* Notification Bell */}
          <div className="employee-notification-wrapper">
            <button
              type="button"
              className="employee-notification-button"
              title={
                unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : "Notifications"
              }
              aria-label="Open employee notifications"
              aria-expanded={isNotificationOpen}
              onClick={() => setIsNotificationOpen((previous) => !previous)}
            >
              <span className="employee-bell-icon">🔔</span>

              {unreadCount > 0 && (
                <span className="employee-notification-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <>
                <button
                  type="button"
                  className="employee-notification-dismiss"
                  aria-label="Close notification dropdown"
                  onClick={() => setIsNotificationOpen(false)}
                />

                <section className="employee-notification-dropdown">
                  <div className="employee-notification-dropdown-header">
                    <div>
                      <h3>Notifications</h3>
                      <p>{unreadCount} unread</p>
                    </div>

                    <button
                      type="button"
                      className="employee-notification-refresh"
                      title="Refresh notifications"
                      onClick={async () => {
                        try {
                          const response = await api.get(
                            "/notifications/unread",
                          );

                          if (Array.isArray(response.data)) {
                            const unread = response.data.filter(
                              (notification) =>
                                notification.readStatus === false ||
                                notification.readStatus === "UNREAD",
                            );

                            setUnreadNotifications(unread);
                            setUnreadCount(unread.length);
                            setNotificationError("");
                          }
                        } catch (error) {
                          console.error(
                            "Unable to refresh notifications:",
                            error,
                          );

                          setNotificationError(
                            "Unable to refresh notifications.",
                          );
                        }
                      }}
                    >
                      ↻
                    </button>
                  </div>

                  <div className="employee-notification-dropdown-body">
                    {notificationError ? (
                      <div className="employee-notification-empty">
                        <span>!</span>
                        <p>{notificationError}</p>
                      </div>
                    ) : unreadNotifications.length === 0 ? (
                      <div className="employee-notification-empty">
                        <span>🔔</span>
                        <p>No unread notifications.</p>
                      </div>
                    ) : (
                      unreadNotifications.slice(0, 5).map((notification) => (
                        <Link
                          key={notification.id}
                          to="/employee/notifications"
                          className="employee-notification-preview"
                          onClick={() => setIsNotificationOpen(false)}
                        >
                          <span className="employee-notification-dot" />

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
                    to="/employee/notifications"
                    className="employee-notification-view-all"
                    onClick={() => setIsNotificationOpen(false)}
                  >
                    View All Notifications →
                  </Link>
                </section>
              </>
            )}
          </div>

          {/* Employee Profile Shortcut */}
          <Link
            to="/employee/profile"
            className="employee-header-profile"
            aria-label="Open my profile"
          >
            <div className="employee-header-avatar">
              {employeeName.charAt(0).toUpperCase()}
            </div>

            <div className="employee-header-profile-text">
              <strong>{employeeName}</strong>
              <span>EMPLOYEE PORTAL</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Welcome Banner */}
      <section className="employee-welcome-banner">
        <div className="employee-welcome-content">
          <span className="employee-welcome-eyebrow">
            MYWORKFORCE EMPLOYEE PORTAL
          </span>

          <h2>Hello, {employeeName}!</h2>

          <p>
            Manage your attendance, leave applications, payroll, performance
            reviews, and support requests from one place.
          </p>

          <Link to="/employee/profile" className="employee-welcome-button">
            View My Profile <span>→</span>
          </Link>
        </div>

        <div className="employee-welcome-decoration" aria-hidden="true">
          <span>✓</span>
        </div>
      </section>

      {/* Employee Overview */}
      <section className="dashboard-section employee-section">
        <div className="section-heading">
          <div>
            <h2>My Overview</h2>

            <p>Quick access to your personal work information.</p>
          </div>
        </div>

        <div className="employee-overview-grid">
          <Link to="/employee/attendance" className="employee-overview-card">
            <div className="employee-overview-icon attendance-icon">◷</div>

            <div>
              <span>ATTENDANCE</span>
              <strong>My Attendance</strong>
              <p>Check attendance and view your records.</p>
            </div>

            <span className="employee-card-arrow">→</span>
          </Link>

          <Link to="/employee/leave" className="employee-overview-card">
            <div className="employee-overview-icon leave-icon">▢</div>

            <div>
              <span>LEAVE</span>
              <strong>Apply Leave</strong>
              <p>Submit leave requests and check their status.</p>
            </div>

            <span className="employee-card-arrow">→</span>
          </Link>

          <Link to="/employee/payroll" className="employee-overview-card">
            <div className="employee-overview-icon payroll-icon">₹</div>

            <div>
              <span>PAYROLL</span>
              <strong>My Payroll</strong>
              <p>Review your salary and payroll history.</p>
            </div>

            <span className="employee-card-arrow">→</span>
          </Link>

          <Link to="/employee/performance" className="employee-overview-card">
            <div className="employee-overview-icon performance-icon">★</div>

            <div>
              <span>PERFORMANCE</span>
              <strong>My Performance</strong>
              <p>View your performance reviews and feedback.</p>
            </div>

            <span className="employee-card-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* My Work */}
      <section className="dashboard-section employee-section">
        <div className="section-heading">
          <div>
            <h2>My Work</h2>

            <p>Manage your daily activities and employment information.</p>
          </div>
        </div>

        <div className="employee-management-grid">
          <Link to="/employee/attendance" className="employee-management-card">
            <div className="employee-management-icon">◷</div>

            <div className="employee-management-content">
              <h3>My Attendance</h3>

              <p>
                View your attendance history, check-in times, check-out times,
                and recorded status.
              </p>
            </div>

            <span className="employee-management-arrow">→</span>
          </Link>

          <Link to="/employee/leave" className="employee-management-card">
            <div className="employee-management-icon">▢</div>

            <div className="employee-management-content">
              <h3>Leave Management</h3>

              <p>
                Apply for leave, view your leave balance, and track application
                decisions.
              </p>
            </div>

            <span className="employee-management-arrow">→</span>
          </Link>

          <Link to="/employee/profile" className="employee-management-card">
            <div className="employee-management-icon">◉</div>

            <div className="employee-management-content">
              <h3>My Profile</h3>

              <p>
                View your personal details, department, designation, and
                employment information.
              </p>
            </div>

            <span className="employee-management-arrow">→</span>
          </Link>

          <Link to="/employee/performance" className="employee-management-card">
            <div className="employee-management-icon">★</div>

            <div className="employee-management-content">
              <h3>Performance Reviews</h3>

              <p>
                Review available performance ratings, review periods, and
                feedback.
              </p>
            </div>

            <span className="employee-management-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* Account and Support */}
      <section className="dashboard-section employee-section">
        <div className="section-heading">
          <div>
            <h2>Account & Support</h2>

            <p>Access your account services and important updates.</p>
          </div>
        </div>

        <div className="employee-support-grid">
          <Link to="/employee/notifications" className="employee-support-card">
            <div className="employee-support-icon">◌</div>

            <div>
              <h3>Notifications</h3>

              <p>
                View important updates, request decisions, and other
                notifications.
              </p>
            </div>

            <span className="employee-management-arrow">→</span>
          </Link>

          <Link to="/employee/payroll" className="employee-support-card">
            <div className="employee-support-icon">₹</div>

            <div>
              <h3>Salary & Payslips</h3>

              <p>Review your generated payroll and available payslips.</p>
            </div>

            <span className="employee-management-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* HR Support Slide-In Drawer */}
      {isHRSupportOpen && (
        <div
          className="employee-support-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsHRSupportOpen(false);
            }
          }}
        >
          <aside
            className="employee-support-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="HR Support"
          >
            <button
              type="button"
              className="employee-support-close"
              onClick={() => setIsHRSupportOpen(false)}
              aria-label="Close HR Support"
            >
              ×
            </button>

            <EmployeeHRSupport />
          </aside>
        </div>
      )}

      {/* Footer */}
      <footer className="employee-dashboard-footer">
        <span>myworkforce</span>
        <span>Employee Portal</span>
      </footer>
    </div>
  );
}

export default EmployeeDashboard;
