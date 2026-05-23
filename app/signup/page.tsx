'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Mail, Lock, User, Globe, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSignup = () => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`Account created for ${formData.name}`);
    }, 1000);
  };

  const countries = [
    '🇯🇵 Japan', '🇨🇳 China', '🇺🇸 United States', '🇰🇷 Korea', '🇧🇷 Brazil',
    '🇩🇪 Germany', '🇷🇺 Russia', '🇲🇽 Mexico', '🇮🇳 India', '🇦🇺 Australia',
  ];

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
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Join CubeNexus</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your account and start competing
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-border p-8">
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-accent focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-accent focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Country Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Country
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-foreground focus:border-accent focus:outline-none transition-colors appearance-none"
                    required
                  >
                    <option value="">Select your country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
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
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-10 py-2.5 text-foreground placeholder-muted-foreground focus:border-accent focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 rounded border-border"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the{' '}
                  <a href="#" className="text-accent hover:text-accent/80 font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-accent hover:text-accent/80 font-medium">
                    Privacy Policy
                  </a>
                </span>
              </label>

              {/* Sign Up Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">Or sign up with</span>
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

            {/* Sign In Link */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/login" className="font-semibold text-accent hover:text-accent/80">
                Sign in
              </a>
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
