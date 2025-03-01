from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
from langchain_core.prompts import ChatPromptTemplate
import logging
from dotenv import load_dotenv
from .structured_models import WorkspaceInput, Step
from langchain_core.tools import tool
from .db import checkpointer
import os
from flask_socketio import emit
from typing import List
from langchain_community.tools import DuckDuckGoSearchRun
from .tools import workspace_tool, get_chat_history, get_workspace_history, run_simulation


class HelixAgent:
    def __init__(self):

        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        self._config = {"configurable": {"thread_id": ""}}
        self.guest_id = None

        load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
        if not self.logger.handlers:
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)

            file_handler = logging.FileHandler("helix_agent.log")
            file_handler.setLevel(logging.INFO)

            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            console_handler.setFormatter(formatter)
            file_handler.setFormatter(formatter)

            self.logger.addHandler(console_handler)
            self.logger.addHandler(file_handler)

        self.logger.info("Initializing HelixAgent")
        self.model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
        self.search = TavilySearchResults(max_results=3)
        self.memory = checkpointer
        self.prompt = self.load_prompt()

        if self.prompt:
            self.agent = create_react_agent(
                self.model,
                [self.search, workspace_tool, DuckDuckGoSearchRun(), get_chat_history, get_workspace_history, run_simulation],
                checkpointer=self.memory,
                prompt=self.prompt,
            )
            self.logger.info("HelixAgent initialized successfully")
        else:
            self.logger.error(
                "Failed to initialize HelixAgent due to prompt loading failure"
            )

    def set_guest_id(self, guest_id):
        self.guest_id = guest_id
        self.logger.info(f"Guest ID set to: {self.guest_id}")

    def tools(self):
        self.logger.debug("Accessing tools property")
        tools = [self.search, workspace_tool, get_chat_history(self.guest_id), get_workspace_history(self.guest_id), run_simulation]
        return tools

    def load_prompt(self):
        self.logger.info("Attempting to load prompt from prompt.txt")
        try:
            prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "modified_prompt.txt")
            with open(prompt_path, "r") as file:
                prompt = file.read()
            system_prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        prompt,
                    ),
                    ("placeholder", "{messages}"),
                ],
            )
            self.logger.info("Prompt loaded successfully")
            return system_prompt
        except Exception as e:
            self.logger.error(f"Failed to load prompt: {str(e)}")
            return None

    @property
    def config(self):
        return self._config

    @config.setter
    def config(self, thread_id=None, guest_id=None):
        if thread_id:
            self._config = {"configurable": {"thread_id": thread_id}}

        else:
            if (
                hasattr(self, "_config")
                and "configurable" in self._config
                and "thread_id" in self._config["configurable"]
            ):
                thread_id = self._config["configurable"]["thread_id"]
            self._config = {"configurable": {"thread_id": thread_id}}
        if guest_id:
            self.guest_id = guest_id
            self.logger.info(f"Guest ID set to: {self.guest_id}")
    def run(self, message):
        response = self.agent.invoke(
            {"messages": [HumanMessage(content=message)]},
            self.config,
        )
        return response
