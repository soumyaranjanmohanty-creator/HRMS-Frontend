import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/EmployeeAttendance.css";

function EmployeeAttendance() {
  const [activeTab, setActiveTab] = useState("overview");

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const getEmployeeId = () => {
    try {
      const authData = JSON.parse(localStorage.getItem("authData") || "null");

      return authData?.userId || null;
    } catch {
      return null;
    }
  };

  const getStatus = (record) => {
    return String(record?.status || "NOT RECORDED").toUpperCase();
  };

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const employeeId = getEmployeeId();

      if (!employeeId) {
        setRecords([]);
        setError("Employee ID not found. Please log in again.");
        return;
      }

      const response = await api.get(`/attendance/${employeeId}`);

      const data = response.data;
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load attendance:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load attendance records. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const getToday = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = String(dateValue).slice(0, 10);

    const parts = date.split("-");

    if (parts.length !== 3) return dateValue;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return "—";

    const value = String(timeValue);

    const match = value.match(/^(\d{1,2}):(\d{2})/);

    if (!match) return value;

    let hours = Number(match[1]);
    const minutes = match[2];

    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
  };

  const formatHours = (value) => {
    const hours = Number(value);

    if (!Number.isFinite(hours) || hours <= 0) {
      return "0 minutes";
    }

    const totalMinutes = Math.round(hours * 60);
    const wholeHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    const parts = [];

    if (wholeHours > 0) {
      parts.push(`${wholeHours} ${wholeHours === 1 ? "hour" : "hours"}`);
    }

    if (remainingMinutes > 0) {
      parts.push(
        `${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}`,
      );
    }

    return parts.length > 0 ? parts.join(" ") : "0 minutes";
  };

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const today = getToday();

  const todayRecord = useMemo(() => {
    return records.find(
      (record) => String(record.attendanceDate || "").slice(0, 10) === today,
    );
  }, [records, today]);

  const todayStatus = todayRecord ? getStatus(todayRecord) : "NOT RECORDED";

  const hasCheckedIn = Boolean(todayRecord?.checkInTime);
  const hasCheckedOut = Boolean(todayRecord?.checkOutTime);

  const totalRecords = records.length;

  const presentDays = records.filter(
    (record) => getStatus(record) === "PRESENT",
  ).length;

  const absentDays = records.filter(
    (record) => getStatus(record) === "ABSENT",
  ).length;

  const leaveDays = records.filter(
    (record) => getStatus(record) === "ON_LEAVE",
  ).length;

  const handleAttendanceAction = async (action) => {
    if (actionLoading) return;

    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      // Existing backend endpoints do not require a request body.
      await api.post(`/attendance/${action}`);

      setSuccess(
        action === "check-in"
          ? "Your check-in has been recorded successfully."
          : "Your check-out has been recorded successfully.",
      );

      await loadAttendance();
    } catch (err) {
      console.error(`Attendance ${action} failed:`, err);

      setError(
        err.response?.data?.message ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : action === "check-in"
              ? "Unable to check in. Please check your attendance status."
              : "Unable to check out. Please check your attendance status."),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const recordDate = String(record.attendanceDate || "").slice(0, 10);

      const matchesDate = !selectedDate || recordDate === selectedDate;

      const matchesMonth =
        !selectedMonth || recordDate.startsWith(selectedMonth);

      return matchesDate && matchesMonth;
    });
  }, [records, selectedDate, selectedMonth]);

  const resetFilters = () => {
    setSelectedDate("");
    setSelectedMonth("");
  };

  const renderStatus = (status) => (
    <span
      className={`employee-attendance-status status-${String(status)
        .toLowerCase()
        .replace(/_/g, "-")}`}
    >
      {String(status).replace(/_/g, " ")}
    </span>
  );

  return (
    <div className="employee-attendance-page">
      {/* Page Header */}
      <header className="employee-attendance-header">
        <div>
          <p className="employee-attendance-eyebrow">EMPLOYEE PORTAL</p>
          <h1>My Attendance</h1>
          <p className="employee-attendance-subtitle">
            Record your daily attendance and review your attendance history.
          </p>
        </div>

        <button
          type="button"
          className="employee-attendance-refresh"
          onClick={loadAttendance}
          disabled={loading}
        >
          ↻ {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* Feedback */}
      {error && (
        <div
          className="employee-attendance-alert attendance-alert-error"
          role="alert"
        >
          <span>{error}</span>

          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {success && (
        <div
          className="employee-attendance-alert attendance-alert-success"
          role="status"
        >
          <span>{success}</span>

          <button type="button" onClick={() => setSuccess("")}>
            ×
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section className="employee-attendance-summary">
        <article className="attendance-summary-card">
          <div className="attendance-summary-icon icon-blue">▤</div>
          <div>
            <span>Total Records</span>
            <strong>{totalRecords}</strong>
          </div>
        </article>

        <article className="attendance-summary-card">
          <div className="attendance-summary-icon icon-green">✓</div>
          <div>
            <span>Present Days</span>
            <strong>{presentDays}</strong>
          </div>
        </article>

        <article className="attendance-summary-card">
          <div className="attendance-summary-icon icon-red">!</div>
          <div>
            <span>Absent Days</span>
            <strong>{absentDays}</strong>
          </div>
        </article>

        <article className="attendance-summary-card">
          <div className="attendance-summary-icon icon-orange">◷</div>
          <div>
            <span>Leave Days</span>
            <strong>{leaveDays}</strong>
          </div>
        </article>
      </section>

      {/* Tabs */}
      <section className="employee-attendance-content">
        <nav
          className="employee-attendance-tabs"
          aria-label="Attendance sections"
        >
          <button
            type="button"
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>

          <button
            type="button"
            className={activeTab === "daily" ? "active" : ""}
            onClick={() => setActiveTab("daily")}
          >
            Daily Attendance
          </button>

          <button
            type="button"
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            Attendance History
          </button>
        </nav>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="employee-attendance-tab-content">
            <div className="attendance-section-heading">
              <div>
                <h2>Today's Attendance</h2>
                <p>{formatDate(today)}</p>
              </div>

              {renderStatus(todayStatus)}
            </div>

            {loading ? (
              <div className="attendance-empty-state">
                Loading attendance information...
              </div>
            ) : (
              <>
                <div className="attendance-today-grid">
                  <article className="attendance-time-card">
                    <span className="attendance-time-icon">↗</span>
                    <p>Check-in Time</p>
                    <strong>{formatTime(todayRecord?.checkInTime)}</strong>
                  </article>

                  <article className="attendance-time-card">
                    <span className="attendance-time-icon">↙</span>
                    <p>Check-out Time</p>
                    <strong>{formatTime(todayRecord?.checkOutTime)}</strong>
                  </article>

                  <article className="attendance-time-card">
                    <span className="attendance-time-icon">◷</span>
                    <p>Working Hours</p>
                    <strong>
                      {formatHours(todayRecord?.totalWorkingHours)}
                    </strong>
                  </article>
                </div>

                <div className="attendance-overview-note">
                  <strong>Attendance summary</strong>
                  <p>
                    Your attendance status and recorded times are displayed
                    here.
                  </p>
                </div>

                <div className="attendance-recent-heading">
                  <h3>Recent Attendance</h3>

                  <button type="button" onClick={() => setActiveTab("history")}>
                    View Full History →
                  </button>
                </div>

                {records.length === 0 ? (
                  <div className="attendance-empty-state">
                    No attendance records found.
                  </div>
                ) : (
                  <div className="attendance-table-wrapper">
                    <table className="employee-attendance-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Working Hours</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {records.slice(0, 5).map((record) => (
                          <tr key={record.id}>
                            <td>{formatDate(record.attendanceDate)}</td>
                            <td>{formatTime(record.checkInTime)}</td>
                            <td>{formatTime(record.checkOutTime)}</td>
                            <td>{formatHours(record.totalWorkingHours)}</td>
                            <td>{renderStatus(getStatus(record))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: DAILY ATTENDANCE */}
        {activeTab === "daily" && (
          <div className="employee-attendance-tab-content">
            <div className="attendance-section-heading">
              <div>
                <h2>Daily Attendance</h2>
                <p>Record your arrival and departure times.</p>
              </div>

              {renderStatus(todayStatus)}
            </div>

            <div className="attendance-daily-card">
              <div className="attendance-daily-date">
                <span>Today's Date</span>
                <strong>{formatDate(today)}</strong>
              </div>

              <div className="attendance-daily-times">
                <div>
                  <span>Check-in</span>
                  <strong>{formatTime(todayRecord?.checkInTime)}</strong>
                </div>

                <div>
                  <span>Check-out</span>
                  <strong>{formatTime(todayRecord?.checkOutTime)}</strong>
                </div>
              </div>

              <div className="attendance-action-buttons">
                <button
                  type="button"
                  className="attendance-check-in-button"
                  onClick={() => handleAttendanceAction("check-in")}
                  disabled={
                    loading ||
                    actionLoading ||
                    hasCheckedIn ||
                    hasCheckedOut ||
                    todayStatus === "ABSENT" ||
                    todayStatus === "ON_LEAVE"
                  }
                >
                  {actionLoading
                    ? "Processing..."
                    : hasCheckedIn
                      ? "Checked In"
                      : "Check In"}
                </button>

                <button
                  type="button"
                  className="attendance-check-out-button"
                  onClick={() => handleAttendanceAction("check-out")}
                  disabled={
                    loading ||
                    actionLoading ||
                    !hasCheckedIn ||
                    hasCheckedOut ||
                    todayStatus === "ABSENT" ||
                    todayStatus === "ON_LEAVE"
                  }
                >
                  {actionLoading
                    ? "Processing..."
                    : hasCheckedOut
                      ? "Checked Out"
                      : "Check Out"}
                </button>
              </div>

              {hasCheckedOut && (
                <p className="attendance-complete-message">
                  Your check-in and check-out have both been recorded for today.
                </p>
              )}
            </div>

            <div className="attendance-overview-note">
              <strong>Important</strong>
              <p>
                Attendance is recorded . If an action is rejected, read the
                error message and check your attendance status before trying
                again.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: ATTENDANCE HISTORY */}
        {activeTab === "history" && (
          <div className="employee-attendance-tab-content">
            <div className="attendance-section-heading">
              <div>
                <h2>Attendance History</h2>
                <p>Review your recorded attendance by date or month.</p>
              </div>
            </div>

            <div className="attendance-history-filters">
              <div>
                <label htmlFor="attendance-filter-date">Search by Date</label>

                <input
                  id="attendance-filter-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setSelectedMonth("");
                  }}
                />
              </div>

              <div>
                <label htmlFor="attendance-filter-month">Search by Month</label>

                <input
                  id="attendance-filter-month"
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => {
                    setSelectedMonth(event.target.value);
                    setSelectedDate("");
                  }}
                />
              </div>

              <button
                type="button"
                className="attendance-reset-button"
                onClick={resetFilters}
              >
                Clear Filters
              </button>
            </div>

            <div className="attendance-history-result">
              {filteredRecords.length} record(s) found
            </div>

            {loading ? (
              <div className="attendance-empty-state">
                Loading attendance history...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="attendance-empty-state">
                No attendance records match the selected filters.
              </div>
            ) : (
              <div className="attendance-table-wrapper">
                <table className="employee-attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Working Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{formatDate(record.attendanceDate)}</td>
                        <td>{formatTime(record.checkInTime)}</td>
                        <td>{formatTime(record.checkOutTime)}</td>
                        <td>{formatHours(record.totalWorkingHours)}</td>
                        <td>{renderStatus(getStatus(record))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default EmployeeAttendance;
