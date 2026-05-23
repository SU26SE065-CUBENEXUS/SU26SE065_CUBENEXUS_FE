'use client';

import Image from 'next/image';
import { Github, Instagram, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <div className="relative h-12 w-12 overflow-hidden rounded bg-background sm:h-14 sm:w-14">
                <Image
                  src="/logoCube.png"
                  alt="CubeNexus logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="leading-none">
                <div className="flex items-baseline gap-1 sm:gap-1.5">
                  <span className="text-xl font-black tracking-tight text-foreground sm:text-2xl">CUBE</span>
                  <span className="text-xl font-black tracking-tight text-[#f4b400] sm:text-2xl">NEXUS</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[8px] font-semibold tracking-[0.25em] text-muted-foreground sm:text-[9px]">
                  <span>SOLVE</span>
                  <span className="h-1 w-1 rounded-full bg-green-500" />
                  <span>COMPETE</span>
                  <span className="h-1 w-1 rounded-full bg-red-500" />
                  <span>INSPIRE</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The ultimate speedcubing platform for competitors worldwide.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">PRODUCT</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent transition">Arena</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent transition">Tournaments</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent transition">Practice</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent transition">Pricing</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">COMMUNITY</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent transition">Discord</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent transition">Forums</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent transition">Blog</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent transition">Events</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">FOLLOW US</h4>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-accent transition">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 CubeNexus. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-accent transition">Privacy Policy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-accent transition">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
