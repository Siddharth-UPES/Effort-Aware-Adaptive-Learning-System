import React from "react";
import { FaTrophy, FaChartBar, FaBolt, FaHeartbeat } from "react-icons/fa";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function PredictionResults({ prediction, formData }) {
  if (!prediction) {
    return null;
  }

  // Prepare burnout components data for pie chart and normalize to 100%
  const burnoutDataRaw = [
    {
      name: "Stress",
      value: prediction.burnout_components?.stress || 0,
    },
    {
      name: "Anxiety",
      value: prediction.burnout_components?.anxiety || 0,
    },
    {
      name: "Depression",
      value: prediction.burnout_components?.depression || 0,
    },
    {
      name: "Pressure",
      value: prediction.burnout_components?.pressure || 0,
    },
    {
      name: "Workload",
      value: prediction.burnout_components?.workload || 0,
    },
  ];

  const burnoutRawTotal = burnoutDataRaw.reduce((total, item) => total + item.value, 0);
  const burnoutData = burnoutDataRaw.map((item) => ({
    name: item.name,
    value: burnoutRawTotal > 0 ? Math.round((item.value / burnoutRawTotal) * 100) : 0,
  }));

  // Prepare effort prediction data
  const effortData = [
    {
      name: "Predicted",
      effort: prediction.predicted_effort,
      fill: "#06b6d4",
    },
  ];

  // Prepare health metrics data
  const metricsData = [
    { name: "Focus", value: prediction.focus_score },
    { name: "Load", value: prediction.load_score },
    { name: "Confidence", value: prediction.confidence },
    { name: "Efficiency", value: prediction.study_efficiency },
    { name: "Balance", value: prediction.lifestyle_balance },
  ];

  const COLORS = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#84cc16",
    "#22c55e",
  ];

  const getBurnoutColor = (risk) => {
    if (risk < 30) return "text-green-400";
    if (risk < 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getBurnoutBgColor = (risk) => {
    if (risk < 30) return "bg-green-500/10 border-green-500/30";
    if (risk < 60) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  return (
    <div className="space-y-4">
      {/* Main Prediction Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Burnout Risk Card */}
        <div
          className={`rounded-3xl border p-4 ${getBurnoutBgColor(
            prediction.burnout_risk
          )}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-widest">
                Burnout Risk
              </p>
              <p className={`text-5xl font-bold ${getBurnoutColor(prediction.burnout_risk)}`}>
                {prediction.burnout_risk}%
              </p>
            </div>
            <FaHeartbeat className={`text-4xl ${getBurnoutColor(prediction.burnout_risk)}`} />
          </div>
          <p className="text-slate-300">
            Level: <span className="font-semibold">{prediction.burnout_level}</span>
          </p>
        </div>

        {/* Effort Prediction Card */}
        <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-widest">
                Effort Hours
              </p>
              <p className="text-5xl font-bold text-blue-400">
                {prediction.predicted_effort}h
              </p>
            </div>
            <FaBolt className="text-4xl text-blue-400" />
          </div>
          <p className="text-slate-300">
            Time to Complete: <span className="font-semibold">{prediction.completion_time}</span>
          </p>
        </div>
      </div>

      {/* Metrics Bar Chart */}
      <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FaChartBar className="text-cyan-400" />
          Performance Metrics
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={metricsData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Burnout Components Pie Chart */}
      <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FaHeartbeat className="text-red-400" />
          Burnout Components Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={burnoutData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {burnoutData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#e2e8f0" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendations */}
      <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FaTrophy className="text-amber-400" />
          Personalized Recommendations
        </h3>
        <div className="space-y-3">
          {prediction.burnout_risk < 30 && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-3 text-green-200 text-sm">
              ✓ Your burnout risk is low. Keep maintaining your current healthy habits!
            </div>
          )}
          {prediction.burnout_risk >= 30 && prediction.burnout_risk < 60 && (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3 text-yellow-200 text-sm">
              ⚠ Your burnout risk is moderate. Consider reducing workload or increasing rest.
            </div>
          )}
          {prediction.burnout_risk >= 60 && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-200 text-sm">
              ⚠ High burnout risk detected. Please prioritize self-care and stress management.
            </div>
          )}
          {prediction.predicted_effort > 100 && (
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-3 text-orange-200 text-sm">
              💡 Your predicted effort is high. Break tasks into smaller milestones.
            </div>
          )}
          {prediction.focus_score < 50 && (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-3 text-blue-200 text-sm">
              🎯 Low focus score detected. Improve sleep quality and reduce stress.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
