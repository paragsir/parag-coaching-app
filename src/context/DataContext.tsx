import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Student, 
  Batch, 
  FeeRecord, 
  AttendanceRecord, 
  TestRecord, 
  Enquiry, 
  CoachingSettings 
} from '../types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_BATCHES, 
  INITIAL_FEES, 
  INITIAL_ATTENDANCE, 
  INITIAL_TESTS, 
  INITIAL_ENQUIRIES, 
  INITIAL_SETTINGS 
} from '../data/seedData';
import { useAuth } from './AuthContext';

export interface BackupPayload {
  appName?: string;
  appVersion?: string;
  backupDate?: string;
  students?: Student[];
  batches?: Batch[];
  fees?: FeeRecord[];
  attendance?: AttendanceRecord[];
  tests?: TestRecord[];
  enquiries?: Enquiry[];
  settings?: CoachingSettings;
}

interface DataContextType {
  students: Student[];
  batches: Batch[];
  fees: FeeRecord[];
  attendance: AttendanceRecord[];
  tests: TestRecord[];
  enquiries: Enquiry[];
  settings: CoachingSettings;
  loading: boolean;
  
  // Actions
  addStudent: (student: Omit<Student, 'id'>) => Promise<string>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  
  addBatch: (batch: Omit<Batch, 'id'>) => Promise<string>;
  updateBatch: (id: string, updates: Partial<Batch>) => Promise<void>;
  
  markFeePaid: (feeId: string, paymentMode: 'UPI' | 'Cash' | 'Bank Transfer', receiptNumber?: string) => Promise<FeeRecord>;
  addFeeRecord: (fee: Omit<FeeRecord, 'id' | 'daysLate'>) => Promise<string>;
  
  saveAttendanceForBatch: (batchName: string, date: string, records: { studentId: string; status: 'P' | 'A' }[]) => Promise<{ absentCount: number; absentees: Student[] }>;
  
  saveTestResults: (testData: {
    batchName: string;
    testTitle: string;
    subject: string;
    maxMarks: number;
    date: string;
    scores: { studentId: string; marks: number }[];
  }) => Promise<void>;
  
  updateSettings: (newSettings: Partial<CoachingSettings>) => Promise<void>;
  addEnquiry: (enquiry: Omit<Enquiry, 'id' | 'date'>) => Promise<string>;
  updateEnquiryStatus: (id: string, status: 'new' | 'contacted' | 'enrolled', notes?: string) => Promise<void>;
  seedInitialData: () => Promise<void>;
  restoreAllData: (data: BackupPayload) => Promise<{ success: boolean; message: string }>;

  // Analytics Helpers
  totalFeesCollected: number;
  totalFeesPending: number;
  totalFeesLate: number;
  lateFeeCount: number;
  todayAttendancePercent: number;
  getStudentAttendancePercent: (studentId: string) => number;
  getStudentRecentTests: (studentId: string) => TestRecord[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOwner, isClient, userProfile } = useAuth();
  
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [fees, setFees] = useState<FeeRecord[]>(INITIAL_FEES);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [tests, setTests] = useState<TestRecord[]>(INITIAL_TESTS);
  const [enquiries, setEnquiries] = useState<Enquiry[]>(INITIAL_ENQUIRIES);
  const [settings, setSettings] = useState<CoachingSettings>(() => {
    if (typeof window !== 'undefined') {
      const savedLogo = localStorage.getItem('app_coaching_logo');
      if (savedLogo) {
        return { ...INITIAL_SETTINGS, logoImageUrl: savedLogo };
      }
    }
    return INITIAL_SETTINGS;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Real-time Firestore sync
  useEffect(() => {
    // Setting up snapshot listeners
    const unsubs: (() => void)[] = [];

    try {
      // 1. Settings listener
      const settingsRef = doc(db, 'settings', 'general');
      const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
        const savedLogo = typeof window !== 'undefined' ? localStorage.getItem('app_coaching_logo') : null;
        if (docSnap.exists()) {
          const remoteSettings = docSnap.data() as CoachingSettings;
          setSettings({
            ...remoteSettings,
            logoImageUrl: remoteSettings.logoImageUrl || savedLogo || '',
          });
        } else {
          // Initialize settings document if it doesn't exist
          const initData = { ...INITIAL_SETTINGS, logoImageUrl: savedLogo || '' };
          setDoc(settingsRef, initData).catch((e) => console.log('Init settings notice:', e));
        }
      }, (err) => {
        console.warn('Settings snapshot listener fallback to default:', err.message);
      });
      unsubs.push(unsubSettings);

      // 2. Students listener
      const studentsRef = collection(db, 'students');
      const unsubStudents = onSnapshot(studentsRef, (querySnap) => {
        if (!querySnap.empty) {
          const list: Student[] = [];
          querySnap.forEach((d) => list.push({ ...d.data(), id: d.id } as Student));
          setStudents(list);
        } else {
          // If empty in DB, we use INITIAL_STUDENTS
          setStudents(INITIAL_STUDENTS);
        }
      }, (err) => {
        console.warn('Students snapshot listener fallback:', err.message);
      });
      unsubs.push(unsubStudents);

      // 3. Batches listener
      const batchesRef = collection(db, 'batches');
      const unsubBatches = onSnapshot(batchesRef, (querySnap) => {
        if (!querySnap.empty) {
          const list: Batch[] = [];
          querySnap.forEach((d) => list.push({ ...d.data(), id: d.id } as Batch));
          setBatches(list);
        } else {
          setBatches(INITIAL_BATCHES);
        }
      }, (err) => console.warn('Batches snapshot listener:', err.message));
      unsubs.push(unsubBatches);

      // 4. Fees listener
      const feesRef = collection(db, 'fees');
      const unsubFees = onSnapshot(feesRef, (querySnap) => {
        if (!querySnap.empty) {
          const list: FeeRecord[] = [];
          querySnap.forEach((d) => {
            const data = d.data() as FeeRecord;
            // Calculate live days late if pending or late
            let daysLate = data.daysLate || 0;
            if (data.status !== 'paid' && data.dueDate) {
              const due = new Date(data.dueDate).getTime();
              const now = new Date().getTime();
              if (now > due) {
                daysLate = Math.max(1, Math.floor((now - due) / (1000 * 60 * 60 * 24)));
              }
            }
            list.push({ ...data, id: d.id, daysLate });
          });
          setFees(list);
        } else {
          setFees(INITIAL_FEES);
        }
      }, (err) => console.warn('Fees snapshot listener:', err.message));
      unsubs.push(unsubFees);

      // 5. Attendance listener
      const attRef = collection(db, 'attendance');
      const unsubAtt = onSnapshot(attRef, (querySnap) => {
        if (!querySnap.empty) {
          const list: AttendanceRecord[] = [];
          querySnap.forEach((d) => list.push({ ...d.data(), id: d.id } as AttendanceRecord));
          setAttendance(list);
        } else {
          setAttendance(INITIAL_ATTENDANCE);
        }
      }, (err) => console.warn('Attendance snapshot listener:', err.message));
      unsubs.push(unsubAtt);

      // 6. Tests listener
      const testsRef = collection(db, 'tests');
      const unsubTests = onSnapshot(testsRef, (querySnap) => {
        if (!querySnap.empty) {
          const list: TestRecord[] = [];
          querySnap.forEach((d) => list.push({ ...d.data(), id: d.id } as TestRecord));
          setTests(list);
        } else {
          setTests(INITIAL_TESTS);
        }
      }, (err) => console.warn('Tests snapshot listener:', err.message));
      unsubs.push(unsubTests);

      // 7. Enquiries listener
      const enqRef = collection(db, 'enquiries');
      const unsubEnq = onSnapshot(enqRef, (querySnap) => {
        if (!querySnap.empty) {
          const list: Enquiry[] = [];
          querySnap.forEach((d) => list.push({ ...d.data(), id: d.id } as Enquiry));
          setEnquiries(list);
        } else {
          setEnquiries(INITIAL_ENQUIRIES);
        }
      }, (err) => console.warn('Enquiries snapshot listener:', err.message));
      unsubs.push(unsubEnq);

      setLoading(false);
    } catch (e) {
      console.error('Error attaching Firestore listeners:', e);
      setLoading(false);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Seed sample data to Firestore
  const seedInitialData = async () => {
    try {
      setLoading(true);
      const batch = writeBatch(db);

      // 1. Settings
      const settingsRef = doc(db, 'settings', 'general');
      batch.set(settingsRef, INITIAL_SETTINGS);

      // 2. Batches
      for (const b of INITIAL_BATCHES) {
        batch.set(doc(db, 'batches', b.id), b);
      }

      // 3. Students
      for (const s of INITIAL_STUDENTS) {
        batch.set(doc(db, 'students', s.id), s);
      }

      // 4. Fees
      for (const f of INITIAL_FEES) {
        batch.set(doc(db, 'fees', f.id), f);
      }

      // 5. Attendance
      for (const a of INITIAL_ATTENDANCE) {
        batch.set(doc(db, 'attendance', a.id), a);
      }

      // 6. Tests
      for (const t of INITIAL_TESTS) {
        batch.set(doc(db, 'tests', t.id), t);
      }

      // 7. Enquiries
      for (const e of INITIAL_ENQUIRIES) {
        batch.set(doc(db, 'enquiries', e.id), e);
      }

      await batch.commit();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      handleFirestoreError(err, OperationType.WRITE, 'seedInitialData');
    }
  };

  // Restore complete coaching data from JSON backup
  const restoreAllData = async (data: BackupPayload): Promise<{ success: boolean; message: string }> => {
    try {
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid backup file format' };
      }

      setLoading(true);

      // 1. Students
      if (Array.isArray(data.students) && data.students.length > 0) {
        setStudents(data.students);
        try {
          const batch = writeBatch(db);
          for (const s of data.students) {
            batch.set(doc(db, 'students', s.id), s);
          }
          await batch.commit();
        } catch (e) {
          console.warn('Restore students firestore write warning:', e);
        }
      }

      // 2. Batches
      if (Array.isArray(data.batches) && data.batches.length > 0) {
        setBatches(data.batches);
        try {
          const batch = writeBatch(db);
          for (const b of data.batches) {
            batch.set(doc(db, 'batches', b.id), b);
          }
          await batch.commit();
        } catch (e) {
          console.warn('Restore batches firestore write warning:', e);
        }
      }

      // 3. Fees
      if (Array.isArray(data.fees) && data.fees.length > 0) {
        setFees(data.fees);
        try {
          const batch = writeBatch(db);
          for (const f of data.fees) {
            batch.set(doc(db, 'fees', f.id), f);
          }
          await batch.commit();
        } catch (e) {
          console.warn('Restore fees firestore write warning:', e);
        }
      }

      // 4. Attendance (chunked to ensure within 500 batch limit)
      if (Array.isArray(data.attendance) && data.attendance.length > 0) {
        setAttendance(data.attendance);
        try {
          const chunkSize = 300;
          for (let i = 0; i < data.attendance.length; i += chunkSize) {
            const chunk = data.attendance.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            for (const a of chunk) {
              batch.set(doc(db, 'attendance', a.id), a);
            }
            await batch.commit();
          }
        } catch (e) {
          console.warn('Restore attendance firestore write warning:', e);
        }
      }

      // 5. Tests
      if (Array.isArray(data.tests) && data.tests.length > 0) {
        setTests(data.tests);
        try {
          const batch = writeBatch(db);
          for (const t of data.tests) {
            batch.set(doc(db, 'tests', t.id), t);
          }
          await batch.commit();
        } catch (e) {
          console.warn('Restore tests firestore write warning:', e);
        }
      }

      // 6. Enquiries
      if (Array.isArray(data.enquiries) && data.enquiries.length > 0) {
        setEnquiries(data.enquiries);
        try {
          const batch = writeBatch(db);
          for (const en of data.enquiries) {
            batch.set(doc(db, 'enquiries', en.id), en);
          }
          await batch.commit();
        } catch (e) {
          console.warn('Restore enquiries firestore write warning:', e);
        }
      }

      // 7. Settings
      if (data.settings && typeof data.settings === 'object') {
        const mergedSettings = { ...settings, ...data.settings };
        setSettings(mergedSettings);
        if (mergedSettings.logoImageUrl && typeof window !== 'undefined') {
          try {
            localStorage.setItem('app_coaching_logo', mergedSettings.logoImageUrl);
          } catch (e) {
            console.warn('Restore logo localStorage warning:', e);
          }
        }
        try {
          await setDoc(doc(db, 'settings', 'general'), mergedSettings, { merge: true });
        } catch (e) {
          console.warn('Restore settings firestore write warning:', e);
        }
      }

      setLoading(false);
      return { success: true, message: 'Saara Data wapas aa gaya' };
    } catch (err: any) {
      setLoading(false);
      console.error('Restore error:', err);
      return { success: false, message: err.message || 'Data restore nahi ho paya' };
    }
  };

  // Student Actions
  const addStudent = async (studentData: Omit<Student, 'id'>): Promise<string> => {
    if (!isOwner && !isClient) {
      throw new Error('Unauthorized: Viewers cannot add students.');
    }
    const newId = `std-${Date.now()}`;
    const newStudent: Student = {
      ...studentData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setStudents((prev) => [newStudent, ...prev]);

    // Also auto-generate initial current month fee entry
    const newFee: FeeRecord = {
      id: `fee-${Date.now()}`,
      studentId: newId,
      studentName: newStudent.name,
      month: 'November 2026',
      amount: newStudent.monthlyFee || 1800,
      dueDate: '2026-11-05',
      status: 'pending',
      daysLate: 0,
    };
    setFees((prev) => [newFee, ...prev]);

    try {
      await setDoc(doc(db, 'students', newId), newStudent);
      await setDoc(doc(db, 'fees', newFee.id), newFee);
    } catch (err) {
      console.warn('Student write to firestore:', err);
    }
    return newId;
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    if (!isOwner && !isClient) {
      throw new Error('Unauthorized: Viewers cannot edit students.');
    }
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    try {
      await updateDoc(doc(db, 'students', id), updates);
    } catch (err) {
      console.warn('Student update firestore:', err);
    }
  };

  const deleteStudent = async (id: string) => {
    if (!isOwner) {
      throw new Error('Unauthorized: Only owner can delete students.');
    }
    setStudents((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (err) {
      console.warn('Student delete firestore:', err);
    }
  };

  // Batch Actions
  const addBatch = async (batchData: Omit<Batch, 'id'>): Promise<string> => {
    const newId = `batch-${Date.now()}`;
    const newBatch: Batch = { ...batchData, id: newId, createdAt: new Date().toISOString() };
    setBatches((prev) => [...prev, newBatch]);
    try {
      await setDoc(doc(db, 'batches', newId), newBatch);
    } catch (err) {
      console.warn('Add batch firestore:', err);
    }
    return newId;
  };

  const updateBatch = async (id: string, updates: Partial<Batch>) => {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    try {
      await updateDoc(doc(db, 'batches', id), updates);
    } catch (err) {
      console.warn('Update batch firestore:', err);
    }
  };

  // Fee Actions
  const markFeePaid = async (
    feeId: string, 
    paymentMode: 'UPI' | 'Cash' | 'Bank Transfer', 
    receiptNumber?: string
  ): Promise<FeeRecord> => {
    const receipt = receiptNumber || `PC-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paidAt = new Date().toISOString().split('T')[0];

    let updatedRecord: FeeRecord | undefined;
    setFees((prev) =>
      prev.map((f) => {
        if (f.id === feeId) {
          updatedRecord = {
            ...f,
            status: 'paid',
            daysLate: 0,
            paidAt,
            paymentMode,
            receiptNumber: receipt,
          };
          return updatedRecord;
        }
        return f;
      })
    );

    try {
      await updateDoc(doc(db, 'fees', feeId), {
        status: 'paid',
        daysLate: 0,
        paidAt,
        paymentMode,
        receiptNumber: receipt,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Mark fee paid firestore:', err);
    }

    return updatedRecord || fees.find((f) => f.id === feeId)!;
  };

  const addFeeRecord = async (feeData: Omit<FeeRecord, 'id' | 'daysLate'>): Promise<string> => {
    const newId = `fee-${Date.now()}`;
    const newFee: FeeRecord = {
      ...feeData,
      id: newId,
      daysLate: 0,
      updatedAt: new Date().toISOString(),
    };
    setFees((prev) => [newFee, ...prev]);
    try {
      await setDoc(doc(db, 'fees', newId), newFee);
    } catch (err) {
      console.warn('Add fee record firestore:', err);
    }
    return newId;
  };

  // Attendance Actions
  const saveAttendanceForBatch = async (
    batchName: string, 
    date: string, 
    records: { studentId: string; status: 'P' | 'A' }[]
  ): Promise<{ absentCount: number; absentees: Student[] }> => {
    if (!isOwner && !isClient) {
      throw new Error('Unauthorized: Viewers cannot mark attendance.');
    }

    const absentStudentIds = records.filter((r) => r.status === 'A').map((r) => r.studentId);
    const absentees = students.filter((s) => absentStudentIds.includes(s.id));

    // Optimistic state update
    setAttendance((prev) => {
      // Remove any prior attendance for this batch on this date
      const filtered = prev.filter((a) => !(a.batchName === batchName && a.date === date));
      const newlyAdded: AttendanceRecord[] = records.map((r, idx) => ({
        id: `att-${date}-${r.studentId}-${idx}`,
        studentId: r.studentId,
        batchName,
        date,
        status: r.status,
        updatedAt: new Date().toISOString(),
      }));
      return [...filtered, ...newlyAdded];
    });

    try {
      const batch = writeBatch(db);
      for (const r of records) {
        const docId = `att_${date}_${r.studentId}`;
        batch.set(doc(db, 'attendance', docId), {
          studentId: r.studentId,
          batchName,
          date,
          status: r.status,
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
    } catch (err) {
      console.warn('Save attendance firestore:', err);
    }

    return {
      absentCount: absentees.length,
      absentees,
    };
  };

  // Tests Actions
  const saveTestResults = async (testData: {
    batchName: string;
    testTitle: string;
    subject: string;
    maxMarks: number;
    date: string;
    scores: { studentId: string; marks: number }[];
  }) => {
    if (!isOwner && !isClient) {
      throw new Error('Unauthorized: Viewers cannot create test results.');
    }

    // Sort scores descending to determine rank
    const sortedScores = [...testData.scores].sort((a, b) => b.marks - a.marks);
    const rankMap = new Map<string, number>();
    sortedScores.forEach((item, index) => {
      rankMap.set(item.studentId, index + 1);
    });

    const newTestRecords: TestRecord[] = testData.scores.map((sc) => ({
      id: `test-${testData.date}-${sc.studentId}-${Date.now()}`,
      studentId: sc.studentId,
      batchName: testData.batchName,
      testTitle: testData.testTitle,
      subject: testData.subject,
      marks: sc.marks,
      maxMarks: testData.maxMarks,
      rank: rankMap.get(sc.studentId) || 1,
      date: testData.date,
      createdAt: new Date().toISOString(),
    }));

    setTests((prev) => [...newTestRecords, ...prev]);

    try {
      const batch = writeBatch(db);
      for (const tr of newTestRecords) {
        batch.set(doc(db, 'tests', tr.id), tr);
      }
      await batch.commit();
    } catch (err) {
      console.warn('Save test results firestore:', err);
    }
  };

  // Settings Actions
  const updateSettings = async (newSettings: Partial<CoachingSettings>) => {
    if (newSettings.logoImageUrl !== undefined && typeof window !== 'undefined') {
      try {
        if (newSettings.logoImageUrl) {
          localStorage.setItem('app_coaching_logo', newSettings.logoImageUrl);
        } else {
          localStorage.removeItem('app_coaching_logo');
        }
      } catch (err) {
        console.warn('LocalStorage save warning:', err);
      }
    }

    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    try {
      await setDoc(doc(db, 'settings', 'general'), merged, { merge: true });
    } catch (err) {
      console.warn('Firestore settings write note:', err);
    }
  };

  // Enquiries Actions
  const addEnquiry = async (enquiryData: Omit<Enquiry, 'id' | 'date'>): Promise<string> => {
    const newId = `enq-${Date.now()}`;
    const newEnq: Enquiry = {
      ...enquiryData,
      id: newId,
      date: new Date().toISOString().split('T')[0],
      status: 'new',
    };
    setEnquiries((prev) => [newEnq, ...prev]);
    try {
      await setDoc(doc(db, 'enquiries', newId), newEnq);
    } catch (err) {
      console.warn('Add enquiry firestore:', err);
    }
    return newId;
  };

  const updateEnquiryStatus = async (id: string, status: 'new' | 'contacted' | 'enrolled', notes?: string) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status, ...(notes !== undefined ? { notes } : {}) } : e))
    );
    try {
      await updateDoc(doc(db, 'enquiries', id), {
        status,
        ...(notes !== undefined ? { notes } : {}),
      });
    } catch (err) {
      console.warn('Update enquiry status firestore:', err);
    }
  };

  // Computed Calculations
  const totalFeesCollected = fees
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const totalFeesPending = fees
    .filter((f) => f.status === 'pending')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const totalFeesLate = fees
    .filter((f) => f.status === 'late')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const lateFeeCount = fees.filter((f) => f.status === 'late').length;

  // Today's attendance percentage
  const today = '2026-11-04';
  const todayAttendance = attendance.filter((a) => a.date === today);
  const presentCount = todayAttendance.filter((a) => a.status === 'P').length;
  const todayAttendancePercent = todayAttendance.length > 0 
    ? Math.round((presentCount / todayAttendance.length) * 100) 
    : 85;

  const getStudentAttendancePercent = (studentId: string): number => {
    const studentRecords = attendance.filter((a) => a.studentId === studentId);
    if (!studentRecords.length) return 92; // default high attendance
    const presents = studentRecords.filter((a) => a.status === 'P').length;
    return Math.round((presents / studentRecords.length) * 100);
  };

  const getStudentRecentTests = (studentId: string): TestRecord[] => {
    return tests
      .filter((t) => t.studentId === studentId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-6);
  };

  return (
    <DataContext.Provider
      value={{
        students,
        batches,
        fees,
        attendance,
        tests,
        enquiries,
        settings,
        loading,
        addStudent,
        updateStudent,
        deleteStudent,
        addBatch,
        updateBatch,
        markFeePaid,
        addFeeRecord,
        saveAttendanceForBatch,
        saveTestResults,
        updateSettings,
        addEnquiry,
        updateEnquiryStatus,
        seedInitialData,
        restoreAllData,
        totalFeesCollected,
        totalFeesPending,
        totalFeesLate,
        lateFeeCount,
        todayAttendancePercent,
        getStudentAttendancePercent,
        getStudentRecentTests,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
