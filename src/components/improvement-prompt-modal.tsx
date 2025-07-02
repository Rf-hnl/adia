'use client';

import { useState } from 'react';
import { Copy, CheckCircle2, Wand2, ExternalLink, Download, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ImprovementPromptModalProps {
  recommendations: string[];
  currentImage?: string | null;
}

export const ImprovementPromptModal = ({ recommendations, currentImage }: ImprovementPromptModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const generateImprovementPrompt = () => {
    const prompt = `# 🎨 MEJORAR CREATIVIDAD PUBLICITARIA CON IA

Soy un experto diseñador gráfico con 15+ años de experiencia en marketing visual y publicidad digital. Mi tarea es mejorar esta creatividad publicitaria basándome en recomendaciones específicas generadas por análisis con IA.

## 🎯 RECOMENDACIONES PRIORITARIAS A IMPLEMENTAR:

${recommendations.map((rec, index) => `✅ **${index + 1}.** ${rec}`).join('\n\n')}

---

## 📋 PROCESO DE MEJORA PASO A PASO:

### 🔍 **PASO 1: ANÁLISIS INICIAL**
- Analiza la imagen que subiré a continuación
- Identifica elementos que corresponden a cada recomendación listada arriba
- Evalúa la jerarquía visual actual y oportunidades de mejora

### 🎨 **PASO 2: APLICACIÓN DE MEJORAS**
Implementa cada recomendación de manera específica y visible:

**Prioridades de mejora:**
1. **Claridad del mensaje** - El texto debe ser legible y comprensible al instante
2. **Impacto visual** - Los elementos deben captar atención sin ser abrumadores  
3. **Llamada a la acción** - Debe ser prominente y clara
4. **Coherencia de marca** - Mantener identidad pero optimizar rendimiento

### 📐 **ESPECIFICACIONES TÉCNICAS REQUERIDAS:**
- **Resolución**: Mínimo 1080px en el lado más largo
- **Formato**: PNG para máxima calidad o JPG optimizado
- **Dimensiones**: Mantener proporción original o adaptar a formatos estándar (1:1, 16:9, 9:16)
- **Legibilidad móvil**: Todos los textos deben ser legibles en pantallas pequeñas
- **Velocidad de comprensión**: El mensaje principal debe entenderse en menos de 3 segundos

### 🚀 **OPTIMIZACIONES ADICIONALES:**
- Mejorar contraste para elementos de texto
- Optimizar espaciado y jerarquía visual
- Asegurar que la CTA destaque del resto del contenido
- Usar colores que mejoren el engagement sin perder coherencia de marca
- Aplicar principios de neurociencia visual para maximizar impacto

## ✨ **ENTREGABLE ESPERADO:**

**Proporciona:**
1. **La creatividad mejorada** aplicando todas las recomendaciones
2. **Breve explicación** (2-3 líneas) de los cambios principales realizados
3. **Justificación** de por qué estas mejoras aumentarán el rendimiento publicitario

**El resultado debe ser:**
- ✅ Visualmente más atractivo y profesional
- ✅ Más claro en su mensaje y propósito
- ✅ Optimizado para mejor rendimiento en campañas digitales
- ✅ Manteniendo la esencia de marca original

---

**🎬 ¡ACCIÓN REQUERIDA!**
Sube la imagen actual y procederé a crear la versión mejorada siguiendo todas las recomendaciones específicas listadas arriba.`;

    return prompt;
  };

  const handleCopyPrompt = async () => {
    const prompt = generateImprovementPrompt();
    
    try {
      await navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      
      toast({
        title: "¡Prompt copiado!",
        description: "El prompt de mejora ha sido copiado al portapapeles.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al copiar",
        description: "No se pudo copiar el prompt. Inténtalo de nuevo.",
      });
    }
  };

  const llmPlatforms = [
    {
      name: "ChatGPT (GPT-4V)",
      url: "https://chat.openai.com",
      description: "Excelente para análisis visual y mejoras de diseño",
      color: "bg-green-500"
    },
    {
      name: "Claude (Anthropic)",
      url: "https://claude.ai",
      description: "Muy bueno para creatividades publicitarias",
      color: "bg-orange-500"
    },
    {
      name: "Gemini (Google)",
      url: "https://gemini.google.com",
      description: "Buena comprensión visual y sugerencias creativas",
      color: "bg-blue-500"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 bg-white"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Crear prompt de mejora
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-black">
            <Wand2 className="h-6 w-6 text-blue-600" />
            Mejorar creatividad con IA
          </DialogTitle>
          <DialogDescription className="text-base text-black">
            Genera un prompt optimizado para mejorar tu creatividad usando las recomendaciones de análisis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recomendaciones incluidas */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-black">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Recomendaciones incluidas en el prompt
              </CardTitle>
              <CardDescription className="text-black">
                Estas mejoras serán incorporadas automáticamente en el prompt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Badge variant="secondary" className="mt-0.5 flex-shrink-0">
                      {index + 1}
                    </Badge>
                    <span className="text-sm text-green-800">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Botón de copiar prompt */}
          <Card className="border-blue-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-blue-800">
                    Paso 1: Copiar prompt de mejora
                  </h3>
                  <p className="text-blue-700">
                    Este prompt incluye todas las recomendaciones y instrucciones detalladas para el LLM
                  </p>
                </div>
                <Button 
                  onClick={handleCopyPrompt}
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5 mr-2" />
                      Copiar prompt
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Instrucciones paso a paso */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Paso 2: Usar el prompt en tu LLM favorito</CardTitle>
              <CardDescription>
                Sigue estos pasos para obtener tu creatividad mejorada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plataformas LLM */}
              <div>
                <h4 className="font-semibold mb-3 text-slate-800">Plataformas recomendadas:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {llmPlatforms.map((platform, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer bg-white border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${platform.color}`}></div>
                          <h5 className="font-semibold text-sm">{platform.name}</h5>
                          <ExternalLink className="h-4 w-4 text-slate-400 ml-auto" />
                        </div>
                        <p className="text-xs text-slate-600">{platform.description}</p>
                        <Button
                          variant="ghost" 
                          size="sm" 
                          className="w-full mt-2 text-xs"
                          onClick={() => window.open(platform.url, '_blank')}
                        >
                          Abrir {platform.name}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Pasos detallados */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                  <Badge className="bg-blue-500 flex-shrink-0">1</Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-800">Pegar el prompt</h4>
                      <Button 
                        onClick={handleCopyPrompt}
                        size="sm"
                        variant="outline"
                        className="bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200 hover:border-blue-400"
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Ve a tu LLM favorito y pega el prompt que acabas de copiar
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                  <Badge className="bg-green-500 flex-shrink-0">2</Badge>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-800 flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Subir tu imagen actual
                    </h4>
                    <p className="text-green-700 text-sm">
                      Sube la creatividad que analizaste aquí para que el LLM la pueda mejorar
                    </p>
                    {currentImage && (
                      <div className="mt-2">
                        <p className="text-xs text-green-600 mb-2">Vista previa de tu imagen actual:</p>
                        <img 
                          src={currentImage} 
                          alt="Creatividad actual" 
                          className="max-w-32 max-h-32 object-contain border rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
                  <Badge className="bg-indigo-500 flex-shrink-0">3</Badge>
                  <div>
                    <h4 className="font-semibold text-indigo-800 flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Obtener mejoras
                    </h4>
                    <p className="text-indigo-700 text-sm">
                      El LLM analizará tu imagen y creará una versión mejorada basada en las recomendaciones
                    </p>
                  </div>
                </div>
              </div>

              {/* Tip adicional */}
              <div className="p-4 bg-white rounded-lg border border-yellow-200 shadow-sm">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  💡 Tip profesional
                </h4>
                <p className="text-yellow-700 text-sm">
                  Si no quedas satisfecho con el primer resultado, puedes pedirle al LLM que haga ajustes específicos 
                  o que pruebe diferentes variaciones de las mejoras.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};