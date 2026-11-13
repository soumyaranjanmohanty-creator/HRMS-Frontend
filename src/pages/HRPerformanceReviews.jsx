import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/HRPerformanceReviews.css";

function HRPerformanceReviews() {
  const [activeTab, setActiveTab] = useState("MANAGER");

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [reviews, setReviews] = useState([]);

  const [showReviewForm, setShowReviewForm] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    reviewPeriod: "",
    rating: "",
    comments: "",
  });
  const [selectedReviewMonth, setSelectedReviewMonth] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedUser = users.find(
    (user) => String(user.id) === String(selectedUserId),
  );

  const roleLabel = activeTab === "MANAGER" ? "Manager" : "Employee";

  const getErrorMessage = (err, fallback) => {
    const data = err.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    return data?.message || data?.error || fallback;
  };

  const getUserName = (user) => {
    if (!user) {
      return "-";
    }

    return user.name || user.fullName || user.email || "-";
  };

  const getReviewerName = (review) => {
    return getUserName(review.reviewer);
  };

  const getReviewTargetName = (review) => {
    return getUserName(review.employee);
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const loadUsersByRole = async (role) => {
    setLoadingUsers(true);
    clearMessages();

    setUsers([]);
    setSelectedUserId("");
    setReviews([]);
    setShowReviewForm(false);

    if (!role) {
      setLoadingUsers(false);
      return;
    }

    try {
      const response = await api.get(`/users/role/${role}`);

      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load users:", err);

      setError(
        getErrorMessage(err, `Failed to load ${role.toLowerCase()} accounts.`),
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsersByRole(activeTab);
  }, [activeTab]);

  const handleTabChange = (role) => {
    if (role === activeTab) {
      return;
    }

    setActiveTab(role);
  };

  const handleUserChange = (event) => {
    setSelectedUserId(event.target.value);
    setReviews([]);
    setShowReviewForm(false);
    clearMessages();
  };

  const handleViewReviews = async () => {
    if (!selectedUserId) {
      setError(`Please select a ${roleLabel.toLowerCase()}.`);
      return;
    }

    setLoadingReviews(true);
    clearMessages();
    setReviews([]);

    try {
      const response = await api.get(`/performance/reviews/${selectedUserId}`);

      setReviews(Array.isArray(response.data) ? response.data : []);

      setSuccess("Performance reviews loaded successfully.");
    } catch (err) {
      console.error("Failed to load performance reviews:", err);

      setError(getErrorMessage(err, "Failed to load performance reviews."));
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setReviewForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOpenReviewForm = () => {
    if (!selectedUserId) {
      setError(`Please select a ${roleLabel.toLowerCase()} first.`);
      return;
    }

    clearMessages();

    setReviewForm({
      reviewPeriod: "",
      rating: "",
      comments: "",
    });

    setShowReviewForm(true);
  };

  const handleCancelReview = () => {
    setShowReviewForm(false);

    setReviewForm({
      reviewPeriod: "",
      rating: "",
      comments: "",
    });

    clearMessages();
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!selectedUserId) {
      setError("Please select a user.");
      return;
    }

    if (!reviewForm.reviewPeriod.trim()) {
      setError("Please enter the review period.");
      return;
    }

    const rating = Number(reviewForm.rating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5.");
      return;
    }

    if (!reviewForm.comments.trim()) {
      setError("Please enter performance comments.");
      return;
    }

    const requestBody = {
      employeeId: Number(selectedUserId),
      reviewPeriod: reviewForm.reviewPeriod.trim(),
      rating,
      comments: reviewForm.comments.trim(),
    };

    setSubmitting(true);

    try {
      await api.post("/performance/reviews", requestBody);

      setShowReviewForm(false);

      setReviewForm({
        reviewPeriod: "",
        rating: "",
        comments: "",
      });

      setSuccess(
        `Performance review submitted successfully for ${getUserName(
          selectedUser,
        )}.`,
      );

      // Refresh the review history after submission.
      try {
        const response = await api.get(
          `/performance/reviews/${selectedUserId}`,
        );

        setReviews(Array.isArray(response.data) ? response.data : []);
      } catch (refreshError) {
        console.error(
          "Review submitted, but history refresh failed:",
          refreshError,
        );

        setError(
          "Review was submitted successfully, but refreshing the history failed. Click View Reviews to try again.",
        );
      }
    } catch (err) {
      console.error("Failed to submit performance review:", err);

      setError(getErrorMessage(err, "Failed to submit performance review."));
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingDisplay = (rating) => {
    if (rating === null || rating === undefined) {
      return "-";
    }

    return `${rating}/5`;
  };

  return (
    <div className="hr-performance-page">
      <div className="hr-performance-page-header">
        <h1>Performance Reviews</h1>

        <p>
          Review Manager and Employee performance and provide constructive
          feedback.
        </p>
      </div>

      {success && (
        <div className="hr-performance-success" role="status">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="hr-performance-error" role="alert">
          <span>!</span>
          <span>{error}</span>
        </div>
      )}

      <div className="hr-performance-card">
        <div className="hr-performance-card-header">
          <h2>Performance Management</h2>

          <p>
            Select a review category to view review history or submit a new
            performance review.
          </p>
        </div>

        {/* Two HR Performance Review Tabs */}
        <div
          className="hr-performance-tabs"
          role="tablist"
          aria-label="Performance review categories"
        >
          <button
            type="button"
            role="tab"
            id="hr-manager-tab"
            aria-selected={activeTab === "MANAGER"}
            aria-controls="hr-performance-panel"
            className={activeTab === "MANAGER" ? "active" : ""}
            onClick={() => handleTabChange("MANAGER")}
          >
            Manager Reviews
          </button>

          <button
            type="button"
            role="tab"
            id="hr-employee-tab"
            aria-selected={activeTab === "EMPLOYEE"}
            aria-controls="hr-performance-panel"
            className={activeTab === "EMPLOYEE" ? "active" : ""}
            onClick={() => handleTabChange("EMPLOYEE")}
          >
            Employee Reviews
          </button>
        </div>

        <section
          id="hr-performance-panel"
          role="tabpanel"
          aria-labelledby={
            activeTab === "MANAGER" ? "hr-manager-tab" : "hr-employee-tab"
          }
        >
          <div className="hr-performance-section-heading">
            <div>
              <h3>{roleLabel} Performance Reviews</h3>

              <p>
                Select a {roleLabel.toLowerCase()} to view performance history
                or give a review.
              </p>
            </div>
          </div>

          {/* User Selection */}
          <div className="hr-performance-form-grid">
            <div className="hr-performance-form-group">
              <label htmlFor="hr-performance-user">Select {roleLabel}</label>

              <select
                id="hr-performance-user"
                value={selectedUserId}
                onChange={handleUserChange}
                disabled={loadingUsers || users.length === 0}
              >
                <option value="">
                  {loadingUsers
                    ? `Loading ${roleLabel.toLowerCase()}s...`
                    : `Select ${roleLabel}`}
                </option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getUserName(user)} — ID {user.id}
                  </option>
                ))}
              </select>

              {!loadingUsers && users.length === 0 && (
                <small className="hr-performance-helper">
                  No {roleLabel.toLowerCase()} accounts found.
                </small>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="hr-performance-actions">
            <button
              type="button"
              className="hr-performance-primary-button"
              onClick={handleViewReviews}
              disabled={!selectedUserId || loadingReviews || submitting}
            >
              {loadingReviews ? "Loading..." : "View Reviews"}
            </button>

            <button
              type="button"
              className="hr-performance-primary-button"
              onClick={handleOpenReviewForm}
              disabled={!selectedUserId || submitting}
            >
              Give Review
            </button>
          </div>

          {loadingUsers && (
            <div className="hr-performance-loading">
              Loading {roleLabel.toLowerCase()} accounts...
            </div>
          )}

          {loadingReviews && (
            <div className="hr-performance-loading">
              Loading performance review history...
            </div>
          )}

          {/* Give Review Form */}
          {showReviewForm && (
            <div className="hr-performance-review-form">
              <div className="hr-performance-details-header">
                <div>
                  <h3>Give Performance Review</h3>

                  <p>
                    Reviewing: {getUserName(selectedUser)}
                    {selectedUser?.id ? ` — ID ${selectedUser.id}` : ""}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitReview}>
                <div className="hr-performance-form-grid">
                  <div className="hr-performance-form-group">
                    <label htmlFor="hr-review-month">Select Review Month</label>

                    <input
                      id="hr-review-month"
                      type="month"
                      value={selectedReviewMonth}
                      onChange={(e) => {
                        const selectedMonth = e.target.value;

                        setSelectedReviewMonth(selectedMonth);

                        if (!selectedMonth) {
                          setReviewForm((previous) => ({
                            ...previous,
                            reviewPeriod: "",
                          }));
                          return;
                        }

                        const [year, month] = selectedMonth
                          .split("-")
                          .map(Number);

                        const endDate = new Date(year, month - 1, 1);
                        const startDate = new Date(year, month - 6, 1);

                        const formatMonth = (date) =>
                          date.toLocaleString("en-US", {
                            month: "long",
                            year: "numeric",
                          });

                        const period = `${formatMonth(startDate)} - ${formatMonth(endDate)}`;

                        setReviewForm((previous) => ({
                          ...previous,
                          reviewPeriod: period,
                        }));
                      }}
                      required
                    />

                    <label htmlFor="hr-review-period">
                      Six-Month Review Period
                    </label>

                    <input
                      id="hr-review-period"
                      type="text"
                      value={reviewForm.reviewPeriod}
                      readOnly
                      placeholder="Select a month to generate the period"
                    />
                  </div>

                  <div className="hr-performance-form-group">
                    <label htmlFor="hr-review-rating">Rating (1–5)</label>

                    <select
                      id="hr-review-rating"
                      name="rating"
                      value={reviewForm.rating}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Rating</option>
                      <option value="1">1 — Needs Improvement</option>
                      <option value="2">2 — Below Expectations</option>
                      <option value="3">3 — Meets Expectations</option>
                      <option value="4">4 — Very Good</option>
                      <option value="5">5 — Excellent</option>
                    </select>
                  </div>

                  <div className="hr-performance-form-group hr-performance-comments">
                    <label htmlFor="hr-review-comments">
                      Performance Comments
                    </label>

                    <textarea
                      id="hr-review-comments"
                      name="comments"
                      value={reviewForm.comments}
                      onChange={handleFormChange}
                      placeholder="Enter performance feedback..."
                      rows={4}
                      maxLength={2000}
                      required
                    />
                  </div>
                </div>

                <div className="hr-performance-actions">
                  <button
                    type="submit"
                    className="hr-performance-primary-button"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>

                  <button
                    type="button"
                    className="hr-performance-cancel-button"
                    onClick={handleCancelReview}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Review History */}
          {!loadingReviews && reviews.length > 0 && (
            <div className="hr-performance-details">
              <div className="hr-performance-details-header">
                <div>
                  <h3>Performance Review History</h3>

                  <p>
                    {getUserName(selectedUser)}
                    {selectedUser?.id ? ` — ID ${selectedUser.id}` : ""}
                  </p>
                </div>

                <span className="hr-performance-count">
                  {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
                </span>
              </div>

              <div className="hr-performance-table-wrapper">
                <table className="hr-performance-table">
                  <thead>
                    <tr>
                      <th>Review ID</th>
                      <th>{roleLabel}</th>
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
                        <td>{getReviewTargetName(review)}</td>
                        <td>{getReviewerName(review)}</td>
                        <td>{review.reviewPeriod || "-"}</td>

                        <td>
                          <span className="hr-performance-rating">
                            {getRatingDisplay(review.rating)}
                          </span>
                        </td>

                        <td className="hr-performance-comments-cell">
                          {review.comments || "-"}
                        </td>

                        <td>{review.reviewDate || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loadingReviews &&
            selectedUserId &&
            reviews.length === 0 &&
            !error &&
            !showReviewForm && (
              <div className="hr-performance-empty">
                <h3>No Performance Reviews Found</h3>

                <p>
                  No performance reviews are available for this{" "}
                  {roleLabel.toLowerCase()}.
                </p>

                <p>Select Give Review to submit the first review.</p>
              </div>
            )}
        </section>
      </div>
    </div>
  );
}

export default HRPerformanceReviews;
