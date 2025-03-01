from models import db, ChatSession, Message, Workspace
from flask import jsonify
import json

def retrive_all_sessions(guest_id):
    """
    Retrieves all chat sessions for a specific guest.
    
    Args:
        guest_id: The ID of the guest
        
    Returns:
        A list of ChatSession objects
    """
    sessions = ChatSession.query.filter_by(guest_id=guest_id).all()
    return sessions


def retrive_all_messages(session_id):
    """
    Retrieves all messages for a specific chat session.
    
    Args:
        session_id: The session ID
        
    Returns:
        A list of message data dictionaries or an error response
    """
    chat_session = ChatSession.query.filter_by(session_id=session_id).first()
    if not chat_session:
        return jsonify({"error": "Session not found"}), 404
    messages = Message.query.filter_by(chat_session_id=chat_session.id).all()
    messages_data = [
        {
            "message": m.message_text,
            "is_input": m.is_input,
            "timestamp": m.timestamp.isoformat(),
        }   
        for m in messages   
    ]
    return messages_data


def retrieve_all_chats_for_guest(guest_id):
    """
    Retrieves all chat messages from all sessions for a specific guest.
    
    Args:
        guest_id: The ID of the guest
        
    Returns:
        A dictionary where keys are session_ids and values are lists of messages for that session
    """
    all_sessions = retrive_all_sessions(guest_id)
    all_chats = {}
    
    for session in all_sessions:
        session_messages = retrive_all_messages(session.session_id)
        # Only include if valid messages were returned (not an error response)
        if not isinstance(session_messages, tuple):
            all_chats[session.session_id] = session_messages
    
    return all_chats


def extract_tool_messages(messages):
    """
    Given a list of message dictionaries, return a list of those that are Tool messages.
    A Tool message is identified by the presence of the "tool_call_id" key.
    """
    tool_msgs = []
    for msg in messages:
        if isinstance(msg, dict) and "tool_call_id" in msg:
            tool_msgs.append(msg)
    return tool_msgs 


def get_workspace_for_session(session_id):
    """
    Retrieves the workspace data for a specific chat session.
    
    Args:
        session_id: The session ID
        
    Returns:
        A list of step objects or None if not found
    """
    chat_session = ChatSession.query.filter_by(session_id=session_id).first()
    if not chat_session:
        return None
    
    workspace = Workspace.query.filter_by(session_id=chat_session.id).first()
    if workspace:
        try:
            # Get the sequences and check if it contains a "steps" key
            sequences = workspace.get_sequences()
            if isinstance(sequences, dict) and "steps" in sequences:
                return sequences["steps"]
            return sequences
        except json.JSONDecodeError:
            print(f"Invalid JSON in workspace sequences for session {session_id}")
            return []
    return []


def retrieve_all_workspaces_for_guest(guest_id):
    """
    Retrieves all workspace data from all sessions for a specific guest.
    
    Args:
        guest_id: The ID of the guest
        
    Returns:
        A dictionary where keys are session_ids and values are workspace sequence objects
    """
    all_sessions = retrive_all_sessions(guest_id)
    all_workspaces = {}
    
    for session in all_sessions:
        workspace_data = get_workspace_for_session(session.session_id)
        if workspace_data is not None:
            all_workspaces[session.session_id] = workspace_data
    
    return all_workspaces


# Only execute this code when running the file directly
if __name__ == "__main__":
    from app import app  # Import your Flask app
    with app.app_context():
        # print(retrive_all_sessions(2))
        # print(retrieve_all_chats_for_guest(2))
        print(retrieve_all_workspaces_for_guest(10))