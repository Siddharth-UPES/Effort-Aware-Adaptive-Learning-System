import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaClock, FaHeartbeat, FaBrain, FaDumbbell, FaBriefcase } from "react-icons/fa";
import api from "../services/api";
import { saveUser, loadUser } from "../services/auth";
import PredictionResults from "../components/PredictionResults";

export default function InitialAssessmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    Attendance: 85,
    Study_Hours_Per_Day: 5,
    socialMediaHours: 2,
    Sleep_Hours_Per_Day: 7,
    Physical_Activity_Hours_Per_Day: 2,
    workload_index: 10,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [showPrediction, setShowPrediction] = useState(false);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    // Get user from location state or local storage
    const userFromState = location.state?.user;
    const userFromStorage = loadUser();
    const effectiveUser = userFromState || userFromStorage;

    if (!effectiveUser) {
      // No user found, redirect to login
      navigate("/");
      return;
    }

    if (effectiveUser.needsAssessment === false) {
      // Already completed onboarding, do not show it again
      navigate("/dashboard");
      return;
    }

    setUser(effectiveUser);
  }, [location.state, navigate]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Get predictions first
      const dailyStudyHours = formData.Study_Hours_Per_Day ?? 5;
      const predictionResponse = await api.post("/api/predict", {
        ...formData,
        email: user.email,
        actual_study_hours: dailyStudyHours * 7,
      });

      setPrediction(predictionResponse.data);
      setShowPrediction(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to get predictions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAssessment = async () => {
    setError("");
    setLoading(true);

    const currentEmail = user?.email || loadUser()?.email;
    if (!currentEmail) {
      setError("Unable to identify the logged-in user. Please log in again.");
      setLoading(false);
      return;
    }

    const updatePayload = {
      ...formData,
      email: currentEmail,
      socialMediaHours: formData.socialMediaHours,
      needsAssessment: false,
    };

    // Do not merge prediction output into saved user profile — keep only the assessment fields
    const updatedUser = {
      ...user,
      ...formData,
      email: currentEmail,
      needsAssessment: false,
    };

    try {
      await api.put("/api/profile", updatePayload);
    } catch (err) {
      console.warn("Profile update failed during onboarding:", err);
      setError(err.response?.data?.message || "Unable to save assessment data, but you can still continue.");
    } finally {
      saveUser(updatedUser);
      setLoading(false);
      navigate("/dashboard");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        {showPrediction ? (
          // Prediction Results View
          <div className="bg-slate-900/90 rounded-3xl border border-slate-700 p-8">
            <div className="mb-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-3xl bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-300 shadow-inner">
                    <FaBrain className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-green-400">Assessment Complete</p>
                    <h2 className="text-3xl font-bold text-white">Your Profile Analysis</h2>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 text-slate-300">
                <p className="text-sm leading-6">
                  Based on your inputs, here's your personalized analysis with recommendations for success.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 p-4 rounded-3xl mb-6">
                {error}
              </div>
            )}

            <PredictionResults prediction={prediction} formData={formData} />

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setShowPrediction(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-3xl font-semibold text-lg transition-all duration-200"
              >
                Back to Assessment
              </button>
              <button
                type="button"
                onClick={handleConfirmAssessment}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-4 rounded-3xl font-semibold text-lg shadow-2xl shadow-cyan-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Continue to Dashboard"}
              </button>
            </div>
          </div>
        ) : (
          // Assessment Form View
          <div className="bg-slate-900/90 rounded-3xl border border-slate-700 p-8">
            <div className="mb-8 text-center">
              <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-3xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-inner">
                    <FaBrain className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Welcome</p>
                    <h2 className="text-3xl font-bold text-white">EffortAware Assessment</h2>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 text-slate-300 max-w-2xl mx-auto">
                <p className="text-sm leading-6">
                  Complete this quick assessment to get personalized insights and recommendations for your academic success.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 p-4 rounded-3xl mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Top Row - Academic Metrics */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Attendance */}
                <div className="bg-slate-900/80 rounded-3xl border border-slate-700 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <FaUser className="text-cyan-400" />
                    <div>
                      <p className="text-white font-semibold">Attendance</p>
                      <p className="text-slate-500 text-sm">Class participation %</p>
                    </div>
                  </div>
                  <select
                    value={formData.Attendance}
                    onChange={(e) => handleChange("Attendance", parseInt(e.target.value))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white focus:border-cyan-400 outline-none"
                  >
                    <option value={50}>50% - Occasional</option>
                    <option value={70}>70% - Regular</option>
                    <option value={85}>85% - Frequent</option>
                    <option value={95}>95% - Consistent</option>
                    <option value={100}>100% - Perfect</option>
                  </select>
                </div>

                {/* Study Hours */}
                <div className="bg-slate-900/80 rounded-3xl border border-slate-700 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <FaClock className="text-cyan-400" />
                    <div>
                      <p className="text-white font-semibold">Study Hours</p>
                      <p className="text-slate-500 text-sm">Daily study time</p>
                    </div>
                  </div>
                  <select
                    value={formData.Study_Hours_Per_Day}
                    onChange={(e) => handleChange("Study_Hours_Per_Day", parseInt(e.target.value))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white focus:border-cyan-400 outline-none"
                  >
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                    <option value={3}>3 hours</option>
                    <option value={4}>4 hours</option>
                    <option value={5}>5 hours</option>
                    <option value={6}>6 hours</option>
                    <option value={7}>7 hours</option>
                    <option value={8}>8 hours</option>
                    <option value={9}>9 hours</option>
                    <option value={10}>10 hours</option>
                    <option value={12}>12+ hours</option>
                  </select>
                </div>

                {/* Workload Level */}
                <div className="bg-slate-900/80 rounded-3xl border border-slate-700 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <FaBriefcase className="text-cyan-400" />
                    <div>
                      <p className="text-white font-semibold">Workload Level</p>
                      <p className="text-slate-500 text-sm">Academic load</p>
                    </div>
                  </div>
                  <select
                    value={formData.workload_index}
                    onChange={(e) => handleChange("workload_index", parseInt(e.target.value))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white focus:border-cyan-400 outline-none"
                  >
                    <option value={5}>Light - Manageable</option>
                    <option value={10}>Moderate - Balanced</option>
                    <option value={15}>Heavy - Demanding</option>
                    <option value={20}>Extreme - Intense</option>
                  </select>
                </div>
              </div>

              {/* Middle Row - Lifestyle Metrics */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Social Media Usage */}
                <div className="bg-slate-900/80 rounded-3xl border border-slate-700 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <FaBrain className="text-cyan-400" />
                    <div>
                      <p className="text-white font-semibold">Social Media</p>
                      <p className="text-slate-500 text-sm">Daily usage hours</p>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={formData.socialMediaHours}
                    onChange={(e) => handleChange("socialMediaHours", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white focus:border-cyan-400 outline-none"
                    placeholder="Enter hours (e.g., 2.5)"
                  />
                </div>

                {/* Sleep Hours */}
                <div className="bg-slate-900/80 rounded-3xl border border-slate-700 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <FaHeartbeat className="text-cyan-400" />
                    <div>
                      <p className="text-white font-semibold">Sleep Hours</p>
                      <p className="text-slate-500 text-sm">Nightly rest</p>
                    </div>
                  </div>
                  <select
                    value={formData.Sleep_Hours_Per_Day}
                    onChange={(e) => handleChange("Sleep_Hours_Per_Day", parseInt(e.target.value))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white focus:border-cyan-400 outline-none"
                  >
                    <option value={4}>4 hours - Insufficient</option>
                    <option value={5}>5 hours - Minimal</option>
                    <option value={6}>6 hours - Adequate</option>
                    <option value={7}>7 hours - Optimal</option>
                    <option value={8}>8 hours - Excellent</option>
                    <option value={9}>9 hours - Maximum</option>
                  </select>
                </div>

                {/* Physical Activity */}
                <div className="bg-slate-900/80 rounded-3xl border border-slate-700 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <FaDumbbell className="text-cyan-400" />
                    <div>
                      <p className="text-white font-semibold">Physical Activity</p>
                      <p className="text-slate-500 text-sm">Daily exercise hours</p>
                    </div>
                  </div>
                  <select
                    value={formData.Physical_Activity_Hours_Per_Day}
                    onChange={(e) => handleChange("Physical_Activity_Hours_Per_Day", parseInt(e.target.value))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white focus:border-cyan-400 outline-none"
                  >
                    <option value={0}>0 hours - None</option>
                    <option value={1}>1 hour - Light</option>
                    <option value={2}>2 hours - Moderate</option>
                    <option value={3}>3 hours - Active</option>
                    <option value={4}>4 hours - Very Active</option>
                    <option value={5}>5+ hours - Athletic</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-4 rounded-3xl font-semibold text-lg shadow-2xl shadow-cyan-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Analyzing Your Profile..." : "Complete Assessment"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
