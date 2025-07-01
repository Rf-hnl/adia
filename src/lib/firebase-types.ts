// Firebase Types for AI Creative Analyzer

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLogin: Date;
  plan: 'free' | 'pro' | 'enterprise';
  analysesUsed: number;
  analysesLimit: number;
}

export interface Analysis {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Input data
  imageUrl: string;
  imageMetadata: {
    originalName: string;
    size: number;
    type: string;
  };
  demographics: string;
  objective: 'awareness' | 'traffic' | 'engagement' | 'lead_generation' | 'app_installs' | 'conversion';
  
  // AI Results
  performanceScore: number;
  clarityScore: number;
  designScore: number;
  audienceAffinityScore: number;
  recommendations: string[];
  
  // Metadata
  processingTime: number;
  version: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface AnalysisHistory {
  userId: string;
  analyses: Analysis[];
  totalAnalyses: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUsage {
  userId: string;
  date: string; // YYYY-MM-DD format
  analysesCount: number;
  plan: string;
}

export interface AppSettings {
  version: string;
  maintenanceMode: boolean;
  aiModelVersion: string;
  features: {
    enableAnalytics: boolean;
    enableExport: boolean;
    enableHistory: boolean;
  };
  limits: {
    free: number;
    pro: number;
    enterprise: number;
  };
}