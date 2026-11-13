import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/admin-dashboard.css";
import "../styles/ManagerDashboard.css";
import "../styles/ManagerTeam.css";

function ManagerTeam() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const loadTeamMembers = async () => {
    setLoading(true);
    setError("");

    try {
      const authData = JSON.parse(localStorage.getItem("authData") || "{}");

      const managerId = authData.userId;

      if (!managerId) {
        throw new Error(
          "Manager account information was not found. Please log in again.",
        );
      }

      const response = await api.get(`/managers/${managerId}/team`);

      setTeamMembers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your team. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationData = async () => {
    try {
      const [departmentResponse, designationResponse] = await Promise.all([
        api.get("/departments"),
        api.get("/designations"),
      ]);

      setDepartments(
        Array.isArray(departmentResponse.data) ? departmentResponse.data : [],
      );

      setDesignations(
        Array.isArray(designationResponse.data) ? designationResponse.data : [],
      );
    } catch (err) {
      console.error("Failed to load departments and designations:", err);
    }
  };

  const loadEmployeeProfile = async (employeeId) => {
    setProfileLoading(true);
    setProfileError("");
    setSelectedEmployee(null);

    try {
      const response = await api.get(`/users/${employeeId}`);
      setSelectedEmployee(response.data);
    } catch (err) {
      setProfileError(
        err.response?.data?.message ||
          "Unable to load this employee's profile. Please try again.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const backToTeamList = () => {
    setSelectedEmployee(null);
    setProfileError("");
  };

  useEffect(() => {
    loadTeamMembers();
    loadOrganizationData();
  }, []);

  const filteredMembers = teamMembers.filter((member) => {
    const search = searchTerm.trim().toLowerCase();

    return (
      String(member.id ?? "").includes(search) ||
      String(member.name ?? "")
        .toLowerCase()
        .includes(search) ||
      String(member.email ?? "")
        .toLowerCase()
        .includes(search)
    );
  });

  return (
    <div className="manager-team-page">
      <header className="admin-header">
        <div>
          <p className="header-label">MANAGER PORTAL</p>
          <h1>{selectedEmployee ? "Employee Profile" : "My Team"}</h1>
          <p className="header-subtitle">
            {selectedEmployee
              ? "View information about your assigned employee."
              : "View and access information about your assigned employees."}
          </p>
        </div>

        <div className="admin-header-actions">
          {selectedEmployee && (
            <button
              type="button"
              className="manager-team-view-button"
              onClick={backToTeamList}
            >
              Back to My Team
            </button>
          )}

          <Link to="/manager/profile" className="manager-support-button">
            My Profile
          </Link>
        </div>
      </header>

      {profileLoading ? (
        <div className="manager-team-state" role="status">
          <div className="manager-team-spinner" />
          <h3>Loading Employee Profile</h3>
          <p>Please wait while the employee information is retrieved.</p>
        </div>
      ) : profileError ? (
        <div className="manager-team-state manager-team-error" role="alert">
          <h3>Unable to Load Employee Profile</h3>
          <p>{profileError}</p>
          <button type="button" onClick={backToTeamList}>
            Back to My Team
          </button>
        </div>
      ) : selectedEmployee ? (
        <section className="manager-team-content">
          <div className="manager-member-profile-header">
            <div className="manager-team-avatar manager-member-profile-avatar">
              {String(selectedEmployee.name || "E")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h2>{selectedEmployee.name || "Employee"}</h2>
              <p>{selectedEmployee.email || "Email not available"}</p>
              <span className="manager-team-role">
                {selectedEmployee.role || "EMPLOYEE"}
              </span>
            </div>

            <div className="manager-member-profile-id">
              <span>Employee ID</span>
              <strong>#{selectedEmployee.id}</strong>
            </div>
          </div>

          <section className="manager-member-profile-section">
            <h3>Personal Information</h3>

            <div className="manager-member-profile-grid">
              <div>
                <span>Full Name</span>
                <strong>{selectedEmployee.name || "Not provided"}</strong>
              </div>

              <div>
                <span>Official Email</span>
                <strong>{selectedEmployee.email || "Not provided"}</strong>
              </div>

              <div>
                <span>Personal Email</span>
                <strong>
                  {selectedEmployee.personalEmail || "Not provided"}
                </strong>
              </div>

              <div>
                <span>Phone Number</span>
                <strong>
                  {selectedEmployee.phoneNumber || "Not provided"}
                </strong>
              </div>

              <div className="manager-member-profile-full">
                <span>Address</span>
                <strong>{selectedEmployee.address || "Not provided"}</strong>
              </div>
            </div>
          </section>

          <section className="manager-member-profile-section">
            <h3>Employment Information</h3>

            <div className="manager-member-profile-grid">
              <div>
                <span>Department</span>
                <strong>
                  {selectedEmployee.department?.name ||
                    departments.find(
                      (department) =>
                        String(department.id) ===
                        String(
                          selectedEmployee.departmentId ??
                            selectedEmployee.department?.id ??
                            "",
                        ),
                    )?.name ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <span>Designation</span>
                <strong>
                  {selectedEmployee.designation?.name ||
                    designations.find(
                      (designation) =>
                        String(designation.id) ===
                        String(
                          selectedEmployee.designationId ??
                            selectedEmployee.designation?.id ??
                            "",
                        ),
                    )?.name ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <span>Joining Date</span>
                <strong>
                  {selectedEmployee.joiningDate || "Not provided"}
                </strong>
              </div>

              <div>
                <span>Employment Type</span>
                <strong>
                  {selectedEmployee.employmentType || "Not provided"}
                </strong>
              </div>

              <div>
                <span>Work Location</span>
                <strong>
                  {selectedEmployee.workLocation || "Not provided"}
                </strong>
              </div>

              <div>
                <span>Account Status</span>
                <strong>{selectedEmployee.status || "Not provided"}</strong>
              </div>

              <div>
                <span>Reporting Authority</span>
                <strong>
                  {selectedEmployee.reportingAuthorityName || "Not provided"}
                </strong>
              </div>

              <div>
                <span>Reporting Authority Email</span>
                <strong>
                  {selectedEmployee.reportingAuthorityEmail || "Not provided"}
                </strong>
              </div>
            </div>
          </section>

          <section className="manager-member-profile-section">
            <h3>Emergency Contact</h3>

            <div className="manager-member-profile-grid">
              <div>
                <span>Contact Name</span>
                <strong>
                  {selectedEmployee.emergencyContactName || "Not provided"}
                </strong>
              </div>

              <div>
                <span>Contact Number</span>
                <strong>
                  {selectedEmployee.emergencyContactPhone || "Not provided"}
                </strong>
              </div>

              <div>
                <span>Relationship</span>
                <strong>
                  {selectedEmployee.emergencyContactRelationship ||
                    "Not provided"}
                </strong>
              </div>
            </div>
          </section>
        </section>
      ) : (
        <section className="manager-team-content">
          <div className="manager-team-heading">
            <div>
              <h2>Team Members</h2>
              <p>View the employees assigned to you.</p>
            </div>

            <div className="manager-team-count">
              {teamMembers.length}{" "}
              {teamMembers.length === 1 ? "Employee" : "Employees"}
            </div>
          </div>

          <div className="manager-team-search">
            <label htmlFor="team-search">Search Employees</label>

            <input
              id="team-search"
              type="text"
              placeholder="Search by employee name, ID, or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          {loading && (
            <div className="manager-team-state" role="status">
              <div className="manager-team-spinner" />
              <h3>Loading Team Members</h3>
              <p>Please wait while your team information is retrieved.</p>
            </div>
          )}

          {!loading && error && (
            <div className="manager-team-state manager-team-error" role="alert">
              <h3>Unable to Load Team</h3>
              <p>{error}</p>
              <button type="button" onClick={loadTeamMembers}>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && teamMembers.length === 0 && (
            <div className="manager-team-state">
              <div className="manager-team-empty-icon">♙</div>
              <h3>No Team Members Yet</h3>
              <p>You don't have any employees assigned to your team yet.</p>
            </div>
          )}

          {!loading &&
            !error &&
            teamMembers.length > 0 &&
            filteredMembers.length === 0 && (
              <div className="manager-team-state">
                <h3>No Matching Employees</h3>
                <p>Try a different name, employee ID, or email.</p>
              </div>
            )}

          {!loading && !error && filteredMembers.length > 0 && (
            <div className="manager-team-table-wrapper">
              <table className="manager-team-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Employee Name</th>
                    <th>Official Email</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td>#{member.id}</td>

                      <td>
                        <div className="manager-team-employee">
                          <div className="manager-team-avatar">
                            {String(member.name || "E")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <strong>{member.name || "—"}</strong>
                        </div>
                      </td>

                      <td>{member.email || "—"}</td>

                      <td>
                        <span className="manager-team-role">
                          {typeof member.role === "object"
                            ? member.role?.name || "EMPLOYEE"
                            : member.role || "EMPLOYEE"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="manager-team-view-button"
                          onClick={() => loadEmployeeProfile(member.id)}
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default ManagerTeam;
