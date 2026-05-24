from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
from pathlib import Path
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from dotenv import load_dotenv
import sys
import traceback

load_dotenv()

app = FastAPI(title="EffortAware Adaptive Learning System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/effortaware")
client = AsyncIOMotorClient(MONGODB_URI)
db = client.effortaware
users_collection = db.users

# Password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ML Models - will be loaded on startup
models = {}

# Skill dependency graph for learning sequence generation
SKILL_GRAPH = {
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
        "prerequisites": [
            "Machine Learning"
        ]
    },
    "Python Basics": {
        "prerequisites": []
    },
    "NumPy": {
        "prerequisites": ["Python Basics"]
    },
    "Pandas": {
        "prerequisites": ["Python Basics", "NumPy"]
    },
    "Statistics": {
        "prerequisites": ["Python Basics"]
    },
    "Linear Algebra": {
        "prerequisites": ["Python Basics"]
    }
}

SKILL_SEQUENCE_GROUPS = {
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
}

def get_learning_sequence(skill: str) -> Dict[str, Any]:
    skill_info = SKILL_GRAPH.get(skill, {})
    prerequisites = skill_info.get("prerequisites", [])

    if skill in SKILL_SEQUENCE_GROUPS:
        weeks = [
            {"week": idx + 1, "title": " + ".join(group)}
            for idx, group in enumerate(SKILL_SEQUENCE_GROUPS[skill])
        ]
        return {
            "skill": skill,
            "prerequisites": prerequisites,
            "weeks": weeks,
        }

    if not prerequisites:
        return {
            "skill": skill,
            "prerequisites": [],
            "weeks": [{"week": 1, "title": skill}],
        }

    sequence = prerequisites + [skill]
    weeks = [{"week": idx + 1, "title": title} for idx, title in enumerate(sequence)]

    return {
        "skill": skill,
        "prerequisites": prerequisites,
        "weeks": weeks,
    }

# Pydantic models for request/response
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "Learner"
    needsAssessment: bool = False

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PredictionRequest(BaseModel):
    Attendance: float
    Study_Hours_Per_Day: float
    stress_level: float
    Motivation: float
    Sleep_Hours_Per_Day: float
    Physical_Activity_Hours_Per_Day: float
    sleep_quality: Optional[float] = None
    anxiety_level: Optional[float] = None
    depression: Optional[float] = None
    pressure: Optional[float] = None
    Social_Hours_Per_Day: Optional[float] = None
    OnlineCourses: Optional[float] = None
    GPA: Optional[float] = None
    burnout_risk: Optional[float] = 0
    completed_tasks: Optional[int] = 0
    total_tasks: Optional[int] = 1
    delayed_tasks: Optional[int] = 0

    class Config:
        extra = "allow"

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    Attendance: Optional[float] = None
    Motivation: Optional[float] = None
    Study_Hours_Per_Day: Optional[float] = None
    Sleep_Hours_Per_Day: Optional[float] = None
    Extracurricular_Hours_Per_Day: Optional[float] = None
    Physical_Activity_Hours_Per_Day: Optional[float] = None
    stress_level: Optional[float] = None
    anxiety_level: Optional[float] = None
    depression: Optional[float] = None
    self_esteem: Optional[float] = None
    distraction: Optional[float] = None
    pressure: Optional[float] = None
    OnlineCourses: Optional[float] = None
    GPA: Optional[float] = None
    needsAssessment: Optional[bool] = None

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(authorization: Optional[str] = Header(None)):
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user = await users_collection.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user

# Load ML models on startup
@app.on_event("startup")
async def load_models():
    global models
    model_dir = Path("model")

    try:
        import pandas as pd
        import numpy as np
        import joblib

        models['pd'] = pd
        models['np'] = np
        models['joblib'] = joblib

        # Load preprocessing objects
        models['scaler_cluster'] = joblib.load(model_dir / "scaler_cluster.pkl")
        models['pca'] = joblib.load(model_dir / "pca.pkl")
        models['kmeans'] = joblib.load(model_dir / "kmeans.pkl")

        # Load ML models
        models['effort_model'] = joblib.load(model_dir / "effort_model.pkl")
        models['burnout_model'] = joblib.load(model_dir / "burnout_model.pkl")

        # Load mappings
        models['cluster_map'] = joblib.load(model_dir / "cluster_map.pkl")

        # Load feature lists and other data
        models['features_effort'] = [
            "Attendance", "Motivation", "OnlineCourses", "Sleep_Hours_Per_Day",
            "engagement_score", "stress_level", "Cluster", "study_efficiency", "lifestyle_balance"
        ]

        models['features_burnout'] = [
            "depression", "anxiety_level", "stress_level", "sleep_quality",
            "Physical_Activity_Hours_Per_Day", "Study_Hours_Per_Day", "workload_index", "Cluster"
        ]

        print("ML models loaded successfully")

    except Exception as e:
        print(f"Error loading models: {e}")
        # Continue without models - API will handle gracefully

# ML Pipeline function (adapted from user's code)
def student_pipeline(input_data):
    try:
        pd = models.get('pd') or __import__('pandas')
        np = models.get('np') or __import__('numpy')
    except Exception:
        raise HTTPException(status_code=500, detail="Required ML libraries are not installed")

    try:
        # Create input dataframe
        input_df = pd.DataFrame([input_data])

        # Add workload_index with default if missing
        if 'workload_index' not in input_df.columns:
            input_df['workload_index'] = 5

        # Add missing columns with defaults
        default_columns = [
            'Resources', 'Internet', 'Gender', 'Age', 'LearningStyle', 'OnlineCourses',
            'Discussions', 'AssignmentCompletion', 'EduTech', 'anxiety_level', 'self_esteem',
            'mental_health_history', 'depression', 'sleep_quality', 'living_conditions',
            'study_load', 'teacher_student_relationship', 'future_career_concerns',
            'social_support', 'peer_pressure', 'bullying', 'Extracurricular_Hours_Per_Day',
            'Social_Hours_Per_Day', 'GPA', 'engagement_score'
        ]

        for col in default_columns:
            if col not in input_df.columns:
                if col in ['OnlineCourses', 'engagement_score']:
                    input_df[col] = 10  # reasonable defaults
                elif col in ['GPA']:
                    input_df[col] = 3.0
                else:
                    input_df[col] = 0

        # Ensure all required columns exist using the scaler feature names
        feature_columns = list(models['scaler_cluster'].feature_names_in_)
        input_df = input_df.reindex(columns=feature_columns, fill_value=0)

        # Handle NaN values more robustly
        input_df = input_df.fillna(0)
        input_df = input_df.replace([np.inf, -np.inf], 0)

        # Convert all columns to numeric and handle any remaining NaN
        for col in input_df.columns:
            input_df[col] = pd.to_numeric(input_df[col], errors='coerce').fillna(0)

        # Check conversion and NaN status before PCA
        input_for_scaler = input_df[feature_columns]

        # PCA + Clustering
        scaled = models['scaler_cluster'].transform(input_for_scaler.values)
        pca_input = models['pca'].transform(scaled)

        cluster = int(models['kmeans'].predict(pca_input)[0])
        input_df["Cluster"] = cluster

        # Feature Engineering
        stress_raw = float(input_df["stress_level"].iloc[0]) if "stress_level" in input_df else 50.0
        study_hours = float(input_df["Study_Hours_Per_Day"].iloc[0]) if "Study_Hours_Per_Day" in input_df else 4.0
        sleep_hours = float(input_df["Sleep_Hours_Per_Day"].iloc[0]) if "Sleep_Hours_Per_Day" in input_df else 7.0
        physical_activity = float(input_df["Physical_Activity_Hours_Per_Day"].iloc[0]) if "Physical_Activity_Hours_Per_Day" in input_df else 1.0
        social_hours = float(input_df.get("Social_Hours_Per_Day", pd.Series([0])).iloc[0]) if "Social_Hours_Per_Day" in input_df else 0.0

        stress_norm = min(1.0, stress_raw / 5.0) if stress_raw <= 5 else min(1.0, stress_raw / 100.0)
        study_norm = min(1.0, study_hours / 10.0)

        anxiety_value = float(input_df.get('anxiety_level', pd.Series([0])).iloc[0] or 0)
        depression_value = float(input_df.get('depression', pd.Series([0])).iloc[0] or 0)
        pressure_value = float(input_df.get('pressure', pd.Series([0])).iloc[0] or 0)
        workload_value = float(input_df.get('workload_index', pd.Series([5])).iloc[0] or 5)  # Default to 5
        academic_burden = float(input_data.get('academicBurdenLevel', input_data.get('academic_burden_level', 0)) or 0)

        anxiety_norm = min(1.0, anxiety_value / 100.0)
        depression_norm = min(1.0, depression_value / 100.0)
        pressure_norm = min(1.0, pressure_value / 100.0)
        workload_norm = min(1.0, workload_value / 10.0)
        academic_burden = min(1.0, academic_burden / 10.0)

        # Improved study efficiency calculation
        if study_hours <= 2:
            study_efficiency = int(min(100, max(20, study_hours * 15 + (1 - stress_norm) * 30)))
        elif study_hours <= 4:
            study_efficiency = int(min(100, max(30, study_hours * 12 + (1 - stress_norm) * 40)))
        elif study_hours <= 6:
            study_efficiency = int(min(100, max(40, study_hours * 10 + (1 - stress_norm) * 45)))
        elif study_hours <= 8:
            study_efficiency = int(min(100, max(50, study_hours * 8 + (1 - stress_norm) * 50)))
        else:
            study_efficiency = int(min(100, max(60, study_hours * 6 + (1 - stress_norm) * 55)))

        # Cap efficiency based on sleep quality and physical activity
        sleep_efficiency_penalty = max(0, (8 - sleep_hours) * 5) if sleep_hours < 8 else 0
        activity_efficiency_bonus = min(15, physical_activity * 3)
        study_efficiency = max(10, min(100, study_efficiency - sleep_efficiency_penalty + activity_efficiency_bonus))

        lifestyle_balance = int(min(100, max(0, ((min(sleep_hours, 8.0) / 8.0) * 0.45 + (min(physical_activity, 3.0) / 3.0) * 0.35 + ((5.0 - min(social_hours, 5.0)) / 5.0) * 0.20) * 100)))

        input_df["study_efficiency"] = study_efficiency
        input_df["lifestyle_balance"] = lifestyle_balance

        # Effort Prediction (baseline model output is kept for context,
        # but final predicted hours are computed with a more stable workload-driven formula)
        effort_input = input_df.reindex(columns=models['features_effort'], fill_value=0)
        effort_input = effort_input.fillna(0).replace([np.inf, -np.inf], 0)
        effort = float(models['effort_model'].predict(effort_input.values)[0])
        effort = max(effort, 4.0)

        # Burnout Prediction
        try:
            burnout_input = input_df.reindex(columns=models['features_burnout'], fill_value=0)
            burnout_input = burnout_input.fillna(0).replace([np.inf, -np.inf], 0)
            burnout_proba = models['burnout_model'].predict_proba(burnout_input.values)[0]
            burnout_category = int(np.argmax(burnout_proba))
            burnout_level = "High" if burnout_category == 2 else "Medium" if burnout_category == 1 else "Low"
            burnout_model_risk = float(np.dot(burnout_proba, [20, 50, 85]))
        except Exception as e:
            print(f"Burnout model failed: {e}", file=sys.stderr)
            burnout_model_risk = 50  # default
            burnout_level = "Medium"

        # Improved burnout risk calculation with better weighting
        burnout_heuristic = (
            min(1.0, stress_norm * 0.35)
            + min(1.0, anxiety_norm * 0.20)
            + min(1.0, depression_norm * 0.18)
            + min(1.0, pressure_norm * 0.15)
            + min(1.0, study_norm * 0.25)
            + min(1.0, academic_burden * 0.08)
            + min(1.0, max(0.0, (8.0 - sleep_hours) / 4.0) * 0.15)
            + min(1.0, social_hours / 8.0 * 0.10)
            - max(0, (physical_activity - 1) / 3.0 * 0.05)
        ) * 100.0

        burnout_floor = max(
            burnout_model_risk,
            burnout_heuristic,
            stress_norm * 88.0,
            pressure_norm * 75.0,
            workload_norm * 70.0,
            study_norm * 72.0
        )

        burnout_risk = int(min(100, max(0, 0.70 * burnout_model_risk + 0.20 * burnout_heuristic + 0.10 * burnout_floor)))

        # Minimum thresholds based on input severity
        if stress_raw >= 70 or anxiety_norm >= 0.7 or depression_norm >= 0.6:
            burnout_risk = max(burnout_risk, 75)
        elif stress_raw >= 50 or anxiety_norm >= 0.5 or depression_norm >= 0.4:
            burnout_risk = max(burnout_risk, 55)
        elif study_hours >= 8:
            burnout_risk = max(burnout_risk, 65)
        elif study_hours >= 6:
            burnout_risk = max(burnout_risk, 45)

        # Additional factors for high-risk scenarios
        # Sleep deprivation penalty (severe impact)
        if sleep_hours <= 5:
            burnout_risk = min(100, burnout_risk + 20)
        elif sleep_hours <= 6:
            burnout_risk = min(100, burnout_risk + 15)
        elif sleep_hours <= 6.5:
            burnout_risk = min(100, burnout_risk + 10)
        
        # Low physical activity (worsens burnout)
        if physical_activity < 0.5:
            burnout_risk = min(100, burnout_risk + 12)
        elif physical_activity < 1.0:
            burnout_risk = min(100, burnout_risk + 5)
        
        # Combined high pressure and low efficiency
        if pressure_norm >= 0.7 and study_efficiency < 50:
            burnout_risk = min(100, burnout_risk + 10)

        if burnout_risk < 30:
            burnout_level = "Low"
        elif burnout_risk < 60:
            burnout_level = "Medium"
        else:
            burnout_level = "High"

        activity_boost = min(1.0, physical_activity / 3.0)
        
        # Improved effort calculation for realistic predictions
        base_hours = 8.0 + (study_hours * 3.5)  # Higher base and multiplier
        
        # Stress and mental health penalties (significantly increased impact)
        stress_penalty = stress_norm * 12.0
        anxiety_penalty = anxiety_norm * 10.0
        depression_penalty = depression_norm * 8.0
        pressure_penalty = pressure_norm * 8.0
        
        # Recovery factors (improved sleep and exercise impact)
        if sleep_hours >= 8:
            sleep_bonus = 2.0
        elif sleep_hours >= 7:
            sleep_bonus = 1.0
        elif sleep_hours >= 6:
            sleep_bonus = 0.5
        else:
            sleep_bonus = 0.0
        
        activity_bonus = min(3.0, physical_activity * 1.5)  # Reduced bonus to show more effort
        
        # Efficiency adjustment based on study efficiency
        efficiency_factor = study_efficiency / 100.0
        efficiency_adjustment = (1 - efficiency_factor) * 12.0
        
        predicted_hours = base_hours + stress_penalty + anxiety_penalty + depression_penalty + pressure_penalty
        predicted_hours += efficiency_adjustment
        predicted_hours -= sleep_bonus
        predicted_hours -= activity_bonus
        
        # Social media and academic burden factors (increased)
        social_penalty = social_hours * 0.8
        academic_penalty = academic_burden * 4.0
        predicted_hours += social_penalty + academic_penalty

        predicted_hours = round(max(20.0, min(120.0, predicted_hours)), 1)

        # Adjust based on stress and mental health
        if stress_norm >= 0.8 or anxiety_norm >= 0.8 or depression_norm >= 0.7:
            predicted_hours = max(predicted_hours, 50.0)
        elif stress_norm >= 0.7 or anxiety_norm >= 0.7 or depression_norm >= 0.6:
            predicted_hours = max(predicted_hours, 45.0)
        elif stress_norm >= 0.5 or anxiety_norm >= 0.5:
            predicted_hours = max(predicted_hours, 35.0)
        
        # For high study loads with poor conditions, ensure much higher effort
        if study_hours >= 8 and (stress_norm >= 0.7 or anxiety_norm >= 0.7):
            predicted_hours = max(predicted_hours, 55.0)
        elif study_hours >= 8:
            predicted_hours = max(predicted_hours, 48.0)
        elif study_hours >= 6 and stress_norm >= 0.6:
            predicted_hours = max(predicted_hours, 40.0)

        study_per_day = max(study_hours, 0.1)
        days = round(predicted_hours / study_per_day, 2)

        if predicted_hours < 15:
            completion_time = "2-3 Days"
        elif predicted_hours < 30:
            completion_time = "3-5 Days"
        elif predicted_hours < 60:
            completion_time = "1-2 Weeks"
        elif predicted_hours < 100:
            completion_time = "2-3 Weeks"
        else:
            completion_time = "3+ Weeks"

        # Generate roadmap
        roadmap = generate_roadmap(predicted_hours, days, cluster, burnout_risk)

        # Workload monitoring
        completed_tasks = input_data.get("completed_tasks", 0)
        total_tasks = input_data.get("total_tasks", 1)
        delayed_tasks = input_data.get("delayed_tasks", 0)

        monitoring = workload_monitor(
            completed_tasks, total_tasks, delayed_tasks, cluster, burnout_risk
        )

        focus_score = int(max(0, min(100, ((1 - stress_norm) * 40 + (min(sleep_hours, 8.0) / 8.0) * 30 + (1 - min(1.0, float(input_data.get("pressure", 50)) / 100.0)) * 30))))
        pressure_level = float(input_data.get("pressure", 50))
        load_score = int(max(0, min(100, (study_hours * 10 + (pressure_level / 100.0) * 40) / 1.4)))
        confidence = int(min(100, max(0, float(input_data.get("confidence", input_data.get("self_esteem", 60) or 60)))))

        actual_study_hours = float(input_data.get("actual_study_hours", 0) or 0)

        return {
            "cluster": int(cluster),
            "cluster_label": models['cluster_map'][int(cluster)],
            "required_hours": predicted_hours,
            "predicted_hours": predicted_hours,
            "predicted_effort": predicted_hours,
            "completion_days": days,
            "completion_time": completion_time,
            "effort_level": "High" if predicted_hours > 44.08 else "Medium" if predicted_hours > 29.52 else "Low",
            "burnout_level": burnout_level,
            "burnout_risk": burnout_risk,
            "burnout_confidence": float(np.max(burnout_proba)),
            "recovery_mode": burnout_risk >= 60,
            "study_efficiency": study_efficiency,
            "lifestyle_balance": lifestyle_balance,
            "focus_score": focus_score,
            "load_score": load_score,
            "confidence": confidence,
            "actual_hours": actual_study_hours,
            "actual_vs_predicted": {
                "predicted_hours": predicted_hours,
                "actual_hours": actual_study_hours,
                "variance": round((actual_study_hours - predicted_hours), 2)
            },
            "roadmap": roadmap,
            "workload_status": monitoring,
            "predictive_alert": (
                "Warning: your current path could overload you without better rest and pacing."
                if burnout_risk >= 60 else
                "Caution: maintain balance and avoid last-minute intensity."
                if burnout_risk >= 40 else
                "Good pace. Keep your momentum with consistent recovery."
            )
        }

    except Exception as e:
            print("Prediction error:", str(e))
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
def generate_roadmap(required_hours, days, cluster, burnout_risk=None):
    if days <= 0 or required_hours <= 0:
        return []

    # Burnout adjustment
    if burnout_risk is not None:
        if burnout_risk >= 32:
            required_hours *= 0.80
        elif burnout_risk >= 26:
            required_hours *= 0.92
        else:
            required_hours *= 1.03

    # Cluster-based module distribution
    if cluster == 0:
        modules = [("Basics", 0.10), ("Core Concepts", 0.35),
                   ("Practice", 0.30), ("Revision", 0.15), ("Assessment", 0.10)]
    elif cluster == 1:
        modules = [("Basics", 0.15), ("Core Concepts", 0.30),
                   ("Practice", 0.25), ("Revision", 0.20), ("Assessment", 0.10)]
    else:
        modules = [("Basics", 0.20), ("Core Concepts", 0.30),
                   ("Practice", 0.20), ("Revision", 0.20), ("Assessment", 0.10)]

    roadmap = []
    hours_per_day = max(1, required_hours / days)

    for module, weight in modules:
        module_hours = required_hours * weight
        module_days = max(1, module_hours / hours_per_day)

        roadmap.append({
            "module": module,
            "hours": round(module_hours, 2),
            "days": round(module_days, 2)
        })

    return roadmap

def workload_monitor(completed, total, delayed, cluster, burnout_risk=None):
    if total == 0:
        return {
            "burden_index": 0,
            "burden_level": "Low",
            "is_overloaded": False,
            "trend": "Stable",
            "recommendation": "No tasks to monitor"
        }

    completion_rate = completed / total
    delay_ratio = delayed / total
    pending_ratio = (total - completed) / total

    burden = (
        0.6 * pending_ratio +
        0.4 * delay_ratio
    )

    if cluster == 0:
        burden *= 1.15
    elif cluster == 2:
        burden *= 0.9

    if burnout_risk is not None:
        burden *= (1 + burnout_risk / 100)

    burden = round(min(burden, 1.0), 2)
    level = "Low" if burden < 0.4 else "Medium" if burden < 0.7 else "High"

    if level == "High":
        recommendation = "Reduce workload or increase rest"
    elif level == "Medium":
        recommendation = "Maintain balance and avoid delays"
    else:
        recommendation = "Workload is manageable"

    is_overloaded = burden > 0.7

    if total > 0 and delayed > 0 and (completed / total) < 0.5:
        trend = "Worsening"
    else:
        trend = "Stable"

    return {
        "burden_index": burden,
        "burden_level": level,
        "is_overloaded": is_overloaded,
        "trend": trend,
        "recommendation": recommendation
    }

# API Routes
@app.get("/")
async def root():
    return {"message": "EffortAware Adaptive Learning System API", "version": "1.0.0"}

@app.post("/api/register", response_model=Dict[str, Any])
async def register(user: UserRegister):
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Hash password
    hashed_password = get_password_hash(user.password)

    # Create user document
    user_doc = {
        "name": user.name,
        "email": user.email,
        "passwordHash": hashed_password,
        "role": user.role,
        "needsAssessment": user.needsAssessment,
        "createdAt": datetime.utcnow(),
        # Default values for ML features
        "Attendance": 75,
        "Motivation": 60,
        "Study_Hours_Per_Day": 6,
        "Sleep_Hours_Per_Day": 7,
        "Extracurricular_Hours_Per_Day": 2,
        "Physical_Activity_Hours_Per_Day": 3,
        "stress_level": 2,
        "anxiety_level": 10,
        "depression": 5,
        "self_esteem": 15,
        "distraction": 40,
        "pressure": 50,
        "OnlineCourses": 5,
        "GPA": 3.0,
        "burnout_risk": 25,
        "focusScore": 60,
        "loadScore": 50,
        "confidence": 60,
    }

    # Insert user
    result = await users_collection.insert_one(user_doc)

    # Return user data (without password)
    user_doc["_id"] = str(result.inserted_id)
    del user_doc["passwordHash"]

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_doc["email"]}, expires_delta=access_token_expires
    )

    return {
        "message": "Registration successful",
        "user": user_doc,
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/api/login", response_model=Dict[str, Any])
async def login(user_credentials: UserLogin):
    user = await users_collection.find_one({"email": user_credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(user_credentials.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )

    # Return user data (without password)
    user_data = {k: v for k, v in user.items() if k != "passwordHash"}
    user_data["_id"] = str(user_data["_id"])

    return {
        "message": "Login successful",
        "user": user_data,
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.put("/api/profile")
async def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    # Update user profile
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}

    if update_data:
        result = await users_collection.update_one(
            {"email": current_user["email"]},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

    # Get updated user
    updated_user = await users_collection.find_one({"email": current_user["email"]})
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user["_id"] = str(updated_user["_id"])
    del updated_user["passwordHash"]

    return {
        "message": "Profile updated successfully",
        "user": updated_user
    }

@app.post("/api/predict")
async def predict(prediction_data: PredictionRequest):
    if not models:
        raise HTTPException(status_code=503, detail="ML models not loaded")

    input_data = prediction_data.dict()
    target_skill = input_data.get("target_skill") or input_data.get("skill") or "Machine Learning"

    result = student_pipeline(input_data)
    result["learning_sequence"] = get_learning_sequence(target_skill)
    return result

@app.get("/api/sequence/{skill}")
async def get_sequence(skill: str):
    return get_learning_sequence(skill)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": bool(models),
        "timestamp": datetime.utcnow()
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)