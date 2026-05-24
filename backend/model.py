import pandas as pd
import numpy as np
import joblib
import warnings
warnings.filterwarnings("ignore")

from sklearn.preprocessing import StandardScaler, label_binarize
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from xgboost import XGBRegressor, XGBClassifier
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, classification_report, roc_auc_score, roc_curve
import matplotlib.pyplot as plt
import seaborn as sns

# Load dataset (assuming it's in the same directory or provide path)
df = pd.read_csv("Dataset/clean_student_dataset.csv")

# Preprocessing
df_model = df.drop(["student_id", "FinalGrade", "ExamScore", "performance_score"], axis=1)

scaler_cluster = StandardScaler()
X_scaled = scaler_cluster.fit_transform(df_model)

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

df["PC1"] = X_pca[:, 0]
df["PC2"] = X_pca[:, 1]

# Clustering
kmeans = KMeans(n_clusters=3, random_state=42)
df["Cluster"] = kmeans.fit_predict(X_pca)

# Effort Target
# Use a more balanced target so total required hours do not grow proportionally with study hours alone.
df["effort_target"] = (
    10.0
    + df["workload_index"] * 2.5
    + df["stress_level"] * 1.3
    + (5.0 - df["sleep_quality"]).clip(lower=0) * 1.5
    + (8.0 - df["Study_Hours_Per_Day"]).clip(lower=0) * 1.2
    + (10.0 - df["Motivation"]).clip(lower=0) * 0.7
)

# Feature Engineering
df["study_efficiency"] = df["Study_Hours_Per_Day"] / (df["stress_level"] + 1)
df["lifestyle_balance"] = (
    df["Sleep_Hours_Per_Day"] + df["Physical_Activity_Hours_Per_Day"] + df["Social_Hours_Per_Day"]
)

# Effort Model Features
features_effort = [
    "Attendance", "Motivation", "OnlineCourses", "Sleep_Hours_Per_Day",
    "engagement_score", "stress_level", "Cluster", "study_efficiency", "lifestyle_balance"
]
X_effort = df[features_effort]
y_effort = df["effort_target"]

effort_model = Pipeline([
    ("scaler", StandardScaler()),
    ("model", XGBRegressor(n_estimators=300, max_depth=5, learning_rate=0.05, random_state=42))
])

X_train_e, X_test_e, y_train_e, y_test_e = train_test_split(X_effort, y_effort, test_size=0.2, random_state=42, shuffle=True)
effort_model.fit(X_train_e, y_train_e)

# Burnout Model
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
X_b = df[features_burnout]
y_b = df["burnout_target"]

X_train_b, X_test_b, y_train_b, y_test_b = train_test_split(X_b, y_b, test_size=0.2, random_state=42)

burnout_model = Pipeline([
    ("scaler", StandardScaler()),
    ("model", XGBClassifier(n_estimators=300, max_depth=6, learning_rate=0.05, eval_metric="mlogloss", random_state=42))
])

burnout_model.fit(X_train_b, y_train_b)

# Save models
joblib.dump(scaler_cluster, "model/scaler_cluster.pkl")
joblib.dump(pca, "model/pca.pkl")
joblib.dump(kmeans, "model/kmeans.pkl")
joblib.dump(effort_model, "model/effort_model.pkl")
joblib.dump(burnout_model, "model/burnout_model.pkl")

cluster_map = {0: "High Effort", 1: "Medium Effort", 2: "Low Effort"}
joblib.dump(cluster_map, "model/cluster_map.pkl")

# Helper Functions
def generate_roadmap(required_hours, days, cluster, burnout_risk=None):
    if days <= 0 or required_hours <= 0:
        return []

    if burnout_risk is not None:
        if burnout_risk >= 32:
            required_hours *= 0.80
        elif burnout_risk >= 26:
            required_hours *= 0.92
        else:
            required_hours *= 1.03

    if cluster == 0:
        modules = [("Basics", 0.10), ("Core Concepts", 0.35), ("Practice", 0.30), ("Revision", 0.15), ("Assessment", 0.10)]
    elif cluster == 1:
        modules = [("Basics", 0.15), ("Core Concepts", 0.30), ("Practice", 0.25), ("Revision", 0.20), ("Assessment", 0.10)]
    else:
        modules = [("Basics", 0.20), ("Core Concepts", 0.30), ("Practice", 0.20), ("Revision", 0.20), ("Assessment", 0.10)]

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

def calculate_burden_index(completed, total, delayed, cluster, burnout_risk=None):
    if total == 0:
        return 0

    completion_rate = completed / total
    delay_ratio = delayed / total
    pending_ratio = (total - completed) / total

    burden = (0.6 * pending_ratio + 0.4 * delay_ratio)

    if cluster == 0:
        burden *= 1.15
    elif cluster == 2:
        burden *= 0.9

    if burnout_risk is not None:
        burden *= (1 + burnout_risk / 100)

    return round(min(burden, 1.0), 2)

def burden_level(burden):
    if burden < 0.4:
        return "Low"
    elif burden < 0.7:
        return "Medium"
    else:
        return "High"

def workload_monitor(completed, total, delayed, cluster, burnout_risk=None):
    burden = calculate_burden_index(completed, total, delayed, cluster, burnout_risk)
    level = burden_level(burden)
    recommendation = "Reduce workload or increase rest" if level == "High" else "Maintain balance and avoid delays" if level == "Medium" else "Workload is manageable"
    is_overloaded = burden > 0.7
    trend = "Worsening" if total > 0 and delayed > 0 and (completed / total) < 0.5 else "Stable"
    return {
        "burden_index": burden,
        "burden_level": level,
        "is_overloaded": is_overloaded,
        "trend": trend,
        "recommendation": recommendation
    }

def student_pipeline(input_data):
    input_df = pd.DataFrame([input_data])
    input_df = input_df.reindex(columns=df_model.columns, fill_value=0)

    scaled = scaler_cluster.transform(input_df)
    pca_input = pca.transform(scaled)
    input_df["PC1"] = pca_input[:, 0]
    input_df["PC2"] = pca_input[:, 1]

    cluster = int(kmeans.predict(pca_input)[0])
    input_df["Cluster"] = cluster

    input_df["study_efficiency"] = input_df["Study_Hours_Per_Day"] / (input_df["stress_level"] + 1e-5)
    input_df["lifestyle_balance"] = input_df["Sleep_Hours_Per_Day"] + input_df["Physical_Activity_Hours_Per_Day"]

    effort_input = input_df.reindex(columns=features_effort, fill_value=0)
    effort = float(effort_model.predict(effort_input)[0])
    effort = max(effort, 1.0)

    burnout_input = input_df.reindex(columns=features_burnout, fill_value=0)
    burnout_proba = burnout_model.predict_proba(burnout_input)[0]
    burnout = int(np.argmax(burnout_proba))

    burnout_model_risk = float(np.dot(burnout_proba, [20, 50, 85]))
    stress_norm = min(1.0, float(input_df["stress_level"].iloc[0]) / 5.0) if input_df["stress_level"].iloc[0] <= 5 else min(1.0, float(input_df["stress_level"].iloc[0]) / 100.0)
    anxiety_norm = float(input_df["anxiety_level"].iloc[0]) / 100.0
    depression_norm = float(input_df["depression"].iloc[0]) / 100.0
    pressure_norm = float(input_df.get("pressure", pd.Series([50])).iloc[0]) / 100.0
    workload_norm = min(1.0, float(input_df["workload_index"].iloc[0]) / 10.0)

    burnout_heuristic = (
        min(1.0, stress_norm * 0.45)
        + min(1.0, anxiety_norm * 0.18)
        + min(1.0, depression_norm * 0.15)
        + min(1.0, pressure_norm * 0.12)
        + min(1.0, workload_norm * 0.10)
    ) * 100.0

    burnout_floor = max(
        burnout_model_risk,
        burnout_heuristic,
        stress_norm * 88.0,
        pressure_norm * 75.0,
        workload_norm * 70.0
    )
    burnout_risk = int(min(100, max(0, 0.70 * burnout_model_risk + 0.20 * burnout_heuristic + 0.10 * burnout_floor)))
    burnout = burnout_category(burnout_risk)

    study_per_day = max(input_data["Study_Hours_Per_Day"], 0.1)
    days = effort / study_per_day

    roadmap = generate_roadmap(effort, days, cluster, burnout_risk)

    completed_tasks = input_data.get("completed_tasks", 0)
    total_tasks = input_data.get("total_tasks", 1)
    delayed_tasks = input_data.get("delayed_tasks", 0)

    monitoring = workload_monitor(completed_tasks, total_tasks, delayed_tasks, cluster, burnout_risk)

    cluster_map_loaded = joblib.load("model/cluster_map.pkl")

    return {
        "cluster": int(cluster),
        "cluster_label": cluster_map_loaded[int(cluster)],
        "required_hours": float(effort),
        "completion_days": float(days),
        "burnout_category": int(burnout),
        "burnout_risk": int(burnout_risk),
        "burnout_confidence": float(np.max(burnout_proba)) if burnout_proba.size > 0 else 0.0,
        "roadmap": roadmap,
        "workload_status": monitoring
    }

if __name__ == "__main__":
    import sys
    import json
    try:
        with open('temp_input.json', 'r') as f:
            input_data = json.load(f)
    except FileNotFoundError:
        # Fallback to command line if temp file doesn't exist
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
        else:
            with open('test_input.json', 'r') as f:
                input_data = json.load(f)
    result = student_pipeline(input_data)
    print(json.dumps(result))
