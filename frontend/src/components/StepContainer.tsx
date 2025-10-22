import { ReactNode } from "react";

interface StepContainerProps {
  children: ReactNode;
}

const StepContainer = ({ children }: StepContainerProps) => {
  return (
    <div className="bg-card rounded-lg shadow-md p-8 mb-6 animate-fade-in">
      {children}
    </div>
  );
};

export default StepContainer;
