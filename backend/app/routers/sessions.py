# --- Session API Endpoints ---
# This file defines the public HTTP endpoints for your frontend.
# Example: POST /api/voice-session/start
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import uuid
import asyncio
from app.services.livekit_service import create_access_token
from app.services.agent_service import launch_agent_for_session

router = APIRouter()

class StartSessionRequest(BaseModel):
    user_id: str = "anonymous"  # Optional user identifier

class StartSessionResponse(BaseModel):
    success: bool
    session_id: str
    token: str
    livekit_url: str
    room_name: str
    error: str = None

@router.post("/start", response_model=StartSessionResponse)
async def start_session(request: StartSessionRequest):
    """
    Start a new voice session and return LiveKit connection details.

    This endpoint:
    1. Generates a unique session ID
    2. Creates a LiveKit room (if it doesn't exist)
    3. Generates a user access token for the room
    4. Launches a voice agent for the session
    5. Returns connection details for the frontend
    """
    try:
        # Generate unique session and room identifiers
        session_id = str(uuid.uuid4())
        room_name = f"session-{session_id}"

        # Create user access token for LiveKit
        user_token = await create_access_token(
            identity=request.user_id,
            room_name=room_name
        )

        # Launch agent for this session (in background)
        agent_result = await launch_agent_for_session(session_id, room_name)

        if not agent_result.get("success", False):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to launch agent: {agent_result.get('error', 'Unknown error')}"
            )

        return StartSessionResponse(
            success=True,
            session_id=session_id,
            token=user_token,
            livekit_url="ws://localhost:7880",  # This should come from settings
            room_name=room_name
        )

    except Exception as e:
        print(f"Error starting session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start session: {str(e)}"
        )

@router.post("/{session_id}/end")
async def end_session(session_id: str):
    """
    End a voice session and clean up resources.

    Args:
        session_id: The session identifier to end
    """
    try:
        from app.services.agent_service import end_agent_session

        await end_agent_session(session_id)

        return {"success": True, "message": f"Session {session_id} ended successfully"}

    except Exception as e:
        print(f"Error ending session {session_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to end session: {str(e)}"
        )

@router.get("/{session_id}")
async def get_session_info(session_id: str):
    """
    Get information about an active session.

    Args:
        session_id: The session identifier
    """
    try:
        from app.services.agent_service import get_session_info

        session_info = get_session_info(session_id)

        if not session_info:
            raise HTTPException(
                status_code=404,
                detail=f"Session {session_id} not found"
            )

        return {
            "session_id": session_info["session_id"],
            "room_name": session_info["room_name"],
            "status": session_info["status"],
            "created_at": session_info["created_at"]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting session info {session_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get session info: {str(e)}"
        )
