import os
import sys
import json
import string
import time
PARENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

from utils import (
    retrieve_all_chats_for_guest,
    retrieve_all_workspaces_for_guest,
)
from langchain_core.tools import tool
from typing import List
from flask_socketio import emit
from .structured_models import WorkspaceInput, Step
import google.generativeai as genai
from google.generativeai import GenerativeModel


@tool(args_schema=WorkspaceInput)
def workspace_tool(steps: List[Step]) -> dict:
    """Use this tool to post your final answer to the workspace.
    Each step should include an action, description, and optional status."""
    import json

    processed_steps = [step.model_dump() for step in steps]
    print("processed_steps", processed_steps)
    emit(
        "workspace_update",
        {"workspace": json.dumps(processed_steps)},
        namespace="/chat",
    )
    return {"steps": processed_steps}


@tool()
def get_chat_history(guest_id: int) -> dict:
    """Use this tool to get the chat history for a specific guest."""
    chat_history = retrieve_all_chats_for_guest(guest_id)
    return chat_history


@tool()
def get_workspace_history(guest_id: int) -> dict:
    """Use this tool to get the workspace for a specific session."""
    workspace = retrieve_all_workspaces_for_guest(guest_id)
    return workspace


@tool()
def run_simulation(position: str, sequence: List[Step]) -> dict:
    """Use this tool to run a simulation for a specific position."""
    sequence = [step.model_dump() for step in sequence]
    with open(
        os.path.join(os.path.dirname(__file__), "prompts", "persona.json"), "r"
    ) as file:
        profile_dict = json.load(file)
    matching_profiles = {}
    for key, value in profile_dict.items():
        if key.startswith(position + "_"):
            matching_profiles[key] = value

    if not matching_profiles:
        raise ValueError(f"No profiles found for position: {position}")
    print("matching_profiles", matching_profiles)

    # Slice matching_profiles to only run the first one comment this in production
    matching_profiles = dict(list(matching_profiles.items())[:1])
    results = {}
    for profile_key, profile_value in matching_profiles.items():
        time.sleep(5)
        results[profile_key] = create_gemini_chat(
            profile_dict=profile_value, sequences=sequence
        )
    print("results", results)
    return results


def create_gemini_chat(profile_dict=None, sequences=None, api_key=None):
    """Use this tool to create a chat with Gemini."""
    with open(
        os.path.join(os.path.dirname(__file__), "prompts", "sim_prompt.txt"), "r"
    ) as file:
        base_prompt = file.read()

    template = string.Template(base_prompt)
    system_prompt = template.substitute(profile_dict)
    if api_key is None:
        api_key = ""
        if api_key is None:
            raise ValueError(
                "API key must be provided either as an argument or as GOOGLE_API_KEY environment variable"
            )
    try:
        genai.configure(api_key=api_key)
        model = GenerativeModel("gemini-2.0-flash")
        chat = model.start_chat(history=[])
        responses = []
        first_message = f"System Prompt: {system_prompt}"
        chat.send_message(first_message)
        for seq in sequences:
            response = chat.send_message(seq["content"])
            lines = response.text.splitlines()
            json_content = "\n".join(
                line for line in lines if not line.strip().startswith("```")
            )
            data = json.loads(json_content)
            emit(
                "simulation_update",
                {"simulation": json.dumps({profile_dict["NAME"]: data})},
                namespace="/chat",
            )
            responses.append(data)

        return responses
    except Exception as e:
        print(f"Error in create_gemini_chat: {str(e)}")
        raise

