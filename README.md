# RecruitFlow

<p align="center">
  <img src="recruitflow.avif" alt="RecruitFlow Logo" width="200"/>
</p>

<p align="center">
  <strong>AI-Powered Recruitment Outreach Automation Platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

## Features

RecruitFlow is a sophisticated platform designed to revolutionize your recruitment outreach strategy through AI-powered automation:

- **🤖 AI-Assisted Sequence Creation**: Collaborate with the RecruitFlow Agent to craft personalized outreach sequences
- **📝 Multi-Step Sequence Builder**: Create, edit, and manage multi-stage recruitment campaigns
- **🧪 Candidate Simulation**: Test your sequences with AI-simulated candidate personas
- **📊 Performance Analysis**: Get detailed feedback on message effectiveness with humanness and compelling metrics
- **📁 Session Management**: Organize and switch between multiple recruitment campaigns
- **🔄 Real-time Collaboration**: Experience seamless updates between the chat and workspace
- **🌓 Dark/Light Mode**: Comfortable UI for any working environment
- **🏢 Company Context**: Store and integrate your company details into message templates

## Demo

![RecruitFlow Demo](https://your-demo-gif-url-here.com/demo.gif)

## Installation

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- npm or yarn

### Frontend Setup

```bash
# Clone the repository
git https://github.com/safimuhammad/RecruitFlow.git
cd RecruitFlow/helix-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Backend Setup

```bash
# Navigate to the backend directory
cd ../helix-backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env file with your configuration

# Start the server
python app.py
```

## Usage

### Creating a New Sequence

1. Click the "Start a Sequence" button on the home page
2. Interact with the RecruitFlow Agent in the chat panel
3. Describe your target role and company details
4. The agent will help generate a recommended sequence in the workspace
5. Edit any step by clicking on it directly

### Running Simulations

1. With your sequence created, click the "Run Simulation" button
2. The system will simulate how candidates might respond to your sequence
3. Review detailed metrics including:
   - Humanness score (how personal the message feels)
   - Compelling score (effectiveness at driving response)
   - Overall recommendation (respond or ignore)
   - Detailed analysis from the simulation

### Managing Sessions

- Create new sequences with the "New Chat" button
- View and select previous sessions from the sidebar
- Each session maintains its own chat history and workspace

## Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- Lucide Icons
- Socket.io Client

### Backend
- Flask
- Socket.io
- LangChain
- Google Generative AI (Gemini)
- SQLite (for development)

## Architecture

RecruitFlow follows a client-server architecture:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│  React UI   │<────>│ Flask API   │<────>│  LangChain  │
│             │      │             │      │  + Gemini   │
└─────────────┘      └─────────────┘      └─────────────┘
       ^                    ^                    ^
       │                    │                    │
       v                    v                    v
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│ Socket.io   │<────>│ Database    │      │ Simulation  │
│  (Real-time)│      │  (Sessions) │      │   Engine    │
└─────────────┘      └─────────────┘      └─────────────┘
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ by Muhammad Safi
</p>