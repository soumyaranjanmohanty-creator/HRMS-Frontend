import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/HRAttendanceManagement.css";

function HRAttendanceManagement() {
  const [activeTab, setActiveTab] = useState("myAttendance");

  const [userId, setUserId] = useState(null);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myAttendanceDate, setMyAttendanceDate] = useState("");

  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [recordsAttendanceDate, setRecordsAttendanceDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem("authData") || "null");

    if (!authData?.userId) {
      setError("User information not found. Please log in again.");
      return;
    }

    setUserId(authData.userId);
  }, []);

  useEffect(() => {
    if (userId !== null) {
      loadMyAttendance();
    }
  }, [userId]);

  const formatTime = (dateTime) => {
    if (!dateTime) {
      return "—";
    }

    const time = new Date(dateTime);

    if (Number.isNaN(time.getTime())) {
      return "—";
    }

    return time.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return date;
  };

  const loadMyAttendance = async () => {
    if (userId === null) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/attendance/${userId}`);

      const records = Array.isArray(response.data) ? response.data : [];

      setMyAttendance(
        records.sort(
          (a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate),
        ),
      );
    } catch (err) {
      console.error("Failed to load personal attendance:", err);

      setError(
        err.response?.data?.message ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : "Failed to load your attendance history."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceAction = async (action) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await api.post(`/attendance/${action}`);

      setSuccess(
        typeof response.data === "string"
          ? response.data
          : action === "check-in"
            ? "Check-in successful."
            : "Check-out successful.",
      );

      await loadMyAttendance();
    } catch (err) {
      console.error(`Failed to ${action}:`, err);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message ||
              `Unable to ${action}. Please try again.`,
      );
    } finally {
      setActionLoading(false);
    }
  };

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
      setLoading(true);

      const response = await api.get(`/users/role/${role}`);

      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load users:", err);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Failed to load users for the selected role.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = async () => {
    if (!selectedUserId) {
      setError("Please select a user.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await api.get(`/attendance/${selectedUserId}`);

      const records = Array.isArray(response.data) ? response.data : [];

      setAttendanceRecords(
        records.sort(
          (a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate),
        ),
      );

      if (records.length === 0) {
        setSuccess("No attendance records found for this user.");
      }
    } catch (err) {
      console.error("Failed to load attendance records:", err);

      setAttendanceRecords([]);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || "Failed to load attendance records.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (attendanceId, newStatus) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await api.put(`/attendance/${attendanceId}/status`, null, {
        params: {
          newStatus,
        },
      });

      setSuccess(`Attendance status changed to ${newStatus} successfully.`);

      await handleViewAttendance();
    } catch (err) {
      console.error("Failed to change attendance status:", err);

      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message ||
              "Failed to change attendance status.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getTodayAttendance = () => {
    const today = new Date().toLocaleDateString("en-CA");

    return myAttendance.find((record) => record.attendanceDate === today);
  };

  const filteredMyAttendance = myAttendance.filter((record) => {
    if (!myAttendanceDate) return true;

    return (
      String(record.attendanceDate || "").slice(0, 10) === myAttendanceDate
    );
  });

  const filteredAttendanceRecords = attendanceRecords.filter((record) => {
    if (!recordsAttendanceDate) return true;

    return (
      String(record.attendanceDate || "").slice(0, 10) === recordsAttendanceDate
    );
  });

  const todayAttendance = getTodayAttendance();

  const renderAttendanceTable = (records, showActions = false) => (
    <div className="hr-attendance-records-card">
      <div className="hr-attendance-table-wrapper">
        <table className="hr-attendance-table">
          <thead>
            <tr>
              <th>Attendance ID</th>
              <th>Date</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Working Hours</th>
              <th>Status</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {records.map((attendance) => (
              <tr key={attendance.id}>
                <td className="hr-attendance-id">{attendance.id}</td>

                <td>{formatDate(attendance.attendanceDate)}</td>

                <td>{formatTime(attendance.checkInTime)}</td>

                <td>{formatTime(attendance.checkOutTime)}</td>

                <td>{formatWorkingHours(attendance.totalWorkingHours)}</td>

                <td>
                  <span
                    className={`hr-attendance-status hr-attendance-status-${String(
                      attendance.status || "",
                    ).toLowerCase()}`}
                  >
                    {attendance.status || "—"}
                  </span>
                </td>

                {showActions && (
                  <td>
                    <div className="hr-attendance-actions">
                      {attendance.status === "PRESENT" && (
                        <button
                          type="button"
                          className="hr-attendance-action-button"
                          disabled={loading}
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
                          className="hr-attendance-action-button"
                          disabled={loading}
                          onClick={() =>
                            handleChangeStatus(attendance.id, "PRESENT")
                          }
                        >
                          Mark Present
                        </button>
                      )}

                      {attendance.status === "ON_LEAVE" && "—"}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {records.length === 0 && (
        <div className="hr-attendance-empty">No attendance records found.</div>
      )}
    </div>
  );

  return (
    <div className="hr-attendance-page">
      <header className="hr-attendance-page-header">
        <div>
          <h1>Attendance Management</h1>
          <p>Manage your attendance and monitor workforce attendance.</p>
        </div>
      </header>

      <div className="hr-attendance-tabs">
        <button
          type="button"
          className={activeTab === "myAttendance" ? "active" : ""}
          onClick={() => {
            setActiveTab("myAttendance");
            setError("");
            setSuccess("");
          }}
        >
          My Attendance
        </button>

        <button
          type="button"
          className={activeTab === "records" ? "active" : ""}
          onClick={() => {
            setActiveTab("records");
            setError("");
            setSuccess("");
          }}
        >
          Attendance Records
        </button>
      </div>

      {error && (
        <div className="hr-attendance-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="hr-attendance-success" role="status">
          ✓ {success}
        </div>
      )}

      {activeTab === "myAttendance" && (
        <>
          <section className="hr-attendance-card">
            <h2>My Attendance</h2>
            <p>Mark your attendance when you arrive at and leave the office.</p>

            <div className="hr-attendance-today">
              <div>
                <span className="hr-attendance-label">Today's Date</span>
                <strong>
                  {new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </div>

              <div>
                <span className="hr-attendance-label">Check-in</span>
                <strong>{formatTime(todayAttendance?.checkInTime)}</strong>
              </div>

              <div>
                <span className="hr-attendance-label">Check-out</span>
                <strong>{formatTime(todayAttendance?.checkOutTime)}</strong>
              </div>

              <div>
                <span className="hr-attendance-label">Status</span>
                <strong>{todayAttendance?.status || "Not marked"}</strong>
              </div>
            </div>

            <div className="hr-attendance-button-group">
              <button
                type="button"
                className="hr-attendance-checkin-button"
                disabled={actionLoading || loading || Boolean(todayAttendance)}
                onClick={() => handleAttendanceAction("check-in")}
              >
                {actionLoading ? "Processing..." : "Check In"}
              </button>

              <button
                type="button"
                className="hr-attendance-checkout-button"
                disabled={
                  actionLoading ||
                  loading ||
                  !todayAttendance?.checkInTime ||
                  Boolean(todayAttendance?.checkOutTime)
                }
                onClick={() => handleAttendanceAction("check-out")}
              >
                {actionLoading ? "Processing..." : "Check Out"}
              </button>

              <button
                type="button"
                className="hr-attendance-refresh-button"
                disabled={loading || actionLoading}
                onClick={loadMyAttendance}
              >
                Refresh
              </button>
            </div>
          </section>

          <section className="hr-attendance-section">
            <div className="hr-attendance-section-header">
              <div>
                <h2>My Attendance History</h2>
                <p>Review your recorded attendance history.</p>
              </div>
            </div>

            <div className="hr-attendance-date-search">
              <div className="hr-attendance-date-search-info">
                <span className="hr-attendance-date-search-icon">📅</span>

                <div>
                  <h3>Filter Attendance History</h3>
                  <p>
                    Select a date to view your attendance records for that day.
                  </p>
                </div>
              </div>

              <div className="hr-attendance-date-search-controls">
                <div className="hr-attendance-date-input-group">
                  <label htmlFor="myAttendanceDate">Attendance Date</label>

                  <input
                    id="myAttendanceDate"
                    type="date"
                    value={myAttendanceDate}
                    onChange={(event) =>
                      setMyAttendanceDate(event.target.value)
                    }
                  />
                </div>

                {myAttendanceDate && (
                  <button
                    type="button"
                    className="hr-attendance-date-clear"
                    onClick={() => setMyAttendanceDate("")}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="hr-attendance-empty">
                Loading attendance history...
              </div>
            ) : (
              renderAttendanceTable(filteredMyAttendance)
            )}
          </section>
        </>
      )}

      {activeTab === "records" && (
        <>
          <section className="hr-attendance-card">
            <h2>Attendance Records</h2>
            <p>View attendance records for Managers and Employees.</p>

            <div className="hr-attendance-form">
              <div className="hr-attendance-form-group">
                <label htmlFor="hrAttendanceRole">Select Role</label>

                <select
                  id="hrAttendanceRole"
                  value={selectedRole}
                  onChange={handleRoleChange}
                >
                  <option value="">Select Role</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>

              <div className="hr-attendance-form-group">
                <label htmlFor="hrAttendanceUser">Select User</label>

                <select
                  id="hrAttendanceUser"
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  disabled={!selectedRole || loading}
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
                className="hr-attendance-view-button"
                onClick={handleViewAttendance}
                disabled={loading}
              >
                {loading ? "Loading..." : "View Attendance"}
              </button>
            </div>
          </section>

          {selectedUserId && (
            <div className="hr-attendance-date-search">
              <div className="hr-attendance-date-search-info">
                <span className="hr-attendance-date-search-icon">📅</span>
                <div>
                  <h3>Filter Attendance History</h3>
                  <p>
                    Select a date to view your attendance records for that day.
                  </p>
                </div>
              </div>

              <div className="hr-attendance-date-search-controls">
                <div className="hr-attendance-date-input-group">
                  <label htmlFor="recordsAttendanceDate">Attendance Date</label>
                  <input
                    id="recordsAttendanceDate"
                    type="date"
                    value={recordsAttendanceDate}
                    onChange={(event) =>
                      setRecordsAttendanceDate(event.target.value)
                    }
                  />
                </div>

                {recordsAttendanceDate && (
                  <button
                    type="button"
                    className="hr-attendance-date-clear"
                    onClick={() => setRecordsAttendanceDate("")}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="hr-attendance-empty">
              Loading attendance records...
            </div>
          ) : (
            selectedUserId &&
            renderAttendanceTable(filteredAttendanceRecords, true)
          )}
        </>
      )}
    </div>
  );
}

export default HRAttendanceManagement;
