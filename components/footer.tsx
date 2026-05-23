'use client';

import { Github, Instagram, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
                <span className="font-bold text-accent-foreground text-sm">C</span>
              </div>
              <span className="font-bold text-foreground">CUBENEXUS</span>
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
            © 2025 CubeNexus. All rights reserved.
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
