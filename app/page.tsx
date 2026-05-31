import Link from "next/link";
import { Shield, ArrowRight, MessageSquare, Image as ImageIcon, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border py-6 relative z-10">
        <div className="max-w-[1000px] mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <Shield className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              BaitBuster
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Button asChild variant="outline">
              <Link href="/dashboard">Launch Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-[1000px] mx-auto px-6 py-12 relative z-10">
        {/* Hero Section */}
        <section className="text-center mb-20 max-w-[750px] mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm" />
            AI Phishing Detector
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Stop Social Engineering & <br />
            <span className="text-muted-foreground">
              Scams in Real-Time
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-10 leading-relaxed">
            Protect yourself with standard-setting AI designed to expose OTP demands, bank impersonations, and pressure tactics across multiple input formats and regional Indian languages.
          </p>
          <div className="flex gap-4 justify-center items-center flex-wrap">
            <Button asChild size="lg" className="hover:translate-y-[-2px] transition-all">
              <Link href="/dashboard" className="gap-2">
                Analyze Chat Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="hover:translate-y-[-2px] transition-all">
              <a href="#features">Explore Features</a>
            </Button>
          </div>
        </section>

        {/* 3-Column Inspection Grid */}
        <section className="grid md:grid-cols-3 gap-6 mb-20" id="features">
          {/* Card 1 */}
          <Card className="hover:border-primary hover:translate-y-[-4px] transition-all duration-300">
            <CardHeader>
              <div className="w-11 h-11 bg-muted border border-border rounded-lg flex items-center justify-center text-primary mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg font-bold">Text Inspector</CardTitle>
              <CardDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
                Paste any message or conversation log. The detector will verify urgency triggers, false authority claims, and emotional manipulation instantly.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Card 2 */}
          <Card className="hover:border-primary hover:translate-y-[-4px] transition-all duration-300">
            <CardHeader>
              <div className="w-11 h-11 bg-muted border border-border rounded-lg flex items-center justify-center text-primary mb-4">
                <ImageIcon className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg font-bold">Screenshot Scanner</CardTitle>
              <CardDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
                Upload active chat screenshots. Groq-powered vision AI reads the messages directly from the image and pinpoints deceitful segments.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Card 3 */}
          <Card className="hover:border-primary hover:translate-y-[-4px] transition-all duration-300">
            <CardHeader>
              <div className="w-11 h-11 bg-muted border border-border rounded-lg flex items-center justify-center text-primary mb-4">
                <Mic className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg font-bold">Voice Call Analyzer</CardTitle>
              <CardDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
                Upload audio call recordings. Integrated Sarvam AI provides speech-to-text with diarization, identifying risk parameters speakers communicate.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Visual Dashboard Preview / Output Card Mockup */}
        <section className="bg-card border border-border rounded-xl p-8 mb-20">
          <div className="mb-8">
            <h3 className="text-xl font-bold">Visual Indicators & Proof</h3>
            <p className="text-muted-foreground text-sm mt-1">See exactly how phishing factors are extracted and graded visually</p>
          </div>

          {/* Inner Mockup UI */}
          <div className="bg-muted border border-border rounded-lg p-5">
            <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="font-bold uppercase text-[10px]">
                  High Risk
                </Badge>
                <span className="text-sm font-semibold text-destructive">Phishing Detected</span>
              </div>
              <span className="text-muted-foreground text-xs">
                Confidence: <strong className="text-foreground">92%</strong>
              </span>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm text-muted-foreground mb-4 leading-relaxed">
              &quot;Main bank se bol raha hu, aapka bank card freeze kar diya hai.{" "}
              <span className="bg-destructive/10 border-b border-destructive text-destructive px-1 rounded-sm font-semibold">
                Usko reactivate karne ke liye OTP batao immediately
              </span>{" "}
              nahi to balance safe nahi rahega.&quot;
            </div>

            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Scam Indicators Found</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-medium px-2 py-1 rounded">
                  Fake Bank Authority
                </span>
                <span className="bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-medium px-2 py-1 rounded">
                  Urgency & Threats
                </span>
                <span className="bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-medium px-2 py-1 rounded">
                  Immediate OTP Request
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6 border-t border-border pt-8 mt-10">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">22+</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Languages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">97%</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">&lt; 2s</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Response Time</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 relative z-10 text-muted-foreground text-sm">
        <div className="max-w-[1000px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <Shield className="w-4 h-4" />
            <span>BaitBuster</span>
          </Link>
          <p>&copy; {new Date().getFullYear()} BaitBuster. Safeguarding human communication.</p>
          <div className="flex gap-6">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
