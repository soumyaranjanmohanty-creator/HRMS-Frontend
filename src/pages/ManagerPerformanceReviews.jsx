import React, { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import "../styles/ManagerPerformanceReviews.css";

const ManagerPerformanceReviews = () => {
  const [activeTab, setActiveTab] = useState("create");

  const [managerId, setManagerId] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [reviewPeriodStart, setReviewPeriodStart] = useState("");
  const [reviewPeriodEnd, setReviewPeriodEnd] = useState("");
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");

  const [teamReviews, setTeamReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingMyReviews, setLoadingMyReviews] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);

  const getStoredUserId = () => {
    try {
      const authData = JSON.parse(localStorage.getItem("authData") || "{}");

      return authData.userId ?? authData.id ?? authData.user?.id ?? null;
    } catch {
      return null;
    }
  };

  const getErrorMessage = (err) =>
    err?.response?.data?.message ||
    err?.response?.data ||
    err?.message ||
    "Something went wrong. Please try again.";

  const normalizeArray = (response) => {
    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.data?.content)) {
      return response.data.content;
    }

    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }

    return [];
  };

  const loadTeam = useCallback(async (id) => {
    setLoadingTeam(true);
    setError("");

    try {
      const response = await api.get(`/managers/${id}/team`);
      const members = normalizeArray(response);

      setTeamMembers(members);
    } catch (err) {
      setTeamMembers([]);
      setError(`Unable to load your assigned team. ${getErrorMessage(err)}`);
    } finally {
      setLoadingTeam(false);
    }
  }, []);

  const loadMyReviews = useCallback(async (id) => {
    setLoadingMyReviews(true);
    setError("");

    try {
      const response = await api.get(`/performance/reviews/${id}`);
      setMyReviews(normalizeArray(response));
    } catch (err) {
      setMyReviews([]);
      setError(
        `Unable to load your performance reviews. ${getErrorMessage(err)}`,
      );
    } finally {
      setLoadingMyReviews(false);
    }
  }, []);

  useEffect(() => {
    const id = getStoredUserId();

    if (!id) {
      setError(
        "Manager ID was not found in authData. Please check your login data.",
      );
      return;
    }

    setManagerId(id);
    loadTeam(id);
  }, [loadTeam]);

  const loadTeamReviews = async () => {
    if (!managerId) {
      setError("Manager ID is not available.");
      return;
    }

    setLoadingTeam(true);
    setError("");
    setSuccess("");

    try {
      const teamResponse = await api.get(`/managers/${managerId}/team`);

      const members = normalizeArray(teamResponse);
      setTeamMembers(members);

      const results = await Promise.all(
        members.map(async (employee) => {
          try {
            const response = await api.get(
              `/performance/reviews/${employee.id}`,
            );

            return normalizeArray(response).map((review) => ({
              ...review,
              employeeId: employee.id,
              employeeName:
                employee.name || employee.fullName || `Employee ${employee.id}`,
            }));
          } catch {
            return [];
          }
        }),
      );

      setTeamReviews(results.flat());
    } catch (err) {
      setTeamReviews([]);
      setError(
        `Unable to load team performance reviews. ${getErrorMessage(err)}`,
      );
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleCreateReview = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedEmployeeId) {
      setError("Please select an employee.");
      return;
    }

    if (!reviewPeriodStart || !reviewPeriodEnd) {
      setError("Please select the review period start and end dates.");
      return;
    }

    if (reviewPeriodEnd < reviewPeriodStart) {
      setError("The end date cannot be before the start date.");
      return;
    }

    if (!comments.trim()) {
      setError("Please enter review comments.");
      return;
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      setError("Rating must be between 1 and 5.");
      return;
    }

    const employee = teamMembers.find(
      (member) => String(member.id) === String(selectedEmployeeId),
    );

    if (!employee) {
      setError("The selected employee is not in your assigned team.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/performance/reviews", {
        employeeId: Number(selectedEmployeeId),
        reviewPeriod: `${reviewPeriodStart} to ${reviewPeriodEnd}`,
        rating: Number(rating),
        comments: comments.trim(),
      });

      setSuccess("Performance review submitted successfully.");

      setSelectedEmployeeId("");
      setReviewPeriodStart("");
      setReviewPeriodEnd("");
      setRating(5);
      setComments("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMyReviews = async () => {
    setActiveTab("mine");

    if (managerId) {
      await loadMyReviews(managerId);
    }
  };

  const getEmployeeName = (review) => {
    if (review.employeeName) {
      return review.employeeName;
    }

    if (review.employee?.name) {
      return review.employee.name;
    }

    return `Employee ${review.employeeId || review.employee?.id || ""}`;
  };

  const getReviewerName = (review) =>
    review.reviewer?.name || review.reviewerName || "—";

  const getReviewDate = (review) =>
    review.reviewDate ? new Date(review.reviewDate).toLocaleDateString() : "—";

  const formatReviewPeriod = (reviewPeriod) => {
    if (!reviewPeriod) return "—";

    const dateRange = reviewPeriod.split(" to ");

    if (dateRange.length === 2) {
      const formatMonth = (dateString) => {
        const [year, month] = dateString.split("-").map(Number);

        return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      };

      return `${formatMonth(dateRange[0])} - ${formatMonth(dateRange[1])}`;
    }

    // Preserve existing month-based review periods.
    return reviewPeriod;
  };

  const filteredTeamReviews = teamReviews.filter((review) => {
    const query = searchTerm.toLowerCase();

    return (
      getEmployeeName(review).toLowerCase().includes(query) ||
      String(review.reviewPeriod || "")
        .toLowerCase()
        .includes(query) ||
      String(review.rating || "").includes(query)
    );
  });

  const averageRating =
    teamReviews.length > 0
      ? (
          teamReviews.reduce(
            (total, review) => total + Number(review.rating || 0),
            0,
          ) / teamReviews.length
        ).toFixed(1)
      : "—";

  const renderStars = (value) => (
    <span className="mpr-stars" aria-label={`${value} out of 5`}>
      {"★".repeat(Number(value) || 0)}
      {"☆".repeat(5 - (Number(value) || 0))}
    </span>
  );

  return (
    <div className="mpr-page">
      <header className="mpr-header">
        <div>
          <span className="mpr-eyebrow">MANAGER WORKSPACE</span>
          <h1>Performance Reviews</h1>
          <p>
            Evaluate your assigned employees and review performance assessment
            records.
          </p>
        </div>

        <div className="mpr-header-icon" aria-hidden="true">
          ★
        </div>
      </header>

      {error && (
        <div className="mpr-alert mpr-alert-error">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mpr-alert mpr-alert-success">
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            ×
          </button>
        </div>
      )}

      <section className="mpr-summary">
        <article className="mpr-summary-card">
          <div className="mpr-summary-icon">👥</div>
          <div>
            <span>Assigned Employees</span>
            <strong>{loadingTeam ? "…" : teamMembers.length}</strong>
          </div>
        </article>

        <article className="mpr-summary-card">
          <div className="mpr-summary-icon">📋</div>
          <div>
            <span>Team Reviews Loaded</span>
            <strong>{teamReviews.length}</strong>
          </div>
        </article>

        <article className="mpr-summary-card">
          <div className="mpr-summary-icon">⭐</div>
          <div>
            <span>Average Team Rating</span>
            <strong>{averageRating}</strong>
          </div>
        </article>
      </section>

      <nav className="mpr-tabs" aria-label="Performance review tabs">
        <button
          type="button"
          className={activeTab === "create" ? "active" : ""}
          onClick={() => {
            setActiveTab("create");
            setError("");
            setSuccess("");
          }}
        >
          <span>＋</span> Create Review
        </button>

        <button
          type="button"
          className={activeTab === "team" ? "active" : ""}
          onClick={() => {
            setActiveTab("team");
            setError("");
            setSuccess("");
            loadTeamReviews();
          }}
        >
          <span>▤</span> Team Performance Reviews
        </button>

        <button
          type="button"
          className={activeTab === "mine" ? "active" : ""}
          onClick={handleOpenMyReviews}
        >
          <span>◉</span> My Performance Reviews
        </button>
      </nav>

      {/* TAB 1: CREATE REVIEW */}
      {activeTab === "create" && (
        <section className="mpr-panel">
          <div className="mpr-panel-heading">
            <div>
              <h2>Create Performance Review</h2>
              <p>Submit an evaluation for an employee assigned to you.</p>
            </div>

            <span className="mpr-heading-icon">✎</span>
          </div>

          {loadingTeam ? (
            <div className="mpr-loading">Loading your assigned employees…</div>
          ) : teamMembers.length === 0 ? (
            <div className="mpr-empty">
              <div className="mpr-empty-icon">👥</div>
              <h3>No assigned employees found</h3>
              <p>
                Employees assigned to your Manager account will appear here.
              </p>

              <button
                type="button"
                className="mpr-button mpr-button-secondary"
                onClick={() => managerId && loadTeam(managerId)}
              >
                Refresh Employees
              </button>
            </div>
          ) : (
            <form className="mpr-form" onSubmit={handleCreateReview}>
              <div className="mpr-field">
                <label htmlFor="mpr-employee">
                  Select Employee <span>*</span>
                </label>

                <select
                  id="mpr-employee"
                  value={selectedEmployeeId}
                  onChange={(event) =>
                    setSelectedEmployeeId(event.target.value)
                  }
                  required
                >
                  <option value="">Choose an employee</option>

                  {teamMembers.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name ||
                        employee.fullName ||
                        `Employee ${employee.id}`}
                      {" — ID: "}
                      {employee.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mpr-field">
                <label htmlFor="mpr-period-start">
                  Review Period <span>*</span>
                </label>

                <div className="mpr-date-range">
                  <div>
                    <label htmlFor="mpr-period-start">Start Date</label>
                    <input
                      id="mpr-period-start"
                      type="date"
                      value={reviewPeriodStart}
                      onChange={(event) => {
                        const startDate = event.target.value;
                        setReviewPeriodStart(startDate);

                        if (startDate) {
                          const date = new Date(`${startDate}T12:00:00`);
                          date.setMonth(date.getMonth() + 6);
                          date.setDate(date.getDate() - 1);

                          const endDate = [
                            date.getFullYear(),
                            String(date.getMonth() + 1).padStart(2, "0"),
                            String(date.getDate()).padStart(2, "0"),
                          ].join("-");

                          setReviewPeriodEnd(endDate);
                        } else {
                          setReviewPeriodEnd("");
                        }
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="mpr-period-end">End Date</label>
                    <input
                      id="mpr-period-end"
                      type="date"
                      value={reviewPeriodEnd}
                      min={reviewPeriodStart || undefined}
                      onChange={(event) =>
                        setReviewPeriodEnd(event.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mpr-field">
                <label htmlFor="mpr-rating">
                  Performance Rating <span>*</span>
                </label>

                <select
                  id="mpr-rating"
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                  required
                >
                  <option value={5}>5 — Outstanding</option>
                  <option value={4}>4 — Exceeds Expectations</option>
                  <option value={3}>3 — Meets Expectations</option>
                  <option value={2}>2 — Needs Improvement</option>
                  <option value={1}>1 — Unsatisfactory</option>
                </select>

                <div className="mpr-rating-preview">
                  {renderStars(rating)}
                  <span>{rating} / 5</span>
                </div>
              </div>

              <div className="mpr-field">
                <label htmlFor="mpr-comments">
                  Review Comments <span>*</span>
                </label>

                <textarea
                  id="mpr-comments"
                  value={comments}
                  onChange={(event) => setComments(event.target.value)}
                  placeholder="Describe achievements, strengths, areas for improvement, and overall performance..."
                  rows={6}
                  maxLength={3000}
                  required
                />

                <div className="mpr-character-count">
                  {comments.length}/3000 characters
                </div>
              </div>

              <div className="mpr-form-actions">
                <button
                  type="button"
                  className="mpr-button mpr-button-secondary"
                  onClick={() => {
                    setSelectedEmployeeId("");
                    setReviewPeriodStart("");
                    setReviewPeriodEnd("");
                    setRating(5);
                    setComments("");
                    setError("");
                    setSuccess("");
                  }}
                  disabled={submitting}
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  className="mpr-button mpr-button-primary"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Performance Review"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* TAB 2: TEAM PERFORMANCE REVIEWS */}
      {activeTab === "team" && (
        <section className="mpr-panel">
          <div className="mpr-panel-heading">
            <div>
              <h2>Team Performance Reviews</h2>
              <p>Review recorded assessments for your assigned employees.</p>
            </div>

            <button
              type="button"
              className="mpr-button mpr-button-secondary"
              onClick={loadTeamReviews}
              disabled={loadingTeam}
            >
              {loadingTeam ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          <div className="mpr-toolbar">
            <div className="mpr-search">
              <span>⌕</span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search employee, period, or rating..."
              />
            </div>

            <span className="mpr-result-count">
              {filteredTeamReviews.length} review(s)
            </span>
          </div>

          {loadingTeam ? (
            <div className="mpr-loading">Loading team performance reviews…</div>
          ) : filteredTeamReviews.length === 0 ? (
            <div className="mpr-empty">
              <div className="mpr-empty-icon">📋</div>
              <h3>No performance reviews found</h3>
              <p>
                No matching reviews were returned for your assigned employees.
              </p>
            </div>
          ) : (
            <div className="mpr-table-wrapper">
              <table className="mpr-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Review Period</th>
                    <th>Rating</th>
                    <th>Review Date</th>
                    <th>Reviewer</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTeamReviews.map((review, index) => (
                    <tr
                      key={
                        review.id ??
                        `${review.employeeId}-${review.reviewDate}-${index}`
                      }
                    >
                      <td>
                        <div className="mpr-employee-cell">
                          <span className="mpr-avatar">
                            {getEmployeeName(review).charAt(0).toUpperCase()}
                          </span>

                          <div>
                            <strong>{getEmployeeName(review)}</strong>
                            <small>
                              ID:{" "}
                              {review.employeeId || review.employee?.id || "—"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>{formatReviewPeriod(review.reviewPeriod)}</td>

                      <td>
                        <div className="mpr-rating-cell">
                          {renderStars(review.rating)}
                          <strong>{review.rating}/5</strong>
                        </div>
                      </td>

                      <td>{getReviewDate(review)}</td>

                      <td>{getReviewerName(review)}</td>

                      <td>
                        <button
                          type="button"
                          className="mpr-view-button"
                          onClick={() => setSelectedReview(review)}
                        >
                          View Details
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

      {/* TAB 3: MY PERFORMANCE REVIEWS */}
      {activeTab === "mine" && (
        <section className="mpr-panel">
          <div className="mpr-panel-heading">
            <div>
              <h2>My Performance Reviews</h2>
              <p>View performance reviews recorded for your Manager account.</p>
            </div>

            <button
              type="button"
              className="mpr-button mpr-button-secondary"
              onClick={() => managerId && loadMyReviews(managerId)}
              disabled={loadingMyReviews}
            >
              {loadingMyReviews ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {loadingMyReviews ? (
            <div className="mpr-loading">Loading your performance reviews…</div>
          ) : myReviews.length === 0 ? (
            <div className="mpr-empty">
              <div className="mpr-empty-icon">⭐</div>
              <h3>No personal reviews found</h3>
              <p>No performance reviews were returned for your account.</p>
            </div>
          ) : (
            <div className="mpr-personal-reviews">
              {myReviews.map((review, index) => (
                <article className="mpr-review-card" key={review.id ?? index}>
                  <div className="mpr-review-card-top">
                    <div>
                      <span className="mpr-review-label">REVIEW PERIOD</span>
                      <h3>{formatReviewPeriod(review.reviewPeriod)}</h3>
                    </div>

                    <div className="mpr-score">
                      <strong>{review.rating}/5</strong>
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  <div className="mpr-review-meta">
                    <div>
                      <span>Review Date</span>
                      <strong>{getReviewDate(review)}</strong>
                    </div>

                    <div>
                      <span>Reviewed By</span>
                      <strong>{getReviewerName(review)}</strong>
                    </div>
                  </div>

                  <div className="mpr-review-comments">
                    <h4>Review Comments</h4>
                    <p>{review.comments || "No comments provided."}</p>
                  </div>

                  <button
                    type="button"
                    className="mpr-view-button"
                    onClick={() => setSelectedReview(review)}
                  >
                    View Full Review
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* REVIEW DETAILS MODAL */}
      {selectedReview && (
        <div
          className="mpr-modal-backdrop"
          onClick={() => setSelectedReview(null)}
        >
          <section
            className="mpr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mpr-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mpr-modal-header">
              <div>
                <span className="mpr-eyebrow">PERFORMANCE ASSESSMENT</span>

                <h2 id="mpr-modal-title">Review Details</h2>
              </div>

              <button
                type="button"
                className="mpr-modal-close"
                onClick={() => setSelectedReview(null)}
                aria-label="Close review details"
              >
                ×
              </button>
            </div>

            <div className="mpr-modal-body">
              <div className="mpr-detail-row">
                <span>Employee</span>
                <strong>{getEmployeeName(selectedReview)}</strong>
              </div>

              <div className="mpr-detail-row">
                <span>Review Period</span>
                <strong>
                  {formatReviewPeriod(selectedReview.reviewPeriod)}
                </strong>
              </div>

              <div className="mpr-detail-row">
                <span>Rating</span>
                <strong>
                  {selectedReview.rating}/5 {renderStars(selectedReview.rating)}
                </strong>
              </div>

              <div className="mpr-detail-row">
                <span>Review Date</span>
                <strong>{getReviewDate(selectedReview)}</strong>
              </div>

              <div className="mpr-detail-row">
                <span>Reviewer</span>
                <strong>{getReviewerName(selectedReview)}</strong>
              </div>

              <div className="mpr-detail-comments">
                <span>Comments</span>
                <p>{selectedReview.comments || "No comments provided."}</p>
              </div>
            </div>

            <div className="mpr-modal-footer">
              <button
                type="button"
                className="mpr-button mpr-button-primary"
                onClick={() => setSelectedReview(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ManagerPerformanceReviews;
