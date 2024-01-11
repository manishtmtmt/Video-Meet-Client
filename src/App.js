import React, { useRef, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { Home } from "./pages/Home";
import { CreateRoom } from "./pages/CreateRoom";
import { JoinRoom } from "./pages/JoinRoom";
import { Room } from "./pages/Room";
import { NotFound } from "./pages/NotFound";
import themeObject from "./theme";
import LogIn from "./pages/Login";
import SignUp from "./pages/SignUp";
import ThemeContext from "./context/ThemeContext";
import { PublicRoute } from "./components/PublicRoute";
import { PrivateRoute } from "./components/PrivateRoute";
import { useSelector } from "react-redux";
import { TeacherHome } from "./pages/TeacherHome";
import { StudentHome } from "./pages/StudentHome";
import { IsTeacher } from "./components/IsTeacher";
import { IsStudent } from "./components/IsStudent";

export const App = () => {
  const socketRef = useRef();
  const [localTheme, setLocalTheme] = useState(themeObject.light);
  const [isDark, setIsDark] = useState(false);
  const {
    data: { userType },
  } = useSelector((state) => state.authReducer);

  const handleChange = () => {
    setIsDark(!isDark);
    if (!isDark) {
      setLocalTheme(themeObject.dark);
    } else {
      setLocalTheme(themeObject.light);
    }
  };
  return (
    <ThemeContext.Provider value={localTheme}>
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              {userType === "teacher" ? (
                <Navigate to="/teacher" />
              ) : userType === "student" ? (
                <Navigate to="/student" />
              ) : (
                <Navigate to="/login" />
              )}
            </PrivateRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LogIn isDark={isDark} setIsDark={handleChange} />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp isDark={isDark} setIsDark={handleChange} />
            </PublicRoute>
          }
        />
        <Route
          path="/create"
          element={
            <PrivateRoute>
              <IsTeacher>
                <CreateRoom socketRef={socketRef} />
              </IsTeacher>
            </PrivateRoute>
          }
        />
        <Route
          path="/join"
          element={
            <PrivateRoute>
              <IsStudent>
                <JoinRoom socketRef={socketRef} />
              </IsStudent>
            </PrivateRoute>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <PrivateRoute>
              <Room socketRef={socketRef} />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <PrivateRoute>
              <IsTeacher>
                <TeacherHome />
              </IsTeacher>
            </PrivateRoute>
          }
        />
        <Route
          path="/student"
          element={
            <PrivateRoute>
              <IsStudent>
                <StudentHome />
              </IsStudent>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeContext.Provider>
  );
};
