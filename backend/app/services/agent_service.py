# --- Agent Service ---
# This service is the orchestrator. It will be called by the router.
# It uses the other services to get tokens and then launches the agent.
# It will be responsible for creating an instance of your agent class.
import asyncio
import uuid
from typing import Dict, Any
from app.agents.onboarding_agent import NxtWaveOnboardingAgent
from app.services.livekit_service import create_agent_token, cleanup_room
from app.config import settings

# In-memory storage for active sessions (in production, use Redis or database)
active_sessions: Dict[str, Dict[str, Any]] = {}

async def launch_agent_for_session(session_id: str, room_name: str) -> Dict[str, Any]:
    """
    Launch a voice agent for a new session.

    Args:
        session_id: Unique session identifier
        room_name: Name of the LiveKit room

    Returns:
        Dictionary with agent status and configuration
    """
    try:
        # Create agent token
        agent_token = await create_agent_token(room_name)

        # Create agent instance
        agent = NxtWaveOnboardingAgent()

        # Store session info
        session_info = {
            "session_id": session_id,
            "room_name": room_name,
            "agent_token": agent_token,
            "agent": agent,
            "status": "active",
            "created_at": asyncio.get_event_loop().time()
        }

        active_sessions[session_id] = session_info

        # Start agent in background (this would connect to LiveKit and start processing)
        # In a real implementation, this would create a LiveKit participant connection
        asyncio.create_task(run_agent_session(session_info))

        print(f"Launched agent for session: {session_id} in room: {room_name}")
        return {
            "success": True,
            "agent_token": agent_token,
            "room_name": room_name,
            "session_id": session_id
        }

    except Exception as e:
        print(f"Error launching agent for session {session_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

async def run_agent_session(session_info: Dict[str, Any]):
    """
    Run the agent session in the background.
    This would handle the LiveKit connection and audio processing.

    Args:
        session_info: Session information dictionary
    """
    try:
        # This is where you would:
        # 1. Connect to LiveKit room with agent token
        # 2. Set up audio processing
        # 3. Connect to Gemini Live API
        # 4. Handle real-time communication

        session_id = session_info["session_id"]
        room_name = session_info["room_name"]

        print(f"Agent session {session_id} running for room {room_name}")

        # For now, just simulate some processing time
        await asyncio.sleep(300)  # 5 minutes timeout

        # Clean up session when done
        await end_agent_session(session_id)

    except Exception as e:
        print(f"Error in agent session {session_info['session_id']}: {e}")
        await end_agent_session(session_info["session_id"])

async def end_agent_session(session_id: str):
    """
    End an agent session and clean up resources.

    Args:
        session_id: Session identifier to end
    """
    if session_id in active_sessions:
        session_info = active_sessions[session_id]
        room_name = session_info["room_name"]

        # Clean up LiveKit room
        await cleanup_room(room_name)

        # Remove from active sessions
        del active_sessions[session_id]

        print(f"Ended agent session: {session_id}")

def get_session_info(session_id: str) -> Dict[str, Any]:
    """
    Get information about an active session.

    Args:
        session_id: Session identifier

    Returns:
        Session information or None if not found
    """
    return active_sessions.get(session_id)

def list_active_sessions() -> Dict[str, Dict[str, Any]]:
    """
    List all active sessions.

    Returns:
        Dictionary of active sessions
    """
    return active_sessions.copy()
