import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGraduationCap, FaEnvelope, FaLock } from "react-icons/fa";
import api from "../services/api";
import { saveUser, saveToken, loadUser, recordLogin } from "../services/auth";

export default function Login() {

  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem("rememberedEmail") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem("rememberedEmail"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/login", { email, password });
      const user = response.data.user || response.data;
      const token = response.data.access_token || response.data.token;
      saveUser(user);
      if (token) saveToken(token);
      
      // Record login for streak tracking
      recordLogin(user);

      // Handle remember me functionality - save ONLY if user checks the box
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("userLoginTime", new Date().getTime().toString());
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("userLoginTime");
      }

      // Check if user needs initial assessment
      if (user.needsAssessment) {
        navigate("/onboarding", { state: { user } });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-cyan-500/18 rounded-full blur-3xl" style={{ animation: "float 10s ease-in-out infinite" }}></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-500/18 rounded-full blur-3xl" style={{ animation: "float 12s ease-in-out infinite reverse" }}></div>
      <div className="fixed top-20 right-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" style={{ animation: "float 14s ease-in-out infinite" }}></div>

      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-6xl gap-8 items-center">

        {/* Left Section - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center animate-fade-in-up">
          <div className="text-white space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-2xl shadow-cyan-500/50 transform transition duration-700 hover:-translate-y-1">
                <FaGraduationCap className="text-3xl text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">EduAI</h1>
            </div>

            <div className="space-y-3">
              <h2 className="text-5xl font-bold leading-tight">Effort-Aware Adaptive Learning</h2>
              <p className="text-lg text-slate-300 leading-relaxed max-w-md">
                Personalized AI-powered learning pathways based on student effort, burnout analysis, engagement, and adaptive recommendations.
              </p>
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-3 text-slate-200">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span>Smart effort prediction</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span>Burnout and stress detection</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span>Personalized timetables</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="w-full max-w-md animate-fade-in-up">
            {/* Glassmorphism Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10 transform transition duration-700 hover:-translate-y-1">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Login</h1>
                <p className="text-slate-300 text-sm">Sign in to continue your adaptive learning journey.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="rounded-2xl bg-red-500/20 border border-red-500/50 text-red-200 p-4 text-sm animate-shake">
                    ⚠ {error}
                  </div>
                )}

                {/* Email Input */}
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

                {/* Password Input */}
                <div className="relative group">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/60 group-focus-within:text-cyan-400 transition" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-12 pr-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/20 transition"
                    required
                  />
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-cyan-400 bg-white/10"
                    />
                    <span className="group-hover:text-white transition">Remember Me</span>
                  </label>
                  <Link
                    to="/forgot"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-3 rounded-2xl font-bold text-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              {/* Signup Link */}
              <div className="mt-8 text-center">
                <p className="text-slate-300 text-sm">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-cyan-400 hover:text-cyan-300 font-bold transition"
                  >
                    Create one
                  </Link>
                </p>
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
