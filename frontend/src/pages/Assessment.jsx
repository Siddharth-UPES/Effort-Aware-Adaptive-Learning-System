import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { loadToken } from '../services/auth';

export default function Assessment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    Attendance: 75,
    Study_Hours_Per_Day: 6,
    stress_level: 2.5,
    socialMediaHours: 2,
    Sleep_Hours_Per_Day: 7,
    Physical_Activity_Hours_Per_Day: 2,
    workload_index: 10,
    burnout_risk: 25,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Update profile with assessment data + mark needsAssessment as false
      const response = await api.put('/api/profile', {
        ...formData,
        needsAssessment: false
      });

      if (response.data.user) {
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Assessment submission error:', err);
      setError(err.response?.data?.detail || 'Assessment submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome to EffortAware!</h1>
          <p className="text-gray-600">Let's personalize your learning experience with a quick assessment</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Assessment Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Attendance */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-4">
              Attendance (%)
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-8">0%</span>
              <input
                type="range"
                name="Attendance"
                min="0"
                max="100"
                step="5"
                value={formData.Attendance}
                onChange={handleChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500 w-8">100%</span>
            </div>
            <p className="text-center text-indigo-600 font-semibold mt-2">{formData.Attendance}%</p>
          </div>

          {/* Study Hours Per Day */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-4">
              Study Hours Per Day
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-8">1h</span>
              <input
                type="range"
                name="Study_Hours_Per_Day"
                min="1"
                max="12"
                step="0.5"
                value={formData.Study_Hours_Per_Day}
                onChange={handleChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500 w-8">12h</span>
            </div>
            <p className="text-center text-indigo-600 font-semibold mt-2">{formData.Study_Hours_Per_Day}h</p>
          </div>

          {/* Stress Level */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-4">
              Stress Level
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-12">Low</span>
              <input
                type="range"
                name="stress_level"
                min="0"
                max="5"
                step="0.5"
                value={formData.stress_level}
                onChange={handleChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500 w-12">High</span>
            </div>
            <p className="text-center text-indigo-600 font-semibold mt-2">{formData.stress_level.toFixed(1)}/5</p>
          </div>

          {/* Daily Social Media Usage */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-4">
              Social Media Usage (hrs)
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-8">0h</span>
              <input
                type="range"
                name="socialMediaHours"
                min="0"
                max="8"
                step="0.5"
                value={formData.socialMediaHours}
                onChange={handleChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500 w-8">8h</span>
            </div>
            <p className="text-center text-indigo-600 font-semibold mt-2">{formData.socialMediaHours}h</p>
          </div>

          {/* Sleep Hours Per Night */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-4">
              Sleep Hours Per Night
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-8">3h</span>
              <input
                type="range"
                name="Sleep_Hours_Per_Day"
                min="3"
                max="10"
                step="0.5"
                value={formData.Sleep_Hours_Per_Day}
                onChange={handleChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500 w-8">10h</span>
            </div>
            <p className="text-center text-indigo-600 font-semibold mt-2">{formData.Sleep_Hours_Per_Day}h</p>
          </div>

          {/* Physical Activity Hours Per Day */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-4">
              Physical Activity Hours Per Day
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-8">0h</span>
              <input
                type="range"
                name="Physical_Activity_Hours_Per_Day"
                min="0"
                max="5"
                step="0.5"
                value={formData.Physical_Activity_Hours_Per_Day}
                onChange={handleChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500 w-8">5h</span>
            </div>
            <p className="text-center text-indigo-600 font-semibold mt-2">{formData.Physical_Activity_Hours_Per_Day}h</p>
          </div>

          {/* Workload Index */}
          <div className="mb-10">
            <label className="block text-gray-700 font-semibold mb-4">
              Workload Index
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-12">Light</span>
              <input
                type="range"
                name="workload_index"
                min="0"
                max="20"
                step="1"
                value={formData.workload_index}
                onChange={handleChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500 w-12">Heavy</span>
            </div>
            <p className="text-center text-indigo-600 font-semibold mt-2">{formData.workload_index}/20</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
            }`}
          >
            {loading ? 'Saving Assessment...' : 'Complete Assessment'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          You can update these settings anytime in your profile
        </p>
      </div>
    </div>
  );
}
