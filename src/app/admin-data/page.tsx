"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Eye, EyeOff, Download, RefreshCw, TrendingUp, Users, MessageSquare, AlertTriangle, BarChart3, Webhook, Copy, Code } from 'lucide-react';

const ADMIN_PASSWORD = 'QWE123';

interface AnalysisSession {
  id: string;
  anonymousUserId: string;
  createdAt: any;
  imageHash: string;
  demographics: string;
  objective: string;
  results: {
    performanceScore: number;
    clarityScore: number;
    designScore: number;
    audienceAffinityScore: number;
    recommendations: string[];
  };
  processingTimeMs: number;
  userRating?: number;
  userFeedback?: string;
}

interface FeedbackData {
  id: string;
  anonymousUserId: string;
  analysisSessionId: string;
  createdAt: any;
  overallRating: number;
  accuracyRating: number;
  usefulnessRating: number;
  feedback: string;
  wouldRecommend: boolean;
  willUseAgain: boolean;
}

interface UsageStats {
  date: string;
  totalAnalyses: number;
  uniqueUsers: number;
  avgProcessingTime: number;
  topObjectives: Record<string, number>;
  feedbackCount: number;
  avgRating: number;
}

interface AnonymousUser {
  id: string;
  createdAt: any;
  lastActive: any;
  analysisCount: number;
  feedbackCount: number;
  sessionCount: number;
  deviceInfo: any;
}

interface ErrorLog {
  id: string;
  anonymousUserId: string;
  createdAt: any;
  error: {
    message: string;
    name: string;
  };
  context: string;
}

export default function AdminDataPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [users, setUsers] = useState<AnonymousUser[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);

  // Overview stats
  const [overviewStats, setOverviewStats] = useState({
    totalUsers: 0,
    totalAnalyses: 0,
    totalFeedback: 0,
    avgRating: 0,
    totalErrors: 0
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      loadAllData();
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAnalysisSessions(),
        loadFeedbackData(),
        loadUsageStats(),
        loadUsers(),
        loadErrorLogs()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysisSessions = async () => {
    const q = query(
      collection(db, 'analysis_sessions'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as AnalysisSession[];
    setAnalysisSessions(sessions);
  };

  const loadFeedbackData = async () => {
    const q = query(
      collection(db, 'feedback'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    const feedback = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as FeedbackData[];
    setFeedbackData(feedback);
  };

  const loadUsageStats = async () => {
    const q = query(
      collection(db, 'usage_stats'),
      orderBy('date', 'desc'),
      limit(30)
    );
    const snapshot = await getDocs(q);
    const stats = snapshot.docs.map(doc => ({
      ...doc.data()
    })) as UsageStats[];
    setUsageStats(stats);
  };

  const loadUsers = async () => {
    const q = query(
      collection(db, 'anonymous_users'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    const userData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastActive: doc.data().lastActive?.toDate()
    })) as AnonymousUser[];
    setUsers(userData);
  };

  const loadErrorLogs = async () => {
    const q = query(
      collection(db, 'error_logs'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const errors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as ErrorLog[];
    setErrorLogs(errors);
  };

  useEffect(() => {
    if (analysisSessions.length > 0 || users.length > 0) {
      const avgRating = feedbackData.length > 0 
        ? feedbackData.reduce((sum, f) => sum + f.overallRating, 0) / feedbackData.length 
        : 0;

      setOverviewStats({
        totalUsers: users.length,
        totalAnalyses: analysisSessions.length,
        totalFeedback: feedbackData.length,
        avgRating: Number(avgRating.toFixed(1)),
        totalErrors: errorLogs.length
      });
    }
  }, [analysisSessions, users, feedbackData, errorLogs]);

  const formatDate = (date: Date) => {
    return date?.toLocaleString('es-ES') || 'N/A';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-blue-600 bg-blue-50';
    return 'text-red-600 bg-red-50';
  };

  const downloadData = (data: any[], filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              🔒 Admin Access
            </CardTitle>
            <CardDescription className="text-slate-300">
              Acceso restringido a datos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Contraseña de acceso"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Acceder
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              📊 ADIA Admin Dashboard
            </h1>
            <p className="text-slate-300">
              Panel administrativo - Datos de la base de datos
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={loadAllData} 
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button 
              onClick={() => {
                setIsAuthenticated(false);
                setPassword('');
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-300">
              <TrendingUp className="h-4 w-4 mr-2" />
              Análisis
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300">
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white text-slate-300">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="errors" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-300">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Errores
            </TabsTrigger>
            <TabsTrigger value="webhook" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-slate-300">
              <Webhook className="h-4 w-4 mr-2" />
              Webhook
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-white" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-100">Usuarios</p>
                      <p className="text-2xl font-bold text-white">{overviewStats.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-white" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-100">Análisis</p>
                      <p className="text-2xl font-bold text-white">{overviewStats.totalAnalyses}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <MessageSquare className="h-8 w-8 text-white" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-100">Feedback</p>
                      <p className="text-2xl font-bold text-white">{overviewStats.totalFeedback}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-white" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-100">Rating Promedio</p>
                      <p className="text-2xl font-bold text-white">{overviewStats.avgRating}/5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-white" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-red-100">Errores</p>
                      <p className="text-2xl font-bold text-white">{overviewStats.totalErrors}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">⚡ Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg border border-slate-500">
                      <div>
                        <p className="font-medium text-white">Análisis #{session.id.slice(-6)}</p>
                        <p className="text-sm text-slate-300">
                          Score: {session.results.performanceScore} | {session.objective}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-300">{formatDate(session.createdAt)}</p>
                        <Badge className={getScoreColor(session.results.performanceScore)}>
                          {session.results.performanceScore}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">🎨 Sesiones de Análisis ({analysisSessions.length})</h2>
              <Button 
                onClick={() => downloadData(analysisSessions, 'analysis_sessions')}
                className="bg-green-600 hover:bg-green-700 text-white border-green-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar JSON
              </Button>
            </div>

            <div className="grid gap-4">
              {analysisSessions.map((session) => (
                <Card key={session.id} className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2 text-white">📋 Información General</h3>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-300"><strong className="text-white">ID:</strong> {session.id}</p>
                          <p className="text-slate-300"><strong className="text-white">Usuario:</strong> {session.anonymousUserId.slice(-8)}</p>
                          <p className="text-slate-300"><strong className="text-white">Fecha:</strong> {formatDate(session.createdAt)}</p>
                          <p className="text-slate-300"><strong className="text-white">Objetivo:</strong> {session.objective}</p>
                          <p className="text-slate-300"><strong className="text-white">Tiempo:</strong> {session.processingTimeMs}ms</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2 text-white">🎯 Puntuaciones</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-300">Performance:</span>
                            <Badge className={getScoreColor(session.results.performanceScore)}>
                              {session.results.performanceScore}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Claridad:</span>
                            <Badge className={getScoreColor(session.results.clarityScore)}>
                              {session.results.clarityScore}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Diseño:</span>
                            <Badge className={getScoreColor(session.results.designScore)}>
                              {session.results.designScore}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Audiencia:</span>
                            <Badge className={getScoreColor(session.results.audienceAffinityScore)}>
                              {session.results.audienceAffinityScore}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2 text-white">👥 Demografía</h3>
                        <p className="text-sm text-slate-300 mb-4">
                          {session.demographics}
                        </p>
                        
                        {session.userRating && (
                          <div>
                            <h4 className="font-medium mb-1 text-white">⭐ Rating Usuario</h4>
                            <div className="flex items-center">
                              <span className="text-yellow-400">★</span>
                              <span className="ml-1 text-slate-300">{session.userRating}/5</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-semibold mb-2 text-white">💡 Recomendaciones ({session.results.recommendations.length})</h3>
                      <div className="space-y-1">
                        {session.results.recommendations.map((rec, index) => (
                          <p key={index} className="text-sm text-slate-300">
                            {index + 1}. {rec}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">💬 Feedback de Usuarios ({feedbackData.length})</h2>
              <Button 
                onClick={() => downloadData(feedbackData, 'feedback_data')}
                className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar JSON
              </Button>
            </div>

            <div className="grid gap-4">
              {feedbackData.map((feedback) => (
                <Card key={feedback.id} className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-white">📝 Feedback #{feedback.id.slice(-6)}</h3>
                          <Badge className="bg-purple-600 text-white border-purple-500">
                            {formatDate(feedback.createdAt)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-300">Rating General:</span>
                            <span className="font-medium text-yellow-400">{feedback.overallRating}/5 ⭐</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Precisión:</span>
                            <span className="font-medium text-blue-400">{feedback.accuracyRating}/5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Utilidad:</span>
                            <span className="font-medium text-green-400">{feedback.usefulnessRating}/5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Recomendaría:</span>
                            <Badge className={feedback.wouldRecommend ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                              {feedback.wouldRecommend ? "Sí" : "No"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Usaría de nuevo:</span>
                            <Badge className={feedback.willUseAgain ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                              {feedback.willUseAgain ? "Sí" : "No"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-white">💬 Comentarios</h4>
                        <p className="text-sm text-slate-300 bg-slate-700 p-3 rounded-lg border border-slate-600">
                          {feedback.feedback || "Sin comentarios"}
                        </p>
                        
                        <div className="mt-4 text-xs text-slate-400">
                          <p>Usuario: {feedback.anonymousUserId.slice(-8)}</p>
                          <p>Sesión: {feedback.analysisSessionId.slice(-8)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">👥 Usuarios Anónimos ({users.length})</h2>
              <Button 
                onClick={() => downloadData(users, 'anonymous_users')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar JSON
              </Button>
            </div>

            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2 text-white">👤 Usuario #{user.id.slice(-8)}</h3>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-300"><strong className="text-white">Creado:</strong> {formatDate(user.createdAt)}</p>
                          <p className="text-slate-300"><strong className="text-white">Última actividad:</strong> {formatDate(user.lastActive)}</p>
                          <p className="text-slate-300"><strong className="text-white">Análisis realizados:</strong> {user.analysisCount}</p>
                          <p className="text-slate-300"><strong className="text-white">Feedback dado:</strong> {user.feedbackCount}</p>
                          <p className="text-slate-300"><strong className="text-white">Sesiones:</strong> {user.sessionCount}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-white">📱 Dispositivo</h4>
                        <div className="space-y-1 text-sm text-slate-300">
                          <p><strong className="text-white">Plataforma:</strong> {user.deviceInfo?.platform || 'N/A'}</p>
                          <p><strong className="text-white">Idioma:</strong> {user.deviceInfo?.language || 'N/A'}</p>
                          <p><strong className="text-white">Resolución:</strong> {user.deviceInfo?.screenResolution || 'N/A'}</p>
                          <p><strong className="text-white">Zona horaria:</strong> {user.deviceInfo?.timezone || 'N/A'}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-white">⚡ Actividad</h4>
                        <div className="space-y-2">
                          <Badge className="bg-blue-600 text-white border-blue-500">
                            {user.analysisCount} análisis
                          </Badge>
                          <Badge className="bg-purple-600 text-white border-purple-500">
                            {user.feedbackCount} feedback
                          </Badge>
                          <Badge className="bg-indigo-600 text-white border-indigo-500">
                            {user.sessionCount} sesiones
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Usage Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">📈 Estadísticas de Uso ({usageStats.length} días)</h2>
              <Button 
                onClick={() => downloadData(usageStats, 'usage_stats')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar JSON
              </Button>
            </div>

            <div className="grid gap-4">
              {usageStats.map((stat) => (
                <Card key={stat.date} className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2 text-white">📅 {stat.date}</h3>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-300"><strong className="text-white">Total análisis:</strong> {stat.totalAnalyses}</p>
                          <p className="text-slate-300"><strong className="text-white">Usuarios únicos:</strong> {stat.uniqueUsers}</p>
                          <p className="text-slate-300"><strong className="text-white">Tiempo promedio:</strong> {stat.avgProcessingTime}ms</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-white">🎯 Objetivos Populares</h4>
                        <div className="space-y-1 text-sm">
                          {Object.entries(stat.topObjectives || {})
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .map(([objective, count]) => (
                              <p key={objective} className="text-slate-300">
                                <strong className="text-white">{objective}:</strong> {count as number}
                              </p>
                            ))
                          }
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-white">💬 Feedback</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-300"><strong className="text-white">Total feedback:</strong> {stat.feedbackCount}</p>
                          <p className="text-slate-300"><strong className="text-white">Rating promedio:</strong> {stat.avgRating?.toFixed(1)}/5</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-white">📈 Métricas</h4>
                        <div className="space-y-2">
                          <Badge className="bg-green-600 text-white border-green-500">
                            {((stat.feedbackCount / stat.totalAnalyses) * 100).toFixed(1)}% feedback rate
                          </Badge>
                          <Badge className="bg-blue-600 text-white border-blue-500">
                            {(stat.totalAnalyses / stat.uniqueUsers).toFixed(1)} análisis/usuario
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Error Logs Tab */}
          <TabsContent value="errors" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">🚨 Logs de Errores ({errorLogs.length})</h2>
              <Button 
                onClick={() => downloadData(errorLogs, 'error_logs')}
                className="bg-red-600 hover:bg-red-700 text-white border-red-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar JSON
              </Button>
            </div>

            <div className="grid gap-4">
              {errorLogs.map((error) => (
                <Card key={error.id} className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                          <h3 className="font-semibold text-white">🚨 Error #{error.id.slice(-6)}</h3>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-300"><strong className="text-white">Fecha:</strong> {formatDate(error.createdAt)}</p>
                          <p className="text-slate-300"><strong className="text-white">Usuario:</strong> {error.anonymousUserId.slice(-8)}</p>
                          <p className="text-slate-300"><strong className="text-white">Contexto:</strong> {error.context}</p>
                          <p className="text-slate-300"><strong className="text-white">Tipo:</strong> {error.error.name}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-white">📜 Mensaje de Error</h4>
                        <p className="text-sm text-red-300 bg-red-900/30 p-3 rounded-lg font-mono border border-red-500/30">
                          {error.error.message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Webhook Documentation Tab */}
          <TabsContent value="webhook" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">🔗 Webhook API - Análisis de Creativos</h2>
            </div>

            {/* Webhook Overview */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">📡 Información del Webhook</CardTitle>
                <CardDescription className="text-slate-300">
                  API endpoint para análisis de creativos publicitarios desde herramientas externas
                </CardDescription>
                <div className="mt-2">
                  <Badge className="bg-green-600 text-white">
                    ✅ ACTIVO: Análisis real de IA con guardado en Firebase
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-white mb-2">🎯 Endpoint URL</h3>
                    <div className="bg-slate-700 p-3 rounded-lg border border-slate-600">
                      <code className="text-cyan-400 text-sm font-mono">
                        POST http://localhost:3000/api/webhook/analyze
                      </code>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">🔧 Content-Type</h3>
                    <div className="bg-slate-700 p-3 rounded-lg border border-slate-600">
                      <code className="text-green-400 text-sm font-mono">
                        application/json
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Format */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">📥 Formato de Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">📋 Campos Requeridos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-slate-700 rounded border border-slate-600">
                      <span className="text-slate-300"><strong className="text-white">image</strong> (string)</span>
                      <Badge className="bg-blue-600 text-white">Base64 o HTTP/HTTPS URL</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-700 rounded border border-slate-600">
                      <span className="text-slate-300"><strong className="text-white">demographics</strong> (string)</span>
                      <Badge className="bg-green-600 text-white">Min 10 chars</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-700 rounded border border-slate-600">
                      <span className="text-slate-300"><strong className="text-white">objective</strong> (string)</span>
                      <Badge className="bg-purple-600 text-white">Min 5 chars</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">💾 Ejemplo de JSON</h3>
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-600 overflow-x-auto">
                    <pre className="text-sm text-slate-300 font-mono">{`// Opción 1: Con imagen base64
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "demographics": "Mujeres de 25-35 años, urbanas, con ingresos medios-altos, interesadas en moda y lifestyle",
  "objective": "Aumentar ventas de productos de belleza en temporada navideña"
}

// Opción 2: Con URL de imagen
{
  "image": "https://example.com/mi-imagen.jpg",
  "demographics": "Mujeres de 25-35 años, urbanas, con ingresos medios-altos, interesadas en moda y lifestyle",
  "objective": "Aumentar ventas de productos de belleza en temporada navideña"
}`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Format */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">📤 Formato de Response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">✅ Respuesta Exitosa</h3>
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-600 overflow-x-auto">
                    <pre className="text-sm text-slate-300 font-mono">{`{
  "success": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "analysis": {
    "Desglose del rendimiento": {
      "Puntuación de rendimiento general": 92,
      "Claridad y legibilidad": 88,
      "Atractivo del diseño": 95,
      "Afinidad con la audiencia": 90,
      "Explicación detallada": "..."
    },
    "Recomendaciones de IA": [
      "Mejorar contraste del texto principal",
      "Añadir llamada a la acción más prominente"
    ]
  },
  "metadata": {
    "processingTimeMs": 2500,
    "demographics": "...",
    "objective": "...",
    "version": "1.0.0"
  }
}`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* cURL Command */}
            <Card className="bg-gradient-to-br from-cyan-800 to-cyan-700 border-cyan-600 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">🔧 Comando cURL para Postman/n8n</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white">💻 Comando Completo</h3>
                    <Button 
                      onClick={() => {
                        const curlCommand = `curl -X POST http://localhost:3000/api/webhook/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "https://example.com/mi-imagen.jpg",
    "demographics": "Mujeres de 25-35 años, urbanas, con ingresos medios-altos, interesadas en moda y lifestyle",
    "objective": "Aumentar ventas de productos de belleza en temporada navideña"
  }'`;
                        navigator.clipboard.writeText(curlCommand);
                        alert('¡Comando cURL copiado al portapapeles!');
                      }}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar cURL
                    </Button>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-lg border border-cyan-500 overflow-x-auto">
                    <pre className="text-sm text-cyan-300 font-mono">{`curl -X POST http://localhost:3000/api/webhook/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "https://example.com/mi-imagen.jpg",
    "demographics": "Mujeres de 25-35 años, urbanas, con ingresos medios-altos, interesadas en moda y lifestyle",
    "objective": "Aumentar ventas de productos de belleza en temporada navideña"
  }'`}</pre>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">🟢 Para Postman</h4>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p>1. Método: <span className="text-cyan-400">POST</span></p>
                      <p>2. URL: <span className="text-cyan-400">http://localhost:3000/api/webhook/analyze</span></p>
                      <p>3. Headers: <span className="text-cyan-400">Content-Type: application/json</span></p>
                      <p>4. Body: <span className="text-cyan-400">Raw JSON</span></p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">🔄 Para n8n</h4>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p>1. Nodo: <span className="text-cyan-400">HTTP Request</span></p>
                      <p>2. Method: <span className="text-cyan-400">POST</span></p>
                      <p>3. URL: <span className="text-cyan-400">{'{{$env.ADIA_WEBHOOK_URL}}'}</span></p>
                      <p>4. Body: <span className="text-cyan-400">JSON</span></p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">🖼️ Formatos Imagen</h4>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p>✅ <span className="text-green-400">Base64:</span> data:image/...</p>
                      <p>✅ <span className="text-blue-400">HTTP URL:</span> http://...</p>
                      <p>✅ <span className="text-blue-400">HTTPS URL:</span> https://...</p>
                      <p>❌ <span className="text-red-400">Archivos locales</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Examples */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">💡 Casos de Uso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                    <h4 className="font-semibold text-white mb-2">🤖 Automatización</h4>
                    <p className="text-sm text-slate-300">Integra con n8n para análisis automático de creativos desde Google Drive o Dropbox</p>
                  </div>
                  <div className="p-4 bg-green-900/30 rounded-lg border border-green-500/30">
                    <h4 className="font-semibold text-white mb-2">🔬 Testing</h4>
                    <p className="text-sm text-slate-300">Usa Postman para probar diferentes combinaciones de demografías y objetivos</p>
                  </div>
                  <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                    <h4 className="font-semibold text-white mb-2">🔄 Integración</h4>
                    <p className="text-sm text-slate-300">Conecta con herramientas de diseño o plataformas de marketing existentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}