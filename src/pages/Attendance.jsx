import { useState } from "react";
import api from "../services/api";
import "../styles/AttendanceManagement.css";

function Attendance() {
  const [activeSection, setActiveSection] = useState("records");

  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const [users, setUsers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [workingDays, setWorkingDays] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRoleChange = async (event) => {
    const role = event.target.value;

    setSelectedRole(role);
    setSelectedUserId("");
    setUsers([]);
    setAttendanceRecords([]);
    setError("");
    setSuccess("");

    if (!role) {
      return;
    }

    try {
      const response = await api.get(`/users/role/${role}`);

      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
      setError("Failed to load users.");
    }
  };

  const handleViewAttendance = async () => {
    if (!selectedUserId) {
      setError("Please select a user.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await api.get(`/attendance/${selectedUserId}`);

      setAttendanceRecords(response.data);
    } catch (error) {
      console.error("Failed to load attendance:", error);
      setError("Failed to load attendance records.");
    }
  };

  const handleChangeStatus = async (attendanceId, newStatus) => {
    try {
      setError("");
      setSuccess("");

      await api.put(`/attendance/${attendanceId}/status`, null, {
        params: {
          newStatus: newStatus,
        },
      });

      await handleViewAttendance();

      setSuccess(`Attendance status changed to ${newStatus} successfully.`);
    } catch (error) {
      console.error("Failed to change attendance status:", error);
      setError("Failed to change attendance status.");
    }
  };

  const loadWorkingDays = async () => {
    try {
      setError("");

      const response = await api.get("/working-days");

      const sortedDays = [...response.data].sort((a, b) => {
        const order = {
          MONDAY: 1,
          TUESDAY: 2,
          WEDNESDAY: 3,
          THURSDAY: 4,
          FRIDAY: 5,
          SATURDAY: 6,
          SUNDAY: 7,
        };

        return order[a.dayOfWeek] - order[b.dayOfWeek];
      });

      setWorkingDays(sortedDays);
    } catch (error) {
      console.error("Failed to load working days:", error);
      setError("Failed to load working days.");
    }
  };

  const handleWorkingDaysSection = () => {
    setActiveSection("workingDays");
    setError("");
    setSuccess("");
    loadWorkingDays();
  };

  const handleChangeWorkingDay = async (dayOfWeek, currentWorking) => {
    try {
      setError("");
      setSuccess("");

      const newWorkingStatus = !currentWorking;

      await api.put(`/working-days/${dayOfWeek}`, null, {
        params: {
          working: newWorkingStatus,
        },
      });

      await loadWorkingDays();

      setSuccess(
        `${dayOfWeek} changed to ${
          newWorkingStatus ? "Working" : "Non-working"
        } successfully.`,
      );
    } catch (error) {
      console.error("Failed to update working day:", error);
      setError("Failed to update working day.");
    }
  };

  const formatTime = (dateTime) => {
    if (!dateTime) {
      return "-";
    }

    return new Date(dateTime).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatWorkingHours = (hours) => {
    if (hours === null || hours === undefined) {
      return "—";
    }

    const numericHours = Number(hours);

    if (!Number.isFinite(numericHours) || numericHours < 0) {
      return "—";
    }

    const totalMinutes = Math.round(numericHours * 60);
    const wholeHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    if (wholeHours === 0 && remainingMinutes === 0) {
      return "0 min";
    }

    if (wholeHours === 0) {
      return `${remainingMinutes} min`;
    }

    if (remainingMinutes === 0) {
      return `${wholeHours} hr`;
    }

    return `${wholeHours} hr ${remainingMinutes} min`;
  };

  return (
    <div className="attendance-page">
      <div className="attendance-page-header">
        <h1>Attendance Management</h1>
        <p>Manage and monitor employee attendance.</p>
      </div>

      <div className="attendance-tabs">
        <button
          type="button"
          className={activeSection === "records" ? "active" : ""}
          onClick={() => {
            setActiveSection("records");
            setError("");
            setSuccess("");
          }}
        >
          Attendance Records
        </button>

        <button
          type="button"
          className={activeSection === "workingDays" ? "active" : ""}
          onClick={handleWorkingDaysSection}
        >
          Working Days
        </button>
      </div>

      {activeSection === "records" && (
        <>
          <div className="attendance-card">
            <h2>Attendance Records</h2>
            <p>View and manage employee attendance records.</p>

            <div className="attendance-form">
              <div className="attendance-form-group">
                <label>Select Role</label>

                <select value={selectedRole} onChange={handleRoleChange}>
                  <option value="">Select Role</option>
                  <option value="HR">HR</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>

              <div className="attendance-form-group">
                <label>Select User</label>

                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  disabled={!selectedRole}
                >
                  <option value="">Select User</option>

                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="attendance-view-button"
                onClick={handleViewAttendance}
              >
                View Attendance
              </button>
            </div>

            {error && <p className="attendance-error">{error}</p>}

            {success && (
              <div className="attendance-success-notification">
                <span>✓</span>
                <span>{success}</span>
              </div>
            )}
          </div>

          {attendanceRecords.length > 0 && (
            <div className="attendance-records-card">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Attendance ID</th>
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceRecords.map((attendance) => (
                    <tr key={attendance.id}>
                      <td className="attendance-id">{attendance.id}</td>

                      <td>{attendance.attendanceDate || "-"}</td>

                      <td>{formatTime(attendance.checkInTime)}</td>

                      <td>{formatTime(attendance.checkOutTime)}</td>

                      <td>
                        {formatWorkingHours(attendance.totalWorkingHours)}
                      </td>

                      <td className="attendance-status">{attendance.status}</td>

                      <td className="attendance-actions">
                        {attendance.status === "PRESENT" && (
                          <button
                            type="button"
                            className="attendance-action-button"
                            onClick={() =>
                              handleChangeStatus(attendance.id, "ABSENT")
                            }
                          >
                            Mark Absent
                          </button>
                        )}

                        {attendance.status === "ABSENT" && (
                          <button
                            type="button"
                            className="attendance-action-button"
                            onClick={() =>
                              handleChangeStatus(attendance.id, "PRESENT")
                            }
                          >
                            Mark Present
                          </button>
                        )}

                        {attendance.status === "ON_LEAVE" && <span>-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {attendanceRecords.length === 0 && selectedUserId && !error && (
            <div className="attendance-empty-card">
              <p>No attendance records found for the selected user.</p>
            </div>
          )}
        </>
      )}

      {activeSection === "workingDays" && (
        <div className="attendance-card">
          <h2>Working Days</h2>
          <p>Configure organization working days.</p>

          {error && <p className="attendance-error">{error}</p>}

          {success && (
            <div className="attendance-success-notification">
              <span>✓</span>
              <span>{success}</span>
            </div>
          )}

          {workingDays.length > 0 && (
            <div className="working-days-list">
              {workingDays.map((day) => (
                <div className="working-day-row" key={day.id}>
                  <span className="working-day-name">{day.dayOfWeek}</span>

                  <span
                    className={
                      day.working
                        ? "working-day-status working"
                        : "working-day-status non-working"
                    }
                  >
                    {day.working ? "Working" : "Non-working"}
                  </span>

                  <button
                    type="button"
                    className="attendance-action-button"
                    onClick={() =>
                      handleChangeWorkingDay(day.dayOfWeek, day.working)
                    }
                  >
                    Change
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Attendance;
