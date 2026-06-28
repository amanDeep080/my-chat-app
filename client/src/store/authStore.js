import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, requestNotificationPermission } from "../firebase/config";
import api from "../utils/api";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ loading }),
      clearError: () => set({ error: null }),

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const token = await cred.user.getIdToken();
          const { data } = await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
          set({ user: data.user, token, loading: false });

          // Register FCM token
          const fcmToken = await requestNotificationPermission();
          if (fcmToken) await api.post("/auth/fcm-token", { fcmToken }, { headers: { Authorization: `Bearer ${token}` } });

          return { success: true };
        } catch (error) {
          set({ error: error.message, loading: false });
          return { success: false, error: error.message };
        }
      },

      register: async (email, password, username) => {
        set({ loading: true, error: null });
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(cred.user, { displayName: username });
          const token = await cred.user.getIdToken();

          const { data } = await api.post("/auth/register", { username }, { headers: { Authorization: `Bearer ${token}` } });
          set({ user: data.user, token, loading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.message, loading: false });
          return { success: false, error: error.message };
        }
      },

      loginWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
          const cred = await signInWithPopup(auth, googleProvider);
          const token = await cred.user.getIdToken();

          // Check if user exists, if not register
          try {
            const { data } = await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
            set({ user: data.user, token, loading: false });
          } catch {
            const username = cred.user.displayName?.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random() * 999);
            const { data } = await api.post("/auth/register", { username, avatar: cred.user.photoURL }, {
              headers: { Authorization: `Bearer ${token}` },
            });
            set({ user: data.user, token, loading: false });
          }
          return { success: true };
        } catch (error) {
          set({ error: error.message, loading: false });
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        await signOut(auth);
        set({ user: null, token: null });
      },

      refreshToken: async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken(true);
          set({ token });
          return token;
        }
        return null;
      },
    }),
    {
      name: "chat-auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
