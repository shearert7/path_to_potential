import React, { useState } from 'react';
import { EDUCATIONAL_RATIONALE } from '../../constants/data';
import { 
  X, 
  BookOpen, 
  Brain, 
  Clock, 
  Heart, 
  Sparkles, 
  GraduationCap, 
  CheckCircle2,
  Compass,
  ArrowRight
} from 'lucide-react';

interface AcademicRationaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcademicRationaleModal: React.FC<AcademicRationaleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'pillars' | 'benchmarks' | 'science'>('pillars');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-purple-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#4A154B] to-[#350B36] text-white flex items-start justify-between relative border-b-2 border-[#D4AF37]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-purple-950 font-sans">
                Pedagogical Foundations
              </span>
              <span className="text-xs text-purple-200 font-semibold">
                Years 7 to 12
              </span>
            </div>
            <h2 className="text-xl font-bold font-serif tracking-tight text-white">
              {EDUCATIONAL_RATIONALE.title}
            </h2>
            <p className="text-xs text-purple-200 mt-1 max-w-xl leading-relaxed">
              {EDUCATIONAL_RATIONALE.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition ml-4 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pillars')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'pillars'
                ? 'border-[#4A154B] text-[#4A154B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>5 Core Pillars</span>
          </button>
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'benchmarks'
                ? 'border-[#4A154B] text-[#4A154B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Graduated Hour Benchmarks</span>
          </button>
          <button
            onClick={() => setActiveTab('science')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'science'
                ? 'border-[#4A154B] text-[#4A154B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Research & Evidence</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* TAB 1: Core Pillars */}
          {activeTab === 'pillars' && (
            <div className="space-y-4">
              <p className="text-slate-600 italic border-l-2 border-[#D4AF37] pl-3 py-0.5">
                Path to Potential transforms study from an anxious, reactive task into an empowered, routine habit. Success is built through predictability, deliberate practice, and cognitive self-regulation.
              </p>

              <div className="grid grid-cols-1 gap-3.5">
                {EDUCATIONAL_RATIONALE.corePillars.map((pillar, idx) => (
                  <div
                    key={pillar.title}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-sm transition"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#4A154B] text-white flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-[#4A154B]">
                        {pillar.title}
                      </h4>
                    </div>
                    <p className="text-slate-600 text-xs mb-2 leading-relaxed">
                      {pillar.description}
                    </p>
                    <div className="text-[11px] font-semibold text-purple-900 bg-purple-50 p-2 rounded-lg border border-purple-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                      <span><strong>Evidence Base:</strong> {pillar.evidence}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Graduated Hour Benchmarks */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  <strong>Why study targets increase incrementally:</strong> Each cohort requires an age-appropriate balance. A Year 7 student building basic homework routines needs 5h/wk, while a Year 12 student balancing senior QCE internal assessments and external exams requires 25h/wk.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EDUCATIONAL_RATIONALE.benchmarks.map((bench) => (
                  <div
                    key={bench.year}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-slate-900 text-base">
                          Year {bench.year}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-[#4A154B] text-white font-extrabold text-xs">
                          {bench.hours}h / week
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-[#D4AF37] uppercase tracking-wider mb-1">
                        {bench.focus}
                      </h5>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {bench.detail}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
                      Approx. {Math.round((bench.hours / 6) * 10) / 10}h daily study (over 6 active days)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Science & Evidence */}
          {activeTab === 'science' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-2">
                <h4 className="font-bold text-sm text-[#4A154B] flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#D4AF37]" />
                  Barry Zimmerman’s Self-Regulated Learning (SRL) Cycle
                </h4>
                <p className="text-xs leading-relaxed text-slate-700">
                  Academic mastery is not an innate trait; it is a metacognitive skill. Path to Potential supports students through the complete self-regulation cycle:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                  <div className="p-2.5 bg-white rounded-lg border border-purple-200">
                    <strong className="text-[#4A154B] block mb-0.5">1. Forethought Phase</strong>
                    Using the Timetable planner to allocate specific study and rest blocks before the week begins.
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-purple-200">
                    <strong className="text-[#4A154B] block mb-0.5">2. Performance Phase</strong>
                    Using the Study Timer to maintain focused, single-tasking deep work without distraction.
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-purple-200">
                    <strong className="text-[#4A154B] block mb-0.5">3. Self-Reflection Phase</strong>
                    Reviewing weekly logged hours against target hours, earning streak medals, and noting weekly insights.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Why Sleep and Wellbeing Are Non-Negotiable
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Neuroscientific research proves that memory consolidation—the neural stabilization of facts and skills acquired during the day—occurs predominantly during slow-wave and REM sleep (Matthew Walker, <em>Why We Sleep</em>). Cutting sleep to cram homework actively degrades synaptic plasticity and recall. Path to Potential deliberately includes Sleep, Sport, and Personal time as core timetable blocks to ensure sustainable high achievement without burnout.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Path to Potential • Academic Excellence with Balance
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#4A154B] text-[#D4AF37] font-bold rounded-xl hover:bg-[#380e39] transition shadow-sm"
          >
            Close Rationale
          </button>
        </div>
      </div>
    </div>
  );
};
