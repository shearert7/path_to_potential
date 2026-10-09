import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { SECONDARY_SUBJECTS, getSubjectsForYear } from '../../constants/data';
import { X, Plus, Calendar, Clock, BookOpen, FileText, CheckCircle2 } from 'lucide-react';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualLogModal: React.FC<ManualLogModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const { addStudyLog, currentWeek, currentTerm, getWeeksForTerm } = useStudy();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [subject, setSubject] = useState<string>(
    profile?.enrolledSubjects?.[0] || 'Mathematics'
  );
  const [termNumber, setTermNumber] = useState<number>(currentTerm);
  const [weekNumber, setWeekNumber] = useState<number>(currentWeek);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const availableWeeks = getWeeksForTerm(termNumber);

  const yearSubjects = getSubjectsForYear(profile?.yearLevel);
  const enrolled = profile?.enrolledSubjects || [];
  const subjectOptions = Array.from(new Set([...enrolled.filter(s => yearSubjects.includes(s)), ...yearSubjects]));

  const quickMinutes = [30, 45, 60, 90, 120];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (durationMinutes <= 0) {
      alert('Please enter a duration greater than 0 minutes.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addStudyLog({
        date,
        subject,
        durationMinutes: Number(durationMinutes),
        termNumber: Number(termNumber),
        weekNumber: Number(weekNumber),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to log manual study session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#4A154B] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D4AF37]/20 text-[#E5A93C]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Manual Study Entry</h3>
              <p className="text-xs text-purple-200">Log past study hours to your academic log sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#4A154B]" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
              />
            </div>

            {/* Term & Week */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Term & Week
              </label>
              <div className="flex gap-2">
                <select
                  value={termNumber}
                  onChange={(e) => setTermNumber(Number(e.target.value))}
                  className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
                >
                  {[1, 2, 3, 4].map((t) => (
                    <option key={t} value={t}>Term {t}</option>
                  ))}
                </select>
                <select
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(Number(e.target.value))}
                  className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
                >
                  {availableWeeks.map((w) => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5 text-[#4A154B]" />
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
            >
              {subjectOptions.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-[#4A154B]" />
                Duration (Minutes)
              </label>
              <span className="text-xs font-bold text-[#4A154B]">
                {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m ({durationMinutes} mins)
              </span>
            </div>
            <input
              type="number"
              min="5"
              max="600"
              step="5"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
            />
            {/* Quick Chips */}
            <div className="flex gap-1.5 mt-2">
              {quickMinutes.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-2 py-1 text-xs font-semibold rounded-lg border transition ${
                    durationMinutes === mins
                      ? 'bg-[#4A154B] text-white border-[#4A154B]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Reflection Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Notes / Focus (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Completed textbook review, worked examples, homework assignment"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4A154B] to-[#6c1e6e] text-white text-sm font-bold shadow-md hover:from-[#3a0f3b] hover:to-[#551656] transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Add to Study Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
