"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Crown,
  LoaderCircle,
  Rocket,
  Timer,
  Trophy,
  Users,
  X,
} from "lucide-react";

const modes = [
  {
    id: "1v1",
    name: "1v1 Match",
    icon: Users,
    description: "Challenge a cuber with matching Elo",
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
    description: "Personal practice or create a practice room",
  },
];

const activePlayers = [
  {
    id: 1,
    name: "SpeedMaster_JP",
    rating: 2850,
    country: "🇯🇵",
    status: "Waiting",
  },
  {
    id: 2,
    name: "CubeLegend_CN",
    rating: 2720,
    country: "🇨🇳",
    status: "In Match",
  },
  {
    id: 3,
    name: "FastFingers_US",
    rating: 2680,
    country: "🇺🇸",
    status: "Waiting",
  },
  {
    id: 4,
    name: "TwistyKing_KR",
    rating: 2650,
    country: "🇰🇷",
    status: "Waiting",
  },
  {
    id: 5,
    name: "BlazeFast_BR",
    rating: 2600,
    country: "🇧🇷",
    status: "In Match",
  },
  {
    id: 6,
    name: "PuzzleWizard_DE",
    rating: 2580,
    country: "🇩🇪",
    status: "Waiting",
  },
];

export default function ArenaPage() {
  const [selectedMode, setSelectedMode] = useState<
    "1v1" | "history" | "practice"
  >("1v1");
  const [matchPhase, setMatchPhase] = useState<
    "idle" | "queue" | "searching" | "found" | "room"
  >("idle");
  const [matchedOpponentId, setMatchedOpponentId] = useState<number | null>(
    null,
  );
  const [acceptCountdown, setAcceptCountdown] = useState<number | null>(null);
  const [practiceRoomId, setPracticeRoomId] = useState<string | null>(null);

  const playerRating = 2645;

  const matchedOpponent = useMemo(
    () =>
      activePlayers.find((player) => player.id === matchedOpponentId) ?? null,
    [matchedOpponentId],
  );

  useEffect(() => {
    if (matchPhase !== "queue") return;

    const searchingTimeout = window.setTimeout(() => {
      setMatchPhase("searching");

      const availableOpponents = activePlayers
        .filter((player) => player.status === "Waiting")
        .map((player) => ({
          ...player,
          eloGap: Math.abs(player.rating - playerRating),
        }))
        .sort((first, second) => first.eloGap - second.eloGap);

      const bestMatch = availableOpponents[0];

      window.setTimeout(() => {
        if (bestMatch) {
          setMatchedOpponentId(bestMatch.id);
          setMatchPhase("found");
          setAcceptCountdown(10);
        } else {
          setMatchPhase("idle");
        }
      }, 1400);
    }, 1200);

    return () => window.clearTimeout(searchingTimeout);
  }, [matchPhase, playerRating]);

  useEffect(() => {
    if (matchPhase !== "found" || acceptCountdown === null) return;

    if (acceptCountdown <= 0) {
      setMatchedOpponentId(null);
      setMatchPhase("idle");
      setAcceptCountdown(null);
      return;
    }

    const id = window.setTimeout(
      () => setAcceptCountdown((value) => (value ? value - 1 : null)),
      1000,
    );
    return () => window.clearTimeout(id);
  }, [matchPhase, acceptCountdown]);

  const startMatchmaking = () => {
    setPracticeRoomId(null);
    setMatchedOpponentId(null);
    setAcceptCountdown(null);
    setMatchPhase("queue");
  };

  const acceptMatch = () => {
    setAcceptCountdown(null);
    setMatchPhase("room");
  };

  const declineMatch = () => {
    setAcceptCountdown(null);
    setMatchedOpponentId(null);
    setMatchPhase("idle");
  };

  const createPracticeRoom = () => {
    const code = `PR-${Math.floor(1000 + Math.random() * 9000)}`;
    setPracticeRoomId(code);
    setMatchedOpponentId(null);
    setAcceptCountdown(null);
    setMatchPhase("room");
  };

  const renderQueueScreen = () => {
    if (matchPhase === "found" && matchedOpponent) {
      return (
        <Card className="mx-auto w-full max-w-4xl border border-slate-200 bg-white p-0 shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
          <div className="relative flex min-h-[600px] w-full items-center justify-center">
            <div className="relative flex w-full max-w-2xl flex-col items-center px-6 py-8 text-center">
              {/* Vòng tròn báo hiệu trận đấu nổi bật trên nền sáng */}
              <div className="relative flex items-center justify-center h-[340px] w-[340px]">
                <div className="absolute h-[330px] w-[330px] rounded-full border-2 border-amber-200 animate-ping opacity-25 duration-1000" />
                <div className="absolute h-[280px] w-[280px] rounded-full border-4 border-[#eab308]/40 shadow-md" />
                <div className="flex h-[200px] w-[220px] items-center justify-center rounded-full bg-slate-50 border-2 border-slate-200 shadow-inner">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#eab308] bg-white text-3xl font-black text-slate-700 shadow-md">
                    {matchedOpponent.country}
                  </div>
                </div>
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[#eab308]">
                Match Found
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-[0.1em] text-slate-800 sm:text-4xl">
                MATCH FOUND
              </h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                Ranked 1v1 • Similar Elo • Ready to accept
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs font-semibold text-slate-600">
                <span className="rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2">
                  Your Elo: {playerRating}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2">
                  Opponent Elo: {matchedOpponent.rating}
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50/60 text-amber-700 px-4 py-2 font-bold animate-pulse">
                  Accept in {acceptCountdown}s
                </span>
              </div>

              {/* Cụm nút phối hợp Vàng - Trắng đồng điệu với Header website */}
              <div className="mt-8 flex flex-wrap justify-center gap-4 items-center w-full">
                <Button
                  className="min-w-[200px] bg-[#eab308] hover:bg-[#ca8a04] px-8 py-6 text-lg font-bold tracking-[0.05em] text-white shadow-lg shadow-yellow-500/20 transition-all rounded-xl border-none"
                  onClick={acceptMatch}
                >
                  ACCEPT!
                </Button>
                <Button
                  variant="outline"
                  className="min-w-[160px] border-2 border-slate-200 bg-transparent hover:bg-slate-50 px-8 py-6 text-base font-bold tracking-[0.05em] text-slate-500 transition-all rounded-xl"
                  onClick={declineMatch}
                >
                  DECLINE
                </Button>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    if (matchPhase === "queue" || matchPhase === "searching") {
      return (
        <Card className="mx-auto w-full max-w-4xl border border-slate-200 bg-white p-0 shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
          <div className="relative flex min-h-[600px] w-full items-center justify-center">
            <div className="relative flex w-full max-w-2xl flex-col items-center px-6 py-8 text-center">
              {/* Vòng tròn Radar hiệu ứng xoay phối màu Light-blue tinh tế */}
              <div className="relative flex items-center justify-center h-[340px] w-[340px]">
                <div className="absolute h-[330px] w-[330px] rounded-full border border-slate-100 animate-pulse" />
                <div className="absolute h-[280px] w-[280px] rounded-full border-2 border-amber-100 shadow-inner" />
                <div className="flex h-[200px] w-[220px] items-center justify-center rounded-full bg-amber-50/40 border border-amber-200 shadow-sm">
                  <LoaderCircle className="h-12 w-12 animate-spin text-[#eab308]" />
                </div>
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-amber-600">
                Searching...
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-[0.1em] text-slate-800 sm:text-4xl">
                MATCHMAKING
              </h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                Ranked 1v1 • Similar Elo search • Lobby queue
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs font-semibold text-slate-600">
                <span className="rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2">
                  Your Elo: {playerRating}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2">
                  Players in queue:{" "}
                  {activePlayers.filter((p) => p.status === "Waiting").length}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2">
                  Estimated: ~3:00
                </span>
              </div>

              <div className="mt-8 flex justify-center w-full">
                <Button
                  variant="outline"
                  className="min-w-[240px] border-2 border-slate-200 bg-transparent hover:bg-slate-50 px-10 py-6 text-base font-bold tracking-[0.05em] text-slate-600 transition-all rounded-xl"
                  onClick={declineMatch}
                >
                  CANCEL
                </Button>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="mx-auto w-full max-w-4xl border border-slate-200 bg-white p-0 shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
        <div className="relative flex min-h-[600px] w-full items-center justify-center">
          <div className="relative flex w-full max-w-2xl flex-col items-center px-6 py-8 text-center">
            {/* Vòng tròn thiết kế lại theo tone sáng mịn */}
            <div className="relative flex items-center justify-center h-[340px] w-[340px]">
              <div className="absolute h-[330px] w-[330px] rounded-full border border-slate-100" />
              <div className="absolute h-[280px] w-[280px] rounded-full border-2 border-slate-200/60 shadow-sm" />
              <div className="flex h-[200px] w-[220px] items-center justify-center rounded-full bg-slate-50 border border-slate-200">
                <span className="text-4xl text-slate-4xl select-none">⚔️</span>
              </div>
            </div>

            {/* Thông tin giải đấu chữ tối tương phản cao */}
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
              Ready to Queue
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-[0.1em] text-slate-800 sm:text-4xl">
              RANKED ARENA
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Find your next competitor
            </p>

            {/* Các tag thông số đổi sang nền xám sáng, viền mảnh */}
            <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs font-semibold text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2">
                Your Elo: {playerRating}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2">
                Lobby queue
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2">
                Accept timer 10s
              </span>
            </div>

            {/* Nút bấm chuyển sang màu vàng đặc trưng của trang Cube Nexus */}
            <div className="mt-8 flex justify-center w-full">
              <Button
                className="min-w-[240px] bg-[#eab308] hover:bg-[#ca8a04] px-10 py-6 text-lg font-bold tracking-[0.05em] text-white shadow-lg shadow-yellow-500/20 transition-all rounded-xl border-none"
                onClick={startMatchmaking}
              >
                FIND MATCH
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderContent = () => {
    if (selectedMode === "history") {
      return (
        <Card className="border-2 border-border p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">
                Match History
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Review your last ranked games in a clean LoL-style list.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setSelectedMode("1v1")}
            >
              Back to Queue
            </Button>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            {[
              {
                id: "M-1023",
                opponent: "SpeedMaster_JP",
                result: "Win",
                time: "9.12s",
                date: "Today",
              },
              {
                id: "M-0998",
                opponent: "CubeLegend_CN",
                result: "Lose",
                time: "11.34s",
                date: "Yesterday",
              },
              {
                id: "M-0784",
                opponent: "FastFingers_US",
                result: "Win",
                time: "8.92s",
                date: "2 days ago",
              },
            ].map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {match.opponent}{" "}
                    <span className="text-xs text-muted-foreground">
                      · {match.date}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Match {match.id} — {match.time}
                  </p>
                </div>
                <div
                  className={`text-sm font-semibold ${match.result === "Win" ? "text-green-600" : "text-red-600"}`}
                >
                  {match.result}
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    if (selectedMode === "practice") {
      return (
        <Card className="border-2 border-border p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">
                Practice Mode
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Solo practice, timer drills, or create a custom room.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setSelectedMode("1v1")}
            >
              Back to Queue
            </Button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Start Solo Practice
            </Button>
            <Button
              className="w-full border-border"
              onClick={createPracticeRoom}
            >
              Create Practice Room
            </Button>
          </div>
          <div className="mt-5 rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Practice Room</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {practiceRoomId
                ? `Room code: ${practiceRoomId}`
                : "Create a room to invite friends or coach sessions."}
            </p>
          </div>
        </Card>
      );
    }

    return renderQueueScreen();
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Ranking Arena
          </p>
          <h1 className="text-balance text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            Ranking Arena for Cubers
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            A ranking arena for Rubik's Cube enthusiasts.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {modes.map((mode) => {
            const IconComponent = mode.icon;

            return (
              <Card
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id as "1v1" | "history" | "practice");
                  if (mode.id !== "practice") setPracticeRoomId(null);
                  if (mode.id !== "1v1") {
                    setMatchPhase("idle");
                    setMatchedOpponentId(null);
                    setAcceptCountdown(null);
                  }
                }}
                className={`cursor-pointer border-2 p-6 transition-all ${
                  selectedMode === mode.id
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{mode.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode.description}
                </p>
              </Card>
            );
          })}
        </div>

        {renderContent()}
      </div>
    </main>
  );
}
