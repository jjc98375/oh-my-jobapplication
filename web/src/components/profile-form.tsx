"use client";

import { useState } from "react";
import type { Profile, WorkExperience, Education } from "@/lib/types";

export function ProfileForm({ initial }: { initial: Profile }) {
  const [profile, setProfile] = useState<Profile>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved!" : "Failed to save.");
  }

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function addExperience() {
    updateField("work_experience", [
      ...profile.work_experience,
      { title: "", company: "", start_date: "", end_date: null, description: "" },
    ]);
  }

  function updateExperience(index: number, field: keyof WorkExperience, value: string | null) {
    const updated = [...profile.work_experience];
    updated[index] = { ...updated[index], [field]: value };
    updateField("work_experience", updated);
  }

  function removeExperience(index: number) {
    updateField("work_experience", profile.work_experience.filter((_, i) => i !== index));
  }

  function addEducation() {
    updateField("education", [
      ...profile.education,
      { school: "", degree: "", field: "", start_date: "", end_date: null, gpa: null },
    ]);
  }

  function updateEducation(index: number, field: keyof Education, value: string | null) {
    const updated = [...profile.education];
    updated[index] = { ...updated[index], [field]: value };
    updateField("education", updated);
  }

  function removeEducation(index: number) {
    updateField("education", profile.education.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-8">
      {/* Personal Info */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input type="tel" className="w-full border rounded px-3 py-2" value={profile.phone ?? ""} onChange={(e) => updateField("phone", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input type="text" className="w-full border rounded px-3 py-2" placeholder="City, State" value={profile.location ?? ""} onChange={(e) => updateField("location", e.target.value)} />
          </div>
        </div>
      </section>

      {/* Work Experience */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Work Experience</h2>
          <button onClick={addExperience} className="text-sm text-blue-600 hover:underline">+ Add Experience</button>
        </div>
        {profile.work_experience.map((exp, i) => (
          <div key={i} className="border rounded p-4 mb-3 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Experience #{i + 1}</span>
              <button onClick={() => removeExperience(i)} className="text-sm text-red-500">Remove</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Job Title" className="border rounded px-3 py-2" value={exp.title} onChange={(e) => updateExperience(i, "title", e.target.value)} />
              <input placeholder="Company" className="border rounded px-3 py-2" value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} />
              <input type="date" className="border rounded px-3 py-2" value={exp.start_date} onChange={(e) => updateExperience(i, "start_date", e.target.value)} />
              <input type="date" className="border rounded px-3 py-2" value={exp.end_date ?? ""} onChange={(e) => updateExperience(i, "end_date", e.target.value || null)} />
            </div>
            <textarea placeholder="Description" className="w-full border rounded px-3 py-2" rows={3} value={exp.description} onChange={(e) => updateExperience(i, "description", e.target.value)} />
          </div>
        ))}
      </section>

      {/* Education */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Education</h2>
          <button onClick={addEducation} className="text-sm text-blue-600 hover:underline">+ Add Education</button>
        </div>
        {profile.education.map((edu, i) => (
          <div key={i} className="border rounded p-4 mb-3 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Education #{i + 1}</span>
              <button onClick={() => removeEducation(i)} className="text-sm text-red-500">Remove</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="School" className="border rounded px-3 py-2" value={edu.school} onChange={(e) => updateEducation(i, "school", e.target.value)} />
              <input placeholder="Degree" className="border rounded px-3 py-2" value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} />
              <input placeholder="Field of Study" className="border rounded px-3 py-2" value={edu.field} onChange={(e) => updateEducation(i, "field", e.target.value)} />
              <input placeholder="GPA" className="border rounded px-3 py-2" value={edu.gpa ?? ""} onChange={(e) => updateEducation(i, "gpa", e.target.value || null)} />
            </div>
          </div>
        ))}
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Skills</h2>
        <input type="text" className="w-full border rounded px-3 py-2" placeholder="Comma-separated: TypeScript, React, Python..." value={profile.skills.join(", ")} onChange={(e) => updateField("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
      </section>

      {/* Job Preferences */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Job Preferences</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Work Authorization</label>
            <select className="w-full border rounded px-3 py-2" value={profile.work_authorization ?? ""} onChange={(e) => updateField("work_authorization", e.target.value)}>
              <option value="">Select...</option>
              <option value="US Citizen">US Citizen</option>
              <option value="Permanent Resident">Permanent Resident</option>
              <option value="H1B Visa">H1B Visa</option>
              <option value="OPT/CPT">OPT/CPT</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="relocate" checked={profile.willing_to_relocate} onChange={(e) => updateField("willing_to_relocate", e.target.checked)} />
            <label htmlFor="relocate" className="text-sm">Willing to relocate</label>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Profile"}
        </button>
        {message && <span className="text-sm text-green-600">{message}</span>}
      </div>
    </div>
  );
}
