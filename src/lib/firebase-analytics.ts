// Firebase Analytics for Anonymous Users
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { anonymousUserManager } from './anonymous-user';
import type { AnalysisResult } from './types';

// Collection names for analytics
const COLLECTIONS = {
  ANONYMOUS_USERS: 'anonymous_users',
  ANALYSIS_SESSIONS: 'analysis_sessions', 
  FEEDBACK: 'feedback',
  USAGE_STATS: 'usage_stats',
  ERROR_LOGS: 'error_logs'
} as const;

// Types for analytics
export interface AnalysisSession {
  id?: string;
  anonymousUserId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Input data
  imageHash: string; // MD5 hash for duplicate detection
  demographics: string;
  objective: string;
  
  // AI Results
  results: AnalysisResult;
  
  // Performance metrics
  processingTimeMs: number;
  aiModelVersion: string;
  
  // User interaction
  userRating?: number; // 1-5 stars
  userFeedback?: string;
  wasHelpful?: boolean;
  
  // Technical data
  deviceInfo: any;
  sessionId: string;
}

export interface UserFeedback {
  id?: string;
  anonymousUserId: string;
  analysisSessionId: string;
  createdAt: Date;
  
  // Rating data
  overallRating: number; // 1-5
  accuracyRating: number; // 1-5
  usefulnessRating: number; // 1-5
  
  // Detailed feedback
  feedback: string;
  improvementSuggestions?: string;
  
  // Specific ratings
  performanceScoreAccuracy?: number; // 1-5
  recommendationsQuality?: number; // 1-5
  
  // User sentiment
  wouldRecommend: boolean;
  willUseAgain: boolean;
}

export interface UsageStats {
  date: string; // YYYY-MM-DD
  totalAnalyses: number;
  uniqueUsers: number;
  avgProcessingTime: number;
  topObjectives: Record<string, number>;
  feedbackCount: number;
  avgRating: number;
  duplicateAnalyses: number;
}

class FirebaseAnalytics {
  
  // Helper function to ensure user exists before updating
  private async ensureUserExists(userId: string): Promise<void> {
    const userRef = doc(db, COLLECTIONS.ANONYMOUS_USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create user if it doesn't exist
      const userData = anonymousUserManager.getAnonymousUserData();
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  // Helper function to ensure daily stats document exists
  private async ensureDailyStatsExists(date: string): Promise<void> {
    const statsRef = doc(db, COLLECTIONS.USAGE_STATS, date);
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      // Create initial stats document
      await setDoc(statsRef, {
        date,
        totalAnalyses: 0,
        uniqueUsers: 0,
        avgProcessingTime: 0,
        topObjectives: {},
        feedbackCount: 0,
        avgRating: 0,
        duplicateAnalyses: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }
  
  // Track anonymous user in Firebase
  async trackAnonymousUser(): Promise<void> {
    const userData = anonymousUserManager.getAnonymousUserData();
    const userRef = doc(db, COLLECTIONS.ANONYMOUS_USERS, userData.id);
    
    try {
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          lastActive: serverTimestamp(),
          sessionCount: increment(1),
          deviceInfo: userData.deviceInfo,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new anonymous user
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('❌ Error tracking anonymous user:', error);
      // Continue execution even if analytics fail
    }
  }

  // Create MD5 hash for duplicate detection
  private createImageHash(imageData: string, demographics: string, objective: string): string {
    const combined = `${imageData}-${demographics}-${objective}`;
    // Simple hash function (in production, use crypto)
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Track analysis session
  async trackAnalysisSession(
    imageData: string,
    demographics: string,
    objective: string,
    results: AnalysisResult,
    processingTimeMs: number
  ): Promise<string> {
    const userData = anonymousUserManager.getAnonymousUserData();
    const imageHash = this.createImageHash(imageData, demographics, objective);
    
    const sessionData: Omit<AnalysisSession, 'id'> = {
      anonymousUserId: userData.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageHash,
      demographics,
      objective,
      results,
      processingTimeMs,
      aiModelVersion: '1.0.0', // Update this dynamically
      deviceInfo: userData.deviceInfo,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    try {
      // Check for duplicates
      await this.checkForDuplicates(imageHash, userData.id);
      
      // Create session
      const sessionRef = await addDoc(collection(db, COLLECTIONS.ANALYSIS_SESSIONS), {
        ...sessionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update user analysis count
      anonymousUserManager.incrementAnalysisCount();
      
      // Update user in Firebase (ensure user exists first)
      await this.ensureUserExists(userData.id);
      const userRef = doc(db, COLLECTIONS.ANONYMOUS_USERS, userData.id);
      await updateDoc(userRef, {
        analysisCount: increment(1),
        lastActive: serverTimestamp()
      });

      // Update daily stats
      await this.updateDailyStats(objective, processingTimeMs);

      return sessionRef.id;
    } catch (error) {
      console.error('Error tracking analysis session:', error);
      throw error;
    }
  }

  // Check for duplicate analyses
  private async checkForDuplicates(imageHash: string, userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ANALYSIS_SESSIONS),
        where('imageHash', '==', imageHash),
        where('anonymousUserId', '==', userId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Found duplicate - track it
        const today = new Date().toISOString().split('T')[0];
        const statsRef = doc(db, COLLECTIONS.USAGE_STATS, today);
        
        try {
          // Ensure daily stats document exists before updating
          await this.ensureDailyStatsExists(today);
          await updateDoc(statsRef, {
            duplicateAnalyses: increment(1)
          });
        } catch (error) {
          console.error('Error updating duplicate stats:', error);
        }
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    }
  }

  // Submit user feedback
  async submitFeedback(
    analysisSessionId: string,
    feedbackData: Omit<UserFeedback, 'id' | 'anonymousUserId' | 'analysisSessionId' | 'createdAt'>
  ): Promise<void> {
    const userData = anonymousUserManager.getAnonymousUserData();
    
    const feedback: Omit<UserFeedback, 'id'> = {
      anonymousUserId: userData.id,
      analysisSessionId,
      createdAt: new Date(),
      ...feedbackData
    };

    try {
      // Save feedback
      await addDoc(collection(db, COLLECTIONS.FEEDBACK), {
        ...feedback,
        createdAt: serverTimestamp()
      });

      // Update session with rating
      const sessionRef = doc(db, COLLECTIONS.ANALYSIS_SESSIONS, analysisSessionId);
      await updateDoc(sessionRef, {
        userRating: feedbackData.overallRating,
        userFeedback: feedbackData.feedback,
        wasHelpful: feedbackData.overallRating >= 4,
        updatedAt: serverTimestamp()
      });

      // Update user feedback count
      anonymousUserManager.incrementFeedbackCount();
      
      // Ensure user exists before updating
      await this.ensureUserExists(userData.id);
      const userRef = doc(db, COLLECTIONS.ANONYMOUS_USERS, userData.id);
      await updateDoc(userRef, {
        feedbackCount: increment(1),
        lastActive: serverTimestamp()
      });

      // Update daily stats
      await this.updateDailyFeedbackStats(feedbackData.overallRating);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Update daily usage statistics
  private async updateDailyStats(objective: string, processingTimeMs: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Ensure daily stats document exists
      await this.ensureDailyStatsExists(today);
      
      const statsRef = doc(db, COLLECTIONS.USAGE_STATS, today);
      const statsDoc = await getDoc(statsRef);
      const currentStats = statsDoc.data()!;
      
      // Update statistics
      await updateDoc(statsRef, {
        totalAnalyses: increment(1),
        [`topObjectives.${objective}`]: increment(1),
        // Update average processing time
        avgProcessingTime: (currentStats.avgProcessingTime * currentStats.totalAnalyses + processingTimeMs) / (currentStats.totalAnalyses + 1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  }

  // Update feedback statistics
  private async updateDailyFeedbackStats(rating: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Ensure daily stats document exists
      await this.ensureDailyStatsExists(today);
      
      const statsRef = doc(db, COLLECTIONS.USAGE_STATS, today);
      const statsDoc = await getDoc(statsRef);
      const currentStats = statsDoc.data()!;
      
      const currentFeedbackCount = currentStats.feedbackCount || 0;
      const currentAvgRating = currentStats.avgRating || 0;
      
      const newFeedbackCount = currentFeedbackCount + 1;
      const newAvgRating = (currentAvgRating * currentFeedbackCount + rating) / newFeedbackCount;
      
      await updateDoc(statsRef, {
        feedbackCount: newFeedbackCount,
        avgRating: newAvgRating,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating feedback stats:', error);
    }
  }

  // Log errors for debugging
  async logError(error: Error, context: string, additionalData?: any): Promise<void> {
    const userData = anonymousUserManager.getAnonymousUserData();
    
    try {
      await addDoc(collection(db, COLLECTIONS.ERROR_LOGS), {
        anonymousUserId: userData.id,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context,
        additionalData,
        deviceInfo: userData.deviceInfo,
        createdAt: serverTimestamp()
      });
    } catch (logError) {
      console.error('Error logging error:', logError);
    }
  }

  // Get user's analysis history (for showing past analyses)
  async getUserAnalysisHistory(limitCount: number = 10): Promise<AnalysisSession[]> {
    const userData = anonymousUserManager.getAnonymousUserData();
    
    try {
      const q = query(
        collection(db, COLLECTIONS.ANALYSIS_SESSIONS),
        where('anonymousUserId', '==', userData.id),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as AnalysisSession[];
    } catch (error) {
      console.error('Error getting user analysis history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const firebaseAnalytics = new FirebaseAnalytics();