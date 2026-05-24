import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaGraduationCap } from "react-icons/fa";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call your reset password API endpoint (you'll need to implement this on the backend)
      const response = await api.post("/api/forgot-password", { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animation: "float 8s ease-in-out infinite" }}></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl animate-pulse" style={{ animation: "float 10s ease-in-out infinite reverse" }}></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold mb-8 transition group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition" />
          Back to Login
        </Link>

        {/* Main Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-2xl shadow-cyan-500/50 mx-auto mb-4">
                  <FaEnvelope className="text-2xl text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
                <p className="text-slate-300 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                    placeholder="Enter your email address"
                    className="w-full pl-12 pr-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/20 transition"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-3 rounded-2xl font-bold text-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending Link..." : "Send Reset Link"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-xs text-slate-400">OR</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {/* Alternative Actions */}
              <div className="space-y-3">
                <p className="text-center text-sm text-slate-300">Remember your password?</p>
                <Link
                  to="/"
                  className="block w-full text-center bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-2xl font-semibold transition"
                >
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50 mx-auto animate-bounce">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
                  <p className="text-slate-300 text-sm">
                    We've sent a password reset link to <span className="text-cyan-400 font-semibold">{email}</span>
                  </p>
                  <p className="text-slate-400 text-xs mt-3">
                    If you don't see the email, check your spam folder.
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={() => navigate("/")}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-3 rounded-2xl font-bold text-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition"
                  >
                    Return to Login
                  </button>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-2xl font-semibold transition"
                  >
                    Try Another Email
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
