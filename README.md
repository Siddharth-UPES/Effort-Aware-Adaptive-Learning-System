# Effort-Aware Adaptive Learning System

![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen?logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind_CSS-blue?logo=tailwindcss)

---

![Project Banner](https://via.placeholder.com/1200x360.png?text=Effort-Aware+Adaptive+Learning+System)

## Project Summary

Effort-Aware Adaptive Learning System is a modern student productivity platform designed to enhance learning through data-driven recommendations. It supports user onboarding, adaptive study planning, progress analytics, and burnout risk tracking.

The system delivers a professional learning experience by combining:
- clean React UI built with Vite and Tailwind CSS
- a robust Node.js backend with Express and MongoDB
- predictive analytics and streak management

## Why This Project Stands Out

- Improves student focus with personalized learning insights
- Tracks consistency using login streaks and achievement badges
- Detects burnout risk and suggests balanced study habits
- Provides a complete dashboard for goals, performance, and schedule planning

## Core Capabilities

- ✅ Email/password signup and secure login
- ✅ Onboarding assessment to personalize the user profile
- ✅ Dashboard with effort, focus, burnout, and progress metrics
- ✅ Adaptive learning path and timetable builder
- ✅ Achievement system for streaks and habit tracking
- ✅ Predictive endpoint for model-based recommendations

## Screenshot Preview

![Dashboard Preview](https://via.placeholder.com/1000x500.png?text=Dashboard+Preview)

## Repository Structure

```text
EffortAwareAdaptiveLearningSystem/
├── backend/                # API server, database models, authentication
├── frontend/               # React UI, pages, components, services
├── model/                  # Prediction assets and ML resources
├── README.md               # Project documentation
├── QUICK_START.md          # Developer setup guide
└── PROJECT_DOCUMENTATION.txt # Design and architecture notes
```

## Tech Stack

- **Frontend:** React, Vite, React Router, Tailwind CSS, Axios
- **Backend:** Node.js, Express, MongoDB, Mongoose, bcrypt
- **Data & Prediction:** Local storage helpers, ML-powered prediction pipeline

## Quick Setup

### Backend

```bash
cd backend
npm install
```

Create `backend/.env` with:

```env
MONGODB_URI=mongodb://localhost:27017/eaals
PORT=5000
```

Launch the backend:

```bash
node index.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the app in your browser at `http://localhost:5173`.

## Usage Workflow

1. **Sign up** with name, email, and password.
2. **Complete onboarding** to set profile values and assessment details.
3. **Access the dashboard** to review predictions and progress.
4. **Track streaks** and unlock achievement badges.
5. **Use learning path and timetable pages** to plan study sessions.

## Routes and Pages

- `/` — Login
- `/signup` — Signup
- `/onboarding` — Initial assessment
- `/dashboard` — Main dashboard
- `/analytics` — Performance analytics
- `/achievements` — Badges and streak tracking
- `/learning-path` — Adaptive learning plan
- `/timetable` — Daily schedule planner
- `/profile` — Profile management

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Authenticate user |
| PUT | `/api/profile` | Update user profile and onboarding data |
| POST | `/api/predict` | Generate prediction results |

## Professional Notes

- Users who complete onboarding are redirected directly to the dashboard.
- Streak tracking is stored per user in browser local storage.
- The backend uses a flexible profile update endpoint for both onboarding and later profile changes.

## Deployment & Git

To publish this repository to GitHub:

```bash
git init
git add .
git commit -m "Add professional README"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

## Next Enhancements

- Replace placeholder images with real app screenshots
- Add production deployment instructions
- Add automated tests for backend routes and frontend pages
- Improve UI responsiveness and accessibility

---

## Contact

For mentoring or review, highlight the adaptive learning workflow, analytics pages, and the combined frontend/backend architecture. This project is ready for further improvements in UX, prediction quality, and deployment.
