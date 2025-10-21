import { useState } from "react";
import Stepper from "@/components/Stepper";
import StepContainer from "@/components/StepContainer";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import ChatTranscript, { Message } from "@/components/ChatTranscript";
import HumanAssistanceCTA from "@/components/HumanAssistanceCTA";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check } from "lucide-react";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [visualizerState, setVisualizerState] = useState<VisualizerState>("idle");
  const [showEMIModal, setShowEMIModal] = useState(false);
  
  const [steps, setSteps] = useState([
    { id: 1, title: "Greeting", completed: false },
    { id: 2, title: "Payment", completed: false },
    { id: 3, title: "EMI Options", completed: false },
    { id: 4, title: "Documents", completed: false },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "agent",
      content: "Hello! Welcome to our onboarding process. I'm here to help you get started.",
      timestamp: new Date(),
    },
  ]);

  const documents = [
    "Valid Government ID (Aadhaar/PAN)",
    "Recent Passport Size Photo",
    "Address Proof",
    "Income Proof (Salary Slip/Bank Statement)",
  ];

  const completeStep = (stepId: number) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
  };

  const handleStepClick = (stepId: number) => {
    if (steps.find(s => s.id === stepId)?.completed) {
      setCurrentStep(stepId);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      completeStep(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePaymentOption = (option: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `I'd like to proceed with ${option}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);

    if (option === "Credit Card" || option === "Full Payment") {
      navigate("/contact-agent");
    } else if (option === "0% Loan EMI") {
      completeStep(2);
      setCurrentStep(3);
      setShowEMIModal(true);
    }
  };

  const closeEMIModal = () => {
    setShowEMIModal(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Voice Agent Onboarding</h1>
          <p className="text-muted-foreground mt-2">Complete the steps below to get started</p>
        </header>

        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StepContainer>
              {/* Step 1: Greeting */}
              {currentStep === 1 && (
                <div className="text-center">
                  <VoiceVisualizer 
                    state={visualizerState}
                    onSessionStart={() => {
                      console.log("Voice session started");
                      // Simulate state changes for demo
                      setTimeout(() => setVisualizerState("listening"), 1000);
                    }}
                    onSessionEnd={() => {
                      console.log("Voice session ended");
                      setVisualizerState("idle");
                    }}
                    onMuteToggle={(muted) => {
                      console.log("Mute toggled:", muted);
                    }}
                  />
                  <h2 className="text-2xl font-semibold text-foreground mb-4 mt-4">
                    Welcome to Your Onboarding Journey
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Our voice agent will guide you through a simple process to get you started.
                    Start the voice session to interact with the agent.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={() => setVisualizerState("listening")} 
                      variant="outline"
                      size="sm"
                    >
                      Demo Listening
                    </Button>
                    <Button 
                      onClick={() => setVisualizerState("processing")} 
                      variant="outline"
                      size="sm"
                    >
                      Demo Thinking
                    </Button>
                    <Button 
                      onClick={() => setVisualizerState("speaking")} 
                      variant="outline"
                      size="sm"
                    >
                      Demo Speaking
                    </Button>
                  </div>
                  <Button onClick={handleNext} size="lg" className="mt-6">
                    Next
                  </Button>
                </div>
              )}

              {/* Step 2: Payment Options */}
              {currentStep === 2 && (
                <div className="text-center">
                  <VoiceVisualizer state={visualizerState} />
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    Choose Your Payment Method
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Select the payment option that works best for you
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    <Button
                      onClick={() => handlePaymentOption("Credit Card")}
                      variant="outline"
                      size="lg"
                      className="h-auto py-6 flex flex-col gap-2"
                    >
                      <span className="text-lg font-semibold">Credit Card</span>
                      <span className="text-sm text-muted-foreground">Pay securely</span>
                    </Button>
                    <Button
                      onClick={() => handlePaymentOption("Full Payment")}
                      variant="outline"
                      size="lg"
                      className="h-auto py-6 flex flex-col gap-2"
                    >
                      <span className="text-lg font-semibold">Full Payment</span>
                      <span className="text-sm text-muted-foreground">Pay in full</span>
                    </Button>
                    <Button
                      onClick={() => handlePaymentOption("0% Loan EMI")}
                      size="lg"
                      className="h-auto py-6 flex flex-col gap-2 bg-primary hover:bg-primary/90"
                    >
                      <span className="text-lg font-semibold">0% Loan EMI</span>
                      <span className="text-sm">No interest</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: EMI Options */}
              {currentStep === 3 && (
                <div className="text-center">
                  <VoiceVisualizer state={visualizerState} />
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    0% EMI Loan Selected
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Great choice! You've selected our 0% interest EMI option.
                    Let's proceed to the next step.
                  </p>
                  <Button onClick={handleNext} size="lg">
                    Continue
                  </Button>
                </div>
              )}

              {/* Step 4: Documents */}
              {currentStep === 4 && (
                <div className="text-center">
                  <VoiceVisualizer state={visualizerState} />
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    Required Documents
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Please ensure you have the following documents ready
                  </p>
                  <div className="max-w-md mx-auto">
                    <ul className="space-y-3 text-left">
                      {documents.map((doc, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success text-success-foreground flex-shrink-0 mt-0.5">
                            <Check className="w-4 h-4" />
                          </div>
                          <span className="text-foreground">{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    onClick={() => navigate("/contact-agent")}
                    size="lg"
                    className="mt-8"
                  >
                    Submit & Continue
                  </Button>
                </div>
              )}
            </StepContainer>
          </div>

          <div className="lg:col-span-1">
            <ChatTranscript messages={messages} />
          </div>
        </div>

        <HumanAssistanceCTA />

        {/* EMI Modal */}
        <Dialog open={showEMIModal} onOpenChange={setShowEMIModal}>
          <DialogContent className="max-w-md">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Exclusive 0% EMI Offer!
              </h3>
              <p className="text-muted-foreground mb-6">
                Congratulations! You qualify for our special 0% interest EMI plan.
                No hidden charges, no processing fees.
              </p>
              <Button onClick={closeEMIModal} size="lg" className="w-full">
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;
