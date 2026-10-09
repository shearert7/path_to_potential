import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TimetableBlock, TimetableCategory } from '../../types';
import { TIMETABLE_CATEGORY_CONFIG, getSubjectsForYear } from '../../constants/data';
import { X, Check, Trash2, Calendar, Clock, Tag, BookOpen } from 'lucide-react';

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: TimetableBlock) => void;
  onDelete?: (blockId: string) => void;
  initialBlock?: Partial<TimetableBlock> | null;
}

const DAYS: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const BlockModal: React.FC<BlockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialBlock,
}) => {
  const { profile } = useAuth();
  const yearSubjects = getSubjectsForYear(profile?.yearLevel);
  const enrolled = profile?.enrolledSubjects || [];
  // Show enrolled subjects at the top, then remaining subjects for that year level
  const availableSubjects = Array.from(new Set([...enrolled.filter(s => yearSubjects.includes(s)), ...yearSubjects]));

  const [day, setDay] = useState<TimetableBlock['day']>('Monday');
  const [startTime, setStartTime] = useState<string>('16:00');
  const [endTime, setEndTime] = useState<string>('17:30');
  const [title, setTitle] = useState<string>('Study Session');
  const [category, setCategory] = useState<TimetableCategory>('Study');
  const [subject, setSubject] = useState<string>('');

  useEffect(() => {
    if (initialBlock) {
      if (initialBlock.day) setDay(initialBlock.day);
      if (initialBlock.startTime) setStartTime(initialBlock.startTime);
      if (initialBlock.endTime) setEndTime(initialBlock.endTime);
      if (initialBlock.title) setTitle(initialBlock.title);
      if (initialBlock.category) setCategory(initialBlock.category);
      setSubject(initialBlock.subject || '');
    } else {
      setDay('Monday');
      setStartTime('16:00');
      setEndTime('17:30');
      setTitle('Study Session');
      setCategory('Study');
      setSubject('');
    }
  }, [initialBlock, isOpen]);

  if (!isOpen) return null;

  const handleSubjectChange = (newSubj: string) => {
    setSubject(newSubj);
    if (!initialBlock?.id && (title === 'Study Session' || title.endsWith(' Study'))) {
      setTitle(newSubj ? `${newSubj} Study` : 'Study Session');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = initialBlock?.id || 'blk-' + Date.now();
    onSave({
      id,
      day,
      startTime,
      endTime,
      title: title.trim() || 'Study Session',
      category,
      subject: category === 'Study' && subject.trim() ? subject.trim() : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#4A154B] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white">
              {initialBlock?.id ? 'Edit Timetable Block' : 'Add Timetable Block'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-purple-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Day */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#4A154B]" />
              Day of Week
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as TimetableBlock['day'])}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#4A154B] focus:outline-none"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#4A154B] focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#4A154B] focus:outline-none"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TimetableCategory)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#4A154B] focus:outline-none"
            >
              {(Object.keys(TIMETABLE_CATEGORY_CONFIG) as TimetableCategory[]).map((catKey) => (
                <option key={catKey} value={catKey}>
                  {TIMETABLE_CATEGORY_CONFIG[catKey].label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Block Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mathematics Practice, Class Period 3, Homework"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-[#4A154B] focus:outline-none"
            />
          </div>

          {/* Subject (if study - optional) */}
          {category === 'Study' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-[#4A154B]" />
                  Subject (Optional)
                </label>
                <span className="text-[11px] text-slate-400">Year {profile?.yearLevel || 10}</span>
              </div>
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#4A154B] focus:outline-none"
              >
                <option value="">-- No Subject / General Study (Optional) --</option>
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between">
            {initialBlock?.id && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this block from your timetable?')) {
                    onDelete(initialBlock.id!);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#4A154B] text-white text-xs font-bold hover:bg-[#380e39] transition shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Save Block</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
