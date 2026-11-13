import api from "./api";

export const loginUser = async (email, password) => {
  const response = await api.post("/login", {
    email,
    password,
  });

  return response.data;
};

export const changePassword = async (newPassword) => {
  const response = await api.post("/change-password", {
    newPassword,
  });

  return response.data;
};

export const logoutUser = async (refreshToken) => {
  const response = await api.post("/logout", {
    refreshToken,
  });

  return response.data;
};
