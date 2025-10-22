# backend/app/config.py
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # LiveKit settings
    LIVEKIT_HOST: str
    LIVEKIT_API_KEY: str
    LIVEKIT_API_SECRET: str

    # Google Gemini API settings
    GOOGLE_API_KEY: str

    class Config:
        env_file = ".env"
        # This tells Pydantic to read from the .env file at the root of the /backend folder.
        env_file_encoding = 'utf-8'

settings = Settings()
