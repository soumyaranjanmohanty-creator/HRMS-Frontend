import { NavLink, Outlet } from "react-router-dom";
import companyLogo from "../assets/company-logo.png";
import "../styles/admin-dashboard.css";
import LogoutButton from "../components/LogoutButton";

function HRLayout() {
  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img src={companyLogo} alt="Apex Workforce Solutions Pvt. Ltd." />

          <div>
            <strong>myworkforce</strong>
            <span>HR Portal</span>
          </div>
        </div>

        <nav className="admin-navigation">
          <p className="nav-section-title">MAIN</p>

          <NavLink
            to="/hr"
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▣</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/hr/profile"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◉</span>
            My Profile
          </NavLink>

          <p className="nav-section-title">WORKFORCE</p>

          <NavLink
            to="/hr/manager-management"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>♙</span>
            Manager Management
          </NavLink>

          <NavLink
            to="/hr/employee-management"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>♙</span>
            Employee Management
          </NavLink>

          <NavLink
           to="/hr/department-management"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▤</span>
            Departments
          </NavLink>

          <NavLink
            to="/hr/designations"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▤</span>
            Designations
          </NavLink>

          <p className="nav-section-title">OPERATIONS</p>

          <NavLink
            to="/hr/attendance"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◷</span>
            Attendance
          </NavLink>

          <NavLink
            to="/hr/leave-management"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▢</span>
            Leave Management
          </NavLink>

          <NavLink
            to="/hr/payroll"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>₹</span>
            Payroll
          </NavLink>

          <p className="nav-section-title">PEOPLE & PERFORMANCE</p>

          <NavLink
            to="/hr/performance-reviews"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>★</span>
            Performance Reviews
          </NavLink>

          <NavLink
            to="/hr/helpdesk"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▣</span>
            HR Helpdesk
          </NavLink>

          <p className="nav-section-title">SYSTEM</p>

          <NavLink
            to="/hr/notifications"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◌</span>
            Notifications
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <LogoutButton />
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default HRLayout;