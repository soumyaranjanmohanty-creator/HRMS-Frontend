import { NavLink, Outlet } from "react-router-dom";
import companyLogo from "../assets/company-logo.png";
import "../styles/admin-dashboard.css";
import LogoutButton from "../components/LogoutButton";

function AdminLayout() {
  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img src={companyLogo} alt="Apex Workforce Solutions Pvt. Ltd." />

          <div>
            <strong>myworkforce</strong>
            <span>Admin Portal</span>
          </div>
        </div>

        <nav className="admin-navigation">
          <p className="nav-section-title">MAIN</p>

          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▣</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/profile"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◉</span>
            My Profile
          </NavLink>

          <p className="nav-section-title">WORKFORCE</p>

          <NavLink
            to="/admin/hr-management"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>♙</span>
            HR Management
          </NavLink>

          <NavLink
            to="/admin/manager-management"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>♙</span>
            Manager Management
          </NavLink>

          <NavLink
            to="/admin/employee-management"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>♙</span>
            Employee Management
          </NavLink>

          <NavLink
            to="/admin/departments"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▤</span>
            Departments
          </NavLink>

          <NavLink
            to="/admin/designations"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▤</span>
            Designations
          </NavLink>

          <p className="nav-section-title">MANAGEMENT</p>

          <NavLink
            to="/admin/attendance"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◷</span>
            Attendance
          </NavLink>

          <NavLink
            to="/admin/leave-management"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▢</span>
            Leave Management
          </NavLink>

          <NavLink
            to="/admin/payroll"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>₹</span>
            Payroll
          </NavLink>

          <NavLink
            to="/admin/helpdesk"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▣</span>
            Helpdesk
          </NavLink>

          <p className="nav-section-title">PERFORMANCE</p>

          <NavLink
            to="/admin/performance-reviews"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>★</span>
            Performance Reviews
          </NavLink>

          <p className="nav-section-title">SECURITY</p>

          <NavLink
            to="/admin/notifications"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◌</span>
            Notifications
          </NavLink>

          <NavLink
            to="/admin/audit-history"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▤</span>
            Audit History
          </NavLink>

          <NavLink
            to="/admin/account-security"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>⛨</span>
            Account Security
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <LogoutButton />
        </div>
      </aside>

      {/* Center Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
