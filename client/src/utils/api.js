import axios from "axios";
import { auth } from "../firebase/config";
import useAuthStore from "../store/authStore";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  timeout: 15000,
});

// Auto-attach Firebase token
api.interceptors.request.use(async (config) => {
  // Try to get token from store first (faster)
  let token = useAuthStore.getState().token;

  if (!token && auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — refresh and retry once
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const newToken = await currentUser.getIdToken(true);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        }
      } catch {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
