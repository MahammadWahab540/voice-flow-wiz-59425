# backend/app/main.py
import os
import subprocess
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from livekit import api

# It's better to manage the app creation here
app = FastAPI(title="Voice Agent Backend")

# This is important for your frontend to be able to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load settings from the config file
# Assuming your execution path is the root of /backend
sys.path.append(os.path.abspath('app'))
from config import settings


@app.post("/api/voice-session/start")
def start_voice_session():
    # In a real app, you'd get this from an authenticated user
    user_identity = "user-voice-agent"
    room_name = f"session_{user_identity}_{os.urandom(4).hex()}"

    # 1. Create a token for the user (frontend)
    user_token = (
        api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        .with_identity(user_identity)
        .with_name("User")
        .with_grants(api.VideoGrants(room_join=True, room=room_name))
        .to_jwt()
    )

    # 2. Create a token for the agent (backend)
    agent_token = (
        api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        .with_identity("ai-agent")
        .with_name("Maya")
        .with_grants(api.VideoGrants(room_join=True, room=room_name))
        .to_jwt()
    )

    # 3. Launch the agent.py script as a background process
    try:
        # Use sys.executable to ensure we use the same Python interpreter (from the venv)
        command = [
            sys.executable,
            "agent_telugu.py",  # The name of your agent script
            "--url", settings.LIVEKIT_HOST,
            "--token", agent_token
        ]
        # Popen runs this in the background
        subprocess.Popen(command)
        print(f"Launched agent process for room: {room_name}")

    except Exception as e:
        print(f"Failed to launch agent subprocess: {e}")
        return {"error": "Failed to launch agent"}, 500

    # 4. Return the user token to the frontend
    return {
        "token": user_token,
        "livekitUrl": settings.LIVEKIT_HOST,
        "room": room_name
    }

@app.get("/")
def read_root():
    return {"message": "Voice Agent Backend is running."}
