'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
        {/* Left Content */}
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <h1 className="text-balance text-5xl font-black tracking-tight text-foreground sm:text-6xl">
              CUBE<br />
              <span className="text-accent">NEXUS</span>
            </h1>
            <p className="text-lg font-semibold text-muted-foreground">SPEEDCUBING TOURNAMENTS<br />MEET THE ONLINE ARENA</p>
          </div>

          <p className="max-w-lg text-pretty text-base leading-relaxed text-foreground/80">
            Compete. Improve. Climb the ranks. Join a global community of cubers and prove your speed.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 text-white font-semibold shadow-lg shadow-red-200/60">
              <Link href="/arena">COMPETE NOW</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-foreground/20 text-foreground hover:bg-foreground/5 font-semibold">
              <Link href="/tournaments">
              <Play className="mr-2 h-4 w-4" />
              HOW IT WORKS
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
            <div>
                <p className="text-2xl font-bold text-red-500">52,840+</p>
              <p className="text-xs text-muted-foreground">Active Cubers</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-orange-500">1,248</p>
              <p className="text-xs text-muted-foreground">Tournaments Hosted</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-green-500">98</p>
              <p className="text-xs text-muted-foreground">Countries</p>
            </div>
          </div>
        </div>

        {/* Right - 3D Cube Image */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative h-96 w-96 sm:h-[500px] sm:w-[500px]">
            <Image
              src="/ảnh rubik.png"
              alt="Rubik's Cube - CubeNexus Arena"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
