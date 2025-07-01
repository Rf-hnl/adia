import { BarChart } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export const AnalysisPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white">
      <div className="p-4 rounded-full bg-blue-50 mb-4">
        <BarChart className="h-10 w-10 text-blue-500" />
      </div>
      <CardTitle className="text-xl font-semibold text-blue-600">Análisis de rendimiento de anuncios</CardTitle>
      <CardDescription className="mt-2 max-w-md text-slate-600">
        El análisis de tu anuncio aparecerá aquí. Configura tu campaña a la izquierda
        y sube una creatividad para empezar.
      </CardDescription>
    </div>
  );
};
