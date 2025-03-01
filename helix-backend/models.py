from flask_sqlalchemy import SQLAlchemy
import uuid
from datetime import datetime
import json

db = SQLAlchemy()

class Guest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(255), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sessions = db.relationship("ChatSession", backref="guest", lazy=True)

class ChatSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    guest_id = db.Column(db.Integer, db.ForeignKey("guest.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    messages = db.relationship("Message", backref="chat_session", lazy=True)
    workspace = db.relationship("Workspace", backref="chat_session", uselist=False, lazy=True)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chat_session_id = db.Column(db.Integer, db.ForeignKey("chat_session.id"), nullable=False)
    message_text = db.Column(db.Text, nullable=False)
    is_input = db.Column(db.Boolean, default=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Workspace(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("chat_session.id"), nullable=False)
    sequences = db.Column(db.Text, nullable=False, default='[]')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_sequences(self):
        """Convert the stored JSON string back to a list of dictionaries"""
        return json.loads(self.sequences)
    
    def set_sequences(self, sequences_list):
        """Convert the list of dictionaries to a JSON string for storage"""
        self.sequences = json.dumps(sequences_list)
    