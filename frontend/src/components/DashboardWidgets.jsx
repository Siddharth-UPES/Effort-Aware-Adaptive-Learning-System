import React from "react";
import { Link } from "react-router-dom";
import { FaTrophy } from "react-icons/fa";

export function Card({ children, darkMode, className = "" }) {
  return (
    <div
      className={`w-full rounded-2xl p-3 border transition-all ${
        darkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-white shadow-sm"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function SidebarItem({ icon, text, active, darkMode, to }) {
  const itemClass = `w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-semibold group ${
    active
      ? darkMode
        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 scale-105"
        : "bg-cyan-500/10 text-cyan-700 border border-cyan-500 shadow-sm scale-105"
      : darkMode
      ? "bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 hover:text-white hover:shadow-lg hover:shadow-cyan-500/10"
      : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:shadow-sm"
  }`;

  return (
    <Link to={to} className={itemClass}>
      <span className={`text-xl transition-transform ${active ? "scale-110" : "group-hover:scale-110"}`}>{icon}</span>
      <span className="group-hover:translate-x-1 transition-transform">{text}</span>
    </Link>
  );
}

export function StatsCard({ title, value, subtitle, darkMode, icon }) {
  return (
    <div
      className={`rounded-3xl p-4 hover:shadow-lg transition-all ${
        darkMode ? "bg-slate-900" : "bg-white shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-500 text-sm">{title}</h2>
        <div className="text-cyan-400 text-xl">{icon}</div>
      </div>
      <p className="text-4xl font-bold">{value}</p>
      <p className="text-gray-400 mt-3">{subtitle}</p>
    </div>
  );
}

export function AnalyticsRow({ label, value }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-cyan-500 h-2 rounded-full"
          style={{ width: value }}
        ></div>
      </div>
    </div>
  );
}

export function NotificationPopup({ darkMode, title, message }) {
  return (
    <div
      className={`rounded-3xl border-l-4 p-4 ${
        darkMode
          ? "border-amber-400 bg-amber-500/10 text-white"
          : "border-yellow-500 bg-yellow-50 text-slate-900"
      }`}
    >
      <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Notification</p>
      <h3 className="mt-2 text-2xl font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-gray-200">{message}</p>
    </div>
  );
}

export function ResourceItem({ text, note, darkMode }) {
  return (
    <div
      className={`rounded-3xl p-4 border ${
        darkMode ? "border-slate-700 bg-slate-950/80" : "border-gray-200 bg-white"
      }`}
    >
      <h3 className="font-semibold">{text}</h3>
      <p className="mt-2 text-sm text-gray-400">{note}</p>
    </div>
  );
}

export function Badge({ text }) {
  return (
    <div className="flex items-center gap-4 bg-cyan-500/10 border border-cyan-500 rounded-2xl px-5 py-4">
      <FaTrophy className="text-yellow-400 text-2xl" />
      <div>
        <h3 className="font-semibold">{text}</h3>
        <p className="text-sm text-gray-400 mt-1">Achievement unlocked successfully</p>
      </div>
    </div>
  );
}
