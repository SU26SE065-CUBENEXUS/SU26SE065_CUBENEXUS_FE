"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Crown,
  LoaderCircle,
  Trophy,
  Users,
  Timer,
  Video,
  QrCode,
  RefreshCw,
  Play,
  Volume2,
  Award,
  Zap,
  CheckCircle,
  AlertCircle,
  Tv,
  Shield,
} from "lucide-react";
import {
  initialCubeColors,
  generateWcaScramble,
  renderRubikFace,
  formatTime,
} from "./arena-utils";

type MatchPhase =
  | "lobby"
  | "queue"
  | "vs"
  | "camera"
  | "timer"
  | "scramble"
  | "verify"
  | "inspect"
  | "solve"
  | "result";

interface Match1v1ViewProps {
  selectedMode: "1v1" | "history" | "practice";
  onSelectMode: (mode: "1v1" | "history" | "practice") => void;
}

export function Match1v1View({ selectedMode, onSelectMode }: Match1v1ViewProps) {
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("lobby");

  // Timer & setup state for 1v1
  const [queueTimer, setQueueTimer] = useState<number>(0);
  const [vsCountdown, setVsCountdown] = useState<number>(3);
  const [scrambleCountdown, setScrambleCountdown] = useState<number>(60);
  const [inspectionCountdown, setInspectionCountdown] = useState<number>(15);
  const [timerValue, setTimerValue] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [webcamActive, setWebcamActive] = useState<boolean>(true);

  // User vs Opponent profile info
  const playerRating = 2645;
  const opponentTime = 11.024; // Static opponent time in seconds
  const [userFinalTime, setUserFinalTime] = useState<number | null>(null);

  // Scramble formula & Cube flat layout state for 1v1
  const [scrambleText, setScrambleText] = useState<string>("");
  const [cubeColors, setCubeColors] = useState(initialCubeColors);

  // Generate WCA scramble & layout colors for 1v1
  const handleGenerateScramble = () => {
    setScrambleText(generateWcaScramble());
    const colorOptions = ["W", "O", "G", "R", "B", "Y"];
    const scrambleFace = () => Array.from({ length: 9 }, () => colorOptions[Math.floor(Math.random() * 6)]);
    setCubeColors({
      U: scrambleFace(),
      L: scrambleFace(),
      F: scrambleFace(),
      R: scrambleFace(),
      B: scrambleFace(),
      D: scrambleFace(),
    });
  };

  // Initialize scrambles
  useEffect(() => {
    handleGenerateScramble();
  }, []);

  // Keyboard Event Listeners for Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();

        if (matchPhase === "inspect") {
          setMatchPhase("solve");
          setTimerValue(0);
          setTimerActive(true);
        } else if (matchPhase === "solve" && timerActive) {
          setTimerActive(false);
          const finalSec = timerValue / 1000;
          setUserFinalTime(finalSec);
          setTimeout(() => {
            setMatchPhase("result");
          }, 1500);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [matchPhase, timerActive, timerValue]);

  // Active 1v1 timer frame updater
  useEffect(() => {
    if (!timerActive) return;
    const startTime = Date.now() - timerValue;
    let frameId: number;

    const tick = () => {
      setTimerValue(Date.now() - startTime);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [timerActive]);

  // Queue Screen Auto-logs & Auto-transition
  useEffect(() => {
    if (matchPhase !== "queue") {
      setQueueTimer(0);
      setTerminalLogs([]);
      return;
    }

    const interval = setInterval(() => {
      setQueueTimer((t) => t + 1);
    }, 1000);

    const logs = [
      "CONNECTING to matchmaking server node #VN-SOUTH-2.",
      "AUTHORIZING cryptographic credentials with platform database.",
      "ESTABLISHING low-latency sync tunnel (active ping: 12ms).",
      "FETCHING matchmaking parameters for ELO rating tier [2,645].",
      "SEARCHING for active opponents in queue range (2595 - 2695).",
      "Found potential match! Checking peer connection...",
      "Match verified. Redirecting to battleground...",
    ];

    setTerminalLogs([`> ${logs[0]}`]);

    const timeouts = logs.slice(1).map((log, index) => {
      return setTimeout(() => {
        setTerminalLogs((prev) => [...prev, `> ${log}`]);
      }, (index + 1) * 750);
    });

    const transition = setTimeout(() => {
      setMatchPhase("vs");
    }, 5500);

    return () => {
      clearInterval(interval);
      timeouts.forEach((t) => clearTimeout(t));
      clearTimeout(transition);
    };
  }, [matchPhase]);

  // VS screen countdown logic
  useEffect(() => {
    if (matchPhase !== "vs") {
      setVsCountdown(3);
      return;
    }

    const interval = setInterval(() => {
      setVsCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setMatchPhase("camera");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [matchPhase]);

  // Scramble screen countdown logic
  useEffect(() => {
    if (matchPhase !== "scramble") {
      setScrambleCountdown(60);
      return;
    }

    const interval = setInterval(() => {
      setScrambleCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [matchPhase]);

  // Inspection screen countdown logic
  useEffect(() => {
    if (matchPhase !== "inspect") {
      setInspectionCountdown(15);
      return;
    }

    const interval = setInterval(() => {
      setInspectionCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setMatchPhase("solve");
          setTimerValue(0);
          setTimerActive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [matchPhase]);

  // Local Webcam stream hook
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const verifyLocalVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const needWebcam = matchPhase === "camera" || matchPhase === "verify";
    if (!needWebcam || !webcamActive) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240 } })
      .then((s) => {
        setStream(s);
        setTimeout(() => {
          if (matchPhase === "camera" && localVideoRef.current) {
            localVideoRef.current.srcObject = s;
          } else if (matchPhase === "verify" && verifyLocalVideoRef.current) {
            verifyLocalVideoRef.current.srcObject = s;
          }
        }, 100);
      })
      .catch((err) => {
        console.warn("Could not access webcam:", err);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [matchPhase, webcamActive]);

  // Modes list for left column sidebar
  const modes = [
    {
      id: "1v1",
      name: "1v1 Match",
      icon: Users,
      description: "Challenge a cuber with matching Elo rating",
    },
    {
      id: "history",
      name: "Match History",
      icon: Trophy,
      description: "Review your completed matches",
    },
    {
      id: "practice",
      name: "Practice Mode",
      icon: Timer,
      description: "Personal practice or create a custom room",
    },
  ];

  // Render sub-views depending on phase

  const renderLobbyView = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Card className="border border-border bg-card p-8 rounded-3xl shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-3 py-1 text-xs font-semibold text-[#eab308]">
                Season 3 Active
              </span>
              <span className="text-muted-foreground text-xs font-medium">• 2,847 Online</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl uppercase">
              SPEEDCUBING 1V1 ARENA
            </h2>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              Challenge cubers worldwide in real-time. Matches feature camera cheat-prevention and real-time mobile Stackmat Timer synchronization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center w-12 h-12 rounded-xl border border-border bg-muted/20 text-muted-foreground hover:text-foreground transition">
              <Volume2 className="h-5 w-5" />
            </button>
            <Button
              onClick={() => {
                setMatchPhase("queue");
                setUserFinalTime(null);
              }}
              className="bg-[#eab308] hover:bg-[#ca8a04] text-white font-black px-8 py-6 text-base tracking-[0.05em] shadow-lg shadow-yellow-500/10 rounded-xl transition-all flex items-center gap-2 border-none"
            >
              START MATCHMAKING
              <Play className="h-4 w-4 fill-current text-white" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-[#eab308]" />
              Game Modes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {modes.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <Card
                    key={mode.id}
                    onClick={() => {
                      onSelectMode(mode.id as "1v1" | "history" | "practice");
                      if (mode.id !== "1v1") {
                        setMatchPhase("lobby");
                      }
                    }}
                    className={`cursor-pointer border-2 p-6 transition-all rounded-2xl ${
                      selectedMode === mode.id
                        ? "border-[#eab308] bg-[#eab308]/5 shadow-md shadow-[#eab308]/5"
                        : "border-border bg-card hover:border-border/80"
                    }`}
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eab308]/10 border border-[#eab308]/20">
                      <IconComponent className="h-5 w-5 text-[#eab308]" />
                    </div>
                    <h4 className="font-bold text-foreground text-sm">{mode.name}</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-snug">{mode.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#eab308]" />
            Ranked Profile
          </h3>
          <Card className="border border-border bg-card p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#eab308] bg-[#eab308]/10 text-xl font-black text-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                VN
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-foreground text-base">CuberNexus_Pro</h4>
                </div>
                <p className="text-xs text-muted-foreground font-medium">Rank #1,284 Global</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  ELO RATING
                </p>
                <p className="text-2xl font-black text-[#eab308] mt-1">{playerRating}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  WIN RATE
                </p>
                <p className="text-2xl font-black text-foreground mt-1">82.6%</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Win / Loss</span>
                <span className="text-foreground font-bold">247W / 52L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Avg Ao5 (Best)</span>
                <span className="text-foreground font-bold">12.5s (8.2s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Win Streak</span>
                <span className="text-[#eab308] font-bold">
                  🔥 12 Matches
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderQueueView = () => (
    <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center h-[280px] w-[280px]">
        <div className="absolute h-[260px] w-[260px] rounded-full border border-[#eab308]/15" />
        <div className="absolute h-[200px] w-[200px] rounded-full border border-[#eab308]/25" />
        <div className="absolute h-[140px] w-[140px] rounded-full border border-[#eab308]/35" />
        <div className="absolute h-[220px] w-[220px] rounded-full border-2 border-[#eab308]/40 animate-ping opacity-25" />
        <div className="absolute h-[200px] w-[200px] rounded-full bg-gradient-to-tr from-transparent via-transparent to-[#eab308]/10 border border-[#eab308]/30 animate-radar" />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card border border-[#eab308]/60 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
          <LoaderCircle className="h-8 w-8 animate-spin text-[#eab308]" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-[0.1em] text-foreground uppercase">
          MATCHMAKING...
        </h2>
        <p className="text-muted-foreground text-sm font-medium">
          Queue Time: <span className="text-[#eab308] font-bold">{queueTimer}s</span>
        </p>
        <span className="inline-flex rounded-full border border-[#eab308]/20 bg-[#eab308]/5 text-[#eab308] px-4 py-1.5 text-xs font-bold mt-2">
          ELO Range: ±75 ({playerRating - 75} - {playerRating + 75})
        </span>
      </div>

      <div className="w-full max-w-xl border border-zinc-800 bg-zinc-950 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
        <div className="flex justify-between items-center bg-zinc-900 px-4 py-2.5 border-b border-zinc-850 text-xs font-bold text-zinc-400 uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] inline-block" />
            Connection Terminal Logs
          </span>
          <span className="text-[#eab308] text-[10px]">Node: AP-SOUTH-1</span>
        </div>
        <div className="p-4 font-mono text-[11px] text-[#eab308]/80 space-y-1.5 h-40 overflow-y-auto leading-relaxed">
          {terminalLogs.map((log, index) => (
            <div key={index} className="fade-in animate-in duration-200">
              {log}
            </div>
          ))}
          <div className="w-1.5 h-3 bg-[#eab308] inline-block animate-pulse ml-0.5" />
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => setMatchPhase("lobby")}
        className="border-border hover:border-red-500/30 text-muted-foreground hover:text-red-600 px-8 py-5 rounded-xl transition bg-transparent"
      >
        CANCEL MATCHMAKING
      </Button>
    </div>
  );

  const renderVSView = () => (
    <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-4xl">
        {/* Left Player Card */}
        <Card className="border border-[#eab308]/40 bg-card p-6 rounded-2xl w-full max-w-sm flex flex-col items-center text-center space-y-4 shadow-md">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl border border-[#eab308] bg-[#eab308]/10 text-2xl font-black text-[#eab308]">
            VN
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground">CuberNexus_Pro (You)</h3>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              ELO <span className="text-[#eab308]">{playerRating}</span> · 🇻🇳 Vietnam
            </p>
          </div>
          <div className="w-full bg-muted/40 rounded-xl p-3 text-xs space-y-2 border border-border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Single PB</span>
              <span className="text-foreground font-bold">8.2s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average time</span>
              <span className="text-foreground font-bold">12.5s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Win rate</span>
              <span className="text-foreground font-bold">82.6%</span>
            </div>
          </div>
        </Card>

        {/* Center Countdown Circle */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="relative flex items-center justify-center h-28 w-28">
            <div className="absolute inset-0 rounded-full border-2 border-[#eab308]/15" />
            <div className="absolute inset-0 rounded-full border-2 border-[#eab308] border-t-transparent animate-spin duration-1000" />
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                MATCH
              </span>
              <span className="text-2xl font-black text-[#eab308] leading-none">
                {vsCountdown > 0 ? `${vsCountdown}s` : "VS"}
              </span>
            </div>
          </div>
          <span className="text-xs font-black tracking-[0.2em] text-[#eab308] uppercase mt-4">
            MATCHED
          </span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#eab308]/50 to-transparent mt-2" />
        </div>

        {/* Right Player Card */}
        <Card className="border border-border bg-card p-6 rounded-2xl w-full max-w-sm flex flex-col items-center text-center space-y-4 shadow-md">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl border border-border bg-muted text-2xl font-black text-muted-foreground">
            JP
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground">SpeedMaster_JP</h3>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              ELO <span className="text-foreground">2850</span> · 🇯🇵 Japan
            </p>
          </div>
          <div className="w-full bg-muted/40 rounded-xl p-3 text-xs space-y-2 border border-border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Single PB</span>
              <span className="text-foreground font-bold">9.10s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average time</span>
              <span className="text-foreground font-bold">10.98s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Win rate</span>
              <span className="text-foreground font-bold">78.4%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderCameraView = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Video className="h-5 w-5 text-[#eab308]" />
            STEP 1: WEBCAM VERIFICATION / HAND CAM ANGLE
          </h2>
          <p className="text-xs text-muted-foreground">
            Adjust your camera so it captures both your hands and the Rubik's cube area on the desk.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setWebcamActive(!webcamActive)}
          className="border-border hover:border-[#eab308]/30 text-muted-foreground hover:text-[#eab308] text-xs px-4 py-2 h-auto"
        >
          {webcamActive ? "Reset Camera" : "Turn On Camera"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Cam Box */}
        <Card className="border border-border bg-card p-3 rounded-2xl flex flex-col h-64 overflow-hidden relative group shadow-sm">
          <div className="flex-1 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-900 relative flex items-center justify-center">
            {stream && webcamActive ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.06),transparent_60%)]" />
                <span className="text-3xl mb-3">⚔️</span>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#eab308]">
                  MOCK HAND & CUBE SCANNER ACTIVE
                </p>
                <div className="absolute top-0 bottom-0 left-0 right-0 border border-dashed border-[#eab308]/20 m-6 rounded-lg pointer-events-none" />
                <div className="absolute left-0 right-0 h-[2px] bg-[#eab308] shadow-[0_0_8px_#eab308] animate-laser" />
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
            <span className="flex items-center gap-1.5 text-[#eab308]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#eab308] animate-pulse" />
              You (Camera)
            </span>
          </div>
        </Card>

        {/* Peer Cam Box */}
        <Card className="border border-border bg-card p-3 rounded-2xl flex flex-col h-64 overflow-hidden relative group shadow-sm">
          <div className="flex-1 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-900 relative flex items-center justify-center">
            <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.06),transparent_60%)]" />
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#eab308]/10 border border-[#eab308]/20 text-[#eab308] text-lg font-black mb-3">
                ✓
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#eab308]">
                STREAMING PEER PACKETS: READY
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
            <span className="flex items-center gap-1.5 text-[#eab308]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#eab308] animate-pulse" />
              SpeedMaster_JP (Camera)
            </span>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-bold text-muted-foreground">
          <span className="rounded-full border border-[#eab308]/20 bg-[#eab308]/5 text-[#eab308] px-3.5 py-1.5 flex items-center gap-1">
            ✓ FPS &gt; 30 (Stable)
          </span>
          <span className="rounded-full border border-[#eab308]/20 bg-[#eab308]/5 text-[#eab308] px-3.5 py-1.5 flex items-center gap-1">
            ✓ Hand Angle Detected
          </span>
          <span className="rounded-full border border-[#eab308]/20 bg-[#eab308]/5 text-[#eab308] px-3.5 py-1.5 flex items-center gap-1">
            ✓ P2P Latency: 18ms
          </span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setMatchPhase("lobby")}
            className="border-border hover:border-red-500/20 text-muted-foreground hover:text-red-600 px-6 py-5 rounded-xl transition flex-1 sm:flex-none bg-transparent"
          >
            Leave Match / Forfeit
          </Button>
          <Button
            onClick={() => setMatchPhase("timer")}
            className="bg-[#eab308] hover:bg-[#ca8a04] text-white font-black px-6 py-5 rounded-xl tracking-[0.05em] shadow-lg shadow-yellow-500/10 flex-1 sm:flex-none border-none flex items-center gap-1 font-sans"
          >
            CONFIRM READY
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTimerView = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1 text-center md:text-left">
        <h2 className="text-xl font-bold text-foreground flex items-center justify-center md:justify-start gap-2">
          <QrCode className="h-5 w-5 text-[#eab308]" />
          STEP 2: CONNECT MOBILE SMART TIMER
        </h2>
        <p className="text-xs text-muted-foreground">
          Open the **CubeNexus** mobile app, choose Scan QR Mode, and focus your camera on the code below to sync.
        </p>
      </div>

      <Card className="border border-border bg-card p-6 md:p-8 rounded-2xl">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative border border-[#eab308]/30 bg-zinc-950 p-6 rounded-2xl flex flex-col items-center justify-center w-64 h-64 shadow-xl">
            <div className="w-44 h-44 border border-zinc-850 rounded-xl bg-white flex flex-col items-center justify-center p-3 relative group">
              <div className="absolute left-3 right-3 h-[2px] bg-[#eab308] shadow-[0_0_8px_#eab308] animate-laser" />
              <div className="text-[10px] font-bold font-mono text-zinc-700 text-center uppercase tracking-tighter select-none">
                [ Mock QR Code: ]
                <span className="block text-xs font-black text-zinc-950 mt-3 border-2 border-zinc-900 border-dashed p-2 bg-zinc-50 rounded">
                  CUBENEXUS_SYNC_9941
                </span>
              </div>
            </div>
            <div className="absolute top-0 bottom-0 left-0 right-0 border-2 border-dashed border-[#eab308]/20 rounded-2xl pointer-events-none m-2" />
          </div>

          <div className="flex-1 space-y-4 text-left w-full">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Sync Instructions:
            </h3>
            <ol className="list-decimal pl-4 text-xs text-muted-foreground space-y-2.5 font-medium leading-relaxed">
              <li>Your smartphone will instantly transform into a highly responsive **Stackmat Smart Timer**.</li>
              <li>Place both hands on your phone screen to trigger the measurement timer, and release them to start solving.</li>
              <li>Solving time results will automatically synchronize with your PC/browser in real-time with latency &lt; 200ms.</li>
            </ol>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#eab308] pt-1">
              <span className="h-2 w-2 rounded-full bg-[#eab308] animate-pulse inline-block mr-1" />
              Waiting for mobile device to sync...
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => setMatchPhase("lobby")}
          className="border-border text-muted-foreground hover:text-red-600 px-6 py-5 rounded-xl transition bg-transparent"
        >
          Cancel / Leave
        </Button>
        <Button
          onClick={() => setMatchPhase("scramble")}
          className="bg-[#eab308] hover:bg-[#ca8a04] text-white font-black px-6 py-5 rounded-xl tracking-[0.05em] shadow-lg shadow-yellow-500/10 border-none flex items-center gap-1 animate-pulse font-sans"
        >
          Simulate connection success
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderScrambleView = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-[#eab308]" />
            STEP 3: SCRAMBLE CUBE BY WCA FORMULA
          </h2>
          <p className="text-xs text-muted-foreground">
            Scramble your Rubik's cube under the opponent's camera view following the exact WCA scramble guide below.
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
          Remaining:
          <span className="rounded bg-[#eab308]/10 border border-[#eab308]/20 px-2 py-1 text-[#eab308] font-bold text-sm min-w-[40px] text-center">
            {scrambleCountdown}s
          </span>
        </div>
      </div>

      <Card className="border border-border bg-muted/40 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[100px] shadow-sm">
        <span className="absolute top-3 left-3 rounded bg-[#eab308]/10 border border-[#eab308]/20 text-[#eab308] font-black px-2 py-0.5 text-[9px] uppercase tracking-wider leading-none">
          WCA Official Scramble Config
        </span>
        <p className="text-xl md:text-2xl font-mono text-foreground font-black tracking-wide leading-relaxed mt-4 max-w-3xl">
          {scrambleText}
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-border bg-card p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Tv className="h-4 w-4 text-[#eab308]" />
            2D FLAT LAYOUT (NET LAYOUT)
          </h3>
          <div className="flex flex-col items-center justify-center py-4 scale-95 md:scale-100">
            <div className="space-y-[4px]">
              {/* Row 1: U face */}
              <div className="flex justify-center">
                <div className="w-[46px] h-[46px]" />
                {renderRubikFace(cubeColors.U)}
                <div className="w-[46px] h-[46px]" />
                <div className="w-[46px] h-[46px]" />
              </div>
              {/* Row 2: L, F, R, B faces */}
              <div className="flex justify-center gap-[4px]">
                {renderRubikFace(cubeColors.L)}
                {renderRubikFace(cubeColors.F)}
                {renderRubikFace(cubeColors.R)}
                {renderRubikFace(cubeColors.B)}
              </div>
              {/* Row 3: D face */}
              <div className="flex justify-center">
                <div className="w-[46px] h-[46px]" />
                {renderRubikFace(cubeColors.D)}
                <div className="w-[46px] h-[46px]" />
                <div className="w-[46px] h-[46px]" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-border bg-card p-6 rounded-2xl flex flex-col justify-between space-y-5 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
              Scramble Guide
            </h3>
            <ol className="list-decimal pl-4 text-xs text-muted-foreground space-y-2.5 font-medium leading-relaxed">
              <li>Hold the cube with Green facing **Front** and White facing **Up**.</li>
              <li>Rotate layers exactly as WCA notation demands. Perform turns precisely.</li>
              <li>Inspect your cube faces to ensure the physical color blocks match the 2D Net layout.</li>
            </ol>
          </div>
          <Button
            variant="outline"
            onClick={handleGenerateScramble}
            className="border-border text-muted-foreground hover:text-foreground flex items-center gap-1.5 justify-center py-5 rounded-xl w-full bg-muted/40"
          >
            <RefreshCw className="h-4 w-4" />
            Generate New Scramble
          </Button>
        </Card>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => setMatchPhase("lobby")}
          className="border-border text-muted-foreground hover:text-red-600 px-6 py-5 rounded-xl transition bg-transparent"
        >
          Cancel / Leave
        </Button>
        <Button
          onClick={() => setMatchPhase("verify")}
          className="bg-[#eab308] hover:bg-[#ca8a04] text-white font-black px-6 py-5 rounded-xl tracking-[0.05em] shadow-lg shadow-yellow-500/10 border-none flex items-center gap-1 font-sans"
        >
          Next Step
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderVerifyView = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#eab308]" />
          STEP 4: CROSS SCRAMBLE VERIFICATION
        </h2>
        <p className="text-xs text-muted-foreground">
          Show your scrambled Rubik's cube faces to your opponent's camera feed to authorize match validity, while cross-checking theirs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Verify Feed */}
        <Card className="border border-border bg-card p-3 rounded-2xl flex flex-col h-64 overflow-hidden relative shadow-sm">
          <div className="flex-1 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-900 relative flex items-center justify-center">
            {stream && webcamActive ? (
              <video
                ref={verifyLocalVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full">
                <span className="text-3xl mb-3">⚔️</span>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#eab308]">
                  WEBCAM STREAM ACTIVE
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-bold px-1">
            <span className="text-muted-foreground">YOUR SCRAMBLE CAM</span>
            <span className="rounded bg-muted border border-border px-3 py-1 text-yellow-600 dark:text-yellow-500 text-[10px] animate-pulse">
              WAITING FOR PEER APPROVAL...
            </span>
          </div>
        </Card>

        {/* Peer Verify Feed */}
        <Card className="border border-border bg-card p-3 rounded-2xl flex flex-col h-64 overflow-hidden relative shadow-sm">
          <div className="flex-1 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-900 relative flex items-center justify-center">
            <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full">
              <span className="text-3xl mb-3">👤</span>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#eab308]">
                ACTIVE PEER CAMERA
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-bold px-1">
            <span className="text-muted-foreground">OPPONENT SCRAMBLE CAM</span>
            <Button
              onClick={() => setMatchPhase("inspect")}
              className="bg-[#eab308] hover:bg-[#ca8a04] text-white text-[10px] font-black px-4 py-2 h-auto tracking-wider shadow shadow-yellow-500/10 border-none rounded-lg font-sans"
            >
              Confirm Valid Scramble ✓
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => setMatchPhase("lobby")}
          className="border-border text-muted-foreground hover:text-red-600 px-6 py-5 rounded-xl transition bg-transparent"
        >
          Cancel / Leave
        </Button>
        <span className="text-muted-foreground font-bold text-xs uppercase tracking-wider hidden sm:inline-block">
          TAP THE BOTTOM-RIGHT BUTTON TO PROGRESS
        </span>
      </div>
    </div>
  );

  const renderInspectView = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <span className="inline-flex rounded-full border border-[#eab308]/30 bg-[#eab308]/5 text-[#eab308] px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
          INSPECTION PHASE
        </span>
        <p className="text-muted-foreground text-sm font-medium">
          Use 15 seconds to inspect the Rubik's cube before solving.
        </p>
      </div>

      <div className="relative flex items-center justify-center h-48 w-48">
        <div className="absolute inset-0 rounded-full border-4 border-[#eab308] shadow-[0_0_25px_rgba(234,179,8,0.15)]" />
        <div className="flex flex-col items-center justify-center">
          <span className="text-6xl font-black text-[#eab308] leading-none">
            {inspectionCountdown}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 leading-none">
            SECONDS LEFT
          </span>
        </div>
      </div>

      <div className="w-full max-w-md border border-border bg-card p-6 rounded-2xl text-center space-y-4 shadow-sm">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          ⌨️ HOW TO ACTIVATE SOLVING:
        </p>
        <button
          onClick={() => {
            setMatchPhase("solve");
            setTimerValue(0);
            setTimerActive(true);
          }}
          className="w-full bg-muted border border-border text-foreground text-sm font-bold py-4 px-6 rounded-xl hover:bg-muted/80 shadow-sm transition cursor-pointer tracking-wider font-mono uppercase"
        >
          [ PRESS SPACEBAR / CLICK HERE ]
        </button>
        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto">
          Press and hold Spacebar (or click the button above) then release to start solving.
        </p>
      </div>
    </div>
  );

  const renderSolveView = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <span className="flex items-center gap-2 text-xs font-black text-[#eab308] uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-[#eab308] animate-pulse" />
            1V1 RANKED ARENA MATCH BATTLE
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            USE KEY <span className="bg-muted px-2 py-0.5 rounded text-foreground font-mono">SPACEBAR</span> TO STOP TIMER
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Your Timer Box */}
          <Card
            onClick={() => {
              if (timerActive) {
                setTimerActive(false);
                const finalSec = timerValue / 1000;
                setUserFinalTime(finalSec);
                setTimeout(() => {
                  setMatchPhase("result");
                }, 1500);
              }
            }}
            className={`border bg-card p-8 rounded-2xl flex flex-col justify-center items-center h-80 text-center space-y-6 select-none cursor-pointer transition-all ${
              timerActive
                ? "border-[#eab308]/50 shadow-[0_0_20px_rgba(234,179,8,0.05)]"
                : "border-border"
            }`}
          >
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                BẠN (TIMER)
              </p>
              <h3 className="text-5xl md:text-6xl font-mono font-black text-foreground tracking-wide">
                {formatTime(timerValue)}
              </h3>
            </div>

            {timerActive ? (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="border-border text-muted-foreground px-6 py-2 rounded-lg bg-muted pointer-events-none"
                >
                  CLICK TO STOP TIME
                </Button>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Tập trung giải! Click vào ô này hoặc bấm phím cách (Space) để dừng bộ bấm.
                </p>
              </div>
            ) : (
              <span className="rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-4 py-1.5 text-xs text-[#eab308] font-bold uppercase tracking-wider animate-pulse">
                COMPLETED
              </span>
            )}
          </Card>

          {/* Opponent Timer Box */}
          <Card className="border border-border bg-card p-8 rounded-2xl flex flex-col justify-center items-center h-80 text-center space-y-6 shadow-sm">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                SpeedMaster_JP
              </p>
              <h3 className="text-5xl md:text-6xl font-mono font-black text-[#eab308] tracking-wide">
                {opponentTime.toFixed(3)}s
              </h3>
            </div>

            <div className="space-y-3">
              <span className="inline-flex rounded-full bg-[#eab308]/10 border border-[#eab308]/20 text-[#eab308] px-4 py-1 text-xs font-bold uppercase tracking-wider">
                • Status: SOLVED
              </span>
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto">
                Camera đối thủ đang giám sát trực tiếp bằng WebRTC chống can thiệp dữ liệu.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderResultView = () => {
    const finalUserTime = userFinalTime ?? 12.342;
    const isVictory = finalUserTime < opponentTime;
    const eloChange = isVictory ? 15 : -15;
    const newElo = playerRating + eloChange;

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <Card
          className={`border p-8 rounded-3xl text-center space-y-3 relative overflow-hidden shadow-sm ${
            isVictory
              ? "border-[#eab308]/30 bg-[#eab308]/5"
              : "border-red-500/30 bg-red-500/5"
          }`}
        >
          <div className="flex justify-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${
                isVictory
                  ? "border-[#eab308] bg-[#eab308]/10 text-[#eab308]"
                  : "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {isVictory ? <CheckCircle className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
            </div>
          </div>
          <h2
            className={`text-3xl font-black uppercase tracking-wider ${
              isVictory ? "text-[#eab308]" : "text-red-500"
            }`}
          >
            {isVictory ? "VICTORY" : "DEFEAT"}
          </h2>
          <p className="text-muted-foreground text-xs font-medium max-w-md mx-auto">
            {isVictory
              ? "Awesome solve! You defeated your opponent and gained ELO points."
              : "Your opponent won by a narrow margin. Keep practicing to recover your ELO!"}
          </p>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="border border-border bg-card p-6 rounded-2xl space-y-6 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Award className="h-4 w-4 text-[#eab308]" />
              ELO & RANK UPDATE
            </h3>
            <div className="py-4 border-b border-border">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Current Rating:</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-foreground">{newElo}</span>
                <span
                  className={`text-xs font-black ${
                    isVictory ? "text-[#eab308]" : "text-red-500"
                  }`}
                >
                  {isVictory ? `+${eloChange}` : eloChange} ELO
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>Master I (2,600)</span>
                <span>Master II (2,700)</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-[#eab308] rounded-full transition-all"
                  style={{ width: `${newElo >= 2600 && newElo <= 2700 ? newElo - 2600 : 30}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center font-medium">
                Need {2700 - newElo} more ELO to promote to Master II.
              </p>
            </div>

            <Button
              onClick={() => {
                setMatchPhase("queue");
                setUserFinalTime(null);
              }}
              className="bg-[#eab308] hover:bg-[#ca8a04] text-white font-black py-6 rounded-xl w-full border-none tracking-[0.05em] shadow-lg shadow-yellow-500/15 flex items-center gap-1 justify-center font-sans"
            >
              FIND NEW MATCH
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Card>

          <Card className="lg:col-span-2 border border-border bg-card p-6 rounded-2xl flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Timer className="h-4 w-4 text-[#eab308]" />
                MATCH STATISTICS COMPARISON
              </h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Metrics</th>
                      <th className="pb-3 px-4 text-[#eab308]">YOU</th>
                      <th className="pb-3 pl-4 text-yellow-600 dark:text-yellow-500">SpeedMaster_JP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium text-foreground">
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground font-semibold font-sans">Solve Time (s)</td>
                      <td className={`py-4 px-4 font-black ${isVictory ? "text-[#eab308] text-sm" : ""}`}>
                        {finalUserTime.toFixed(3)}s
                      </td>
                      <td className={`py-4 pl-4 font-black ${!isVictory ? "text-yellow-600 dark:text-yellow-500 text-sm" : ""}`}>
                        {opponentTime.toFixed(3)}s
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground font-semibold font-sans">Inspection Time (s)</td>
                      <td className="py-4 px-4">3.2s</td>
                      <td className="py-4 pl-4">2.8s</td>
                    </tr>
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground font-semibold font-sans">Turns Per Second (TPS)</td>
                      <td className="py-4 px-4">{(55 / finalUserTime).toFixed(2)} tps</td>
                      <td className="py-4 pl-4">4.90 tps</td>
                    </tr>
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground font-semibold font-sans">Penalties (+2 / DNF)</td>
                      <td className="py-4 px-4 text-[#eab308] font-semibold font-sans">No penalty</td>
                      <td className="py-4 pl-4 text-[#eab308] font-semibold font-sans">No penalty</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setMatchPhase("lobby")}
              className="border-border hover:bg-muted text-muted-foreground hover:text-foreground py-5 rounded-xl w-full bg-muted/40 font-bold"
            >
              Back to Lobby
            </Button>
          </Card>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (matchPhase) {
      case "lobby":
        return renderLobbyView();
      case "queue":
        return renderQueueView();
      case "vs":
        return renderVSView();
      case "camera":
        return renderCameraView();
      case "timer":
        return renderTimerView();
      case "scramble":
        return renderScrambleView();
      case "verify":
        return renderVerifyView();
      case "inspect":
        return renderInspectView();
      case "solve":
        return renderSolveView();
      case "result":
        return renderResultView();
      default:
        return renderLobbyView();
    }
  };

  const getStatusLabel = () => {
    switch (matchPhase) {
      case "lobby":
        return "LOBBY_READY";
      case "queue":
        return "MATCHING_SEARCH";
      case "vs":
        return "MATCHED_READY";
      case "camera":
        return "WAITING_CAMERA";
      case "timer":
        return "WAITING_MOBILE";
      case "scramble":
        return "SCRAMBLING";
      case "verify":
        return "VERIFYING";
      case "inspect":
        return "INSPECTION";
      case "solve":
        return "SOLVING";
      case "result":
        return "COMPLETED";
      default:
        return "LOBBY";
    }
  };

  return (
    <div className="space-y-6">
      {/* Custom keyframes styling for unique animations in simulator */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes laser-scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-radar {
          animation: radar-spin 8s linear infinite;
        }
        .animate-laser {
          position: absolute;
          animation: laser-scan 3s ease-in-out infinite;
        }
        .animate-spin-hover:hover {
          animation: spin 1s ease-in-out;
        }
      `}} />

      {/* Simulator Bar wrapper - Rendered ONLY after Start Matchmaking is pressed */}
      {matchPhase !== "lobby" && (
        <div className="bg-card border-y border-border px-4 py-2.5 rounded-2xl shadow-sm animate-in slide-in-from-top duration-350">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 xl:gap-6">
            <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase">
              <span className="h-2 w-2 rounded-full bg-[#eab308] animate-pulse" />
              <span className="text-muted-foreground font-sans">1v1 Simulator Phase:</span>
              <span className="text-[#eab308] font-mono">{getStatusLabel()}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
              <span className="uppercase tracking-wider mr-1.5 text-muted-foreground font-sans">State Manual Jump:</span>
              {[
                { id: "lobby", label: "Lobby" },
                { id: "queue", label: "Queue" },
                { id: "vs", label: "VS Screen" },
                { id: "camera", label: "Camera" },
                { id: "timer", label: "QR Link" },
                { id: "scramble", label: "Scramble" },
                { id: "verify", label: "Verify" },
                { id: "inspect", label: "Inspect" },
                { id: "solve", label: "Solve" },
                { id: "result", label: "Result" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => {
                    setMatchPhase(btn.id as MatchPhase);
                    setUserFinalTime(null);
                    setTimerValue(0);
                    setTimerActive(false);
                  }}
                  className={`px-2.5 py-1 rounded transition text-xs border ${
                    matchPhase === btn.id
                      ? "border-[#eab308] bg-[#eab308]/10 text-[#eab308] shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
