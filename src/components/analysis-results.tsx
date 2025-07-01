"use client";

import Image from "next/image";
import {
  Lightbulb,
  Target,
  PenTool,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult } from "@/lib/types";
import { ChartContainer } from "@/components/ui/chart";

export const AnalysisResults = ({ result, image }: { result: AnalysisResult; image: string | null; }) => {
  const { toast } = useToast();
  const chartData = [
    { name: "score", value: result.performanceScore, fill: "hsl(var(--primary))" },
  ];
  
  const scoreColor = `hsl(var(--primary))`;

  const handleCopyAll = () => {
    if (!result.recommendations || result.recommendations.length === 0) return;
    const allRecs = result.recommendations.join("\n\n");
    navigator.clipboard.writeText(allRecs).then(() => {
      toast({
        title: "Copiado",
        description: "Todas las recomendaciones han sido copiadas.",
      });
    }).catch(err => {
      console.error("Failed to copy: ", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar el texto.",
      });
    });
  };

  const handleCopySingle = (rec: string) => {
    navigator.clipboard.writeText(rec).then(() => {
      toast({
        title: "Copiado",
        description: "Recomendación copiada.",
      });
    }).catch(err => {
      console.error("Failed to copy: ", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar el texto.",
      });
    });
  };


  return (
    <div className="space-y-4 lg:space-y-6 bg-white">
      <Card className="overflow-hidden bg-white border-blue-200">
        <CardHeader className="bg-blue-50 p-6">
          <CardTitle className="text-xl font-semibold text-blue-600">Puntuación de rendimiento general</CardTitle>
          <CardDescription className="text-slate-600">
            Una puntuación predictiva basada en nuestro análisis de IA.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center">
            {image && (
              <div className="relative w-full max-w-xs mx-auto aspect-square rounded-lg overflow-hidden border border-blue-200 order-2 lg:order-1">
                <Image
                  src={image}
                  alt="Creatividad analizada"
                  fill
                  className="object-contain"
                />
                <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-xs font-medium text-blue-600 shadow-sm">
                  Creatividad analizada
                </div>
              </div>
            )}
            <div className={`flex justify-center items-center order-1 lg:order-2 ${!image ? 'lg:col-span-2' : ''}`}>
               <ChartContainer
                  config={{
                    score: {
                      label: "Puntuación",
                      color: "#3b82f6"
                    },
                  }}
                  className="mx-auto aspect-square w-full max-w-[180px] lg:max-w-[200px] max-h-[180px] lg:max-h-[200px]"
                >
                  <RadialBarChart
                    data={[{ name: "score", value: result.performanceScore, fill: "#3b82f6" }]}
                    startAngle={90}
                    endAngle={-270}
                    innerRadius="70%"
                    outerRadius="100%"
                    barSize={20}
                    domain={[0, 100]}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                      dataKey="value"
                      background={{ fill: '#e2e8f0' }}
                      cornerRadius={10}
                    />
                    <g>
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-blue-600 text-3xl lg:text-4xl font-bold">
                        {result.performanceScore.toFixed(0)}
                      </text>
                       <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-sm lg:text-base">
                        de 100
                      </text>
                    </g>
                  </RadialBarChart>
                </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white border-blue-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600">Desglose del rendimiento</CardTitle>
          <CardDescription className="text-slate-600">
            Puntuaciones para indicadores clave de rendimiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 lg:space-y-6 p-4 lg:p-6 bg-white">
          <div className="space-y-2 lg:space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 lg:h-5 lg:w-5 text-blue-500" />
                <span className="font-medium text-sm lg:text-base text-slate-700">Puntuación de claridad</span>
              </div>
              <span className="font-bold text-lg lg:text-xl text-blue-600">{result.clarityScore.toFixed(0)}</span>
            </div>
            <Progress value={result.clarityScore} className="h-2 lg:h-3 bg-slate-200 [&>div]:bg-blue-500"/>
          </div>
          <div className="space-y-2 lg:space-y-3">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-2">
                <PenTool className="h-4 w-4 lg:h-5 lg:w-5 text-blue-500" />
                <span className="font-medium text-sm lg:text-base text-slate-700">Puntuación de diseño</span>
              </div>
              <span className="font-bold text-lg lg:text-xl text-blue-600">{result.designScore.toFixed(0)}</span>
            </div>
            <Progress value={result.designScore} className="h-2 lg:h-3 bg-slate-200 [&>div]:bg-blue-500"/>
          </div>
          <div className="space-y-2 lg:space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 lg:h-5 lg:w-5 text-blue-500" />
                <span className="font-medium text-sm lg:text-base text-slate-700">Afinidad con la audiencia</span>
              </div>
              <span className="font-bold text-lg lg:text-xl text-blue-600">{result.audienceAffinityScore.toFixed(0)}</span>
            </div>
            <Progress value={result.audienceAffinityScore} className="h-2 lg:h-3 bg-slate-200 [&>div]:bg-blue-500"/>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-blue-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold text-blue-600">Recomendaciones de IA</CardTitle>
              <CardDescription className="text-slate-600">
                Sugerencias priorizadas para mejorar la efectividad de tu anuncio.
              </CardDescription>
            </div>
            {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
               <Button variant="ghost" size="sm" onClick={handleCopyAll} className="text-blue-600 hover:text-blue-700 hover:bg-transparent">
                <Copy className="h-4 w-4" />
                <span>Copiar todo</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
            <ul className="space-y-4">
              {Array.isArray(result.recommendations) && result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start justify-between gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-4 flex-1">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{rec}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 text-blue-500 hover:bg-blue-100" onClick={() => handleCopySingle(rec)}>
                     <span className="sr-only">Copiar recomendación</span>
                     <Copy className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
        </CardContent>
      </Card>
    </div>
  );
};
