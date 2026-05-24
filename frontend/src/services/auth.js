const STORAGE_KEY = "effort-ai-user";
const TOKEN_KEY = "access_token";
const LOGIN_HISTORY_KEY = "login-history";
const LOGIN_HISTORY_KEY_PREFIX = "login-history:";

function normalizeUserEmail(user) {
  if (!user || typeof user !== "object") return null;
  const email =
    user?.email ||
    user?.Email ||
    user?.user?.email ||
    user?.user?.Email ||
    user?.payload?.email ||
    user?.payload?.Email;
  if (!email || typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

function getLoginHistoryKey(user) {
  const effectiveUser = user || loadUser();
  const email = normalizeUserEmail(effectiveUser);
  if (!email) return LOGIN_HISTORY_KEY;
  return `${LOGIN_HISTORY_KEY_PREFIX}${email}`;
}

export function saveUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function loadUser() {
  const value = localStorage.getItem(STORAGE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function loadToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("rememberedEmail");
}

export function getBurnoutRisk(user, predictions) {
  const rawRisk = predictions?.burnout_risk ?? predictions?.burnoutRisk ?? user?.abandonRisk ?? user?.burnout_risk ?? user?.burnoutRisk ?? 48;
  return Math.round(Number(rawRisk) || 0) || 0;
}

export function getBurnoutLevel(burnoutRisk) {
  if (burnoutRisk >= 60) return "High";
  if (burnoutRisk >= 30) return "Medium";
  return "Low";
}

// Login Streak Tracking Functions
export function recordLogin(user) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const loginKey = getLoginHistoryKey(user);
  let loginHistory = [];
  
  const stored = localStorage.getItem(loginKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        loginHistory = parsed;
      }
    } catch {
      loginHistory = [];
    }
  }
  
  // Only record if not already recorded today
  if (!loginHistory.includes(today)) {
    loginHistory.push(today);
    localStorage.setItem(loginKey, JSON.stringify(loginHistory));
  }
  
  return calculateLoginStreak(user);
}

export function calculateLoginStreak(user) {
  const loginKey = getLoginHistoryKey(user);
  const stored = localStorage.getItem(loginKey);
  if (!stored) return 0;
  
  let loginHistory = [];
  try {
    loginHistory = JSON.parse(stored);
  } catch {
    return 0;
  }
  
  if (loginHistory.length === 0) return 0;
  
  const normalizedDates = Array.from(
    new Set(
      loginHistory
        .map((dateStr) => {
          const date = new Date(dateStr);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
        .filter(Boolean)
    )
  ).sort((a, b) => b - a);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  for (const timestamp of normalizedDates) {
    const loginDate = new Date(timestamp);
    
    const dayDiff = Math.floor((currentDate - loginDate) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0 || dayDiff === 1) {
      streak++;
      currentDate = new Date(loginDate);
    } else {
      break;
    }
  }
  
  return streak;
}

export function calculateLoginLongestStreak(user) {
  const loginKey = getLoginHistoryKey(user);
  const stored = localStorage.getItem(loginKey);
  if (!stored) return 0;
  
  let loginHistory = [];
  try {
    loginHistory = JSON.parse(stored);
  } catch {
    return 0;
  }
  
  const normalized = loginHistory
    .map((dateStr) => {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .filter(Boolean);
  
  const uniqueDates = Array.from(new Set(normalized)).sort((a, b) => a - b);
  if (uniqueDates.length === 0) return 0;
  
  let longest = 1;
  let current = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    if (uniqueDates[i] - uniqueDates[i - 1] === 1000 * 60 * 60 * 24) {
      current += 1;
    } else {
      current = 1;
    }
    if (current > longest) {
      longest = current;
    }
  }
  
  return longest;
}

export function getLoginHistory(user) {
  const loginKey = getLoginHistoryKey(user);
  const stored = localStorage.getItem(loginKey);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}
