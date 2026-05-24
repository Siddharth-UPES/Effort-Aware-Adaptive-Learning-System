import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { loadUser, saveUser } from "../services/auth";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "../context/ThemeContext";
import { FaUser, FaEnvelope, FaLock, FaHeartbeat, FaGraduationCap } from "react-icons/fa";

function parseWeeklyWorkload(weeklyWorkload) {
  if (typeof weeklyWorkload === "number") return weeklyWorkload;
  if (typeof weeklyWorkload === "string") {
    const match = weeklyWorkload.match(/(\d+(?:\.\d+)?)/);
    if (match) return Number(match[1]);
  }
  return null;
}

function formatWeeklyHours(weeklyHours) {
  if (typeof weeklyHours === "number") {
    return `${weeklyHours} hrs`;
  }
  if (typeof weeklyHours === "string") {
    return weeklyHours;
  }
  return "0 hrs";
}

export default function Profile() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [savedUser, setSavedUser] = useState(() => loadUser());

  const pageText = darkMode ? "text-white" : "text-slate-950";
  const pageBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  const sectionBg = darkMode ? "bg-slate-900" : "bg-white";
  const cardBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";
  const [form, setForm] = useState(() => ({
    name: "",
    email: "",
    age: savedUser?.age ?? 18,
    studentType: savedUser?.studentType ?? "College",
    Motivation: savedUser?.Motivation ?? 50,
    motivation_status: savedUser?.motivation_status ?? "Not depressed",
    // Basic info
    Attendance: savedUser?.Attendance ?? 80,
    Study_Hours_Per_Day: savedUser?.Study_Hours_Per_Day ?? 6,
    Sleep_Hours_Per_Day: savedUser?.Sleep_Hours_Per_Day ?? 7,
    sleep_quality: savedUser?.sleep_quality ?? savedUser?.Sleep_Quality ?? 3,
    Physical_Activity_Hours_Per_Day: savedUser?.Physical_Activity_Hours_Per_Day ?? 3,
    OnlineCourses: savedUser?.OnlineCourses ?? 0,
    socialMediaHours: savedUser?.socialMediaHours ?? savedUser?.Social_Hours_Per_Day ?? 2,
    GPA: savedUser?.GPA ?? savedUser?.finalGrade ?? 3.0,
    depression: savedUser?.depression ?? 5,
    lifestyleBalance: savedUser?.lifestyleBalance ?? savedUser?.lifestyle_balance ?? 60,
    // Mental health
    stress_level: savedUser?.stress_level ?? savedUser?.stress ?? 2,
    anxiety_level: savedUser?.anxiety_level ?? 10,
    depression_status: savedUser?.depression_status ?? "None",
    self_esteem: savedUser?.self_esteem ?? 15,
    pressure: savedUser?.pressure ?? 50,
    // Academic
    engagement_score: savedUser?.engagement_score ?? 150,
    workload_index: savedUser?.workload_index ?? 9,
    totalLearnHours: savedUser?.totalLearnHours ?? 120,
    weeklyWorkload: savedUser?.weeklyWorkload ?? "32 hrs/week",
    focusScore: savedUser?.focusScore ?? 70,
    loadScore: savedUser?.loadScore ?? 60,
    ...savedUser,
    password: "",
  }));

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({
    focusScore: savedUser?.focusScore || 68,
    loadScore: savedUser?.loadScore || 62,
    burnoutRisk: savedUser?.abandonRisk || 48,
    confidence: savedUser?.confidence || 72,
    weeklyHours: savedUser?.Study_Hours_Per_Day
      ? Math.max(0, savedUser?.Study_Hours_Per_Day) * 7
      : parseWeeklyWorkload(savedUser?.weeklyWorkload) ?? 42,
  });

  const derivedEngagement = Math.round(
    Math.min(
      200,
      (form.Attendance || 0) + (form.Physical_Activity_Hours_Per_Day || 0) * 8 + (form.Study_Hours_Per_Day || 0) * 4 + (form.OnlineCourses ? 20 : 0) + (form.sleep_quality || 0) * 6
    )
  );

  const derivedStudyEfficiency = Math.round(
    Math.min(
      100,
      Math.max(10, ((form.Study_Hours_Per_Day || 1) / Math.max(1, form.stress_level || 1)) * 14 + 20)
    )
  );

  const derivedLifestyle = Math.round(
    Math.min(
      100,
      ((Math.min(form.Sleep_Hours_Per_Day || 0, 8) / 8) * 0.4 + (Math.min(form.Physical_Activity_Hours_Per_Day || 0, 3) / 3) * 0.4 + ((form.sleep_quality || 0) / 5) * 0.2) * 100
    )
  );

  useEffect(() => {
    if (!savedUser) {
      navigate("/");
      return;
    }

    const payload = {
      ...savedUser,
      stress_level: savedUser?.stress_level ?? savedUser?.stress,
      Study_Hours_Per_Day: savedUser?.Study_Hours_Per_Day ?? savedUser?.studyHoursPerDay,
      Sleep_Hours_Per_Day: savedUser?.Sleep_Hours_Per_Day ?? savedUser?.sleepHoursPerDay,
      Physical_Activity_Hours_Per_Day: savedUser?.Physical_Activity_Hours_Per_Day ?? savedUser?.physicalActivityHoursPerDay,
      OnlineCourses: savedUser?.OnlineCourses ?? 0,
      Attendance: savedUser?.Attendance ?? 75,
      sleep_quality: savedUser?.sleep_quality ?? savedUser?.Sleep_Quality ?? 3,
      depression: savedUser?.depression ?? 5,
      depression_status: savedUser?.depression_status ?? "None",
      motivation_status: savedUser?.motivation_status ?? "Not depressed",
      engagement_score: savedUser?.engagement_score ?? derivedEngagement,
      study_efficiency: savedUser?.study_efficiency ?? derivedStudyEfficiency,
      lifestyle_balance: savedUser?.lifestyle_balance ?? derivedLifestyle,
      GPA: savedUser?.GPA ?? savedUser?.finalGrade ?? 3.0,
    };

    const dailyStudyHours = payload.Study_Hours_Per_Day ?? 6;
    const predictPayload = {
      ...payload,
      actual_study_hours: dailyStudyHours * 7,
    };

    api.post("/api/predict", predictPayload)
      .then((response) => {
        setMetrics((prev) => ({
          focusScore: response.data.focus_score ?? prev.focusScore,
          loadScore: response.data.load_score ?? prev.loadScore,
          burnoutRisk: response.data.burnout_risk ?? prev.burnoutRisk,
          confidence: response.data.confidence ?? prev.confidence,
          weeklyHours: payload.Study_Hours_Per_Day ? Math.max(1, payload.Study_Hours_Per_Day) * 7 : prev.weeklyHours,
        }));
      })
      .catch(() => {
        // keep existing fallback metrics
      });
  }, [navigate, savedUser, derivedEngagement, derivedLifestyle, derivedStudyEfficiency]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        stress: form.stress_level,
        stress_level: form.stress_level,
        depression_status: form.depression_status,
        motivation_status: form.motivation_status,
        OnlineCourses: form.OnlineCourses,
        engagement_score: derivedEngagement,
        study_efficiency: derivedStudyEfficiency,
        lifestyle_balance: derivedLifestyle,
        GPA: form.GPA,
      };

      if (!payload.password) {
        delete payload.password;
      }

      const response = await api.post("/api/profile", payload);
      const safeUser = { ...response.data, ...payload };
      delete safeUser.password;
      delete safeUser.passwordHash;
      saveUser(safeUser);
      setSavedUser(safeUser);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout user={savedUser} darkMode={darkMode} predictions={null}>
      <div className={`w-full p-4 ${pageBg} ${pageText}`}>
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-4xl font-bold ${pageText}`}>My Profile Dashboard</h1>
          <button
            onClick={() => setEditMode(!editMode)}
            className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
          >
            {editMode ? "View Mode" : "Edit Profile"}
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 mb-8">
          <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor} ${pageText}`}>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FaUser className="text-cyan-400" />
              Personal Info
            </h2>
            {editMode ? (
              <div className="space-y-4">
                <div className="relative">
                  <FaUser className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={`w-full pl-10 p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                    required
                  />
                </div>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={`w-full pl-10 p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={`block mb-2 ${pageText}`}>Age</label>
                    <input
                      type="number"
                      min="13"
                      value={form.age}
                      onChange={(e) => handleChange("age", parseInt(e.target.value))}
                      className={`w-full p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                    />
                  </div>
                  <div>
                    <label className={`block mb-2 ${pageText}`}>Student Type</label>
                    <select
                      value={form.studentType}
                      onChange={(e) => handleChange("studentType", e.target.value)}
                      className={`w-full p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                    >
                      <option>School</option>
                      <option>College</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`block mb-2 ${pageText}`}>{form.studentType === "School" ? "Final Grade" : "GPA"}</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={form.GPA}
                    onChange={(e) => handleChange("GPA", parseFloat(e.target.value))}
                    className={`w-full p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                  />
                </div>
                <div className="relative">
                  <FaLock className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    placeholder="New Password (leave empty to keep current)"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className={`w-full pl-10 p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaUser className="text-cyan-400" />
                  <div>
                    <p className="text-sm text-slate-400">Name</p>
                    <p className="text-lg font-semibold">{form.name || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-cyan-400" />
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="text-lg font-semibold">{form.email || "Not set"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor} ${pageText}`}>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FaGraduationCap className="text-cyan-400" />
              Academic Overview
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={`rounded-2xl p-4 ${cardBg} ${borderColor}`}>
                <p className={`text-sm ${mutedText}`}>Study Hours/Day</p>
                <p className="text-2xl font-semibold">{form.Study_Hours_Per_Day} hrs</p>
              </div>
              <div className={`rounded-2xl p-4 ${cardBg} ${borderColor}`}>
                <p className={`text-sm ${mutedText}`}>Weekly Target</p>
                <p className="text-2xl font-semibold">{formatWeeklyHours(metrics.weeklyHours)}</p>
              </div>
              <div className={`rounded-2xl p-4 ${cardBg} ${borderColor}`}>
                <p className={`text-sm ${mutedText}`}>Engagement Score</p>
                <p className="text-2xl font-semibold">{derivedEngagement}</p>
              </div>
              <div className={`rounded-2xl p-4 ${cardBg} ${borderColor}`}>
                <p className={`text-sm ${mutedText}`}>Attendance</p>
                <p className="text-2xl font-semibold">{form.Attendance}%</p>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor} ${pageText}`}>
            <h2 className="text-2xl font-semibold mb-4">Wellness Snapshot</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className={`rounded-2xl p-4 ${cardBg} ${borderColor}`}>
                <p className={`text-sm ${mutedText}`}>Sleep Hours</p>
                <p className="text-2xl font-semibold">{form.Sleep_Hours_Per_Day}h</p>
              </div>
              <div className={`rounded-2xl p-4 ${cardBg} ${borderColor}`}>
                <p className={`text-sm ${mutedText}`}>Physical Activity</p>
                <p className="text-2xl font-semibold">{form.Physical_Activity_Hours_Per_Day}h</p>
              </div>
              <div className={`rounded-2xl p-4 ${cardBg} ${borderColor}`}>
                <p className={`text-sm ${mutedText}`}>Sleep Quality</p>
                <p className="text-2xl font-semibold">{form.sleep_quality}/5</p>
              </div>
              <div className={`rounded-2xl p-4 ${cardBg} ${borderColor}`}>
                <p className={`text-sm ${mutedText}`}>Study Efficiency</p>
                <p className="text-2xl font-semibold">{derivedStudyEfficiency}%</p>
              </div>
              <div className={`rounded-2xl p-4 ${cardBg} ${borderColor}`}>
                <p className={`text-sm ${mutedText}`}>Lifestyle Balance</p>
                <p className="text-2xl font-semibold">{derivedLifestyle}%</p>
              </div>
              <div className={`rounded-2xl p-4 ${cardBg} ${borderColor}`}>
                <p className={`text-sm ${mutedText}`}>Depression Status</p>
                {editMode ? (
                  <select
                    value={form.depression_status}
                    onChange={(e) => handleChange("depression_status", e.target.value)}
                    className={`mt-3 w-full rounded-2xl border ${borderColor} px-4 py-3 ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'} focus:border-cyan-500 outline-none`}
                  >
                    <option>None</option>
                    <option>Mild</option>
                    <option>Moderate</option>
                    <option>Severe</option>
                  </select>
                ) : (
                  <p className="text-2xl font-semibold">{form.depression_status}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="bg-green-500 text-white p-4 rounded-lg mb-6">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {editMode && (
          <>
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor} ${pageText} mb-6`}>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FaHeartbeat className="text-cyan-400" />
                Detailed Settings
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Academic Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block mb-2 ${pageText}`}>Attendance (%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={form.Attendance}
                        onChange={(e) => handleChange("Attendance", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-cyan-400">{form.Attendance}%</span>
                    </div>
                    <div>
                      <label className={`block mb-2 ${pageText}`}>Online Courses Taken</label>
                      <select
                        value={form.OnlineCourses ? "yes" : "no"}
                        onChange={(e) => handleChange("OnlineCourses", e.target.value === "yes" ? 1 : 0)}
                        className={`w-full p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block mb-2 ${pageText}`}>Motivation Category</label>
                      <select
                        value={form.motivation_status}
                        onChange={(e) => handleChange("motivation_status", e.target.value)}
                        className={`w-full p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                      >
                        <option>Not depressed</option>
                        <option>Depressed</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block mb-2 ${pageText}`}>Daily Physical Activity</label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={form.Physical_Activity_Hours_Per_Day}
                        onChange={(e) => handleChange("Physical_Activity_Hours_Per_Day", parseInt(e.target.value))}
                        className={`w-full p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-2 ${pageText}`}>Study Hours Per Day</label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={form.Study_Hours_Per_Day}
                        onChange={(e) => handleChange("Study_Hours_Per_Day", parseInt(e.target.value))}
                        className={`w-full p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-2 ${pageText}`}>Sleep Hours Per Night</label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={form.Sleep_Hours_Per_Day}
                        onChange={(e) => handleChange("Sleep_Hours_Per_Day", parseInt(e.target.value))}
                        className={`w-full p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-2 ${pageText}`}>Sleep Quality</label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={form.sleep_quality}
                        onChange={(e) => handleChange("sleep_quality", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-cyan-400">{form.sleep_quality}/5</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Mental Health</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block mb-2 ${pageText}`}>Stress Level</label>
                      <select
                        value={form.stress_level}
                        onChange={(e) => handleChange("stress_level", parseInt(e.target.value))}
                        className={`w-full p-3 rounded-lg border ${borderColor} focus:border-cyan-500 outline-none ${pageText} ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                      >
                        <option value={2}>Low</option>
                        <option value={5}>Moderate</option>
                        <option value={8}>High</option>
                      </select>
                      <span className="text-cyan-400">{form.stress_level}/10</span>
                    </div>
                    <div>
                      <label className={`block mb-2 ${pageText}`}>Depression Level</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={form.depression}
                        onChange={(e) => handleChange("depression", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-cyan-400">{form.depression}%</span>
                    </div>
                    <div>
                      <label className={`block mb-2 ${pageText}`}>Lifestyle Balance</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={form.lifestyleBalance}
                        onChange={(e) => handleChange("lifestyleBalance", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-cyan-400">{form.lifestyleBalance}%</span>
                    </div>
                    <div>
                      <label className={`block mb-2 ${pageText}`}>Pressure</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={form.pressure}
                        onChange={(e) => handleChange("pressure", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-cyan-400">{form.pressure}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-xl bg-green-500 px-8 py-3 font-semibold text-white hover:bg-green-400 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
