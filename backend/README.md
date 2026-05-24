# Effort-Aware Adaptive Learning Backend

## MongoDB Atlas Setup (STEP BY STEP)

### Step 1: Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" and create an account
3. Verify your email

### Step 2: Create a Cluster
1. In MongoDB Atlas, click "Create a Cluster"
2. Choose the FREE tier (M0)
3. Select your region (closest to you)
4. Click "Create Cluster" (takes 2-3 minutes)

### Step 3: Add Database User
1. Go to "Database Access" from left menu
2. Click "Add New Database User"
3. Username: `admin`
4. Password: `YourStrongPassword123!` (remember this!)
5. Built-in Role: `Atlas admin`
6. Click "Add User"

### Step 4: Allow IP Access
1. Go to "Network Access" from left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Confirm

### Step 5: Get Connection String
1. Go to "Clusters" section
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Select "Node.js" driver version 4.1 or later
5. Copy the connection string
6. Should look like: `mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`

### Step 6: Update .env File
1. Open `backend/.env` file
2. Replace the entire MONGODB_URI with your copied URL
3. Replace `password` with your actual database password
4. Replace `myFirstDatabase` with `effort-learning`

Example:
```
MONGODB_URI=mongodb+srv://admin:YourStrongPassword123!@cluster0.abc123.mongodb.net/effort-learning?retryWrites=true&w=majority
PORT=5000
```

## Backend Installation

1. Go to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

You should see:
```
MongoDB connected
Server is running on port 5000
```

## API Endpoints

### 1. **POST /api/register** - Register New User
Stores user login credentials + initial profile data in MongoDB.

**Request Body:**
```json
{
  "name": "Aman Sharma",
  "email": "aman@example.com",
  "password": "SecurePass123",
  "role": "Learner",
  "motivation": 76,
  "distraction": 40,
  "stress": 58,
  "pressure": 65,
  "effortHours": 50,
  "completionTime": "10 Days",
  "weeklyWorkload": "28 hrs/week",
  "totalLearnHours": 110,
  "difficultyLevel": "High",
  "cognitiveLoad": "Above average",
  "abandonRisk": 62,
  "focusScore": 70,
  "loadScore": 84,
  "confidence": 68
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Aman Sharma",
  "email": "aman@example.com",
  "role": "Learner",
  "motivation": 76,
  "distraction": 40,
  "stress": 58,
  "createdAt": "2024-05-09T10:30:00.000Z"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "motivation": 70,
    "stress": 60
  }'
```

---

### 2. **POST /api/login** - Login User
Validates email + password and returns stored profile data.

**Request Body:**
```json
{
  "email": "aman@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Aman Sharma",
    "email": "aman@example.com",
    "role": "Learner",
    "motivation": 76,
    "distraction": 40,
    "stress": 58,
    "createdAt": "2024-05-09T10:30:00.000Z"
  }
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

### 3. **POST /api/profile** - Update Profile
Updates or creates user profile data by email (stores ALL user inputs).

**Request Body:**
```json
{
  "email": "aman@example.com",
  "name": "Aman Sharma Updated",
  "motivation": 80,
  "distraction": 35,
  "stress": 55,
  "pressure": 60,
  "effortHours": 55,
  "completionTime": "9 Days",
  "weeklyWorkload": "30 hrs/week",
  "totalLearnHours": 120,
  "difficultyLevel": "High",
  "cognitiveLoad": "Above average",
  "abandonRisk": 55,
  "focusScore": 75,
  "loadScore": 80,
  "confidence": 72
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "aman@example.com",
  "name": "Aman Sharma Updated",
  "motivation": 80,
  "stress": 55,
  "createdAt": "2024-05-09T10:30:00.000Z"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Updated Name",
    "motivation": 85
  }'
```

---

### 4. **GET /api/profiles** - Get All Profiles
Retrieves all stored user profiles from MongoDB.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Aman Sharma",
    "email": "aman@example.com",
    "motivation": 76,
    "distraction": 40,
    "stress": 58,
    "createdAt": "2024-05-09T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Priya Singh",
    "email": "priya@example.com",
    "motivation": 82,
    "distraction": 30,
    "stress": 48,
    "createdAt": "2024-05-09T11:45:00.000Z"
  }
]
```

**Test with curl:**
```bash
curl http://localhost:5000/api/profiles
```

---

### 5. **GET /** - Health Check
Simple check to verify server is running.

**Response:**
```
Effort-Aware Adaptive Learning Pathway Backend is running
```

**Test with curl:**
```bash
curl http://localhost:5000/
```

---

## What is Stored in MongoDB

Your database stores the following for each user:

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique database ID |
| `name` | String | User's full name |
| `email` | String | User's email (unique) |
| `passwordHash` | String | Hashed password (never stored plain) |
| `role` | String | User role (e.g., "Learner") |
| `motivation` | Number | Motivation level (0-100) |
| `distraction` | Number | Distraction level (0-100) |
| `stress` | Number | Stress level (0-100) |
| `pressure` | Number | Academic/work pressure (0-100) |
| `effortHours` | Number | Predicted effort hours |
| `completionTime` | String | Estimated completion time |
| `weeklyWorkload` | String | Weekly workload (hrs/week) |
| `totalLearnHours` | Number | Total learning hours needed |
| `difficultyLevel` | String | Difficulty (Low/Medium/High) |
| `cognitiveLoad` | String | Cognitive load assessment |
| `abandonRisk` | Number | Abandonment risk percentage |
| `focusScore` | Number | Focus score (0-100) |
| `loadScore` | Number | Load score (0-100) |
| `confidence` | Number | Confidence level (0-100) |
| `createdAt` | Date | Account creation timestamp |

---

## How It Works

1. **User Registration** → Password hashed with bcrypt → Stored in MongoDB
2. **User Login** → Email looked up → Password verified → Profile returned
3. **Profile Update** → User data sent → Merged with existing data → Saved to DB
4. **View All Profiles** → MongoDB returns all stored user records

---

## Troubleshooting

### MongoDB Connection Error
- Check `.env` file has correct `MONGODB_URI`
- Verify MongoDB Atlas IP whitelist includes your computer
- Check username and password are correct

### PORT already in use
- Change PORT in `.env` to 5001 or 5002
- Or kill the process using port 5000

### Email already registered
- Each email can only register once
- Use a different email or delete the user from MongoDB Atlas

---

## Example Complete Flow

```
1. Register User
   POST /api/register
   → Stored in MongoDB with hashed password

2. User Logs In
   POST /api/login
   → Password verified, profile data returned

3. Update Profile
   POST /api/profile
   → All user inputs saved to MongoDB

4. View Profile
   GET /api/profiles
   → See all saved user data
```

