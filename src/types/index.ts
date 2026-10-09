export type YearLevel = 7 | 8 | 9 | 10 | 11 | 12;
export type UserRole = 'student' | 'teacher' | 'admin';

export const GRADE_PRESET_HOURS: Record<YearLevel, number> = {
  12: 25,
  11: 20,
  10: 15,
  9: 10,
  8: 10,
  7: 5,
};

export type MedalTier = 'bronze' | 'silver' | 'gold' | 'none';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  medals: {
    bronze: boolean; // 3-week streak
    silver: boolean; // 5-week streak
    gold: boolean;   // 7-week streak
  };
  nextMilestone: {
    targetStreak: number;
    medal: 'bronze' | 'silver' | 'gold' | 'legend';
    remainingWeeks: number;
    progressPercent: number;
  };
}

export interface TeacherRecord {
  id: string;
  name: string;
  email: string;
  assignedYearLevels: YearLevel[];
  title?: string;
  addedAt: string;
}

export type TimetableCategory =
  | 'Study'
  | 'School'
  | 'Sport / Training'
  | 'Work'
  | 'Sleep / Wellbeing'
  | 'Personal';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  yearLevel: YearLevel;
  weeklyGoal: number; // 25 for Yr 12, 20 for Yr 11, 15 for Yr 10, 10 for Yr 8/9, 5 for Yr 7
  role: UserRole;
  assignedYearLevels?: YearLevel[]; // for teacher role
  enrolledSubjects: string[];
  createdAt?: string;
}

export interface TimetableBlock {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:mm format, e.g. "08:30"
  endTime: string;   // HH:mm format, e.g. "10:00"
  title: string;
  category: TimetableCategory;
  color?: string;
  subject?: string;
}

export interface TimetableData {
  id?: string;
  uid: string;
  weekType: 'A' | 'B';
  blocks: TimetableBlock[];
  updatedAt: string;
}

export interface StudyLog {
  id: string;
  uid: string;
  date: string; // YYYY-MM-DD
  subject: string;
  durationMinutes: number;
  weekNumber: number; // 1 to 10
  termNumber: number; // 1 to 4
  notes?: string;
  createdAt: string;
}

export interface WeeklyReflection {
  id?: string;
  uid: string;
  termNumber: number;
  weekNumber: number;
  notes: string;
  updatedAt: string;
}

export interface StudentCohortRecord {
  user: UserProfile;
  totalHoursThisWeek: number;
  goalHours: number;
  percentAchieved: number;
  status: 'On Track' | 'Near Target' | 'Needs Support';
  recentSubject: string;
  logsCount: number;
  logs: StudyLog[];
  timetableBlocks: TimetableBlock[];
}
