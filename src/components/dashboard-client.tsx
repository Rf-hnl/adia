"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2, Sparkles, Brain, Zap, Eye, Target, HelpCircle, CheckCircle2, Link, FileImage } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAdAnalysis, getDemographicsFromCreative, getCampaignObjectiveSuggestion } from "@/app/actions";
import type { AnalysisResult } from "@/lib/types";
import { AnalysisPlaceholder } from "./analysis-placeholder";
import { AnalysisSkeleton } from "./analysis-skeleton";
import { AnalysisResults } from "./analysis-results";
import { useAnalytics } from "@/hooks/use-analytics";

// Helper to convert a file to a Base64 data URI
const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export default function DashboardClient() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  
  // Form state managed directly with useState
  const [objective, setObjective] = useState("");
  const [demographics, setDemographics] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  
  // URL input state
  const [imageUrl, setImageUrl] = useState("");
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');

  // Track completion status
  const [demographicsCompleted, setDemographicsCompleted] = useState(false);
  const [objectiveCompleted, setObjectiveCompleted] = useState(false);

  // Analytics tracking
  const [currentAnalysisSessionId, setCurrentAnalysisSessionId] = useState<string | null>(null);
  const [analysisStartTime, setAnalysisStartTime] = useState<number>(0);

  const [errors, setErrors] = useState<{ objective?: string; demographics?: string; creative?: string; }>({});
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize analytics
  const { trackAnalysis, trackError, isInitialized } = useAnalytics();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset all states when new image is uploaded
    setResult(null); // Clear previous analysis results
    setCurrentAnalysisSessionId(null); // Clear previous session
    setCreativeFile(file);
    setImageUrl(""); // Clear URL when using file
    setErrors(prev => ({ ...prev, creative: undefined })); // Clear creative error
    
    try {
      const imageDataUri = await toBase64(file);
      setUploadedImage(imageDataUri);
      
      // Automatically start AI generation
      await handleAutoGeneration(imageDataUri);
    } catch (error) {
      console.error("Error reading file:", error);
      setCreativeFile(null);
      setUploadedImage(null);
      toast({
        variant: "destructive",
        title: "Error de archivo",
        description: "No se pudo leer el archivo subido.",
      });
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      setErrors(prev => ({ ...prev, creative: "Por favor ingresa una URL de imagen" }));
      return;
    }

    // Validate URL format
    const isValidUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
    if (!isValidUrl) {
      setErrors(prev => ({ ...prev, creative: "La URL debe comenzar con http:// o https://" }));
      return;
    }

    // Reset all states when new image URL is set
    setResult(null);
    setCurrentAnalysisSessionId(null);
    setCreativeFile(null); // Clear file when using URL
    setErrors(prev => ({ ...prev, creative: undefined }));
    
    try {
      // Check if the URL is accessible by trying to load it
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      setUploadedImage(imageUrl);
      
      // Automatically start AI generation
      await handleAutoGeneration(imageUrl);
      
      toast({
        title: "Imagen cargada",
        description: "URL de imagen cargada correctamente",
      });
    } catch (error) {
      console.error("Error loading image URL:", error);
      setUploadedImage(null);
      setErrors(prev => ({ ...prev, creative: "No se pudo cargar la imagen desde la URL proporcionada" }));
      toast({
        variant: "destructive",
        title: "Error de URL",
        description: "No se pudo cargar la imagen desde la URL proporcionada",
      });
    }
  };

  const handleAutoGeneration = async (imageUrl: string) => {
    setIsAutoGenerating(true);
    
    try {
      // Step 1: Generate demographics first
      const demographicsResponse = await getDemographicsFromCreative({ creativeDataUri: imageUrl });
      
      if (demographicsResponse.success && demographicsResponse.data) {
        setDemographics(demographicsResponse.data.demographics);
        setDemographicsCompleted(true);
        setErrors(prev => ({ ...prev, demographics: undefined }));
        
        toast({
          title: "¡Demografía generada!",
          description: "Generando objetivo de campaña... (puede tardar hasta 15 segundos)",
        });
        
        // Step 2: Generate campaign objective after demographics is complete
        const objectiveResponse = await getCampaignObjectiveSuggestion({ 
          creativeDataUri: imageUrl,
          demographics: demographicsResponse.data.demographics 
        });
        
        console.log('Objective response:', objectiveResponse);
        
        if (objectiveResponse.success && objectiveResponse.data) {
          console.log('Setting objective to:', objectiveResponse.data.suggestedObjective);
          setObjective(objectiveResponse.data.suggestedObjective);
          setObjectiveCompleted(true);
          setErrors(prev => ({ ...prev, objective: undefined }));
          
          toast({
            title: "¡Generación automática completada!",
            description: "Demografía y objetivo de campaña generados con IA.",
          });
        } else {
          console.error('Objective generation failed:', objectiveResponse.error);
          toast({
            variant: "destructive",
            title: "Error en objetivo",
            description: "No se pudo generar el objetivo automáticamente.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error en demografía",
          description: "No se pudo generar la demografía automáticamente.",
        });
      }
    } catch (error) {
      console.error("Error in auto generation:", error);
      toast({
        variant: "destructive", 
        title: "Generación automática fallida",
        description: "Hubo un error al generar automáticamente los datos. Puedes usar los botones manuales.",
      });
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleRemoveImage = () => {
    // Reset all states when image is removed
    setResult(null); // Clear analysis results
    setCurrentAnalysisSessionId(null); // Clear session
    setUploadedImage(null);
    setCreativeFile(null);
    setImageUrl(""); // Clear URL
    setDemographics("");
    setObjective("");
    setDemographicsCompleted(false);
    setObjectiveCompleted(false);
    setErrors({}); // Clear all errors
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExtractDemographics = async () => {
    if (!uploadedImage) {
      toast({
        variant: "destructive",
        title: "No hay imagen",
        description: "Por favor, sube una imagen primero.",
      });
      return;
    }

    setIsExtracting(true);
    setDemographics("Extrayendo información de la imagen...");
    try {
      const response = await getDemographicsFromCreative({ creativeDataUri: uploadedImage });
      if (response.success && response.data) {
        setDemographics(response.data.demographics);
        setDemographicsCompleted(true);
        setErrors(prev => ({ ...prev, demographics: undefined })); // Clear demographics error
        toast({
          title: "¡Éxito!",
          description: "La demografía se ha extraído de la imagen.",
        });
      } else {
        setDemographics("");
        toast({
          variant: "destructive",
          title: "Extracción fallida",
          description: response.error || "No se pudo extraer la demografía de la imagen.",
        });
      }
    } catch (error) {
      console.error("Error extracting demographics:", error);
      setDemographics("");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Algo salió mal durante la extracción. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const validateForm = () => {
    const newErrors: { objective?: string; demographics?: string; creative?: string; } = {};
    if (!objective) newErrors.objective = "El objetivo de la campaña es obligatorio.";
    if (!demographics) newErrors.demographics = "El público objetivo es obligatorio.";
    if (!creativeFile) newErrors.creative = "La creatividad del anuncio es obligatoria.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setResult(null);
    
    // Start tracking analysis time
    const startTime = Date.now();
    setAnalysisStartTime(startTime);

    try {
      const base64data = await toBase64(creativeFile!);
      const customPrompt = localStorage.getItem("customAdAnalysisPrompt");
      
      const response = await getAdAnalysis({
        creativeDataUri: base64data,
        objective: objective,
        demographics: demographics,
        ...(customPrompt && { customPrompt }),
      });

      if (response.success && response.data) {
        setResult(response.data);
        
        // Track analysis completion
        const processingTime = Date.now() - startTime;
        try {
          const sessionId = await trackAnalysis(
            base64data,
            demographics,
            objective,
            response.data,
            processingTime
          );
          setCurrentAnalysisSessionId(sessionId);
        } catch (analyticsError) {
          console.error('Analytics tracking failed:', analyticsError);
          // Don't fail the main flow for analytics errors
        }
      } else {
        toast({
          variant: "destructive",
          title: "Análisis fallido",
          description: response.error || "Ocurrió un error desconocido.",
        });
      }
    } catch (error) {
      console.error("Error during ad analysis:", error);
      
      // Track error for analytics
      try {
        await trackError(error as Error, 'ad_analysis', {
          objective,
          demographics: demographics.substring(0, 50), // Truncate for privacy
          hasImage: !!uploadedImage
        });
      } catch (analyticsError) {
        console.error('Error tracking failed:', analyticsError);
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar el archivo. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 lg:py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 max-w-7xl mx-auto w-full">
        {/* Input Card */}
        <Card className="lg:col-span-2 border border-blue-200 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
          <form onSubmit={onFormSubmit} noValidate>
            <CardHeader className="text-center pb-6 space-y-4">
              {/* Breadcrumb */}
              <div className="text-sm text-slate-700 font-medium">
                Campañas › Creative Analyzer
              </div>
              
              <div className="flex justify-center items-center gap-4">
                <div className="relative">
                  <Brain className="w-10 h-10 text-blue-600" />
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-blue-200 text-slate-800">
                    <DialogHeader>
                      <DialogTitle className="text-xl text-blue-600">
                        ¿Cómo funciona el AI Creative Analyzer?
                      </DialogTitle>
                      <DialogDescription className="text-slate-600 space-y-4 mt-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Eye className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-slate-800">1. Sube tu creatividad</p>
                              <p className="text-sm">Carga la imagen de tu anuncio (PNG, JPG, GIF)</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Zap className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-slate-800">2. Define tu audiencia</p>
                              <p className="text-sm">Describe manualmente o usa IA para extraer la demografía de tu imagen</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-slate-800">3. Selecciona objetivo</p>
                              <p className="text-sm">Elige el objetivo de tu campaña (reconocimiento, tráfico, conversiones, etc.)</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Brain className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-slate-800">4. Análisis con IA</p>
                              <p className="text-sm">Nuestra IA analiza tu creatividad y genera recomendaciones personalizadas para optimizar tu campaña</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700">
                            <strong>💡 Tip:</strong> Mientras más específica sea la descripción de tu audiencia, más precisas serán las recomendaciones de IA.
                          </p>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  AI Creative Analyzer
                </h1>
                <h2 className="text-base text-slate-600 font-medium">
                  Potenciado por Inteligencia Artificial avanzada
                </h2>
                <div className="text-xs text-slate-600 mt-1">
                  v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Upload Section */}
              <Card className="border border-slate-200 bg-slate-50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <Label className="text-slate-800 font-semibold text-base">
                      Creatividad del anuncio
                    </Label>
                  </div>
                  
                  <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as 'file' | 'url')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100 border border-slate-300">
                      <TabsTrigger 
                        value="file" 
                        className="flex items-center gap-2 text-slate-800 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        <FileImage className="w-4 h-4" />
                        Subir Archivo
                      </TabsTrigger>
                      <TabsTrigger 
                        value="url" 
                        className="flex items-center gap-2 text-slate-800 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        <Link className="w-4 h-4" />
                        URL de Imagen
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="mt-4">
                      <div className="w-full">
                        <label
                          htmlFor="file-upload"
                          className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 group ${
                            uploadedImage && !imageUrl
                              ? 'border-blue-400 bg-blue-50' 
                              : 'border-blue-300 bg-gray-50 hover:bg-blue-50'
                          }`}
                        >
                          {uploadedImage && !imageUrl ? (
                            <>
                              <Image
                                src={uploadedImage}
                                alt="Creatividad subida"
                                fill
                                className="object-contain rounded-xl p-3"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 bg-red-500 hover:bg-red-600 shadow-lg transition-all duration-200"
                                onClick={handleRemoveImage}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-4 pb-4 text-center">
                              <UploadCloud className="w-10 h-10 mb-3 text-blue-500 group-hover:text-blue-600 transition-colors" />
                              <p className="mb-1 text-slate-700">
                                <span className="font-semibold text-blue-500 group-hover:text-blue-600">
                                  Haz clic para subir
                                </span>{" "}
                                o arrastra tu creatividad
                              </p>
                              <p className="text-sm text-slate-600">
                                PNG, JPG, GIF hasta 10MB
                              </p>
                            </div>
                          )}
                        </label>
                        <Input
                          id="file-upload"
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/png, image/jpeg, image/gif"
                          onChange={handleFileChange}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="url" className="mt-4">
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            type="url"
                            placeholder="https://ejemplo.com/mi-imagen.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="flex-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-600 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                          />
                          <Button 
                            type="button" 
                            onClick={handleUrlSubmit}
                            disabled={!imageUrl.trim()}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 hover:border-slate-400 disabled:bg-slate-50 disabled:text-slate-600 disabled:border-slate-200"
                          >
                            Cargar
                          </Button>
                        </div>
                        
                        {uploadedImage && imageUrl && (
                          <div className="relative w-full h-40 border-2 border-blue-400 bg-blue-50 rounded-xl overflow-hidden">
                            <Image
                              src={uploadedImage}
                              alt="Imagen desde URL"
                              fill
                              className="object-contain p-3"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 bg-red-500 hover:bg-red-600 shadow-lg transition-all duration-200"
                              onClick={handleRemoveImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        <p className="text-sm text-slate-600">
                          Ingresa una URL válida que apunte directamente a una imagen (PNG, JPG, GIF)
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  {errors.creative && (
                    <p className="text-sm font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                      {errors.creative}
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {/* Demographics Section */}
              <Card className="border border-slate-200 bg-slate-50">
                <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <Label htmlFor="demographics" className="text-slate-800 font-semibold text-base">
                      Demografía del público objetivo
                    </Label>
                    {isAutoGenerating ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : demographicsCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExtractDemographics}
                    disabled={!uploadedImage || isExtracting}
                    className="shrink-0 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 hover:shadow-md disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generar con IA
                  </Button>
                </div>
                <Textarea
                  id="demographics"
                  placeholder="Sube una imagen para generar la demografía con IA, o descríbela tú mismo aquí..."
                  className="resize-none bg-white border-slate-300 text-slate-700 placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 leading-relaxed"
                  value={demographics}
                  onChange={(e) => {
                    setDemographics(e.target.value);
                    setDemographicsCompleted(e.target.value.trim().length > 0);
                    setErrors(prev => ({...prev, demographics: undefined}));
                  }}
                  rows={3}
                />
                {errors.demographics && (
                  <p className="text-sm font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    {errors.demographics}
                  </p>
                )}
                </CardContent>
              </Card>

              {/* Objective Section */}
              <Card className="border border-slate-200 bg-slate-50">
                <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <Label className="text-slate-800 font-semibold text-base">Objetivo de la campaña</Label>
                  {isAutoGenerating ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : objectiveCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : null}
                </div>
                <Select onValueChange={(value) => {
                    setObjective(value);
                    setObjectiveCompleted(value.length > 0);
                    setErrors(prev => ({...prev, objective: undefined}));
                }} value={objective}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 h-11">
                    <SelectValue placeholder="Selecciona un objetivo" className="text-slate-600" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-lg">
                    <SelectItem value="awareness" className="text-slate-800 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        Reconocimiento
                      </div>
                    </SelectItem>
                    <SelectItem value="traffic" className="text-slate-800 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Tráfico
                      </div>
                    </SelectItem>
                    <SelectItem value="engagement" className="text-slate-800 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Interacción
                      </div>
                    </SelectItem>
                    <SelectItem value="lead_generation" className="text-slate-800 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        Generación de leads
                      </div>
                    </SelectItem>
                    <SelectItem value="app_installs" className="text-slate-800 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        Instalaciones de la app
                      </div>
                    </SelectItem>
                    <SelectItem value="conversion" className="text-slate-800 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Conversiones
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.objective && (
                  <p className="text-sm font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    {errors.objective}
                  </p>
                )}
                </CardContent>
              </Card>
            </CardContent>
            
            <CardFooter className="pt-6 pb-6 px-6 sticky bottom-0 bg-white border-t border-slate-200">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isLoading}
              >
                <span className="flex items-center justify-center">
                  {isLoading && (
                    <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Analizando..." : "🚀 Analizar con IA"}
                </span>
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Results Card */}
        <div className="lg:col-span-3 h-fit">
          {isLoading ? (
            <Card className="border border-blue-200 bg-white h-full shadow-lg">
              <div className="p-6">
                <AnalysisSkeleton />
              </div>
            </Card>
          ) : result ? (
            <Card className="border border-blue-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <AnalysisResults 
                result={result} 
                image={uploadedImage} 
                analysisSessionId={currentAnalysisSessionId}
              />
            </Card>
          ) : (
            <Card className="border border-blue-200 bg-white h-full shadow-lg">
              <div className="p-6">
                <AnalysisPlaceholder />
              </div>
            </Card>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}