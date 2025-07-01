import { BarChart, TrendingUp, Target, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const AnalysisPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white space-y-8">
      {/* Hero Icon */}
      <div className="relative">
        <div className="p-6 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 mb-6">
          <BarChart className="h-12 w-12 text-blue-600" />
        </div>
        <div className="absolute -top-2 -right-2 p-2 rounded-full bg-green-100">
          <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 max-w-md">
        <h3 className="text-xl font-bold text-slate-900">
          Análisis de rendimiento con IA
        </h3>
        <p className="text-slate-600 leading-relaxed">
          Sube tu creatividad publicitaria y obtén insights detallados sobre su rendimiento potencial
        </p>
      </div>

      {/* Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-2xl">
        <Card className="border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <CardContent className="p-4 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 mx-auto flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="font-semibold text-sm text-slate-800">Puntuación Global</h4>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-blue-600 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <CardContent className="p-4 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-green-100 mx-auto flex items-center justify-center">
              <Eye className="w-4 h-4 text-green-600" />
            </div>
            <h4 className="font-semibold text-sm text-slate-800">Análisis Visual</h4>
            <div className="space-y-1">
              <div className="w-full h-1 bg-green-200 rounded"></div>
              <div className="w-2/3 h-1 bg-green-200 rounded"></div>
              <div className="w-4/5 h-1 bg-green-200 rounded"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-gradient-to-br from-slate-50 to-white sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 mx-auto flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="font-semibold text-sm text-slate-800">Recomendaciones IA</h4>
            <div className="space-y-1">
              <div className="w-full h-1 bg-purple-200 rounded"></div>
              <div className="w-3/4 h-1 bg-purple-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <p className="text-sm text-slate-500 max-w-sm">
        ← Completa el formulario de la izquierda para comenzar tu análisis
      </p>
    </div>
  );
};
