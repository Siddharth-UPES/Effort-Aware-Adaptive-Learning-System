import { useEffect, useState } from "react";
import { loadUser, calculateLoginStreak, getBurnoutRisk } from "../services/auth";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, 
  CartesianGrid, Legend, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar
} from "recharts";
import api from "../services/api";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "../context/ThemeContext";

export default function Analytics() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [predictions, setPredictions] = useState(null);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [physicalActivity, setPhysicalActivity] = useState(1);
  const [socialMediaHours, setSocialMediaHours] = useState(2);
  const [zoomedBurden, setZoomedBurden] = useState(false);
  const [workloadHistory, setWorkloadHistory] = useState([
    { period: "Week 1", burden: 62 },
    { period: "Week 2", burden: 68 },
    { period: "Week 3", burden: 60 },
    { period: "Week 4", burden: 55 },
  ]);
  const [streakDays, setStreakDays] = useState(0);
  const [badges, setBadges] = useState(["Focus Builder", "Balanced Pace"]);
  const [actualProgress, setActualProgress] = useState({
    skillsCompleted: 12,
    totalEffort: 45,
    dailyProgress: [
      { date: "2024-01-01", hours: 3.5, skills: 2 },
      { date: "2024-01-02", hours: 4.2, skills: 3 },
      { date: "2024-01-03", hours: 2.8, skills: 1 },
      { date: "2024-01-04", hours: 5.1, skills: 4 },
      { date: "2024-01-05", hours: 3.9, skills: 2 },
      { date: "2024-01-06", hours: 4.5, skills: 3 },
      { date: "2024-01-07", hours: 3.2, skills: 2 },
    ]
  });
  const [performanceTrends, setPerformanceTrends] = useState({
    timeOfDay: [
      { name: "Morning", value: 74, sessions: 12 },
      { name: "Afternoon", value: 68, sessions: 8 },
      { name: "Evening", value: 61, sessions: 15 },
      { name: "Night", value: 49, sessions: 5 },
    ],
    subjectArea: [
      { name: "Math", progress: 78, sessions: 20, avgTime: 45 },
      { name: "Science", progress: 64, sessions: 15, avgTime: 52 },
      { name: "Coding", progress: 82, sessions: 25, avgTime: 38 },
      { name: "Writing", progress: 71, sessions: 18, avgTime: 41 },
    ],
    fatiguePatterns: [
      { name: "Sleep Quality", impact: 72, trend: "improving" },
      { name: "Rest Breaks", impact: 64, trend: "stable" },
      { name: "Social Balance", impact: 56, trend: "declining" },
    ]
  });

  useEffect(() => {
    const currentUser = loadUser();
    if (currentUser) {
      setUser(currentUser);
      setSleepQuality(currentUser.sleep_quality ?? 3);
      setPhysicalActivity(currentUser.Physical_Activity_Hours_Per_Day || currentUser?.physicalActivityHoursPerDay || 1);
      setSocialMediaHours(currentUser.socialMediaHours || 2);

      // Calculate streak based on login history for this user
      const loginStreak = calculateLoginStreak(currentUser);
      setStreakDays(loginStreak);

      const dailyStudyHours = currentUser?.Study_Hours_Per_Day ?? currentUser?.studyHoursPerDay ?? 6;
      const predictPayload = {
        ...currentUser,
        actual_study_hours: dailyStudyHours * 7,
      };
      api.post("/api/predict", predictPayload)
        .then((response) => {
          setPredictions(response.data);
          setMetrics({
            focusScore: response.data.focus_score || currentUser.focusScore || 68,
            burnoutRisk: getBurnoutRisk(currentUser, response.data),
            loadScore: response.data.load_score || currentUser.loadScore || 62,
            confidence: response.data.confidence || currentUser.confidence || 70,
            predictedEffort: response.data.predicted_effort || 36,
            completionTime: response.data.completion_time || "1-2 Weeks",
            burnoutLevel: response.data.burnout_level || "Medium",
            weeklyHours: currentUser.weeklyWorkload || "32 hrs/week",
            studyEfficiency: response.data.study_efficiency || 72,
            lifestyleBalance: response.data.lifestyle_balance || 60,
            pressureLevel: response.data.pressure_level || currentUser.pressure || 55,
          });
          if (response.data.workload_monitor?.monthly_history) {
            setWorkloadHistory(response.data.workload_monitor.monthly_history);
          }
          setBadges(response.data.achievement_badges || ["Focus Builder", "Balanced Pace"]);

          // Enhanced analytics data
          setActualProgress({
            skillsCompleted: response.data.skills_completed || 12,
            totalEffort: response.data.actual_hours || response.data.total_effort_invested || Math.round((currentUser.Study_Hours_Per_Day || 1) * 7),
            dailyProgress: response.data.daily_progress || [
              { date: "2024-01-01", hours: 3.5, skills: 2 },
              { date: "2024-01-02", hours: 4.2, skills: 3 },
              { date: "2024-01-03", hours: 2.8, skills: 1 },
              { date: "2024-01-04", hours: 5.1, skills: 4 },
              { date: "2024-01-05", hours: 3.9, skills: 2 },
              { date: "2024-01-06", hours: 4.5, skills: 3 },
              { date: "2024-01-07", hours: 3.2, skills: 2 },
            ]
          });

          setPerformanceTrends({
            timeOfDay: response.data.time_of_day_performance || [
              { name: "Morning", value: 74, sessions: 12 },
              { name: "Afternoon", value: 68, sessions: 8 },
              { name: "Evening", value: 61, sessions: 15 },
              { name: "Night", value: 49, sessions: 5 },
            ],
            subjectArea: response.data.subject_area_performance || [
              { name: "Math", progress: 78, sessions: 20, avgTime: 45 },
              { name: "Science", progress: 64, sessions: 15, avgTime: 52 },
              { name: "Coding", progress: 82, sessions: 25, avgTime: 38 },
              { name: "Writing", progress: 71, sessions: 18, avgTime: 41 },
            ],
            fatiguePatterns: response.data.fatigue_patterns || [
              { name: "Sleep Quality", impact: 72, trend: "improving" },
              { name: "Rest Breaks", impact: 64, trend: "stable" },
              { name: "Social Balance", impact: 56, trend: "declining" },
            ]
          });
        })
        .catch(() => {
          setMetrics({
            focusScore: currentUser.focusScore || 68,
            burnoutRisk: getBurnoutRisk(currentUser, null),
            loadScore: currentUser.loadScore || 62,
            confidence: currentUser.confidence || 70,
            predictedEffort: 36,
            completionTime: "1-2 Weeks",
            burnoutLevel: "Medium",
            weeklyHours: currentUser.weeklyWorkload || "32 hrs/week",
            studyEfficiency: 72,
            lifestyleBalance: 60,
            pressureLevel: currentUser.pressure || 55,
          });
          setBadges(["Focus Builder", "Balanced Pace"]);

          // Set default enhanced analytics
          setActualProgress({
            skillsCompleted: 12,
            totalEffort: Math.round((currentUser.Study_Hours_Per_Day || 1) * 7),
            dailyProgress: [
              { date: "2024-01-01", hours: 3.5, skills: 2 },
              { date: "2024-01-02", hours: 4.2, skills: 3 },
              { date: "2024-01-03", hours: 2.8, skills: 1 },
              { date: "2024-01-04", hours: 5.1, skills: 4 },
              { date: "2024-01-05", hours: 3.9, skills: 2 },
              { date: "2024-01-06", hours: 4.5, skills: 3 },
              { date: "2024-01-07", hours: 3.2, skills: 2 },
            ]
          });

          setPerformanceTrends({
            timeOfDay: [
              { name: "Morning", value: 74, sessions: 12 },
              { name: "Afternoon", value: 68, sessions: 8 },
              { name: "Evening", value: 61, sessions: 15 },
              { name: "Night", value: 49, sessions: 5 },
            ],
            subjectArea: [
              { name: "Math", progress: 78, sessions: 20, avgTime: 45 },
              { name: "Science", progress: 64, sessions: 15, avgTime: 52 },
              { name: "Coding", progress: 82, sessions: 25, avgTime: 38 },
              { name: "Writing", progress: 71, sessions: 18, avgTime: 41 },
            ],
            fatiguePatterns: [
              { name: "Sleep Quality", impact: 72, trend: "improving" },
              { name: "Rest Breaks", impact: 64, trend: "stable" },
              { name: "Social Balance", impact: 56, trend: "declining" },
            ]
          });
        });
    }
  }, []);

  const actualVsPredictedData = [
    {
      name: "Predicted",
      hours: predictions?.actual_vs_predicted?.predicted_hours || metrics.predictedEffort || 36,
    },
    {
      name: "Actual",
      hours: predictions?.actual_vs_predicted?.actual_hours || actualProgress.totalEffort || Math.round((user?.Study_Hours_Per_Day || 1) * 7),
    },
  ];

  const effortEfficiency = predictions?.effort_efficiency || Math.round((actualProgress.skillsCompleted / Math.max(actualProgress.totalEffort, 1)) * 100);
  const badgeList = predictions?.achievement_badges || badges;
  const progressAlert = predictions?.predictive_alert || (metrics.burnoutRisk >= 70 ? "You're on pace to burnout in 5 days if you continue at this intensity." : null);

  const exportReport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      user: user || {},
      metrics,
      predictions,
      actualProgress,
      performanceTrends,
      streakDays,
      badges: badgeList,
      effortEfficiency,
      progressAlert,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `effort-aware-progress-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPdfReport = () => {
    const reportHtml = `
      <html>
        <head>
          <title>Learning Progress Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1, h2, h3 { margin: 0 0 12px; }
            .section { margin-bottom: 24px; }
            .badge { display: inline-block; background: #22c55e; color: white; border-radius: 9999px; padding: 6px 12px; margin: 4px 4px 0 0; }
            .metric { margin: 8px 0; }
            .celebration { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .alert { background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <h1>Effort-Aware Learning Progress Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>

          <div class="section">
            <h2>Key Metrics</h2>
            <div class="metric">Focus Score: ${metrics.focusScore}%</div>
            <div class="metric">Burnout Risk: ${metrics.burnoutRisk}%</div>
            <div class="metric">Effort Efficiency: ${effortEfficiency}%</div>
            <div class="metric">Skills Completed: ${actualProgress.skillsCompleted}</div>
            <div class="metric">Total Effort: ${actualProgress.totalEffort}h</div>
            <div class="metric">Learning Streak: ${streakDays} days</div>
          </div>

          <div class="section">
            <h2>Progress Celebrations</h2>
            <div class="celebration">
              <p><strong>${celebrationMessage}</strong></p>
            </div>
          </div>

          ${progressAlert ? `
          <div class="section">
            <h2>Predictive Alerts</h2>
            <div class="alert">
              <p><strong>${progressAlert}</strong></p>
            </div>
          </div>
          ` : ''}

          <div class="section">
            <h2>Achievement Badges</h2>
            ${badgeList.map((badge) => `<span class="badge">${badge}</span>`).join(" ")}
          </div>

          <div class="section">
            <h2>Performance Trends</h2>
            <h3>Time of Day Performance</h3>
            ${performanceTrends.timeOfDay.map(item => `<div class="metric">${item.name}: ${item.value}% (${item.sessions} sessions)</div>`).join("")}
            <h3>Subject Area Performance</h3>
            ${performanceTrends.subjectArea.map(item => `<div class="metric">${item.name}: ${item.progress}% (${item.sessions} sessions, ${item.avgTime}min avg)</div>`).join("")}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "ProgressReport", "width=900,height=700");
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const timeOfDayTrend = performanceTrends.timeOfDay;
  const subjectAreaData = performanceTrends.subjectArea;
  const fatigueImpact = performanceTrends.fatiguePatterns;

  const celebrationMessage = streakDays >= 14
    ? "🎉 Incredible! Your 2-week learning streak is legendary — you're building habits that will last a lifetime!"
    : streakDays >= 7
    ? "Awesome! Your learning streak is strong — consistency is your advantage. Keep the momentum!"
    : effortEfficiency >= 90
    ? "Outstanding! Your effort efficiency is elite — you're maximizing every study hour!"
    : effortEfficiency >= 80
    ? "Excellent! Your effort efficiency is pushing into the advanced zone — great work optimizing your time!"
    : actualProgress.skillsCompleted >= 20
    ? "Impressive progress! You've mastered " + actualProgress.skillsCompleted + " skills — your dedication is paying off!"
    : metrics.burnoutRisk < 30
    ? "Balanced and focused! Your low burnout risk means you're studying sustainably — smart approach!"
    : "Keep going — consistent study and balanced rest will improve your analytics. You're on the right path!";

  const trendData = [
    { name: "Week 1", Focus: metrics.focusScore || 60, Burnout: metrics.burnoutRisk || 55, Load: metrics.loadScore || 62 },
    { name: "Week 2", Focus: (metrics.focusScore || 60) + 5, Burnout: Math.max(0, (metrics.burnoutRisk || 55) - 4), Load: (metrics.loadScore || 62) + 2 },
    { name: "Week 3", Focus: (metrics.focusScore || 60) + 10, Burnout: Math.max(0, (metrics.burnoutRisk || 55) - 6), Load: (metrics.loadScore || 62) + 5 },
    { name: "Week 4", Focus: (metrics.focusScore || 60) + 6, Burnout: Math.max(0, (metrics.burnoutRisk || 55) - 2), Load: (metrics.loadScore || 62) + 3 },
  ];

  const completionData = [
    { name: "Assignments", Completed: 78, Delayed: 22 },
    { name: "Projects", Completed: 65, Delayed: 35 },
    { name: "Quizzes", Completed: 88, Delayed: 12 },
    { name: "Reading", Completed: 72, Delayed: 28 },
  ];

  const confidenceData = [
    { name: "Course 1", Confidence: 72 },
    { name: "Course 2", Confidence: 64 },
    { name: "Course 3", Confidence: 79 },
    { name: "Course 4", Confidence: 68 },
  ];

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#8b5cf6"];

  const focusTrend = metrics.focusScore || 60;
  const burnoutTrend = metrics.burnoutRisk || 55;
  const loadTrend = metrics.loadScore || 62;
  const pressureValue = metrics.pressureLevel || user?.pressure || user?.pressure_level || 55;
  const burdenChartData = (() => {
    const raw = [
      { name: "Workload", value: metrics.loadScore || 62 },
      { name: "Pressure", value: pressureValue },
    ];
    const total = raw.reduce((sum, item) => sum + item.value, 0) || 1;
    return raw.map((item) => ({
      name: item.name,
      value: Math.round((item.value / total) * 100),
    }));
  })();

  const burnoutComponentsData = predictions?.burnout_components
    ? [
        { name: "Stress", value: Math.round((predictions.burnout_components.stress || 0) * 100) },
        { name: "Anxiety", value: Math.round((predictions.burnout_components.anxiety || 0) * 100) },
        { name: "Depression", value: Math.round((predictions.burnout_components.depression || 0) * 100) },
        { name: "Pressure", value: Math.round((predictions.burnout_components.pressure || 0) * 100) },
        { name: "Workload", value: Math.round((predictions.burnout_components.workload || 0) * 100) },
      ]
    : [];

  const radarData = [
    { category: "Focus", value: metrics.focusScore || 60 },
    { category: "Load", value: metrics.loadScore || 60 },
    { category: "Confidence", value: metrics.confidence || 60 },
    { category: "Balance", value: metrics.lifestyleBalance || 60 },
  ];

  const effortData = [
    { name: "Predicted", effort: metrics.predictedEffort || 36, fill: "#06b6d4" },
  ];

  const pageText = darkMode ? "text-white" : "text-slate-950";
  const pageBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  const sectionBg = darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-950";
  const cardBg = darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-950";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  return (
    <SidebarLayout user={user} darkMode={darkMode} predictions={predictions}>
      <div className={`p-4 ${pageBg} ${pageText}`}>
        <div className="w-full space-y-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className={`text-4xl font-bold ${pageText}`}>Learner Analytics</h1>
              <p className={`${mutedText} mt-2`}>Track workload, stress, study efficiency, and lifestyle balance.</p>
            </div>
            <div className={`rounded-3xl border px-6 py-5 ${sectionBg} ${borderColor}`}>
              <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Overview</p>
              <p className="mt-3 text-2xl font-semibold">{user?.name || "Your"} Dashboard</p>
              <p className={`mt-2 ${mutedText}`}>Weekly target: {metrics.weeklyHours}</p>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Focus Score</p>
              <p className="mt-4 text-4xl font-semibold">{metrics.focusScore}%</p>
              <p className={`mt-3 ${mutedText}`}>Study focus under current load.</p>
            </div>
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Burnout Risk</p>
              <p className="mt-4 text-4xl font-semibold text-orange-400">{metrics.burnoutRisk}%</p>
              <p className={`mt-3 ${mutedText}`}>{metrics.burnoutLevel || "Medium"} risk</p>
            </div>
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Pressure</p>
              <p className="mt-4 text-4xl font-semibold text-amber-300">{pressureValue}%</p>
              <p className={`mt-3 ${mutedText}`}>Academic stress load.</p>
            </div>
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Study Efficiency</p>
              <p className="mt-4 text-4xl font-semibold text-emerald-300">{metrics.studyEfficiency || 72}%</p>
              <p className={`mt-3 ${mutedText}`}>Efficiency based on current workflow.</p>
            </div>
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Lifestyle Balance</p>
              <p className="mt-4 text-4xl font-semibold text-cyan-400">{metrics.lifestyleBalance || 60}%</p>
              <p className={`mt-3 ${mutedText}`}>Sleep, activity and social media balance.</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Effort Efficiency</p>
              <p className="mt-4 text-4xl font-semibold text-cyan-400">{effortEfficiency}%</p>
              <p className={`mt-3 ${mutedText}`}>Performance vs predicted effort.</p>
            </div>
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Streak</p>
              <p className="mt-4 text-4xl font-semibold text-emerald-300">{streakDays} days</p>
              <p className={`mt-3 ${mutedText}`}>Daily login streak consistency.</p>
            </div>
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor} flex flex-col justify-between`}>
              <div>
                <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Export Summary</p>
                <p className={`mt-3 ${mutedText}`}>Download a progress report for your current analytics.</p>
              </div>
              <div className="grid gap-3">
                <button
                  onClick={exportReport}
                  className="rounded-3xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                >
                  Export JSON
                </button>
                <button
                  onClick={exportPdfReport}
                  className="rounded-3xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
                >
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Achievement Badges</p>
                <p className={`mt-2 text-sm ${mutedText}`}>Earned badges based on milestones, consistency, and progress.</p>
              </div>
              <span className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-200">{badgeList.length} badges</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {badgeList.map((badge) => (
                <div key={badge} className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-sm font-semibold text-cyan-100">
                  {badge}
                </div>
              ))}
            </div>
          </div>

          <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Progress Alerts</h2>
                  <p className={`mt-2 ${mutedText} text-sm`}>Live warnings and success cues from model prediction.</p>
                </div>
                <div className={`rounded-3xl px-4 py-3 ${predictions?.predictive_alert ? 'bg-orange-500/15 text-orange-200 border border-orange-400/30' : 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/30'}`}>
                  <p className="text-sm font-semibold">{predictions?.predictive_alert || "On pace and stabilizing."}</p>
                </div>
              </div>
              <div className={`mt-6 rounded-3xl border ${borderColor} ${cardBg} p-5`}>
                <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Celebration</p>
                <p className="mt-3 text-lg font-semibold">{celebrationMessage}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {badgeList.slice(0, 4).map((badge) => (
                    <span key={badge} className="inline-flex rounded-full bg-cyan-500/15 px-3 py-1 text-sm font-semibold text-cyan-200">{badge}</span>
                  ))}
                </div>
              </div>

              <div className={`mt-6 rounded-3xl border ${borderColor} ${cardBg} p-5`}>
                <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Social Balance</p>
                <p className="mt-3 text-3xl font-semibold text-emerald-300">{metrics.lifestyleBalance || 60}%</p>
                <p className={`mt-2 text-sm ${mutedText}`}>Overall life-study equilibrium</p>
              </div>

              <div className={`mt-6 rounded-3xl border ${borderColor} ${cardBg} p-5`}>
                <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Current efficiency</p>
                <p className="mt-3 text-3xl font-semibold text-emerald-300">{metrics.studyEfficiency || 72}%</p>
                <p className={`mt-3 text-sm ${mutedText}`}>Higher values mean smarter study time with less burnout.</p>
              </div>

              <div className={`mt-6 rounded-3xl border ${borderColor} ${cardBg} p-5`}>
                <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Workload pressure</p>
                <div className={`mt-3 h-3 w-full rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${metrics.loadScore || 62}%` }} />
                </div>
                <p className={`mt-3 text-sm ${mutedText}`}>{metrics.loadScore}% workload intensity</p>
              </div>

              <div className={`mt-6 rounded-3xl border ${borderColor} ${cardBg} p-5`}>
                <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Fatigue impact</p>
                <div className="mt-4 space-y-3">
                  {fatigueImpact.map((item) => (
                    <div key={item.name} className="text-sm">
                      <div className="flex items-center justify-between text-slate-200">
                        <span>{item.name}</span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <h2 className="text-2xl font-semibold">Burden Breakdown</h2>
              <p className={`mt-2 ${mutedText} text-sm`}>Relative contribution of workload and pressure within your current burden profile.</p>
              <div
                onClick={() => setZoomedBurden((prev) => !prev)}
                className={`mt-8 rounded-3xl border ${borderColor} overflow-hidden transition-all duration-300 ${
                  zoomedBurden
                    ? "scale-[1.02] border-cyan-400/50 shadow-[0_15px_60px_-30px_rgba(34,211,238,0.8)]"
                    : ""
                }`}
                style={{ cursor: "pointer" }}
              >
                <div className={`${darkMode ? "bg-slate-950/80 text-white" : "bg-slate-100 text-slate-950"} p-5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm uppercase tracking-[0.18em] text-cyan-300">Click to zoom</span>
                    <span className={`text-sm ${mutedText}`}>{zoomedBurden ? "Zoomed" : "Normal"}</span>
                  </div>
                </div>
                <div style={{ height: zoomedBurden ? 420 : 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={burdenChartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                      <YAxis tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Bar dataKey="value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`mt-6 rounded-3xl border ${borderColor} ${cardBg} p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Actual vs Predicted</p>
                    <p className={`mt-2 text-sm ${mutedText}`}>Compare expected effort against actual progress.</p>
                  </div>
                </div>
                <div className="mt-4 h-24">
                  <ResponsiveContainer width="100%" height="150%">
                    <BarChart data={actualVsPredictedData} margin={{ top: 5, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                      <YAxis tick={{ fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Bar dataKey="hours" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <h2 className="text-2xl font-semibold">Effort Efficiency Score</h2>
              <p className={`mt-2 ${mutedText} text-sm`}>Skills Completed vs Effort Invested</p>
              <div className="mt-8 space-y-4">
                <div className={`rounded-3xl p-5 ${cardBg}`}>
                  <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Efficiency Rating</p>
                  <p className="mt-3 text-5xl font-semibold text-cyan-400">{effortEfficiency}%</p>
                  <p className={`mt-3 ${mutedText}`}>{actualProgress.skillsCompleted} skills / {actualProgress.totalEffort}h effort</p>
                </div>
                <div className={`rounded-3xl p-5 ${cardBg}`}>
                  <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Performance Level</p>
                  <p className="mt-3 text-2xl font-semibold text-emerald-400">
                    {effortEfficiency >= 90 ? "Elite" : effortEfficiency >= 80 ? "Advanced" : effortEfficiency >= 70 ? "Good" : "Developing"}
                  </p>
                  <p className={`mt-3 text-sm ${mutedText}`}>
                    {effortEfficiency >= 90 ? "Maximizing every study hour" : effortEfficiency >= 80 ? "Strong efficiency with room for optimization" : "Good progress, focus on quality over quantity"}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <h2 className="text-2xl font-semibold">Streak Tracking</h2>
              <p className={`mt-2 ${mutedText} text-sm`}>Consecutive days of daily logins</p>
              <div className="mt-8 space-y-4">
                <div className={`rounded-3xl p-5 ${cardBg}`}>
                  <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Current Streak</p>
                  <p className="mt-3 text-5xl font-semibold text-emerald-400">{streakDays} days</p>
                  <p className={`mt-3 ${mutedText}`}>Keep your daily login streak alive!</p>
                </div>
                <div className={`rounded-3xl p-5 ${cardBg}`}>
                  <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Weekly Goal</p>
                  <p className="mt-3 text-3xl font-semibold text-blue-400">{streakDays}/7 days</p>
                  <p className={`mt-3 text-sm ${mutedText}`}>
                    {Math.max(0, 7 - streakDays)} more {Math.max(0, 7 - streakDays) === 1 ? "day" : "days"} to complete the week
                  </p>
                </div>
                <div className={`rounded-3xl p-5 ${cardBg}`}>
                  <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Streak Rewards</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>7 days</span>
                      <span className="text-emerald-400">✓ Unlocked</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>14 days</span>
                      <span className="text-amber-400">Next milestone</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>30 days</span>
                      <span className={`${mutedText}`}>Legendary</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
              <h2 className="text-2xl font-semibold">Progress Celebrations</h2>
              <p className={`mt-2 ${mutedText} text-sm`}>Milestone achievements and motivation</p>
              <div className="mt-8 space-y-4">
                <div className={`rounded-3xl p-5 ${cardBg} border-2 ${streakDays >= 7 ? 'border-emerald-400 bg-emerald-500/5' : 'border-slate-600'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{streakDays >= 7 ? "🎉" : "🔥"}</span>
                    <div>
                      <p className="font-semibold text-emerald-400">Streak Master</p>
                      <p className={`text-sm ${mutedText}`}>7+ day learning streak</p>
                    </div>
                  </div>
                  {streakDays >= 7 && <div className="mt-3 text-sm text-emerald-300">Achievement unlocked!</div>}
                </div>

                <div className={`rounded-3xl p-5 ${cardBg} border-2 ${effortEfficiency >= 80 ? 'border-cyan-400 bg-cyan-500/5' : 'border-slate-600'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{effortEfficiency >= 80 ? "⚡" : "📈"}</span>
                    <div>
                      <p className="font-semibold text-cyan-400">Efficiency Expert</p>
                      <p className={`text-sm ${mutedText}`}>80%+ effort efficiency</p>
                    </div>
                  </div>
                  {effortEfficiency >= 80 && <div className="mt-3 text-sm text-cyan-300">Achievement unlocked!</div>}
                </div>

                <div className={`rounded-3xl p-5 ${cardBg} border-2 ${actualProgress.skillsCompleted >= 15 ? 'border-purple-400 bg-purple-500/5' : 'border-slate-600'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{actualProgress.skillsCompleted >= 15 ? "🏆" : "🎯"}</span>
                    <div>
                      <p className="font-semibold text-purple-400">Skill Builder</p>
                      <p className={`text-sm ${mutedText}`}>15+ skills completed</p>
                    </div>
                  </div>
                  {actualProgress.skillsCompleted >= 15 && <div className="mt-3 text-sm text-purple-300">Achievement unlocked!</div>}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 xl:grid-cols-[1.4fr_0.9fr]">
            <div className={`rounded-2xl p-3 border ${sectionBg} ${borderColor}`}>
              <h2 className="text-xl font-semibold">Enhanced Actual vs Predicted</h2>
              <p className={`mt-2 ${mutedText} text-xs`}>Real progress against ML predictions with detailed breakdown</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className={`rounded-2xl p-3 ${cardBg}`}>
                  <p className={`text-[0.65rem] uppercase tracking-[0.18em] ${mutedText}`}>Predicted Effort</p>
                  <p className="mt-2 text-xl font-semibold text-blue-400">{actualVsPredictedData[0].hours}h</p>
                  <p className={`mt-1 text-[0.75rem] ${mutedText}`}>ML model prediction</p>
                </div>
                <div className={`rounded-2xl p-3 ${cardBg}`}>
                  <p className={`text-[0.65rem] uppercase tracking-[0.18em] ${mutedText}`}>Actual Effort</p>
                  <p className="mt-2 text-xl font-semibold text-emerald-400">{actualVsPredictedData[1].hours}h</p>
                  <p className={`mt-1 text-[0.75rem] ${mutedText}`}>Your real progress</p>
                </div>
              </div>
              <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={actualVsPredictedData} margin={{ top: 8, right: 15, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} />
                    <Bar dataKey="hours" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className={`rounded-2xl p-3 ${cardBg}`}>
                  <p className={`text-[0.65rem] uppercase tracking-[0.18em] ${mutedText}`}>Accuracy</p>
                  <p className="mt-1 text-lg font-semibold text-cyan-400">
                    {Math.round((Math.min(actualVsPredictedData[0].hours, actualVsPredictedData[1].hours) / Math.max(actualVsPredictedData[0].hours, actualVsPredictedData[1].hours)) * 100)}%
                  </p>
                </div>
                <div className={`rounded-2xl p-3 ${cardBg}`}>
                  <p className={`text-[0.65rem] uppercase tracking-[0.18em] ${mutedText}`}>Trend</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-400">
                    {actualVsPredictedData[1].hours > actualVsPredictedData[0].hours ? "Overperforming" : "On Track"}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl p-3 border ${sectionBg} ${borderColor} h-full`}>
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Performance Summary</h2>
                  <p className={`mt-2 ${mutedText} text-xs`}>Actionable insights for the week ahead.</p>
                </div>
                <div className="grid gap-2">
                  <div className={`rounded-2xl p-3 ${cardBg}`}>
                    <p className={`text-[0.65rem] uppercase tracking-[0.18em] ${mutedText}`}>Study pulse</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-300">{metrics.focusScore}%</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${cardBg}`}>
                    <p className={`text-[0.65rem] uppercase tracking-[0.18em] ${mutedText}`}>Pressure level</p>
                    <p className="mt-1 text-xl font-semibold text-amber-300">{pressureValue}%</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${cardBg}`}>
                    <p className={`text-[0.65rem] uppercase tracking-[0.18em] ${mutedText}`}>Burnout risk</p>
                    <p className="mt-1 text-xl font-semibold text-red-300">{metrics.burnoutRisk}%</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${cardBg}`}>
                    <p className={`text-[0.65rem] uppercase tracking-[0.18em] ${mutedText}`}>Next step</p>
                    <p className="mt-1 text-[0.75rem] ${mutedText}">Reduce pressure, keep focus steady, and recover with short breaks.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </SidebarLayout>
  );
}
