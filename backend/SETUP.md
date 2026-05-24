# QUICK START CHECKLIST

## Step 1: MongoDB Atlas Setup (One-time only)
- [ ] Go to https://www.mongodb.com/cloud/atlas
- [ ] Create free account
- [ ] Create FREE M0 cluster
- [ ] Add database user (username: `admin`, password: create a strong one)
- [ ] Allow access from anywhere (Network Access)
- [ ] Get connection string from "Connect" button
- [ ] Connection string format: `mongodb+srv://admin:PASSWORD@cluster0.xxx.mongodb.net/effort-learning?retryWrites=true&w=majority`

## Step 2: Backend Configuration
- [ ] Copy connection string from MongoDB Atlas
- [ ] Open `backend/.env` file
- [ ] Replace the MONGODB_URI with your connection string
- [ ] Replace `PASSWORD` with your actual database password
- [ ] Save the file

Example of completed .env:
```
MONGODB_URI=mongodb+srv://admin:MySecurePass123@cluster0.abc123.mongodb.net/effort-learning?retryWrites=true&w=majority
PORT=5000
```

## Step 3: Install & Run Backend
```bash
cd backend
npm install
npm run dev
```

Expected output:
```
MongoDB connected
Server is running on port 5000
```

## Step 4: Test Backend (Optional but recommended)

Open another terminal and test:

### Test 1: Health Check
```bash
curl http://localhost:5000/
```

### Test 2: Register User
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

### Test 3: Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## What Data is Stored in MongoDB?

When a user registers or updates profile:
- Email & hashed password (never plain text)
- Name, role
- Motivation, distraction, stress, pressure (0-100)
- Effort hours, completion time, weekly workload
- Total learn hours, difficulty level, cognitive load
- Abandon risk, focus score, load score, confidence
- Account creation timestamp

## API Endpoints Available

1. `GET /` - Health check
2. `POST /api/register` - New user signup + store all profile data
3. `POST /api/login` - Verify email/password + return profile
4. `POST /api/profile` - Update user profile data
5. `GET /api/profiles` - Get all registered users (for admin)

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| MongoDB connection error | Check MONGODB_URI in .env and IP whitelist in Atlas |
| Email already registered | Use different email or delete user from MongoDB Atlas |
| PORT 5000 in use | Change PORT in .env to 5001 or 5002 |
| npm install fails | Delete `node_modules` folder, run `npm install` again |
| Password not matching | Ensure password is correct and not using special chars |

## Next: Connect Frontend to Backend

In frontend, use these API URLs:
- Register: `http://localhost:5000/api/register`
- Login: `http://localhost:5000/api/login`
- Update Profile: `http://localhost:5000/api/profile`

