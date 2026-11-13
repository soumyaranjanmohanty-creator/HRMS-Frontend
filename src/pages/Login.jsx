import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import api from "../services/api";
import "../styles/login.css";
import companyLogo from "../assets/company-logo.png";
import ChangePassword from "./ChangePassword";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);

  // Added for account unlock request
  const [accountSuspended, setAccountSuspended] = useState(false);
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [personalEmail, setPersonalEmail] = useState("");
  const [unlockDescription, setUnlockDescription] = useState("");
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState("");
  const [unlockError, setUnlockError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Clear previous unlock messages
    setAccountSuspended(false);
    setShowUnlockForm(false);
    setUnlockSuccess("");
    setUnlockError("");

    try {
      const data = await loginUser(email, password);

      localStorage.setItem("authData", JSON.stringify(data));
      console.log("Login successful:", data);

      if (data.mustChangePassword) {
        setPasswordChangeRequired(true);
      } else {
        if (data.role === "ADMIN") {
          navigate("/admin");
        } else if (data.role === "HR") {
          navigate("/hr");
        } else if (data.role === "MANAGER") {
          navigate("/manager");
        } else if (data.role === "EMPLOYEE") {
          navigate("/employee");
        }
      }
    } catch (error) {
      console.error("Login failed:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data ||
        error.message ||
        "";

      console.log("Backend login error:", errorMessage);
      console.log("Login HTTP status:", error.response?.status);

      // Detect suspended accounts when login returns HTTP 403.
      const normalizedError = String(errorMessage).toLowerCase();

      if (
        error.response?.status === 403 &&
        (normalizedError.includes("account is not active") ||
          normalizedError.includes("account is suspended") ||
          !error.response?.data)
      ) {
        setAccountSuspended(true);
        setShowUnlockForm(false);
        setUnlockError("");
        setUnlockSuccess("");
      }
    }
  };

  // Added for HR account unlock request
  const handleUnlockRequest = async (event) => {
    event.preventDefault();

    try {
      setUnlockLoading(true);
      setUnlockSuccess("");
      setUnlockError("");

      await api.post("/unlock-request", {
        officialEmail: email,
        personalEmail: personalEmail,
        description: unlockDescription,
      });

      setUnlockSuccess(
        "Account unlock request sent successfully. Please wait for ADMIN approval.",
      );

      setShowUnlockForm(false);
      setPersonalEmail("");
      setUnlockDescription("");
    } catch (error) {
      console.error("Unlock request failed:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Failed to send account unlock request.";

      setUnlockError(String(errorMessage));
    } finally {
      setUnlockLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Corporate Panel */}
      <section className="corporate-panel">
        <div className="corporate-overlay">
          <div className="corporate-content">
            <img
              src={companyLogo}
              alt="Apex Workforce Solutions Pvt. Ltd."
              className="corporate-logo"
            />

            <h2>
              Empowering People.
              <br />
              Building Better
              <br />
              Workplaces.
            </h2>

            <div className="corporate-line"></div>

            <p>
              A complete workforce management solution designed for modern
              organizations.
            </p>

            <div className="corporate-features">
              <div className="feature">
                <strong>People</strong>
                <span>Management</span>
              </div>

              <div className="feature">
                <strong>Process</strong>
                <span>Automation</span>
              </div>

              <div className="feature">
                <strong>Better</strong>
                <span>Performance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Login Panel */}
      <section className="login-panel">
        <div className="login-card">
          <img
            src={companyLogo}
            alt="Apex Workforce Solutions Pvt. Ltd."
            className="company-logo"
          />

          <h1>Apex Workforce Solutions Pvt. Ltd.</h1>

          <h2>myworkforce</h2>

          <p>Workforce Management System</p>

          <div className="welcome-divider">
            <span></span>
            <strong>Welcome</strong>
            <span></span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
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

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit">Sign In →</button>
          </form>

          {accountSuspended && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                border: "1px solid #f1b5b5",
                borderRadius: "10px",
                backgroundColor: "#fff5f5",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#b91c1c",
                }}
              >
                Account Suspended
              </strong>

              <p
                style={{
                  margin: "0 0 12px 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Your account has been suspended after multiple failed login
                attempts.
              </p>

              {!showUnlockForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockForm(true);
                    setUnlockError("");
                    setUnlockSuccess("");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "none",
                    borderRadius: "7px",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Request Account Unlock
                </button>
              )}
            </div>
          )}

          {showUnlockForm && (
            <div
              style={{
                marginTop: "20px",
                padding: "18px",
                border: "1px solid #dbe3ef",
                borderRadius: "10px",
                backgroundColor: "#f8fafc",
              }}
            >
              <h3
                style={{
                  marginTop: "0",
                  marginBottom: "16px",
                  color: "#1f2937",
                }}
              >
                Account Unlock Request
              </h3>

              <form onSubmit={handleUnlockRequest}>
                <div className="form-group">
                  <label htmlFor="unlockOfficialEmail">Official Email</label>

                  <input
                    id="unlockOfficialEmail"
                    type="email"
                    value={email}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="personalEmail">Personal Email</label>

                  <input
                    id="personalEmail"
                    type="email"
                    value={personalEmail}
                    onChange={(event) => setPersonalEmail(event.target.value)}
                    placeholder="Enter your personal email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="unlockDescription">
                    Reason / Description
                  </label>

                  <textarea
                    id="unlockDescription"
                    value={unlockDescription}
                    onChange={(event) =>
                      setUnlockDescription(event.target.value)
                    }
                    placeholder="Explain why you are requesting account unlock"
                    rows="4"
                    required
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                  ></textarea>
                </div>

                {unlockError && (
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "10px",
                      borderRadius: "7px",
                      backgroundColor: "#fff1f2",
                      color: "#b91c1c",
                      fontSize: "14px",
                    }}
                  >
                    {unlockError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <button
                      type="submit"
                      disabled={unlockLoading}
                      style={{
                        flex: "1",
                        minWidth: "0",
                        minHeight: "44px",
                        padding: "10px 12px",
                        border: "none",
                        borderRadius: "7px",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        cursor: unlockLoading ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "14px",
                        lineHeight: "1.4",
                        textAlign: "center",
                      }}
                    >
                      {unlockLoading ? "Sending..." : "Send Unlock Request"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUnlockForm(false);
                        setUnlockError("");
                      }}
                      disabled={unlockLoading}
                      style={{
                        flex: "0 0 auto",
                        width: "90px",
                        minWidth: "90px",
                        height: "44px",
                        padding: "10px",
                        boxSizing: "border-box",
                        border: "1px solid #cbd5e1",
                        borderRadius: "7px",
                        backgroundColor: "#ffffff",
                        color: "#374151",
                        cursor: unlockLoading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {unlockSuccess && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#ecfdf5",
                color: "#047857",
                border: "1px solid #a7f3d0",
                fontSize: "14px",
              }}
            >
              ✓ {unlockSuccess}
            </div>
          )}

          <a href="/forgot-password">Forgot Password?</a>
        </div>
      </section>

      {passwordChangeRequired && (
        <ChangePassword
          onPasswordChanged={() => setPasswordChangeRequired(false)}
        />
      )}
    </div>
  );
}

export default Login;
