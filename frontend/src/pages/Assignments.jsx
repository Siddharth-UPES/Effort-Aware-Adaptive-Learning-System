import React, { useState } from "react";

export default function Assignments() {
  const [assignments, setAssignments] = useState([
    { title: "ML Assignment", due: "12 May" },
    { title: "DL Quiz", due: "15 May" },
    { title: "Project Report", due: "20 May" },
  ]);

  const [newAssignment, setNewAssignment] = useState({ title: "", due: "" });

  const addAssignment = () => {
    if (newAssignment.title && newAssignment.due) {
      setAssignments([...assignments, newAssignment]);
      setNewAssignment({ title: "", due: "" });
    }
  };

  const updateAssignment = (index, field, value) => {
    const updated = [...assignments];
    updated[index][field] = value;
    setAssignments(updated);
  };

  const deleteAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-10">
      <h1 className="text-4xl font-bold mb-8">Assignments</h1>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Add New Assignment</h2>
        <input
          type="text"
          placeholder="Assignment Title"
          value={newAssignment.title}
          onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
          className="p-2 border rounded mr-2"
        />
        <input
          type="text"
          placeholder="Due Date"
          value={newAssignment.due}
          onChange={(e) => setNewAssignment({ ...newAssignment, due: e.target.value })}
          className="p-2 border rounded mr-2"
        />
        <button onClick={addAssignment} className="bg-blue-500 text-white p-2 rounded">Add Assignment</button>
      </div>

      <div className="space-y-5">
        {assignments.map((assignment, index) => (
          <Assignment
            key={index}
            assignment={assignment}
            onUpdate={(field, value) => updateAssignment(index, field, value)}
            onDelete={() => deleteAssignment(index)}
          />
        ))}
      </div>
    </div>
  );
}

function Assignment({ assignment, onUpdate, onDelete }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center">
      <div>
        <input
          type="text"
          value={assignment.title}
          onChange={(e) => onUpdate("title", e.target.value)}
          className="text-xl font-semibold border rounded p-1 mr-4"
        />
        <input
          type="text"
          value={assignment.due}
          onChange={(e) => onUpdate("due", e.target.value)}
          className="text-red-500 font-semibold border rounded p-1"
        />
      </div>
      <button onClick={onDelete} className="bg-red-500 text-white p-2 rounded">Delete</button>
    </div>
  );
}
