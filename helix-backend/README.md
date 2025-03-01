# Helix Backend

A Flask-based backend service with AI agent integration using LangGraph and PostgreSQL for persistence.

## Prerequisites

- Python 3.12+
- PostgreSQL (or Docker for containerized setup)
- Node.js (for frontend)

## Setup

1. **Extract the project**
```bash
unzip helix.zip
cd helix/helix-backend
```

2. **Create and activate a virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment Configuration**

Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydatabase
GOOGLE_API_KEY=your_google_api_key
TAVILY_API_KEY=your_tavily_api_key
```

5. **Database Setup**

Option 1: Using Docker (Recommended)
```bash
docker-compose up -d
```
This will start:
- PostgreSQL server on port 5432
- pgAdmin on port 8080 (access at http://localhost:8080)
  - Email: admin@example.com
  - Password: SuperSecretPassword

Option 2: Local PostgreSQL
- Ensure PostgreSQL is running locally
- Create a database matching your DATABASE_URL

The application will automatically create the necessary tables on first run.

## Running the Application

1. **Start the Flask server**
```bash
python app.py
```
The server will start at `http://localhost:5000`

2. **WebSocket Endpoints**
- Connect to WebSocket at `/chat` namespace
- Available events:
  - `send_message`: Send messages to the agent
  - `receive_message`: Receive agent responses
  - `workspace_update`: Receive workspace updates
  - `error_message`: Receive error notifications

## API Endpoints

- `POST /guest/login`: Create a new guest session
- `POST /session/create`: Create a new chat session
- `GET /sessions`: Get all sessions for a guest
- `GET /session/<session_id>/history`: Get chat history for a session

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_API_KEY`: API key for Google Generative AI
- `TAVILY_API_KEY`: API key for Tavily search

## Project Structure

```
helix/
├── helix-backend/
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── agent.py
│   │   ├── db.py
│   │   ├── models.py
│   │   └── prompt.txt
│   ├── app.py
│   ├── models.py
│   ├── requirements.txt
│   ├── docker-compose.yml
│   └── .env
└── helix-frontend/
    └── ... (frontend files)
``` 