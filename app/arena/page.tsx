"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo, useState, useRef } from "react";
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
  Trash2,
  History,
} from "lucide-react";

// Types of matchmaking simulator phases
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

// Active players in queue mock
const activePlayers = [
  { id: 1, name: "SpeedMaster_JP", rating: 2850, country: "JP", status: "Waiting" },
  { id: 2, name: "CubeLegend_CN", rating: 2720, country: "CN", status: "In Match" },
  { id: 3, name: "FastFingers_US", rating: 2680, country: "US", status: "Waiting" },
  { id: 4, name: "TwistyFingers_US", rating: 2610, country: "US", status: "Waiting" },
  { id: 5, name: "BlazeFast_BR", rating: 2600, country: "BR", status: "In Match" },
];

const initialCubeColors = {
  U: ["W", "W", "W", "W", "W", "W", "W", "W", "W"], // U: White
  L: ["O", "O", "O", "O", "O", "O", "O", "O", "O"], // L: Orange
  F: ["G", "G", "G", "G", "G", "G", "G", "G", "G"], // F: Green
  R: ["R", "R", "R", "R", "R", "R", "R", "R", "R"], // R: Red
  B: ["B", "B", "B", "B", "B", "B", "B", "B", "B"], // B: Blue
  D: ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"], // D: Yellow
};

// WCA Scrambler Generator
const generateWcaScramble = () => {
  const faces = ["R", "L", "U", "D", "F", "B"];
  const modifiers = ["", "'", "2"];
  const scramble = [];
  let lastFace = "";

  while (scramble.length < 21) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    if (face !== lastFace) {
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      scramble.push(face + modifier);
      lastFace = face;
    }
  }
  return scramble.join(" ");
};

export default function ArenaPage() {
  const [selectedMode, setSelectedMode] = useState<"1v1" | "history" | "practice">("1v1");
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

  // Practice Mode Sandbox states
  const [practiceScrambleText, setPracticeScrambleText] = useState<string>("");
  const [practiceCubeColors, setPracticeCubeColors] = useState(initialCubeColors);
  const [practiceSessionTimes, setPracticeSessionTimes] = useState<number[]>([]);
  const [practiceTimerValue, setPracticeTimerValue] = useState<number>(0);
  const [practiceTimerActive, setPracticeTimerActive] = useState<boolean>(false);
  const practiceStartTimeRef = useRef<number>(0);

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

  // Generate scramble & layout colors for Practice
  const handleGeneratePracticeScramble = () => {
    setPracticeScrambleText(generateWcaScramble());
    const colorOptions = ["W", "O", "G", "R", "B", "Y"];
    const scrambleFace = () => Array.from({ length: 9 }, () => colorOptions[Math.floor(Math.random() * 6)]);
    setPracticeCubeColors({
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
    handleGeneratePracticeScramble();
  }, []);

  // Keyboard Event Listeners for Spacebar (1v1 Solver & Practice Solver Sandbox)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing spacebar triggers when user is writing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();

        // 1. Solve workflow for 1v1 matchmaking
        if (selectedMode === "1v1") {
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
        // 2. Solo Practice Sandbox Solving
        else if (selectedMode === "practice") {
          if (!practiceTimerActive) {
            setPracticeTimerActive(true);
            setPracticeTimerValue(0);
            practiceStartTimeRef.current = Date.now();
          } else {
            setPracticeTimerActive(false);
            const elapsed = Date.now() - practiceStartTimeRef.current;
            setPracticeTimerValue(elapsed);
            setPracticeSessionTimes((prev) => [elapsed, ...prev]);
            handleGeneratePracticeScramble();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [matchPhase, timerActive, timerValue, selectedMode, practiceTimerActive]);

  // Active Practice timer frame updater
  useEffect(() => {
    if (!practiceTimerActive) return;
    const startTime = Date.now() - practiceTimerValue;
    let frameId: number;

    const tick = () => {
      setPracticeTimerValue(Date.now() - startTime);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [practiceTimerActive]);

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
          // Auto start solving if inspection hits 0
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
        // Connect to active video elements
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

  // Helper to retrieve color style for Rubik net stickers
  const getStickerColorClass = (code: string) => {
    switch (code) {
      case "W":
        return "bg-zinc-100 dark:bg-zinc-200 border border-zinc-300/40";
      case "O":
        return "bg-orange-500";
      case "G":
        return "bg-emerald-500";
      case "R":
        return "bg-red-500";
      case "B":
        return "bg-blue-600";
      case "Y":
        return "bg-yellow-400";
      default:
        return "bg-zinc-700";
    }
  };

  // Render 3x3 Rubik Face helper
  const renderRubikFace = (stickers: string[]) => {
    return (
      <div className="grid grid-cols-3 gap-[2px] p-[3px] bg-zinc-950 border border-zinc-800 rounded-lg w-[46px] h-[46px] flex-shrink-0">
        {stickers.map((st, i) => (
          <div key={i} className={`w-3 h-3 rounded-[1px] ${getStickerColorClass(st)}`} />
        ))}
      </div>
    );
  };

  // Helper to format time (e.g. 11.024s)
  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    return totalSeconds.toFixed(3) + "s";
  };

  // Speedcubing average calculations
  const calculateAo5 = (times: number[]) => {
    if (times.length < 5) return null;
    const last5 = times.slice(0, 5);
    const sorted = [...last5].sort((a, b) => a - b);
    const middle3 = sorted.slice(1, 4); // Remove best and worst
    return middle3.reduce((a, b) => a + b, 0) / 3;
  };

  const calculateAo12 = (times: number[]) => {
    if (times.length < 12) return null;
    const last12 = times.slice(0, 12);
    const sorted = [...last12].sort((a, b) => a - b);
    const middle10 = sorted.slice(1, 11); // Remove best and worst
    return middle10.reduce((a, b) => a + b, 0) / 10;
  };

  // Sub-components/Views corresponding to each phase

  // 1. Lobby screen
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
                      setSelectedMode(mode.id as "1v1" | "history" | "practice");
                      if (mode.id !== "1v1") {
                        setMatchPhase("lobby");
                      }
                    }}
                    className={`cursor-pointer border-2 p-6 transition-all rounded-2xl ${selectedMode === mode.id
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

  // 2. Queue view
  const renderQueueView = () => (
    <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center h-[280px] w-[280px]">
        {/* Concentric rings */}
        <div className="absolute h-[260px] w-[260px] rounded-full border border-[#eab308]/15" />
        <div className="absolute h-[200px] w-[200px] rounded-full border border-[#eab308]/25" />
        <div className="absolute h-[140px] w-[140px] rounded-full border border-[#eab308]/35" />

        {/* Pulsing rings */}
        <div className="absolute h-[220px] w-[220px] rounded-full border-2 border-[#eab308]/40 animate-ping opacity-25" />

        {/* Rotating sweep ring */}
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

      {/* Terminal log panel (Keep dark for contrast style, logs yellow/gold) */}
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

  // 3. VS Match countdown view
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

  // 4. Setup Step 1: Camera verification
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
                {/* Horizontal scanner bar */}
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

      {/* Bottom Status bar */}
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

  // 5. Setup Step 2: Connect smart mobile timer
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
          {/* QR Frame Container */}
          <div className="relative border border-[#eab308]/30 bg-zinc-950 p-6 rounded-2xl flex flex-col items-center justify-center w-64 h-64 shadow-xl">
            <div className="w-44 h-44 border border-zinc-850 rounded-xl bg-white flex flex-col items-center justify-center p-3 relative group">
              {/* QR scanner active laser line */}
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

  // 6. Setup Step 3: WCA Scramble
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

      {/* Scramble Display Card */}
      <Card className="border border-border bg-muted/40 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[100px] shadow-sm">
        <span className="absolute top-3 left-3 rounded bg-[#eab308]/10 border border-[#eab308]/20 text-[#eab308] font-black px-2 py-0.5 text-[9px] uppercase tracking-wider leading-none">
          WCA Official Scramble Config
        </span>
        <p className="text-xl md:text-2xl font-mono text-foreground font-black tracking-wide leading-relaxed mt-4 max-w-3xl">
          {scrambleText}
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cube Net layout */}
        <Card className="lg:col-span-2 border border-border bg-card p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Tv className="h-4 w-4 text-[#eab308]" />
            2D FLAT LAYOUT (NET LAYOUT)
          </h3>
          <div className="flex flex-col items-center justify-center py-4 scale-95 md:scale-100">
            {/* Net diagram cross layout */}
            <div className="space-y-[4px]">
              {/* Row 1: U face */}
              <div className="flex justify-center">
                <div className="w-[46px] h-[46px]" /> {/* Empty space */}
                {renderRubikFace(cubeColors.U)}
                <div className="w-[46px] h-[46px]" /> {/* Empty space */}
                <div className="w-[46px] h-[46px]" /> {/* Empty space */}
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
                <div className="w-[46px] h-[46px]" /> {/* Empty space */}
                {renderRubikFace(cubeColors.D)}
                <div className="w-[46px] h-[46px]" /> {/* Empty space */}
                <div className="w-[46px] h-[46px]" /> {/* Empty space */}
              </div>
            </div>
          </div>
        </Card>

        {/* Instructions card */}
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

  // 7. Setup Step 4: Scramble Cross verification
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

  // 8. Inspection view
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

      {/* Circle countdown */}
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

      {/* Spacebar starter */}
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

  // 9. Solving timer view
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
            className={`border bg-card p-8 rounded-2xl flex flex-col justify-center items-center h-80 text-center space-y-6 select-none cursor-pointer transition-all ${timerActive
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

  // 10. Results view
  const renderResultView = () => {
    const finalUserTime = userFinalTime ?? 12.342;
    const isVictory = finalUserTime < opponentTime;
    const eloChange = isVictory ? 15 : -15;
    const newElo = playerRating + eloChange;

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Banner Card */}
        <Card
          className={`border p-8 rounded-3xl text-center space-y-3 relative overflow-hidden shadow-sm ${isVictory
              ? "border-[#eab308]/30 bg-[#eab308]/5"
              : "border-red-500/30 bg-red-500/5"
            }`}
        >
          <div className="flex justify-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${isVictory
                  ? "border-[#eab308] bg-[#eab308]/10 text-[#eab308]"
                  : "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
            >
              {isVictory ? <CheckCircle className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
            </div>
          </div>
          <h2
            className={`text-3xl font-black uppercase tracking-wider ${isVictory ? "text-[#eab308]" : "text-red-500"
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
          {/* ELO update chart column */}
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
                  className={`text-xs font-black ${isVictory ? "text-[#eab308]" : "text-red-500"
                    }`}
                >
                  {isVictory ? `+${eloChange}` : eloChange} ELO
                </span>
              </div>
            </div>

            {/* Rank range progress bar */}
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

          {/* Technical stats table column */}
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

  // 11. REDESIGNED PRACTICE MODE (SOLO TIMER SANDBOX)
  const renderPracticeView = () => {
    const totalSolves = practiceSessionTimes.length;
    const bestTime = totalSolves > 0 ? Math.min(...practiceSessionTimes) : null;
    const worstTime = totalSolves > 0 ? Math.max(...practiceSessionTimes) : null;
    const sessionAverage = totalSolves > 0
      ? practiceSessionTimes.reduce((a, b) => a + b, 0) / totalSolves
      : null;

    const ao5 = calculateAo5(practiceSessionTimes);
    const ao12 = calculateAo12(practiceSessionTimes);

    return (
      <div className="grid gap-8 lg:grid-cols-3 animate-in fade-in duration-300">
        {/* Left Area (2/3 width): Scramble and Timer */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border bg-card text-card-foreground p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base">Practice Solves Sandbox</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Press **Spacebar** or click the timer to start/stop solving.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-border text-xs px-3 py-1.5 h-auto hover:bg-muted"
                onClick={() => setSelectedMode("1v1")}
              >
                Back to 1v1 Arena
              </Button>
            </div>

            {/* Scramble Formula Card */}
            <div className="bg-muted/60 border border-border rounded-xl p-4 text-center relative mb-6">
              <span className="absolute top-2 left-3 text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                Scramble Formula
              </span>
              <button
                onClick={handleGeneratePracticeScramble}
                className="absolute top-2 right-3 p-1 hover:bg-muted text-muted-foreground rounded transition-colors"
                title="Regenerate scramble"
              >
                <RefreshCw className="h-3 w-3 animate-spin-hover" />
              </button>
              <p className="text-sm md:text-base font-mono font-black tracking-wide leading-relaxed mt-3 px-4">
                {practiceScrambleText || "Generating scramble..."}
              </p>
            </div>

            {/* Rubik Net View */}
            <div className="flex flex-col items-center justify-center p-4 border border-border/60 bg-muted/20 rounded-xl mb-6">
              <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-wider mb-3">
                Scrambled Cube Net Diagram
              </span>
              <div className="scale-90 md:scale-100 space-y-[4px]">
                {/* Row 1: U */}
                <div className="flex justify-center">
                  <div className="w-[46px] h-[46px]" />
                  {renderRubikFace(practiceCubeColors.U)}
                  <div className="w-[46px] h-[46px]" />
                  <div className="w-[46px] h-[46px]" />
                </div>
                {/* Row 2: L, F, R, B */}
                <div className="flex justify-center gap-[4px]">
                  {renderRubikFace(practiceCubeColors.L)}
                  {renderRubikFace(practiceCubeColors.F)}
                  {renderRubikFace(practiceCubeColors.R)}
                  {renderRubikFace(practiceCubeColors.B)}
                </div>
                {/* Row 3: D */}
                <div className="flex justify-center">
                  <div className="w-[46px] h-[46px]" />
                  {renderRubikFace(practiceCubeColors.D)}
                  <div className="w-[46px] h-[46px]" />
                  <div className="w-[46px] h-[46px]" />
                </div>
              </div>
            </div>

            {/* Active Practice Timer */}
            <div
              onClick={() => {
                if (!practiceTimerActive) {
                  setPracticeTimerActive(true);
                  setPracticeTimerValue(0);
                  practiceStartTimeRef.current = Date.now();
                } else {
                  setPracticeTimerActive(false);
                  const elapsed = Date.now() - practiceStartTimeRef.current;
                  setPracticeTimerValue(elapsed);
                  setPracticeSessionTimes((prev) => [elapsed, ...prev]);
                  handleGeneratePracticeScramble();
                }
              }}
              className={`border p-8 rounded-2xl flex flex-col justify-center items-center h-52 text-center space-y-4 select-none cursor-pointer transition-all ${practiceTimerActive
                  ? "border-[#eab308] bg-[#eab308]/5 shadow-[0_0_20px_rgba(234,179,8,0.08)]"
                  : "border-border bg-muted/40 hover:bg-muted/80 text-foreground"
                }`}
            >
              <span className="text-[10px] font-mono text-muted-foreground font-bold tracking-widest uppercase">
                {practiceTimerActive ? "SOLVING IN PROGRESS..." : "PRACTICE STOPWATCH"}
              </span>
              <h3 className="text-5xl font-mono font-black tracking-wide">
                {formatTime(practiceTimerValue)}
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold">
                [ PRESS SPACEBAR OR CLICK TO START / STOP ]
              </p>
            </div>
          </Card>
        </div>

        {/* Right Area (1/3 width): Session Stats & Solve History */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card className="border border-border bg-card text-card-foreground p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Session Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                <span className="text-[10px] text-muted-foreground font-bold block">Solves</span>
                <span className="text-lg font-black mt-1 block">{totalSolves}</span>
              </div>
              <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                <span className="text-[10px] text-muted-foreground font-bold block">Best Time</span>
                <span className="text-lg font-black text-[#eab308] mt-1 block font-mono">
                  {bestTime ? formatTime(bestTime) : "--"}
                </span>
              </div>
              <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                <span className="text-[10px] text-muted-foreground font-bold block">Session Mean</span>
                <span className="text-lg font-black mt-1 block font-mono">
                  {sessionAverage ? formatTime(sessionAverage) : "--"}
                </span>
              </div>
              <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                <span className="text-[10px] text-muted-foreground font-bold block">Worst Time</span>
                <span className="text-lg font-black mt-1 block font-mono">
                  {worstTime ? formatTime(worstTime) : "--"}
                </span>
              </div>
            </div>

            <div className="border-t border-border mt-4 pt-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between font-semibold">
                <span className="text-muted-foreground font-sans">Current Ao5</span>
                <span>{ao5 ? formatTime(ao5) : "--"}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-muted-foreground font-sans">Current Ao12</span>
                <span>{ao12 ? formatTime(ao12) : "--"}</span>
              </div>
            </div>
          </Card>

          {/* Session History List Card */}
          <Card className="border border-border bg-card text-card-foreground p-6 rounded-2xl shadow-sm flex flex-col h-[340px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Solves History
              </h3>
              {totalSolves > 0 && (
                <button
                  onClick={() => setPracticeSessionTimes([])}
                  className="text-[10px] font-bold text-red-500 hover:text-red-600 transition flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear All
                </button>
              )}
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 pr-1 text-xs">
              {totalSolves === 0 ? (
                <p className="text-muted-foreground italic text-center py-12">No solves in this session yet.</p>
              ) : (
                practiceSessionTimes.map((time, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center rounded-lg bg-muted/40 p-2.5 border border-border/50 font-mono"
                  >
                    <span className="text-muted-foreground">Solve #{totalSolves - idx}</span>
                    <span className="font-bold text-foreground">{formatTime(time)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // 12. REDESIGNED MATCH HISTORY (ESPORTS DASHBOARD)
  const renderHistoryView = () => {
    const totalDuels = 60;
    const wins = 35;
    const losses = 25;
    const winRate = ((wins / totalDuels) * 100).toFixed(1);
    const bestSolve = "8.920s";
    const avgSolve = "11.450s";

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* History Overview Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-black">Match History Dashboard</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review stats, Elo changes, and details of completed 1v1 duels.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-border text-xs px-3 py-1.5 h-auto hover:bg-muted"
            onClick={() => setSelectedMode("1v1")}
          >
            Back to 1v1 Arena
          </Button>
        </div>

        {/* Overview Stats Cards row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-border bg-card p-4 rounded-xl shadow-sm text-center">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Win Rate</span>
            <h4 className="text-2xl font-black text-[#eab308] mt-1">{winRate}%</h4>
            <span className="text-[10px] text-muted-foreground font-medium">{wins}W / {losses}L</span>
          </Card>
          <Card className="border border-border bg-card p-4 rounded-xl shadow-sm text-center">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Current Elo</span>
            <h4 className="text-2xl font-black text-foreground mt-1">{playerRating}</h4>
            <span className="text-[10px] text-muted-foreground font-medium">Grandmaster Cuber</span>
          </Card>
          <Card className="border border-border bg-card p-4 rounded-xl shadow-sm text-center">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Best Time</span>
            <h4 className="text-2xl font-black text-foreground mt-1 font-mono">{bestSolve}</h4>
            <span className="text-[10px] text-muted-foreground font-medium">Solve PB</span>
          </Card>
          <Card className="border border-border bg-card p-4 rounded-xl shadow-sm text-center">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Average solve</span>
            <h4 className="text-2xl font-black text-foreground mt-1 font-mono">{avgSolve}</h4>
            <span className="text-[10px] text-muted-foreground font-medium">Session Mean</span>
          </Card>
        </div>

        {/* Duel List Table/Grid */}
        <Card className="border border-border bg-card p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <History className="h-4 w-4" /> Recent Match Log
          </h3>

          <div className="space-y-3">
            {[
              {
                id: "M-1023",
                opponent: "SpeedMaster_JP",
                opponentElo: 2850,
                opponentTime: "11.024s",
                country: "JP",
                result: "Win",
                time: "9.120s",
                eloChange: "+15",
                tps: "6.8",
                date: "Today, 14:15",
              },
              {
                id: "M-0998",
                opponent: "CubeLegend_CN",
                opponentElo: 2720,
                opponentTime: "10.450s",
                country: "CN",
                result: "Lose",
                time: "11.340s",
                eloChange: "-12",
                tps: "5.5",
                date: "Yesterday, 20:34",
              },
              {
                id: "M-0784",
                opponent: "FastFingers_US",
                opponentElo: 2680,
                opponentTime: "9.450s",
                country: "US",
                result: "Win",
                time: "8.920s",
                eloChange: "+15",
                tps: "7.0",
                date: "2 days ago, 18:22",
              },
              {
                id: "M-0651",
                opponent: "TwistyFingers_US",
                opponentElo: 2610,
                opponentTime: "12.310s",
                country: "US",
                result: "Win",
                time: "10.510s",
                eloChange: "+12",
                tps: "5.9",
                date: "4 days ago, 11:05",
              },
            ].map((match) => {
              const isWin = match.result === "Win";
              return (
                <div
                  key={match.id}
                  className={`flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl border p-4 text-xs font-mono transition-colors relative overflow-hidden ${isWin
                      ? "border-[#eab308]/20 bg-[#eab308]/5 hover:bg-[#eab308]/10"
                      : "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                    }`}
                >
                  {/* Left result vertical accent line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWin ? "bg-[#eab308]" : "bg-red-500"}`} />

                  <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center pl-2">
                    <div className="min-w-[70px]">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${isWin ? "bg-[#eab308]/20 text-[#eab308]" : "bg-red-500/20 text-red-600 dark:text-red-400"
                        }`}>
                        {match.result}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1 font-sans">{match.date}</p>
                    </div>

                    <div className="min-w-[150px]">
                      <p className="font-bold text-foreground font-sans">
                        vs {match.opponent}{" "}
                        <span className="text-[10px] text-muted-foreground font-normal">({match.opponentElo} Elo)</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Match ID: {match.id}</p>
                    </div>

                    <div className="min-w-[120px]">
                      <p className="text-muted-foreground font-sans">Times</p>
                      <p className="font-bold text-foreground mt-0.5">
                        {match.time} <span className="text-[10px] text-muted-foreground font-normal">vs {match.opponentTime}</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground font-sans">Speed stats</p>
                      <p className="font-bold text-foreground mt-0.5">{match.tps} Turns/s</p>
                    </div>
                  </div>

                  <div className="mt-3 md:mt-0 flex items-center gap-3">
                    <span className={`font-black text-sm ${isWin ? "text-[#eab308]" : "text-red-600 dark:text-red-400"}`}>
                      {match.eloChange} ELO
                    </span>
                    <button className="border border-border bg-card rounded px-2.5 py-1 hover:bg-muted font-bold text-[10px] text-muted-foreground transition font-sans">
                      View AI Log
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    // If not on 1v1 match mode, route to other views
    if (selectedMode === "history") {
      return renderHistoryView();
    }

    if (selectedMode === "practice") {
      return renderPracticeView();
    }

    // Match phases routing
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

  // Status text display in simulator bar
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
    <main className="min-h-screen bg-background text-foreground font-sans antialiased pb-16 relative">
      {/* Inline styles for custom animations */}
      <style>{`
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
      `}</style>

      <Header />

      {/* Simulator Bar wrapper - Rendered ONLY after Start Matchmaking is pressed */}
      {selectedMode === "1v1" && matchPhase !== "lobby" && (
        <div className="bg-card border-y border-border px-4 py-2.5 shadow-sm animate-in slide-in-from-top duration-350">
          <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 xl:gap-6">
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
                    setSelectedMode("1v1");
                    setUserFinalTime(null);
                    setTimerValue(0);
                    setTimerActive(false);
                  }}
                  className={`px-2.5 py-1 rounded transition text-xs border ${matchPhase === btn.id
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

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2 border-l-2 border-[#eab308] pl-4 py-1">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#eab308]">
            Ranking Arena
          </p>
          <h1 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-5xl uppercase">
            ĐẤU HẠNG 1V1 CUBENEXUS
          </h1>
          <p className="max-w-2xl text-xs font-semibold text-muted-foreground">
            A premium cybernetic matchmaking client for competitive speedcubers. Solve, inspect, sync, win.
          </p>
        </div>

        {renderContent()}
      </div>
    </main>
  );
}
