"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2 } from "lucide-react";
import {
  initialCubeColors,
  generateWcaScramble,
  renderRubikFace,
  formatTime,
  calculateAo5,
  calculateAo12,
} from "./arena-utils";

interface PracticeModeViewProps {
  onSelectMode: (mode: "1v1" | "history" | "practice") => void;
}

export function PracticeModeView({ onSelectMode }: PracticeModeViewProps) {
  // Practice Mode Sandbox states
  const [practiceScrambleText, setPracticeScrambleText] = useState<string>("");
  const [practiceCubeColors, setPracticeCubeColors] = useState(initialCubeColors);
  const [practiceSessionTimes, setPracticeSessionTimes] = useState<number[]>([]);
  const [practiceTimerValue, setPracticeTimerValue] = useState<number>(0);
  const [timerState, setTimerState] = useState<"idle" | "holding" | "ready" | "running">("idle");

  const practiceStartTimeRef = useRef<number>(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spacePressedRef = useRef<boolean>(false);

  // Generate scramble & layout colors for Practice (25 moves WCA scramble)
  const handleGeneratePracticeScramble = () => {
    setPracticeScrambleText(generateWcaScramble(25));
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

  // Initialize scramble on mount
  useEffect(() => {
    handleGeneratePracticeScramble();
  }, []);

  // Keyboard Event Listeners for Spacebar: Hold down (300ms) to Ready, Release to Start, Press to Stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        
        // Prevent keyboard repeat triggers
        if (spacePressedRef.current) return;
        spacePressedRef.current = true;

        if (timerState === "running") {
          // Stop immediately
          setTimerState("idle");
          const elapsed = Date.now() - practiceStartTimeRef.current;
          setPracticeTimerValue(elapsed);
          setPracticeSessionTimes((prev) => [elapsed, ...prev]);
          handleGeneratePracticeScramble();
        } else if (timerState === "idle") {
          // Hold to ready
          setTimerState("holding");
          setPracticeTimerValue(0);
          holdTimerRef.current = setTimeout(() => {
            setTimerState("ready");
          }, 300);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        spacePressedRef.current = false;

        if (timerState === "holding") {
          // Released too early - cancel
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
          }
          setTimerState("idle");
        } else if (timerState === "ready") {
          // Released after 300ms hold - start timer
          setTimerState("running");
          practiceStartTimeRef.current = Date.now();
          setPracticeTimerValue(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [timerState]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  // Active Practice timer frame updater
  useEffect(() => {
    if (timerState !== "running") return;
    const startTime = Date.now();
    let frameId: number;

    const tick = () => {
      setPracticeTimerValue(Date.now() - startTime);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [timerState]);

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
                Hold **Spacebar** to ready, release to start. Press any key or click to stop.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-border text-xs px-3 py-1.5 h-auto hover:bg-muted"
              onClick={() => onSelectMode("1v1")}
            >
              Back to 1v1 Arena
            </Button>
          </div>

          {/* Scramble Formula Card */}
          <div className="bg-muted/60 border border-border rounded-xl p-4 text-center relative mb-6">
            <span className="absolute top-2 left-3 text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
              Scramble Formula (25 Moves)
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

          {/* Rubik Net View (Enlarged size) */}
          <div className="flex flex-col items-center justify-center p-6 border border-border/60 bg-muted/20 rounded-2xl mb-6 shadow-sm">
            <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-wider mb-5">
              Scrambled Cube Net Diagram
            </span>
            <div className="scale-95 sm:scale-100 space-y-[6px]">
              {/* Row 1: U */}
              <div className="flex justify-center">
                <div className="w-[94px] h-[94px]" />
                {renderRubikFace(practiceCubeColors.U, "lg")}
                <div className="w-[94px] h-[94px]" />
                <div className="w-[94px] h-[94px]" />
              </div>
              {/* Row 2: L, F, R, B */}
              <div className="flex justify-center gap-[6px]">
                {renderRubikFace(practiceCubeColors.L, "lg")}
                {renderRubikFace(practiceCubeColors.F, "lg")}
                {renderRubikFace(practiceCubeColors.R, "lg")}
                {renderRubikFace(practiceCubeColors.B, "lg")}
              </div>
              {/* Row 3: D */}
              <div className="flex justify-center">
                <div className="w-[94px] h-[94px]" />
                {renderRubikFace(practiceCubeColors.D, "lg")}
                <div className="w-[94px] h-[94px]" />
                <div className="w-[94px] h-[94px]" />
              </div>
            </div>
          </div>

          {/* Active Practice Timer (Sleek color states) */}
          <div
            onClick={() => {
              if (timerState === "running") {
                setTimerState("idle");
                const elapsed = Date.now() - practiceStartTimeRef.current;
                setPracticeTimerValue(elapsed);
                setPracticeSessionTimes((prev) => [elapsed, ...prev]);
                handleGeneratePracticeScramble();
              } else {
                setTimerState("running");
                practiceStartTimeRef.current = Date.now();
                setPracticeTimerValue(0);
              }
            }}
            className={`border p-8 rounded-3xl flex flex-col justify-center items-center h-56 text-center space-y-4 select-none cursor-pointer transition-all duration-200 ${
              timerState === "holding"
                ? "border-red-500 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                : timerState === "ready"
                ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.2)] text-emerald-500"
                : timerState === "running"
                ? "border-[#eab308] bg-[#eab308]/5 shadow-[0_0_25px_rgba(234,179,8,0.1)] text-[#eab308]"
                : "border-border bg-muted/40 hover:bg-muted/50 text-foreground"
            }`}
          >
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-muted-foreground">
              {timerState === "holding"
                ? "HOLDING SPACEBAR..."
                : timerState === "ready"
                ? "READY! RELEASE SPACEBAR TO SOLVE"
                : timerState === "running"
                ? "SOLVING IN PROGRESS..."
                : "PRACTICE STOPWATCH"}
            </span>
            <h3 className={`text-5xl font-mono font-black tracking-wide transition-all ${
              timerState === "holding"
                ? "text-red-500 scale-95"
                : timerState === "ready"
                ? "text-emerald-500 scale-105"
                : "text-foreground"
            }`}>
              {formatTime(practiceTimerValue)}
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {timerState === "running"
                ? "[ PRESS SPACEBAR OR CLICK TO STOP ]"
                : "[ HOLD SPACEBAR OR CLICK TO START ]"}
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
}
