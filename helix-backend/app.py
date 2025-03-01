from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from agent.agent import HelixAgent
from models import db, Guest, ChatSession, Message, Workspace
from utils import retrive_all_sessions, retrive_all_messages, retrieve_all_chats_for_guest, extract_tool_messages
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = "2482dcf9824c64c2d483290506bffc3f"
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


CORS(app, origins=["http://localhost:5173"])
socketio = SocketIO(app, cors_allowed_origins="http://localhost:5173")

db.init_app(app)
with app.app_context():
    db.create_all()

agent = HelixAgent()


@app.route("/guest/login", methods=["POST"])
def guest_login():
    guest = Guest()
    db.session.add(guest)
    db.session.commit()
    return jsonify({"guest_token": guest.token}), 201


@app.route("/session/create", methods=["POST"])
def create_session():
    data = request.get_json()
    guest_token = data.get("guest_token")
    if not guest_token:
        return jsonify({"error": "Guest token required"}), 400

    guest = Guest.query.filter_by(token=guest_token).first()
    if not guest:
        return jsonify({"error": "Invalid guest token"}), 404

    new_session = ChatSession(guest_id=guest.id)
    db.session.add(new_session)
    db.session.commit()
    return jsonify({"session_id": new_session.session_id}), 201


@app.route("/sessions", methods=["GET"])
def get_sessions():
    guest_token = request.args.get("guest_token")
    if not guest_token:
        return jsonify({"error": "Guest token required"}), 400

    guest = Guest.query.filter_by(token=guest_token).first()
    if not guest:
        return jsonify({"error": "Invalid guest token"}), 404

    sessions = ChatSession.query.filter_by(guest_id=guest.id).all()
    sessions_data = [
        {"session_id": s.session_id, "created_at": s.created_at.isoformat()}
        for s in sessions
    ]
    return jsonify({"sessions": sessions_data}), 200


@app.route("/session/<session_id>/history", methods=["GET"])
def get_chat_history(session_id):
    guest_token = request.args.get("guest_token")
    if not guest_token:
        return jsonify({"error": "Guest token required"}), 400

    guest = Guest.query.filter_by(token=guest_token).first()
    if not guest:
        return jsonify({"error": "Invalid guest token"}), 404

    chat_session = ChatSession.query.filter_by(
        session_id=session_id, guest_id=guest.id
    ).first()   
    if not chat_session:
        return jsonify({"error": "Session not found for the provided guest token"}), 404

    messages = (
        Message.query.filter_by(chat_session_id=chat_session.id)
        .order_by(Message.timestamp)
        .all()
    )
    messages_data = [
        {
            "message": m.message_text,
            "is_input": m.is_input,
            "timestamp": m.timestamp.isoformat(),
        }
        for m in messages
    ]
    return jsonify({"history": messages_data}), 200


@socketio.on("send_message", namespace="/chat")
def handle_send_message(data):
    try:
        guest_token = data.get("guest_token", "")
        session_id = data.get("session_id", "")
        
        # Get the guest from the token first
        guest = Guest.query.filter_by(token=guest_token).first()
        if not guest:
            emit(
                "error_message",
                {"error": "Invalid guest token", "status": "error"},
                namespace="/chat",
            )
            return
        agent.set_guest_id(guest.id)   
        agent.run("Initializing the conversation: guest_id: " + str(guest.id)) 
      
        if not guest_token or not session_id:
            emit(
                "error_message",
                {"error": "Guest token and session id are required", "status": "error"},
                namespace="/chat",
            )
            return
        if "thread_id" in data and data["thread_id"]:
            agent.config = data["thread_id"]
            print(data["thread_id"], "config")
            agent.run("Initializing the conversation: guest_id: " + str(guest.id))
        


        chat_session = ChatSession.query.filter_by(
            session_id=session_id, guest_id=guest.id
        ).first()
        if not chat_session:
            emit(
                "error_message",
                {
                    "error": "Invalid session id for the provided guest token",
                    "status": "error",
                },
                namespace="/chat",
            )
            return

        if not data or not isinstance(data, dict):
            emit(
                "error_message",
                {"error": "Invalid message format", "status": "error"},
                namespace="/chat",
            )
            return

        if "text" not in data or not data["text"] or not data["text"].strip():
            emit(
                "error_message",
                {"error": "Message text is required", "status": "error"},
                namespace="/chat",
            )
            return

        if "step_number" in data and "step_content" in data:
            if not data["step_number"] or not data["step_content"]:
                emit(
                    "error_message",
                    {
                        "error": "Step number and content are required",
                        "status": "error",
                    },
                    namespace="/chat",
                )
                return
            message = f"Change step {data['step_number']} to: {data['step_content']}, and share your thoughts on the changes."
        else:
            message = data["text"].strip()
        input_message = Message(
            chat_session_id=chat_session.id, message_text=message, is_input=True
        )
     
        db.session.add(input_message)
        db.session.commit()
       
        response = agent.run(message)
        if response["messages"][-2].name:
            print(response["messages"][-2].name, "TOOL NAME")
            print(response["messages"][-2].content, "TOOL CONTENT")
            emit(
                "receive_message",
                {
                    "data": f"tool_call: {response['messages'][-2].name}",
                    "status": "success",
                },
                namespace="/chat",
            )
            workspace = Workspace(session_id=chat_session.id, sequences=response["messages"][-2].content)
            db.session.add(workspace)
            db.session.commit()

        last_message = response["messages"][-1].content

        output_message = Message(
            chat_session_id=chat_session.id, message_text=last_message, is_input=False
        )
        db.session.add(output_message)
        db.session.commit()

        emit(
            "receive_message",
            {"data": last_message, "status": "success"},
            namespace="/chat",
        )

    except Exception as e:
        print(f"Error processing message: {str(e)}")
        emit(
            "error_message",
            {"error": "Internal server error", "status": "error", "details": str(e)},
            namespace="/chat",
        )


if __name__ == "__main__":
    socketio.run(app, debug=True)
