import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "../components/SidebarLayout";
import AchievementSidebar from "../components/AchievementSidebar";
import api from "../services/api";
import { loadUser, saveUser } from "../services/auth";
import { useTheme } from "../context/ThemeContext";

export default function Achievements() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = loadUser();
    if (!currentUser) {
      navigate("/");
      return;
    }
    setUser(currentUser);
    fetchPredictions(currentUser);
  }, [navigate]);

  const fetchPredictions = async (currentUser) => {
    setLoading(true);
    try {
      const dailyStudyHours =
        currentUser?.Study_Hours_Per_Day ?? currentUser?.studyHoursPerDay ?? 6;
      const payload = {
        ...currentUser,
        target_skill: currentUser?.target_skill || currentUser?.skill || "Machine Learning",
        skill: currentUser?.target_skill || currentUser?.skill || "Machine Learning",
        stress_level: currentUser?.stress_level ?? currentUser?.stress,
        Study_Hours_Per_Day: dailyStudyHours,
        actual_study_hours: dailyStudyHours * 7,
        Sleep_Hours_Per_Day:
          currentUser?.Sleep_Hours_Per_Day ?? currentUser?.sleepHoursPerDay,
        Extracurricular_Hours_Per_Day:
          currentUser?.Extracurricular_Hours_Per_Day ?? currentUser?.extracurricularHoursPerDay,
        Physical_Activity_Hours_Per_Day:
          currentUser?.Physical_Activity_Hours_Per_Day ?? currentUser?.physicalActivityHoursPerDay,
        socialMediaHours:
          currentUser?.socialMediaHours ?? currentUser?.Social_Hours_Per_Day ?? 2,
      };

      const response = await api.post("/api/predict", payload);
      setPredictions(response.data);
      const updatedUser = { ...currentUser, ...response.data };
      saveUser(updatedUser);
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to load achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const pageText = darkMode ? "text-slate-100" : "text-slate-950";
  const heroBg = darkMode
    ? "bg-slate-900/95 border border-slate-800"
    : "bg-white border border-slate-200 shadow-sm";
  const heroMuted = darkMode ? "text-slate-300" : "text-slate-600";

  return (
    <SidebarLayout user={user} darkMode={darkMode} predictions={predictions}>
      <div className={`flex-1 overflow-auto ${darkMode ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className={`w-full px-4 sm:px-6 lg:px-8 py-6 ${pageText}`}>
          {loading ? (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-10 text-center text-slate-500 dark:text-slate-300">
              Loading achievements...
            </div>
          ) : (
            <AchievementSidebar user={user} predictions={predictions} darkMode={darkMode} />
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
