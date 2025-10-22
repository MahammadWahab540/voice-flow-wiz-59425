# --- LiveKit Service ---
# This service will be responsible for all direct interactions with the
# LiveKit SDK, primarily generating access tokens.
import asyncio
from livekit import api
from app.config import settings

async def create_access_token(identity: str, room_name: str) -> str:
    """
    Create a LiveKit access token for a participant to join a room.

    Args:
        identity: Unique identifier for the participant (e.g., user ID)
        room_name: Name of the room to join

    Returns:
        JWT token string that can be used to connect to LiveKit
    """
    try:
        # Create LiveKit API client
        lk_api = api.LiveKitAPI(
            url=settings.LIVEKIT_URL,
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET
        )

        # Create room if it doesn't exist
        try:
            await lk_api.room.create_room(
                api.CreateRoomRequest(
                    name=room_name,
                    empty_timeout=300,  # 5 minutes
                    max_participants=2,  # Agent + User
                )
            )
            print(f"Created room: {room_name}")
        except Exception as e:
            print(f"Room {room_name} might already exist: {e}")

        # Generate access token
        token = api.AccessToken(
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET
        ).with_identity(identity).with_name(f"User-{identity}").with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
        )

        jwt_token = token.to_jwt()
        print(f"Generated token for {identity} in room {room_name}")
        return jwt_token

    except Exception as e:
        print(f"Error creating LiveKit token: {e}")
        raise

async def create_agent_token(room_name: str) -> str:
    """
    Create a LiveKit access token for the voice agent.

    Args:
        room_name: Name of the room the agent will join

    Returns:
        JWT token string for the agent
    """
    agent_identity = f"agent-{room_name}"

    try:
        token = api.AccessToken(
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET
        ).with_identity(agent_identity).with_name("Voice Agent").with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
        )

        jwt_token = token.to_jwt()
        print(f"Generated agent token for room {room_name}")
        return jwt_token

    except Exception as e:
        print(f"Error creating agent token: {e}")
        raise

async def cleanup_room(room_name: str):
    """
    Clean up a LiveKit room when session ends.

    Args:
        room_name: Name of the room to clean up
    """
    try:
        lk_api = api.LiveKitAPI(
            url=settings.LIVEKIT_URL,
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET
        )

        await lk_api.room.delete_room(api.DeleteRoomRequest(name=room_name))
        print(f"Cleaned up room: {room_name}")

    except Exception as e:
        print(f"Error cleaning up room {room_name}: {e}")
