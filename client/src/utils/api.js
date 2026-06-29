import axios from "axios";
import { auth } from "../firebase/config";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  timeout: 15000,
});

// Helper to get token with a small wait if Firebase is still initializing
const getAuthToken = () => {
  return new Promise((resolve) => {
    // If user is already available, get token immediately
    if (auth.currentUser) {
      resolve(auth.currentUser.getIdToken());
      return;
    }

    // Otherwise, wait once for the state to change (max 2 seconds)
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (user) {
        resolve(await user.getIdToken());
      } else {
        resolve(null);
      }
    });

    // Timeout safety
    setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, 2000);
  });
};

// Auto-attach Firebase token
api.interceptors.request.use(async (config) => {
  try {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error("Token attachment error:", err);
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const newToken = await currentUser.getIdToken(true);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        }
      } catch {
        // Only redirect if we are not already on login/register
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
