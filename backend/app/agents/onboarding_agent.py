# --- Onboarding Agent Logic ---
# Your 'NxtWaveOnboardingAgent' class from agent_telugu.py will be moved here.
# This file will contain all the conversational logic, state management (current_stage),
# and methods like on_user_turn_completed.
import asyncio
import json
from typing import Dict, Any, Optional
from livekit import agents, rtc
from app.config import settings

class NxtWaveOnboardingAgent(agents.Agent):
    def __init__(self):
        super().__init__()
        self.current_stage = 1
        self.session_data = {}
        self.conversation_history = []
        self.room = None

    async def on_join(self, room: rtc.Room):
        """Called when the agent joins the room."""
        self.room = room
        print(f"Agent joined room: {room.name}")

        # Set up data channel for communication with frontend
        await self.setup_data_channel()

        # Send initial welcome message
        await self.send_data({
            "action": "new_message",
            "role": "agent",
            "content": "Hello! Welcome to our onboarding process. I'm here to help you get started."
        })

    async def setup_data_channel(self):
        """Set up data channel for communication with frontend."""
        if self.room:
            # Create a data channel for control messages
            data_channel = await self.room.create_data_channel("agent-control")

            @data_channel.on("message")
            async def on_message(message):
                await self.handle_frontend_message(message)

    async def handle_frontend_message(self, message: str):
        """Handle messages received from the frontend via data channel."""
        try:
            data = json.loads(message)
            action = data.get("action")

            print(f"Received action from frontend: {action}")

            if action == "advance_stage":
                await self.advance_stage()
            elif action == "payment_selected":
                choice = data.get("choice", "")
                await self.handle_payment_selection(choice)
            elif action == "set_stage":
                stage = data.get("stage", 1)
                await self.set_stage(stage)
            else:
                print(f"Unknown action: {action}")

        except json.JSONDecodeError as e:
            print(f"Error parsing frontend message: {e}")
        except Exception as e:
            print(f"Error handling frontend message: {e}")

    async def advance_stage(self):
        """Advance to the next stage in the onboarding process."""
        if self.current_stage < 4:
            self.current_stage += 1

            # Send stage change to frontend
            await self.send_data({
                "action": "set_stage",
                "stage": self.current_stage
            })

            # Send appropriate message for the new stage
            await self.send_stage_message()
        else:
            # Process completed, send final message
            await self.send_data({
                "action": "new_message",
                "role": "agent",
                "content": "Great! You've completed all the onboarding steps. Your application is being processed."
            })

    async def set_stage(self, stage: int):
        """Set the current stage (for navigation)."""
        if 1 <= stage <= 4:
            self.current_stage = stage
            await self.send_data({
                "action": "set_stage",
                "stage": self.current_stage
            })
            await self.send_stage_message()

    async def handle_payment_selection(self, choice: str):
        """Handle user's payment method selection."""
        self.session_data["payment_choice"] = choice

        # Send confirmation message
        await self.send_data({
            "action": "new_message",
            "role": "agent",
            "content": f"Excellent choice! You've selected {choice}. Let's continue with the next steps."
        })

        # If EMI selected, show modal (handled by frontend)
        if "emi" in choice.lower():
            await self.send_data({
                "action": "show_emi_modal"
            })

    async def send_stage_message(self):
        """Send appropriate message for the current stage."""
        messages = {
            1: "Welcome to your onboarding journey! Let's get started with the basics.",
            2: "Now let's talk about payment options. What works best for you?",
            3: "Great choice! Let's continue with the EMI details.",
            4: "Finally, let's review the required documents to complete your application."
        }

        message = messages.get(self.current_stage, "Let's continue with the next step.")
        await self.send_data({
            "action": "new_message",
            "role": "agent",
            "content": message
        })

    async def send_data(self, payload: Dict[str, Any]):
        """Send data to the frontend via data channel."""
        if self.room:
            try:
                # Find the data channel and send the message
                for participant in self.room.participants.values():
                    if not participant.identity.startswith("agent-"):
                        # This is the user participant
                        for channel in participant.data_channels.values():
                            await channel.send(json.dumps(payload))
                            break
            except Exception as e:
                print(f"Error sending data: {e}")

    async def on_user_speech_completed(self, speech_text: str):
        """Called when the user finishes speaking."""
        if speech_text.strip():
            # Add to conversation history
            self.conversation_history.append({
                "role": "user",
                "content": speech_text,
                "timestamp": asyncio.get_event_loop().time()
            })

            # Send to frontend for display
            await self.send_data({
                "action": "new_message",
                "role": "user",
                "content": speech_text
            })

            # Process the user's input
            await self.process_user_input(speech_text)

    async def process_user_input(self, user_input: str):
        """Process user's speech input and respond accordingly."""
        # For now, simulate processing - in a real implementation,
        # this would use the Gemini Live API or other NLP processing

        # Simulate different responses based on current stage and input
        if "payment" in user_input.lower() or "pay" in user_input.lower():
            await self.send_data({
                "action": "new_message",
                "role": "agent",
                "content": "I understand you're interested in payment options. Let me show you what's available."
            })
        elif "document" in user_input.lower() or "paper" in user_input.lower():
            await self.send_data({
                "action": "new_message",
                "role": "agent",
                "content": "Great question about documents! You'll need your government ID, passport photo, address proof, and income proof."
            })
        else:
            # Generic response
            await self.send_data({
                "action": "new_message",
                "role": "agent",
                "content": "I understand. Let me help you with that. What would you like to know more about?"
            })

    async def cleanup(self):
        """Clean up resources when session ends."""
        print(f"Agent cleanup for room: {self.room.name if self.room else 'unknown'}")
        self.room = None
