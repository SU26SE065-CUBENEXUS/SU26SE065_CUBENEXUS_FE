'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import {
  Trophy,
  ArrowRight,
  Activity,
  Users,
} from 'lucide-react';

export function LiveSection() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 animate-fade-in">
      {/* Premium Promotional Banner Card with softer shadow-md and synced bg */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-8 sm:p-12 md:p-16 shadow-md backdrop-blur-md">
        
        {/* Glow Effects using theme accent & primary colors */}
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-2 items-center">
          {/* Left Column: Content (Xem Trực Tiếp button aligned here) */}
          <div className="space-y-6">
            {/* Status Badge */}
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-red-500 font-mono">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              LIVE SPECTATE & TOURNAMENTS
            </span>
            
            {/* Main Heading using Theme Gradient */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase leading-tight">
              {t('competitor', 'liveTitle')} <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-primary to-accent">
                {t('competitor', 'liveSubtitle')}
              </span>
            </h2>

            {/* Description using text-muted-foreground for high legibility */}
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl font-medium">
              {t('competitor', 'noLive')}
            </p>

            {/* CTA Link aligned to the left */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                href="/live"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 via-primary to-accent px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-md hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <span>{t('competitor', 'watchLive')}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Key Benefits Cards to balance the horizontal space */}
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-2xl border border-border/40 bg-card/40 hover:border-accent/30 hover:bg-card/75 transition duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0 mt-0.5">
                <Activity className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">Bảng xếp hạng trực tiếp</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Liveboard cập nhật kết quả từng lượt giải của đấu thủ ngay lập tức.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-2xl border border-border/40 bg-card/40 hover:border-primary/30 hover:bg-card/75 transition duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">Định dạng giải đấu WCA</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Hỗ trợ đầy đủ các thể thức thi đấu Ao5, Bo3, Mo3 tiêu chuẩn chuyên nghiệp.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-2xl border border-border/40 bg-card/40 hover:border-red-500/30 hover:bg-card/75 transition duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 shrink-0 mt-0.5">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">Cộng đồng toàn cầu</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Hàng ngàn khán giả và đấu thủ cùng tham gia theo dõi trực tuyến.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
