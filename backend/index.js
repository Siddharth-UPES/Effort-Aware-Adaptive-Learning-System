import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGODB_URI;

function connectDatabase() {
  if (!mongoUri) {
    console.error("MONGODB_URI is not set in .env");
    process.exit(1);
  }

  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "Learner" },
  stress: { type: Number, min: 0, max: 100, default: 50 },
  pressure: { type: Number, min: 0, max: 100, default: 50 },
  effortHours: { type: Number, default: 0 },
  completionTime: { type: String, default: "" },
  weeklyWorkload: { type: String, default: "" },
  totalLearnHours: { type: Number, default: 0 },
  difficultyLevel: { type: String, default: "Medium" },
  cognitiveLoad: { type: String, default: "Moderate" },
  abandonRisk: { type: Number, min: 0, max: 100, default: 0 },
  focusScore: { type: Number, min: 0, max: 100, default: 50 },
  loadScore: { type: Number, min: 0, max: 100, default: 50 },
  confidence: { type: Number, min: 0, max: 100, default: 50 },
  age: { type: Number, default: 18 },
  studentType: { type: String, default: "College" },
  Motivation: { type: Number, default: 50 },
  motivation_status: { type: String, default: "Not depressed" },
  OnlineCourses: { type: Number, default: 0 },
  GPA: { type: Number, default: 0 },
  engagement_score: { type: Number, min: 0, max: 200, default: 100 },
  study_efficiency: { type: Number, min: 0, max: 100, default: 60 },
  lifestyle_balance: { type: Number, min: 0, max: 100, default: 60 },
  depression: { type: Number, min: 0, max: 100, default: 5 },
  Sleep_Hours_Per_Day: { type: Number, default: 7 },
  sleep_quality: { type: Number, min: 0, max: 5, default: 3 },
  Physical_Activity_Hours_Per_Day: { type: Number, default: 1 },
  academicBurdenLevel: { type: Number, min: 0, max: 5, default: 3 },
  socialMediaHours: { type: Number, default: 2 },
  workload_index: { type: Number, min: 0, max: 20, default: 8 },
  Attendance: { type: Number, min: 0, max: 100, default: 75 },
  depression_status: { type: String, default: 'None' },
  needsAssessment: { type: Boolean, default: false },
  // per-user saved learning paths by skill, e.g. { "Machine Learning": [ { step, title, ... } ] }
  learning_paths: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

const UserProfile = mongoose.model("UserProfile", userSchema);

const SKILL_GRAPH = {
  "Machine Learning": {
    "prerequisites": [
      "Python Basics",
      "NumPy",
      "Pandas",
      "Statistics",
      "Linear Algebra"
    ]
  },
  "Deep Learning": {
    "prerequisites": ["Machine Learning"]
  },
  "Python Basics": { "prerequisites": [] },
  "NumPy": { "prerequisites": ["Python Basics"] },
  "Pandas": { "prerequisites": ["Python Basics", "NumPy"] },
  "Statistics": { "prerequisites": ["Python Basics"] },
  "Linear Algebra": { "prerequisites": ["Python Basics"] }
};

const SKILL_SEQUENCE_GROUPS = {
  "Machine Learning": [
    ["Python Basics"],
    ["NumPy", "Pandas"],
    ["Statistics"],
    ["Linear Algebra"],
    ["Machine Learning"]
  ],
  "Deep Learning": [
    ["Python Basics"],
    ["NumPy", "Pandas"],
    ["Statistics"],
    ["Linear Algebra"],
    ["Machine Learning"],
    ["Deep Learning"]
  ]
};

const SKILL_DIFFICULTY = {
  "Python Basics": "Low",
  "NumPy": "Medium",
  "Pandas": "Medium",
  "Statistics": "Medium",
  "Linear Algebra": "Hard",
  "Machine Learning": "Hard",
  "Deep Learning": "Hard",
};

const SKILL_BASE_HOURS = {
  "Python Basics": 10,
  "NumPy": 12,
  "Pandas": 12,
  "Statistics": 14,
  "Linear Algebra": 16,
  "Machine Learning": 18,
  "Deep Learning": 20,
};

const DIFFICULTY_MULTIPLIER = {
  Low: 0.9,
  Medium: 1.1,
  Hard: 1.3,
};

function getLearningSequence(skill) {
  const normalizedSkill = (skill || "Machine Learning").trim();
  const groups = SKILL_SEQUENCE_GROUPS[normalizedSkill];

  if (groups) {
    return groups.map((group, index) => ({
      week: index + 1,
      title: group.join(" + "),
    }));
  }

  const info = SKILL_GRAPH[normalizedSkill] || { prerequisites: [] };
  const sequence = [...info.prerequisites, normalizedSkill];
  return sequence.map((title, index) => ({
    week: index + 1,
    title,
  }));
}

function getSkillDifficulty(skill) {
  return SKILL_DIFFICULTY[skill] || "Medium";
}

function getNumericDifficulty(skill) {
  const difficulty = SKILL_DIFFICULTY[skill] || "Medium";
  return difficulty === "Low" ? 30 : difficulty === "Hard" ? 80 : 60;
}

function getSkillBaseHours(skill) {
  return SKILL_BASE_HOURS[skill] || 10;
}

function parseWeeklyWorkload(weeklyWorkload) {
  if (typeof weeklyWorkload === "number") return weeklyWorkload;
  if (typeof weeklyWorkload === "string") {
    const match = weeklyWorkload.match(/(\d+(?:\.\d+)?)/);
    if (match) return Number(match[1]);
  }
  return null;
}

function getWeeklyWorkloadScore(hours, fallbackHours = 35) {
  const workloadHours = Math.max(0, hours ?? fallbackHours);
  return Math.min(100, Math.round((workloadHours / 50) * 100));
}

function getSleepDeficitScore(sleepHours) {
  const hours = Number(sleepHours ?? 7);
  const deficit = Math.max(0, 8 - hours);
  return Math.min(100, Math.round((deficit / 8) * 100));
}

function computeCognitiveLoadScore(topicDifficulty, weeklyWorkloadHours, stress, sleepHours) {
  const difficultyScore = topicDifficulty;
  const workloadScore = getWeeklyWorkloadScore(weeklyWorkloadHours);
  const stressScore = Math.min(100, Math.max(0, Number(stress ?? 50)));
  const sleepDeficitScore = getSleepDeficitScore(sleepHours);

  return Math.round(
    difficultyScore * 0.4 +
      workloadScore * 0.25 +
      stressScore * 0.2 +
      sleepDeficitScore * 0.15
  );
}

function getCognitiveLoadLevel(score) {
  if (score < 35) return "Low";
  if (score < 65) return "Moderate";
  return "High";
}

function normalizeDifficultyTolerance(value) {
  if (!value) return "Moderate";
  const normalized = String(value).trim().toLowerCase();
  if (["low", "easy", "beginner"].includes(normalized)) return "Low";
  if (["high", "hard", "advanced", "strong"].includes(normalized)) return "High";
  return "Moderate";
}

function getWeeklyLoadMultiplier(burnoutRisk, consistency) {
  let multiplier = 1.0;
  if (burnoutRisk > 75) multiplier *= 0.75;
  else if (burnoutRisk > 60) multiplier *= 0.8;
  if (consistency > 80) multiplier *= 1.1;
  return Number(multiplier.toFixed(2));
}

function insertRevisionDays(sequence, interval = 3) {
  const revised = [];
  sequence.forEach((item, index) => {
    revised.push({ ...item, week: revised.length + 1 });
    if ((index + 1) % interval === 0 && index + 1 < sequence.length) {
      revised.push({ week: revised.length + 1, title: "Revision and practice" });
    }
  });
  return revised;
}

function buildAdaptiveSequence(skill, cognitiveLoadLevel, burnoutRisk = 0, consistency = 0, difficultyTolerance = "Moderate") {
  let sequence = getLearningSequence(skill);
  difficultyTolerance = normalizeDifficultyTolerance(difficultyTolerance);
  const useEasyFirst = cognitiveLoadLevel === "High" || difficultyTolerance === "Low";
  const addRevisionDays = burnoutRisk > 60 || cognitiveLoadLevel === "High";

  if (useEasyFirst) {
    const expanded = [];
    sequence.forEach((week) => {
      const titles = week.title.split(" + ").map((title) => title.trim());
      const sorted = titles.sort((a, b) => getNumericDifficulty(a) - getNumericDifficulty(b));
      sorted.forEach((title) => {
        expanded.push({ week: expanded.length + 1, title });
      });
    });
    sequence = expanded;
  }

  if (addRevisionDays) {
    sequence = insertRevisionDays(sequence, 3);
  }

  if (consistency > 80 && cognitiveLoadLevel !== "High") {
    sequence = sequence.map((item) => ({ ...item, accelerated: true }));
  }

  return sequence;
}

function getRoadmapDurationMultiplier(cognitiveLoadLevel, burnoutRisk = 0) {
  const base = cognitiveLoadLevel === "High" ? 1.2 : cognitiveLoadLevel === "Low" ? 0.9 : 1.0;
  if (burnoutRisk > 75) return Number((base * 1.25).toFixed(2));
  if (burnoutRisk > 60) return Number((base * 1.15).toFixed(2));
  return base;
}

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

function buildSkillRoadmap(skill, studyEfficiency, burnoutRisk, motivation, cognitiveLoadLevel = "Moderate", weeklyLoadMultiplier = 1.0, difficultyTolerance = "Moderate", consistency = 0) {
  const weeks = buildAdaptiveSequence(skill, cognitiveLoadLevel, burnoutRisk, consistency, difficultyTolerance);
  const titles = weeks.flatMap((week) => week.title.split(" + "));
  const learnerModifier = getLearnerModifier(studyEfficiency);
  const burnoutModifier = getBurnoutModifier(burnoutRisk);
  const motivationModifier = getMotivationModifier(motivation);
  const durationMultiplier = getRoadmapDurationMultiplier(cognitiveLoadLevel, burnoutRisk);
  const loadMultiplier = Number(weeklyLoadMultiplier.toFixed(2));

  return titles.map((title) => {
    const difficulty = getSkillDifficulty(title);
    const baseHours = getSkillBaseHours(title);
    const estimated_hours = Math.round(
      baseHours * DIFFICULTY_MULTIPLIER[difficulty] * learnerModifier * burnoutModifier * motivationModifier * durationMultiplier * loadMultiplier
    );
    const adjustedDurationWeeks = Math.max(1, Math.round((durationMultiplier * (burnoutRisk > 60 ? 1.1 : 1)) / Math.max(loadMultiplier, 0.5)));

    return {
      skill: title,
      difficulty,
      estimated_hours,
      cognitive_load_level: cognitiveLoadLevel,
      weekly_load_multiplier: loadMultiplier,
      recommended_duration: `${adjustedDurationWeeks} week${adjustedDurationWeeks > 1 ? "s" : ""}`,
      accelerated: consistency > 80 && cognitiveLoadLevel !== "High",
    };
  });
}

app.get('/', (req, res) => {
  res.send('Effort-Aware Adaptive Learning Pathway Backend is running');
});

app.post('/api/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      stress,
      pressure,
      effortHours,
      completionTime,
      weeklyWorkload,
      totalLearnHours,
      difficultyLevel,
      cognitiveLoad,
      abandonRisk,
      focusScore,
      loadScore,
      confidence,
      age,
      studentType,
      Motivation,
      motivation_status,
      OnlineCourses,
      GPA,
      engagement_score,
      study_efficiency,
      lifestyle_balance,
      depression,
      Sleep_Hours_Per_Day,
      sleep_quality,
      Physical_Activity_Hours_Per_Day,
      academicBurdenLevel,
      socialMediaHours,
      workload_index,
      Attendance,
      depression_status,
      needsAssessment,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const existingUser = await UserProfile.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'This email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const profile = new UserProfile({
      name,
      email,
      passwordHash,
      role,
      stress,
      pressure,
      effortHours,
      completionTime,
      weeklyWorkload,
      totalLearnHours,
      difficultyLevel,
      cognitiveLoad,
      abandonRisk,
      focusScore,
      loadScore,
      confidence,
      age,
      studentType,
      Motivation,
      motivation_status,
      OnlineCourses,
      GPA,
      engagement_score,
      study_efficiency,
      lifestyle_balance,
      depression,
      Sleep_Hours_Per_Day,
      sleep_quality,
      Physical_Activity_Hours_Per_Day,
      academicBurdenLevel,
      socialMediaHours,
      workload_index,
      Attendance,
      depression_status,
      needsAssessment,
    });

    const savedProfile = await profile.save();
    const { passwordHash: _, ...savedData } = savedProfile.toObject();
    return res.status(201).json({ message: 'Signup successful', user: savedData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await UserProfile.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const { passwordHash, ...safeUser } = user.toObject();
    return res.json({ message: 'Login successful', user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required.' });
    }

    const user = await UserProfile.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { passwordHash, ...safeUser } = user.toObject();
    return res.json(safeUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      stress,
      pressure,
      effortHours,
      completionTime,
      weeklyWorkload,
      totalLearnHours,
      difficultyLevel,
      cognitiveLoad,
      abandonRisk,
      focusScore,
      loadScore,
      confidence,
      needsAssessment,
      stress_level,
      Study_Hours_Per_Day,
      Sleep_Hours_Per_Day,
      sleep_quality,
      Extracurricular_Hours_Per_Day,
      Physical_Activity_Hours_Per_Day,
      Attendance,
      depression_status,
      academicBurdenLevel,
      socialMediaHours,
      workload_index,
    } = req.body;

    // Get email from body or from stored user
    const updateEmail = email;
    if (!updateEmail) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Build update fields, handling both camelCase and snake_case
    const updateFields = {
      ...(name && { name }),
      ...(role && { role }),
      ...(stress !== undefined && { stress }),
      ...(stress_level !== undefined && { stress: stress_level }),
      ...(pressure !== undefined && { pressure }),
      ...(effortHours !== undefined && { effortHours }),
      ...(completionTime && { completionTime }),
      ...(weeklyWorkload && { weeklyWorkload }),
      ...(totalLearnHours !== undefined && { totalLearnHours }),
      ...(Study_Hours_Per_Day !== undefined && { Study_Hours_Per_Day }),
      ...(Sleep_Hours_Per_Day !== undefined && { Sleep_Hours_Per_Day }),
      ...(Extracurricular_Hours_Per_Day !== undefined && { Extracurricular_Hours_Per_Day }),
      ...(Physical_Activity_Hours_Per_Day !== undefined && { Physical_Activity_Hours_Per_Day }),
      ...(Attendance !== undefined && { Attendance }),
      ...(difficultyLevel && { difficultyLevel }),
      ...(cognitiveLoad && { cognitiveLoad }),
      ...(abandonRisk !== undefined && { abandonRisk }),
      ...(focusScore !== undefined && { focusScore }),
      ...(loadScore !== undefined && { loadScore }),
      ...(confidence !== undefined && { confidence }),
      ...(age !== undefined && { age }),
      ...(studentType && { studentType }),
      ...(Motivation !== undefined && { Motivation }),
      ...(motivation_status && { motivation_status }),
      ...(OnlineCourses !== undefined && { OnlineCourses }),
      ...(GPA !== undefined && { GPA }),
      ...(engagement_score !== undefined && { engagement_score }),
      ...(study_efficiency !== undefined && { study_efficiency }),
      ...(lifestyle_balance !== undefined && { lifestyle_balance }),
      ...(depression !== undefined && { depression }),
      ...(Sleep_Hours_Per_Day !== undefined && { Sleep_Hours_Per_Day }),
      ...(sleep_quality !== undefined && { sleep_quality }),
      ...(Physical_Activity_Hours_Per_Day !== undefined && { Physical_Activity_Hours_Per_Day }),
      ...(academicBurdenLevel !== undefined && { academicBurdenLevel }),
      ...(socialMediaHours !== undefined && { socialMediaHours }),
      ...(workload_index !== undefined && { workload_index }),
      ...(Attendance !== undefined && { Attendance }),
      ...(depression_status !== undefined && { depression_status }),
      ...(needsAssessment !== undefined && { needsAssessment }),
    };

    if (password) {
      updateFields.passwordHash = await bcrypt.hash(password, 10);
    }

    const profile = await UserProfile.findOneAndUpdate(
      { email: updateEmail },
      updateFields,
      { new: true, upsert: false }
    );

    if (!profile) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { passwordHash, ...safeProfile } = profile.toObject();
    return res.status(200).json(safeProfile);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This email is already registered.' });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      stress,
      pressure,
      effortHours,
      completionTime,
      weeklyWorkload,
      totalLearnHours,
      difficultyLevel,
      cognitiveLoad,
      abandonRisk,
      focusScore,
      loadScore,
      confidence,
      age,
      studentType,
      Motivation,
      motivation_status,
      OnlineCourses,
      GPA,
      engagement_score,
      study_efficiency,
      lifestyle_balance,
      depression,
      Sleep_Hours_Per_Day,
      sleep_quality,
      Physical_Activity_Hours_Per_Day,
      academicBurdenLevel,
      socialMediaHours,
      workload_index,
      Attendance,
      depression_status,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const updateFields = {
      name,
      role,
      stress,
      pressure,
      effortHours,
      completionTime,
      weeklyWorkload,
      totalLearnHours,
      difficultyLevel,
      cognitiveLoad,
      abandonRisk,
      focusScore,
      loadScore,
      confidence,
      age,
      studentType,
      Motivation,
      motivation_status,
      OnlineCourses,
      GPA,
      engagement_score,
      study_efficiency,
      lifestyle_balance,
      depression,
      Sleep_Hours_Per_Day,
      sleep_quality,
      Physical_Activity_Hours_Per_Day,
      academicBurdenLevel,
      socialMediaHours,
      workload_index,
      Attendance,
      depression_status,
    };

    if (password) {
      updateFields.passwordHash = await bcrypt.hash(password, 10);
    }

    const profile = await UserProfile.findOneAndUpdate(
      { email },
      updateFields,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const { passwordHash, ...safeProfile } = profile.toObject();
    return res.status(200).json(safeProfile);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This email is already registered.' });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await UserProfile.find().sort({ createdAt: -1 });
    return res.json(profiles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/predict', (req, res) => {
  const inputData = req.body;
  const targetSkill = inputData.target_skill || inputData.skill || 'Machine Learning';

  const pythonProcess = spawn('python', ['predict.py', JSON.stringify(inputData)], { 
    cwd: __dirname,
    maxBuffer: 1024 * 1024 * 10
  });

  let result = '';
  let errorOutput = '';

  pythonProcess.stdout.on('data', (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('Python error:', errorOutput);
      return res.status(500).json({ error: 'Prediction failed', details: errorOutput });
    }
    try {
      const prediction = JSON.parse(result);
      const studyEfficiency =
        prediction.study_efficiency || inputData.study_efficiency || inputData.studyEfficiency || 70;
      const burnoutRisk = prediction.burnout_risk || inputData.burnout_risk || inputData.burnoutRisk || 50;
      const motivation =
        inputData.Motivation || inputData.motivation || prediction.Motivation || prediction.motivation || 50;
      const stress =
        prediction.stress ?? inputData.stress ?? inputData.stress_level ?? inputData.stressLevel ?? 50;
      const weeklyWorkloadHours =
        parseWeeklyWorkload(inputData.weeklyWorkload || inputData.weekly_workload) ||
        inputData.Study_Hours_Per_Day * 7 ||
        inputData.studyHoursPerDay * 7 ||
        35;
      const sleepHours =
        inputData.Sleep_Hours_Per_Day ?? inputData.sleepHoursPerDay ?? inputData.SleepHoursPerDay ?? 7;
      const topicDifficulty = getNumericDifficulty(targetSkill);
      const consistency =
        prediction.consistency ?? inputData.consistency ?? inputData.consistency_score ?? 0;
      const difficultyTolerance =
        prediction.difficultyLevel || inputData.difficultyLevel || inputData.difficulty_tolerance || inputData.difficultyTolerance || "Moderate";
      const weeklyLoadMultiplier = getWeeklyLoadMultiplier(burnoutRisk, consistency);
      const cognitiveLoadScore = computeCognitiveLoadScore(topicDifficulty, weeklyWorkloadHours, stress, sleepHours);
      const cognitiveLoadLevel = getCognitiveLoadLevel(cognitiveLoadScore);
      const adaptiveSequence = buildAdaptiveSequence(targetSkill, cognitiveLoadLevel, burnoutRisk, consistency, difficultyTolerance);
      const roadmap = buildSkillRoadmap(
        targetSkill,
        studyEfficiency,
        burnoutRisk,
        motivation,
        cognitiveLoadLevel,
        weeklyLoadMultiplier,
        difficultyTolerance,
        consistency
      );
      const totalRoadmapHours = roadmap.reduce((sum, step) => sum + step.estimated_hours, 0);
      prediction.learning_sequence = { weeks: adaptiveSequence };
      prediction.adaptive_sequence = adaptiveSequence;
      // Provide a concise trigger label for frontend banners and debugging
      let adaptiveTrigger = "none";
      if (burnoutRisk > 60 || cognitiveLoadLevel === "High") {
        adaptiveTrigger = "burnout";
      } else if (consistency > 80) {
        adaptiveTrigger = "consistency";
      } else if (difficultyTolerance === "Low") {
        adaptiveTrigger = "tolerance_low";
      }

      prediction.adaptive_summary = burnoutRisk > 60
        ? "Reduced weekly load, extended timeline, and built-in revision days to protect your recovery."
        : consistency > 80
        ? "High consistency detected: accelerated pacing with stronger progress."
        : "Balanced adaptive roadmap with steady effort, review, and recovery built in.";
      prediction.adaptive_trigger = adaptiveTrigger;
      prediction.cognitive_load_score = cognitiveLoadScore;
      prediction.cognitive_load_level = cognitiveLoadLevel;
      prediction.cognitive_load = cognitiveLoadLevel;
      prediction.weekly_load_multiplier = weeklyLoadMultiplier;
      prediction.difficulty_tolerance = difficultyTolerance;
      prediction.roadmap = roadmap;
      prediction.total_roadmap_hours = totalRoadmapHours;
      prediction.effortHours = totalRoadmapHours;
      res.json(prediction);
    } catch (err) {
      console.error('Parse error:', err);
      res.status(500).json({ error: 'Failed to parse prediction result', details: result });
    }
  });
});

app.get('/api/sequence/:skill', (req, res) => {
  const { skill } = req.params;
  const sequence = getLearningSequence(skill);
  res.json({ weeks: sequence });
});

// New endpoints for dynamic skill configuration
app.get('/api/skills', (req, res) => {
  const skills = Object.keys(SKILL_SEQUENCE_GROUPS);
  res.json({ skills });
});

app.get('/api/skills-config', (req, res) => {
  res.json({
    difficulty: SKILL_DIFFICULTY,
    baseHours: SKILL_BASE_HOURS,
    difficultyMultiplier: DIFFICULTY_MULTIPLIER,
    skillGraph: SKILL_GRAPH,
    sequenceGroups: SKILL_SEQUENCE_GROUPS,
    availableSkills: Object.keys(SKILL_SEQUENCE_GROUPS),
  });
});

app.get('/api/navigation-items', (req, res) => {
  const navigationItems = [
    { text: "Dashboard", to: "/dashboard", icon: "FaTachometerAlt" },
    { text: "Learning Path", to: "/learning-path", icon: "FaBook" },
    { text: "Analytics", to: "/analytics", icon: "FaChartLine" },
    { text: "Achievements", to: "/achievements", icon: "FaTrophy" },
    { text: "Burnout", to: "/burnout", icon: "FaHeartbeat" },
    { text: "Calendar", to: "/calendar", icon: "FaCalendarAlt" },
    { text: "Profile", to: "/profile", icon: "FaUser" },
    { text: "Timetable", to: "/timetable", icon: "FaClock" },
  ];
  res.json({ items: navigationItems });
});

app.get('/api/sequence-display-config', (req, res) => {
  const config = {
    section: {
      title: "Sequenced Learning Path",
      showSkillLabel: true,
      showProgressBar: true,
      showMoveButtons: true,
    },
    weekFormat: "Week {index}",
    displayFields: ["weekLabel", "title", "progress"],
    progressCalculation: "adaptive",
    colors: {
      progressBg: "bg-cyan-500/10",
      progressText: "text-cyan-700",
      progressBgDark: "bg-cyan-500/10",
      progressTextDark: "text-cyan-200",
    },
  };
  res.json(config);
});

// Persist learning path steps for a user + skill
app.post('/api/learning-path/save', async (req, res) => {
  try {
    const { email, skill, steps } = req.body;
    if (!email || !skill || !Array.isArray(steps)) {
      return res.status(400).json({ error: 'email, skill and steps[] are required' });
    }
    const user = await UserProfile.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.learning_paths = user.learning_paths || {};
    user.learning_paths[skill] = steps;
    await user.save();
    return res.json({ success: true, learning_paths: user.learning_paths });
  } catch (err) {
    console.error('Failed to save learning path:', err);
    return res.status(500).json({ error: 'Failed to save learning path' });
  }
});

// Retrieve saved learning path for a user and skill
app.get('/api/learning-path/:email/:skill', async (req, res) => {
  try {
    const { email, skill } = req.params;
    const user = await UserProfile.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const steps = (user.learning_paths && user.learning_paths[skill]) || null;
    return res.json({ steps });
  } catch (err) {
    console.error('Failed to load learning path:', err);
    return res.status(500).json({ error: 'Failed to load learning path' });
  }
});

if (process.argv[1] === __filename) {
  connectDatabase();
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Export functions for unit testing
export { buildAdaptiveSequence, getWeeklyLoadMultiplier, insertRevisionDays, app };
