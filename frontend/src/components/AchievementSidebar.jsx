import React, { useMemo, useState, useEffect } from "react";
import { FaFire, FaTrophy, FaStar, FaBullseye, FaBolt, FaMedal, FaCalendarCheck, FaAward, FaCheckCircle } from "react-icons/fa";
import { calculateLoginStreak, calculateLoginLongestStreak } from "../services/auth";

export default function AchievementSidebar({ user, predictions, darkMode }) {
  const [streakDays, setStreakDays] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    setStreakDays(calculateLoginStreak(user));
    setLongestStreak(calculateLoginLongestStreak(user));
  }, [user, predictions]);

  // Calculate study efficiency (0-100)
  const studyEfficiency = useMemo(() => {
    return predictions?.study_efficiency || user?.studyEfficiency || 0;
  }, [predictions, user]);

  // Calculate burnout risk (0-100)
  const burnoutRisk = useMemo(() => {
    return predictions?.burnout_risk || user?.burnoutRisk || 50;
  }, [predictions, user]);

  // Calculate progress based on metrics
  const dailyHours = user?.Study_Hours_Per_Day || 5;
  const weeklyHours = dailyHours * 7;
  const focusScore = predictions?.focus_score || user?.focusScore || 60;
  const loadScore = predictions?.load_score || user?.loadScore || 50;

  const achievementScore = useMemo(() => {
    const base =
      streakDays * 16 +
      Math.min(studyEfficiency, 100) * 1.2 +
      Math.max(0, 100 - burnoutRisk) * 0.7 +
      focusScore * 1.1 +
      Math.min(weeklyHours, 50) * 0.4;
    return Math.min(1000, Math.round(base));
  }, [streakDays, studyEfficiency, burnoutRisk, focusScore, weeklyHours]);

  const levels = [
    { name: "Bronze", threshold: 0 },
    { name: "Silver", threshold: 180 },
    { name: "Gold", threshold: 320 },
    { name: "Platinum", threshold: 520 },
    { name: "Elite", threshold: 760 },
    { name: "Legend", threshold: 900 },
  ];

  const currentLevel = levels.slice().reverse().find((level) => achievementScore >= level.threshold) || levels[0];
  const nextLevel = levels.find((level) => level.threshold > achievementScore) || levels[levels.length - 1];
  const nextLevelThreshold = nextLevel.threshold;
  const currentLevelThreshold = currentLevel.threshold;
  const levelProgress = nextLevelThreshold > currentLevelThreshold
    ? Math.min(100, Math.round(((achievementScore - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100))
    : 100;

  // Achievement Definitions
  const achievements = useMemo(() => {
    const badges = [];

    // 1. Streak Achievements
    if (streakDays >= 1) {
      badges.push({
        id: "starter",
        name: "Quick Starter",
        icon: FaBolt,
        color: "text-amber-400",
        bgColor: "bg-amber-500/20",
        borderColor: "border-amber-500/50",
        description: "1 day streak",
        unlocked: true,
        progress: 1,
      });
    }

    if (streakDays >= 3) {
      badges.push({
        id: "dedicated",
        name: "Dedicated Learner",
        icon: FaCalendarCheck,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20",
        borderColor: "border-emerald-500/50",
        description: "3 day streak",
        unlocked: true,
        progress: 3,
      });
    }

    if (streakDays >= 7) {
      badges.push({
        id: "unstoppable",
        name: "Unstoppable",
        icon: FaFire,
        color: "text-orange-400",
        bgColor: "bg-orange-500/20",
        borderColor: "border-orange-500/50",
        description: "7 day streak",
        unlocked: true,
        progress: 7,
      });
    }

    if (streakDays >= 14) {
      badges.push({
        id: "legendary",
        name: "Legendary Streak",
        icon: FaMedal,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/20",
        borderColor: "border-cyan-500/50",
        description: "14 day streak",
        unlocked: true,
        progress: 14,
      });
    }

    if (streakDays >= 30) {
      badges.push({
        id: "immortal",
        name: "Immortal Streak",
        icon: FaAward,
        color: "text-purple-400",
        bgColor: "bg-purple-500/20",
        borderColor: "border-purple-500/50",
        description: "30 day streak",
        unlocked: true,
        progress: 30,
      });
    }

    // 2. Efficiency Achievements
    if (studyEfficiency >= 50) {
      badges.push({
        id: "efficient",
        name: "Efficient Learner",
        icon: FaBullseye,
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500/50",
        description: `${studyEfficiency}% efficiency`,
        unlocked: true,
        progress: Math.min(studyEfficiency, 100),
      });
    }

    if (studyEfficiency >= 75) {
      badges.push({
        id: "master",
        name: "Master Learner",
        icon: FaStar,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500/50",
        description: `${studyEfficiency}% efficiency`,
        unlocked: true,
        progress: Math.min(studyEfficiency, 100),
      });
    }

    // 3. Burnout Management Achievement
    if (burnoutRisk < 40) {
      badges.push({
        id: "balanced",
        name: "Balanced Pace",
        icon: FaBolt,
        color: "text-lime-400",
        bgColor: "bg-lime-500/20",
        borderColor: "border-lime-500/50",
        description: "Low burnout risk",
        unlocked: true,
        progress: Math.max(0, 100 - burnoutRisk),
      });
    }

    // 4. Focus Achievement
    if (focusScore >= 70) {
      badges.push({
        id: "focused",
        name: "Laser Focus",
        icon: FaTrophy,
        color: "text-indigo-400",
        bgColor: "bg-indigo-500/20",
        borderColor: "border-indigo-500/50",
        description: `${focusScore} focus score`,
        unlocked: true,
        progress: Math.min(focusScore, 100),
      });
    }

    if (focusScore >= 80 && studyEfficiency >= 80) {
      badges.push({
        id: "problem-solver",
        name: "Problem Solver",
        icon: FaStar,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/20",
        borderColor: "border-cyan-500/50",
        description: "High focus and efficiency",
        unlocked: true,
        progress: Math.min((focusScore + studyEfficiency) / 2, 100),
      });
    }

    // 5. Consistency Achievement
    if (weeklyHours >= 40) {
      badges.push({
        id: "consistent",
        name: "Consistent Scholar",
        icon: FaBullseye,
        color: "text-rose-400",
        bgColor: "bg-rose-500/20",
        borderColor: "border-rose-500/50",
        description: `${weeklyHours}h/week`,
        unlocked: true,
        progress: Math.min(weeklyHours, 50),
      });
    }

    if (dailyHours >= 3) {
      badges.push({
        id: "daily-coder",
        name: "Daily Coder",
        icon: FaBolt,
        color: "text-orange-400",
        bgColor: "bg-orange-500/20",
        borderColor: "border-orange-500/50",
        description: `${dailyHours}h/day`,
        unlocked: true,
        progress: Math.min(dailyHours * 10, 100),
      });
    }

    if (weeklyHours >= 50) {
      badges.push({
        id: "marathon-mode",
        name: "Marathon Mode",
        icon: FaFire,
        color: "text-red-400",
        bgColor: "bg-red-500/20",
        borderColor: "border-red-500/50",
        description: "Strong weekly momentum",
        unlocked: true,
        progress: Math.min(weeklyHours, 60),
      });
    }

    if (dailyHours >= 6) {
      badges.push({
        id: "roadrunner",
        name: "Roadrunner",
        icon: FaFire,
        color: "text-red-400",
        bgColor: "bg-red-500/20",
        borderColor: "border-red-500/50",
        description: "High-intensity daily focus",
        unlocked: true,
        progress: Math.min(dailyHours * 12, 100),
      });
    }

    if (focusScore >= 85 && studyEfficiency >= 85) {
      badges.push({
        id: "problem-buster",
        name: "Problem Buster",
        icon: FaTrophy,
        color: "text-indigo-400",
        bgColor: "bg-indigo-500/20",
        borderColor: "border-indigo-500/50",
        description: "85+ focus and efficiency",
        unlocked: true,
        progress: Math.min((focusScore + studyEfficiency) / 2, 100),
      });
    }

    if (longestStreak >= 15) {
      badges.push({
        id: "streak-guardian",
        name: "Streak Guardian",
        icon: FaMedal,
        color: "text-sky-400",
        bgColor: "bg-sky-500/20",
        borderColor: "border-sky-500/50",
        description: "Protect your longest run",
        unlocked: true,
        progress: Math.min(longestStreak * 6, 100),
      });
    }

    if (achievementScore >= 700) {
      badges.push({
        id: "persistence-pro",
        name: "Persistence Pro",
        icon: FaAward,
        color: "text-violet-400",
        bgColor: "bg-violet-500/20",
        borderColor: "border-violet-500/50",
        description: "Reach 700 achievement points",
        unlocked: true,
        progress: Math.min((achievementScore / 700) * 100, 100),
      });
    }

    return badges;
  }, [streakDays, studyEfficiency, burnoutRisk, focusScore, weeklyHours, dailyHours, longestStreak, achievementScore]);

  const earnedBadgeIds = useMemo(() => achievements.map((badge) => badge.id), [achievements]);

  // Upcoming achievements
  const upcomingAchievements = useMemo(() => {
    const upcoming = [];

    if (streakDays < 3) {
      upcoming.push({
        name: "Dedicated Learner",
        requirement: `${3 - streakDays} more days`,
        icon: FaCalendarCheck,
      });
    }

    if (streakDays < 7) {
      upcoming.push({
        name: "Unstoppable",
        requirement: `${7 - streakDays} more days`,
        icon: FaFire,
      });
    }

    if (studyEfficiency < 75) {
      upcoming.push({
        name: "Master Learner",
        requirement: `${Math.ceil(75 - studyEfficiency)}% more efficiency`,
        icon: FaStar,
      });
    }

    return upcoming.slice(0, 3);
  }, [streakDays, studyEfficiency]);

  const bgColor = darkMode ? "bg-slate-950" : "bg-slate-50";
  const borderColor = darkMode ? "border-slate-800" : "border-slate-200";
  const textColor = darkMode ? "text-white" : "text-slate-950";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-600";
  const cardBg = darkMode ? "bg-slate-900" : "bg-white";

  const earnedBadgeCount = earnedBadgeIds.length;
  const [showBadgeCount, setShowBadgeCount] = useState(false);
  const earnedBadges = achievements;

  const achievementSummary = [
    {
      title: "Achievement Score",
      value: achievementScore,
      description: "Total performance points",
      accent: "text-cyan-500",
    },
    {
      title: "Current Tier",
      value: currentLevel.name,
      description: `Next: ${nextLevel.name}`,
      accent: "text-emerald-500",
    },
    {
      title: "Current Streak",
      value: `${streakDays} days`,
      description: "Today’s active streak",
      accent: "text-orange-500",
    },
    {
      title: "Longest Streak",
      value: `${longestStreak} days`,
      description: "Your top streak run",
      accent: "text-sky-500",
    },
    {
      id: "unlocked-badges",
      title: "Unlocked Badges",
      value: earnedBadgeCount,
      description: "See how many badges you’ve earned",
      accent: "text-violet-500",
    },
  ];

  const badgeCatalog = [
    {
      id: "quick-starter",
      title: "Quick Starter",
      icon: FaBolt,
      target: "Complete 1 day streak",
      note: "Login once to unlock",
      color: "text-amber-500",
      border: "border-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      id: "dedicated-learner",
      title: "Dedicated Learner",
      icon: FaCalendarCheck,
      target: "Complete 3 day streak",
      note: "Keep your streak going",
      color: "text-emerald-500",
      border: "border-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      id: "unstoppable",
      title: "Unstoppable",
      icon: FaFire,
      target: "Complete 7 day streak",
      note: "Build consistency over a week",
      color: "text-orange-500",
      border: "border-orange-400",
      bg: "bg-orange-50 dark:bg-orange-500/10",
    },
    {
      id: "legendary-streak",
      title: "Legendary Streak",
      icon: FaMedal,
      target: "Complete 14 day streak",
      note: "Stay active for two weeks",
      color: "text-cyan-500",
      border: "border-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-500/10",
    },
    {
      id: "immortal-streak",
      title: "Immortal Streak",
      icon: FaAward,
      target: "Complete 30 day streak",
      note: "Master long-term consistency",
      color: "text-purple-500",
      border: "border-purple-400",
      bg: "bg-purple-50 dark:bg-purple-500/10",
    },
    {
      id: "efficient-learner",
      title: "Efficient Learner",
      icon: FaBullseye,
      target: "Reach 50% efficiency",
      note: "Study smarter, not longer",
      color: "text-blue-500",
      border: "border-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      id: "master-learner",
      title: "Master Learner",
      icon: FaStar,
      target: "Reach 75% efficiency",
      note: "Achieve high study impact",
      color: "text-yellow-500",
      border: "border-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-500/10",
    },
    {
      id: "balanced-pace",
      title: "Balanced Pace",
      icon: FaBolt,
      target: "Keep burnout under 40%",
      note: "Stay strong and steady",
      color: "text-lime-500",
      border: "border-lime-400",
      bg: "bg-lime-50 dark:bg-lime-500/10",
    },
    {
      id: "laser-focus",
      title: "Laser Focus",
      icon: FaTrophy,
      target: "Reach 70 focus score",
      note: "Concentration wins more goals",
      color: "text-indigo-500",
      border: "border-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      id: "problem-solver",
      title: "Problem Solver",
      icon: FaStar,
      target: "Focus + efficiency combo",
      note: "Solve tough study challenges",
      color: "text-cyan-500",
      border: "border-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-500/10",
    },
    {
      id: "problem-buster",
      title: "Problem Buster",
      icon: FaTrophy,
      target: "85+ focus & efficiency",
      note: "Break through hard goals",
      color: "text-indigo-500",
      border: "border-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      id: "daily-coder",
      title: "Daily Coder",
      icon: FaBolt,
      target: "Study 3h/day",
      note: "Keep a steady daily routine",
      color: "text-orange-500",
      border: "border-orange-400",
      bg: "bg-orange-50 dark:bg-orange-500/10",
    },
    {
      id: "roadrunner",
      title: "Roadrunner",
      icon: FaFire,
      target: "Study 6h/day",
      note: "High-intensity focus days",
      color: "text-red-500",
      border: "border-red-400",
      bg: "bg-red-50 dark:bg-red-500/10",
    },
    {
      id: "marathon-mode",
      title: "Marathon Mode",
      icon: FaFire,
      target: "Study 50h/week",
      note: "Maintain long-term momentum",
      color: "text-red-500",
      border: "border-red-400",
      bg: "bg-red-50 dark:bg-red-500/10",
    },
    {
      id: "consistent-scholar",
      title: "Consistent Scholar",
      icon: FaBullseye,
      target: "Study 40h/week",
      note: "Maintain a healthy study rhythm",
      color: "text-rose-500",
      border: "border-rose-400",
      bg: "bg-rose-50 dark:bg-rose-500/10",
    },
    {
      id: "streak-guardian",
      title: "Streak Guardian",
      icon: FaMedal,
      target: "Hold a 15-day streak",
      note: "Protect your longest run",
      color: "text-sky-500",
      border: "border-sky-400",
      bg: "bg-sky-50 dark:bg-sky-500/10",
    },
    {
      id: "persistence-pro",
      title: "Persistence Pro",
      icon: FaAward,
      target: "Reach 700 achievement points",
      note: "Stay committed over time",
      color: "text-violet-500",
      border: "border-violet-400",
      bg: "bg-violet-50 dark:bg-violet-500/10",
    },
  ].map((badge) => ({
    ...badge,
    unlocked: earnedBadgeIds.includes(badge.id),
  }));

  return (
    <div className={`w-full ${bgColor} ${textColor}`}>
      <div className={`rounded-[2rem] border ${cardBg} ${borderColor} p-8 shadow-xl`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/80 font-semibold">Achievement dashboard</p>
            <h2 className="mt-3 text-4xl font-bold">Level up your learning progress</h2>
            <p className={`mt-4 text-sm leading-relaxed ${mutedText}`}>
              A polished achievement experience built for clarity, motivation, and professional progress tracking.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {achievementSummary.map((item) => (
              <div key={item.title} className={`rounded-3xl border ${borderColor} ${cardBg} p-5 shadow-sm`}>
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400 font-semibold">{item.title}</p>
                {item.id === "unlocked-badges" ? (
                  <button
                    type="button"
                    onClick={() => setShowBadgeCount((value) => !value)}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-400"
                  >
                    {item.value} Badges Earned
                  </button>
                ) : (
                  <p className={`mt-3 text-3xl font-semibold ${item.accent}`}>{item.value}</p>
                )}
                <p className={`mt-2 text-sm ${mutedText}`}>{item.id === "unlocked-badges" ? "Tap to show earned badges" : item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <div className="space-y-6">
          <div className={`rounded-[1.75rem] border ${cardBg} ${borderColor} p-6 shadow-lg`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400 font-semibold">Tier progress</p>
                <h3 className="mt-3 text-2xl font-semibold">{currentLevel.name} tier</h3>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  You are {achievementScore} points into the {currentLevel.name} tier. Reach {nextLevel.name} with {Math.max(0, nextLevelThreshold - achievementScore)} more points.
                </p>
              </div>
              <div className="rounded-3xl bg-slate-100 dark:bg-slate-950 p-4 text-right">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Progress</p>
                <p className="mt-2 text-4xl font-semibold text-cyan-500">{levelProgress}%</p>
              </div>
            </div>
            <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all" style={{ width: `${levelProgress}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{currentLevel.name}</span>
              <span>{nextLevel.name}</span>
            </div>
          </div>

          <div className={`rounded-[1.75rem] border ${cardBg} ${borderColor} p-6 shadow-lg`}>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400 font-semibold">Badge collection</p>
            <h3 className="mt-3 text-2xl font-semibold">Complete your achievement set</h3>
            <p className={`mt-2 text-sm ${mutedText}`}>All badges are shown in neutral mode until you unlock them.</p>
            <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-4">
              {badgeCatalog.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.id} className={`rounded-3xl border border-dashed ${borderColor} bg-slate-50 dark:bg-slate-900/80 p-5 opacity-90`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-2xl shadow-sm ${badge.color}`}>
                        <Icon />
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${textColor}`}>{badge.title}</p>
                        <p className={`mt-1 text-xs ${mutedText}`}>{badge.note}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                      Unlock: {badge.target}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showBadgeCount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[1.5rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Earned badges</h3>
                <p className="mt-2 text-sm text-slate-400">You have earned {earnedBadgeCount} badges so far.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBadgeCount(false)}
                className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {earnedBadges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.id} className="flex items-center gap-4 rounded-3xl border border-slate-800 bg-slate-950 p-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl text-slate-900 shadow-sm ${badge.color}`}>
                      <Icon />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{badge.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{badge.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
