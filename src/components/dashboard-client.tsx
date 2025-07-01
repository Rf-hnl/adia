"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2, Sparkles, Brain, Zap, Eye, Target, HelpCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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

  // Track completion status
  const [demographicsCompleted, setDemographicsCompleted] = useState(false);
  const [objectiveCompleted, setObjectiveCompleted] = useState(false);

  const [errors, setErrors] = useState<{ objective?: string; demographics?: string; creative?: string; }>({});
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCreativeFile(file);
    setErrors(prev => ({ ...prev, creative: undefined })); // Clear creative error
    try {
      const imageUrl = await toBase64(file);
      setUploadedImage(imageUrl);
      
      // Automatically start AI generation
      await handleAutoGeneration(imageUrl);
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

  const handleAutoGeneration = async (imageUrl: string) => {
    setIsAutoGenerating(true);
    
    try {
      // Generate demographics and campaign objective in parallel
      const [demographicsResponse, objectiveResponse] = await Promise.allSettled([
        getDemographicsFromCreative({ creativeDataUri: imageUrl }),
        getCampaignObjectiveSuggestion({ creativeDataUri: imageUrl })
      ]);

      // Handle demographics result
      if (demographicsResponse.status === 'fulfilled' && demographicsResponse.value.success) {
        setDemographics(demographicsResponse.value.data!.demographics);
        setDemographicsCompleted(true);
        setErrors(prev => ({ ...prev, demographics: undefined }));
      }

      // Handle objective result
      if (objectiveResponse.status === 'fulfilled' && objectiveResponse.value.success) {
        setObjective(objectiveResponse.value.data!.suggestedObjective);
        setObjectiveCompleted(true);
        setErrors(prev => ({ ...prev, objective: undefined }));
      }

      toast({
        title: "¡Generación automática completada!",
        description: "La demografía y el objetivo de campaña se han generado automáticamente con IA.",
      });
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
    setUploadedImage(null);
    setCreativeFile(null);
    setDemographics("");
    setObjective("");
    setDemographicsCompleted(false);
    setObjectiveCompleted(false);
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
      } else {
        toast({
          variant: "destructive",
          title: "Análisis fallido",
          description: response.error || "Ocurrió un error desconocido.",
        });
      }
    } catch (error) {
      console.error("Error during ad analysis:", error);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-7xl mx-auto w-full">
        {/* Input Card */}
        <Card className="border border-blue-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
          <form onSubmit={onFormSubmit} noValidate>
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="relative">
                  <Brain className="w-10 h-10 text-blue-500" />
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="bg-white border-blue-300 text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                    >
                      <HelpCircle className="h-4 w-4" />
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
              <CardTitle className="text-2xl lg:text-3xl font-bold text-blue-600">
                AI Creative Analyzer
              </CardTitle>
              <CardDescription className="text-slate-600 text-lg mt-2">
                Potenciado por Inteligencia Artificial avanzada
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <Label htmlFor="file-upload" className="text-slate-700 font-semibold">
                    Creatividad del anuncio
                  </Label>
                </div>
                <div className="w-full">
                  <label
                    htmlFor="file-upload"
                    className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 group ${
                      uploadedImage 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-blue-300 bg-gray-50 hover:bg-blue-50'
                    }`}
                  >
                    {uploadedImage ? (
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
                        <p className="text-sm text-slate-500">
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
                {errors.creative && (
                  <p className="text-sm font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    {errors.creative}
                  </p>
                )}
              </div>
              
              {/* Demographics Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    <Label htmlFor="demographics" className="text-slate-700 font-semibold">
                      Demografía del público objetivo
                    </Label>
                    {isAutoGenerating ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    ) : demographicsCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
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
                  className="resize-none bg-white border-gray-300 text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
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
              </div>

              {/* Objective Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <Label className="text-slate-700 font-semibold">Objetivo de la campaña</Label>
                  {isAutoGenerating ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : objectiveCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : null}
                </div>
                <Select onValueChange={(value) => {
                    setObjective(value);
                    setObjectiveCompleted(value.length > 0);
                    setErrors(prev => ({...prev, objective: undefined}));
                }} value={objective}>
                  <SelectTrigger className="bg-white border-gray-300 text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200">
                    <SelectValue placeholder="Selecciona un objetivo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="awareness" className="text-slate-700">Reconocimiento</SelectItem>
                    <SelectItem value="traffic" className="text-slate-700">Tráfico</SelectItem>
                    <SelectItem value="engagement" className="text-slate-700">Interacción</SelectItem>
                    <SelectItem value="lead_generation" className="text-slate-700">Generación de leads</SelectItem>
                    <SelectItem value="app_installs" className="text-slate-700">Instalaciones de la app</SelectItem>
                    <SelectItem value="conversion" className="text-slate-700">Conversiones</SelectItem>
                  </SelectContent>
                </Select>
                {errors.objective && (
                  <p className="text-sm font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    {errors.objective}
                  </p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="pt-6">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
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
        <div className="h-fit">
          {isLoading ? (
            <Card className="border border-blue-200 bg-white h-full shadow-lg">
              <div className="p-6">
                <AnalysisSkeleton />
              </div>
            </Card>
          ) : result ? (
            <Card className="border border-blue-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <AnalysisResults result={result} image={uploadedImage} />
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