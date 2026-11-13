import { NavLink, Outlet } from "react-router-dom";
import companyLogo from "../assets/company-logo.png";
import "../styles/admin-dashboard.css";
import LogoutButton from "../components/LogoutButton";

function ManagerLayout() {
  return (
    <div className="admin-dashboard">
      {/* Manager Sidebar */}
      <aside className="admin-sidebar">
        {/* Company Branding */}
        <div className="admin-sidebar-brand">
          <img src={companyLogo} alt="Apex Workforce Solutions Pvt. Ltd." />

          <div>
            <strong>myworkforce</strong>
            <span>Manager Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="admin-navigation">
          {/* MAIN */}
          <p className="nav-section-title">MAIN</p>

          <NavLink
            to="/manager"
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▣</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/manager/profile"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◉</span>
            My Profile
          </NavLink>

          {/* MY TEAM */}
          <p className="nav-section-title">MY TEAM</p>

          <NavLink
            to="/manager/team"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>♙</span>
            My Team
          </NavLink>

          <NavLink
            to="/manager/attendance"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◷</span>
            Attendance
          </NavLink>

          {/* OPERATIONS */}
          <p className="nav-section-title">OPERATIONS</p>

          <NavLink
            to="/manager/leave-requests"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▢</span>
            Leave Management
          </NavLink>

          <NavLink
            to="/manager/payroll"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>₹</span>
            Payroll
          </NavLink>

          <NavLink
            to="/manager/performance-reviews"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>★</span>
            Performance Reviews
          </NavLink>

          <NavLink
            to="/manager/notifications"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◌</span>
            Notifications
          </NavLink>
        </nav>

        {/* Logout */}
        <div className="admin-sidebar-footer">
          <LogoutButton />
        </div>
      </aside>

      {/* Manager Page Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default ManagerLayout;
