import React from "react";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import LearningPath from "./pages/LearningPath";
import Assignments from "./pages/Assignments";
import Analytics from "./pages/Analytics";
import Burnout from "./pages/Burnout";
import CalendarPage from "./pages/CalendarPage";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import Timetable from "./pages/Timetable";
import Assessment from "./pages/Assessment";
import InitialAssessmentPage from "./pages/InitialAssessmentPage";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {

  return (

    <ThemeProvider>
      <BrowserRouter>

        <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/forgot" element={<ForgotPassword />} />

        <Route path="/assessment" element={<Assessment />} />

        <Route path="/onboarding" element={<InitialAssessmentPage />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/courses" element={<Courses />} />

        <Route path="/learning-path" element={<LearningPath />} />

        <Route path="/assignments" element={<Assignments />} />

        <Route path="/analytics" element={<Analytics />} />

        <Route path="/achievements" element={<Achievements />} />

        <Route path="/burnout" element={<Burnout />} />

        <Route path="/calendar" element={<CalendarPage />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/timetable" element={<Timetable />} />

      </Routes>

    </BrowserRouter>
    </ThemeProvider>

  );

}
