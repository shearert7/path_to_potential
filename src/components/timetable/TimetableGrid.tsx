import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { TimetableBlock, TimetableCategory } from '../../types';
import { TIMETABLE_CATEGORY_CONFIG } from '../../constants/data';
import { BlockModal } from './BlockModal';
import { TimetableUploadModal } from './TimetableUploadModal';
import { CalendarSyncModal } from './CalendarSyncModal';
import { 
  Plus, 
  Upload, 
  Printer, 
  Copy, 
  Calendar, 
  School, 
  Target, 
  Check,
  GripHorizontal
} from 'lucide-react';

interface TimetableGridProps {
  onOpenPrint: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

// 05:00 to 23:00 (300 to 1380 mins)
const START_HOUR = 5;
const END_HOUR = 23;
const START_MINUTES = START_HOUR * 60; // 300
const END_MINUTES = END_HOUR * 60;     // 1380
const ROW_HEIGHT = 44;                 // 44px per 30 minutes
const MINUTE_HEIGHT = ROW_HEIGHT / 30; // 1.4667px per minute

const TIME_SLOTS: string[] = [];
for (let hour = START_HOUR; hour < END_HOUR; hour++) {
  const hStr = hour.toString().padStart(2, '0');
  TIME_SLOTS.push(`${hStr}:00`);
  TIME_SLOTS.push(`${hStr}:30`);
}

function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeString(minutes: number): string {
  const clamped = Math.max(START_MINUTES, Math.min(END_MINUTES, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({ onOpenPrint }) => {
  const { profile } = useAuth();
  const {
    timetableBlocksA,
    timetableBlocksB,
    activeWeekType,
    setActiveWeekType,
    saveTimetable,
    prefillSchoolHours,
  } = useStudy();

  const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);
  const [selectedBlock, setSelectedBlock] = useState<Partial<TimetableBlock> | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  // Live drag state
  const [dragState, setDragState] = useState<{
    blockId: string;
    action: 'move' | 'resize-top' | 'resize-bottom';
    initialDay: TimetableBlock['day'];
    currentDay: TimetableBlock['day'];
    initialStartMins: number;
    initialEndMins: number;
    currentStartMins: number;
    currentEndMins: number;
    startY: number;
    startX: number;
    hasMoved: boolean;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const currentBlocks = activeWeekType === 'A' ? timetableBlocksA : timetableBlocksB;

  const plannedStudyMins = currentBlocks
    .filter((b) => b.category === 'Study')
    .reduce((sum, b) => {
      const sh = timeStringToMinutes(b.startTime);
      const eh = timeStringToMinutes(b.endTime);
      return sum + Math.max(0, eh - sh);
    }, 0);
  const plannedStudyHours = Math.round((plannedStudyMins / 60) * 10) / 10;
  const targetGoal = profile?.weeklyGoal || 15;

  const triggerSavedBadge = () => {
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  const handleSaveBlock = async (block: TimetableBlock) => {
    const existingIndex = currentBlocks.findIndex((b) => b.id === block.id);
    let updated: TimetableBlock[];
    if (existingIndex >= 0) {
      updated = [...currentBlocks];
      updated[existingIndex] = block;
    } else {
      updated = [...currentBlocks, block];
    }
    await saveTimetable(activeWeekType, updated);
    triggerSavedBadge();
  };

  const handleDeleteBlock = async (blockId: string) => {
    const updated = currentBlocks.filter((b) => b.id !== blockId);
    await saveTimetable(activeWeekType, updated);
    triggerSavedBadge();
  };

  const handleCopyWeek = async () => {
    if (activeWeekType === 'A') {
      if (confirm('Copy Week A timetable schedule into Week B?')) {
        await saveTimetable('B', [...timetableBlocksA]);
        alert('Week A timetable copied to Week B!');
      }
    } else {
      if (confirm('Copy Week B timetable schedule into Week A?')) {
        await saveTimetable('A', [...timetableBlocksB]);
        alert('Week B timetable copied to Week A!');
      }
    }
  };

  // Drag interaction listeners
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaY = e.clientY - dragState.startY;
      // Convert pixel delta to 15-minute increments
      const rawDeltaMins = deltaY / MINUTE_HEIGHT;
      const snappedDeltaMins = Math.round(rawDeltaMins / 15) * 15;

      const hasMoved = Math.abs(deltaY) > 3 || Math.abs(e.clientX - dragState.startX) > 10;

      // Detect day column under cursor if moving
      let newDay = dragState.currentDay;
      if (dragState.action === 'move' && gridRef.current) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const dayCol = elements.find((el) => el.getAttribute('data-day'));
        if (dayCol) {
          const dayAttr = dayCol.getAttribute('data-day') as TimetableBlock['day'];
          if (dayAttr && DAYS.includes(dayAttr)) {
            newDay = dayAttr;
          }
        }
      }

      if (dragState.action === 'move') {
        const duration = dragState.initialEndMins - dragState.initialStartMins;
        const newStart = Math.max(
          START_MINUTES,
          Math.min(END_MINUTES - duration, dragState.initialStartMins + snappedDeltaMins)
        );
        const newEnd = newStart + duration;

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentStartMins: newStart,
                currentEndMins: newEnd,
                currentDay: newDay,
                hasMoved: prev.hasMoved || hasMoved,
              }
            : null
        );
      } else if (dragState.action === 'resize-bottom') {
        const newEnd = Math.max(
          dragState.initialStartMins + 15,
          Math.min(END_MINUTES, dragState.initialEndMins + snappedDeltaMins)
        );

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentEndMins: newEnd,
                hasMoved: prev.hasMoved || hasMoved,
              }
            : null
        );
      } else if (dragState.action === 'resize-top') {
        const newStart = Math.min(
          dragState.initialEndMins - 15,
          Math.max(START_MINUTES, dragState.initialStartMins + snappedDeltaMins)
        );

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentStartMins: newStart,
                hasMoved: prev.hasMoved || hasMoved,
              }
            : null
        );
      }
    };

    const handlePointerUp = async () => {
      if (dragState && dragState.hasMoved) {
        // Persist the moved/resized block
        const block = currentBlocks.find((b) => b.id === dragState.blockId);
        if (block) {
          const updated: TimetableBlock = {
            ...block,
            day: dragState.currentDay,
            startTime: minutesToTimeString(dragState.currentStartMins),
            endTime: minutesToTimeString(dragState.currentEndMins),
          };
          const updatedBlocks = currentBlocks.map((b) =>
            b.id === block.id ? updated : b
          );
          await saveTimetable(activeWeekType, updatedBlocks);
          triggerSavedBadge();
        }
      } else if (dragState && !dragState.hasMoved) {
        // Just clicked - open edit modal
        const block = currentBlocks.find((b) => b.id === dragState.blockId);
        if (block) {
          setSelectedBlock(block);
          setIsBlockModalOpen(true);
        }
      }
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, currentBlocks, activeWeekType, saveTimetable]);

  const handleStartDrag = (
    e: React.PointerEvent,
    block: TimetableBlock,
    action: 'move' | 'resize-top' | 'resize-bottom'
  ) => {
    e.stopPropagation();
    const startMins = timeStringToMinutes(block.startTime);
    const endMins = timeStringToMinutes(block.endTime);

    setDragState({
      blockId: block.id,
      action,
      initialDay: block.day,
      currentDay: block.day,
      initialStartMins: startMins,
      initialEndMins: endMins,
      currentStartMins: startMins,
      currentEndMins: endMins,
      startY: e.clientY,
      startX: e.clientX,
      hasMoved: false,
    });
  };

  const handleEmptySlotClick = (day: TimetableBlock['day'], timeStr: string) => {
    if (dragState) return;
    const [h, m] = timeStr.split(':').map(Number);
    const endM = m + 30 === 60 ? '00' : '30';
    const endH = (m + 30 === 60 ? h + 1 : h).toString().padStart(2, '0');
    setSelectedBlock({
      day,
      startTime: timeStr,
      endTime: `${endH}:${endM}`,
      category: 'Study',
      title: 'Study Session',
    });
    setIsBlockModalOpen(true);
  };

  return (
    <div className="space-y-4 select-none">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Week Toggle & Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-purple-50 rounded-xl border border-purple-100">
            <button
              onClick={() => setActiveWeekType('A')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeWeekType === 'A'
                  ? 'bg-[#4A154B] text-white shadow-sm'
                  : 'text-purple-900 hover:bg-purple-100/60'
              }`}
            >
              Week A Schedule
            </button>
            <button
              onClick={() => setActiveWeekType('B')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeWeekType === 'B'
                  ? 'bg-[#4A154B] text-white shadow-sm'
                  : 'text-purple-900 hover:bg-purple-100/60'
              }`}
            >
              Week B Schedule
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <Target className="w-4 h-4 text-amber-600" />
            <span className="text-slate-600 font-medium">Planned Study:</span>
            <span className="font-extrabold text-[#4A154B]">
              {plannedStudyHours} hrs
            </span>
            <span className="text-slate-400">/ {targetGoal}h Goal</span>
            {plannedStudyHours >= targetGoal && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                Target Met
              </span>
            )}
          </div>

          {isSavedFeedback && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              Saved to Cloud
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Google Calendar Sync Button */}
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#4A154B] border border-purple-300 text-xs font-bold transition shadow-sm"
            title="Integrate with Google Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Google Calendar Sync</span>
          </button>

          {/* Pre-fill School Day */}
          <button
            onClick={() => prefillSchoolHours(activeWeekType)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition"
            title="Pre-fill Monday-Friday 8:30 AM - 3:15 PM with School Hours"
          >
            <School className="w-3.5 h-3.5 text-[#4A154B]" />
            <span>Block School (8:30-3:15)</span>
          </button>

          {/* Import / Upload PDF */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition border border-slate-200"
          >
            <Upload className="w-3.5 h-3.5 text-purple-700" />
            <span>Import Timetable PDF</span>
          </button>

          {/* Copy Week A to B */}
          <button
            onClick={handleCopyWeek}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            title="Copy this week schedule to the alternate week"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync to Week {activeWeekType === 'A' ? 'B' : 'A'}</span>
          </button>

          {/* Print / Export */}
          <button
            onClick={onOpenPrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5A93C] text-purple-950 text-xs font-bold shadow-sm hover:brightness-105 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View / PDF</span>
          </button>

          {/* Add Block */}
          <button
            onClick={() => {
              setSelectedBlock({
                day: 'Monday',
                startTime: '16:00',
                endTime: '17:30',
                category: 'Study',
                title: 'Study Session',
              });
              setIsBlockModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#4A154B] hover:bg-[#380e39] text-white text-xs font-bold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event Block</span>
          </button>
        </div>
      </div>

      {/* Legend & Drag Hint Bar */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
            Categories:
          </span>
          {(Object.keys(TIMETABLE_CATEGORY_CONFIG) as TimetableCategory[]).map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded ${TIMETABLE_CATEGORY_CONFIG[cat].badge}`} />
              <span className="font-semibold text-slate-700">{cat}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
          <GripHorizontal className="w-3.5 h-3.5 text-amber-600" />
          <span>Drag sessions to move (15-min snaps) • Drag top or bottom handle to extend</span>
        </div>
      </div>

      {/* Interactive Drag & Resize Timetable Grid */}
      <div ref={gridRef} className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[950px]">
            {/* Days Header */}
            <div className="grid grid-cols-8 bg-[#4A154B] text-white sticky top-0 z-30 shadow-sm border-b border-[#D4AF37]/50">
              <div className="p-3 text-center text-xs font-bold text-amber-200/80 border-r border-white/10 flex items-center justify-center">
                Time
              </div>
              {DAYS.map((day) => {
                const dayStudyHours = currentBlocks
                  .filter((b) => b.day === day && b.category === 'Study')
                  .reduce((sum, b) => {
                    const sh = timeStringToMinutes(b.startTime);
                    const eh = timeStringToMinutes(b.endTime);
                    return sum + (eh - sh) / 60;
                  }, 0);

                return (
                  <div
                    key={day}
                    className="p-3 text-center text-xs font-bold border-r last:border-r-0 border-white/10"
                  >
                    <span className="block text-white font-extrabold">{day}</span>
                    <span className="text-[10px] text-amber-200/70 font-medium">
                      {dayStudyHours.toFixed(1)}h study
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Timetable Body (Rows + Absolute Columns) */}
            <div className="relative flex">
              {/* Left Time Labels Column */}
              <div className="w-[12.5%] flex-shrink-0 border-r border-slate-200 bg-slate-50/70 select-none">
                {TIME_SLOTS.map((timeStr) => {
                  const isHour = timeStr.endsWith(':00');
                  return (
                    <div
                      key={timeStr}
                      style={{ height: `${ROW_HEIGHT}px` }}
                      className={`text-center text-[11px] font-mono border-b border-slate-100 flex items-center justify-center ${
                        isHour
                          ? 'font-bold text-[#4A154B] bg-slate-100/90'
                          : 'text-slate-400'
                      }`}
                    >
                      {timeStr}
                    </div>
                  );
                })}
              </div>

              {/* 7 Day Columns */}
              <div className="flex-1 grid grid-cols-7 relative">
                {DAYS.map((day) => {
                  const dayBlocks = currentBlocks.filter((b) => {
                    if (dragState && dragState.blockId === b.id) {
                      return dragState.currentDay === day;
                    }
                    return b.day === day;
                  });

                  return (
                    <div
                      key={day}
                      data-day={day}
                      className="relative border-r last:border-r-0 border-slate-200 bg-white"
                      style={{ height: `${TIME_SLOTS.length * ROW_HEIGHT}px` }}
                    >
                      {/* Background Grid Lines (30-min and 15-min sub-markers) */}
                      {TIME_SLOTS.map((timeStr) => (
                        <div
                          key={timeStr}
                          style={{ height: `${ROW_HEIGHT}px` }}
                          onClick={() => handleEmptySlotClick(day, timeStr)}
                          className="border-b border-slate-100 relative cursor-pointer hover:bg-amber-50/20 transition group"
                        >
                          {/* 15-min subtle dashed divider */}
                          <div
                            className="absolute top-1/2 inset-x-0 border-b border-dashed border-slate-100/80 pointer-events-none"
                            style={{ top: '22px' }}
                          />
                        </div>
                      ))}

                      {/* Render Event Blocks in this Day */}
                      {dayBlocks.map((block) => {
                        const isBeingDragged = dragState?.blockId === block.id;
                        const startMins = isBeingDragged
                          ? dragState.currentStartMins
                          : timeStringToMinutes(block.startTime);
                        const endMins = isBeingDragged
                          ? dragState.currentEndMins
                          : timeStringToMinutes(block.endTime);

                        const durationMins = Math.max(15, endMins - startMins);
                        const topPx = (startMins - START_MINUTES) * MINUTE_HEIGHT;
                        const heightPx = Math.max(22, durationMins * MINUTE_HEIGHT - 3);

                        const catConfig =
                          TIMETABLE_CATEGORY_CONFIG[block.category] ||
                          TIMETABLE_CATEGORY_CONFIG['Study'];

                        return (
                          <div
                            key={block.id}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                            }}
                            onPointerDown={(e) => handleStartDrag(e, block, 'move')}
                            className={`absolute inset-x-1 z-20 rounded-lg p-1.5 shadow-sm transition-all duration-75 overflow-hidden group cursor-grab active:cursor-grabbing border ${
                              catConfig.bg
                            } ${catConfig.border} ${catConfig.text} ${
                              isBeingDragged
                                ? 'ring-2 ring-[#4A154B] shadow-2xl scale-[1.02] z-30 opacity-95'
                                : 'hover:shadow-md'
                            }`}
                          >
                            {/* TOP RESIZE HANDLE (drag up/down to adjust startTime in 15-min increments) */}
                            <div
                              onPointerDown={(e) => handleStartDrag(e, block, 'resize-top')}
                              className="absolute -top-1 inset-x-0 h-3.5 cursor-ns-resize hover:bg-black/20 z-30 flex items-center justify-center opacity-40 group-hover:opacity-100 transition touch-none"
                              title="Drag top edge to extend/shorten start time (15-min intervals)"
                            >
                              <div className="w-8 h-1 bg-black/50 rounded-full shadow-xs" />
                            </div>

                            {/* Block Header info */}
                            <div className="flex items-center justify-between text-[10px] leading-none mb-0.5 pointer-events-none opacity-85">
                              <span className="font-bold">
                                {isBeingDragged
                                  ? `${minutesToTimeString(startMins)} - ${minutesToTimeString(endMins)}`
                                  : `${block.startTime} - ${block.endTime}`}
                              </span>
                              <span className={`px-1 rounded text-[9px] font-bold ${catConfig.badge}`}>
                                {block.category}
                              </span>
                            </div>

                            {/* Title & Subject */}
                            <div className="font-bold text-xs truncate leading-tight pointer-events-none">
                              {block.title}
                            </div>
                            {block.subject && (
                              <div className="text-[10px] text-amber-800 font-semibold truncate pointer-events-none">
                                {block.subject}
                              </div>
                            )}

                            {/* Live Dragging Floating Badge */}
                            {isBeingDragged && (
                              <div className="absolute bottom-2 right-2 bg-[#4A154B] text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow animate-in fade-in">
                                {Math.floor(durationMins / 60)}h {durationMins % 60}m
                              </div>
                            )}

                            {/* BOTTOM RESIZE HANDLE (drag down/up to extend/shrink endTime in 15-min increments) */}
                            <div
                              onPointerDown={(e) => handleStartDrag(e, block, 'resize-bottom')}
                              className="absolute -bottom-1 inset-x-0 h-3.5 cursor-ns-resize hover:bg-black/20 z-30 flex items-center justify-center opacity-40 group-hover:opacity-100 transition touch-none"
                              title="Drag bottom edge to extend/shorten end time (15-min intervals)"
                            >
                              <div className="w-8 h-1 bg-black/50 rounded-full shadow-xs" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Block Edit / Add Modal */}
      <BlockModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
        initialBlock={selectedBlock}
      />

      {/* Timetable PDF / Image Import Modal */}
      <TimetableUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Google Calendar Sync Modal */}
      <CalendarSyncModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        blocks={currentBlocks}
        weekType={activeWeekType}
      />
    </div>
  );
};
