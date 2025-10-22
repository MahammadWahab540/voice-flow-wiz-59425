import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  completed: boolean;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

const Stepper = ({ steps, currentStep, onStepClick }: StepperProps) => {
  return (
    <div className="w-full bg-card rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => step.completed && onStepClick(step.id)}
              disabled={!step.completed && step.id !== currentStep}
              className={cn(
                "flex items-center gap-3 transition-all",
                step.completed || step.id === currentStep
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all",
                  step.completed
                    ? "bg-success text-success-foreground"
                    : step.id === currentStep
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.completed ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span
                className={cn(
                  "hidden sm:block font-medium transition-colors",
                  step.id === currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </button>
            
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-4 rounded-full transition-colors",
                  step.completed ? "bg-success" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;
