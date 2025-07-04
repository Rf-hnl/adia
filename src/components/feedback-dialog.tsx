"use client";

import { useState } from "react";
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { firebaseAnalytics } from "@/lib/firebase-analytics";
import type { UserFeedback } from "@/lib/firebase-analytics";

interface FeedbackDialogProps {
  analysisSessionId: string;
  onFeedbackSubmitted?: () => void;
}

interface RatingSection {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const StarRating = ({ label, value, onChange }: RatingSection) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-900">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors hover:scale-110 transform duration-150"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-300 hover:text-yellow-400'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export function FeedbackDialog({ analysisSessionId, onFeedbackSubmitted }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Quick rating, 2: Detailed feedback
  
  // Rating states
  const [overallRating, setOverallRating] = useState(0);
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [usefulnessRating, setUsefulnessRating] = useState(0);
  const [performanceScoreAccuracy, setPerformanceScoreAccuracy] = useState(0);
  const [recommendationsQuality, setRecommendationsQuality] = useState(0);
  
  // Feedback states
  const [feedback, setFeedback] = useState("");
  const [improvementSuggestions, setImprovementSuggestions] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [willUseAgain, setWillUseAgain] = useState<boolean | null>(null);

  const { toast } = useToast();

  const handleQuickRating = async (rating: number) => {
    setOverallRating(rating);
    
    if (rating >= 4) {
      // Good rating - submit quick feedback
      await submitFeedback({
        overallRating: rating,
        accuracyRating: rating,
        usefulnessRating: rating,
        feedback: "Calificación rápida positiva",
        wouldRecommend: true,
        willUseAgain: true
      });
    } else {
      // Lower rating - ask for detailed feedback
      setStep(2);
    }
  };

  const submitFeedback = async (feedbackData: Omit<UserFeedback, 'id' | 'anonymousUserId' | 'analysisSessionId' | 'createdAt'>) => {
    setIsSubmitting(true);
    
    try {
      await firebaseAnalytics.submitFeedback(analysisSessionId, feedbackData);
      
      toast({
        title: "¡Gracias por tu feedback!",
        description: "Tu opinión nos ayuda a mejorar el análisis con IA.",
      });
      
      setOpen(false);
      onFeedbackSubmitted?.();
      resetForm();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        variant: "destructive",
        title: "Error al enviar feedback",
        description: "Hubo un problema al enviar tu opinión. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailedSubmit = async () => {
    const feedbackData: Omit<UserFeedback, 'id' | 'anonymousUserId' | 'analysisSessionId' | 'createdAt'> = {
      overallRating,
      accuracyRating: accuracyRating || overallRating,
      usefulnessRating: usefulnessRating || overallRating,
      feedback,
      improvementSuggestions: improvementSuggestions || undefined,
      performanceScoreAccuracy: performanceScoreAccuracy || undefined,
      recommendationsQuality: recommendationsQuality || undefined,
      wouldRecommend: wouldRecommend ?? (overallRating >= 4),
      willUseAgain: willUseAgain ?? (overallRating >= 3)
    };

    await submitFeedback(feedbackData);
  };

  const resetForm = () => {
    setStep(1);
    setOverallRating(0);
    setAccuracyRating(0);
    setUsefulnessRating(0);
    setPerformanceScoreAccuracy(0);
    setRecommendationsQuality(0);
    setFeedback("");
    setImprovementSuggestions("");
    setWouldRecommend(null);
    setWillUseAgain(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 bg-white">
          <MessageSquare className="w-4 h-4 mr-2" />
          Dar Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            {step === 1 ? "¿Cómo fue tu experiencia?" : "Cuéntanos más"}
          </DialogTitle>
          <DialogDescription className="text-slate-700">
            {step === 1 
              ? "Tu feedback nos ayuda a mejorar el análisis con IA" 
              : "Ayúdanos a entender cómo podemos mejorar"
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-4">
                ¿Qué tan útil fue este análisis?
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleQuickRating(rating)}
                    disabled={isSubmitting}
                    className="transition-all hover:scale-110 transform duration-150 disabled:opacity-50"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        rating <= overallRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-4 text-xs text-slate-500">
                <span>Muy malo</span>
                <span>Excelente</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Ratings */}
            <div className="grid grid-cols-1 gap-4">
              <StarRating
                label="Precisión del análisis"
                value={accuracyRating}
                onChange={setAccuracyRating}
              />
              <StarRating
                label="Utilidad de las recomendaciones"
                value={recommendationsQuality}
                onChange={setRecommendationsQuality}
              />
            </div>

            {/* Text feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-sm font-medium text-slate-900">
                ¿Qué te gustó o no te gustó?
              </Label>
              <Textarea
                id="feedback"
                placeholder="Comparte tus comentarios..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Improvement suggestions */}
            <div className="space-y-2">
              <Label htmlFor="improvements" className="text-sm font-medium text-slate-900">
                ¿Cómo podríamos mejorar? (opcional)
              </Label>
              <Textarea
                id="improvements"
                placeholder="Sugerencias de mejora..."
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Recommendation questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  ¿Recomendarías esta herramienta?
                </span>
                <div className="flex gap-2">
                  <Button
                    variant={wouldRecommend === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWouldRecommend(true)}
                    className="px-3"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={wouldRecommend === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWouldRecommend(false)}
                    className="px-3"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  ¿Volverías a usarla?
                </span>
                <div className="flex gap-2">
                  <Button
                    variant={willUseAgain === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWillUseAgain(true)}
                    className="px-3"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={willUseAgain === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWillUseAgain(false)}
                    className="px-3"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="w-full sm:flex-1"
              >
                Atrás
              </Button>
              <Button
                onClick={handleDetailedSubmit}
                disabled={isSubmitting || overallRating === 0}
                className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Enviando..." : "Enviar Feedback"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}