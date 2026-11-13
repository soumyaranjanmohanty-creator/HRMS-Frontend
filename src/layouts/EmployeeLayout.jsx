import { NavLink, Outlet } from "react-router-dom";
import companyLogo from "../assets/company-logo.png";
import "../styles/admin-dashboard.css";
import "../styles/EmployeeDashboard.css";
import LogoutButton from "../components/LogoutButton";

function EmployeeLayout() {
  return (
    <div className="admin-dashboard employee-dashboard-layout">
      {/* Employee Sidebar */}
      <aside className="admin-sidebar">
        {/* Company Branding */}
        <div className="admin-sidebar-brand">
          <img src={companyLogo} alt="Apex Workforce Solutions Pvt. Ltd." />

          <div>
            <strong>myworkforce</strong>
            <span>Employee Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="admin-navigation">
          {/* MAIN */}
          <p className="nav-section-title">MAIN</p>

          <NavLink
            to="/employee"
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▣</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/employee/profile"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◉</span>
            My Profile
          </NavLink>

          {/* MY WORK */}
          <p className="nav-section-title">MY WORK</p>

          <NavLink
            to="/employee/attendance"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◷</span>
            My Attendance
          </NavLink>

          <NavLink
            to="/employee/leave"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▢</span>
            Apply Leave
          </NavLink>

          {/* MY BENEFITS */}
          <p className="nav-section-title">MY BENEFITS</p>

          <NavLink
            to="/employee/payroll"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>₹</span>
            My Payroll
          </NavLink>

          <NavLink
            to="/employee/performance"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>★</span>
            My Performance
          </NavLink>

          {/* SUPPORT */}
          <p className="nav-section-title">SUPPORT</p>

          <NavLink
            to="/employee/notifications"
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

      {/* Employee Page Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default EmployeeLayout;
