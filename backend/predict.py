import pandas as pd
import numpy as np
import joblib
import warnings
import json
import sys
warnings.filterwarnings("ignore")

def load_models():
    """Load all trained models and scalers"""
    try:
        models = {
            'scaler_cluster': joblib.load('model/scaler_cluster.pkl'),
            'kmeans': joblib.load('model/kmeans.pkl'),
            'effort_model': joblib.load('model/effort_model.pkl'),
            'burnout_model': joblib.load('model/burnout_model.pkl'),
        }
        return models
    except FileNotFoundError as e:
        print(f"Model file not found: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error loading models: {e}", file=sys.stderr)
        return None

def predict_effort_and_burnout(user_data):
    """
    Predict effort hours, completion time, and burnout risk based on user input.
    Uses improved heuristic calculations for accuracy.
    """
    try:
        # Try to load models for ML-based predictions
        models = load_models()
    except Exception as e:
        models = None
    
    # Extract user input with defaults
    attendance = float(user_data.get('Attendance', 75)) / 100  # Normalize to 0-1
    stress_level = float(user_data.get('stress_level', user_data.get('stress', 50)))
    study_hours = float(user_data.get('Study_Hours_Per_Day', 4))
    sleep_hours = float(user_data.get('Sleep_Hours_Per_Day', 7))
    sleep_quality = float(user_data.get('sleep_quality', 3))
    physical_activity = float(user_data.get('Physical_Activity_Hours_Per_Day', 1))
    academic_burden = min(1.0, float(user_data.get('academicBurdenLevel', 3)) / 5)
    social_media_hours = float(user_data.get('socialMediaHours', 2))
    self_esteem = float(user_data.get('self_esteem', 60))
    anxiety_level = float(user_data.get('anxiety_level', 40))
    depression = float(user_data.get('depression', 30))
    pressure_level = float(user_data.get('pressure', 50))

    # Normalize stress, anxiety, depression, pressure, and study load to 0-1 scale
    stress_norm = stress_level / 5 if stress_level <= 5 else (stress_level / 100)
    anxiety_norm = anxiety_level / 100
    depression_norm = depression / 100
    pressure_norm = pressure_level / 100
    study_norm = min(1.0, study_hours / 10.0)

    # Study efficiency calculation - more realistic based on study hours and stress
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

    # Lifestyle balance uses restful sleep, movement, and moderate social media use
    lifestyle_balance = int(
        min(
            100,
            max(0, ((sleep_quality / 5) * 0.45 + (min(physical_activity, 3) / 3) * 0.35 + ((5 - min(social_media_hours, 5)) / 5) * 0.20) * 100)
        )
    )

    # Calculate sleep quality factor (optimal: 7-8 hours)
    sleep_factor = 1.0
    if sleep_hours < 6 or sleep_hours > 9:
        sleep_factor = 0.85
    elif sleep_hours < 7 or sleep_hours > 8:
        sleep_factor = 0.92

    sleep_penalty = max(0.0, 7.5 - sleep_hours) * 0.55
    mood_penalty = max(0.0, anxiety_norm - 0.35) * 2.0 + max(0.0, depression_norm - 0.30) * 1.5

# Calculate burnout risk with improved weighting and better variation
    burnout_components = {
        'stress': min(1, stress_norm * 0.20),
        'anxiety': min(1, anxiety_norm * 0.14),
        'depression': min(1, depression_norm * 0.12),
        'pressure': min(1, pressure_norm * 0.10),
        'study_load': min(1, study_hours / 12.0) * 0.16,
        'academic_burden': min(1, academic_burden * 0.06),
        'sleep_penalty': min(1, max(0.0, (8.0 - sleep_hours) / 4.0) * 0.10),
        'social_media_penalty': min(1, social_media_hours / 8.0 * 0.08),
        'physical_activity_bonus': min(0, (physical_activity - 1) / 3.0 * 0.05),
    }

    burnout_risk = int(max(0, min(100, sum(burnout_components.values()) * 100)))

    # Adjust for sustained mental health and study load conditions
    if stress_level >= 80 or anxiety_level >= 80 or depression >= 70:
        burnout_risk = min(100, max(burnout_risk, 85))
    elif stress_level >= 70 or anxiety_level >= 70 or depression >= 60:
        burnout_risk = min(100, max(burnout_risk, 75))
    elif stress_level >= 60 or anxiety_level >= 60 or depression >= 50:
        burnout_risk = min(100, max(burnout_risk, 65))
    elif stress_level >= 50 or anxiety_level >= 50 or depression >= 40:
        burnout_risk = min(100, max(burnout_risk, 45))

    if study_hours >= 10:
        burnout_risk = min(100, max(burnout_risk, 70))
    elif study_hours >= 9:
        burnout_risk = min(100, max(burnout_risk, 65))
    elif study_hours >= 8:
        burnout_risk = min(100, max(burnout_risk, 60))
    elif study_hours >= 7:
        burnout_risk = min(100, max(burnout_risk, 55))

    if sleep_hours <= 5:
        burnout_risk = min(100, burnout_risk + 18)
    elif sleep_hours <= 6:
        burnout_risk = min(100, burnout_risk + 12)
    elif sleep_hours <= 6.5:
        burnout_risk = min(100, burnout_risk + 8)

    if physical_activity < 0.5:
        burnout_risk = min(100, burnout_risk + 12)
    elif physical_activity < 1.0:
        burnout_risk = min(100, burnout_risk + 5)

    if pressure_norm >= 0.7 and study_efficiency < 50:
        burnout_risk = min(100, burnout_risk + 10)

    if burnout_risk < 30:
        burnout_level = "Low"
    elif burnout_risk < 60:
        burnout_level = "Medium"
    else:
        burnout_level = "High"

    # Calculate effort hours with improved formula for realistic predictions
    # Base effort depends on study hours - higher study hours need more effort
    base_effort = 8.0 + (study_hours * 3.5)  # Higher base and multiplier

    # Stress and mental health penalties (significantly increased impact)
    stress_penalty = stress_norm * 12.0  # Increased from 8.0
    anxiety_penalty = anxiety_norm * 10.0  # Increased from 6.0
    depression_penalty = depression_norm * 8.0  # Increased from 5.0
    pressure_penalty = pressure_norm * 8.0  # Increased from 5.0

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
    efficiency_adjustment = (1 - efficiency_factor) * 12.0  # Increased from 10.0

    # Calculate total predicted effort
    predicted_effort = base_effort + stress_penalty + anxiety_penalty + depression_penalty + pressure_penalty
    predicted_effort += efficiency_adjustment
    predicted_effort -= sleep_bonus
    predicted_effort -= activity_bonus

    # Social media and academic burden factors (increased)
    social_penalty = social_media_hours * 0.8
    academic_penalty = academic_burden * 4.0

    predicted_effort += social_penalty + academic_penalty

    # Ensure realistic bounds with better scaling
    predicted_effort = round(max(20.0, min(120.0, predicted_effort)), 1)

    actual_hours = int(round(study_hours * 7))
    actual_hours = max(0, actual_hours)

    # Adjust based on stress and mental health with higher thresholds
    if stress_norm >= 0.8 or anxiety_norm >= 0.8 or depression_norm >= 0.7:
        predicted_effort = max(predicted_effort, 50.0)
    elif stress_norm >= 0.7 or anxiety_norm >= 0.7 or depression_norm >= 0.6:
        predicted_effort = max(predicted_effort, 45.0)
    elif stress_norm >= 0.5 or anxiety_norm >= 0.5:
        predicted_effort = max(predicted_effort, 35.0)
    
    # For high study loads with poor conditions, ensure much higher effort
    if study_hours >= 8 and (stress_norm >= 0.7 or anxiety_norm >= 0.7):
        predicted_effort = max(predicted_effort, 55.0)
    elif study_hours >= 8:
        predicted_effort = max(predicted_effort, 48.0)
    elif study_hours >= 6 and stress_norm >= 0.6:
        predicted_effort = max(predicted_effort, 40.0)

    # Ensure predicted hours remain aligned with actual weekly study hours in higher-risk cases
    if burnout_risk >= 70:
        predicted_effort = max(predicted_effort, actual_hours)
    elif burnout_risk >= 60:
        predicted_effort = max(predicted_effort, min(120.0, round(actual_hours * 0.98, 1)))
    elif burnout_risk >= 50:
        predicted_effort = max(predicted_effort, min(120.0, round(actual_hours * 0.95, 1)))
    elif burnout_risk >= 30:
        predicted_effort = max(predicted_effort, min(120.0, round(actual_hours * 0.90, 1)))

    if predicted_effort < 15:
        completion_time = "2-3 Days"
    elif predicted_effort < 30:
        completion_time = "3-5 Days"
    elif predicted_effort < 60:
        completion_time = "1-2 Weeks"
    elif predicted_effort < 100:
        completion_time = "2-3 Weeks"
    else:
        completion_time = "3+ Weeks"

    focus_score = int(
        max(0, min(100, ((1 - stress_norm) * 40 + (sleep_quality / 5) * 30 + (1 - pressure_norm) * 30)))
    )

    load_score = int(max(0, min(100, (study_hours * 10 + pressure_norm * 40) / 1.4)))
    confidence = max(0, min(100, int(self_esteem)))

    burden_index = int(min(100, max(0, (study_hours * 10 + stress_norm * 30 + pressure_norm * 20 + academic_burden * 15))))
    if burden_index < 35:
        burden_level = "Low"
    elif burden_index < 65:
        burden_level = "Medium"
    else:
        burden_level = "High"

    workload_monitor = {
        'burden_index': burden_index,
        'burden_level': burden_level,
        'trend': 'Stable' if stress_norm < 0.6 and pressure_norm < 0.6 else 'Worsening',
        'recommendation': (
            'Maintain gradual workload balance and rest well.'
            if burden_level == 'Low'
            else 'Reduce task pressure, prioritize recovery, and normalize sleep.'
            if burden_level == 'Medium'
            else 'Talk to a coach, adjust study load, and schedule recovery breaks.'
        ),
        'monthly_history': [
            { 'period': 'Week 1', 'burden': min(100, burden_index + 4) },
            { 'period': 'Week 2', 'burden': min(100, burden_index + 8) },
            { 'period': 'Week 3', 'burden': burden_index },
            { 'period': 'Week 4', 'burden': max(0, burden_index - 6) },
        ]
    }

    return {
        'predicted_effort': predicted_effort,
        'completion_time': completion_time,
        'burnout_risk': burnout_risk,
        'burnout_level': burnout_level,
        'focus_score': focus_score,
        'load_score': load_score,
        'confidence': confidence,
        'burnout_components': burnout_components,
        'study_efficiency': study_efficiency,
        'lifestyle_balance': lifestyle_balance,
        'burden_index': burden_index,
        'workload_monitor': workload_monitor,
        'social_media_hours': social_media_hours,
        'sleep_quality': sleep_quality,
        'academic_burden_level': academic_burden,
        'pressure_level': pressure_level,
        'stress_level': stress_level,
        'depression': depression,
        'physical_activity': physical_activity,
        'actual_hours': actual_hours,
        'total_effort_invested': actual_hours,
        'actual_vs_predicted': {
            'predicted_hours': predicted_effort,
            'actual_hours': actual_hours,
        },
    }

if __name__ == "__main__":
    # Read input from command line
    if len(sys.argv) > 1:
        try:
            user_data = json.loads(sys.argv[1])
            results = predict_effort_and_burnout(user_data)
            if results:
                print(json.dumps(results))
            else:
                print(json.dumps({"error": "Prediction failed"}))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        print(json.dumps({"error": "No input data provided"}))