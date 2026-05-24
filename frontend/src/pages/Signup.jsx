import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGraduationCap, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import api from "../services/api";
import { saveUser, saveToken, recordLogin } from "../services/auth";


export default function Signup() {

  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/register", {
        name,
        email,
        password,
        role: "Learner",
        needsAssessment: true,
        stress: 50,
        pressure: 50,
        socialMediaHours: 2,
        effortHours: 0,
        weeklyWorkload: "0 hrs/week",
        totalLearnHours: 0,
        difficultyLevel: "Medium",
        cognitiveLoad: "Moderate",
        abandonRisk: 0,
        focusScore: 60,
        loadScore: 50,
        confidence: 60,
      });

      const user = response.data.user || response.data;
      const token = response.data.access_token || response.data.token;
      saveUser(user);
      if (token) saveToken(token);
      recordLogin(user);
      navigate("/onboarding", { state: { user } });
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-cyan-500/18 rounded-full blur-3xl" style={{ animation: "float 10s ease-in-out infinite" }}></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-500/18 rounded-full blur-3xl" style={{ animation: "float 12s ease-in-out infinite reverse" }}></div>
      <div className="fixed top-1/2 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" style={{ animation: "float 14s ease-in-out infinite" }}></div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">

          {/* Left Section - Branding */}
          <div className="hidden lg:flex flex-col justify-center animate-fade-in-up">
            <div className="space-y-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-2xl shadow-cyan-500/50 transform transition duration-700 hover:-translate-y-1">
                  <FaGraduationCap className="text-3xl text-white" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">EduAI</h1>
              </div>

              <div className="space-y-3">
                <h2 className="text-5xl font-bold leading-tight">Create Your Account</h2>
                <p className="text-lg text-slate-300 leading-relaxed max-w-md">
                  Start your AI-powered learning journey with an adaptive dashboard that predicts effort, reduces burnout, and keeps you on track.
                </p>
              </div>

              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-3 text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <span>Smart effort prediction</span>
                </div>
                <div className="flex items-center gap-3 text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <span>Burnout prevention insights</span>
                </div>
                <div className="flex items-center gap-3 text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <span>Personalized timetables</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Signup Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md animate-fade-in-up">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10 transform transition duration-700 hover:-translate-y-1">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-white mb-2">Create Account</h1>
                  <p className="text-slate-300 text-sm">Join thousands of smarter learners today</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                  {error && (
                    <div className="rounded-2xl bg-red-500/20 border border-red-500/50 text-red-200 p-4 text-sm animate-shake">
                      ⚠ {error}
                    </div>
                  )}

                  <div className="relative group">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/60 group-focus-within:text-cyan-400 transition" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full pl-12 pr-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/20 transition"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/60 group-focus-within:text-cyan-400 transition" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full pl-12 pr-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/20 transition"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/60 group-focus-within:text-cyan-400 transition" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create Password"
                      className="w-full pl-12 pr-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/20 transition"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-3 rounded-2xl font-bold text-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-slate-300 text-sm">
                    Already have an account?{" "}
                    <Link
                      to="/"
                      className="text-cyan-400 hover:text-cyan-300 font-bold transition"
                    >
                      Login here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out both; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
