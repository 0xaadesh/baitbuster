"use server";

import Groq from "groq-sdk";
import { z } from "zod";
import { writeFileSync, mkdirSync, rmSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { SarvamAIClient } from "sarvamai";

export interface UserApiKeys {
  groqApiKey?: string;
  sarvamApiKey?: string;
}

function getGroqClient(apiKey?: string): Groq {
  const key = apiKey?.trim();
  if (!key) {
    throw new Error("Groq API Key is not set. Please click the Settings gear icon in the header to enter your custom API key.");
  }
  return new Groq({ apiKey: key });
}

function getSarvamClient(apiKey?: string): SarvamAIClient {
  const key = apiKey?.trim();
  if (!key) {
    throw new Error("Sarvam AI Subscription Key is not set. Please click the Settings gear icon in the header to enter your custom API key.");
  }
  return new SarvamAIClient({ apiSubscriptionKey: key });
}

const reasonSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  evidence: z.array(z.string()),
});

const phishingAnalysisSchema = z.object({
  isScam: z.boolean(),
  riskLevel: z.enum(["safe", "suspicious", "high_risk"]),
  confidence: z.number(),
  summary: z.string(),
  redFlags: z.array(z.string()),
  reasons: z.array(reasonSchema),
  recommendedAction: z.string(),
});

export type PhishingAnalysis = z.infer<typeof phishingAnalysisSchema>;

const SCHEMA_INSTRUCTIONS = `Return output strictly as valid JSON matching this exact schema:

{
  "isScam": boolean,
  "riskLevel": "safe" | "suspicious" | "high_risk",
  "confidence": number (0-100),
  "summary": string,
  "redFlags": string[],
  "reasons": [
    {
      "title": string,
      "explanation": string,
      "evidence": string[]
    }
  ],
  "recommendedAction": string
}

Return ONLY the raw JSON object. No markdown, no code fences, no extra text.`;

const BASE_INSTRUCTIONS = `You are a phishing and scam detection assistant specialized in chat-based social engineering analysis.

Your task:
- Analyze pasted conversation text, even if formatting is messy.
- Determine whether the content is likely safe, suspicious, or a phishing/scam attempt.
- Detect signals such as OTP requests, urgent payment demands, fake authority claims, account threats, impersonation, malicious links, emotional manipulation, or pressure tactics.
- Support multilingual input, including Indian regional languages where possible.
- Only cite evidence that appears exactly in the provided text.
- Do not invent lines, names, or events.`;

const TEXT_SYSTEM_PROMPT = `${BASE_INSTRUCTIONS}\n\n${SCHEMA_INSTRUCTIONS}`;

const IMAGE_SYSTEM_PROMPT = `${BASE_INSTRUCTIONS}
- You will receive a screenshot of a chat conversation. Read all visible messages carefully before analyzing.
- Extract the conversation text from the image first, then analyze it.

${SCHEMA_INSTRUCTIONS}`;

// Primary analysis helper
async function analyzeChat(chatText: string, groqApiKey?: string): Promise<PhishingAnalysis> {
  const groq = getGroqClient(groqApiKey);
  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      { role: "system", content: TEXT_SYSTEM_PROMPT },
      { role: "user", content: chatText },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]!.message.content || "{}";
  console.log("Raw AI response (text):", content);
  const raw = JSON.parse(content);
  return phishingAnalysisSchema.parse(raw);
}

// Multimodal image helper
async function analyzeChatImage(imageDataUrl: string, groqApiKey?: string): Promise<PhishingAnalysis> {
  const groq = getGroqClient(groqApiKey);
  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      { role: "system", content: IMAGE_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this chat screenshot for phishing or scam indicators." },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]!.message.content || "{}";
  console.log("Raw AI response (image):", content);
  const raw = JSON.parse(content);
  return phishingAnalysisSchema.parse(raw);
}

export interface Utterance {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  transcript: string;
  utterances: Utterance[];
  speakersDetected: number;
  languageCode: string | null;
}

// Audio transcription and speaker diarization helper
async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  fileName: string,
  sarvamApiKey?: string
): Promise<TranscriptionResult> {
  const sarvam = getSarvamClient(sarvamApiKey);

  const tmpDir = join(process.cwd(), ".tmp-audio");
  const outDir = join(process.cwd(), ".tmp-output");
  mkdirSync(tmpDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  const audioPath = join(tmpDir, fileName);
  writeFileSync(audioPath, Buffer.from(audioBuffer));

  try {
    const job = await sarvam.speechToTextJob.createJob({
      model: "saaras:v3",
      languageCode: "unknown",
      withDiarization: true,
      numSpeakers: 2,
    });

    await job.uploadFiles([audioPath]);
    await job.start();
    await job.waitUntilComplete();

    const fileResults = await job.getFileResults();
    if (fileResults.failed.length > 0) {
      throw new Error(`Transcription failed: ${fileResults.failed[0]?.error_message}`);
    }
    if (fileResults.successful.length === 0) {
      throw new Error("Transcription returned no results");
    }

    await job.downloadOutputs(outDir);

    const outputFiles = readdirSync(outDir).filter(f => f.endsWith(".json"));
    if (outputFiles.length === 0) {
      throw new Error("No transcription output files found");
    }

    const out = JSON.parse(readFileSync(join(outDir, outputFiles[0]!), "utf-8"));
    console.log("Sarvam raw output keys:", Object.keys(out));

    const transcript: string =
      out.transcript ?? out.text
      ?? out.results?.map((r: any) => r.transcript).join(" ")
      ?? JSON.stringify(out);

    let utterances: Utterance[] = [];

    // Sarvam diarized_transcript.entries format
    const entries = out.diarized_transcript?.entries;
    if (Array.isArray(entries) && entries.length > 0) {
      utterances = entries.map((e: any) => ({
        speaker: e.speaker_id ?? "0",
        start: e.start_time_seconds ?? 0,
        end: e.end_time_seconds ?? 0,
        text: e.transcript ?? "",
      }));
    }

    const speakerSet = new Set(utterances.map(u => u.speaker));
    const speakersDetected = out.num_speakers ?? out.speakers_detected ?? speakerSet.size;
    const languageCode = out.language_code ?? out.languageCode ?? out.language ?? null;

    return { transcript, utterances, speakersDetected, languageCode };
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
    rmSync(outDir, { recursive: true, force: true });
  }
}

export interface AudioAnalysisResult {
  transcript: string;
  utterances: Utterance[];
  speakersDetected: number;
  languageCode: string | null;
  analysis: PhishingAnalysis;
}

// ----------------------------------------------------
// Next.js React Server Actions
// ----------------------------------------------------

export async function analyzeChatAction(
  chatText: string,
  userKeys?: UserApiKeys
): Promise<{ success: boolean; data?: PhishingAnalysis; error?: string }> {
  try {
    if (!chatText || !chatText.trim()) {
      throw new Error("No chat text provided");
    }
    const result = await analyzeChat(chatText.trim(), userKeys?.groqApiKey);
    return { success: true, data: result };
  } catch (err: any) {
    console.error("analyzeChatAction error:", err);
    return { success: false, error: err.message || "Text analysis failed" };
  }
}

export async function analyzeImageAction(
  imageDataUrl: string,
  userKeys?: UserApiKeys
): Promise<{ success: boolean; data?: PhishingAnalysis; error?: string }> {
  try {
    if (!imageDataUrl) {
      throw new Error("No image data provided");
    }
    const result = await analyzeChatImage(imageDataUrl, userKeys?.groqApiKey);
    return { success: true, data: result };
  } catch (err: any) {
    console.error("analyzeImageAction error:", err);
    return { success: false, error: err.message || "Image analysis failed" };
  }
}

export async function analyzeAudioAction(
  formData: FormData,
  userKeys?: UserApiKeys
): Promise<{ success: boolean; data?: AudioAnalysisResult; error?: string }> {
  try {
    const file = formData.get("audio") as File | null;
    if (!file) {
      throw new Error("No audio file provided");
    }

    const buffer = await file.arrayBuffer();
    const stt = await transcribeAudio(buffer, file.name || "audio.mp3", userKeys?.sarvamApiKey);
    const analysis = await analyzeChat(stt.transcript, userKeys?.groqApiKey);

    return {
      success: true,
      data: {
        transcript: stt.transcript,
        utterances: stt.utterances,
        speakersDetected: stt.speakersDetected,
        languageCode: stt.languageCode,
        analysis,
      },
    };
  } catch (err: any) {
    console.error("analyzeAudioAction error:", err);
    return { success: false, error: err.message || "Audio analysis failed" };
  }
}
