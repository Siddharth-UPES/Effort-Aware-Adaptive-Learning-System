import React from "react";
import { FaBook, FaFire, FaHeartbeat } from "react-icons/fa";

export function MetricsWidget({ study, efficiency, burnout, darkMode }) {
  const getEfficiencyColor = (val) => {
    if (val >= 70) return "bg-green-500";
    if (val >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getBurnoutColor = (val) => {
    if (val < 30) return "bg-green-500";
    if (val < 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-3">
      {/* Study Target */}
      <div className={`rounded-3xl p-3 border transition-all ${darkMode ? "border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/60" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Study Target</p>
          <FaBook className="text-blue-400 text-lg" />
        </div>
        <p className={`text-4xl font-bold ${darkMode ? "text-white" : "text-slate-950"}`}>
          {study}
          <span className="text-lg text-slate-400 ml-1">hrs</span>
        </p>
        <p className={`mt-2 text-xs ${darkMode ? "text-slate-500" : "text-slate-600"}`}>Weekly study goal</p>
      </div>

      {/* Study Efficiency */}
      <div className={`rounded-3xl p-3 border transition-all ${darkMode ? "border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/60" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Study Efficiency</p>
          <FaFire className={`text-lg ${getEfficiencyColor(efficiency).replace("bg-", "text-")}`} />
        </div>
        <p className={`text-4xl font-bold ${darkMode ? "text-white" : "text-slate-950"}`}>
          {efficiency}%
        </p>
        <div className="mt-3 w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getEfficiencyColor(efficiency)}`}
            style={{ width: `${efficiency}%` }}
          />
        </div>
        <p className={`mt-2 text-xs ${darkMode ? "text-slate-500" : "text-slate-600"}`}>Smart study progress</p>
      </div>

      {/* Burnout Risk */}
      <div className={`rounded-3xl p-3 border transition-all ${darkMode ? "border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/60" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Burnout Risk</p>
          <FaHeartbeat className={`text-lg ${getBurnoutColor(burnout).replace("bg-", "text-")}`} />
        </div>
        <p className={`text-4xl font-bold ${darkMode ? "text-white" : "text-slate-950"}`}>
          {burnout}%
        </p>
        <div className="mt-3 w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getBurnoutColor(burnout)}`}
            style={{ width: `${burnout}%` }}
          />
        </div>
        <p className={`mt-2 text-xs ${darkMode ? "text-slate-500" : "text-slate-600"}`}>
          {burnout < 30 ? "Low risk" : burnout < 60 ? "Moderate risk" : "High risk"}
        </p>
      </div>
    </div>
  );
}
