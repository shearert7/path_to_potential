import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, signInWithPopup, signOut, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { GoogleAuthProvider } from 'firebase/auth';
import { UserProfile, YearLevel, UserRole, GRADE_PRESET_HOURS } from '../types';
import { SECONDARY_SUBJECTS, getSubjectsForYear } from '../constants/data';

export const ADMIN_EMAIL = 'shearert@glennie.qld.edu.au';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  accessToken: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  canAccessFacultyPortal: boolean;
  signInWithGoogle: () => Promise<string | null>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setGradeLevel: (year: YearLevel) => Promise<void>;
  toggleRole: () => void;
  isDemoUser: boolean;
  loginAsDemoStudent: (year?: YearLevel) => void;
  loginAsDemoTeacher: (assignedYears?: YearLevel[], teacherName?: string, email?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_PROFILE_KEY = 'ptp_user_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check cached or demo user on boot
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsDemoUser(false);
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);
          const isAuthorizedAdmin = (firebaseUser.email || '').toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            // Enforce that only shearert@glennie.qld.edu.au can possess the admin role
            const role: UserRole = isAuthorizedAdmin ? 'admin' : 'student';
            const updatedProfile = { ...data, role };
            setProfile(updatedProfile);
          } else {
            // New user registration defaults
            const defaultYear: YearLevel = 10;
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Secondary Student',
              email: firebaseUser.email || 'student@glennie.qld.edu.au',
              yearLevel: defaultYear,
              weeklyGoal: GRADE_PRESET_HOURS[defaultYear],
              role: isAuthorizedAdmin ? 'admin' : 'student',
              enrolledSubjects: getSubjectsForYear(defaultYear).slice(0, 6),
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error('Error fetching user profile from Firestore:', err);
          const isAuthorizedAdmin = (firebaseUser.email || '').toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
          const fallbackYear: YearLevel = 10;
          const fallbackProfile: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Secondary Student',
            email: firebaseUser.email || 'student@glennie.qld.edu.au',
            yearLevel: fallbackYear,
            weeklyGoal: GRADE_PRESET_HOURS[fallbackYear],
            role: isAuthorizedAdmin ? 'admin' : 'student',
            enrolledSubjects: getSubjectsForYear(fallbackYear).slice(0, 6),
          };
          setProfile(fallbackProfile);
        }
      } else {
        setUser(null);
        setAccessToken(null);
        const savedDemo = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (savedDemo) {
          try {
            setProfile(JSON.parse(savedDemo));
            setIsDemoUser(true);
          } catch {
            loginAsDemoStudent(10);
          }
        } else {
          loginAsDemoStudent(10);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsDemoStudent = (year: YearLevel = 10) => {
    const demoProfile: UserProfile = {
      uid: 'demo-student-yr' + year,
      name: `Student Demo (Year ${year})`,
      email: `student.yr${year}@glennie.qld.edu.au`,
      yearLevel: year,
      weeklyGoal: GRADE_PRESET_HOURS[year],
      role: 'student',
      enrolledSubjects: [
        'Mathematics',
        'Science',
        'English',
        'Humanities / HASS',
        'Visual Art',
        'Health & Physical Education (HPE)'
      ],
      createdAt: new Date().toISOString(),
    };
    setProfile(demoProfile);
    setIsDemoUser(true);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(demoProfile));
  };

  const loginAsDemoTeacher = (
    assignedYears?: YearLevel[],
    teacherName?: string,
    email?: string
  ) => {
    const isDedicatedAdmin = !assignedYears || assignedYears.length === 0 || email === ADMIN_EMAIL;
    const teacherProfile: UserProfile = {
      uid: isDedicatedAdmin ? 'demo-admin-glennie' : `demo-teacher-${(assignedYears || [7]).join('-')}`,
      name: teacherName || (isDedicatedAdmin ? 'Dr. Tim Shearer (Academic Dean)' : `Faculty Teacher (Year ${(assignedYears || [7]).join(', ')})`),
      email: email || (isDedicatedAdmin ? ADMIN_EMAIL : `teacher.yr${(assignedYears || [7])[0]}@glennie.qld.edu.au`),
      yearLevel: (assignedYears && assignedYears[0]) || 12,
      weeklyGoal: 20,
      role: isDedicatedAdmin ? 'admin' : 'teacher',
      assignedYearLevels: assignedYears || [7, 8, 9, 10, 11, 12],
      enrolledSubjects: SECONDARY_SUBJECTS.slice(0, 8),
      createdAt: new Date().toISOString(),
    };
    setProfile(teacherProfile);
    setIsDemoUser(true);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(teacherProfile));
  };

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      alert('Unable to complete Google Sign-In. You can continue using Path to Potential in preview/demo mode.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        await signOut(auth);
      }
      setAccessToken(null);
      loginAsDemoStudent(10);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...data };
    setProfile(updated);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));

    if (user && !isDemoUser) {
      try {
        await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  // Changing grade level presets the weekly target goal and adjusts subjects
  const setGradeLevel = async (year: YearLevel) => {
    const presetHours = GRADE_PRESET_HOURS[year];
    const yearSubjects = getSubjectsForYear(year);
    // Keep enrolled subjects that exist in the new grade level, or initialize with the grade's subjects
    const currentEnrolled = profile?.enrolledSubjects || [];
    const validEnrolled = currentEnrolled.filter((s) => yearSubjects.includes(s));
    const nextSubjects = validEnrolled.length >= 3 ? validEnrolled : yearSubjects.slice(0, 6);

    await updateProfile({
      yearLevel: year,
      weeklyGoal: presetHours,
      enrolledSubjects: nextSubjects,
    });
  };

  const isAdmin =
    (profile?.email || user?.email || '').toLowerCase().trim() === ADMIN_EMAIL.toLowerCase() &&
    profile?.role === 'admin';

  const isTeacher = profile?.role === 'teacher';
  const canAccessFacultyPortal = isAdmin || isTeacher;

  const toggleRole = () => {
    if (!profile) return;
    if ((profile.email || user?.email || '').toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase()) {
      return;
    }
    const newRole: UserRole = profile.role === 'admin' ? 'student' : 'admin';
    updateProfile({ role: newRole });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        accessToken,
        isAdmin,
        isTeacher,
        canAccessFacultyPortal,
        signInWithGoogle,
        logout,
        updateProfile,
        setGradeLevel,
        toggleRole,
        isDemoUser,
        loginAsDemoStudent,
        loginAsDemoTeacher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
