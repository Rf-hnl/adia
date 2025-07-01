// Firebase Services for AI Creative Analyzer
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './firebase';
import type { Analysis, User, AnalysisHistory } from './firebase-types';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  ANALYSES: 'analyses',
  USAGE: 'usage',
  SETTINGS: 'settings'
} as const;

// User Services
export const userService = {
  async createUser(uid: string, userData: Partial<User>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      plan: 'free',
      analysesUsed: 0,
      analysesLimit: 10
    });
  },

  async getUser(uid: string): Promise<User | null> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { uid, ...userSnap.data() } as User;
    }
    return null;
  },

  async updateLastLogin(uid: string): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });
  },

  async incrementAnalysisUsage(uid: string): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const user = await this.getUser(uid);
    
    if (user) {
      await updateDoc(userRef, {
        analysesUsed: user.analysesUsed + 1
      });
    }
  }
};

// Analysis Services
export const analysisService = {
  async createAnalysis(analysisData: Omit<Analysis, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const analysisRef = await addDoc(collection(db, COLLECTIONS.ANALYSES), {
      ...analysisData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return analysisRef.id;
  },

  async getAnalysis(id: string): Promise<Analysis | null> {
    const analysisRef = doc(db, COLLECTIONS.ANALYSES, id);
    const analysisSnap = await getDoc(analysisRef);
    
    if (analysisSnap.exists()) {
      const data = analysisSnap.data();
      return {
        id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Analysis;
    }
    return null;
  },

  async getUserAnalyses(userId: string, limitCount: number = 10): Promise<Analysis[]> {
    const analysesRef = collection(db, COLLECTIONS.ANALYSES);
    const q = query(
      analysesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Analysis[];
  },

  async updateAnalysisStatus(id: string, status: Analysis['status']): Promise<void> {
    const analysisRef = doc(db, COLLECTIONS.ANALYSES, id);
    await updateDoc(analysisRef, {
      status,
      updatedAt: serverTimestamp()
    });
  },

  async deleteAnalysis(id: string): Promise<void> {
    const analysisRef = doc(db, COLLECTIONS.ANALYSES, id);
    await deleteDoc(analysisRef);
  }
};

// Storage Services
export const storageService = {
  async uploadImage(file: File, userId: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `analyses/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filename);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  },

  async deleteImage(imageUrl: string): Promise<void> {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  }
};

// Analytics Services
export const analyticsService = {
  async trackAnalysis(userId: string, analysisData: Partial<Analysis>): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const usageRef = doc(db, COLLECTIONS.USAGE, `${userId}_${today}`);
    
    const usageSnap = await getDoc(usageRef);
    
    if (usageSnap.exists()) {
      const currentCount = usageSnap.data().analysesCount || 0;
      await updateDoc(usageRef, {
        analysesCount: currentCount + 1,
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(usageRef, {
        userId,
        date: today,
        analysesCount: 1,
        plan: 'free', // This should come from user data
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  },

  async getUserDailyUsage(userId: string, date: string): Promise<number> {
    const usageRef = doc(db, COLLECTIONS.USAGE, `${userId}_${date}`);
    const usageSnap = await getDoc(usageRef);
    
    return usageSnap.exists() ? usageSnap.data().analysesCount || 0 : 0;
  }
};