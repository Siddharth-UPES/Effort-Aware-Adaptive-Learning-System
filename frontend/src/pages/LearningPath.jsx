import React, { useEffect, useState } from "react";
import { loadUser, saveUser } from "../services/auth";
import api from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "../context/ThemeContext";

// Default configurations - will be overridden by API
let SKILL_DIFFICULTY = {};
let SKILL_BASE_HOURS = {};
let DIFFICULTY_MULTIPLIER = {};
let SKILL_GRAPH = {};
let SKILL_SEQUENCE_GROUPS = {};

function getLearnerModifier(studyEfficiency) {
  if (studyEfficiency >= 80) return 0.9;
  if (studyEfficiency >= 65) return 1.0;
  if (studyEfficiency >= 50) return 1.15;
  return 1.3;
}

function getBurnoutModifier(burnoutRisk) {
  if (burnoutRisk >= 70) return 1.35;
  if (burnoutRisk >= 50) return 1.15;
  if (burnoutRisk >= 30) return 1.05;
  return 0.95;
}

function getMotivationModifier(motivation) {
  if (motivation >= 80) return 0.9;
  if (motivation >= 60) return 1.0;
  if (motivation >= 40) return 1.15;
  return 1.3;
}

function parseWeeklyWorkload(weeklyWorkload) {
  if (typeof weeklyWorkload === "number") return weeklyWorkload;
  if (typeof weeklyWorkload === "string") {
    const match = weeklyWorkload.match(/(\d+(?:\.\d+)?)/);
    if (match) return Number(match[1]);
  }
  return null;
}

function getDefaultLearningSequence(skill) {
  if (skill === "Deep Learning") {
    return [
      { week: 1, title: "Python Basics" },
      { week: 2, title: "NumPy + Pandas" },
      { week: 3, title: "Statistics" },
      { week: 4, title: "Linear Algebra" },
      { week: 5, title: "Machine Learning" },
      { week: 6, title: "Deep Learning" },
    ];
  }
  return [];
}

function normalizeLearningSequence(skill, weeks) {
  if (!Array.isArray(weeks)) return getDefaultLearningSequence(skill);
  const normalized = [...weeks].sort((a, b) => {
    const weekA = Number(a.week ?? a.week_number ?? 0);
    const weekB = Number(b.week ?? b.week_number ?? 0);
    return weekA - weekB;
  });

  if (skill === "Deep Learning") {
    const order = [
      "Python Basics",
      "NumPy + Pandas",
      "NumPy",
      "Pandas",
      "Statistics",
      "Linear Algebra",
      "Machine Learning",
      "Deep Learning",
    ];
    const getIndex = (title) => {
      const index = order.indexOf(title);
      return index === -1 ? 999 : index;
    };
    return normalized.sort((a, b) => getIndex(a.title) - getIndex(b.title));
  }

  return normalized;
}

function getSequenceProgress(index, total, title) {
  if (/(Machine Learning|Deep Learning)/i.test(title)) {
    return 100;
  }
  const position = Math.min(index + 1, total);
  const pct = Math.round((position / Math.max(total, 1)) * 100);
  const rounded = Math.min(100, Math.max(20, Math.ceil(pct / 20) * 20));
  return rounded;
}

function getCognitiveLoadLevel(score) {
  if (score < 35) return "Low";
  if (score < 65) return "Moderate";
  return "High";
}

function getNumericDifficulty(skill) {
  if (skill === "Python Basics") return 30;
  if (skill === "Machine Learning" || skill === "Deep Learning") return 80;
  return 60;
}

function getCognitiveLoadScore(topicDifficulty, weeklyWorkloadHours, stress, sleepHours) {
  const workloadScore = Math.min(100, Math.round((weeklyWorkloadHours / 50) * 100));
  const stressScore = Math.min(100, Math.max(0, stress ?? 50));
  const sleepDeficit = Math.max(0, 8 - (sleepHours ?? 7));
  const sleepDeficitScore = Math.min(100, Math.round((sleepDeficit / 8) * 100));

  return Math.round(
    topicDifficulty * 0.4 +
      workloadScore * 0.25 +
      stressScore * 0.2 +
      sleepDeficitScore * 0.15
  );
}

function getWeeklyLoadMultiplier(burnoutRisk, consistency) {
  let multiplier = 1.0;
  if (burnoutRisk > 75) multiplier *= 0.75;
  else if (burnoutRisk > 60) multiplier *= 0.8;
  if (consistency > 80) multiplier *= 1.1;
  return Number(multiplier.toFixed(2));
}

function computeProfileSignature(user, skill) {
  return JSON.stringify({
    skill,
    dailyHours: user?.Study_Hours_Per_Day ?? user?.studyHoursPerDay,
    weeklyWorkload: user?.weeklyWorkload,
    stress: user?.stress ?? user?.stress_level,
    sleepHours: user?.Sleep_Hours_Per_Day ?? user?.sleepHoursPerDay,
    motivation: user?.Motivation ?? user?.motivation,
    difficultyTolerance: user?.difficultyLevel ?? user?.difficulty_level,
    consistency: user?.consistency ?? user?.consistency_score,
    burnoutRisk: user?.burnout_risk ?? user?.burnoutRisk,
  });
}

function scaleRoadmapToPredictedEffort(roadmap, predictedEffort) {
  if (!predictedEffort || !roadmap.length) return roadmap;
  const rawTotal = roadmap.reduce((sum, item) => sum + item.estimated_hours, 0);
  if (!rawTotal) return roadmap;
  const scale = predictedEffort / rawTotal;
  return roadmap.map((item) => ({
    ...item,
    estimated_hours: Math.max(1, Math.round(item.estimated_hours * scale)),
  }));
}

function getSkillEffortBreakdown(predictedEffort = 41) {
  const skillComponents = [
    { name: "Fundamentals & Basics", baseHours: 7 },
    { name: "Core Concepts", baseHours: 10 },
    { name: "Advanced Topics", baseHours: 9 },
    { name: "Projects & Practice", baseHours: 11 },
    { name: "Assessment & Review", baseHours: 4 },
  ];
  const totalBaseHours = skillComponents.reduce((sum, item) => sum + item.baseHours, 0);
  const scale = predictedEffort / totalBaseHours;
  return skillComponents.map((item) => ({
    name: item.name,
    estimated_hours: Math.max(1, Math.round(item.baseHours * scale)),
  }));
}

function buildSkillRoadmap(
  weeks,
  studyEfficiency,
  burnoutRisk,
  motivation,
  cognitiveLoadLevel = "Medium",
  weeklyLoadMultiplier = 1.0,
  difficultyTolerance = "Moderate",
  consistency = 0,
  predictedEffortTotal = null
) {
  const learnerModifier = getLearnerModifier(studyEfficiency);
  const burnoutModifier = getBurnoutModifier(burnoutRisk);
  const motivationModifier = getMotivationModifier(motivation);
  const toleranceModifier =
    difficultyTolerance === "High" ? 0.95 : difficultyTolerance === "Low" ? 1.1 : 1.0;
  const consistencyModifier = consistency >= 80 ? 0.9 : consistency >= 50 ? 1.0 : 1.1;
  const durationMultiplier =
    cognitiveLoadLevel === "High" ? 1.25 : cognitiveLoadLevel === "Low" ? 0.9 : 1.0;

  const groupedWeeks =
    cognitiveLoadLevel === "High"
      ? weeks.flatMap((week) => week.title.split(" + ").map((title) => ({ title: title.trim(), week: week.week })))
      : weeks;

  const roadmap = groupedWeeks.map((item) => {
    const title = typeof item === "string" ? item : item.title;
    const difficulty = SKILL_DIFFICULTY[title] || "Medium";
    const baseHours = SKILL_BASE_HOURS[title] ?? 10;
    return {
      skill: title,
      difficulty,
      estimated_hours: Math.round(
        baseHours *
          DIFFICULTY_MULTIPLIER[difficulty] *
          learnerModifier *
          burnoutModifier *
          motivationModifier *
          weeklyLoadMultiplier *
          toleranceModifier *
          consistencyModifier *
          durationMultiplier
      ),
      recommended_duration: `${Math.max(1, Math.round(durationMultiplier * (consistency >= 80 ? 0.9 : consistency < 50 ? 1.2 : 1)))} week${durationMultiplier > 1 ? "s" : ""}`,
      cognitive_load_level: cognitiveLoadLevel,
    };
  });

  return scaleRoadmapToPredictedEffort(roadmap, predictedEffortTotal);
}

export default function LearningPath() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [pathSteps, setPathSteps] = useState([]);
  const [learningSequence, setLearningSequence] = useState([]);
  const [skillRoadmap, setSkillRoadmap] = useState([]);
  const [skillEffortBreakdown, setSkillEffortBreakdown] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("Machine Learning");
  const [predictionAlert, setPredictionAlert] = useState(null);
  const [adaptiveTrigger, setAdaptiveTrigger] = useState(null);
  const [adaptiveSummary, setAdaptiveSummary] = useState(null);
  const [progressStatus, setProgressStatus] = useState("on_track");
  const [progressNote, setProgressNote] = useState("");
  const [efficiencyScore, setEfficiencyScore] = useState(0);
  const [achievementBadges, setAchievementBadges] = useState([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [lastFetchSignature, setLastFetchSignature] = useState("");
  const [availableSkills, setAvailableSkills] = useState(["Machine Learning", "Deep Learning"]);
  const [sequenceDisplayConfig, setSequenceDisplayConfig] = useState({
    section: {
      title: "Sequenced Learning Path",
      showSkillLabel: true,
      showProgressBar: true,
      showMoveButtons: true,
    },
    weekFormat: "Week {index}",
    displayFields: ["weekLabel", "title", "progress"],
  });

  const pageText = darkMode ? "text-white" : "text-slate-950";
  const pageBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  const sectionBg = darkMode ? "bg-slate-900" : "bg-white";
  const cardBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";
  const [newStep, setNewStep] = useState({ step: "", title: "", description: "", estimatedTime: "", difficulty: "Medium" });
  const [sequenceText, setSequenceText] = useState("Python Basics\nNumPy + Pandas\nStatistics\nLinear Algebra\nMachine Learning");

  // Fetch skill configurations from API on component mount
  useEffect(() => {
    const fetchSkillConfig = async () => {
      try {
        const response = await api.get('/api/skills-config');
        const { difficulty, baseHours, difficultyMultiplier, sequenceGroups } = response.data;
        
        SKILL_DIFFICULTY = difficulty || SKILL_DIFFICULTY;
        SKILL_BASE_HOURS = baseHours || SKILL_BASE_HOURS;
        DIFFICULTY_MULTIPLIER = difficultyMultiplier || DIFFICULTY_MULTIPLIER;
        SKILL_SEQUENCE_GROUPS = sequenceGroups || SKILL_SEQUENCE_GROUPS;
        
        setAvailableSkills(Object.keys(SKILL_SEQUENCE_GROUPS));
      } catch (error) {
        console.error("Failed to fetch skill configuration:", error);
        // Fallback to default values
        SKILL_DIFFICULTY = {
          "Python Basics": "Low",
          "NumPy": "Medium",
          "Pandas": "Medium",
          "Statistics": "Medium",
          "Linear Algebra": "Hard",
          "Machine Learning": "Hard",
          "Deep Learning": "Hard",
        };
        SKILL_BASE_HOURS = {
          "Python Basics": 10,
          "NumPy": 12,
          "Pandas": 12,
          "Statistics": 14,
          "Linear Algebra": 16,
          "Machine Learning": 18,
          "Deep Learning": 20,
        };
        DIFFICULTY_MULTIPLIER = {
          Low: 0.9,
          Medium: 1.1,
          Hard: 1.3,
        };
      }
    };
    fetchSkillConfig();
  }, []);

  // Fetch sequence display configuration from API
  useEffect(() => {
    const fetchSequenceConfig = async () => {
      try {
        const response = await api.get('/api/sequence-display-config');
        setSequenceDisplayConfig(response.data);
      } catch (error) {
        console.error("Failed to fetch sequence display config:", error);
        // Uses default config already set in state
      }
    };
    fetchSequenceConfig();
  }, []);

  const buildPath = (user, sequence = []) => {
    if (sequence.length) {
      const dailyHours = user?.Study_Hours_Per_Day ?? user?.studyHoursPerDay ?? 5;
      return sequence.map((item, index) => ({
        step: `Week ${index + 1}`,
        title: typeof item === "string" ? item : item.title,
        description: `Focus on ${typeof item === "string" ? item : item.title} to build the next skill layer.`,
        estimatedTime: `${Math.max(1, dailyHours)} hrs`,
        difficulty: ["Machine Learning", "Deep Learning"].includes(typeof item === "string" ? item : item.title) ? "Hard" : "Medium",
      }));
    }
    return [];
  };

  const moveSequenceItem = (index, direction) => {
    const nextIndex = index + direction;
    if (!learningSequence.length || nextIndex < 0 || nextIndex >= learningSequence.length) return;
    const reordered = [...learningSequence];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    setLearningSequence(reordered);
    setPathSteps(buildPath(user, reordered));
  };

  const fetchLearningSequence = async (skill, currentUser) => {
    try {
      const response = await api.get(`/api/sequence/${encodeURIComponent(skill)}`);
      const weeks = response.data.weeks || [];
      const normalized = normalizeLearningSequence(skill, weeks);
      const finalSequence = normalized.length ? normalized : getDefaultLearningSequence(skill);
      setLearningSequence(finalSequence);
      setPathSteps(buildPath(currentUser, finalSequence));
      return finalSequence;
    } catch (error) {
      console.error("Unable to fetch learning sequence:", error);
      setLearningSequence([]);
      setPathSteps([]);
      return [];
    }
  };

  // Persist current pathSteps for logged-in user
  const savePathToServer = async (stepsToSave) => {
    try {
      if (!user?.email) return;
      await api.post('/api/learning-path/save', { email: user.email, skill: selectedSkill, steps: stepsToSave });
    } catch (err) {
      console.error('Failed to save learning path to server:', err);
    }
  };

  const loadSavedLearningPath = async (email, skill) => {
    try {
      if (!email || !skill) return null;
      const response = await api.get(
        `/api/learning-path/${encodeURIComponent(email)}/${encodeURIComponent(skill)}`
      );
      const savedSteps = response.data?.steps;
      return Array.isArray(savedSteps) ? savedSteps : null;
    } catch (err) {
      console.error('Failed to load saved learning path from server:', err);
      return null;
    }
  };

  const addStep = async () => {
    if (newStep.step && newStep.title) {
      const updated = [...pathSteps, newStep];
      setPathSteps(updated);
      setNewStep({ step: "", title: "", description: "", estimatedTime: "", difficulty: "Medium" });
      await savePathToServer(updated);
    }
  };

  const updateStep = async (index, field, value) => {
    const updated = [...pathSteps];
    updated[index][field] = value;
    setPathSteps(updated);
    await savePathToServer(updated);
  };

  const deleteStep = async (index) => {
    const updated = pathSteps.filter((_, i) => i !== index);
    setPathSteps(updated);
    await savePathToServer(updated);
  };

  const generateDynamicSequence = async () => {
    const currentUser = user || loadUser();
    const lines = sequenceText
      .split(/\r?\n|,/) // allow newline or comma separated
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) return;

    const sequence = lines.map((title, index) => ({ week: index + 1, title }));
    setLearningSequence(sequence);
    setPathSteps(buildPath(currentUser, sequence));

    const studyEfficiency = currentUser?.study_efficiency || currentUser?.studyEfficiency || 70;
    const burnoutRisk = Math.round(currentUser?.abandonRisk ?? currentUser?.burnout_risk ?? currentUser?.burnoutRisk ?? 50);
    const motivation = currentUser?.Motivation || currentUser?.motivation || 50;
    const difficultyTolerance = currentUser?.difficultyLevel || currentUser?.difficulty_level || "Moderate";
    const consistency = currentUser?.consistency || currentUser?.consistency_score || 70;
    const weeklyWorkloadHours =
      parseWeeklyWorkload(currentUser?.weeklyWorkload) ||
      (currentUser?.Study_Hours_Per_Day ?? currentUser?.studyHoursPerDay ?? 5) * 7;
    const cognitiveLoadLevel = getCognitiveLoadLevel(
      getCognitiveLoadScore(getNumericDifficulty(selectedSkill), weeklyWorkloadHours, currentUser?.stress ?? 50, currentUser?.Sleep_Hours_Per_Day ?? 7)
    );

    const predictedEffort = currentUser?.predicted_effort || currentUser?.effortHours || 41;
    setSkillRoadmap(
      buildSkillRoadmap(
        sequence,
        studyEfficiency,
        burnoutRisk,
        motivation,
        cognitiveLoadLevel,
        getWeeklyLoadMultiplier(burnoutRisk, consistency),
        difficultyTolerance,
        consistency,
        predictedEffort
      )
    );
    setSkillEffortBreakdown(getSkillEffortBreakdown(predictedEffort));
    await savePathToServer(buildPath(currentUser, sequence));
  };

  const loadData = async () => {
    const currentUser = loadUser();
    setUser(currentUser);

    if (!currentUser) {
      setPathSteps(buildPath(null, learningSequence));
      setSkillRoadmap(buildSkillRoadmap(learningSequence, 70, 50, 50));
      return;
    }

    const signature = computeProfileSignature(currentUser, selectedSkill);
    if (signature === lastFetchSignature) {
      return;
    }

    setLoadingRoadmap(true);
    try {
      const weeksFromSequence = await fetchLearningSequence(selectedSkill, currentUser);
      const dailyStudyHours = currentUser?.Study_Hours_Per_Day ?? currentUser?.studyHoursPerDay ?? 6;
      const response = await api.post("/api/predict", { 
        ...currentUser, 
        target_skill: selectedSkill, 
        skill: selectedSkill,
        actual_study_hours: dailyStudyHours * 7,
      });
      const data = response.data;
      const updatedUser = {
        ...currentUser,
        ...data,
        target_skill: selectedSkill,
        skill: selectedSkill,
      };
      saveUser(updatedUser);
      setUser(updatedUser);

      setPredictionAlert(data.predictive_alert);
      setProgressStatus(data.progress_status || "on_track");
      setProgressNote(data.progress_note || "");
      setEfficiencyScore(data.effort_efficiency || 0);
      setAchievementBadges(data.achievement_badges || []);
      setAdaptiveTrigger(data.adaptive_trigger || null);
      setAdaptiveSummary(data.adaptive_summary || null);

      const weeks = data.adaptive_sequence?.length
        ? data.adaptive_sequence
        : data.learning_sequence?.weeks?.length
        ? data.learning_sequence.weeks
        : weeksFromSequence;

      const predictedEffort = data.predicted_effort || data.effortHours || null;
      const studyEfficiency = data.study_efficiency || data.studyEfficiency || currentUser.study_efficiency || currentUser.studyEfficiency || 70;
      const burnoutRisk = data.burnout_risk || data.burnoutRisk || currentUser.burnout_risk || currentUser.burnoutRisk || 50;
      const motivation =
        data.Motivation || data.motivation || currentUser.Motivation || currentUser.motivation || 50;
      const cognitiveLoadLevel =
        data.cognitive_load_level || data.cognitive_load || currentUser.cognitiveLoad || "Moderate";
      const difficultyTolerance =
        data.difficulty_tolerance || data.difficultyLevel || currentUser.difficultyLevel || "Moderate";
      const consistency = data.consistency || data.consistency_score || 0;

      setLearningSequence(weeks);
      const savedSteps = await loadSavedLearningPath(currentUser.email, selectedSkill);
      if (Array.isArray(savedSteps) && savedSteps.length) {
        setPathSteps(savedSteps);
      } else {
        setPathSteps(buildPath(currentUser, weeks));
      }

      const roadmap = data.roadmap && data.roadmap.length
        ? data.roadmap
        : buildSkillRoadmap(
            weeks,
            studyEfficiency,
            burnoutRisk,
            motivation,
            cognitiveLoadLevel,
            getWeeklyLoadMultiplier(burnoutRisk, consistency),
            difficultyTolerance,
            consistency
          );
      setSkillRoadmap(roadmap);
      setSkillEffortBreakdown(getSkillEffortBreakdown(predictedEffort || 41));
      setLastFetchSignature(signature);
    } catch (error) {
      console.error("Prediction request failed:", error);
      const weeks = await fetchLearningSequence(selectedSkill, currentUser);
      const savedSteps = await loadSavedLearningPath(currentUser.email, selectedSkill);
      if (Array.isArray(savedSteps) && savedSteps.length) {
        setPathSteps(savedSteps);
      } else {
        setPathSteps(buildPath(currentUser, weeks));
      }
      const studyEfficiency = currentUser.study_efficiency || currentUser.studyEfficiency || 70;
      const burnoutRisk = currentUser.burnout_risk || currentUser.burnoutRisk || 50;
      const motivation = currentUser.Motivation || currentUser.motivation || 50;
      const weeklyWorkloadHours =
        parseWeeklyWorkload(currentUser.weeklyWorkload) || currentUser.Study_Hours_Per_Day * 7 || currentUser.studyHoursPerDay * 7 || 35;
      const sleepHours = currentUser.Sleep_Hours_Per_Day ?? currentUser.sleepHoursPerDay ?? 7;
      const cognitiveLoadScore = getCognitiveLoadScore(
        getNumericDifficulty(selectedSkill),
        weeklyWorkloadHours,
        currentUser.stress ?? currentUser.stress_level ?? 50,
        sleepHours
      );
      const cognitiveLoadLevel = getCognitiveLoadLevel(cognitiveLoadScore);
      const fallbackEffort = 41;
      setSkillRoadmap(buildSkillRoadmap(weeks, studyEfficiency, burnoutRisk, motivation, cognitiveLoadLevel));
      setSkillEffortBreakdown(getSkillEffortBreakdown(fallbackEffort));
    } finally {
      setLoadingRoadmap(false);
    }
  };

  useEffect(() => {
    const currentUser = loadUser();
    if (currentUser?.target_skill) {
      setSelectedSkill(currentUser.target_skill);
    }
    loadData();
  }, []);

  const currentProfileSignature = computeProfileSignature(user, selectedSkill);
  const needsRecalculation = Boolean(
    user && !loadingRoadmap && currentProfileSignature !== lastFetchSignature
  );

  const weeklyTarget = (() => {
    const dailyHours = user?.Study_Hours_Per_Day ?? user?.studyHoursPerDay ?? 5;
    const customWeeklyWorkload = parseWeeklyWorkload(user?.weeklyWorkload);
    if (customWeeklyWorkload && user?.weeklyWorkload && user.weeklyWorkload !== '0 hrs/week') {
      return typeof user.weeklyWorkload === 'string'
        ? user.weeklyWorkload
        : `${customWeeklyWorkload} hrs/week`;
    }
    const actualWeeklyEffort =
      user?.actual_hours ??
      user?.total_effort_invested ??
      user?.effortHours ??
      user?.predicted_effort;
    if (actualWeeklyEffort !== undefined && actualWeeklyEffort !== null) {
      return `${Math.round(actualWeeklyEffort)} hrs/week`;
    }
    return `${Math.max(1, dailyHours) * 7} hrs/week`;
  })();

  const studyHours = user?.Study_Hours_Per_Day ?? user?.studyHoursPerDay ?? 5;
  const studyEfficiency = user?.studyEfficiency > 0
    ? user.studyEfficiency
    : user?.study_efficiency > 0
    ? user.study_efficiency
    : 70;
  const focusScore = Math.round(user?.focusScore ?? user?.Focus_Score ?? 70);
  const loadScore = Math.round(user?.loadScore ?? user?.Load_Score ?? 55);
  const burnoutRisk = Math.round(user?.abandonRisk ?? user?.burnout_risk ?? 48);
  const confidence = Math.round(user?.confidence ?? 72);

  const trendData = [
    { name: "Week 1", Focus: focusScore, Load: loadScore, Burnout: burnoutRisk },
    { name: "Week 2", Focus: Math.min(100, focusScore + 4), Load: Math.min(100, loadScore + 3), Burnout: Math.max(0, burnoutRisk - 4) },
    { name: "Week 3", Focus: Math.min(100, focusScore + 8), Load: Math.min(100, loadScore + 6), Burnout: Math.max(0, burnoutRisk - 8) },
    { name: "Week 4", Focus: Math.min(100, focusScore + 5), Load: Math.min(100, loadScore + 4), Burnout: Math.max(0, burnoutRisk - 3) },
  ];

  const progressLabel = {
    ahead: "Ahead of schedule",
    behind: "Behind schedule",
    on_track: "On track",
    unknown: "Needs tracking",
  }[progressStatus] || "On track";

  // Helper function to format week label based on config
  const formatWeekLabel = (index) => {
    const weekFormat = sequenceDisplayConfig?.weekFormat || "Week {index}";
    return weekFormat.replace("{index}", index + 1);
  };

  return (
    <SidebarLayout user={user} darkMode={darkMode} predictions={null}>
      <div className={`min-h-screen p-10 ${pageBg} ${pageText}`}>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`text-4xl font-bold ${pageText}`}>Adaptive Learning Path</h1>
            <p className={`mt-3 max-w-2xl ${mutedText}`}>This path adapts automatically to your saved profile data. You can still add new steps, reorder, and keep the plan aligned with your current learning load.</p>
            {adaptiveTrigger && (
              <div className="mt-4 rounded-2xl border px-4 py-3 bg-cyan-50 text-cyan-900">
                <strong className="capitalize">Adaptive rule:</strong> {adaptiveTrigger.replace("_", " ")} — {adaptiveSummary || "Adaptive roadmap applied."}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-slate-500">Target skill:</label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
              >
                {availableSkills.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={loadData}
                disabled={!needsRecalculation}
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingRoadmap ? "Recalculating..." : "Recalculate Roadmap"}
              </button>
              <p className="text-sm text-slate-400">Refresh only when target skill or your profile changes.</p>
            </div>
            <div className={`mt-4 rounded-2xl border p-4 ${sectionBg} ${borderColor}`}>
              <h3 className="text-lg font-semibold mb-3">Dynamic Sequence Input</h3>
              <p className={`text-sm mb-3 ${mutedText}`}>Enter each step or topic on a new line. The list will become your week-by-week learning path.</p>
              <textarea
                value={sequenceText}
                onChange={(e) => setSequenceText(e.target.value)}
                rows={5}
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-cyan-500 ${pageText} ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
                placeholder="Python Basics\nNumPy + Pandas\nStatistics\nLinear Algebra\nMachine Learning"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={generateDynamicSequence}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
                >
                  Generate Dynamic Path
                </button>
                <button
                  type="button"
                  onClick={() => { setSequenceText(''); setLearningSequence([]); setPathSteps([]); }}
                  className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
                >
                  Reset
                </button>
              </div>
            </div>
            {(loadScore > 75 || studyEfficiency < 60) && (
              <div className="mt-4 rounded-3xl border border-amber-400/40 bg-amber-400/10 p-4 text-amber-100">
                <p className="font-semibold">⚠️ Alert: Your current learning load is high or efficiency is low. Adjust the path to balance effort and recovery.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className={`rounded-3xl p-5 ${cardBg} ${borderColor}`}>
                <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Study Hours</p>
                <p className="mt-3 text-3xl font-semibold">{studyHours} hrs/day</p>
              </div>
              <div className={`rounded-3xl p-5 ${cardBg} ${borderColor}`}>
                <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Weekly target</p>
                <p className="mt-3 text-3xl font-semibold">{weeklyTarget}</p>
                <p className="mt-2 text-slate-400">Learning path analytics live here.</p>
              </div>
              <div className={`rounded-3xl p-5 ${cardBg} ${borderColor}`}>
                <p className={`text-sm uppercase tracking-[0.18em] ${mutedText}`}>Study Efficiency</p>
                <p className="mt-3 text-3xl font-semibold">{Math.round(studyEfficiency)}%</p>
              </div>
            </div>

            {/* Current Week Focus - Week 1 Details
            {learningSequence.length > 0 && (
              <div className={`mb-6 rounded-3xl p-6 border ${sectionBg} ${borderColor} ${pageText}`}>
                <h2 className="text-2xl font-semibold mb-4">📚 This Week's Focus</h2>
                {pathSteps.length > 0 ? (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                    <span className="flex-shrink-0 rounded-full bg-cyan-500/30 text-cyan-300 w-8 h-8 flex items-center justify-center text-sm font-bold">
                      ⭐
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{pathSteps[0].step}</p>
                      <p className={`text-sm ${mutedText}`}>{pathSteps[0].title}</p>
                    </div>
                  </div>
                ) : (
                  <p className={mutedText}>Add your first learning step to get started.</p>
                )}
              </div>
            )} */}

            <div className={`mb-6 rounded-3xl border ${sectionBg} ${borderColor} ${pageText}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-6">
                <div>
                  <h2 className="text-2xl font-semibold">{sequenceDisplayConfig?.section?.title || "Sequenced Learning Path"}</h2>
                  <p className={`mt-1 text-sm ${mutedText}`}>A clean roadmap for your target skill, with weekly progression and completion markers.</p>
                </div>
                {sequenceDisplayConfig?.section?.showSkillLabel && (
                  <span className="rounded-full border px-3 py-2 text-sm font-semibold text-cyan-600 border-cyan-200 bg-cyan-50">
                    {selectedSkill}
                  </span>
                )}
              </div>

              <div className="relative px-6 pb-6">
                <div className="absolute left-5 top-10 h-[calc(100%-2.5rem)] w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                <div className="space-y-6">
                  {learningSequence.length ? (
                    learningSequence.map((item, index) => {
                      const title = typeof item === "string" ? item : item.title;
                      const weekLabel = formatWeekLabel(index);
                      const progress = getSequenceProgress(index, learningSequence.length, title);
                      const isFinal = index === learningSequence.length - 1;
                      return (
                        <div key={`${title}-${index}`} className="relative pl-14">
                          <div className="absolute left-0 top-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-sm font-semibold text-white shadow-lg">
                            {index + 1}
                          </div>
                          <div className={`rounded-3xl border ${borderColor} ${cardBg} p-5 shadow-sm`}> 
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm uppercase tracking-[0.24em] text-cyan-500">{weekLabel}</p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
                              </div>
                              <div className="space-y-2 text-right">
                                <div className="text-sm font-semibold text-slate-500">Completion</div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 w-40">
                                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="text-xs font-semibold text-slate-500">{progress}% complete</div>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                              <div className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {index === 0 ? "Start" : index === learningSequence.length - 1 ? "Final Milestone" : "Progress Step"}
                              </div>
                              {sequenceDisplayConfig?.section?.showMoveButtons && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => moveSequenceItem(index, -1)}
                                    disabled={index === 0}
                                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 disabled:opacity-40"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveSequenceItem(index, 1)}
                                    disabled={index === learningSequence.length - 1}
                                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 disabled:opacity-40"
                                  >
                                    ↓
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className={mutedText}>Loading sequenced learning path…</p>
                  )}
                </div>
              </div>
            </div>

            {/* All Steps Below */}
            <div className="space-y-6">
              {pathSteps.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mt-8 mb-4">📚 All Learning Steps</h3>
                  <div className={`rounded-3xl p-6 border ${sectionBg} ${borderColor} ${pageText}`}>
                    <ul className="space-y-3">
                      {pathSteps.map((step, index) => (
                        <li key={index} className={`flex items-start gap-3 p-3 rounded-2xl transition ${index === 0 ? 'bg-cyan-500/10 border border-cyan-500/30' : ''}`}>
                          <span className={`flex-shrink-0 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold ${
                            index === 0 
                              ? 'bg-cyan-500/30 text-cyan-300' 
                              : 'bg-slate-500/20 text-slate-300'
                          }`}>
                            {index === 0 ? '⭐' : index + 1}
                          </span>
                          <div className="flex-1 pt-0.5">
                            <p className="font-semibold">{step.step}</p>
                            <p className={mutedText}>{step.title}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor} ${pageText}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Focus vs Load Trend</h2>
                <span className={`text-sm ${mutedText}`}>4 weeks</span>
              </div>
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                    <YAxis tick={{ fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend iconType="circle" wrapperStyle={{ color: '#cbd5e1' }} />
                        <Line type="monotone" dataKey="Focus" stroke="#22d3ee" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Load" stroke="#818cf8" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor} ${pageText}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Skill Effort Estimation</h2>
                  <p className={`text-sm ${mutedText}`}>Based on predicted effort for {selectedSkill}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${darkMode ? "bg-slate-900/95 text-cyan-300" : "bg-slate-100 text-slate-700"}`}>
                  {skillEffortBreakdown.reduce((sum, item) => sum + item.estimated_hours, 0)} hrs
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {skillEffortBreakdown.length ? (
                  skillEffortBreakdown.map((item) => (
                    <div key={item.name} className={`rounded-3xl p-4 border ${borderColor} ${cardBg}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                        </div>
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">
                          {item.estimated_hours} hrs
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={mutedText}>Loading effort estimates…</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SidebarLayout>
  );
}

function PathCard({ stepData, onUpdate, onDelete }) {
  const { darkMode } = useTheme();
  const pageText = darkMode ? "text-white" : "text-slate-950";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";
  const inputBg = darkMode ? "bg-slate-950" : "bg-slate-100";

  return (
    <div className={`rounded-3xl p-4 shadow-sm border ${borderColor} ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="grid gap-4 sm:grid-cols-2 flex-1">
          <div>
            <label className={`block text-sm font-medium mb-1 ${mutedText}`}>Step</label>
            <input
              type="text"
              value={stepData.step}
              onChange={(e) => onUpdate("step", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-cyan-500 ${pageText} ${inputBg} ${borderColor}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${mutedText}`}>Title</label>
            <input
              type="text"
              value={stepData.title}
              onChange={(e) => onUpdate("title", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-cyan-500 ${pageText} ${inputBg} ${borderColor}`}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="self-start rounded-full bg-red-500/10 text-red-500 px-3 py-1 text-sm font-semibold hover:bg-red-500/15"
        >
          Delete
        </button>
      </div>
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-1 ${mutedText}`}>Description</label>
        <textarea
          value={stepData.description || ""}
          onChange={(e) => onUpdate("description", e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-cyan-500 resize-none ${pageText} ${inputBg} ${borderColor}`}
          rows="2"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${mutedText}`}>Estimated Time</label>
          <input
            type="text"
            value={stepData.estimatedTime || ""}
            onChange={(e) => onUpdate("estimatedTime", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-cyan-500 ${pageText} ${inputBg} ${borderColor}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${mutedText}`}>Difficulty</label>
          <select
            value={stepData.difficulty || "Medium"}
            onChange={(e) => onUpdate("difficulty", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-cyan-500 ${pageText} ${inputBg} ${borderColor}`}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>
    </div>
  );
}
