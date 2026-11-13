import { useState } from "react";
import { changePassword } from "../services/authService";

function ChangePassword({ onPasswordChanged }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      const response = await changePassword(newPassword);

      setMessage(response);

      setNewPassword("");
      setConfirmPassword("");

      if (onPasswordChanged) {
        onPasswordChanged();
      }
    } catch (error) {
      console.error("Password change failed:", error);
      setError("Unable to change password.");
    }
  };

  return (
    <div className="password-modal-overlay">
      <div className="password-modal">
        <h2>Password Change Required</h2>

        <p>
          Your temporary password must be changed before you can continue.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="newPassword">New Password</label>

          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Enter your new password"
            required
          />

          <label htmlFor="confirmPassword">Confirm New Password</label>

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm your new password"
            required
          />

          <button type="submit">Change Password</button>
        </form>

        {message && <p>{message}</p>}
        {error && <p>{error}</p>}
      </div>
    </div>
  );
}

export default ChangePassword;