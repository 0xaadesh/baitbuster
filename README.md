# 🛡️ BaitBuster

<div align="left">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61dafb" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Sarvam_AI-1E3A8A?style=for-the-badge" alt="Sarvam AI" />
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
</div>

<br />

BaitBuster is a premium, real-time **Phishing, Scam, and Social Engineering Chat Detector** built to combat modern digital fraud. With support for text inputs, multi-modal screenshot analysis, and diarized multilingual call recording scans, BaitBuster uses advanced large language models to flag malicious patterns instantly.

## 📺 Demonstration Video

<video src="https://github.com/user-attachments/assets/0db654fe-4e10-44cf-b3b3-b19c805e0c8f" controls width="100%"></video>

_If the video player above does not load or play, you can [watch the demonstration video directly in your browser](https://github.com/user-attachments/assets/353c441f-5784-4d66-94ee-2cf5aa3dd9ed)._

---

## 🚀 Key Features

*   **Multi-Channel Scan Engine**:
    *   💬 **Text Analyzer**: Scan pasted copy/paste strings instantly. Handles messy copy formatting seamlessly.
    *   📸 **Vision Screenshot Multimodal Scan**: Drag-and-drop a screenshot of a suspicious chat conversation (WhatsApp, Telegram, SMS, etc.). The vision engine reads all messages, extracts text, and evaluates risk inline.
    *   🎙️ **Diarized Audio Transcription**: Upload audio files (MP3, WAV, M4A) of suspicious calls. The engine transcribes speech, performs multi-speaker diarization, identifies timestamps, and inspects the conversation.
*   **Intelligent Flag Indicators**: Identifies pressure tactics, urgent money demands, fake authority claims, OTP requests, malicious links, and emotional manipulation.
*   **Zod-Validated Schema Verdicts**: Strict structural JSON parsing guarantees reliable risk metrics, confidence scores, red flag tags, citations from conversation evidence, and concrete recommended action protocols.
*   **Harmonious Neutral Shadcn/UI Skin**: Premium dark and light mode UI featuring draggable, resizable split panel structures (`ResizablePanelGroup`) and internal overflow scrolls (`ScrollArea`).

---

## 🛠️ Architecture & Workflow

BaitBuster operates entirely through high-performance **Next.js React Server Actions**, eliminating stand-alone server APIs. 

1.  **Diarization**: Audio records are processed by **Sarvam AI (`saaras:v3`)** to segment speech and diarize voices with strict timestamps.
2.  **Analysis**: Text transcripts and screenshots are analyzed using **Llama 4 Scout 17B** hosted on **Groq Cloud** for high-throughput, low-latency multi-modal reasoning.
3.  **Validation**: Output structures are parsed and verified using **Zod** schemas before dispatching safety metrics back to the UI.

### Technical Sequence Workflow

![Technical Sequence Workflow](./sequence-diagram.png)

---

## ⚡ Tech Stack

*   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Turbopack)
*   **Runtime / Package Runner**: [Bun](https://bun.sh/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Component System**: [Shadcn/UI](https://ui.shadcn.com/) (built on Radix UI)
*   **Core LLM Hosting**: [Groq Cloud SDK](https://groq.com/)
*   **Audio/Transcription**: [Sarvam AI Node SDK](https://www.sarvam.ai/)
*   **Data Validation**: [Zod](https://zod.dev/)



## 📥 Getting Started

Follow these steps to run the application locally:

### 1. Install Dependencies
Make sure you have [Bun](https://bun.sh/) installed, then run:
```bash
bun install
```

### 2. Run the Development Server
Spin up the Turbopack dev server:
```bash
bun run dev
```

### 3. Open the Dashboard
Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to run scans on text logs, images, and audio.

---

## 🔒 Security & Privacy

BaitBuster is engineered with security first:
*   **Zero Database Retention**: Scans are processed ephemerally on-the-fly and never saved or logged in any backend store.
*   **Server Action Security**: All API keys, Groq orchestration prompts, and audio temp folder buffers exist safely behind the server boundaries.
*   **Client Sandboxing**: File and text inputs are kept secure inside the client context, clean of tracking cookies.
