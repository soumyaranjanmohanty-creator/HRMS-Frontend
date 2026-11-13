import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// Add access token to every request
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem("authData");

    if (authData) {
      const data = JSON.parse(authData);

      if (data.accessToken) {
        config.headers.Authorization = `Bearer ${data.accessToken}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Automatically refresh expired access token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      !error.response ||
      (error.response.status !== 401 && error.response.status !== 403) ||
      originalRequest?._retry ||
      originalRequest?.url === "/refresh-token"
    ) {
      return Promise.reject(error);
    }

    const authData = localStorage.getItem("authData");

    if (!authData) {
      return Promise.reject(error);
    }

    const data = JSON.parse(authData);

    if (!data.refreshToken) {
      return Promise.reject(error);
    }

    // If another request is already refreshing the token,
    // wait for that refresh to finish.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve,
          reject,
        });
      })
        .then((newAccessToken) => {
          originalRequest._retry = true;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        })
        .catch((refreshError) => {
          return Promise.reject(refreshError);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/refresh-token`,
        {
          refreshToken: data.refreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const newAccessToken = refreshResponse.data.accessToken;

      const updatedAuthData = {
        ...data,
        accessToken: newAccessToken,
      };

      localStorage.setItem("authData", JSON.stringify(updatedAuthData));

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      localStorage.removeItem("authData");

      window.location.href = "/";

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
