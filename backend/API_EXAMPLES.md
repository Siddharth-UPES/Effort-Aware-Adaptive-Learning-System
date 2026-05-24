# API Testing Examples

Use these examples to test the backend in Postman, curl, or any API client.

## Base URL
```
http://localhost:5000
```

---

## 1. Health Check
**Method:** GET
**Endpoint:** `/`
**No body needed**

**Response:**
```
Effort-Aware Adaptive Learning Pathway Backend is running
```

---

## 2. Register New User

**Method:** POST
**Endpoint:** `/api/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
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

**Success Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Aman Sharma",
  "email": "aman@example.com",
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
  "confidence": 68,
  "createdAt": "2024-05-09T10:30:00.000Z"
}
```

**Error Response (409 - Email already exists):**
```json
{
  "message": "This email is already registered."
}
```

**Error Response (400 - Missing fields):**
```json
{
  "message": "Name, email and password are required."
}
```

---

## 3. Login User

**Method:** POST
**Endpoint:** `/api/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "aman@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
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
    "confidence": 68,
    "createdAt": "2024-05-09T10:30:00.000Z"
  }
}
```

**Error Response (401 - Invalid credentials):**
```json
{
  "message": "Invalid email or password."
}
```

---

## 4. Update User Profile

**Method:** POST
**Endpoint:** `/api/profile`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
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

**Success Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "aman@example.com",
  "name": "Aman Sharma Updated",
  "role": "Learner",
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
  "confidence": 72,
  "createdAt": "2024-05-09T10:30:00.000Z"
}
```

---

## 5. Get All Profiles

**Method:** GET
**Endpoint:** `/api/profiles`
**No body needed**

**Success Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Aman Sharma",
    "email": "aman@example.com",
    "role": "Learner",
    "motivation": 80,
    "distraction": 35,
    "stress": 55,
    "pressure": 60,
    "effortHours": 55,
    "createdAt": "2024-05-09T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Priya Singh",
    "email": "priya@example.com",
    "role": "Learner",
    "motivation": 85,
    "distraction": 25,
    "stress": 45,
    "pressure": 55,
    "effortHours": 60,
    "createdAt": "2024-05-09T11:45:00.000Z"
  }
]
```

---

## Testing with CURL

### Register
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "password":"password123",
    "motivation":70,
    "stress":60
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }'
```

### Update Profile
```bash
curl -X POST http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "name":"Updated Name",
    "motivation":85,
    "stress":50
  }'
```

### Get All Profiles
```bash
curl http://localhost:5000/api/profiles
```

### Health Check
```bash
curl http://localhost:5000/
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success - Data returned or updated |
| 201 | Created - New user registered successfully |
| 400 | Bad Request - Missing or invalid fields |
| 401 | Unauthorized - Invalid email or password |
| 409 | Conflict - Email already registered |
| 500 | Server Error - Database or server issue |

