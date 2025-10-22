import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Headphones } from "lucide-react";

const HumanAssistanceCTA = () => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate("/contact-agent")}
      size="lg"
      className="fixed bottom-8 right-8 rounded-full shadow-lg hover:shadow-xl transition-all h-14 w-14 p-0 animate-pulse-glow"
      aria-label="Contact human agent"
    >
      <Headphones className="w-6 h-6" />
    </Button>
  );
};

export default HumanAssistanceCTA;
