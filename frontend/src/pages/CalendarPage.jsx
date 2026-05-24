import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadUser } from "../services/auth";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "../context/ThemeContext";
import { FaEdit, FaPlus, FaTimes } from "react-icons/fa";

const initialEvents = [
  { date: "2026-05-12", title: "Capstone Review", category: "Project", progress: "On track" },
  { date: "2026-05-15", title: "Midterm Mock Test", category: "Exam", progress: "Planned" },
  { date: "2026-05-20", title: "Submit Assignment 4", category: "Assignment", progress: "In progress" },
  { date: "2026-05-24", title: "Group Study Session", category: "Peer", progress: "Confirmed" },
  { date: "2026-05-28", title: "Feedback & Reflection", category: "Review", progress: "Planned" },
];

export default function CalendarPage() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [weeklyHours, setWeeklyHours] = useState(42);
  const [events, setEvents] = useState(initialEvents);
  const [editingPriorities, setEditingPriorities] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    const currentUser = loadUser();
    setUser(currentUser);
    setWeeklyHours(currentUser?.Study_Hours_Per_Day ? currentUser.Study_Hours_Per_Day * 7 : 42);
  }, []);

  const studyHours = Math.round(weeklyHours * 0.55);
  const recoveryHours = Math.max(5, Math.round(weeklyHours * 0.28));
  const deadlines = events.length;
  const focusBlocks = Math.max(5, Math.round(studyHours / 2));

  const pageText = darkMode ? "text-white" : "text-slate-950";
  const pageBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  const sectionBg = darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-950";
  const cardBg = darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-950";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const handleEditPriority = (index) => {
    setEditFormData({ ...events[index] });
    setEditIndex(index);
    setEditingPriorities(true);
  };

  const handleEditDate = (index) => {
    setEditFormData({ ...events[index] });
    setEditIndex(index);
    setEditingDates(true);
  };

  const handleSaveEdit = () => {
    if (editIndex !== null && editFormData) {
      const updatedEvents = [...events];
      updatedEvents[editIndex] = editFormData;
      setEvents(updatedEvents);
      setEditingPriorities(false);
      setEditingDates(false);
      setEditFormData(null);
      setEditIndex(null);
    }
  };

  const handleAddEvent = () => {
    setEditFormData({ date: "", title: "", category: "Project", progress: "Planned" });
    setEditIndex(events.length);
    setEditingDates(true);
  };

  const handleDeleteEvent = (index) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleCloseModal = () => {
    setEditingPriorities(false);
    setEditingDates(false);
    setEditFormData(null);
    setEditIndex(null);
  };

  return (
    <SidebarLayout user={user} darkMode={darkMode} predictions={null}>
      <div className={`p-4 ${pageBg} ${pageText}`}>
        <div className="w-full space-y-8">
          <header className={`rounded-3xl p-8 border ${sectionBg} ${borderColor}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className={`text-4xl font-bold ${pageText}`}>Adaptive Learning Calendar</h1>
                <p className={`mt-3 ${mutedText}`}>Track your personalized plan with deadlines, study sessions, and recovery windows tailored to you.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPriorities(!editingPriorities)}
                  className="rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02]"
                >
                  Priorities
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDates(true)}
                  className="rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:scale-[1.02]"
                >
                  Important Dates
                </button>
              </div>
            </div>
          </header>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor} cursor-pointer transition hover:border-cyan-500`} onClick={() => !editingPriorities && setEditingPriorities(true)}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Next 3 Priorities</h2>
                <FaEdit className="text-cyan-400" />
              </div>
              <div className="mt-5 space-y-4">
                {events.slice(0, 3).map((event, idx) => (
                  <div key={event.date + event.title} className={`rounded-2xl p-4 ${cardBg}`}> 
                    <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">{event.category}</p>
                    <p className={`mt-2 text-xl font-semibold ${pageText}`}>{event.title}</p>
                    <p className={`mt-1 ${mutedText}`}>{event.date}</p>
                    <p className={`mt-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Status: {event.progress}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-3xl p-4 border ${sectionBg} ${borderColor} lg:col-span-2`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Weekly Schedule Overview</h2>
                  <p className={`mt-2 ${mutedText}`}>Your personalized weekly time allocation for optimal learning and recovery.</p>
                </div>
                <span className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950">✓ Healthy Balance</span>
              </div>

              {/* Weekly Time Breakdown */}
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className={`text-sm font-semibold ${pageText}`}>Weekly Time Allocation</p>
                      <p className={`text-xs ${mutedText}`}>Total: {weeklyHours} hours available per week (7 days × 24 hours)</p>
                    </div>
                  </div>
                  <div className="flex gap-2 h-8 rounded-full overflow-hidden bg-slate-800">
                    <div className="bg-cyan-500 flex items-center justify-center text-white text-xs font-bold" style={{width: `${(studyHours / weeklyHours) * 100}%`}}>
                      Study
                    </div>
                    <div className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold" style={{width: `${(recoveryHours / weeklyHours) * 100}%`}}>
                      Rest
                    </div>
                    <div className="bg-slate-700 flex-1"></div>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <div className={`rounded-2xl p-4 border ${borderColor} ${cardBg}`}>
                  <p className={`text-xs uppercase tracking-[0.15em] font-semibold ${mutedText}`}>📚 Study Hours</p>
                  <p className="mt-3 text-3xl font-bold text-cyan-400">{studyHours}</p>
                  <p className={`text-xs mt-2 ${mutedText}`}>hrs per week</p>
                  <p className={`text-xs mt-1 leading-relaxed text-slate-500`}>Dedicated time for focused learning, practice, and problem-solving</p>
                </div>

                <div className={`rounded-2xl p-4 border ${borderColor} ${cardBg}`}>
                  <p className={`text-xs uppercase tracking-[0.15em] font-semibold ${mutedText}`}>⏆ Recovery Time</p>
                  <p className="mt-3 text-3xl font-bold text-emerald-400">{recoveryHours}</p>
                  <p className={`text-xs mt-2 ${mutedText}`}>hrs per week</p>
                  <p className={`text-xs mt-1 leading-relaxed text-slate-500`}>Rest, breaks, and self-care for mental health</p>
                </div>

                <div className={`rounded-2xl p-4 border ${borderColor} ${cardBg}`}>
                  <p className={`text-xs uppercase tracking-[0.15em] font-semibold ${mutedText}`}>📅 Deadlines</p>
                  <p className="mt-3 text-3xl font-bold text-amber-400">{deadlines}</p>
                  <p className={`text-xs mt-2 ${mutedText}`}>upcoming tasks</p>
                  <p className={`text-xs mt-1 leading-relaxed text-slate-500`}>Total assignments & milestones to track</p>
                </div>

                <div className={`rounded-2xl p-4 border ${borderColor} ${cardBg}`}>
                  <p className={`text-xs uppercase tracking-[0.15em] font-semibold ${mutedText}`}>⚡ Focus Blocks</p>
                  <p className="mt-3 text-3xl font-bold text-orange-400">{focusBlocks}</p>
                  <p className={`text-xs mt-2 ${mutedText}`}>per week</p>
                  <p className={`text-xs mt-1 leading-relaxed text-slate-500`}>Deep work sessions (90-120 min each)</p>
                </div>
              </div>

              {/* Health Indicators */}
              <div className="mt-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                <p className="text-sm font-semibold text-cyan-400 mb-3">✓ Schedule Health Indicators</p>
                <div className="grid gap-2 text-sm">
                  <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                    ✓ Study-to-rest ratio is {Math.round((studyHours / recoveryHours) * 10) / 10}:1 - {(studyHours / recoveryHours) < 3 ? '🟢 Well balanced' : (studyHours / recoveryHours) < 4 ? '🟡 Slightly heavy' : '🔴 Adjust rest time'}
                  </p>
                  <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                    ✓ Focus blocks ensure deep work sessions are properly scheduled
                  </p>
                  <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                    ✓ {deadlines} items need proper timeline distribution
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={`rounded-3xl p-4 border ${sectionBg} ${borderColor} cursor-pointer transition hover:border-cyan-500`} onClick={() => setEditingDates(true)}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Important Dates</h2>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleAddEvent(); }} className="rounded-full bg-cyan-500 p-2 text-slate-950 transition hover:bg-cyan-400"><FaPlus /></button>
                <FaEdit className="text-cyan-400" />
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {events.map((event, idx) => (
                <div key={event.date + event.title} className={`rounded-3xl p-5 ${cardBg} relative group`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(idx); }}
                    className="absolute top-3 right-3 rounded-full bg-red-500/20 p-1 text-red-400 opacity-0 transition group-hover:opacity-100"
                  >
                    <FaTimes />
                  </button>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">{event.category}</p>
                      <p className={`mt-2 text-xl font-semibold ${pageText}`}>{event.title}</p>
                    </div>
                    <div className={`rounded-2xl px-3 py-2 text-sm ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>{event.date}</div>
                  </div>
                  <p className={`mt-4 ${mutedText}`}>{event.progress === 'In progress' ? 'Focus update: keep this item moving with shorter review cycles.' : 'Plan a dedicated block for this event and avoid last-minute rush.'}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Edit Priorities Modal */}
      {editingPriorities && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`rounded-3xl p-8 border ${sectionBg} ${borderColor} max-w-2xl w-full mx-4`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold">Edit Priorities</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white"><FaTimes size={24} /></button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {events.slice(0, 3).map((event, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${borderColor}`}>
                  <label className={`text-sm ${mutedText}`}>Title</label>
                  <input
                    type="text"
                    value={editIndex === idx && editFormData ? editFormData.title : event.title}
                    onChange={(e) => editIndex === idx && setEditFormData({ ...editFormData, title: e.target.value })}
                    onClick={() => handleEditPriority(idx)}
                    className={`w-full mt-2 px-3 py-2 rounded-lg border ${borderColor} ${cardBg} outline-none`}
                  />
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className={`text-sm ${mutedText}`}>Date</label>
                      <input
                        type="date"
                        value={editIndex === idx && editFormData ? editFormData.date : event.date}
                        onChange={(e) => editIndex === idx && setEditFormData({ ...editFormData, date: e.target.value })}
                        className={`w-full mt-2 px-3 py-2 rounded-lg border ${borderColor} ${cardBg} outline-none`}
                      />
                    </div>
                    <div>
                      <label className={`text-sm ${mutedText}`}>Category</label>
                      <select
                        value={editIndex === idx && editFormData ? editFormData.category : event.category}
                        onChange={(e) => editIndex === idx && setEditFormData({ ...editFormData, category: e.target.value })}
                        className={`w-full mt-2 px-3 py-2 rounded-lg border ${borderColor} ${cardBg} outline-none`}
                      >
                        <option>Project</option>
                        <option>Exam</option>
                        <option>Assignment</option>
                        <option>Peer</option>
                        <option>Review</option>
                      </select>
                    </div>
                    <div>
                      <label className={`text-sm ${mutedText}`}>Status</label>
                      <select
                        value={editIndex === idx && editFormData ? editFormData.progress : event.progress}
                        onChange={(e) => editIndex === idx && setEditFormData({ ...editFormData, progress: e.target.value })}
                        className={`w-full mt-2 px-3 py-2 rounded-lg border ${borderColor} ${cardBg} outline-none`}
                      >
                        <option>Planned</option>
                        <option>On track</option>
                        <option>In progress</option>
                        <option>Confirmed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-2xl bg-slate-700 px-4 py-3 font-semibold transition hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Important Dates Modal */}
      {editingDates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`rounded-3xl p-8 border ${sectionBg} ${borderColor} max-w-2xl w-full mx-4`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold">Edit Important Dates</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white"><FaTimes size={24} /></button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {events.map((event, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${borderColor}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <label className={`text-sm ${mutedText}`}>Title</label>
                      <input
                        type="text"
                        value={editIndex === idx && editFormData ? editFormData.title : event.title}
                        onChange={(e) => editIndex === idx && setEditFormData({ ...editFormData, title: e.target.value })}
                        onClick={() => handleEditDate(idx)}
                        className={`w-full mt-2 px-3 py-2 rounded-lg border ${borderColor} ${cardBg} outline-none`}
                      />
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className={`text-sm ${mutedText}`}>Date</label>
                          <input
                            type="date"
                            value={editIndex === idx && editFormData ? editFormData.date : event.date}
                            onChange={(e) => editIndex === idx && setEditFormData({ ...editFormData, date: e.target.value })}
                            className={`w-full mt-2 px-3 py-2 rounded-lg border ${borderColor} ${cardBg} outline-none`}
                          />
                        </div>
                        <div>
                          <label className={`text-sm ${mutedText}`}>Category</label>
                          <select
                            value={editIndex === idx && editFormData ? editFormData.category : event.category}
                            onChange={(e) => editIndex === idx && setEditFormData({ ...editFormData, category: e.target.value })}
                            className={`w-full mt-2 px-3 py-2 rounded-lg border ${borderColor} ${cardBg} outline-none`}
                          >
                            <option>Project</option>
                            <option>Exam</option>
                            <option>Assignment</option>
                            <option>Peer</option>
                            <option>Review</option>
                          </select>
                        </div>
                        <div>
                          <label className={`text-sm ${mutedText}`}>Status</label>
                          <select
                            value={editIndex === idx && editFormData ? editFormData.progress : event.progress}
                            onChange={(e) => editIndex === idx && setEditFormData({ ...editFormData, progress: e.target.value })}
                            className={`w-full mt-2 px-3 py-2 rounded-lg border ${borderColor} ${cardBg} outline-none`}
                          >
                            <option>Planned</option>
                            <option>On track</option>
                            <option>In progress</option>
                            <option>Confirmed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(idx)}
                      className="mt-8 rounded-full bg-red-500/20 p-2 text-red-400 transition hover:bg-red-500/30"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setEvents([...events, { date: "", title: "", category: "Project", progress: "Planned" }]);
                }}
                className="w-full rounded-2xl border-2 border-dashed border-cyan-500 py-3 text-cyan-400 transition hover:bg-cyan-500/10 flex items-center justify-center gap-2"
              >
                <FaPlus /> Add New Date
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-2xl bg-slate-700 px-4 py-3 font-semibold transition hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
