import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { StudyLog, TimetableBlock, TimetableData, StudentCohortRecord, StreakInfo, TeacherRecord } from '../types';
import { DEFAULT_TIMETABLE_SAMPLE, DEMO_COHORT_STUDENTS, DEFAULT_SCHOOL_DAY_BLOCKS, DEFAULT_TEACHERS } from '../constants/data';
import { calculateStreakAndMedals } from '../lib/gamification';

export const DEFAULT_TERM_WEEKS: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  2: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  4: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Queensland Term 4 is traditionally 9 weeks
};

interface StudyContextType {
  studyLogs: StudyLog[];
  timetableBlocksA: TimetableBlock[];
  timetableBlocksB: TimetableBlock[];
  activeWeekType: 'A' | 'B';
  setActiveWeekType: (w: 'A' | 'B') => void;
  addStudyLog: (log: Omit<StudyLog, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  deleteStudyLog: (id: string) => Promise<void>;
  saveTimetable: (weekType: 'A' | 'B', blocks: TimetableBlock[]) => Promise<void>;
  prefillSchoolHours: (weekType: 'A' | 'B') => Promise<void>;
  cohortRecords: StudentCohortRecord[];
  refreshCohortData: () => Promise<void>;
  totalHoursThisWeek: number;
  currentTerm: number;
  currentWeek: number;
  streakInfo: StreakInfo;
  termWeeksConfig: Record<number, number[]>;
  getWeeksForTerm: (termNumber: number) => number[];
  addWeekToTerm: (termNumber: number, weekNum?: number) => void;
  deleteWeekFromTerm: (termNumber: number, weekNumber: number) => void;
  resetTermWeeks: (termNumber: number, count?: number) => void;
  teachers: TeacherRecord[];
  addTeacher: (teacher: Omit<TeacherRecord, 'id' | 'addedAt'>) => Promise<void>;
  updateTeacher: (id: string, updates: Partial<TeacherRecord>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

// Generate sample historical study logs for realistic student experience
const generateInitialSampleLogs = (uid: string): StudyLog[] => {
  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Visual Art'];
  const logs: StudyLog[] = [];

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    logs.push({
      id: `init-log-${i}-1`,
      uid,
      date: dateStr,
      subject: subjects[i % subjects.length],
      durationMinutes: 60 + (i % 3) * 30, // 60 to 120 mins
      weekNumber: 6,
      termNumber: 3,
      notes: `Targeted textbook exercises and revision problems.`,
      createdAt: d.toISOString(),
    });
    
    if (i % 2 === 0) {
      logs.push({
        id: `init-log-${i}-2`,
        uid,
        date: dateStr,
        subject: subjects[(i + 2) % subjects.length],
        durationMinutes: 45,
        weekNumber: 6,
        termNumber: 3,
        notes: `Topic summaries and homework review.`,
        createdAt: d.toISOString(),
      });
    }
  }

  // Generate past weeks logs (Weeks 1 to 5)
  for (let w = 1; w < 6; w++) {
    const weekHoursTarget = 12 + (w % 4) * 2;
    for (let j = 0; j < 5; j++) {
      logs.push({
        id: `init-w${w}-${j}`,
        uid,
        date: `2026-08-${10 + w * 2}`,
        subject: subjects[j % subjects.length],
        durationMinutes: Math.round((weekHoursTarget / 5) * 60),
        weekNumber: w,
        termNumber: 3,
        notes: `Week ${w} core study module.`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return logs;
};

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isDemoUser } = useAuth();
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [timetableBlocksA, setTimetableBlocksA] = useState<TimetableBlock[]>(DEFAULT_TIMETABLE_SAMPLE);
  const [timetableBlocksB, setTimetableBlocksB] = useState<TimetableBlock[]>(DEFAULT_TIMETABLE_SAMPLE);
  const [activeWeekType, setActiveWeekType] = useState<'A' | 'B'>('A');
  const [cohortRecords, setCohortRecords] = useState<StudentCohortRecord[]>(DEMO_COHORT_STUDENTS);

  const currentTerm = 3;
  const currentWeek = 6;

  // Custom term weeks configuration (supports 8, 9, 10 weeks or holiday weeks)
  const [termWeeksConfig, setTermWeeksConfig] = useState<Record<number, number[]>>(() => {
    try {
      const saved = localStorage.getItem('ptp_term_weeks_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_TERM_WEEKS;
  });

  // Teacher roles configuration
  const [teachers, setTeachers] = useState<TeacherRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ptp_teachers_roster');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_TEACHERS;
  });

  // Calculate dynamic weekly streaks & medals based on logged hours and weekly goal
  const streakInfo = React.useMemo(() => {
    const goal = profile?.weeklyGoal || 15;
    return calculateStreakAndMedals(studyLogs, goal, currentTerm, currentWeek);
  }, [studyLogs, profile?.weeklyGoal, currentTerm, currentWeek]);

  const getWeeksForTerm = (termNumber: number): number[] => {
    return termWeeksConfig[termNumber] || DEFAULT_TERM_WEEKS[termNumber] || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  };

  const addWeekToTerm = (termNumber: number, weekNum?: number) => {
    const currentList = getWeeksForTerm(termNumber);
    const nextWeek = weekNum !== undefined ? weekNum : (currentList.length > 0 ? Math.max(...currentList) + 1 : 1);
    if (!currentList.includes(nextWeek)) {
      const updatedList = [...currentList, nextWeek].sort((a, b) => a - b);
      const updatedConfig = { ...termWeeksConfig, [termNumber]: updatedList };
      setTermWeeksConfig(updatedConfig);
      localStorage.setItem('ptp_term_weeks_config', JSON.stringify(updatedConfig));
    }
  };

  const deleteWeekFromTerm = (termNumber: number, weekNumber: number) => {
    const currentList = getWeeksForTerm(termNumber);
    if (currentList.length <= 1) {
      alert('A term must have at least one week.');
      return;
    }
    const updatedList = currentList.filter((w) => w !== weekNumber);
    const updatedConfig = { ...termWeeksConfig, [termNumber]: updatedList };
    setTermWeeksConfig(updatedConfig);
    localStorage.setItem('ptp_term_weeks_config', JSON.stringify(updatedConfig));
  };

  const resetTermWeeks = (termNumber: number, count?: number) => {
    const length = count || 10;
    const newWeeks = Array.from({ length }, (_, i) => i + 1);
    const updatedConfig = { ...termWeeksConfig, [termNumber]: newWeeks };
    setTermWeeksConfig(updatedConfig);
    localStorage.setItem('ptp_term_weeks_config', JSON.stringify(updatedConfig));
  };

  const addTeacher = async (teacherData: Omit<TeacherRecord, 'id' | 'addedAt'>) => {
    const newTeacher: TeacherRecord = {
      ...teacherData,
      id: 'teacher-' + Date.now(),
      addedAt: new Date().toISOString(),
    };
    const updated = [newTeacher, ...teachers];
    setTeachers(updated);
    localStorage.setItem('ptp_teachers_roster', JSON.stringify(updated));

    if (user && !isDemoUser) {
      try {
        await addDoc(collection(db, 'teachers'), newTeacher);
      } catch (err) {
        console.warn('Firestore teacher create fallback:', err);
      }
    }
  };

  const updateTeacher = async (id: string, updates: Partial<TeacherRecord>) => {
    const updated = teachers.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTeachers(updated);
    localStorage.setItem('ptp_teachers_roster', JSON.stringify(updated));

    if (user && !isDemoUser) {
      try {
        await setDoc(doc(db, 'teachers', id), updates, { merge: true });
      } catch (err) {
        console.warn('Firestore teacher update fallback:', err);
      }
    }
  };

  const deleteTeacher = async (id: string) => {
    const updated = teachers.filter((t) => t.id !== id);
    setTeachers(updated);
    localStorage.setItem('ptp_teachers_roster', JSON.stringify(updated));

    if (user && !isDemoUser) {
      try {
        await deleteDoc(doc(db, 'teachers', id));
      } catch (err) {
        console.warn('Firestore teacher delete fallback:', err);
      }
    }
  };

  // Load user data on profile change
  useEffect(() => {
    if (!profile) return;

    const uid = profile.uid;
    const localLogsKey = `ptp_logs_${uid}`;
    const localTimetableAKey = `ptp_tt_A_${uid}`;
    const localTimetableBKey = `ptp_tt_B_${uid}`;

    // Load from local storage first for instant responsive feel
    const cachedLogs = localStorage.getItem(localLogsKey);
    if (cachedLogs) {
      try {
        setStudyLogs(JSON.parse(cachedLogs));
      } catch {
        const initial = generateInitialSampleLogs(uid);
        setStudyLogs(initial);
      }
    } else {
      const initial = generateInitialSampleLogs(uid);
      setStudyLogs(initial);
      localStorage.setItem(localLogsKey, JSON.stringify(initial));
    }

    const cachedTtA = localStorage.getItem(localTimetableAKey);
    if (cachedTtA) {
      try {
        setTimetableBlocksA(JSON.parse(cachedTtA));
      } catch {
        setTimetableBlocksA(DEFAULT_TIMETABLE_SAMPLE);
      }
    }

    const cachedTtB = localStorage.getItem(localTimetableBKey);
    if (cachedTtB) {
      try {
        setTimetableBlocksB(JSON.parse(cachedTtB));
      } catch {
        setTimetableBlocksB(DEFAULT_TIMETABLE_SAMPLE);
      }
    }

    // If authenticated in Firestore, query remote documents
    if (user && !isDemoUser) {
      const fetchFirestoreData = async () => {
        try {
          const q = query(collection(db, 'studyLogs'), where('uid', '==', uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const fetchedLogs: StudyLog[] = [];
            querySnapshot.forEach((doc) => {
              fetchedLogs.push({ id: doc.id, ...(doc.data() as Omit<StudyLog, 'id'>) });
            });
            fetchedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setStudyLogs(fetchedLogs);
            localStorage.setItem(localLogsKey, JSON.stringify(fetchedLogs));
          } else {
            const initial = generateInitialSampleLogs(uid);
            for (const log of initial.slice(0, 5)) {
              await addDoc(collection(db, 'studyLogs'), log);
            }
          }

          const snap = await getDocs(query(collection(db, 'timetable'), where('uid', '==', uid)));
          snap.forEach((d) => {
            const tt = d.data() as TimetableData;
            if (tt.weekType === 'A' && tt.blocks) setTimetableBlocksA(tt.blocks);
            if (tt.weekType === 'B' && tt.blocks) setTimetableBlocksB(tt.blocks);
          });
        } catch (err) {
          console.warn('Firestore fetch notice (using cached state):', err);
        }
      };
      fetchFirestoreData();
    }
  }, [user, profile, isDemoUser]);

  // Calculate current week hours
  const totalHoursThisWeek = React.useMemo(() => {
    const weekLogs = studyLogs.filter((l) => l.weekNumber === currentWeek && l.termNumber === currentTerm);
    const totalMinutes = weekLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    return Math.round((totalMinutes / 60) * 10) / 10;
  }, [studyLogs, currentWeek, currentTerm]);

  const addStudyLog = async (logData: Omit<StudyLog, 'id' | 'uid' | 'createdAt'>) => {
    if (!profile) return;
    const uid = profile.uid;
    const newLog: StudyLog = {
      ...logData,
      id: 'log-' + Date.now(),
      uid,
      createdAt: new Date().toISOString(),
    };

    const updated = [newLog, ...studyLogs];
    setStudyLogs(updated);
    localStorage.setItem(`ptp_logs_${uid}`, JSON.stringify(updated));

    if (user && !isDemoUser) {
      try {
        const docRef = await addDoc(collection(db, 'studyLogs'), {
          ...logData,
          uid,
          createdAt: newLog.createdAt,
        });
        newLog.id = docRef.id;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'studyLogs');
      }
    }
  };

  const deleteStudyLog = async (id: string) => {
    if (!profile) return;
    const uid = profile.uid;
    const updated = studyLogs.filter((l) => l.id !== id);
    setStudyLogs(updated);
    localStorage.setItem(`ptp_logs_${uid}`, JSON.stringify(updated));

    if (user && !isDemoUser) {
      try {
        await deleteDoc(doc(db, 'studyLogs', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `studyLogs/${id}`);
      }
    }
  };

  const saveTimetable = async (weekType: 'A' | 'B', blocks: TimetableBlock[]) => {
    if (!profile) return;
    const uid = profile.uid;

    if (weekType === 'A') {
      setTimetableBlocksA(blocks);
      localStorage.setItem(`ptp_tt_A_${uid}`, JSON.stringify(blocks));
    } else {
      setTimetableBlocksB(blocks);
      localStorage.setItem(`ptp_tt_B_${uid}`, JSON.stringify(blocks));
    }

    if (user && !isDemoUser) {
      try {
        const docId = `${uid}_${weekType}`;
        const ttData: TimetableData = {
          uid,
          weekType,
          blocks,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'timetable', docId), ttData, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `timetable/${uid}_${weekType}`);
      }
    }
  };

  const prefillSchoolHours = async (weekType: 'A' | 'B') => {
    const currentBlocks = weekType === 'A' ? timetableBlocksA : timetableBlocksB;
    const nonSchoolBlocks = currentBlocks.filter((b) => b.category !== 'School');
    const newSchoolBlocks: TimetableBlock[] = DEFAULT_SCHOOL_DAY_BLOCKS.map((sb, idx) => ({
      ...sb,
      id: `school-${weekType}-${idx}-${Date.now()}`,
    }));
    const combined = [...newSchoolBlocks, ...nonSchoolBlocks];
    await saveTimetable(weekType, combined);
  };

  const refreshCohortData = async () => {
    if (!profile) return;
    const currentStudentRecord: StudentCohortRecord = {
      user: profile,
      totalHoursThisWeek,
      goalHours: profile.weeklyGoal,
      percentAchieved: Math.round((totalHoursThisWeek / (profile.weeklyGoal || 20)) * 100),
      status: totalHoursThisWeek >= profile.weeklyGoal * 0.9 ? 'On Track' : totalHoursThisWeek >= profile.weeklyGoal * 0.6 ? 'Near Target' : 'Needs Support',
      recentSubject: studyLogs[0]?.subject || 'Mathematics',
      logsCount: studyLogs.length,
      logs: studyLogs,
      timetableBlocks: activeWeekType === 'A' ? timetableBlocksA : timetableBlocksB,
    };

    const otherStudents = DEMO_COHORT_STUDENTS.filter(s => s.user.email !== profile.email);
    setCohortRecords([currentStudentRecord, ...otherStudents]);
  };

  useEffect(() => {
    refreshCohortData();
  }, [profile, totalHoursThisWeek, studyLogs, timetableBlocksA, timetableBlocksB, activeWeekType]);

  return (
    <StudyContext.Provider
      value={{
        studyLogs,
        timetableBlocksA,
        timetableBlocksB,
        activeWeekType,
        setActiveWeekType,
        addStudyLog,
        deleteStudyLog,
        saveTimetable,
        prefillSchoolHours,
        cohortRecords,
        refreshCohortData,
        totalHoursThisWeek,
        currentTerm,
        currentWeek,
        streakInfo,
        termWeeksConfig,
        getWeeksForTerm,
        addWeekToTerm,
        deleteWeekFromTerm,
        resetTermWeeks,
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
