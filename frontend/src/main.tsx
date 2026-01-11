import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./index.css";
import "./styles/index.css";
import "./styles/tailwind.css";
import "./styles/theme.css";

import App from "./App";
import { SignUp } from "./SignUp";
import { SignIn } from "./SignIn";
import "./App.css"

function RootRoutes() {
  const isLoggedIn = !!localStorage.getItem("access_token");

  return (
    <Routes>
      {/* SMART ROOT ROUTE */}
      <Route
        path="/"
        element={
          isLoggedIn
            ? <Navigate to="/app" replace />
            : <Navigate to="/signup" replace />
        }
      />

      {/* AUTH PAGES */}
      <Route
        path="/signup"
        element={isLoggedIn ? <Navigate to="/app" replace /> : <SignUp />}
      />
      <Route
        path="/signin"
        element={isLoggedIn ? <Navigate to="/app" replace /> : <SignIn />}
      />

      {/* PROTECTED DASHBOARD */}
      <Route
        path="/app"
        element={isLoggedIn ? <App /> : <Navigate to="/signin" replace />}
      />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <RootRoutes />
    </BrowserRouter>
  </StrictMode>
);
