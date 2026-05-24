import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import xgboost as xgb
from pathlib import Path

# Create model directory
model_dir = Path("model")
model_dir.mkdir(exist_ok=True)

# Load dataset
df = pd.read_csv("Dataset/clean_student_dataset.csv")
print(f"Dataset shape: {df.shape}")

# Prepare data for modeling
df_model = df.drop(["student_id", "FinalGrade", "ExamScore", "performance_score"], axis=1)

# StandardScaler for clustering
scaler_cluster = StandardScaler()
X_scaled = scaler_cluster.fit_transform(df_model)

# PCA (85% variance retention)
pca = PCA(n_components=0.85)
X_pca = pca.fit_transform(X_scaled)

print(f"Reduced shape after PCA: {X_pca.shape}")

# K-means clustering
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
df["Cluster"] = kmeans.fit_predict(X_pca)

# Cluster mapping
cluster_map = {
    0: "High Effort",
    1: "Medium Effort",
    2: "Low Effort"
}

# Feature engineering
df["study_efficiency"] = df["Study_Hours_Per_Day"] / (df["stress_level"] + 1)
df["lifestyle_balance"] = (
    df["Sleep_Hours_Per_Day"] +
    df["Physical_Activity_Hours_Per_Day"] +
    df["Social_Hours_Per_Day"]
)

# Effort prediction features and target
features_effort = [
    "Attendance", "Motivation", "OnlineCourses", "Sleep_Hours_Per_Day",
    "engagement_score", "stress_level", "Cluster", "study_efficiency", "lifestyle_balance"
]
X_effort = df[features_effort]

# Create a more balanced effort target that reflects workload, stress, sleep, and study efficiency
df["effort_target"] = (
    10.0
    + df["workload_index"] * 2.5
    + df["stress_level"] * 1.3
    + (5.0 - df["sleep_quality"]).clip(lower=0) * 1.5
    + (8.0 - df["Study_Hours_Per_Day"]).clip(lower=0) * 1.2
    + (10.0 - df["Motivation"]).clip(lower=0) * 0.7
)
y_effort = df["effort_target"]

# Burnout prediction features and target
q1 = df["burnout_risk"].quantile(0.33)
q2 = df["burnout_risk"].quantile(0.66)

def burnout_category(x):
    if x <= q1:
        return 0
    elif x <= q2:
        return 1
    else:
        return 2

df["burnout_target"] = df["burnout_risk"].apply(burnout_category)

features_burnout = [
    "depression", "anxiety_level", "stress_level", "sleep_quality",
    "Physical_Activity_Hours_Per_Day", "Study_Hours_Per_Day", "workload_index", "Cluster"
]
X_burnout = df[features_burnout]
y_burnout = df["burnout_target"]

# Train-test split
X_train_e, X_test_e, y_train_e, y_test_e = train_test_split(
    X_effort, y_effort, test_size=0.2, random_state=42, shuffle=True
)

# For small datasets, don't use stratification
if len(X_burnout) < 50:
    X_train_b, X_test_b, y_train_b, y_test_b = train_test_split(
        X_burnout, y_burnout, test_size=0.2, random_state=42, shuffle=True
    )
else:
    X_train_b, X_test_b, y_train_b, y_test_b = train_test_split(
        X_burnout, y_burnout, test_size=0.2, random_state=42, stratify=y_burnout
    )

# Effort Model (XGBoost Regressor)
effort_model = xgb.XGBRegressor(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    random_state=42
)
effort_model.fit(X_train_e, y_train_e)

# Burnout Model (XGBoost Classifier)
burnout_model = xgb.XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    eval_metric="mlogloss",
    random_state=42
)
burnout_model.fit(X_train_b, y_train_b)

# Save all models and preprocessing objects
print("Saving models...")

joblib.dump(scaler_cluster, model_dir / "scaler_cluster.pkl")
joblib.dump(pca, model_dir / "pca.pkl")
joblib.dump(kmeans, model_dir / "kmeans.pkl")
joblib.dump(effort_model, model_dir / "effort_model.pkl")
joblib.dump(burnout_model, model_dir / "burnout_model.pkl")
joblib.dump(cluster_map, model_dir / "cluster_map.pkl")

print("✅ All models saved successfully!")

# Test prediction
test_input = {
    "Attendance": 75,
    "Study_Hours_Per_Day": 5,
    "stress_level": 1,
    "Motivation": 3,
    "Sleep_Hours_Per_Day": 7,
    "Physical_Activity_Hours_Per_Day": 2,
    "workload_index": 8,
    "burnout_risk": 25
}

print(f"Test input: {test_input}")

# Test the pipeline
try:
    # Simulate the pipeline logic
    input_df = pd.DataFrame([test_input])

    # Add missing columns with defaults
    default_values = {
        'Resources': 80, 'Internet': 1, 'Gender': 1, 'Age': 22, 'LearningStyle': 2,
        'OnlineCourses': 10, 'Discussions': 1, 'AssignmentCompletion': 1, 'EduTech': 1,
        'anxiety_level': 10, 'self_esteem': 15, 'mental_health_history': 0,
        'depression': 5, 'sleep_quality': 3, 'living_conditions': 2, 'study_load': 2,
        'teacher_student_relationship': 3, 'future_career_concerns': 2, 'social_support': 2,
        'peer_pressure': 2, 'bullying': 2, 'Extracurricular_Hours_Per_Day': 2,
        'Social_Hours_Per_Day': 2, 'GPA': 3.0, 'engagement_score': 150
    }

    for col, val in default_values.items():
        if col not in input_df.columns:
            input_df[col] = val

    feature_columns = list(scaler_cluster.feature_names_in_)
    for col in feature_columns:
        if col not in input_df.columns:
            input_df[col] = 0

    # PCA + Clustering
    scaled = scaler_cluster.transform(input_df[feature_columns])
    pca_input = pca.transform(scaled)
    cluster = kmeans.predict(pca_input)[0]
    input_df["Cluster"] = cluster

    # Feature engineering
    input_df["study_efficiency"] = input_df["Study_Hours_Per_Day"] / (input_df["stress_level"] + 1e-5)
    input_df["lifestyle_balance"] = (
        input_df["Sleep_Hours_Per_Day"] +
        input_df["Physical_Activity_Hours_Per_Day"] +
        input_df.get("Social_Hours_Per_Day", 0)
    )

    # Predictions
    effort_input = input_df[features_effort]
    effort = effort_model.predict(effort_input.values)[0]

    burnout_input = input_df[features_burnout]
    burnout_proba = burnout_model.predict_proba(burnout_input.values)[0]

    print(f"✅ Test prediction successful!")
    print(f"Cluster: {cluster} ({cluster_map[cluster]})")
    print(f"Predicted Effort: {effort:.2f} hours")
    print(f"Burnout Probability: {burnout_proba}")

except Exception as e:
    print(f"❌ Test prediction failed: {e}")