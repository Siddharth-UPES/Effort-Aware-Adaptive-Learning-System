import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadUser, getBurnoutRisk } from "../services/auth";
import { FaHeartbeat, FaShieldAlt } from "react-icons/fa";
import api from "../services/api";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "../context/ThemeContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

export default function Burnout() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [predictions, setPredictions] = useState(null);
  const [academicBurdenLevel, setAcademicBurdenLevel] = useState(3);

  const parsePercent = (value) => {
    if (typeof value === "string") {
      const parsed = parseFloat(value.replace("%", ""));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return typeof value === "number" ? value : 0;
  };

  const motivation = Math.round(
    parsePercent(predictions?.Motivation ?? predictions?.motivation ?? user?.Motivation ?? user?.motivation ?? 50)
  );
  const consistency = Math.round(
    parsePercent(predictions?.consistency ?? predictions?.consistency_score ?? user?.consistency ?? user?.consistency_score ?? 50)
  );
  const missedSessions = Number(
    predictions?.missed_sessions ?? user?.missed_sessions ?? user?.missedSessions ?? 2
  );
  const completionPct = parsePercent(
    predictions?.completion_percentage ?? predictions?.completionRate ?? user?.completion_percentage ?? user?.completionRate ?? user?.completion ?? 70
  );

  const dropoutRisk = Math.round(
    Math.min(
      100,
      (metrics.burnoutRisk || 0) * 0.4 +
        (100 - motivation) * 0.2 +
        (100 - consistency) * 0.2 +
        Math.min(missedSessions, 8) * 5 +
        (100 - completionPct) * 0.1
    )
  );
  const dropoutStatus =
    dropoutRisk >= 75 ? "Critical" : dropoutRisk >= 50 ? "Moderate" : dropoutRisk >= 30 ? "Watch" : "Low";
  const dropoutRecommendation =
    dropoutRisk >= 75
      ? "Cut weekly effort by 20-25% and prioritize rest days."
      : dropoutRisk >= 50
      ? "Reduce weekly workload by 15-20% and add recovery breaks."
      : dropoutRisk >= 30
      ? "Balance your schedule and keep recovery time."
      : "Low risk — sustain your current pace with regular breaks.";

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

  const pageText = darkMode ? "text-white" : "text-slate-950";
  const pageBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  const sectionBg = darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-950";
  const cardBg = darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-950";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  useEffect(() => {
    const currentUser = loadUser();
    if (currentUser) {
      setUser(currentUser);
      setAcademicBurdenLevel(currentUser.academicBurdenLevel || 3);

      const dailyStudyHours = currentUser?.Study_Hours_Per_Day ?? currentUser?.studyHoursPerDay ?? 6;
      const predictPayload = {
        ...currentUser,
        actual_study_hours: dailyStudyHours * 7,
      };
      api.post("/api/predict", predictPayload)
        .then((response) => {
          setPredictions(response.data);
          setMetrics({
            burnoutRisk: getBurnoutRisk(currentUser, response.data),
            burnoutLevel: response.data.burnout_level || "Medium",
            focusScore: response.data.focus_score || currentUser.focusScore || 68,
            confidence: response.data.confidence || currentUser.confidence || 70,
          });
        })
        .catch(() => {
          setMetrics({
            burnoutRisk: getBurnoutRisk(currentUser, null),
            burnoutLevel: "Medium",
            focusScore: currentUser.focusScore || 68,
            confidence: currentUser.confidence || 70,
          });
        });
    }
  }, []);

  const burnoutComponentsData = predictions?.burnout_components
    ? (() => {
        const raw = [
          { name: "Stress", value: predictions.burnout_components.stress || 0 },
          { name: "Anxiety", value: predictions.burnout_components.anxiety || 0 },
          { name: "Depression", value: predictions.burnout_components.depression || 0 },
          { name: "Pressure", value: predictions.burnout_components.pressure || 0 },
        ];
        const total = raw.reduce((sum, item) => sum + item.value, 0) || 1;
        return raw.map((item) => ({
          name: item.name,
          value: Math.round((item.value / total) * 100),
        }));
      })()
    : [];

  const wellnessBalance = Math.round(predictions?.lifestyle_balance ?? 60);
  const focusStability = Math.round(predictions?.focus_score ?? metrics.focusScore ?? 68);
  const recoveryReadiness = metrics.burnoutRisk >= 60 ? "Recommended" : metrics.burnoutRisk >= 30 ? "Monitor closely" : "Good";
  const nextWellnessAction =
    metrics.burnoutRisk >= 60
      ? "Prioritize rest and small recovery goals."
      : metrics.burnoutRisk >= 30
      ? "Maintain consistency and add regular breaks."
      : "Keep the momentum with balanced workload.";

  return (
    <SidebarLayout user={user} darkMode={darkMode} predictions={predictions}>
      <div className={`p-8 ${pageBg} ${pageText}`}>
        <div className="w-full">
          <header className="mb-8">
            <h1 className={`text-4xl font-bold ${pageText} mb-2 flex items-center gap-3`}>
              <FaHeartbeat className="text-red-500" /> Burnout Monitor
            </h1>
            <p className={mutedText}>Track and manage your burnout risk through wellness metrics.</p>
          </header>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_380px] mb-8">
            <main className="space-y-6">
              <section className={`rounded-3xl p-8 border ${sectionBg} ${borderColor}`}>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className={`text-sm uppercase tracking-[0.2em] ${mutedText}`}>Current Burnout Risk</p>
                    <p className="mt-4 text-6xl font-bold text-orange-400">{metrics.burnoutRisk}%</p>
                    <p className={`mt-2 ${mutedText}`}>{metrics.burnoutLevel || "Medium"} risk level</p>
                  </div>
                  <div className={`rounded-full px-6 py-3 font-semibold ${
                    metrics.burnoutRisk >= 60
                      ? "bg-red-500/20 text-red-300"
                      : metrics.burnoutRisk >= 30
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}>
                    {metrics.burnoutRisk >= 60 ? "High" : metrics.burnoutRisk >= 30 ? "Medium" : "Low"}
                  </div>
                </div>
                <div className="mt-6 w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      metrics.burnoutRisk >= 60
                        ? "bg-red-500"
                        : metrics.burnoutRisk >= 30
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${metrics.burnoutRisk}%` }}
                  />
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-1">
                <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
                  <h2 className="text-2xl font-semibold mb-4">Burnout Components</h2>
                  <p className={`mb-6 ${mutedText} text-sm`}>Breakdown of factors contributing to burnout.</p>

              <div className="space-y-4">
                {burnoutComponentsData.map((item) => (
                  <div key={item.name} className={`rounded-2xl p-4 ${cardBg} ${borderColor}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-sm ${mutedText}`}>{item.name}</p>
                      <span className="text-cyan-400 font-semibold">{item.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.value > 70
                            ? "bg-red-500"
                            : item.value > 40
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>



              

              <div className={`mt-8 rounded-2xl p-4 border ${borderColor} ${cardBg}`}>
                <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                <ul className={`space-y-2 text-sm ${mutedText}`}>
                  {academicBurdenLevel > 4 && <li>•  Reduce your workload or prioritize high-impact tasks.</li>}
                  {dropoutRisk >= 50 && <li>•  Adjust your learning plan: cut weekly hours by 15-20% and add recovery days.</li>}
                  {user?.depression_status && user.depression_status !== "None" && <li>•  Seek support from friends, family, or a counselor.</li>}
                  <li>•  Keep your Profile wellness values updated for better burnout predictions.</li>
                </ul>
              </div>
            </div>
          </section>
        </main>

        <aside className={`rounded-3xl border ${sectionBg} ${borderColor} ${cardBg} p-6 lg:sticky lg:top-4`}>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400 font-semibold">Prediction</p>
            <h2 className={`mt-4 text-3xl font-bold ${pageText}`}>Profile Prediction</h2>
            <p className={`mt-3 text-sm leading-6 ${mutedText}`}>A professional summary of your burnout profile and recovery readiness.</p>
          </div>

          <div className="grid gap-3">
            <div className={`rounded-3xl p-4 border ${borderColor} ${cardBg}`}>
              <p className={`text-sm ${mutedText}`}>Burnout Risk</p>
              <p className="mt-3 text-3xl font-semibold text-orange-400">{predictions?.burnout_risk ?? metrics.burnoutRisk}%</p>
            </div>
            <div className={`rounded-3xl p-4 border ${borderColor} ${cardBg}`}>
              <p className={`text-sm ${mutedText}`}>Effort Hours</p>
              <p className="mt-3 text-3xl font-semibold text-cyan-300">{predictions?.predicted_effort ?? "--"}h</p>
            </div>
            <div className={`rounded-3xl p-4 border ${borderColor} ${cardBg}`}>
              <p className={`text-sm ${mutedText}`}>Confidence</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-300">{predictions?.confidence ?? "--"}%</p>
            </div>
            <div className={`rounded-3xl p-4 border ${borderColor} ${cardBg}`}>
              <p className={`text-sm ${mutedText}`}>Focus Stability</p>
              <p className="mt-3 text-3xl font-semibold text-sky-300">{focusStability}%</p>
            </div>
            <div className={`rounded-3xl p-4 border ${borderColor} ${cardBg}`}>
              <p className={`text-sm ${mutedText}`}>Dropout Risk</p>
              <p className={`mt-3 text-3xl font-semibold ${
                dropoutRisk >= 60 ? "text-red-400" : dropoutRisk >= 35 ? "text-amber-400" : "text-emerald-300"
              }`}>{dropoutRisk}%</p>
              <p className="mt-1 text-sm text-slate-400">{dropoutStatus} risk based on motivation, consistency, burnout, and missed sessions.</p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <button
              onClick={() => navigate("/onboarding")}
              className="w-full rounded-3xl bg-slate-800 text-white py-3 font-semibold hover:bg-slate-700 transition"
            >
              Back to Assessment
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 py-3 font-semibold hover:from-cyan-400 hover:to-blue-400 transition"
            >
              Continue to Dashboard
            </button>
          </div>
        </aside>
      </div>

      <section className={`rounded-3xl p-4 border ${sectionBg} ${borderColor}`}>
        <h2 className="text-2xl font-semibold mb-4">Charts</h2>
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className={`rounded-2xl p-4 border ${cardBg} ${borderColor}`}>
            <h3 className="text-lg font-semibold mb-2">Burnout Factors Chart</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={burnoutComponentsData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                  <YAxis tick={{ fill: '#94a3b8' }} domain={[0, 100]} ticks={[0,25,50,75,100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="value" fill="#ef4444" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={`rounded-2xl p-4 border ${cardBg} ${borderColor}`}>
            <h3 className="text-lg font-semibold mb-2">Burnout Distribution</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={burnoutComponentsData} innerRadius={50} outerRadius={80} dataKey="value" cx="50%" cy="50%">
                    {burnoutComponentsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
      <section className={`rounded-3xl p-4 border ${sectionBg} ${borderColor} ${cardBg}`}>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400 font-semibold">Wellness Summary</p>
        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
          <div className={`rounded-3xl p-5 border ${borderColor} ${cardBg}`}>
            <p className={`text-base font-medium ${mutedText}`}>Wellness balance</p>
            <p className="mt-3 text-4xl font-bold text-cyan-300">{wellnessBalance}%</p>
          </div>
          <div className={`rounded-3xl p-5 border ${borderColor} ${cardBg}`}>
            <p className={`text-base font-medium ${mutedText}`}>Recovery readiness</p>
            <p className="mt-3 text-4xl font-bold text-amber-300">{recoveryReadiness}</p>
          </div>
          <div className={`rounded-3xl p-5 border ${borderColor} ${cardBg}`}>
            <p className={`text-base font-medium ${mutedText}`}>Dropout risk</p>
            <p className={`mt-3 text-4xl font-bold ${dropoutRisk >= 60 ? "text-red-400" : dropoutRisk >= 35 ? "text-amber-400" : "text-emerald-300"}`}>{dropoutRisk}%</p>
          </div>
          <div className={`rounded-3xl p-5 border ${borderColor} ${cardBg}`}>
            <p className={`text-base font-medium ${mutedText}`}>Immediate intervention</p>
            <p className="mt-3 text-lg font-semibold text-slate-100 leading-7">{dropoutRecommendation}</p>
          </div>
          <div className={`rounded-3xl p-5 border ${borderColor} ${cardBg}`}>
            <p className={`text-base font-medium ${mutedText}`}>Recommended action</p>
            <p className="mt-3 text-lg font-semibold text-slate-100 leading-7">{nextWellnessAction}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</SidebarLayout>
  );
}
