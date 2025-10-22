import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  DataPacket_Kind,
  RemoteParticipant,
  Participant,
  ConnectionState
} from 'livekit-client';

// Types for the voice session state
export type VisualizerState = "idle" | "listening" | "processing" | "speaking";
export type SessionState = "disconnected" | "connecting" | "connected" | "error";

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export interface VoiceSessionState {
  // Connection state
  isConnected: boolean;
  connectionState: SessionState;
  error: string | null;

  // Session data
  sessionId: string | null;
  roomName: string | null;
  livekitUrl: string | null;

  // UI state
  currentStep: number;
  visualizerState: VisualizerState;
  messages: Message[];

  // Actions
  startSession: () => Promise<void>;
  endSession: () => void;
  sendData: (payload: any) => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const useVoiceSession = (): VoiceSessionState => {
  // Core state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<SessionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [visualizerState, setVisualizerState] = useState<VisualizerState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);

  // Refs for managing connections
  const roomRef = useRef<Room | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Initialize a new message
  const addMessage = useCallback((role: 'user' | 'agent', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Handle incoming data from the backend
  const handleDataReceived = useCallback((data: any) => {
    try {
      const payload = JSON.parse(data);

      switch (payload.action) {
        case 'set_stage':
          setCurrentStep(payload.stage || 1);
          break;

        case 'set_visualizer_state':
          setVisualizerState(payload.state || 'idle');
          break;

        case 'new_message':
          addMessage(payload.role || 'agent', payload.content || '');
          break;

        case 'session_started':
          setSessionId(payload.session_id);
          setRoomName(payload.room_name);
          setLivekitUrl(payload.livekit_url);
          break;

        case 'error':
          setError(payload.message || 'An error occurred');
          setConnectionState('error');
          break;

        default:
          console.log('Unknown action received:', payload.action);
      }
    } catch (error) {
      console.error('Error parsing data channel message:', error);
    }
  }, [addMessage]);

  // Send data to the backend via data channel
  const sendData = useCallback((payload: any) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        const message = JSON.stringify(payload);
        dataChannelRef.current.send(message);

        // Also add user messages to local state for immediate feedback
        if (payload.action === 'advance_stage') {
          setCurrentStep(prev => prev + 1);
        } else if (payload.action === 'payment_selected') {
          addMessage('user', `Selected: ${payload.choice}`);
        }
      } catch (error) {
        console.error('Error sending data:', error);
        setError('Failed to send message to agent');
      }
    } else {
      console.warn('Data channel not ready, cannot send:', payload);
    }
  }, [addMessage]);

  // Start a new voice session
  const startSession = useCallback(async () => {
    try {
      setConnectionState('connecting');
      setError(null);

      // Request session from backend
      const response = await fetch(`${BACKEND_URL}/api/voice-session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const sessionData = await response.json();

      // Handle the response format from the backend
      // Backend returns: { token, livekitUrl, room }
      if (!sessionData.token) {
        throw new Error('No token received from backend');
      }

      // Store session info
      setSessionId(`session-${Date.now()}`); // Generate a simple session ID
      setRoomName(sessionData.room);
      setLivekitUrl(sessionData.livekitUrl);

      // Connect to LiveKit room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = room;

      // Set up event listeners
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        console.log('Connection state changed:', state);
        setConnectionState(state);

        if (state === ConnectionState.Connected) {
          setIsConnected(true);
          setVisualizerState('idle');
        } else if (state === ConnectionState.Disconnected) {
          setIsConnected(false);
          setConnectionState('disconnected');
        }
      });

      room.on(RoomEvent.DataReceived, (payload, participant) => {
        // Only process data from the agent participant
        if (participant?.identity?.startsWith('agent-')) {
          handleDataReceived(payload);
        }
      });

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('Participant connected:', participant.identity);

        // Set up data channel when agent connects
        if (participant.identity?.startsWith('agent-')) {
          const dataChannel = participant.createDataChannel('agent-control');
          dataChannelRef.current = dataChannel;

          dataChannel.onopen = () => {
            console.log('Data channel opened');
          };

          dataChannel.onmessage = (event) => {
            handleDataReceived(event.data);
          };

          dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
            setError('Data channel error occurred');
          };
        }
      });

      // Connect to the room
      await room.connect(sessionData.livekit_url, sessionData.token);

      console.log('Successfully connected to LiveKit room');

    } catch (error) {
      console.error('Error starting session:', error);
      setError(error instanceof Error ? error.message : 'Failed to start session');
      setConnectionState('error');
    }
  }, [handleDataReceived]);

  // End the current session
  const endSession = useCallback(async () => {
    try {
      if (roomRef.current) {
        await roomRef.current.disconnect();
        roomRef.current = null;
      }

      if (sessionId) {
        // Notify backend to clean up
        await fetch(`${BACKEND_URL}/sessions/${sessionId}/end`, {
          method: 'POST',
        });
      }

      // Reset all state
      setIsConnected(false);
      setConnectionState('disconnected');
      setSessionId(null);
      setRoomName(null);
      setLivekitUrl(null);
      setCurrentStep(1);
      setVisualizerState('idle');
      setError(null);

      dataChannelRef.current = null;

    } catch (error) {
      console.error('Error ending session:', error);
      setError('Failed to end session properly');
    }
  }, [sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  return {
    // Connection state
    isConnected,
    connectionState,
    error,

    // Session data
    sessionId,
    roomName,
    livekitUrl,

    // UI state
    currentStep,
    visualizerState,
    messages,

    // Actions
    startSession,
    endSession,
    sendData,
  };
};
