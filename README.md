# RansomNegotiator 🔐💻

> A **modern web-based** ransomware negotiation simulator powered by local AI

---

## 📖 Overview

**RansomNegotiator** is a full-featured web application that simulates ransomware group negotiation conversations using AI. Built with a modern tech stack (Django REST API + Next.js), it provides an intuitive interface for security researchers, incident response teams, and students to practice and study ransomware negotiation tactics.

This project is a insprired by the original [Ransomchat CLI](https://github.com/toniall/ransomchat), offering:

- 🌐 **Modern Web Interface** - Clean, responsive UI built with React and Tailwind CSS
- 💾 **Persistent Chat Sessions** - Save and manage multiple negotiation conversations
- 🔍 **Chat Search** - Find past conversations quickly
- 🎨 **User Authentication** - Secure login and personalized settings
- 📤 **Export Functionality** - Download conversations for analysis

### Inspiration & Data Source

The chat data and behavior patterns are derived from the [Ransom.at](https://ransomch.at/) project - an open database of ransomware negotiation chats. This project was inspired by the [Ransomchat](https://github.com/toniall/ransomchat) CLI tool, and ransom chat data by [Casualtek](https://github.com/Casualtek/Ransomchats/tree/main), which served as the foundation for this enhanced web-based version.

---

## ⚠️ Important Disclaimers

### Educational Use Only

> **This project is for educational and research purposes only.** 🔒

RansomNegotiator simulates conversations with using AI based on real ransomware group behaviors. It is **NOT** intended to:

- Facilitate actual ransomware negotiations
- Extort victims or aid cybercriminals
- Engage with real ransomware groups

The behavior patterns are derived from publicly available sources and are used for **educational simulation only**. Any use for malicious purposes is strictly prohibited.

---

### 🚨 Cloud AI Provider Warning

> **DO NOT use OpenAI ChatGPT, Claude, Google Gemini, or any cloud-based AI SaaS services to run this project.**

Due to the nature of the data being transmitted (ransomware negotiation themes, extortion scenarios, etc.), cloud AI providers may **suspend or terminate your account** for violating their content policies.

---

## 🤖 Required: Uncensored/Abriterated AI Models

> **You MUST use abliterated (uncensored) models** to run this project. Standard models like ChatGPT, Claude, or gated Llama variants will refuse to engage with ransomware negotiation scenarios due to their safety filters.

The following abliterated model has been tested and verified:

| Model | RAM Requirements | Recommended Tool |
|-------|------------------|------------------|
| `mannix/llama3.1-8b-abliterated:Q3_K_M` | ~4GB | Ollama, LM Studio |

This model has had its safety filters removed, allowing it to roleplay as ransomware groups for educational simulation purposes.

All testing was performed using `mannix/llama3.1-8b-abliterated:Q3_K_M`, and this is the recommended model for use. You may opt to use smaller models like `tinyllama` but these smaller models may have less desireable/realistic responses.

### Compatible Endpoints

The application is compatible with **any OpenAI API-compatible endpoint**

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Docker | Latest | Recommended |
| Docker Compose | v2+ | |
| Ollama or LM Studio | Latest | For AI (see Model Requirements) |

---

### Using Docker Compose (Recommended) 🐳

Clone the git repository:
```bash
git clone https://github.com/fish-not-phish/RansomNegotiator.git
cd RansomNegotiator
```

Copy the environment example and configure:
```bash
cp example.env .env
# Edit .env with your settings (SECRET_KEY is required for production)
```

```bash
# Rebuild after code changes
docker build -t ransomnegotiator/backend:latest --build-arg VERSION=latest ./backend
docker build -t ransomnegotiator/frontend:latest --build-arg NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 --build-arg NEXT_PUBLIC_BASE_URL=http://127.0.0.1:8000 ./frontend

docker compose up -d

# Stop services (preserves data)
docker compose down

# Stop and delete database (⚠️ WARNING: deletes all data)
docker compose down -v
```

This launches:

| Service | URL |
|---------|-----|
| 🌐 Frontend | [http://127.0.0.1:3000](http://127.0.0.1:3000) |
| ⚙️ Backend API | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| 🗄️ PostgreSQL | 127.0.0.1:5432 |

---

## 💬 Starting a Chat

When you start a new chat, you'll need to provide some details about your fictional company. These values help the AI personalize the negotiation scenario:

### Chat Configuration

| Field | Description | Example |
|-------|-------------|---------|
| **Ransomware Group** | The ransomware group you want to negotiate with | LockBit 3.0, Conti, Akira |
| **Your Company Name** | Name of your fictional company | Acme Corp, Global Industries |
| **Annual Revenue** | Your company's revenue (used to calculate ransom demands) | `$50M`, `$1.5B` |

> **Note:** These values are entirely fictional and can be made up for simulation purposes. The AI uses them to create more realistic ransom demands based on your company's "size."

### Examples

- Company: **Acme Corp**, Revenue: **$50M** → Ransom demand: ~$1-2.5M (2-5% of revenue)
- Company: **MegaCorp Industries**, Revenue: **$2B** → Ransom demand: ~$20-100M (1-5% of revenue)

### How It Works

1. Click **New Chat** in the sidebar
2. Select a **Ransomware Group** from the dropdown
3. Enter your **Company Name** (or leave blank for a generic one)
4. Enter your **Annual Revenue** (or leave empty for a random value)
5. Click **Start Chat** to begin the negotiation

The AI will address you by your company name and tailor ransom demands based on your specified revenue.

### Response Time Tips

> **First Message:** The initial response may take **1-2 minutes** because the AI model needs to be loaded into memory (cold start). This is normal for local AI models.

> **Subsequent Messages:** After the first response, the model is already loaded in memory, so responses should be faster.

---

## 🦠 Available Ransomware Groups

The application includes behavior profiles for **23 ransomware groups**:

| Group | Status |
|-------|--------|
| Akira | ✅ Available |
| Avaddon | ✅ Available |
| Avos | ✅ Available |
| Babuk | ✅ Available |
| BlackBasta | ✅ Available |
| BlackMatter | ✅ Available |
| Cloak | ✅ Available |
| Conti | ✅ Available |
| Darkside | ✅ Available |
| DragonForce | ✅ Available |
| Fog | ✅ Available |
| Hive | ✅ Available |
| Hunters International | ✅ Available |
| LockBit 3.0 | ✅ Available |
| Mallox | ✅ Available |
| Mount-Locker | ✅ Available |
| NoEscape | ✅ Available |
| Qilin | ✅ Available |
| RansomHub | ✅ Available |
| Ranzy | ✅ Available |
| REvil | ✅ Available |
| Trinity | ✅ Available |

> Each group has unique behavior patterns based on real-world negotiation data from [Ransom.at](https://ransomch.at/).

---

## ⚙️ Configuration

### Mode Configuration

The application supports two modes via the `MODE` environment variable:

| Mode | Protocol | Port | Database | Use Case |
|------|----------|------|----------|----------|
| `DEV` | HTTP | :3000 | PostgreSQL | Development |
| `PROD` | HTTPS | :443 | PostgreSQL | Production |

### Environment Variables

#### Docker Compose

Create a `.env` file to customize settings (copy from `.env.example`). All variables have defaults:

| Variable | Default | Description |
|----------|---------|-------------|
| `VERSION` | `latest` | Image version tag |
| `MODE` | `DEV` | Application mode (`DEV` or `PROD`) |
| `CUSTOM_DOMAIN` | `127.0.0.1:3000` | Frontend domain for auth redirects |
| `SECRET_KEY` | (insecure dev key) | Django secret key (required for PROD) |
| `OPENAI_DEFAULT_BASE_URL` | `http://host.docker.internal:1234/v1` | AI API endpoint |
| `OPENAI_DEFAULT_MODEL` | `mannix/llama3.1-8b-abliterated` | Default AI model |
| `DB_NAME` | `ransomnegotiator` | Database name |
| `DB_USER` | `ransomnegotiator` | Database username |
| `DB_PASSWORD` | `ransomnegotiator` | Database password |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | Frontend API URL |

#### Backend (Manual) - `backend/.env`

Copy `backend/.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key (generate with `python -c "import secrets; print(secrets.token_urlsafe(50))"`) |
| `MODE` | `DEV` or `PROD` |
| `CUSTOM_DOMAIN` | Frontend domain for auth |
| `OPENAI_DEFAULT_BASE_URL` | AI API endpoint |
| `OPENAI_DEFAULT_MODEL` | AI model name |
| `DB_*` | Database connection settings |

#### Frontend (Manual) - `frontend/.env.local`

Copy `frontend/.env.local.example` to `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_BASE_URL` | Backend base URL |

### User Settings

Configure your AI settings through the **user menu** in the web interface:

- 🔗 **API Endpoint** - Default: `http://localhost:1234/v1` (LM Studio)
- 🤖 **Model Name** - Default: `mannix/llama3.1-8b-abliterated`
- 🔑 **API Key** - Optional (for Ollama with authentication)

---


### Production Environment Variables

Create a `.env` file for production:

```bash
# App settings
MODE=PROD
VERSION=latest
CUSTOM_DOMAIN=https://yourdomain.com

# Database
DB_NAME=ransomnegotiator
DB_USER=ransomnegotiator
DB_PASSWORD=ransomnegotiator

# AI (your local Ollama/LM Studio endpoint)
OPENAI_DEFAULT_BASE_URL=http://your-ollama-host:11434/v1
OPENAI_DEFAULT_MODEL=mannix/llama3.1-8b-abliterated

# Frontend (internal service name)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_BASE_URL=http://127.0.0.1:8000

# Django secret key (generate a secure key)
SECRET_KEY=your-django-secret-key-here
```

---

## 📂 Project Structure

```
ransomnegotiator/
├── behaviour/                      # 🤖 AI behavior pattern files
│   ├── Akira_behaviour.txt
│   ├── Conti_behaviour.txt
│   └── ...
├── backend/                        # ⚙️ Django REST API
│   ├── chat/                      # 💬 Chat endpoints & logic
│   ├── users/                     # 👤 User authentication
│   ├── .env.example              # 📝 Example environment file
│   ├── manage.py
│   └── requirements.txt
├── frontend/                       # 🌐 Next.js web application
│   ├── app/                       # 📱 React page components
│   ├── components/                # 🧩 UI components (Shadcn)
│   ├── services/                  # 🔌 API client services
│   ├── store/                     # 📦 State management
│   ├── .env.local.example         # 📝 Example environment file
│   ├── package.json
│   └── next.config.ts
├── docker compose.yml             # 🐳 Docker orchestration
└── README.md                       # 📖 This file
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Shadcn UI |
| **Backend** | Django 5, Django REST Framework, Python 3.12 |
| **Database** | PostgreSQL 16 / SQLite (dev) |
| **AI Integration** | OpenAI API-compatible clients (Ollama, LM Studio) |
| **Deployment** | Docker, Docker Compose |

---

## 📜 License

This project is provided for **educational purposes only**. Behavior data is derived from publicly available sources.

See the [LICENSE](./LICENSE) file for full details.

---

## 🙏 Acknowledgments

- **[Ransom.at](https://ransomch.at/)** - For maintaining the open database of ransomware negotiation chats
- **[Casualtek](https://github.com/Casualtek)** - For the original Ransomchats CLI that inspired this project

---

<div align="center">

**🔔 Stay Safe - Use Responsibly 🔔**

</div>