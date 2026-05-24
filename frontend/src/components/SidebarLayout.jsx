import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { SidebarItem } from "./DashboardWidgets";
import {
  FaTachometerAlt,
  FaChartLine,
  FaCalendarAlt,
  FaUser,
  FaBook,
  FaClock,
  FaArrowLeft,
  FaHeartbeat,
  FaTrophy,
} from "react-icons/fa";
import api from "../services/api";

// Icon mapping for dynamic navigation items
const ICON_MAP = {
  FaTachometerAlt: FaTachometerAlt,
  FaBook: FaBook,
  FaChartLine: FaChartLine,
  FaTrophy: FaTrophy,
  FaHeartbeat: FaHeartbeat,
  FaCalendarAlt: FaCalendarAlt,
  FaUser: FaUser,
  FaClock: FaClock,
};

export default function SidebarLayout({ user, children, darkMode, onBack, predictions }) {
  const { darkMode: themeDarkMode } = useTheme();
  const activeDarkMode = typeof darkMode === "boolean" ? darkMode : themeDarkMode;
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarItems, setSidebarItems] = React.useState([]);

  // Fetch navigation items from backend
  React.useEffect(() => {
    const fetchNavigationItems = async () => {
      try {
        const response = await api.get('/api/navigation-items');
        const items = response.data.items || [];
        setSidebarItems(items);
      } catch (error) {
        console.error("Failed to fetch navigation items:", error);
        // Fallback to default items
        setSidebarItems([
          { icon: <FaTachometerAlt />, text: "Dashboard", to: "/dashboard" },
          { icon: <FaBook />, text: "Learning Path", to: "/learning-path" },
          { icon: <FaChartLine />, text: "Analytics", to: "/analytics" },
          { icon: <FaTrophy />, text: "Achievements", to: "/achievements" },
          { icon: <FaHeartbeat />, text: "Burnout", to: "/burnout" },
          { icon: <FaCalendarAlt />, text: "Calendar", to: "/calendar" },
          { icon: <FaUser />, text: "Profile", to: "/profile" },
          { icon: <FaClock />, text: "Timetable", to: "/timetable" },
        ]);
      }
    };
    fetchNavigationItems();
  }, []);

  // Convert icon string to React icon component
  const getIcon = (iconName) => {
    if (typeof iconName === "string") {
      const IconComponent = ICON_MAP[iconName];
      return IconComponent ? <IconComponent /> : null;
    }
    return iconName;
  };

  // Set document title from tabTitle query param when opening in new tabs
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const tabTitle = params.get("tabTitle");
      if (tabTitle) {
        document.title = `${tabTitle} — EffortAware`;
        return;
      }
    } catch (e) {
      // ignore
    }

    // fallback: map common routes to titles
    const pathTitleMap = {
      "/dashboard": "Dashboard",
      "/learning-path": "Learning Path",
      "/analytics": "Analytics",
      "/achievements": "Achievements",
      "/burnout": "Burnout",
      "/calendar": "Calendar",
      "/profile": "Profile",
      "/timetable": "Timetable",
    };
    const title = pathTitleMap[location.pathname] || "EffortAware";
    document.title = `${title} — EffortAware`;
  }, [location.search, location.pathname]);

  const weeklyStudyHours = user?.Study_Hours_Per_Day
    ? Math.max(1, user?.Study_Hours_Per_Day) * 7
    : user?.weeklyStudyHours || 42;

  const burnoutRisk = user?.abandonRisk ?? user?.burnout_risk ?? 48;

  // Navigation items are now fetched from API in useEffect above


  return (
    <div className={`${activeDarkMode ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"} min-h-screen`}>
      {/* Left Sidebar - Navigation */}
      <aside
        className={`hidden lg:flex lg:w-[220px] flex-col gap-4 p-4 rounded-[32px] shadow-2xl fixed inset-y-0 left-0 transition-all duration-500 ${
          activeDarkMode ? "border-slate-800 bg-slate-950/95 text-white" : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div className="text-sm uppercase tracking-[0.32em] text-cyan-300 font-semibold">Navigation</div>

        <nav className="flex flex-col gap-2"> 
          {sidebarItems.map((item) => {
            const toWithTitle =
              item.to && item.to.includes("?")
                ? `${item.to}&tabTitle=${encodeURIComponent(item.text)}`
                : `${item.to}?tabTitle=${encodeURIComponent(item.text)}`;
            return (
              <SidebarItem
                key={item.text}
                icon={getIcon(item.icon)}
                text={item.text}
                darkMode={activeDarkMode}
                active={location.pathname === item.to}
                to={toWithTitle}
              />
            );
          })}
        </nav>

        <button
          onClick={onBack || (() => navigate(-1))}
          className={`mt-auto w-full inline-flex items-center justify-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
            activeDarkMode
              ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02]"
              : "bg-cyan-500 text-white shadow-lg hover:shadow-xl"
          }`}
        >
          <FaArrowLeft /> Back
        </button>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-[220px] lg:mr-0">
        <div className={`lg:hidden fixed inset-x-0 top-0 z-20 border-b backdrop-blur-sm px-4 py-3 ${activeDarkMode ? "border-slate-800 bg-slate-950/95 text-white" : "border-slate-200 bg-white/95 text-slate-900"}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-xl">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-300 font-semibold">Welcome</p>
                <p className="text-sm font-semibold truncate">{user?.name || "Learner"}</p>
              </div>
            </div>
            <button
              onClick={onBack || (() => navigate(-1))}
              className={`rounded-2xl px-3 py-2 text-xs font-semibold shadow-lg transition ${activeDarkMode ? "bg-slate-900 text-white shadow-slate-950/40" : "bg-slate-100 text-slate-900 shadow-slate-200/50"}`}
            >
              Back
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sidebarItems.map((item) => {
              const toWithTitle =
                item.to && item.to.includes("?")
                  ? `${item.to}&tabTitle=${encodeURIComponent(item.text)}`
                  : `${item.to}?tabTitle=${encodeURIComponent(item.text)}`;
              return (
                <Link
                  key={item.text}
                  to={toWithTitle}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    location.pathname === item.to
                      ? activeDarkMode
                        ? "border-cyan-500 bg-cyan-500/15 text-cyan-200"
                        : "border-cyan-500 bg-cyan-500/10 text-cyan-700"
                      : activeDarkMode
                      ? "border-slate-700 bg-slate-900/85 text-slate-300 hover:border-cyan-500 hover:text-white"
                      : "border-slate-200 bg-white/85 text-slate-900 hover:border-cyan-500 hover:text-cyan-700"
                  }`}
                >
                  {item.text}
                </Link>
              );
            })}
          </div>
        </div>

        <main className="min-h-screen pt-24 lg:pt-0 px-4 lg:px-6">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
