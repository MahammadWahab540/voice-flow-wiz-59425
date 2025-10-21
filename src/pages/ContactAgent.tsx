import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";

const ContactAgent = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent mb-6">
            <Clock className="w-8 h-8 text-accent-foreground" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Thank you for your interest
          </h1>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Our VRE team will contact you within 4-5 hours to assist you further.
          </p>

          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
            size="lg"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactAgent;
