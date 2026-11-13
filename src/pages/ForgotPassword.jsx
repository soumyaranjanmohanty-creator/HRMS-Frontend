import { useState } from "react";
import api from "../services/api";
import "../styles/forgot-password.css";
import companyLogo from "../assets/company-logo.png";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await api.post("/forgot-password", {
        officialEmail: email,
      });

      setMessage(response.data);
      setEmail("");
    } catch (error) {
      console.error("Forgot password failed:", error);

      if (error.response?.data) {
        setError(error.response.data);
      } else {
        setError("Unable to process forgot password request.");
      }
    }
  };

  return (
    <div className="forgot-page">
      <section className="forgot-brand-panel">
        <div className="forgot-brand-overlay">
          <div className="forgot-brand-content">
            <img
              src={companyLogo}
              alt="Apex Workforce Solutions Pvt. Ltd."
              className="forgot-brand-logo"
            />

            <h2>
              Secure Access.
              <br />
              Reliable Workforce.
              <br />
              Better Management.
            </h2>

            <div className="forgot-brand-line"></div>

            <p>
              Recover your workforce account securely and continue managing
              your work with confidence.
            </p>
          </div>
        </div>
      </section>

      <section className="forgot-panel">
        <div className="forgot-card">
          <img
            src={companyLogo}
            alt="Apex Workforce Solutions Pvt. Ltd."
            className="forgot-logo"
          />

          <h1>Apex Workforce Solutions Pvt. Ltd.</h1>

          <h2>myworkforce</h2>

          <p className="forgot-subtitle">
            Workforce Management System
          </p>

          <div className="forgot-divider">
            <span></span>
            <strong>Reset Password</strong>
            <span></span>
          </div>

          <p className="forgot-description">
            Enter your official email address. A temporary password will be
            sent to your registered personal email.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="forgot-form-group">
              <label htmlFor="email">Official Email</label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your official email"
                required
              />
            </div>

            <button type="submit">Send Temporary Password →</button>
          </form>

          {message && (
            <div className="forgot-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="forgot-message error">
              {error}
            </div>
          )}

          <a href="/" className="back-to-login">
            ← Back to Sign In
          </a>
        </div>
      </section>
    </div>
  );
}

export default ForgotPassword;