"use client";

import { Header } from "@/components/header";
import { useState } from "react";
import { Match1v1View } from "./_components/match-1v1";
import { MatchHistoryView } from "./_components/match-history";
import { PracticeModeView } from "./_components/practice-mode";

export default function ArenaPage() {
  const [selectedMode, setSelectedMode] = useState<"1v1" | "history" | "practice">("1v1");

  const renderContent = () => {
    switch (selectedMode) {
      case "1v1":
        return <Match1v1View selectedMode={selectedMode} onSelectMode={setSelectedMode} />;
      case "history":
        return <MatchHistoryView onSelectMode={setSelectedMode} />;
      case "practice":
        return <PracticeModeView onSelectMode={setSelectedMode} />;
      default:
        return <Match1v1View selectedMode={selectedMode} onSelectMode={setSelectedMode} />;
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-sans antialiased pb-16 relative">
      <Header />

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
