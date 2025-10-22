import { useEffect, useState } from "react";
import { Loader2, Mic, MicOff, Square } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";
type SessionState = "idle" | "active" | "muted" | "denied" | "ended";

interface VoiceVisualizerProps {
  state: VisualizerState;
  isConnected?: boolean;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  onMuteToggle?: (muted: boolean) => void;
}

const VoiceVisualizer = ({ state, isConnected = false, onSessionStart, onSessionEnd, onMuteToggle }: VoiceVisualizerProps) => {
  const [waveHeights, setWaveHeights] = useState<number[]>([1, 1.2, 0.8, 1.5, 1, 1.3, 0.9]);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (state === "listening" || state === "speaking") {
      const interval = setInterval(() => {
        setWaveHeights(prev => 
          prev.map(() => 0.5 + Math.random() * 1.5)
        );
      }, 100);
      return () => clearInterval(interval);
    }
  }, [state]);

  const handleStartSession = async () => {
    if (sessionState === "denied") {
      toast({
        title: "Microphone Access Blocked",
        description: "Please allow microphone access in your browser settings.",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted:", stream);
      setSessionState("active");
      
      toast({
        title: "Voice Agent Active",
        description: "Listening to your voice...",
      });

      // Stop the stream after getting permission (we'll reopen when actually needed)
      stream.getTracks().forEach(track => track.stop());
      
      // Call parent handler if provided
      if (onSessionStart) {
        onSessionStart();
      }
    } catch (error) {
      console.error("Microphone access denied:", error);
      setSessionState("denied");
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser to use voice features.",
        variant: "destructive",
      });
    }
  };

  const handleEndSession = () => {
    setSessionState("ended");
    setIsMuted(false);
    
    toast({
      title: "Session Ended",
      description: "Click Start to reconnect",
    });

    if (onSessionEnd) {
      onSessionEnd();
    }

    // Reset to idle after a brief delay
    setTimeout(() => {
      setSessionState("idle");
    }, 2000);
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (newMutedState) {
      setSessionState("muted");
      toast({
        title: "Microphone Muted",
        description: "Agent cannot hear you",
      });
    } else {
      setSessionState("active");
      toast({
        title: "Microphone Unmuted",
        description: "Agent can hear you now",
      });
    }

    if (onMuteToggle) {
      onMuteToggle(newMutedState);
    }
  };

  const getStatusText = () => {
    if (state === "listening") return "Voice Agent Active...";
    if (state === "speaking") return "Agent is speaking...";
    if (state === "processing") return "Processing your response...";
    if (sessionState === "denied") return "Mic access blocked";
    if (sessionState === "muted") return "Mic Muted";
    if (sessionState === "ended") return "Session Ended. Click Start to Reconnect.";
    if (sessionState === "active") return "Voice Agent Active...";
    return "Ready to Assist";
  };

  const isSessionActive = sessionState === "active" || sessionState === "muted";

  const getColorClass = () => {
    switch (state) {
      case "idle":
        return "bg-visualizer-idle";
      case "listening":
        return "bg-visualizer-user";
      case "processing":
        return "bg-visualizer-processing";
      case "speaking":
        return "bg-visualizer-active";
      default:
        return "bg-visualizer-idle";
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-center gap-8 p-12">
        {/* Voice Controls - Always Visible */}
        <div className="relative flex items-center justify-center gap-6">
          {/* End Session Button - Left Side */}
          {isSessionActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleEndSession}
                  aria-label="End session"
                  className="w-14 h-14 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-destructive/30 shadow-lg hover:shadow-xl hover:scale-105 animate-fade-in"
                >
                  <Square className="w-6 h-6 text-destructive-foreground" fill="currentColor" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>End Session</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Main Mic Button - Center */}
          <div className="relative group">
            <button
              onClick={handleStartSession}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              disabled={sessionState === "denied" || isSessionActive}
              aria-label={isSessionActive ? "Voice session active" : "Start voice session"}
              className={`
                relative w-28 h-28 rounded-full flex items-center justify-center
                transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30
                ${sessionState === "denied" 
                  ? "bg-muted cursor-not-allowed" 
                  : isSessionActive
                  ? "bg-gradient-to-br from-primary to-primary/80 shadow-2xl cursor-default"
                  : "bg-gradient-to-br from-primary to-primary/80 hover:shadow-2xl cursor-pointer hover:scale-105"
                }
              `}
            >
              {/* Animated rings for active session */}
              {isSessionActive && !isMuted && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-primary/50 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary-glow/60 animate-pulse-glow" />
                </>
              )}
              
              {/* Hover ring for idle state */}
              {isHovering && !isSessionActive && sessionState !== "denied" && (
                <div className="absolute inset-0 rounded-full border-4 border-primary/50 animate-ping" />
              )}
              
              {/* Mic Icon */}
              {sessionState === "denied" ? (
                <MicOff className="w-12 h-12 text-muted-foreground" />
              ) : isMuted ? (
                <MicOff className="w-12 h-12 text-white" />
              ) : (
                <Mic className="w-12 h-12 text-white" />
              )}
            </button>
            
            {/* Label below mic */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-sm font-semibold whitespace-nowrap transition-all duration-300">
              {isSessionActive ? (
                <span className="text-primary">Active</span>
              ) : sessionState === "ended" ? (
                <span className="text-muted-foreground">Reconnect</span>
              ) : sessionState === "denied" ? (
                <span className="text-destructive">Blocked</span>
              ) : (
                <span className="text-foreground">Start</span>
              )}
            </div>
          </div>

          {/* Mute/Unmute Button - Right Side */}
          {isSessionActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleMuteToggle}
                  aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center
                    transition-all duration-300 focus:outline-none focus:ring-4 
                    shadow-lg hover:shadow-xl hover:scale-105 animate-fade-in
                    ${isMuted 
                      ? "bg-muted hover:bg-muted/80 focus:ring-muted/30" 
                      : "bg-accent hover:bg-accent/80 focus:ring-accent/30"
                    }
                  `}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <Mic className="w-6 h-6 text-accent-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMuted ? "Unmute Microphone" : "Mute Microphone"}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Listening State - User Speaking */}
        {state === "listening" && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="flex items-center justify-center gap-2 h-32">
              {waveHeights.map((height, i) => (
                <div
                  key={i}
                  className="w-3 rounded-full bg-visualizer-user transition-all duration-100"
                  style={{
                    height: `${height * 70}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-visualizer-user animate-pulse" />
              <span className="text-sm font-medium text-visualizer-user">Listening to you...</span>
            </div>
          </div>
        )}

        {/* Thinking/Processing State */}
        {state === "processing" && (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <div className="relative">
              <Loader2 className="w-20 h-20 text-visualizer-processing animate-spin-slow" />
              <div className="absolute inset-0 rounded-full border-4 border-visualizer-processing/20 animate-pulse-glow" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-visualizer-processing animate-bounce"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-visualizer-processing">Thinking...</span>
            </div>
          </div>
        )}

        {/* Speaking State - Agent Speaking */}
        {state === "speaking" && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="flex items-center justify-center gap-2 h-32">
              {waveHeights.map((height, i) => (
                <div
                  key={i}
                  className="w-3 rounded-full bg-visualizer-active transition-all duration-100"
                  style={{
                    height: `${height * 70}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-visualizer-active animate-pulse" />
              <span className="text-sm font-medium text-visualizer-active">Agent is speaking...</span>
            </div>
          </div>
        )}


        {/* Status Text */}
        <div className="text-center">
          <p className={`text-base font-semibold capitalize transition-all duration-300 ${
            isSessionActive ? "text-primary" : "text-muted-foreground"
          }`}>
            {getStatusText()}
          </p>
          {state === "idle" && sessionState === "idle" && (
            <p className="text-sm text-muted-foreground/80 mt-2 animate-fade-in">
              Click the microphone to begin your voice session
            </p>
          )}
          {isSessionActive && state === "idle" && !isMuted && (
            <p className="text-sm text-primary/80 mt-2 animate-fade-in">
              Start speaking or wait for agent response
            </p>
          )}
          {isMuted && (
            <p className="text-sm text-muted-foreground mt-2 animate-fade-in">
              Click unmute to continue conversation
            </p>
          )}
          {sessionState === "ended" && (
            <p className="text-sm text-muted-foreground/80 mt-2 animate-fade-in">
              Session terminated - click Start to reconnect
            </p>
          )}
          {sessionState === "denied" && (
            <p className="text-sm text-destructive/80 mt-2 animate-fade-in">
              Enable microphone permissions in your browser settings
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default VoiceVisualizer;
