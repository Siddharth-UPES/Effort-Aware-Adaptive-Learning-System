import { useState } from "react";
import { FaUser, FaClock, FaHeartbeat, FaBrain, FaDumbbell, FaBriefcase, FaSmile } from "react-icons/fa";
import api from "../services/api";
import { saveUser } from "../services/auth";

export default function InitialAssessment({ user, onComplete }) {
  const [formData, setFormData] = useState({
    Attendance: 75,
    Study_Hours_Per_Day: 5,
    stress_level: "moderate",
    workload_level: "medium",
    depression_status: "None",
    anxiety_level: 5,
    socialMediaHours: 2,
    Sleep_Hours_Per_Day: 7,
    Physical_Activity_Hours_Per_Day: 2,
    workload_index: 8,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const updatePayload = {
        ...formData,
        email: user.email,
        needsAssessment: false,
      };

      await api.put("/api/profile", updatePayload);

      const updatedUser = {
        ...user,
        ...formData,
        needsAssessment: false,
      };

      saveUser(updatedUser);
      onComplete(updatedUser);

    } catch (err) {
      setError(err.response?.data?.message || "Assessment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stressCategories = [
    { value: "none", label: "Not Stressed", emoji: "😊", color: "emerald" },
    { value: "low", label: "Low Stress", emoji: "🙂", color: "cyan" },
    { value: "moderate", label: "Moderate Stress", emoji: "😐", color: "amber" },
    { value: "high", label: "High Stress", emoji: "😟", color: "orange" },
    { value: "severe", label: "Severe Stress", emoji: "😰", color: "red" },
  ];

  const workloadCategories = [
    { value: "light", label: "Light Workload", emoji: "📚", color: "emerald" },
    { value: "medium", label: "Medium Workload", emoji: "📊", color: "cyan" },
    { value: "heavy", label: "Heavy Workload", emoji: "📈", color: "amber" },
    { value: "extreme", label: "Extreme Workload", emoji: "🚀", color: "red" },
  ];

  const depressionLevels = [
    { value: "None", label: "None", description: "No symptoms" },
    { value: "Mild", label: "Mild", description: "Occasional low mood" },
    { value: "Moderate", label: "Moderate", description: "Persistent concerns" },
    { value: "Severe", label: "Severe", description: "Significant impact" },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="relative w-full max-w-5xl mx-auto">
        <div className="relative min-h-screen overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-3xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-inner">
                    <FaBrain className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Professional Onboarding</p>
                    <h2 className="text-3xl font-bold text-white">Complete Your Profile Assessment</h2>
                  </div>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  Step {currentStep} of 3
                </span>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 text-slate-300">
                <p className="text-sm leading-6">
                  Help us understand your learning profile better. This comprehensive assessment will personalize your experience based on your current situation and wellbeing.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Step 1: Academic & Time Management */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-6">
                    {/* Attendance */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <FaUser className="text-cyan-400 text-lg" />
                        <div>
                          <label className="text-white font-semibold block">Attendance Rate (%)</label>
                          <p className="text-xs text-slate-400 mt-1">Your typical class/session attendance percentage</p>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.Attendance}
                        onChange={(e) => handleChange("Attendance", parseInt(e.target.value))}
                        className="w-full mb-2"
                      />
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>0%</span>
                        <span className="text-cyan-400 font-semibold text-base">{formData.Attendance}%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Study Hours */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <FaClock className="text-cyan-400 text-lg" />
                        <div>
                          <label className="text-white font-semibold block">Daily Study Hours</label>
                          <p className="text-xs text-slate-400 mt-1">Average hours you study per day</p>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={formData.Study_Hours_Per_Day}
                        onChange={(e) => handleChange("Study_Hours_Per_Day", parseInt(e.target.value))}
                        className="w-full mb-2"
                      />
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>1h</span>
                        <span className="text-cyan-400 font-semibold text-base">{formData.Study_Hours_Per_Day}h</span>
                        <span>12h</span>
                      </div>
                    </div>

                    {/* Sleep Hours */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <FaClock className="text-emerald-400 text-lg" />
                        <div>
                          <label className="text-white font-semibold block">Sleep Hours Per Night</label>
                          <p className="text-xs text-slate-400 mt-1">Average quality sleep you get each night</p>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="10"
                        value={formData.Sleep_Hours_Per_Day}
                        onChange={(e) => handleChange("Sleep_Hours_Per_Day", parseInt(e.target.value))}
                        className="w-full mb-2"
                      />
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>3h</span>
                        <span className="text-cyan-400 font-semibold text-base">{formData.Sleep_Hours_Per_Day}h</span>
                        <span>10h</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Mental Health & Wellbeing */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-6">
                    {/* Stress Level Categories */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-5">
                        <FaHeartbeat className="text-red-400 text-lg" />
                        <div>
                          <label className="text-white font-semibold block">How Stressed Are You?</label>
                          <p className="text-xs text-slate-400 mt-1">Select your current stress level</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {stressCategories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => handleChange("stress_level", cat.value)}
                            className={`p-4 rounded-xl border-2 transition text-left ${
                              formData.stress_level === cat.value
                                ? `border-${cat.color}-500 bg-${cat.color}-500/10`
                                : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                            }`}
                          >
                            <span className="text-2xl mb-2 block">{cat.emoji}</span>
                            <p className="font-semibold text-white">{cat.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Depression Status */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-5">
                        <FaSmile className="text-violet-400 text-lg" />
                        <div>
                          <label className="text-white font-semibold block">Depression Status</label>
                          <p className="text-xs text-slate-400 mt-1">How would you describe your mental state?</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {depressionLevels.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => handleChange("depression_status", level.value)}
                            className={`p-4 rounded-xl border-2 transition text-left ${
                              formData.depression_status === level.value
                                ? "border-violet-500 bg-violet-500/10"
                                : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                            }`}
                          >
                            <p className="font-semibold text-white">{level.label}</p>
                            <p className="text-xs text-slate-400 mt-1">{level.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Anxiety Level */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <FaBrain className="text-orange-400 text-lg" />
                        <div>
                          <label className="text-white font-semibold block">Anxiety Level</label>
                          <p className="text-xs text-slate-400 mt-1">Rate your typical anxiety levels</p>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={formData.anxiety_level}
                        onChange={(e) => handleChange("anxiety_level", parseInt(e.target.value))}
                        className="w-full mb-2"
                      />
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>None</span>
                        <span className="text-orange-400 font-semibold text-base">{formData.anxiety_level}/10</span>
                        <span>Severe</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Lifestyle & Workload */}
              {currentStep === 3 && (
                <>
                  <div className="space-y-6">
                    {/* Workload Level Categories */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-5">
                        <FaBriefcase className="text-amber-400 text-lg" />
                        <div>
                          <label className="text-white font-semibold block">Current Workload Level</label>
                          <p className="text-xs text-slate-400 mt-1">Select your typical workload situation</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {workloadCategories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => handleChange("workload_level", cat.value)}
                            className={`p-4 rounded-xl border-2 transition text-left ${
                              formData.workload_level === cat.value
                                ? `border-${cat.color}-500 bg-${cat.color}-500/10`
                                : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                            }`}
                          >
                            <span className="text-2xl mb-2 block">{cat.emoji}</span>
                            <p className="font-semibold text-white">{cat.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Physical Activity */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <FaDumbbell className="text-emerald-400 text-lg" />
                        <div>
                          <label className="text-white font-semibold block">Daily Physical Activity</label>
                          <p className="text-xs text-slate-400 mt-1">Hours of exercise/physical activity per day</p>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={formData.Physical_Activity_Hours_Per_Day}
                        onChange={(e) => handleChange("Physical_Activity_Hours_Per_Day", parseInt(e.target.value))}
                        className="w-full mb-2"
                      />
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>0h</span>
                        <span className="text-cyan-400 font-semibold text-base">{formData.Physical_Activity_Hours_Per_Day}h</span>
                        <span>5h</span>
                      </div>
                    </div>

                    {/* Social Media Usage */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <FaBrain className="text-cyan-400 text-lg" />
                        <div>
                          <label className="text-white font-semibold block">Social Media Usage</label>
                          <p className="text-xs text-slate-400 mt-1">Average hours spent on social media per day</p>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={formData.socialMediaHours}
                        onChange={(e) => handleChange("socialMediaHours", parseFloat(e.target.value))}
                        className="w-full mb-2"
                      />
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>0h</span>
                        <span className="text-cyan-400 font-semibold text-base">{formData.socialMediaHours}h</span>
                        <span>8h</span>
                      </div>
                    </div>

                    {/* Overall Workload Index */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <FaBriefcase className="text-orange-400 text-lg" />
                        <div>
                          <label className="text-white font-semibold block">Overall Workload Index</label>
                          <p className="text-xs text-slate-400 mt-1">Total academic and personal workload rating</p>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={formData.workload_index}
                        onChange={(e) => handleChange("workload_index", parseInt(e.target.value))}
                        className="w-full mb-2"
                      />
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>Light</span>
                        <span className="text-cyan-400 font-semibold text-base">{formData.workload_index}/20</span>
                        <span>Heavy</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8 pt-4 border-t border-slate-700">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-semibold text-lg transition"
                  >
                    ← Previous
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-cyan-500/20 transition-all duration-200"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Analyzing Your Profile..." : "Complete Assessment"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
