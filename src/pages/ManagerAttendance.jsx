import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/ManagerAttendance.css";

const getManagerId = () => {
  const authData = JSON.parse(localStorage.getItem("authData") || "{}");
  return authData.userId;
};

const getToday = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(`${String(dateValue).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeValue) => {
  if (!timeValue) return "—";

  const value = String(timeValue);

  if (value.includes("T")) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  }

  return value;
};

const getStatus = (attendance) => {
  if (!attendance?.status) return "UNKNOWN";
  return String(attendance.status).toUpperCase();
};

const getStatusClass = (status) => {
  switch (status) {
    case "PRESENT":
      return "present";
    case "ABSENT":
      return "absent";
    case "ON_LEAVE":
      return "on-leave";
    default:
      return "unknown";
  }
};

const formatWorkingHours = (hours) => {
  if (hours === null || hours === undefined || hours === "") {
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

const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    return data.message || data.error || fallback;
  }

  return err?.message || fallback;
};

const ManagerAttendance = () => {
  // Team attendance
  const [teamMembers, setTeamMembers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamDate, setTeamDate] = useState("");

  // Personal attendance
  const [myAttendanceRecords, setMyAttendanceRecords] = useState([]);
  const [myAttendanceLoading, setMyAttendanceLoading] = useState(false);
  const [myAttendanceError, setMyAttendanceError] = useState("");
  const [myAttendanceSuccess, setMyAttendanceSuccess] = useState("");
  const [myAttendanceDate, setMyAttendanceDate] = useState("");
  const [attendanceActionLoading, setAttendanceActionLoading] = useState(false);

  // Attendance corrections
  const [correctionSearch, setCorrectionSearch] = useState("");
  const [correctionDate, setCorrectionDate] = useState("");
  const [correctionLoadingId, setCorrectionLoadingId] = useState(null);
  const [correctionError, setCorrectionError] = useState("");
  const [correctionSuccess, setCorrectionSuccess] = useState("");

  const [activeTab, setActiveTab] = useState("teamAttendance");

  const loadTeamAttendance = useCallback(async () => {
    setTeamLoading(true);
    setTeamError("");

    try {
      const managerId = getManagerId();

      if (!managerId) {
        throw new Error("Manager ID not found. Please log in again.");
      }

      const teamResponse = await api.get(`/managers/${managerId}/team`);

      const members = Array.isArray(teamResponse.data) ? teamResponse.data : [];

      setTeamMembers(members);

      const results = await Promise.allSettled(
        members.map(async (member) => {
          const response = await api.get(`/attendance/${member.id}`);

          return {
            member,
            records: Array.isArray(response.data) ? response.data : [],
          };
        }),
      );

      const combinedRecords = [];

      results.forEach((result) => {
        if (result.status !== "fulfilled") return;

        const { member, records } = result.value;

        records.forEach((attendance) => {
          combinedRecords.push({
            ...attendance,
            employeeId: member.id,
            employeeName:
              member.fullName ||
              member.name ||
              member.username ||
              `Employee ${member.id}`,
            employeeEmail: member.email || "",
          });
        });
      });

      combinedRecords.sort((a, b) =>
        String(b.attendanceDate || "").localeCompare(
          String(a.attendanceDate || ""),
        ),
      );

      setAttendanceRecords(combinedRecords);

      if (results.some((result) => result.status === "rejected")) {
        setTeamError(
          "Some team attendance records could not be loaded. " +
            "Check your access permissions or refresh.",
        );
      }
    } catch (err) {
      setTeamError(getErrorMessage(err, "Unable to load team attendance."));
    } finally {
      setTeamLoading(false);
    }
  }, []);

  const loadMyAttendance = useCallback(async () => {
    setMyAttendanceLoading(true);
    setMyAttendanceError("");

    try {
      const managerId = getManagerId();

      if (!managerId) {
        throw new Error("Manager ID not found. Please log in again.");
      }

      const response = await api.get(`/attendance/${managerId}`);

      const records = Array.isArray(response.data) ? [...response.data] : [];

      records.sort((a, b) =>
        String(b.attendanceDate || "").localeCompare(
          String(a.attendanceDate || ""),
        ),
      );

      setMyAttendanceRecords(records);
    } catch (err) {
      setMyAttendanceError(
        getErrorMessage(err, "Unable to load your attendance history."),
      );
    } finally {
      setMyAttendanceLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeamAttendance();
  }, [loadTeamAttendance]);

  const handleMyAttendanceAction = async (action) => {
    if (attendanceActionLoading) return;

    setAttendanceActionLoading(true);
    setMyAttendanceError("");
    setMyAttendanceSuccess("");

    try {
      // The existing backend endpoints do not require a request body.
      await api.post(`/attendance/${action}`);

      setMyAttendanceSuccess(
        action === "check-in"
          ? "Check-in recorded successfully."
          : "Check-out recorded successfully.",
      );

      await loadMyAttendance();
    } catch (err) {
      setMyAttendanceError(
        getErrorMessage(
          err,
          action === "check-in"
            ? "Unable to check in."
            : "Unable to check out.",
        ),
      );
    } finally {
      setAttendanceActionLoading(false);
    }
  };

  const handleAttendanceCorrection = async (record) => {
    const currentStatus = getStatus(record);

    if (!["PRESENT", "ABSENT"].includes(currentStatus)) {
      setCorrectionError(
        "Only PRESENT and ABSENT attendance statuses can be changed.",
      );
      return;
    }

    const newStatus = currentStatus === "PRESENT" ? "ABSENT" : "PRESENT";

    const confirmed = window.confirm(
      `Change ${record.employeeName}'s attendance on ` +
        `${formatDate(record.attendanceDate)} from ` +
        `${currentStatus} to ${newStatus}?`,
    );

    if (!confirmed) return;

    setCorrectionLoadingId(record.id);
    setCorrectionError("");
    setCorrectionSuccess("");

    try {
      await api.put(`/attendance/${record.id}/status`, null, {
        params: {
          newStatus,
        },
      });

      setCorrectionSuccess(
        `Attendance updated to ${newStatus} for ` + `${record.employeeName}.`,
      );

      await loadTeamAttendance();
    } catch (err) {
      setCorrectionError(
        getErrorMessage(
          err,
          "Unable to update attendance. Check your permissions.",
        ),
      );
    } finally {
      setCorrectionLoadingId(null);
    }
  };

  const filteredTeamRecords = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();

    return attendanceRecords.filter((record) => {
      const recordDate = String(record.attendanceDate || "").slice(0, 10);

      const matchesDate = !teamDate || recordDate === teamDate;

      const matchesSearch =
        !query ||
        String(record.employeeName || "")
          .toLowerCase()
          .includes(query) ||
        String(record.employeeId || "").includes(query) ||
        String(record.employeeEmail || "")
          .toLowerCase()
          .includes(query);

      return matchesDate && matchesSearch;
    });
  }, [attendanceRecords, teamSearch, teamDate]);

  const filteredMyRecords = useMemo(() => {
    return myAttendanceRecords.filter((record) => {
      const recordDate = String(record.attendanceDate || "").slice(0, 10);

      return !myAttendanceDate || recordDate === myAttendanceDate;
    });
  }, [myAttendanceRecords, myAttendanceDate]);

  const filteredCorrectionRecords = useMemo(() => {
    const query = correctionSearch.trim().toLowerCase();

    return attendanceRecords.filter((record) => {
      const recordDate = String(record.attendanceDate || "").slice(0, 10);

      const matchesDate = !correctionDate || recordDate === correctionDate;

      const matchesSearch =
        !query ||
        String(record.employeeName || "")
          .toLowerCase()
          .includes(query) ||
        String(record.employeeId || "").includes(query) ||
        String(record.employeeEmail || "")
          .toLowerCase()
          .includes(query);

      return matchesDate && matchesSearch;
    });
  }, [attendanceRecords, correctionSearch, correctionDate]);

  const presentCount = filteredTeamRecords.filter(
    (record) => getStatus(record) === "PRESENT",
  ).length;

  const absentCount = filteredTeamRecords.filter(
    (record) => getStatus(record) === "ABSENT",
  ).length;

  const onLeaveCount = filteredTeamRecords.filter(
    (record) => getStatus(record) === "ON_LEAVE",
  ).length;

  const todayRecord = myAttendanceRecords.find(
    (record) => String(record.attendanceDate || "").slice(0, 10) === getToday(),
  );

  const todayStatus = todayRecord ? getStatus(todayRecord) : "NOT CHECKED IN";

  const canCheckIn = !todayRecord && !attendanceActionLoading;

  const canCheckOut =
    Boolean(todayRecord?.checkInTime) &&
    !todayRecord?.checkOutTime &&
    !attendanceActionLoading;

  const refreshCurrentTab = () => {
    if (activeTab === "teamAttendance") {
      loadTeamAttendance();
    } else if (activeTab === "myAttendance") {
      setMyAttendanceSuccess("");
      loadMyAttendance();
    } else {
      loadTeamAttendance();
    }
  };

  const tabButtonStyle = (isActive) => ({
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    background: isActive ? "#2563eb" : "transparent",
    color: isActive ? "#ffffff" : "#64748b",
  });

  const actionButtonStyle = (background, disabled = false) => ({
    padding: "10px 16px",
    border: "none",
    borderRadius: "7px",
    background: disabled ? "#cbd5e1" : background,
    color: "#ffffff",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    marginRight: "8px",
    marginBottom: "8px",
  });

  return (
    <div className="manager-attendance-page">
      <div className="manager-attendance-header">
        <div>
          <h1>
            {activeTab === "teamAttendance"
              ? "Team Attendance"
              : activeTab === "myAttendance"
                ? "My Attendance"
                : "Attendance Corrections"}
          </h1>

          <p>
            {activeTab === "teamAttendance"
              ? "View attendance records for employees assigned to your team."
              : activeTab === "myAttendance"
                ? "Manage your daily attendance and view your attendance history."
                : "Review and correct attendance records for your assigned team."}
          </p>
        </div>

        <button
          type="button"
          className="manager-attendance-refresh"
          onClick={refreshCurrentTab}
          disabled={
            teamLoading || myAttendanceLoading || attendanceActionLoading
          }
        >
          ↻ Refresh
        </button>
      </div>

      {/* Attendance tabs */}
      <div
        className="manager-attendance-tabs"
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          padding: "8px",
        }}
      >
        <button
          type="button"
          style={tabButtonStyle(activeTab === "teamAttendance")}
          onClick={() => setActiveTab("teamAttendance")}
        >
          Team Attendance
        </button>

        <button
          type="button"
          style={tabButtonStyle(activeTab === "myAttendance")}
          onClick={() => {
            setActiveTab("myAttendance");
            setMyAttendanceSuccess("");
            loadMyAttendance();
          }}
        >
          My Attendance
        </button>

        <button
          type="button"
          style={tabButtonStyle(activeTab === "attendanceCorrections")}
          onClick={() => {
            setActiveTab("attendanceCorrections");
            setCorrectionError("");
            setCorrectionSuccess("");
            loadTeamAttendance();
          }}
        >
          Attendance Corrections
        </button>
      </div>

      {/* ===================================================== */}
      {/* TAB 1: TEAM ATTENDANCE                                */}
      {/* ===================================================== */}

      {activeTab === "teamAttendance" && (
        <>
          <div className="manager-attendance-summary">
            <div className="manager-attendance-summary-card">
              <span>Total Records</span>
              <strong>{filteredTeamRecords.length}</strong>
            </div>

            <div className="manager-attendance-summary-card present-card">
              <span>Present</span>
              <strong>{presentCount}</strong>
            </div>

            <div className="manager-attendance-summary-card absent-card">
              <span>Absent</span>
              <strong>{absentCount}</strong>
            </div>

            <div className="manager-attendance-summary-card leave-card">
              <span>On Leave</span>
              <strong>{onLeaveCount}</strong>
            </div>
          </div>

          <div className="manager-attendance-filters">
            <div className="manager-attendance-search">
              <label htmlFor="team-attendance-search">Search Employees</label>

              <input
                id="team-attendance-search"
                type="text"
                placeholder="Search by name, ID, or email..."
                value={teamSearch}
                onChange={(event) => setTeamSearch(event.target.value)}
              />
            </div>

            <div className="manager-attendance-date-filter">
              <label htmlFor="team-attendance-date">Attendance Date</label>

              <input
                id="team-attendance-date"
                type="date"
                value={teamDate}
                onChange={(event) => setTeamDate(event.target.value)}
              />

              {teamDate && (
                <button type="button" onClick={() => setTeamDate("")}>
                  Clear Date Filter
                </button>
              )}
            </div>
          </div>

          {teamError && (
            <div className="manager-attendance-error" role="alert">
              <span>{teamError}</span>

              <button type="button" onClick={loadTeamAttendance}>
                Try Again
              </button>
            </div>
          )}

          <div className="manager-attendance-table-card">
            <div className="manager-attendance-table-header">
              <div>
                <h2>Team Attendance Records</h2>
                <p>
                  {filteredTeamRecords.length} record
                  {filteredTeamRecords.length === 1 ? "" : "s"} found
                </p>
              </div>
            </div>

            {teamLoading ? (
              <div className="manager-attendance-state">
                <div className="manager-attendance-spinner" />
                <p>Loading team attendance...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="manager-attendance-state">
                <h3>No Team Members Found</h3>
                <p>No employees are currently assigned to your team.</p>
              </div>
            ) : filteredTeamRecords.length === 0 ? (
              <div className="manager-attendance-state">
                <h3>No Attendance Records</h3>
                <p>No records match the selected date and search.</p>
              </div>
            ) : (
              <div className="manager-attendance-table-wrapper">
                <table className="manager-attendance-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Employee ID</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Working Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTeamRecords.map((record) => {
                      const status = getStatus(record);

                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="manager-attendance-employee">
                              <div className="manager-attendance-avatar">
                                {String(record.employeeName || "E")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>{record.employeeName}</strong>

                                {record.employeeEmail && (
                                  <small>{record.employeeEmail}</small>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>{record.employeeId}</td>
                          <td>{formatDate(record.attendanceDate)}</td>
                          <td>{formatTime(record.checkInTime)}</td>
                          <td>{formatTime(record.checkOutTime)}</td>

                          <td>
                            {formatWorkingHours(record.totalWorkingHours)}
                          </td>

                          <td>
                            <span
                              className={
                                "manager-attendance-status " +
                                getStatusClass(status)
                              }
                            >
                              {status.replaceAll("_", " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================================================== */}
      {/* TAB 2: MY ATTENDANCE                                  */}
      {/* ===================================================== */}

      {activeTab === "myAttendance" && (
        <>
          <div className="manager-attendance-summary">
            <div className="manager-attendance-summary-card">
              <span>Today's Status</span>
              <strong style={{ fontSize: "18px" }}>
                {todayStatus.replaceAll("_", " ")}
              </strong>
            </div>

            <div className="manager-attendance-summary-card">
              <span>Check In</span>
              <strong style={{ fontSize: "20px" }}>
                {formatTime(todayRecord?.checkInTime)}
              </strong>
            </div>

            <div className="manager-attendance-summary-card">
              <span>Check Out</span>
              <strong style={{ fontSize: "20px" }}>
                {formatTime(todayRecord?.checkOutTime)}
              </strong>
            </div>

            <div className="manager-attendance-summary-card">
              <span>Working Hours</span>
              <strong style={{ fontSize: "20px" }}>
                {formatWorkingHours(todayRecord?.totalWorkingHours)}
              </strong>
            </div>
          </div>

          <div
            className="manager-attendance-table-card"
            style={{ padding: "22px", marginBottom: "24px" }}
          >
            <h2>Today's Attendance</h2>

            <p>Record your attendance using the buttons below.</p>

            <div style={{ marginTop: "18px" }}>
              <button
                type="button"
                style={actionButtonStyle("#16a34a", !canCheckIn)}
                disabled={!canCheckIn}
                onClick={() => handleMyAttendanceAction("check-in")}
              >
                {attendanceActionLoading ? "Processing..." : "Check In"}
              </button>

              <button
                type="button"
                style={actionButtonStyle("#2563eb", !canCheckOut)}
                disabled={!canCheckOut}
                onClick={() => handleMyAttendanceAction("check-out")}
              >
                {attendanceActionLoading ? "Processing..." : "Check Out"}
              </button>
            </div>

            {!todayRecord && (
              <p>You have no attendance record for today yet.</p>
            )}

            {todayRecord?.checkInTime && !todayRecord?.checkOutTime && (
              <p>
                You have checked in. Remember to check out when your workday
                ends.
              </p>
            )}

            {todayRecord?.checkOutTime && (
              <p>Your check-out has already been recorded for today.</p>
            )}

            {myAttendanceSuccess && (
              <div
                className="manager-attendance-success"
                role="status"
                style={{ marginTop: "12px", color: "#15803d" }}
              >
                {myAttendanceSuccess}
              </div>
            )}

            {myAttendanceError && (
              <div
                className="manager-attendance-error"
                role="alert"
                style={{ marginTop: "12px" }}
              >
                {myAttendanceError}
              </div>
            )}
          </div>

          <div className="manager-attendance-filters">
            <div className="manager-attendance-date-filter">
              <label htmlFor="my-attendance-date">
                Filter Attendance by Date
              </label>

              <input
                id="my-attendance-date"
                type="date"
                value={myAttendanceDate}
                onChange={(event) => setMyAttendanceDate(event.target.value)}
              />

              {myAttendanceDate && (
                <button type="button" onClick={() => setMyAttendanceDate("")}>
                  Clear Date Filter
                </button>
              )}
            </div>
          </div>

          <div className="manager-attendance-table-card">
            <div className="manager-attendance-table-header">
              <div>
                <h2>My Attendance History</h2>
                <p>
                  {filteredMyRecords.length} record
                  {filteredMyRecords.length === 1 ? "" : "s"} found
                </p>
              </div>
            </div>

            {myAttendanceLoading ? (
              <div className="manager-attendance-state">
                <div className="manager-attendance-spinner" />
                <p>Loading your attendance...</p>
              </div>
            ) : myAttendanceError ? (
              <div className="manager-attendance-state">
                <h3>Unable to Load Attendance</h3>
                <p>{myAttendanceError}</p>
              </div>
            ) : filteredMyRecords.length === 0 ? (
              <div className="manager-attendance-state">
                <h3>No Attendance Records</h3>
                <p>No personal attendance records match the selected date.</p>
              </div>
            ) : (
              <div className="manager-attendance-table-wrapper">
                <table className="manager-attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Working Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMyRecords.map((record) => {
                      const status = getStatus(record);

                      return (
                        <tr key={record.id}>
                          <td>{formatDate(record.attendanceDate)}</td>
                          <td>{formatTime(record.checkInTime)}</td>
                          <td>{formatTime(record.checkOutTime)}</td>

                          <td>
                            {formatWorkingHours(record.totalWorkingHours)}
                          </td>

                          <td>
                            <span
                              className={
                                "manager-attendance-status " +
                                getStatusClass(status)
                              }
                            >
                              {status.replaceAll("_", " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================================================== */}
      {/* TAB 3: ATTENDANCE CORRECTIONS                         */}
      {/* ===================================================== */}

      {activeTab === "attendanceCorrections" && (
        <>
          {correctionSuccess && (
            <div
              className="manager-attendance-success"
              role="status"
              style={{ marginBottom: "16px", color: "#15803d" }}
            >
              {correctionSuccess}
            </div>
          )}

          {correctionError && (
            <div
              className="manager-attendance-error"
              role="alert"
              style={{ marginBottom: "16px" }}
            >
              {correctionError}
            </div>
          )}

          <div className="manager-attendance-filters">
            <div className="manager-attendance-search">
              <label htmlFor="correction-search">Search Employees</label>

              <input
                id="correction-search"
                type="text"
                placeholder="Search by name, ID, or email..."
                value={correctionSearch}
                onChange={(event) => setCorrectionSearch(event.target.value)}
              />
            </div>

            <div className="manager-attendance-date-filter">
              <label htmlFor="correction-date">Attendance Date</label>

              <input
                id="correction-date"
                type="date"
                value={correctionDate}
                onChange={(event) => setCorrectionDate(event.target.value)}
              />

              {correctionDate && (
                <button type="button" onClick={() => setCorrectionDate("")}>
                  Clear Date Filter
                </button>
              )}
            </div>
          </div>

          {teamLoading ? (
            <div className="manager-attendance-state">
              <div className="manager-attendance-spinner" />
              <p>Loading attendance records...</p>
            </div>
          ) : teamError ? (
            <div className="manager-attendance-state">
              <p>{teamError}</p>
              <button type="button" onClick={loadTeamAttendance}>
                Try Again
              </button>
            </div>
          ) : filteredCorrectionRecords.length === 0 ? (
            <div className="manager-attendance-state">
              <h3>No Attendance Records</h3>
              <p>No records match your search and date filters.</p>
            </div>
          ) : (
            <div className="manager-attendance-table-card">
              <div className="manager-attendance-table-header">
                <div>
                  <h2>Correct Attendance Records</h2>
                  <p>
                    {filteredCorrectionRecords.length} record
                    {filteredCorrectionRecords.length === 1 ? "" : "s"} found
                  </p>
                </div>
              </div>

              <div className="manager-attendance-table-wrapper">
                <table className="manager-attendance-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Employee ID</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Working Hours</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCorrectionRecords.map((record) => {
                      const status = getStatus(record);

                      const canCorrect = ["PRESENT", "ABSENT"].includes(status);

                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="manager-attendance-employee">
                              <div className="manager-attendance-avatar">
                                {String(record.employeeName || "E")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>{record.employeeName}</strong>

                                {record.employeeEmail && (
                                  <small>{record.employeeEmail}</small>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>{record.employeeId}</td>
                          <td>{formatDate(record.attendanceDate)}</td>
                          <td>{formatTime(record.checkInTime)}</td>
                          <td>{formatTime(record.checkOutTime)}</td>

                          <td>
                            {formatWorkingHours(record.totalWorkingHours)}
                          </td>

                          <td>
                            <span
                              className={
                                "manager-attendance-status " +
                                getStatusClass(status)
                              }
                            >
                              {status.replaceAll("_", " ")}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              style={actionButtonStyle(
                                "#d97706",
                                !canCorrect ||
                                  correctionLoadingId === record.id,
                              )}
                              disabled={
                                !canCorrect || correctionLoadingId === record.id
                              }
                              onClick={() => handleAttendanceCorrection(record)}
                            >
                              {correctionLoadingId === record.id
                                ? "Updating..."
                                : "Change Status"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManagerAttendance;
