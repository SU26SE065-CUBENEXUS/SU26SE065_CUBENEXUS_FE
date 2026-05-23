'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
        {/* Left Content */}
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
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
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              COMPETE NOW
            </Button>
            <Button size="lg" variant="outline" className="border-foreground/30 text-foreground hover:bg-foreground/5 font-semibold">
              <Play className="mr-2 h-4 w-4" />
              HOW IT WORKS
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
            <div>
              <p className="text-2xl font-bold text-accent">52,840+</p>
              <p className="text-xs text-muted-foreground">Active Cubers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">1,248</p>
              <p className="text-xs text-muted-foreground">Tournaments Hosted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">98</p>
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
