'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`Logged in with ${email}`);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <span className="text-lg font-bold text-accent-foreground">C</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign In</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back to CubeNexus Arena
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-border p-8">
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-accent focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-10 py-2.5 text-foreground placeholder-muted-foreground focus:border-accent focus:outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <a href="#" className="text-accent hover:text-accent/80">
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Google', icon: '🔵' },
                  { label: 'Discord', icon: '💜' },
                  { label: 'Twitter', icon: '𝕏' },
                ].map((social) => (
                  <Button
                    key={social.label}
                    type="button"
                    variant="outline"
                    className="border-border hover:bg-muted"
                  >
                    <span className="text-lg">{social.icon}</span>
                  </Button>
                ))}
              </div>
            </form>

            {/* Sign Up Link */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="font-semibold text-accent hover:text-accent/80">
                Sign up now
              </a>
            </p>
          </Card>

          {/* Info Section */}
          <div className="rounded-lg bg-accent/5 border border-accent/20 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">Demo Credentials:</p>
            <p>Email: demo@cubenexus.com</p>
            <p>Password: demo123</p>
          </div>
        </div>
      </div>
    </main>
  );
}
