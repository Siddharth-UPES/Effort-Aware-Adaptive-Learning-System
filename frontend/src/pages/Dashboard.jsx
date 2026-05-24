import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { loadUser, clearUser, saveUser, getBurnoutRisk, getBurnoutLevel } from "../services/auth";
import { Card } from "../components/DashboardWidgets";
import { MetricsWidget } from "../components/MetricsWidget";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "../context/ThemeContext";
import { FaMoon, FaSun, FaFire, FaBell, FaTimes } from "react-icons/fa";

function parseWeeklyWorkload(weeklyWorkload) {
  if (typeof weeklyWorkload === "number") return weeklyWorkload;
  if (typeof weeklyWorkload === "string") {
    const match = weeklyWorkload.match(/(\d+(?:\.\d+)?)/);
    if (match) return Number(match[1]);
  }
  return null;
}

function getWeeklyWorkloadScore(hours, fallbackHours = 35) {
  const workloadHours = Math.max(0, hours ?? fallbackHours);
  return Math.min(100, Math.round((workloadHours / 50) * 100));
}

function getSleepDeficitScore(sleepHours) {
  const hours = Number(sleepHours ?? 7);
  const deficit = Math.max(0, 8 - hours);
  return Math.min(100, Math.round((deficit / 8) * 100));
}

function getNumericDifficulty(skill) {
  const low = ["Python Basics"];
  const hard = ["Machine Learning", "Deep Learning"];
  if (hard.includes(skill)) return 80;
  if (low.includes(skill)) return 30;
  return 60;
}

function getCognitiveLoadLevel(score) {
  if (score < 35) return "Low";
  if (score < 65) return "Moderate";
  return "High";
}

function computeCognitiveLoadScore(scoreProps) {
  const topicDifficulty = scoreProps.topicDifficulty ?? 60;
  const workloadScore = getWeeklyWorkloadScore(scoreProps.weeklyWorkloadHours, scoreProps.defaultWorkload ?? 35);
  const stressScore = Math.min(100, Math.max(0, Number(scoreProps.stress ?? 50)));
  const sleepDeficitScore = getSleepDeficitScore(scoreProps.sleepHours);

  return Math.round(
    topicDifficulty * 0.4 +
      workloadScore * 0.25 +
      stressScore * 0.2 +
      sleepDeficitScore * 0.15
  );
}

export default function Dashboard() {
  const { darkMode, toggleTheme } = useTheme();
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabTitle = params.get("tabTitle");
      if (tabTitle) {
        document.title = `${tabTitle} — EffortAware`;
      } else {
        document.title = `Dashboard — EffortAware`;
      }
    } catch (e) {
      // ignore
    }
  }, []);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [user, setUser] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Initializing dashboard...");
  const [roadmapData, setRoadmapData] = useState([
    { skill: "Learning effort estimation", progress: 80, status: "On track" },
    { skill: "Adaptive timetable planning", progress: 55, status: "Needs review" },
    { skill: "Stress and burnout detection", progress: 70, status: "On track" },
    { skill: "Recovery mode activation", progress: 40, status: "Delayed" },
  ]);
  const [roadmapReversed, setRoadmapReversed] = useState(false);
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

  const fetchPredictions = async (currentUser, retryAttempt = 0) => {
    setLoading(true);
    setLoadingMessage("Processing your profile and calculating adaptive learning sequence...");
    const MAX_RETRIES = 2;
    
    try {
      const dailyStudyHours = currentUser?.Study_Hours_Per_Day ?? currentUser?.studyHoursPerDay ?? 6;
      const payload = {
        ...currentUser,
        target_skill: currentUser?.target_skill || currentUser?.skill || "Machine Learning",
        skill: currentUser?.target_skill || currentUser?.skill || "Machine Learning",
        stress_level: currentUser?.stress_level ?? currentUser?.stress,
        Study_Hours_Per_Day: dailyStudyHours,
        actual_study_hours: dailyStudyHours * 7,
        Sleep_Hours_Per_Day: currentUser?.Sleep_Hours_Per_Day ?? currentUser?.sleepHoursPerDay,
        Extracurricular_Hours_Per_Day: currentUser?.Extracurricular_Hours_Per_Day ?? currentUser?.extracurricularHoursPerDay,
        Physical_Activity_Hours_Per_Day: currentUser?.Physical_Activity_Hours_Per_Day ?? currentUser?.physicalActivityHoursPerDay,
        socialMediaHours: currentUser?.socialMediaHours ?? currentUser?.Social_Hours_Per_Day ?? 2,
      };
      
      setLoadingMessage("Analyzing workload and cognitive load metrics...");
      const response = await api.post("/api/predict", payload);
      setPredictions(response.data);
      setDashboardError("");
      setRetryCount(0);
      
      if (response.data.burnout_risk >= 60) {
        setRecoveryMode(true);
        addNotification(
          "Recovery Mode Enabled",
          "High burnout risk detected. Recovery mode is now enabled automatically.",
          "warning"
        );
      }
      const updatedUser = { ...currentUser, ...response.data };
      saveUser(updatedUser);
      setUser(updatedUser);

      const adaptiveSequence =
        response.data.adaptive_sequence || response.data.learning_sequence?.weeks || [];
      const cognitiveLoadLevel = response.data.cognitive_load_level || response.data.cognitive_load || null;
      const statusLabel =
        cognitiveLoadLevel === "High"
          ? "Balanced pace"
          : cognitiveLoadLevel === "Moderate"
          ? "Planned"
          : "Accelerated";
      const progressFactor = cognitiveLoadLevel === "High" ? 15 : cognitiveLoadLevel === "Moderate" ? 20 : 25;

      if (adaptiveSequence.length) {
        setRoadmapData(
          adaptiveSequence.map((item, index) => ({
            skill: `Week ${item.week}: ${item.title}`,
            progress: Math.min(100, (index + 1) * progressFactor),
            status: statusLabel,
          }))
        );
      } else {
        await fetchLearningSequence("Machine Learning");
      }
    } catch (error) {
      console.error("Failed to fetch predictions:", error);
      
      // Retry logic for timeout errors
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        if (retryAttempt < MAX_RETRIES) {
          console.log(`Retrying... Attempt ${retryAttempt + 1}/${MAX_RETRIES}`);
          setLoadingMessage(`Processing took too long. Retrying (${retryAttempt + 1}/${MAX_RETRIES})...`);
          setRetryCount(retryAttempt + 1);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchPredictions(currentUser, retryAttempt + 1);
        }
      }
      
      setDashboardError(
        "Unable to load dashboard predictions. The backend server might be busy or offline. Please check your connection and try again."
      );
      setRetryCount(0);
      await fetchLearningSequence("Machine Learning");
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningSequence = async (skill = "Machine Learning") => {
    try {
      const response = await api.get(`/api/sequence/${encodeURIComponent(skill)}`);
      const weeks = response.data.weeks || [];
      setRoadmapData(
        weeks.map((item, index) => ({
          skill: `Week ${item.week}: ${item.title}`,
          progress: Math.min(100, (index + 1) * 20),
          status: "Planned",
        }))
      );
    } catch (error) {
      console.error("Failed to fetch learning sequence:", error);
    }
  };

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  const addNotification = (title, message, type = "info") => {
    const id = Date.now();
    const notification = { id, title, message, type };
    setNotifications((prev) => [notification, ...prev]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const weeklyStudyHoursFromUser = user?.Study_Hours_Per_Day ? user.Study_Hours_Per_Day * 7 : 42;
  const totalLearnHoursDerived = user?.totalLearnHours ?? weeklyStudyHoursFromUser * 4;
  const dailyStudyTarget = Math.round(weeklyStudyHoursFromUser / 7);
  const predictedEffortFallback = user?.Study_Hours_Per_Day ? Math.round(user.Study_Hours_Per_Day * 7 * 1.1) : 54;
  const abandonRiskFallback = Math.min(
    100,
    Math.max(
      10,
      Math.round(
        ((user?.stress ?? user?.stress_level ?? 50) * 0.4) +
          ((user?.workload_index ?? 5) * 4) +
          ((user?.pressure ?? 50) * 0.15)
      )
    )
  );

  const defaultCognitiveLoadScore = computeCognitiveLoadScore({
    topicDifficulty: getNumericDifficulty("Machine Learning"),
    weeklyWorkloadHours:
      parseWeeklyWorkload(user?.weeklyWorkload) ?? weeklyStudyHoursFromUser,
    stress: user?.stress ?? user?.stress_level ?? 50,
    sleepHours: user?.Sleep_Hours_Per_Day ?? user?.sleepHoursPerDay ?? 7,
    defaultWorkload: weeklyStudyHoursFromUser,
  });
  const defaultCognitiveLoadLevel = getCognitiveLoadLevel(defaultCognitiveLoadScore);

  const pageText = darkMode ? "text-slate-100" : "text-slate-950";
  const heroBg = darkMode
    ? "bg-slate-900/95 border border-slate-800"
    : "bg-white border border-slate-200 shadow-sm";
  const heroText = darkMode ? "text-white" : "text-slate-950";
  const titleText = darkMode ? "text-white" : "text-slate-950";
  const heroMuted = darkMode ? "text-slate-300" : "text-slate-600";
  const panelText = darkMode ? "text-white" : "text-slate-950";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";
  const cardBorder = darkMode ? "border-slate-700" : "border-slate-200";
  const cardBg = darkMode ? "bg-slate-900/70" : "bg-slate-50";

  const profile = user
    ? {
        name: user.name,
        role: user.role || "Effort-Aware Learner",
        focusScore: Math.round(predictions?.focus_score ?? user.focusScore ?? 60),
        loadScore: Math.round(predictions?.load_score ?? user.loadScore ?? 50),
        studyEfficiency: Math.round(predictions?.study_efficiency ?? user.studyEfficiency ?? 72),
        lifestyleBalance: Math.round(predictions?.lifestyle_balance ?? user.lifestyleBalance ?? 60),
        stress: Math.round(user.stress ?? user.stress_level ?? 4),
        pressure: Math.round(user.pressure ?? 50),
        effortHours: Math.round(predictions?.predicted_effort ?? predictedEffortFallback),
        completionTime: (predictions?.completion_time ?? user.completionTime) || "8 Days",
        weeklyStudyHours: weeklyStudyHoursFromUser,
        actualEffort: Math.round(predictions?.actual_hours ?? weeklyStudyHoursFromUser),
        dailyStudyTarget,
        weeklyWorkload:
          user?.weeklyWorkload && user.weeklyWorkload !== "0 hrs/week"
            ? user.weeklyWorkload
            : `${weeklyStudyHoursFromUser} hrs/week`,
        totalLearnHours: totalLearnHoursDerived,
        difficultyLevel: user.difficultyLevel || "High",
        cognitiveLoadLevel: predictions?.cognitive_load_level ?? user.cognitiveLoad ?? defaultCognitiveLoadLevel,
        cognitiveLoadScore: predictions?.cognitive_load_score ?? defaultCognitiveLoadScore,
        abandonRisk: predictions?.burnout_risk ?? abandonRiskFallback,
        confidence: predictions?.confidence ?? user.confidence ?? 79,
      }
    : {
        name: "Loading...",
        role: "Effort-Aware Learner",
        focusScore: 82,
        loadScore: 91,
        projectLoad: 91,
        studyEfficiency: 74,
        lifestyleBalance: 60,
        stress: 88,
        pressure: 72,
        effortHours: 54,
        completionTime: "7 Days",
        weeklyStudyHours: 42,
        weeklyWorkload: "32 hrs/week",
        totalLearnHours: 120,
        difficultyLevel: "High",
        cognitiveLoadLevel: "Moderate",
        cognitiveLoadScore: 55,
        abandonRisk: 72,
        confidence: 79,
      };


  const dashboardBurnoutRisk = getBurnoutRisk(user, predictions);
  const riskText = getBurnoutLevel(dashboardBurnoutRisk);
  const adaptiveSummary =
    predictions?.adaptive_summary ||
    (predictions?.cognitive_load_level === "High"
      ? "High cognitive load detected: pace reduced, revision buffer added, and recovery-focused sequencing applied."
      : predictions?.cognitive_load_level === "Moderate"
      ? "Balanced adaptive roadmap is active with steady progress and review windows."
      : "Low cognitive load detected: accelerated pacing and stronger weekly load are applied.");
  const showResetPopup = profile.loadScore > 88 || profile.stress > 85 || dashboardBurnoutRisk >= 60;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${darkMode ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className={`rounded-3xl border px-8 py-7 shadow-2xl text-center ${darkMode ? "border-slate-700 bg-slate-900/95 text-white" : "border-slate-200 bg-white text-slate-950"}`}>
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
          </div>
          <p className="text-lg font-semibold">{loadingMessage}</p>
          {retryCount > 0 && (
            <p className="text-sm text-slate-400 mt-2">Retry attempt {retryCount}</p>
          )}
          <p className="text-xs text-slate-500 mt-3">This may take up to 30 seconds...</p>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${darkMode ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className={`max-w-xl rounded-[2rem] border px-8 py-10 shadow-2xl text-left ${darkMode ? "border-slate-700 bg-slate-900/95 text-white" : "border-slate-200 bg-white text-slate-950"}`}>
          <div className="flex items-start gap-3 mb-4">
            <div className="text-2xl">⚠️</div>
            <h2 className="text-2xl font-bold">Dashboard Load Issue</h2>
          </div>
          <p className="mb-6 text-sm leading-relaxed">{dashboardError}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setDashboardError("");
                fetchPredictions(user);
              }}
              className="w-full rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-400 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                navigate("/");
              }}
              className="w-full rounded-2xl border border-slate-300 bg-transparent px-5 py-3 text-sm font-semibold hover:bg-slate-100 transition"
            >
              Return to Home
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            💡 Tip: The backend server might be busy loading ML models. Give it another try!
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout user={user} darkMode={darkMode} onBack={() => navigate(-1)} predictions={predictions}>
      <div className="flex-1 overflow-auto">
        <div className={`w-full px-4 sm:px-6 lg:px-8 py-6 ${pageText}`}>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/80 font-semibold">Student dashboard</p>
              <h1 className={`mt-2 text-4xl font-bold ${heroText}`}>Learning performance overview</h1>
              <p className={`mt-3 text-sm leading-relaxed ${heroMuted}`}>
                Track effort, manage workload, and monitor recovery readiness in one polished dashboard.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setRecoveryMode(!recoveryMode);
                  addNotification(
                    "Recovery Mode",
                    `Recovery mode has been turned ${!recoveryMode ? "ON" : "OFF"}. Take it easy!`,
                    !recoveryMode ? "success" : "info"
                  );
                }}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
                  recoveryMode
                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/30"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30"
                }`}
              >
                <FaFire /> {recoveryMode ? "Recovery ON" : "Recovery OFF"}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative rounded-2xl p-3 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 ${
                    darkMode
                      ? "bg-slate-800 hover:bg-slate-700 text-yellow-400"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-900"
                  }`}
                  aria-label="Notifications"
                >
                  <FaBell className="text-lg" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className={`absolute right-0 top-full mt-2 w-80 rounded-3xl border shadow-2xl z-50 ${darkMode ? "border-slate-700 bg-slate-900/95" : "border-slate-200 bg-white"}`}>
                    <div className={`border-b px-4 py-3 flex items-center justify-between ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                      <h3 className={`font-semibold text-sm uppercase tracking-[0.2em] ${darkMode ? "text-cyan-300" : "text-cyan-700"}`}>
                        Notifications
                      </h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className={`rounded-full p-1 transition ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                      >
                        <FaTimes className="text-sm" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className={`p-4 text-center text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`border-b px-4 py-3 last:border-0 ${
                              notif.type === "success"
                                ? darkMode
                                  ? "bg-emerald-500/10 border-emerald-500/20"
                                  : "bg-emerald-50 border-emerald-200"
                                : notif.type === "warning"
                                ? darkMode
                                  ? "bg-amber-500/10 border-amber-500/20"
                                  : "bg-amber-50 border-amber-200"
                                : darkMode
                                ? "bg-slate-800/50 border-slate-700"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <p className={`text-sm font-semibold ${notif.type === "success" ? darkMode ? "text-emerald-300" : "text-emerald-700" : notif.type === "warning" ? darkMode ? "text-amber-300" : "text-amber-700" : darkMode ? "text-white" : "text-slate-900"}`}>
                              {notif.title}
                            </p>
                            <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                              {notif.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  toggleTheme();
                  addNotification(
                    "Theme Updated",
                    `Switched to ${!darkMode ? "dark" : "light"} mode`,
                    "info"
                  );
                }}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className={`rounded-2xl p-3 text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 ${
                  darkMode
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-yellow-300 shadow-indigo-500/30"
                    : "bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 shadow-amber-400/30"
                }`}
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>

              <button
                onClick={handleLogout}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid gap-4 items-start lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <section className={`rounded-[2rem] p-4 shadow-[0_40px_120px_-55px_rgba(14,165,233,0.5)] ${heroBg}`}>
                <div className="flex flex-col gap-4 lg:gap-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/80 font-semibold">Performance snapshot</p>
                    <h2 className={`mt-2 text-3xl font-bold ${heroText}`}>Essential study metrics</h2>
                    <p className={`mt-3 text-sm leading-relaxed ${heroMuted}`}>
                      Clear, actionable insights for effort, balance, and recovery planning.
                    </p>
                  </div>

                  <div className={`rounded-2xl p-4 border-l-4 ${recoveryMode ? "bg-emerald-500/10 border-emerald-500/50" : "bg-cyan-500/10 border-cyan-500/50"}`}>
                    <p className={`text-sm font-semibold ${recoveryMode ? "text-emerald-300" : "text-cyan-300"}`}>
                      💡 {recoveryMode ? "Recovery Mode Active - Rest & Recharge" : "Focus Mode Active - Stay on Track"}
                    </p>
                    <p className={`mt-1 text-xs ${recoveryMode ? "text-emerald-200/80" : "text-cyan-200/80"}`}>
                      {recoveryMode
                        ? "You're in recovery mode. Reduce workload, take breaks, and prioritize rest to prevent burnout."
                        : "You're in focus mode. Maintain your study rhythm, stay motivated, and chase your learning goals."}
                    </p>
                  </div>

                  {showResetPopup && (
                    <div className={`rounded-2xl border-l-4 p-4 ${darkMode ? "border-rose-500/50 bg-rose-500/10" : "border-rose-400 bg-rose-50"}`}>
                      <p className={`text-sm font-semibold ${darkMode ? "text-rose-300" : "text-rose-600"}`}>
                        ⚠️ High Workload Alert
                      </p>
                      <p className={`mt-1 text-xs ${darkMode ? "text-rose-200/80" : "text-rose-700/80"}`}>
                        Your stress and load scores are elevated. We recommend switching to recovery mode or slowing the pace for the next 24 hours.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <Card darkMode={darkMode} className="rounded-[2rem] p-4">
                <div className="flex items-center justify-between">
                  <div>
                <h2 className="text-sm uppercase tracking-[0.25em] text-cyan-400/80 font-semibold">Learning roadmap</h2>
                <p className="text-[11px] mt-1 uppercase tracking-[0.2em] text-slate-500">Target skill: {predictions?.target_skill || user?.target_skill || user?.skill || "Machine Learning"}</p>
              </div>
                  <button
                    onClick={() => {
                      setRoadmapData((prev) => [...prev].reverse());
                      setRoadmapReversed((prev) => !prev);
                    }}
                    className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] transition ${darkMode ? "bg-slate-900/80 text-cyan-300 hover:bg-slate-800" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    Reorder
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {roadmapData.map((item, index) => (
                    <div key={index} className={`rounded-3xl p-4 border ${cardBorder} ${cardBg}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className={`font-semibold ${panelText}`}>{item.skill}</p>
                        <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">{item.progress}%</span>
                      </div>
                      <div className={`mt-3 h-2 rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                        <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* <Card darkMode={darkMode} className="rounded-[2rem] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-400/80 font-semibold">Performance</p>
                    <h2 className={`mt-3 text-2xl font-semibold ${titleText}`}>Weekly progress</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${darkMode ? "bg-slate-900/95 text-cyan-300" : "bg-slate-100 text-slate-700"}`}>Updated now</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className={`rounded-3xl p-4 ${cardBg} border ${cardBorder}`}>
                    <p className={`text-xs uppercase ${mutedText}`}>Daily study target</p>
                    <p className={`mt-3 text-2xl font-semibold ${panelText}`}>{dailyStudyTarget} hrs</p>
                  </div>
                  <div className={`rounded-3xl p-4 ${cardBg} border ${cardBorder}`}>
                    <p className={`text-xs uppercase ${mutedText}`}>Learning load</p>
                    <p className={`mt-3 text-2xl font-semibold ${panelText}`}>{profile.weeklyWorkload}</p>
                  </div>
                </div>
              </Card> */}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-4">
              <MetricsWidget 
                study={Math.round(weeklyStudyHoursFromUser)}
                efficiency={Math.round(profile.studyEfficiency)}
                burnout={dashboardBurnoutRisk}
                darkMode={darkMode}
              />

              <Card darkMode={darkMode} className="rounded-[2rem] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-400/80 font-semibold">Performance</p>
                    <h2 className={`mt-3 text-2xl font-semibold ${titleText}`}>Weekly progress</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${darkMode ? "bg-slate-900/95 text-cyan-300" : "bg-slate-100 text-slate-700"}`}>Updated now</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className={`rounded-3xl p-4 ${cardBg} border ${cardBorder}`}>
                    <p className={`text-xs uppercase ${mutedText}`}>Daily study target</p>
                    <p className={`mt-3 text-2xl font-semibold ${panelText}`}>{dailyStudyTarget} hrs</p>
                  </div>
                  <div className={`rounded-3xl p-4 ${cardBg} border ${cardBorder}`}>
                    <p className={`text-xs uppercase ${mutedText}`}>Learning load</p>
                    <p className={`mt-3 text-2xl font-semibold ${panelText}`}>{profile.weeklyWorkload}</p>
                  </div>
                  <div className={`rounded-3xl p-4 ${cardBg} border ${cardBorder}`}>
                    <p className={`text-xs uppercase ${mutedText}`}>Cognitive load</p>
                    <p className={`mt-3 text-2xl font-semibold ${panelText}`}>{profile.cognitiveLoadLevel}</p>
                    <p className={`mt-1 text-sm ${mutedText}`}>{profile.cognitiveLoadScore} score</p>
                  </div>
                </div>
              </Card>
            </aside>
          </div>
          
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card darkMode={darkMode}>
              <p className={`text-xs uppercase tracking-[0.3em] ${mutedText}`}>Predicted Effort</p>
              <p className={`mt-3 text-3xl font-semibold ${panelText}`}>{profile.effortHours} hrs</p>
            </Card>
            <Card darkMode={darkMode}>
              <p className={`text-xs uppercase tracking-[0.3em] ${mutedText}`}>Weekly Hours</p>
              <p className={`mt-3 text-3xl font-semibold ${panelText}`}>{profile.weeklyStudyHours}h</p>
            </Card>
            <Card darkMode={darkMode}>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Burnout Risk</p>
              <div className="mt-3 flex items-center gap-3">
                <span className={`rounded-full px-4 py-3 text-sm font-semibold ${
                  riskText === "High"
                    ? "bg-rose-500/20 text-rose-300"
                    : riskText === "Medium"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-emerald-500/20 text-emerald-300"
                }`}>{riskText}</span>
              </div>
            </Card>
            <Card darkMode={darkMode}>
              <p className={`text-xs uppercase tracking-[0.3em] ${mutedText}`}>Actual Effort</p>
              <p className={`mt-3 text-3xl font-semibold ${panelText}`}>{profile.actualEffort}h</p>
            </Card>
          </div>

            <div className="mt-4">
            <Card darkMode={darkMode}>
              <h2 className="text-sm uppercase tracking-[0.25em] text-cyan-400/80 font-semibold">AI adaptive suggestion</h2>
              <p className={`mt-4 text-sm leading-7 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                {adaptiveSummary}
              </p>
              <button onClick={() => navigate("/learning-path")} className="mt-5 w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                View plan
              </button>
            </Card>
          </div>

        </div>
      </div>
    </SidebarLayout>
  );
}
