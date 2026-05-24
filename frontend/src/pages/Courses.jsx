import React, { useState } from "react";

export default function Courses() {
  const [courses, setCourses] = useState([
    {
      title: "Machine Learning",
      progress: 72,
    },
    {
      title: "Deep Learning",
      progress: 45,
    },
    {
      title: "Data Structures",
      progress: 88,
    },
  ]);

  const [newCourse, setNewCourse] = useState({ title: "", progress: 0 });

  const addCourse = () => {
    if (newCourse.title) {
      setCourses([...courses, newCourse]);
      setNewCourse({ title: "", progress: 0 });
    }
  };

  const updateCourse = (index, field, value) => {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
  };

  const deleteCourse = (index) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-10">
      <h1 className="text-4xl font-bold mb-8">My Courses</h1>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Add New Course</h2>
        <input
          type="text"
          placeholder="Course Title"
          value={newCourse.title}
          onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
          className="p-2 border rounded mr-2"
        />
        <input
          type="number"
          placeholder="Progress %"
          value={newCourse.progress}
          onChange={(e) => setNewCourse({ ...newCourse, progress: parseInt(e.target.value) || 0 })}
          className="p-2 border rounded mr-2"
        />
        <button onClick={addCourse} className="bg-blue-500 text-white p-2 rounded">Add Course</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {courses.map((course, index) => (
          <CourseCard
            key={index}
            course={course}
            onUpdate={(field, value) => updateCourse(index, field, value)}
            onDelete={() => deleteCourse(index)}
          />
        ))}
      </div>
    </div>
  );
}

function CourseCard({ course, onUpdate, onDelete }) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm">
      <input
        type="text"
        value={course.title}
        onChange={(e) => onUpdate("title", e.target.value)}
        className="text-2xl font-bold mb-4 w-full border rounded p-1"
      />
      <p className="text-gray-500 mb-3">Progress: {course.progress}%</p>
      <input
        type="range"
        min="0"
        max="100"
        value={course.progress}
        onChange={(e) => onUpdate("progress", parseInt(e.target.value))}
        className="w-full mb-3"
      />
      <div className="w-full bg-gray-200 h-3 rounded-full">
        <div
          className="bg-cyan-500 h-3 rounded-full"
          style={{ width: `${course.progress}%` }}
        ></div>
      </div>
      <button onClick={onDelete} className="mt-4 bg-red-500 text-white p-2 rounded">Delete</button>
    </div>
  );
}
