import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import useAuthStore from "./store/authStore";
import api from "./utils/api";
import { requestNotificationPermission, onForegroundMessage } from "./firebase/config";
import toast from "react-hot-toast";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import LoadingSpinner from "./components/UI/LoadingSpinner";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  const { user, setUser, setToken, setLoading } = useAuthStore();

  useEffect(() => {
    if (user && auth.currentUser) {
      const registerFCM = async () => {
        try {
          // FORCE CLEANUP: Unregister old service workers to clear the 'InvalidAccessError'
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let reg of registrations) {
              await reg.unregister();
              console.log("Old Service Worker unregistered");
            }
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          }

          const fcmToken = await requestNotificationPermission();
          if (fcmToken) {
            await api.post("/auth/fcm-token", { fcmToken });
            console.log("FCM Token synchronized successfully");
          }
        } catch (err) {
          console.error("FCM registration process error:", err);
        }
      };
      registerFCM();

      // Listen for foreground notifications
      const unsub = onForegroundMessage((payload) => {
        console.log("Foreground message received:", payload);
        toast((t) => (
          <div onClick={() => {
            if (payload.data?.roomId) window.location.href = `/room/${payload.data.roomId}`;
            toast.dismiss(t.id);
          }} style={{ cursor: "pointer" }}>
            <b>{payload.notification?.title || "New Message"}</b>
            <div style={{ fontSize: "12px" }}>{payload.notification?.body || ""}</div>
          </div>
        ), { duration: 5000, icon: "🔔" });
      });

      return () => unsub?.();
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setToken(token);
          // Fetch our database user info
          const { data } = await api.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(data.user);
        } catch (err) {
          console.error("Failed to restore session:", err);
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [setUser, setToken, setLoading]);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <SocketProvider>
            <div className="app">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/room/:roomId"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              <Toaster
                position="top-right"
                toastOptions={{
                  style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
                  duration: 3000,
                }}
              />
            </div>
          </SocketProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
