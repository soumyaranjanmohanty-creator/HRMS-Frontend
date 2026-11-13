import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import ChangePassword from "../pages/ChangePassword";
import ForgotPassword from "../pages/ForgotPassword";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/AdminDashboard";
import AdminProfile from "../pages/AdminProfile";
import HRManagement from "../pages/HRManagement";
import ManagerManagement from "../pages/ManagerManagement";
import EmployeeManagement from "../pages/EmployeeManagement";
import Departments from "../pages/Departments";
import Designations from "../pages/Designations";
import Attendance from "../pages/Attendance";
import LeaveManagement from "../pages/LeaveManagement";
import PayrollManagement from "../pages/PayrollManagement";
import AdminHelpdesk from "../pages/AdminHelpdesk";
import PerformanceReviews from "../pages/PerformanceReviews";
import Notifications from "../pages/Notifications";
import AuditHistory from "../pages/AuditHistory";
import AccountSecurity from "../pages/AccountSecurity";
import HRLayout from "../layouts/HRLayout";
import HRDashboard from "../pages/HRDashboard";
import HRHelpdesk from "../pages/HRHelpdesk";
import HRProfile from "../pages/HRProfile";
import HRManagerManagement from "../pages/HRManagerManagement";
import HREmployeeManagement from "../pages/HREmployeeManagement";
import HRDepartmentManagement from "../pages/HRDepartmentManagement";
import HRDesignationManagement from "../pages/HRDesignationManagement";
import HRAttendanceManagement from "../pages/HRAttendanceManagement";
import HRLeaveManagement from "../pages/HRLeaveManagement";
import HRPayrollManagement from "../pages/HRPayrollManagement";
import HRPerformanceReviews from "../pages/HRPerformanceReviews";
import ManagerLayout from "../layouts/ManagerLayout";
import ManagerDashboard from "../pages/ManagerDashboard";
import ManagerProfile from "../pages/ManagerProfile";
import ManagerTeam from "../pages/ManagerTeam";
import ManagerAttendance from "../pages/ManagerAttendance";
import ManagerLeaveManagement from "../pages/ManagerLeaveManagement";
import ManagerPayroll from "../pages/ManagerPayroll";
import ManagerPerformanceReviews from "../pages/ManagerPerformanceReviews";
import ManagerHRSupport from "../pages/ManagerHRSupport";
import ManagerNotifications from "../pages/ManagerNotifications.jsx";
import EmployeeLayout from "../layouts/EmployeeLayout";
import EmployeeDashboard from "../pages/EmployeeDashboard";
import EmployeeProfile from "../pages/EmployeeProfile";
import EmployeeAttendance from "../pages/EmployeeAttendance";
import EmployeeLeaveManagement from "../pages/EmployeeLeaveManagement";
import EmployeePayroll from "../pages/EmployeePayroll";
import EmployeePerformance from "../pages/EmployeePerformance";

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* General protected route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin Dashboard */}
        <Route index element={<AdminDashboard />} />

        {/* Admin Profile */}
        <Route path="profile" element={<AdminProfile />} />

        {/* Workforce Management */}
        <Route path="hr-management" element={<HRManagement />} />
        <Route path="manager-management" element={<ManagerManagement />} />
        <Route path="employee-management" element={<EmployeeManagement />} />
        <Route path="departments" element={<Departments />} />
        <Route path="designations" element={<Designations />} />

        {/* Workforce Operations */}
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave-management" element={<LeaveManagement />} />
        <Route path="payroll" element={<PayrollManagement />} />
        <Route path="helpdesk" element={<AdminHelpdesk />} />

        {/* Performance */}
        <Route path="performance-reviews" element={<PerformanceReviews />} />

        {/* Security */}
        <Route path="notifications" element={<Notifications />} />
        <Route path="audit-history" element={<AuditHistory />} />
        <Route path="account-security" element={<AccountSecurity />} />
      </Route>
      {/* =========================
          HR LAYOUT
      ========================= */}
      <Route
        path="/hr"
        element={
          <ProtectedRoute>
            <HRLayout />
          </ProtectedRoute>
        }
      >
        {/* HR Dashboard */}
        <Route index element={<HRDashboard />} />

        {/* HR Profile */}
        <Route path="profile" element={<HRProfile />} />
        <Route path="manager-management" element={<HRManagerManagement />} />
        <Route path="employee-management" element={<HREmployeeManagement />} />
        <Route
          path="department-management"
          element={<HRDepartmentManagement />}
        />
        <Route path="designations" element={<HRDesignationManagement />} />
        <Route path="attendance" element={<HRAttendanceManagement />} />
        <Route path="leave-management" element={<HRLeaveManagement />} />
        <Route path="payroll" element={<HRPayrollManagement />} />
        <Route path="performance-reviews" element={<HRPerformanceReviews />} />

        {/* HR Helpdesk */}
        <Route path="helpdesk" element={<HRHelpdesk />} />

        {/* HR Notifications */}
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* =========================
          MANAGER LAYOUT
      ========================= */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute>
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        {/* Manager Dashboard */}
        <Route index element={<ManagerDashboard />} />

        {/* Manager Profile */}
        <Route path="profile" element={<ManagerProfile />} />
        {/* Manager Team */}
        <Route path="team" element={<ManagerTeam />} />
        <Route path="attendance" element={<ManagerAttendance />} />
        <Route path="leave-requests" element={<ManagerLeaveManagement />} />
        <Route path="payroll" element={<ManagerPayroll />} />
        <Route path="hr-support" element={<ManagerHRSupport />} />
        <Route path="notifications" element={<ManagerNotifications />} />
        <Route
          path="performance-reviews"
          element={<ManagerPerformanceReviews />}
        />
      </Route>

      {/* =========================
    EMPLOYEE LAYOUT
========================= */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        {/* Employee Dashboard */}
        <Route index element={<EmployeeDashboard />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="attendance" element={<EmployeeAttendance />} />
        <Route path="leave" element={<EmployeeLeaveManagement />} />
        <Route path="payroll" element={<EmployeePayroll />} />
        <Route path="performance" element={<EmployeePerformance />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
}
export default AppRoutes;
