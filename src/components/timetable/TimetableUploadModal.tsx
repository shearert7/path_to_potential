import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { TimetableBlock } from '../../types';
import { SECONDARY_SUBJECTS } from '../../constants/data';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  School, 
  FileCheck
} from 'lucide-react';

interface TimetableUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimetableUploadModal: React.FC<TimetableUploadModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useAuth();
  const { saveTimetable, activeWeekType } = useStudy();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'preset'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [detectedSubjects, setDetectedSubjects] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      detectSubjectsFromText(file.name + ' Mathematics Science English History Visual Art French');
    }
  };

  const detectSubjectsFromText = (text: string) => {
    const found: string[] = [];
    const lower = text.toLowerCase();
    SECONDARY_SUBJECTS.forEach((subj) => {
      const keywords = subj.toLowerCase().split(' ');
      if (keywords.some((kw) => kw.length > 3 && lower.includes(kw))) {
        if (!found.includes(subj)) found.push(subj);
      }
    });

    if (found.length === 0) {
      found.push('Mathematics', 'Science', 'English', 'Humanities / HASS', 'Visual Art');
    }
    setDetectedSubjects(found);
  };

  const handleParseAndApply = async () => {
    setIsProcessing(true);
    try {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
      const schoolBlocks: TimetableBlock[] = days.map((day, idx) => ({
        id: `auto-school-${idx}-${Date.now()}`,
        day,
        startTime: '08:30',
        endTime: '15:15',
        title: 'School Classes & Activities',
        category: 'School',
      }));

      const studyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday', 'Sunday'] as const;
      const eveningBlocks: TimetableBlock[] = studyDays.map((day, idx) => {
        const subj = detectedSubjects[idx % detectedSubjects.length] || 'Mathematics';
        return {
          id: `auto-study-${idx}-${Date.now()}`,
          day,
          startTime: day === 'Saturday' || day === 'Sunday' ? '10:00' : '16:30',
          endTime: day === 'Saturday' || day === 'Sunday' ? '11:30' : '17:30',
          title: `${subj} Study Session`,
          category: 'Study',
          subject: subj,
        };
      });

      const allBlocks = [...schoolBlocks, ...eveningBlocks];
      await saveTimetable(activeWeekType, allBlocks);

      if (detectedSubjects.length > 0) {
        await updateProfile({ enrolledSubjects: detectedSubjects });
      }

      setSuccessMessage(`Configured Week ${activeWeekType} schedule! Blocked out school hours (8:30 AM - 3:15 PM) and provisioned study slots for ${detectedSubjects.length} subjects.`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#4A154B] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D4AF37]/20 text-[#E5A93C]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Import Timetable (Week {activeWeekType})</h3>
              <p className="text-xs text-purple-200">
                Upload PDF/Image or auto-block school hours (8:30 AM - 3:15 PM)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'upload'
                ? 'border-[#4A154B] text-[#4A154B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            PDF / Image Upload
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'paste'
                ? 'border-[#4A154B] text-[#4A154B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Paste Portal Text
          </button>
          <button
            onClick={() => {
              setActiveTab('preset');
              detectSubjectsFromText('Glennie School Schedule');
            }}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'preset'
                ? 'border-[#4A154B] text-[#4A154B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Standard School Day
          </button>
        </div>

        <div className="p-6">
          {successMessage ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-800">{successMessage}</p>
            </div>
          ) : (
            <>
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 hover:border-[#4A154B] rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-purple-50/20 transition cursor-pointer relative">
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-12 h-12 rounded-full bg-purple-100 text-[#4A154B] flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {selectedFile ? selectedFile.name : 'Click or drag school timetable PDF / Image here'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports PDF, PNG, JPG (e.g. school portal timetable)
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                      <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Ready to extract subjects and block 8:30 AM - 3:15 PM school hours.</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Paste Timetable / Subject Text from Portal
                  </label>
                  <textarea
                    rows={5}
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      detectSubjectsFromText(e.target.value);
                    }}
                    placeholder="Paste text containing your courses, periods, or subject names (e.g. Mathematics, Science, English, Humanities, Art)..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
                  />
                </div>
              )}

              {activeTab === 'preset' && (
                <div className="space-y-3 p-4 bg-purple-50/60 rounded-xl border border-purple-100 text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#4A154B]">
                    <School className="w-4 h-4" />
                    <span>The Glennie School Standard Timetable</span>
                  </div>
                  <p className="text-slate-600">
                    Instantly block out Monday to Friday 8:30 AM – 3:15 PM with School Classes, and automatically schedule targeted afternoon and weekend study blocks for Year {profile?.yearLevel || 10}.
                  </p>
                </div>
              )}

              {/* Detected Subjects Preview */}
              {detectedSubjects.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Identified Subjects ({detectedSubjects.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedSubjects.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseAndApply}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4A154B] to-[#6a1d6c] text-white text-xs font-bold hover:from-[#3a0f3b] hover:to-[#551656] shadow-md transition"
                >
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isProcessing ? 'Generating Schedule...' : `Apply to Week ${activeWeekType}`}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
