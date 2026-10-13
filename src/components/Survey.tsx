import { useState } from 'react';
import { questions } from '../data/questions';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface SurveyProps {
  onComplete: (answers: Record<number, number>) => void;
}

export default function Survey({ onComplete }: SurveyProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [direction, setDirection] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  
  // Safety check: If index is out of bounds (e.g., due to question reduction), reset or show nothing
  if (!currentQuestion) {
    if (currentQuestionIndex >= questions.length && questions.length > 0) {
        // If we are out of bounds, it might mean we finished or the list shrank.
        // Since onComplete is usually called when finishing, this is likely a shrink issue.
        // We can try to reset to 0 or just return null to avoid crash.
        // Better yet, let's reset to 0 if it's invalid.
        // However, we can't easily call set state in render.
        // So we render a fallback and use an effect to reset if needed, 
        // or just let the user restart.
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <p className="text-gray-500 mb-4">문항 데이터가 변경되었습니다.</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                    처음으로 돌아가기
                </button>
            </div>
        );
    }
    return null; 
  }

  const progress = ((currentQuestionIndex) / questions.length) * 100;

  const handleAnswer = (score: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: score }));
    
    // Auto advance after a short delay for better UX
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setDirection(1);
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        onComplete({ ...answers, [currentQuestion.id]: score });
      }
    }, 250);
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setDirection(-1);
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col min-h-[80vh] justify-center">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2 font-mono">
          <span>Question {currentQuestionIndex + 1} / {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="relative overflow-hidden min-h-[400px] bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col justify-between">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestionIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col h-full"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-medium text-gray-900 leading-relaxed">
                {currentQuestion.text}
              </h2>
            </div>

            <div className="mt-auto space-y-3">
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleAnswer(score)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border-2",
                      answers[currentQuestion.id] === score
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 scale-105 shadow-md"
                        : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50 text-gray-600"
                    )}
                  >
                    <span className="text-xl font-bold mb-1">{score}</span>
                    <span className="text-[10px] sm:text-xs text-center leading-tight hidden sm:block">
                      {score === 1 && "전혀 아니다"}
                      {score === 2 && "아니다"}
                      {score === 3 && "보통이다"}
                      {score === 4 && "그렇다"}
                      {score === 5 && "매우 그렇다"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 px-2 sm:hidden">
                <span>전혀 아니다</span>
                <span>매우 그렇다</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
          className="flex items-center px-4 py-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          이전
        </button>
        
        {/* Skip button or similar could go here, but usually forced choice is better for personality tests */}
      </div>
    </div>
  );
}
