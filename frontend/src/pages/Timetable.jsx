import React, { useEffect, useMemo, useState } from 'react';
import { loadUser } from '../services/auth';
import SidebarLayout from '../components/SidebarLayout';
import { useTheme } from '../context/ThemeContext';

const Timetable = () => {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [studentType, setStudentType] = useState('school'); // 'school' or 'college'
  const [dailySchedule, setDailySchedule] = useState({
    morning_5_9: '',
    morning_9_12: '',
    afternoon_12_3: '',
    afternoon_3_6: '',
    evening_6_9: '',
    night_9_12: '',
    late_12_5: '',
  });
  const [delayedTasks, setDelayedTasks] = useState([]);
  const [newDelayedTask, setNewDelayedTask] = useState({ title: '', due: '', status: 'Delayed' });
  const [attendance, setAttendance] = useState({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  });

  useEffect(() => {
    const currentUser = loadUser();
    setUser(currentUser);
    const savedSchedule = localStorage.getItem('dailySchedule');
    const savedAttendance = localStorage.getItem('attendance');
    const savedStudentType = localStorage.getItem('studentType');
    if (savedSchedule) {
      setDailySchedule(JSON.parse(savedSchedule));
    }
    if (savedAttendance) {
      setAttendance(JSON.parse(savedAttendance));
    }
    if (savedStudentType) {
      setStudentType(savedStudentType);
    }
    if (localStorage.getItem('delayedTasks')) {
      setDelayedTasks(JSON.parse(localStorage.getItem('delayedTasks') || '[]'));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dailySchedule', JSON.stringify(dailySchedule));
    localStorage.setItem('attendance', JSON.stringify(attendance));
    localStorage.setItem('studentType', studentType);
  }, [dailySchedule, attendance, studentType]);

  useEffect(() => {
    localStorage.setItem('delayedTasks', JSON.stringify(delayedTasks));
  }, [delayedTasks]);

  const handleAddDelayedTask = () => {
    if (!newDelayedTask.title || !newDelayedTask.due) return;
    setDelayedTasks((prev) => [...prev, newDelayedTask]);
    setNewDelayedTask({ title: '', due: '', status: 'Delayed' });
  };

  const handleRemoveDelayedTask = (index) => {
    setDelayedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const timeSlots = [
    { key: 'morning_5_9', label: '5 AM - 9 AM', description: 'Early Morning' },
    { key: 'morning_9_12', label: '9 AM - 12 PM', description: 'Late Morning' },
    { key: 'afternoon_12_3', label: '12 PM - 3 PM', description: 'Afternoon' },
    { key: 'afternoon_3_6', label: '3 PM - 6 PM', description: 'Late Afternoon' },
    { key: 'evening_6_9', label: '6 PM - 9 PM', description: 'Evening' },
    { key: 'night_9_12', label: '9 PM - 12 AM', description: 'Night' },
    { key: 'late_12_5', label: '12 AM - 5 AM', description: 'Late Night' },
  ];

  const activityOptions = [
    'Sleeping',
    'Studying / Attending Classes',
    'Breakfast / Lunch / Dinner',
    'Exercise / Physical Activity',
    'Commute / Travel',
    'Relaxation / Entertainment',
    'Extracurricular Activities',
    'Social Time',
    'Personal Care / Hygiene',
    'Other',
  ];

  const scheduleMetrics = useMemo(() => {
    const filledSlots = Object.values(dailySchedule).filter(Boolean).length;
    const studySlots = Object.values(dailySchedule).filter((value) =>
      value.includes('Studying') || value.includes('Classes') || value.includes('Attending')
    ).length;
    const restSlots = Object.values(dailySchedule).filter((value) =>
      value.includes('Sleeping') || value.includes('Relaxation') || value.includes('Personal Care')
    ).length;
    const scheduledHours = studySlots * 3 + restSlots * 2;
    const attendanceRate = (Object.values(attendance).filter(Boolean).length / 7) * 100;
    const burnoutRisk = Math.min(100, Math.max(10, studySlots * 18 - restSlots * 8 + (attendanceRate > 80 ? 5 : 0)));
    const focusPrediction = Math.max(20, 100 - burnoutRisk + (restSlots * 5));
    const balanceAdvice = burnoutRisk > 60
      ? 'High burden detected. Use free or rest slots to recover and lower your burnout risk.'
      : studySlots >= 5
      ? 'Your schedule is heavy; weave in more active rest and flexibility.'
      : 'Your timetable is balanced. Keep consistent study blocks with recovery time.';

    return {
      filledSlots,
      studySlots,
      restSlots,
      scheduledHours,
      attendanceRate: attendanceRate.toFixed(0),
      burnoutRisk,
      focusPrediction,
      balanceAdvice,
    };
  }, [dailySchedule, attendance]);

  const freeTimeSlots = useMemo(() => {
    return Object.values(dailySchedule).filter((value) =>
      !value || ['Relaxation / Entertainment', 'Sleeping', 'Personal Care / Hygiene', 'Social Time', 'Other'].includes(value)
    ).length;
  }, [dailySchedule]);

  const highBurden = scheduleMetrics.burnoutRisk > 55;

  const handleOptimizeFreeTime = () => {
    const availableSlot = timeSlots.find((slot) => {
      const value = dailySchedule[slot.key];
      return !value || !value.includes('Studying') && !value.includes('Classes');
    });
    if (availableSlot) {
      setDailySchedule((prev) => ({
        ...prev,
        [availableSlot.key]: 'Relaxation / Entertainment',
      }));
      alert('A recovery slot has been added to your day to help reduce academic burden.');
    } else {
      alert('No non-study slot is available. Try replacing one study block with a short recovery period.');
    }
  };

  const handleActivityChange = (timeKey, value) => {
    setDailySchedule(prev => ({ ...prev, [timeKey]: value }));
  };

  const handleAttendanceChange = (day, checked) => {
    setAttendance(prev => ({ ...prev, [day]: checked }));
  };

  const handleSubmit = () => {
    const scheduleData = {
      studentType,
      dailySchedule,
      attendance,
      timestamp: new Date().toISOString(),
    };
    console.log('Timetable Data:', scheduleData);
    alert('Timetable saved successfully!');
  };

  const weeklyTarget = user?.Study_Hours_Per_Day ? user.Study_Hours_Per_Day * 7 : 42;

  const pageText = darkMode ? "text-white" : "text-slate-950";
  const pageBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  const sectionBg = darkMode ? "bg-slate-900" : "bg-white";
  const cardBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  return (
    <SidebarLayout user={user} darkMode={darkMode} predictions={null}>
      <div className={`p-4 ${pageBg} ${pageText}`}>
        <div className="w-full">
        <h1 className={`text-4xl font-bold ${pageText} mb-8`}>My Daily Timetable</h1>

        {/* Student Type Selection */}
        <div className={`rounded-lg p-4 mb-8 border ${sectionBg} ${borderColor}`}>
          <h2 className={`text-2xl font-bold ${pageText} mb-4`}>Student Type</h2>
          <div className="flex gap-4">
            <label className={`flex items-center cursor-pointer ${pageText}`}>
              <input
                type="radio"
                value="school"
                checked={studentType === 'school'}
                onChange={(e) => setStudentType(e.target.value)}
                className="mr-3"
              />
              <span className="text-lg">School Student</span>
            </label>
            <label className={`flex items-center cursor-pointer ${pageText}`}>
              <input
                type="radio"
                value="college"
                checked={studentType === 'college'}
                onChange={(e) => setStudentType(e.target.value)}
                className="mr-3"
              />
              <span className="text-lg">College Student</span>
            </label>
          </div>
        </div>

        {/* 24-Hour Schedule */}
        <div className={`rounded-lg p-4 mb-8 border ${sectionBg} ${borderColor}`}>
          <h2 className={`text-2xl font-bold ${pageText} mb-6`}>24-Hour Daily Schedule</h2>
          <p className={`mb-6 ${mutedText}`}>What do you typically do during each time slot?</p>

          <div className="space-y-6">
            {timeSlots.map((slot) => (
              <div key={slot.key} className={`rounded-lg p-4 border ${borderColor} ${cardBg}`}>
                <label className={`font-semibold block mb-3 ${pageText}`}>
                  {slot.label} - {slot.description}
                </label>
                <select
                  value={dailySchedule[slot.key]}
                  onChange={(e) => handleActivityChange(slot.key, e.target.value)}
                  className={`w-full p-3 rounded-lg border ${borderColor} focus:outline-none focus:border-cyan-500 ${pageText} ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}
                >
                  <option value="">Select activity...</option>
                  {activityOptions.map((activity) => (
                    <option key={activity} value={activity}>
                      {activity}
                    </option>
                  ))}
                </select>
                {dailySchedule[slot.key] && (
                  <p className="text-cyan-400 mt-2">
                    Selected: <strong>{dailySchedule[slot.key]}</strong>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Tracking */}
        <div className={`rounded-lg p-4 mb-8 border ${sectionBg} ${borderColor}`}>
          <h2 className={`text-2xl font-bold ${pageText} mb-4`}>Weekly Attendance</h2>
          <p className={`mb-6 ${mutedText}`}>Mark the days you attended school/college</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(attendance).map((day) => (
              <label
                key={day}
                className={`flex items-center p-4 rounded-lg cursor-pointer transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                <input
                  type="checkbox"
                  checked={attendance[day]}
                  onChange={(e) => handleAttendanceChange(day, e.target.checked)}
                  className="mr-3 w-5 h-5"
                />
                <span className={`font-semibold ${pageText}`}>{day}</span>
              </label>
            ))}
          </div>

          <div className={`mt-4 p-4 rounded-lg border ${borderColor} ${cardBg}`}>
            <p className={pageText}>
              Days Present: <strong className="text-cyan-400">{Object.values(attendance).filter(Boolean).length}/7</strong>
            </p>
            <p className={pageText}>
              Attendance: <strong className="text-cyan-400">{((Object.values(attendance).filter(Boolean).length / 7) * 100).toFixed(1)}%</strong>
            </p>
          </div>
        </div>

        <div className={`rounded-lg p-4 mb-8 border ${sectionBg} ${borderColor}`}>
          <div className="flex flex-col gap-4 mb-6">
            <h2 className={`text-2xl font-bold ${pageText}`}>Delayed Tasks</h2>
            <p className={`text-sm ${mutedText}`}>Track overdue items directly in your timetable planner.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <input
              type="text"
              value={newDelayedTask.title}
              onChange={(e) => setNewDelayedTask({ ...newDelayedTask, title: e.target.value })}
              placeholder="Task title"
              className={`w-full rounded-lg border px-4 py-3 outline-none focus:border-cyan-500 ${pageText} ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
            />
            <input
              type="date"
              value={newDelayedTask.due}
              onChange={(e) => setNewDelayedTask({ ...newDelayedTask, due: e.target.value })}
              className={`w-full rounded-lg border px-4 py-3 outline-none focus:border-cyan-500 ${pageText} ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
            />
            <button
              type="button"
              onClick={handleAddDelayedTask}
              className="w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Add delayed task
            </button>
          </div>

          {delayedTasks.length > 0 ? (
            <div className="space-y-3">
              {delayedTasks.map((task, index) => (
                <div key={index} className={`rounded-2xl p-4 border ${borderColor} ${cardBg}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={`font-semibold ${pageText}`}>{task.title}</p>
                      <p className={`text-sm ${mutedText}`}>Due: {task.due}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDelayedTask(index)}
                      className="rounded-full bg-rose-500/10 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/20"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`${mutedText}`}>No delayed tasks yet. Add one to keep your timetable up to date.</p>
          )}
        </div>

        {/* Summary */}
        <div className={`rounded-lg p-4 mb-8 border ${sectionBg} ${borderColor}`}>
          <h2 className={`text-2xl font-bold ${pageText} mb-4`}>Schedule Summary</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`rounded-xl p-4 border ${borderColor} ${cardBg}`}>
              <p className={`text-sm ${mutedText}`}>Filled Slots</p>
              <p className={`text-3xl font-semibold ${pageText}`}>{scheduleMetrics.filledSlots}/7</p>
            </div>
            <div className={`rounded-xl p-4 border ${borderColor} ${cardBg}`}>
              <p className={`text-sm ${mutedText}`}>Study Blocks</p>
              <p className={`text-3xl font-semibold ${pageText}`}>{scheduleMetrics.studySlots}</p>
            </div>
            <div className={`rounded-xl p-4 border ${borderColor} ${cardBg}`}>
              <p className={`text-sm ${mutedText}`}>Attendance</p>
              <p className={`text-3xl font-semibold ${pageText}`}>{scheduleMetrics.attendanceRate}%</p>
            </div>
            <div className={`rounded-xl p-4 border ${borderColor} ${cardBg}`}>
              <p className={`text-sm ${mutedText}`}>Burnout Risk</p>
              <p className={`text-3xl font-semibold ${pageText}`}>{scheduleMetrics.burnoutRisk}%</p>
            </div>
          </div>

          <div className={`mt-6 space-y-3 ${pageText}`}>
            <p>
              <strong>Scheduled hours estimate:</strong> {scheduleMetrics.scheduledHours} hrs
            </p>
            <p>
              <strong>Projected focus level:</strong> {scheduleMetrics.focusPrediction}%
            </p>
          </div>
        </div>

        <div className={`rounded-lg p-4 mb-8 border ${sectionBg} ${borderColor}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${pageText}`}>Free Time Optimization</h2>
              <p className={`mt-2 ${mutedText}`}>
                {highBurden
                  ? 'High burden detected. Reserve free time for rest, light movement, or mental refresh to lower your burnout risk.'
                  : 'You have free or recovery time available. Keep it reserved for breaks, relaxation, and stress management.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOptimizeFreeTime}
              className="rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:scale-[1.02]"
            >
              Optimize Recovery Time
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className={`rounded-xl p-4 border ${borderColor} ${cardBg}`}>
              <p className={`text-sm ${mutedText}`}>Free / Recovery Slots</p>
              <p className={`text-3xl font-semibold ${pageText}`}>{freeTimeSlots}</p>
            </div>
            <div className={`rounded-xl p-4 border ${borderColor} ${cardBg}`}>
              <p className={`text-sm ${mutedText}`}>Current Burnout Risk</p>
              <p className={`text-3xl font-semibold ${pageText}`}>{scheduleMetrics.burnoutRisk}%</p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-4 mb-8 border ${sectionBg} ${borderColor}`}>
          <p className="text-cyan-300">{scheduleMetrics.balanceAdvice}</p>
        </div>

        {Object.values(dailySchedule).filter((v) => v).length > 0 && (
          <div className={`mt-4 p-3 rounded border ${borderColor} ${cardBg}`}>
            <strong className={pageText}>Your Schedule:</strong>
            <ul className={`mt-2 space-y-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {timeSlots.map((slot) => (
                dailySchedule[slot.key] && (
                  <li key={slot.key}>
                    {slot.label}: <strong className="text-cyan-400">{dailySchedule[slot.key]}</strong>
                  </li>
                )
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition"
        >
          Save Timetable
        </button>
      </div>
    </div>
  </SidebarLayout>
  );
};

export default Timetable;
