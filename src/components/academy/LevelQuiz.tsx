import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { QUIZ_DATA, PASSING_SCORE } from "@/data/academy/quizzes";

interface LevelQuizProps {
  level: number;
  onComplete: (passed: boolean, score: number) => void;
  onClose: () => void;
}

export function LevelQuiz({ level, onComplete, onClose }: LevelQuizProps) {
  const questions = QUIZ_DATA[level] || [];
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);
  const [answered, setAnswered] = useState(false);

  const currentQ = questions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];

  const handleSelect = (index: number) => {
    if (answered) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = index;
    setSelectedAnswers(newAnswers);
    setAnswered(true);
  };

  const handleNext = () => {
    setAnswered(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setShowResults(true);
      const correctCount = selectedAnswers.filter(
        (ans, idx) => ans === questions[idx].correctIndex
      ).length;
      const score = correctCount / questions.length;
      onComplete(score >= PASSING_SCORE, score);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(questions.length).fill(null));
    setShowResults(false);
    setAnswered(false);
  };

  if (questions.length === 0) {
    return <p className="text-muted-foreground">No quiz available for this level.</p>;
  }

  if (showResults) {
    const correctCount = selectedAnswers.filter(
      (ans, idx) => ans === questions[idx].correctIndex
    ).length;
    const score = correctCount / questions.length;
    const passed = score >= PASSING_SCORE;

    return (
      <div className="text-center space-y-6 py-8">
        <div
          className={cn(
            "w-20 h-20 rounded-full mx-auto flex items-center justify-center",
            passed ? "bg-emerald-500/20" : "bg-destructive/20"
          )}
        >
          {passed ? (
            <Trophy className="w-10 h-10 text-emerald-500" />
          ) : (
            <XCircle className="w-10 h-10 text-destructive" />
          )}
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-2">
            {passed ? "Congratulations!" : "Keep Learning!"}
          </h3>
          <p className="text-muted-foreground">
            You scored {correctCount}/{questions.length} ({Math.round(score * 100)}%)
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {passed
              ? "Level unlocked! You can now proceed to the next level."
              : "You need 75% to pass. Review the modules and try again."}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          {!passed && (
            <Button variant="outline" onClick={handleRetry} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Retry Quiz
            </Button>
          )}
          <Button onClick={onClose} className="gap-2">
            {passed ? "Continue" : "Review Modules"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Question {currentQuestion + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full",
                idx === currentQuestion
                  ? "bg-primary"
                  : selectedAnswers[idx] !== null
                  ? selectedAnswers[idx] === questions[idx].correctIndex
                    ? "bg-emerald-500"
                    : "bg-destructive"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <h4 className="text-lg font-semibold">{currentQ.question}</h4>

      {/* Options */}
      <div className="space-y-3">
        {currentQ.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrect = idx === currentQ.correctIndex;
          const showCorrectness = answered;

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all",
                !answered && "hover:border-primary/50 hover:bg-primary/5",
                isSelected && !showCorrectness && "border-primary bg-primary/10",
                showCorrectness && isCorrect && "border-emerald-500 bg-emerald-500/10",
                showCorrectness && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                !isSelected && showCorrectness && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium",
                    isSelected && !showCorrectness && "border-primary text-primary",
                    showCorrectness && isCorrect && "border-emerald-500 text-emerald-500",
                    showCorrectness && isSelected && !isCorrect && "border-destructive text-destructive"
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{option}</span>
                {showCorrectness && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
                {showCorrectness && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Next button */}
      {answered && (
        <Button onClick={handleNext} className="w-full gap-2">
          {currentQuestion < questions.length - 1 ? "Next Question" : "See Results"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
