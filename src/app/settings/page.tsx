"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_AD_ANALYSIS_PROMPT } from "@/lib/prompts";

const PROMPT_STORAGE_KEY = "customAdAnalysisPrompt";

export default function SettingsPage() {
  const [prompt, setPrompt] = useState(DEFAULT_AD_ANALYSIS_PROMPT);
  const { toast } = useToast();

  useEffect(() => {
    const savedPrompt = localStorage.getItem(PROMPT_STORAGE_KEY);
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(PROMPT_STORAGE_KEY, prompt);
    toast({
      title: "Guardado",
      description: "Tu prompt personalizado ha sido guardado.",
    });
  };

  const handleReset = () => {
    localStorage.removeItem(PROMPT_STORAGE_KEY);
    setPrompt(DEFAULT_AD_ANALYSIS_PROMPT);
    toast({
      title: "Restablecido",
      description: "El prompt ha sido restablecido al valor predeterminado.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Prompt de Análisis</CardTitle>
              <CardDescription>
                Personaliza el prompt que utiliza la IA para analizar tus anuncios.
                Usa las siguientes variables para insertar los datos de tu campaña: 
                <code className="mx-1 p-1 bg-muted rounded-sm text-sm font-mono">{'{{{objective}}}'}</code>,
                <code className="mx-1 p-1 bg-muted rounded-sm text-sm font-mono">{'{{{demographics}}}'}</code>, y
                <code className="mx-1 p-1 bg-muted rounded-sm text-sm font-mono">{'{{media url=creativeDataUri}}'}</code> para la imagen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full gap-2">
                <Label htmlFor="prompt-textarea">Prompt de IA</Label>
                <Textarea
                  id="prompt-textarea"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Introduce tu prompt personalizado aquí..."
                />
              </div>
            </Content>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>Restablecer</Button>
              <Button onClick={handleSave}>Guardar Cambios</Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
