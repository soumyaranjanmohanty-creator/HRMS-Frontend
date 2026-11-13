import { useState } from "react";
import api from "../services/api";
import "../styles/PerformanceReviews.css";

function PerformanceReviews() {
  const [selectedRole, setSelectedRole] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsersByRole = async (role) => {
    try {
      setError("");
      setSuccess("");
      setSelectedUserId("");
      setReviews([]);

      if (!role) {
        setUsers([]);
        return;
      }

      const response = await api.get(`/users/role/${role}`);
      setUsers(response.data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
      setError("Failed to load users.");
    }
  };

  const handleViewReviews = async () => {
    if (!selectedUserId) {
      setError("Please select a user.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setReviews([]);

      const response = await api.get(
        `/performance/reviews/${selectedUserId}`,
      );

      setReviews(response.data || []);
      setSuccess("Performance reviews loaded successfully.");
    } catch (error) {
      console.error("Failed to load performance reviews:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to load performance reviews.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getReviewerName = (review) => {
    if (!review.reviewer) {
      return "-";
    }

    return review.reviewer.name || review.reviewer.email || "-";
  };

  const getEmployeeName = (review) => {
    if (!review.employee) {
      return "-";
    }

    return review.employee.name || review.employee.email || "-";
  };

  const getRatingDisplay = (rating) => {
    if (rating === null || rating === undefined) {
      return "-";
    }

    return `${rating}/5`;
  };

  return (
    <div className="performance-page">
      <div className="performance-page-header">
        <h1>Performance Reviews</h1>
        <p>
          View performance reviews for HR, Managers, and Employees.
        </p>
      </div>

      {success && (
        <div className="performance-success-notification">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="performance-error-notification">
          <span>!</span>
          <span>{error}</span>
        </div>
      )}

      <div className="performance-card">
        <div className="performance-card-header">
          <h2>View Performance Reviews</h2>
          <p>
            Select a role and user to view their performance review history.
          </p>
        </div>

        <div className="performance-form-grid">
          <div className="performance-form-group">
            <label>Role</label>

            <select
              value={selectedRole}
              onChange={(event) => {
                const role = event.target.value;
                setSelectedRole(role);
                loadUsersByRole(role);
              }}
            >
              <option value="">Select Role</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <div className="performance-form-group">
            <label>User</label>

            <select
              value={selectedUserId}
              onChange={(event) => {
                setSelectedUserId(event.target.value);
                setReviews([]);
                setError("");
                setSuccess("");
              }}
              disabled={!selectedRole}
            >
              <option value="">Select User</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — ID {user.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="performance-form-actions">
          <button
            type="button"
            className="performance-primary-button"
            onClick={handleViewReviews}
            disabled={!selectedUserId || loading}
          >
            {loading ? "Loading..." : "View Reviews"}
          </button>
        </div>

        {loading && (
          <div className="performance-loading">
            Loading performance reviews...
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <div className="performance-details">
            <div className="performance-details-header">
              <div>
                <h3>Performance Review History</h3>
                <p>
                  {users.find(
                    (user) => String(user.id) === String(selectedUserId),
                  )?.name || "Selected User"}
                </p>
              </div>
            </div>

            <div className="performance-table-wrapper">
              <table className="performance-table">
                <thead>
                  <tr>
                    <th>Review ID</th>
                    <th>Employee</th>
                    <th>Reviewer</th>
                    <th>Review Period</th>
                    <th>Rating</th>
                    <th>Comments</th>
                    <th>Review Date</th>
                  </tr>
                </thead>

                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td>{review.id}</td>
                      <td>{getEmployeeName(review)}</td>
                      <td>{getReviewerName(review)}</td>
                      <td>{review.reviewPeriod || "-"}</td>
                      <td>
                        <span className="performance-rating">
                          {getRatingDisplay(review.rating)}
                        </span>
                      </td>
                      <td>{review.comments || "-"}</td>
                      <td>{review.reviewDate || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading &&
          selectedUserId &&
          reviews.length === 0 &&
          !error && (
            <div className="performance-empty">
              <h3>No Performance Reviews Found</h3>
              <p>
                No performance reviews are available for the selected user.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

export default PerformanceReviews;