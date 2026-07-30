'use client';

import Link from 'next/link';
import {
  Trophy,
  Swords,
  ShieldCheck,
  Zap,
  QrCode,
  Smartphone,
  Video,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Globe,
  Flame,
  Award,
} from 'lucide-react';

const offlineFeatures = [
  {
    icon: Trophy,
    title: 'WCA Tournament Format',
    description: 'Official Ao5, Bo3 & Mo3 round rules with verified scramble sequences and live leaderboards.',
  },
  {
    icon: QrCode,
    title: 'Instant QR Station Check-in',
    description: 'Scan your competitor QR pass at judge stations for instant heat assignments and group queueing.',
  },
  {
    icon: ShieldCheck,
    title: 'Digital Judge Verification',
    description: 'Electronic e-signatures, instant penalty (+2/DNF) logging, and live stage scoreboards.',
  },
];

const onlineFeatures = [
  {
    icon: Swords,
    title: 'Ranked 1v1 ELO Matchmaking',
    description: 'Skill-matched competitive duels. Earn ELO rating points and climb the global arena leaderboard.',
  },
  {
    icon: Video,
    title: 'Dual-Cam Anti-Cheat & Replay',
    description: 'Real-time WebRTC camera supervision, AI cube validation, and split-screen video playback.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Smart Timer Link',
    description: 'Pair your smartphone as a Stackmat-compatible wireless solve timer via instant QR scan.',
  },
];

export function FlowsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Section Title & Esports Subheading */}
      <div className="mb-10 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-widest">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          CHOOSE YOUR ARENA
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase font-sans">
          Game Modes <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-500">& Battle Arenas</span>
        </h2>
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-zinc-400">
          Whether competing on stage in official WCA-style physical tournaments or battling global opponents in 1v1 online ranked duels, CubeNexus provides full esports immersion.
        </p>
      </div>

      {/* Arena Cards Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* CARD 1: OFFLINE TOURNAMENTS */}
        <div className="group relative bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950 border border-zinc-800 hover:border-amber-500/50 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-amber-500/10 flex flex-col justify-between overflow-hidden">
          {/* Ambient Glow background effect */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-amber-500/15 transition-all" />
          
          <div>
            {/* Header Badge & Title */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    LIVE PHYSICAL EVENTS
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Globe className="h-3 w-3" /> WCA Standard
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-white flex items-center gap-2">
                  Offline Tournament <span className="text-amber-400">Arena</span>
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                <Trophy className="h-6 w-6" />
              </div>
            </div>

            {/* Quick Specs Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 text-zinc-300 text-[11px] font-bold border border-zinc-800/80 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-400" /> Official Ao5 / Bo3 Formats
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 text-zinc-300 text-[11px] font-bold border border-zinc-800/80 flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-amber-400" /> QR Check-in
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 text-zinc-300 text-[11px] font-bold border border-zinc-800/80 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Digital E-Signatures
              </span>
            </div>

            {/* Feature Cards List */}
            <div className="space-y-3.5 mb-8">
              {offlineFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 group-hover:border-zinc-700/60 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        {feat.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{feat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action CTA Button */}
          <Link
            href="/tournaments"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-widest transition-all duration-200 shadow-xl shadow-amber-500/15 flex items-center justify-center gap-2 group/btn cursor-pointer"
          >
            Explore Offline Tournaments
            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* CARD 2: ONLINE RANKED ARENA */}
        <div className="group relative bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950 border border-zinc-800 hover:border-orange-500/50 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-orange-500/10 flex flex-col justify-between overflow-hidden">
          {/* Ambient Glow background effect */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-orange-500/15 transition-all" />

          <div>
            {/* Header Badge & Title */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                    <Flame className="h-3 w-3 fill-orange-400" /> RANKED SEASON
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Zap className="h-3 w-3 text-orange-400" /> Global ELO
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-white flex items-center gap-2">
                  Online Ranked <span className="text-orange-400">Arena</span>
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-110 transition-transform">
                <Swords className="h-6 w-6" />
              </div>
            </div>

            {/* Quick Specs Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 text-zinc-300 text-[11px] font-bold border border-zinc-800/80 flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5 text-orange-400" /> 1v1 Skill Matchmaking
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 text-zinc-300 text-[11px] font-bold border border-zinc-800/80 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-orange-400" /> Split-Screen Replays
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 text-zinc-300 text-[11px] font-bold border border-zinc-800/80 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-orange-400" /> Wireless Smart Timer
              </span>
            </div>

            {/* Feature Cards List */}
            <div className="space-y-3.5 mb-8">
              {onlineFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 group-hover:border-zinc-700/60 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        {feat.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{feat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action CTA Button */}
          <Link
            href="/online"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-extrabold text-xs uppercase tracking-widest transition-all duration-200 shadow-xl shadow-orange-500/15 flex items-center justify-center gap-2 group/btn cursor-pointer"
          >
            Enter Ranked Arena
            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

