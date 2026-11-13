import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/authService";

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const authData = localStorage.getItem("authData");

      if (authData) {
        const data = JSON.parse(authData);

        if (data.refreshToken) {
          await logoutUser(data.refreshToken);
        }
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      localStorage.removeItem("authData");
      navigate("/", { replace: true });
    }
  };

  return (
    <button type="button" onClick={handleLogout}>
      <span>↪</span>
      Logout
    </button>
  );
}

export default LogoutButton;