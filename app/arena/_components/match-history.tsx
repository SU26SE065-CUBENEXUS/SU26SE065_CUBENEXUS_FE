"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

interface MatchHistoryViewProps {
  onSelectMode: (mode: "1v1" | "history" | "practice") => void;
}

export function MatchHistoryView({ onSelectMode }: MatchHistoryViewProps) {
  const totalDuels = 60;
  const wins = 35;
  const losses = 25;
  const winRate = ((wins / totalDuels) * 100).toFixed(1);
  const bestSolve = "8.920s";
  const avgSolve = "11.450s";
  const playerRating = 2645;

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
          onClick={() => onSelectMode("1v1")}
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
                className={`flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl border p-4 text-xs font-mono transition-colors relative overflow-hidden ${
                  isWin
                    ? "border-[#eab308]/20 bg-[#eab308]/5 hover:bg-[#eab308]/10"
                    : "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                }`}
              >
                {/* Left result vertical accent line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWin ? "bg-[#eab308]" : "bg-red-500"}`} />

                <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center pl-2">
                  <div className="min-w-[70px]">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      isWin ? "bg-[#eab308]/20 text-[#eab308]" : "bg-red-500/20 text-red-600 dark:text-red-400"
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
}
