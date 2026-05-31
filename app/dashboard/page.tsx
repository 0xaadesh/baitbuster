"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Shield, 
  Trash2, 
  Camera, 
  Mic, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  FileAudio,
  ChevronRight,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ModeToggle } from "@/components/mode-toggle";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  analyzeChatAction, 
  analyzeImageAction, 
  analyzeAudioAction,
  PhishingAnalysis,
  AudioAnalysisResult,
  Utterance
} from "../actions";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("text");
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // API Keys state
  const [groqApiKey, setGroqApiKey] = useState<string>("");
  const [sarvamApiKey, setSarvamApiKey] = useState<string>("");
  
  // Masked visibility states
  const [showGroqKey, setShowGroqKey] = useState<boolean>(false);
  const [showSarvamKey, setShowSarvamKey] = useState<boolean>(false);
  
  // Dialog open state
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  
  // Key status badge state
  const [keysLoaded, setKeysLoaded] = useState<boolean>(false);
  const [isKeysConfigured, setIsKeysConfigured] = useState<boolean>(false);

  // Load keys from localStorage on mount (hydration safe with backwards compatibility)
  useEffect(() => {
    const oldGroq = localStorage.getItem("cipherium-groq-key") || "";
    const oldSarvam = localStorage.getItem("cipherium-sarvam-key") || "";
    const savedGroq = localStorage.getItem("baitbuster-groq-key") || oldGroq;
    const savedSarvam = localStorage.getItem("baitbuster-sarvam-key") || oldSarvam;
    
    // Auto-migrate if found under old keys
    if (oldGroq) {
      localStorage.setItem("baitbuster-groq-key", oldGroq);
      localStorage.removeItem("cipherium-groq-key");
    }
    if (oldSarvam) {
      localStorage.setItem("baitbuster-sarvam-key", oldSarvam);
      localStorage.removeItem("cipherium-sarvam-key");
    }

    setGroqApiKey(savedGroq);
    setSarvamApiKey(savedSarvam);
    setKeysLoaded(true);
    setIsKeysConfigured(!!savedGroq.trim() && !!savedSarvam.trim());
  }, []);

  const handleSaveKeys = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    localStorage.setItem("baitbuster-groq-key", groqApiKey.trim());
    localStorage.setItem("baitbuster-sarvam-key", sarvamApiKey.trim());
    setIsKeysConfigured(!!groqApiKey.trim() && !!sarvamApiKey.trim());
    setIsDialogOpen(false);
  };

  const handleClearKeys = () => {
    setGroqApiKey("");
    setSarvamApiKey("");
    localStorage.removeItem("baitbuster-groq-key");
    localStorage.removeItem("baitbuster-sarvam-key");
    localStorage.removeItem("cipherium-groq-key");
    localStorage.removeItem("cipherium-sarvam-key");
    setIsKeysConfigured(false);
    setIsDialogOpen(false);
  };

  // Responsive viewport resize listener
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // Input states
  const [chatText, setChatText] = useState<string>("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  // UI states
  const [isDragOverImg, setIsDragOverImg] = useState<boolean>(false);
  const [isDragOverAudio, setIsDragOverAudio] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Result states
  const [analysisResult, setAnalysisResult] = useState<PhishingAnalysis | null>(null);
  const [transcriptResult, setTranscriptResult] = useState<{
    transcript: string;
    utterances: Utterance[];
    speakersDetected: number;
    languageCode: string | null;
  } | null>(null);

  // File input refs
  const imgInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Listen for browser capture extension events (multimodal messaging)
  useEffect(() => {
    const handleCaptureMessage = (e: MessageEvent) => {
      if (e.data?.type !== "cipherium-screenshot" && e.data?.type !== "baitbuster-screenshot") return;
      const dataUrl = e.data.imageDataUrl;
      if (!dataUrl) return;

      setActiveTab("image");
      setImageDataUrl(dataUrl);
      clearResults();
      setErrorMsg(null);
    };
    
    window.addEventListener("message", handleCaptureMessage);
    return () => window.removeEventListener("message", handleCaptureMessage);
  }, []);

  const clearResults = () => {
    setAnalysisResult(null);
    setTranscriptResult(null);
  };

  const clearAll = () => {
    setChatText("");
    setImageDataUrl(null);
    setAudioFile(null);
    clearResults();
    setErrorMsg(null);
    setStatusMsg(null);
    if (imgInputRef.current) imgInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  // --- Image Upload Flow ---
  const handleImageSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File too large. Maximum size is 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setErrorMsg(null);
      clearResults();
    };
    reader.readAsDataURL(file);
  };

  // --- Audio Upload Flow ---
  const handleAudioSelect = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg("File too large. Maximum size is 25 MB.");
      return;
    }
    setAudioFile(file);
    setErrorMsg(null);
    clearResults();
  };

  // Format bytes helper
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Format time helper (sec to MM:SS)
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // --- Main Analyze Executor ---
  const handleAnalyze = async () => {
    setErrorMsg(null);
    clearResults();
    
    if (activeTab === "text" && !chatText.trim()) return;
    if (activeTab === "image" && !imageDataUrl) {
      setErrorMsg("Please upload a screenshot first.");
      return;
    }
    if (activeTab === "audio" && !audioFile) {
      setErrorMsg("Please upload an audio file first.");
      return;
    }

    setIsLoading(true);

    const userKeys = {
      groqApiKey: groqApiKey.trim() || undefined,
      sarvamApiKey: sarvamApiKey.trim() || undefined,
    };

    try {
      if (activeTab === "text") {
        setStatusMsg("Analyzing chat text...");
        const res = await analyzeChatAction(chatText, userKeys);
        if (!res.success) throw new Error(res.error || "Analysis failed");
        setAnalysisResult(res.data!);
      } 
      else if (activeTab === "image") {
        setStatusMsg("Analyzing screenshot...");
        const res = await analyzeImageAction(imageDataUrl!, userKeys);
        if (!res.success) throw new Error(res.error || "Vision analysis failed");
        setAnalysisResult(res.data!);
      } 
      else if (activeTab === "audio") {
        setStatusMsg("Transcribing audio (this may take a moment)...");
        const formData = new FormData();
        formData.append("audio", audioFile!);
        
        const res = await analyzeAudioAction(formData, userKeys);
        if (!res.success) throw new Error(res.error || "Audio transcription/analysis failed");
        
        const stt = res.data!;
        setTranscriptResult({
          transcript: stt.transcript,
          utterances: stt.utterances,
          speakersDetected: stt.speakersDetected,
          languageCode: stt.languageCode,
        });
        setAnalysisResult(stt.analysis);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during inspection.");
    } finally {
      setIsLoading(false);
      setStatusMsg(null);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-background text-foreground flex flex-col relative pb-16 lg:pb-0">
      {/* Header */}
      <header className="border-b border-border py-5 bg-background/90 backdrop-blur sticky top-0 z-50 shrink-0">
        <div className="max-w-[1240px] mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <Shield className="w-5 h-5 text-primary transition-transform group-hover:scale-110" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              BaitBuster
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {keysLoaded && (
              <Badge 
                variant={isKeysConfigured ? "secondary" : "destructive"} 
                className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 border ${
                  isKeysConfigured 
                    ? "bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/15" 
                    : "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/15"
                }`}
              >
                {isKeysConfigured ? "API Keys Active" : "Keys Not Set"}
              </Badge>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-9 h-9 border-border bg-background hover:bg-muted text-foreground transition-colors rounded-lg cursor-pointer"
                  title="Configure API Keys"
                >
                  <Settings className="w-[18px] h-[18px]" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px] border border-border bg-popover text-foreground">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    Configure Developer API Keys
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Your keys are stored entirely in your local browser <strong className="text-foreground font-semibold">localStorage</strong> under origin protection, and are only transmitted ephemerally to the Server Action scopes.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSaveKeys} className="space-y-4 py-2">
                  {/* Groq Key Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Groq API Key (Llama 4 Scout)
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        type={showGroqKey ? "text" : "password"} 
                        placeholder="gsk_..."
                        value={groqApiKey}
                        onChange={(e) => setGroqApiKey(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg pl-3 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowGroqKey(!showGroqKey)}
                        className="absolute right-2.5 hover:text-foreground text-muted-foreground p-1 transition-colors"
                      >
                        {showGroqKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sarvam Key Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Sarvam AI Subscription Key
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        type={showSarvamKey ? "text" : "password"} 
                        placeholder="Enter Sarvam AI Subscription Key"
                        value={sarvamApiKey}
                        onChange={(e) => setSarvamApiKey(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg pl-3 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowSarvamKey(!showSarvamKey)}
                        className="absolute right-2.5 hover:text-foreground text-muted-foreground p-1 transition-colors"
                      >
                        {showSarvamKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <DialogFooter className="pt-4 border-t border-border/40 gap-2 flex flex-col sm:flex-row sm:justify-end">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={handleClearKeys}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-semibold px-4 py-2"
                    >
                      Clear Keys
                    </Button>
                    <Button 
                      type="submit"
                      className="text-xs font-bold px-4 py-2"
                    >
                      Save Configuration
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <ModeToggle />
            <span className="text-xs text-muted-foreground font-medium border border-border rounded-full px-3 py-1 bg-muted">
              Phishing Chat Detector
            </span>
          </div>
        </div>
      </header>

      {/* Content wrapper */}
      <main className="flex-grow lg:flex-1 lg:min-h-0 max-w-[1240px] mx-auto px-4 py-6 lg:py-6 w-full relative z-10 flex flex-col">
        <div className="mb-6 shrink-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">
            BaitBuster Analyzer
          </h1>
          <p className="text-xs text-muted-foreground">
            Paste chat text, drag screenshots, or record calls to evaluate phishing indicators instantly.
          </p>
        </div>

        {/* Resizable Split Panels Layout */}
        <ResizablePanelGroup 
          orientation={isMobile ? "vertical" : "horizontal"} 
          className="border border-border rounded-xl h-[750px] lg:h-full lg:flex-1 lg:min-h-0 bg-card"
        >
          {/* Left panel: Input Forms & Action buttons */}
          <ResizablePanel 
            defaultSize={isMobile ? 50 : 40} 
            minSize={isMobile ? 35 : 30}
            className="flex flex-col h-full"
          >
            {/* Scrollable inputs wrapper */}
            <ScrollArea className="flex-1 w-full">
              <div className="p-6">
                <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setErrorMsg(null); }} className="w-full">
                  <TabsList className="w-full grid grid-cols-3 mb-6">
                    <TabsTrigger value="text">
                      Paste Text
                    </TabsTrigger>
                    <TabsTrigger value="image">
                      Screenshot
                    </TabsTrigger>
                    <TabsTrigger value="audio">
                      Audio Call
                    </TabsTrigger>
                  </TabsList>

                  {/* Paste Text Tab */}
                  <TabsContent value="text" className="focus-visible:outline-none">
                    <Textarea 
                      placeholder="Paste chat message here...&#10;&#10;Example:&#10;Hi, this is your bank. Your card has been compromised. Please share your OTP immediately to secure it. If you don't respond in 10 minutes your account will be blocked."
                      value={chatText}
                      onChange={(e) => { setChatText(e.target.value); clearResults(); }}
                      className="h-[220px] lg:h-[280px] resize-none overflow-y-auto bg-muted border-border text-sm text-foreground placeholder:text-muted-foreground rounded-lg p-4 leading-relaxed"
                      disabled={isLoading}
                    />
                  </TabsContent>

                  {/* Screenshot Tab */}
                  <TabsContent value="image" className="focus-visible:outline-none">
                    {!imageDataUrl ? (
                      <div 
                        onClick={() => imgInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOverImg(true); }}
                        onDragLeave={() => setIsDragOverImg(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOverImg(false);
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith("image/")) handleImageSelect(file);
                        }}
                        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 ${
                          isDragOverImg 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/60 hover:bg-primary/2"
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={imgInputRef}
                          onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }}
                          accept="image/*"
                          className="hidden"
                        />
                        <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium">
                          <span className="text-primary font-bold">Click to upload</span> or drag & drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10 MB</p>
                      </div>
                    ) : (
                      <div className="relative border border-border rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={imageDataUrl} 
                          alt="Uploaded screenshot preview"
                          className="max-h-[300px] w-auto mx-auto object-contain block p-2"
                        />
                        <button 
                          onClick={() => { setImageDataUrl(null); clearResults(); if (imgInputRef.current) imgInputRef.current.value = ""; }}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-destructive text-white rounded-full flex items-center justify-center transition-colors"
                          title="Remove image"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Audio Tab */}
                  <TabsContent value="audio" className="focus-visible:outline-none">
                    {!audioFile ? (
                      <div 
                        onClick={() => audioInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOverAudio(true); }}
                        onDragLeave={() => setIsDragOverAudio(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOverAudio(false);
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith("audio/")) handleAudioSelect(file);
                        }}
                        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 ${
                          isDragOverAudio 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/60 hover:bg-primary/2"
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={audioInputRef}
                          onChange={(e) => { if (e.target.files?.[0]) handleAudioSelect(e.target.files[0]); }}
                          accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.webm"
                          className="hidden"
                        />
                        <Mic className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium">
                          <span className="text-primary font-bold">Click to upload</span> or drag & drop call audio
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A up to 25 MB</p>
                      </div>
                    ) : (
                      <div className="border border-border bg-muted rounded-lg p-4 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <FileAudio className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate text-foreground">{audioFile.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(audioFile.size)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setAudioFile(null); clearResults(); if (audioInputRef.current) audioInputRef.current.value = ""; }}
                          className="w-7 h-7 bg-black/50 hover:bg-destructive text-white rounded-full flex items-center justify-center transition-colors shrink-0"
                          title="Remove file"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>

            {/* Pinned Bottom Actions Panel */}
            <div className="p-6 border-t border-border bg-card shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  onClick={handleAnalyze}
                  disabled={
                    isLoading || 
                    (activeTab === "text" && !chatText.trim()) ||
                    (activeTab === "image" && !imageDataUrl) ||
                    (activeTab === "audio" && !audioFile)
                  }
                  className="font-bold text-xs py-2 px-5 rounded-md min-w-[120px] transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Chat"
                  )}
                </Button>
                
                <Button 
                  onClick={clearAll}
                  variant="outline" 
                  disabled={isLoading}
                >
                  Clear
                </Button>

                {/* Status Message spinner */}
                {isLoading && statusMsg && (
                  <div className="flex items-center gap-1.5 ml-1 text-xs text-primary font-medium animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>{statusMsg}</span>
                  </div>
                )}
              </div>

              {/* Error alerts */}
              {errorMsg && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription className="text-xs font-semibold leading-relaxed">
                    {errorMsg}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right panel: Inspection results or Awaiting Inspection placeholder */}
          <ResizablePanel 
            defaultSize={isMobile ? 50 : 60} 
            minSize={isMobile ? 35 : 45}
            className="flex flex-col h-full"
          >
            <ScrollArea className="h-full w-full">
              <div className="p-6">
            {analysisResult ? (
              <div className="space-y-6">
                
                {/* Speech-to-Text Diarized Transcript Card */}
                {transcriptResult && (
                  <Card className="border-border mb-6">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Speech-to-Text Diarization</CardTitle>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <div className="text-[11px] text-muted-foreground">
                          Speakers Detected: <strong className="text-foreground">{transcriptResult.speakersDetected}</strong>
                        </div>
                        {transcriptResult.languageCode && (
                          <div className="text-[11px] text-muted-foreground">
                            Language: <strong className="text-foreground">{transcriptResult.languageCode}</strong>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 max-h-[250px] overflow-y-auto">
                      {transcriptResult.utterances && transcriptResult.utterances.length > 0 ? (
                        <div className="space-y-4">
                          {transcriptResult.utterances.map((u, idx) => {
                            const speakerNum = parseInt(u.speaker.replace(/\D/g, "")) || idx;
                            const speakerColors = [
                              "bg-primary/10 border-primary/20 text-primary", 
                              "bg-muted border-border text-muted-foreground", 
                              "bg-destructive/10 border-destructive/20 text-destructive", 
                              "bg-background border-border text-foreground"
                            ];
                            const colorIndex = speakerNum % speakerColors.length;
                            
                            return (
                              <div key={idx} className="flex gap-3 items-start text-xs">
                                <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase shrink-0 mt-0.5 ${speakerColors[colorIndex]}`}>
                                  Speaker {speakerNum + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-foreground leading-relaxed font-medium">{u.text}</p>
                                  <p className="text-[9px] text-muted-foreground mt-1">{formatTime(u.start)} — {formatTime(u.end)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap font-mono text-xs text-muted-foreground leading-relaxed bg-muted border border-border rounded-lg p-4">
                          {transcriptResult.transcript}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Verdict Header */}
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-border/40 pb-4">
                      <div className="flex items-center gap-2.5">
                        <Badge variant={analysisResult.isScam ? "destructive" : "secondary"} className="font-extrabold uppercase text-[10px] tracking-wider px-2.5 py-0.5">
                          {analysisResult.riskLevel.replace("_", " ")}
                        </Badge>
                        
                        <span className={`text-base font-extrabold ${
                          analysisResult.isScam ? "text-destructive" : "text-primary"
                        }`}>
                          {analysisResult.isScam ? "Phishing Detected" : "Looks Safe"}
                        </span>
                      </div>

                      <span className="text-xs text-muted-foreground">
                        Confidence: <strong className="text-foreground">{analysisResult.confidence}%</strong>
                      </span>
                    </div>

                    {/* Confidence Bar */}
                    <div className="mb-4">
                      <Progress 
                        value={analysisResult.confidence} 
                        className="h-1.5 bg-muted" 
                        indicatorClassName={analysisResult.isScam ? "bg-destructive" : "bg-primary"}
                      />
                    </div>

                    <p className="text-xs text-foreground leading-relaxed">
                      {analysisResult.summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Red Flags Chips */}
                {analysisResult.redFlags && analysisResult.redFlags.length > 0 && (
                  <Card className="border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scam Indicators / Red Flags</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.redFlags.map((flag, idx) => (
                          <span key={idx} className="bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-semibold px-2.5 py-1 rounded">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Proof / Reasons */}
                {analysisResult.reasons && analysisResult.reasons.length > 0 && (
                  <Card className="border-border">
                    <CardHeader className="pb-3 border-b border-border/40 mb-4">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Detailed Scam Verification & Citations</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-4">
                      {analysisResult.reasons.map((r, idx) => (
                        <div key={idx} className="bg-muted border-l-2 border-primary rounded-r-lg p-4 text-xs">
                          <p className="font-bold text-foreground mb-1">{r.title}</p>
                          <p className="text-muted-foreground leading-relaxed mb-3">{r.explanation}</p>
                          
                          {r.evidence && r.evidence.length > 0 && (
                            <div>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Evidence from conversation</p>
                              <div className="flex flex-col gap-1.5">
                                {r.evidence.map((ev, evIdx) => (
                                  <span key={evIdx} className="bg-card border border-border text-foreground font-mono p-2 rounded block leading-normal">
                                    &quot;{ev}&quot;
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Recommended Preventive Actions */}
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recommended Action</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <Alert variant={analysisResult.isScam ? "destructive" : "default"} className="bg-muted border border-border rounded-lg">
                      <div className="flex items-start gap-2.5">
                        {analysisResult.isScam ? (
                          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        )}
                        <div>
                          <AlertTitle className="text-xs font-bold text-foreground mb-1">
                            {analysisResult.isScam ? "Immediate Preventive Measures Required" : "Standard Security Guidelines"}
                          </AlertTitle>
                          <AlertDescription className="text-xs text-muted-foreground leading-relaxed font-medium">
                            {analysisResult.recommendedAction}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  </CardContent>
                </Card>

              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center p-12 text-center text-muted-foreground min-h-[250px]">
                <Shield className="w-12 h-12 text-muted-foreground/30 mb-4 animate-pulse" />
                <p className="text-sm font-bold text-foreground mb-1">Awaiting Inspection</p>
                <p className="text-xs max-w-[280px]">
                  Paste a chat conversation, upload a screenshot, or supply call recordings on the left to generate the scam shield report.
                </p>
              </div>
            )}
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
