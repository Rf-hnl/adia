"use client";

import { useEffect, useState } from 'react';
import { firebaseAnalytics } from '@/lib/firebase-analytics';
import { anonymousUserManager } from '@/lib/anonymous-user';
import type { AnalysisResult } from '@/lib/types';

export function useAnalytics() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [anonymousId, setAnonymousId] = useState<string>('');

  // Initialize analytics on mount
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Get or create anonymous user
        const userId = anonymousUserManager.getAnonymousId();
        setAnonymousId(userId);
        
        // Track user session in Firebase
        await firebaseAnalytics.trackAnonymousUser();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing analytics:', error);
        // Still set as initialized to allow app to continue
        setIsInitialized(true);
      }
    };

    if (typeof window !== 'undefined') {
      initializeAnalytics();
    }
  }, []);

  // Track analysis completion
  const trackAnalysis = async (
    imageData: string,
    demographics: string,
    objective: string,
    results: AnalysisResult,
    processingTimeMs: number
  ): Promise<string | null> => {
    if (!isInitialized) {
      console.warn('Analytics not initialized');
      return null;
    }

    try {
      const sessionId = await firebaseAnalytics.trackAnalysisSession(
        imageData,
        demographics,
        objective,
        results,
        processingTimeMs
      );
      
      return sessionId;
    } catch (error) {
      console.error('❌ Error tracking analysis:', error);
      // Log error but don't fail the entire flow
      try {
        await firebaseAnalytics.logError(
          error as Error,
          'trackAnalysis',
          { demographics, objective }
        );
      } catch (logError) {
        console.error('❌ Error logging analytics error:', logError);
      }
      return null;
    }
  };

  // Track user feedback
  const trackFeedback = async (
    analysisSessionId: string,
    feedbackData: {
      overallRating: number;
      accuracyRating: number;
      usefulnessRating: number;
      feedback: string;
      wouldRecommend: boolean;
      willUseAgain: boolean;
      performanceScoreAccuracy?: number;
      recommendationsQuality?: number;
      improvementSuggestions?: string;
    }
  ): Promise<boolean> => {
    if (!isInitialized) {
      console.warn('Analytics not initialized');
      return false;
    }

    try {
      await firebaseAnalytics.submitFeedback(analysisSessionId, feedbackData);
      return true;
    } catch (error) {
      console.error('Error tracking feedback:', error);
      await firebaseAnalytics.logError(
        error as Error,
        'trackFeedback',
        { analysisSessionId, rating: feedbackData.overallRating }
      );
      return false;
    }
  };

  // Track errors
  const trackError = async (
    error: Error,
    context: string,
    additionalData?: any
  ): Promise<void> => {
    if (!isInitialized) {
      console.warn('Analytics not initialized');
      return;
    }

    try {
      await firebaseAnalytics.logError(error, context, additionalData);
    } catch (logError) {
      console.error('Error logging error:', logError);
    }
  };

  // Get user analysis history
  const getUserHistory = async (limit: number = 10) => {
    if (!isInitialized) {
      console.warn('Analytics not initialized');
      return [];
    }

    try {
      return await firebaseAnalytics.getUserAnalysisHistory(limit);
    } catch (error) {
      console.error('Error getting user history:', error);
      await trackError(error as Error, 'getUserHistory');
      return [];
    }
  };

  // Get user statistics
  const getUserStats = () => {
    const userData = anonymousUserManager.getAnonymousUserData();
    return {
      analysisCount: userData.analysisCount,
      feedbackCount: userData.feedbackCount,
      sessionCount: userData.sessionCount,
      memberSince: userData.createdAt,
      lastActive: userData.lastActive
    };
  };

  // Update user preferences
  const updatePreferences = (preferences: {
    feedbackEnabled?: boolean;
    trackingEnabled?: boolean;
    preferredLanguage?: string;
  }) => {
    anonymousUserManager.updatePreferences(preferences);
  };

  // Get user preferences
  const getPreferences = () => {
    return anonymousUserManager.getPreferences();
  };

  // Clear all user data (for privacy/testing)
  const clearUserData = () => {
    anonymousUserManager.clearAllData();
    setAnonymousId('');
    setIsInitialized(false);
  };

  return {
    isInitialized,
    anonymousId,
    trackAnalysis,
    trackFeedback,
    trackError,
    getUserHistory,
    getUserStats,
    updatePreferences,
    getPreferences,
    clearUserData
  };
}