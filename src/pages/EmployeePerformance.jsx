import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/EmployeePerformance.css";

/* =========================================================
   HELPERS
========================================================= */

const getEmployeeId = () => {
  try {
    const authData = JSON.parse(localStorage.getItem("authData") || "{}");

    return (
      authData.userId ??
      authData.id ??
      authData.user?.id ??
      authData.employeeId ??
      authData.user?.userId ??
      null
    );
  } catch (error) {
    console.error("Unable to read employee account:", error);
    return null;
  }
};

const getPersonName = (person) => {
  if (!person) return "Not available";

  return (
    person.name ||
    person.fullName ||
    person.username ||
    person.email ||
    "Not available"
  );
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(`${dateValue}`.slice(0, 10) + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatReviewPeriod = (reviewPeriod) => {
  if (!reviewPeriod) return "—";

  const dateRange = String(reviewPeriod).split(" to ");

  if (dateRange.length === 2) {
    const formatMonth = (dateString) => {
      const [year, month] = dateString.split("-").map(Number);

      if (!year || !month || month < 1 || month > 12) {
        return dateString;
      }

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

const formatRating = (rating) => {
  const value = Number(rating);

  return Number.isFinite(value) && value >= 1 && value <= 5
    ? `${value}/5`
    : "—";
};

const getRatingLabel = (rating) => {
  const value = Number(rating);

  if (value === 5) return "Excellent";
  if (value === 4) return "Very Good";
  if (value === 3) return "Good";
  if (value === 2) return "Needs Improvement";
  if (value === 1) return "Unsatisfactory";

  return "Not rated";
};

/* =========================================================
   EMPLOYEE PERFORMANCE
========================================================= */

const EmployeePerformance = () => {
  const [employeeId] = useState(() => getEmployeeId());

  const [activeTab, setActiveTab] = useState("overview");

  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Calendar filter for exact review date.
  const [selectedDate, setSelectedDate] = useState("");
  const [appliedDate, setAppliedDate] = useState("");

  /* =====================================================
     LOAD PERFORMANCE REVIEWS
  ===================================================== */

  const loadReviews = useCallback(async () => {
    if (!employeeId) {
      setError("Employee ID was not found. Please log in again.");
      setReviews([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/performance/reviews/${employeeId}`);

      const records = Array.isArray(response.data) ? response.data : [];

      // Sort newest review first.
      records.sort((a, b) => {
        const dateA = String(a.reviewDate || "");
        const dateB = String(b.reviewDate || "");

        return dateB.localeCompare(dateA);
      });

      setReviews(records);

      // Keep the selected review if it still exists.
      setSelectedReview((previous) => {
        if (!previous) return null;

        return records.find((review) => review.id === previous.id) || null;
      });
    } catch (err) {
      console.error("Unable to load performance reviews:", err);

      setReviews([]);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("You are not authorized to view these performance reviews.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to load performance reviews. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  /* =====================================================
     PERFORMANCE SUMMARY
  ===================================================== */

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0,
    );

    return total / reviews.length;
  }, [reviews]);

  const latestReview = reviews.length > 0 ? reviews[0] : null;

  /* =====================================================
     DATE-WISE SEARCH
  ===================================================== */

  const filteredReviews = useMemo(() => {
    if (!appliedDate) {
      return reviews;
    }

    return reviews.filter(
      (review) => String(review.reviewDate || "").slice(0, 10) === appliedDate,
    );
  }, [reviews, appliedDate]);

  const handleDateSearch = () => {
    setAppliedDate(selectedDate);
    setSelectedReview(null);
  };

  const handleClearDate = () => {
    setSelectedDate("");
    setAppliedDate("");
    setSelectedReview(null);
  };

  /* =====================================================
     TAB NAVIGATION
  ===================================================== */

  const openReviewDetails = (review) => {
    setSelectedReview(review);
    setActiveTab("details");
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
  };

  /* =====================================================
     RENDER RATING
  ===================================================== */

  const renderRating = (rating) => {
    const value = Number(rating);

    return (
      <span className="ep-rating">
        <span className="ep-rating-star">★</span>
        {formatRating(value)}
      </span>
    );
  };

  /* =====================================================
     RENDER EMPTY STATE
  ===================================================== */

  const renderEmptyState = (title, description) => (
    <div className="ep-empty">
      <div className="ep-empty-icon">★</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );

  /* =====================================================
     MAIN PAGE
  ===================================================== */

  return (
    <div className="ep-page">
      {/* PAGE HEADER */}

      <header className="ep-header">
        <div>
          <span className="ep-eyebrow">EMPLOYEE SELF SERVICE</span>

          <h1>My Performance</h1>

          <p>Review your performance ratings, review history, and feedback.</p>
        </div>

        <button
          type="button"
          className="ep-refresh-button"
          onClick={loadReviews}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </header>

      {/* TABS */}

      <nav className="ep-tabs" aria-label="Performance sections">
        <button
          type="button"
          className={`ep-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => changeTab("overview")}
        >
          <span>▦</span>
          Performance Overview
        </button>

        <button
          type="button"
          className={`ep-tab ${activeTab === "reviews" ? "active" : ""}`}
          onClick={() => changeTab("reviews")}
        >
          <span>▤</span>
          My Reviews
        </button>

        <button
          type="button"
          className={`ep-tab ${activeTab === "details" ? "active" : ""}`}
          onClick={() => changeTab("details")}
        >
          <span>◉</span>
          Review Details
        </button>
      </nav>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="ep-alert" role="alert">
          <span>!</span>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="ep-loading">
          <div className="ep-spinner" />
          <p>Loading your performance reviews...</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ===========================================
              TAB 1: PERFORMANCE OVERVIEW
          =========================================== */}

          {activeTab === "overview" && (
            <section className="ep-content">
              <div className="ep-section-heading">
                <div>
                  <span className="ep-eyebrow">YOUR PERFORMANCE</span>
                  <h2>Performance Overview</h2>
                  <p>A summary of your recorded performance reviews.</p>
                </div>
              </div>

              <div className="ep-summary-grid">
                <article className="ep-summary-card">
                  <div className="ep-summary-icon blue">▤</div>

                  <div>
                    <span>Total Reviews</span>
                    <strong>{reviews.length}</strong>
                    <p>Recorded performance reviews</p>
                  </div>
                </article>

                <article className="ep-summary-card">
                  <div className="ep-summary-icon purple">★</div>

                  <div>
                    <span>Average Rating</span>
                    <strong>
                      {reviews.length > 0
                        ? `${averageRating.toFixed(2)}/5`
                        : "—"}
                    </strong>
                    <p>Across all recorded reviews</p>
                  </div>
                </article>

                <article className="ep-summary-card">
                  <div className="ep-summary-icon green">✓</div>

                  <div>
                    <span>Latest Rating</span>
                    <strong>
                      {latestReview ? formatRating(latestReview.rating) : "—"}
                    </strong>
                    <p>
                      {latestReview
                        ? getRatingLabel(latestReview.rating)
                        : "No reviews available"}
                    </p>
                  </div>
                </article>

                <article className="ep-summary-card">
                  <div className="ep-summary-icon orange">◷</div>

                  <div>
                    <span>Latest Review Date</span>
                    <strong className="ep-date-value">
                      {latestReview ? formatDate(latestReview.reviewDate) : "—"}
                    </strong>
                    <p>Most recent review recorded</p>
                  </div>
                </article>
              </div>

              {latestReview ? (
                <article className="ep-latest-card">
                  <div className="ep-latest-heading">
                    <div>
                      <span className="ep-eyebrow">MOST RECENT</span>
                      <h3>Latest Performance Review</h3>
                    </div>

                    {renderRating(latestReview.rating)}
                  </div>

                  <div className="ep-latest-grid">
                    <div>
                      <span>Review Period</span>
                      <strong>
                        {formatReviewPeriod(latestReview.reviewPeriod)}
                      </strong>
                    </div>

                    <div>
                      <span>Reviewer</span>
                      <strong>{getPersonName(latestReview.reviewer)}</strong>
                    </div>

                    <div>
                      <span>Review Date</span>
                      <strong>{formatDate(latestReview.reviewDate)}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ep-primary-button"
                    onClick={() => openReviewDetails(latestReview)}
                  >
                    View Latest Review
                  </button>
                </article>
              ) : (
                renderEmptyState(
                  "No Performance Reviews Yet",
                  "Your performance summary will appear here when a review is recorded.",
                )
              )}
            </section>
          )}

          {/* ===========================================
              TAB 2: MY REVIEWS
          =========================================== */}

          {activeTab === "reviews" && (
            <section className="ep-content">
              <div className="ep-section-heading">
                <div>
                  <span className="ep-eyebrow">REVIEW HISTORY</span>
                  <h2>My Reviews</h2>
                  <p>
                    Search your performance history by the exact review date.
                  </p>
                </div>
              </div>

              {/* CALENDAR SEARCH */}

              <div className="ep-search-card">
                <div className="ep-date-field">
                  <label htmlFor="ep-review-date">Search by Review Date</label>

                  <input
                    id="ep-review-date"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="ep-primary-button"
                  onClick={handleDateSearch}
                  disabled={!selectedDate}
                >
                  Search
                </button>

                <button
                  type="button"
                  className="ep-secondary-button"
                  onClick={handleClearDate}
                  disabled={!selectedDate && !appliedDate}
                >
                  Clear Filter
                </button>
              </div>

              <div className="ep-results-heading">
                <div>
                  <h3>Review History</h3>

                  <p>
                    {appliedDate
                      ? `Reviews dated ${formatDate(appliedDate)}`
                      : "All recorded performance reviews"}
                  </p>
                </div>

                <span className="ep-result-count">
                  {filteredReviews.length}{" "}
                  {filteredReviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>

              {filteredReviews.length === 0 ? (
                renderEmptyState(
                  appliedDate
                    ? "No Reviews Found for This Date"
                    : "No Performance Reviews",
                  appliedDate
                    ? "Try another date or clear the date filter to see all reviews."
                    : "Your review history will appear here when reviews are recorded.",
                )
              ) : (
                <div className="ep-table-card">
                  <div className="ep-table-wrapper">
                    <table className="ep-table">
                      <thead>
                        <tr>
                          <th>Review Period</th>
                          <th>Reviewer</th>
                          <th>Rating</th>
                          <th>Review Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredReviews.map((review) => (
                          <tr key={review.id}>
                            <td>
                              <strong>
                                {formatReviewPeriod(review.reviewPeriod)}
                              </strong>
                            </td>

                            <td>{getPersonName(review.reviewer)}</td>

                            <td>{renderRating(review.rating)}</td>

                            <td>{formatDate(review.reviewDate)}</td>

                            <td>
                              <button
                                type="button"
                                className="ep-view-button"
                                onClick={() => openReviewDetails(review)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="ep-table-footer">
                    Showing your own performance reviews only.
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ===========================================
              TAB 3: REVIEW DETAILS
          =========================================== */}

          {activeTab === "details" && (
            <section className="ep-content">
              <div className="ep-section-heading">
                <div>
                  <span className="ep-eyebrow">REVIEW INFORMATION</span>
                  <h2>Review Details</h2>
                  <p>
                    Complete information for your selected performance review.
                  </p>
                </div>

                <button
                  type="button"
                  className="ep-secondary-button"
                  onClick={() => changeTab("reviews")}
                >
                  ← Back to My Reviews
                </button>
              </div>

              {!selectedReview ? (
                renderEmptyState(
                  "No Review Selected",
                  "Open My Reviews and click View Details on a review to see its full information.",
                )
              ) : (
                <article className="ep-details-card">
                  <div className="ep-details-header">
                    <div>
                      <span className="ep-eyebrow">
                        PERFORMANCE REVIEW #{selectedReview.id}
                      </span>

                      <h3>{formatReviewPeriod(selectedReview.reviewPeriod)}</h3>

                      <p>
                        Review date: {formatDate(selectedReview.reviewDate)}
                      </p>
                    </div>

                    <div className="ep-rating-large">
                      <span>Rating</span>
                      <strong>{formatRating(selectedReview.rating)}</strong>
                      <small>{getRatingLabel(selectedReview.rating)}</small>
                    </div>
                  </div>

                  <div className="ep-details-grid">
                    <div className="ep-detail-item">
                      <span>Review ID</span>
                      <strong>#{selectedReview.id}</strong>
                    </div>

                    <div className="ep-detail-item">
                      <span>Review Period</span>
                      <strong>
                        {formatReviewPeriod(selectedReview.reviewPeriod)}
                      </strong>
                    </div>

                    <div className="ep-detail-item">
                      <span>Reviewer</span>
                      <strong>{getPersonName(selectedReview.reviewer)}</strong>
                    </div>

                    <div className="ep-detail-item">
                      <span>Review Date</span>
                      <strong>{formatDate(selectedReview.reviewDate)}</strong>
                    </div>

                    <div className="ep-detail-item">
                      <span>Performance Rating</span>
                      <strong>{formatRating(selectedReview.rating)}</strong>
                    </div>
                  </div>

                  <div className="ep-comments-section">
                    <span className="ep-eyebrow">REVIEWER FEEDBACK</span>

                    <h3>Comments and Feedback</h3>

                    {selectedReview.comments?.trim() ? (
                      <p className="ep-comments">{selectedReview.comments}</p>
                    ) : (
                      <p className="ep-no-comments">
                        No comments or feedback were recorded for this review.
                      </p>
                    )}
                  </div>
                </article>
              )}
            </section>
          )}
        </>
      )}

      <footer className="ep-footer">
        <span>MyWorkforce Solutions</span>
        <span>Employee Performance Portal</span>
      </footer>
    </div>
  );
};

export default EmployeePerformance;
