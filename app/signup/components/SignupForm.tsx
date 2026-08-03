'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { registerApi } from '@/lib/api/auth';
import { toast } from '@/lib/toast';
import { Mail, Lock, User, Globe, Eye, EyeOff, Sparkles, Loader2, ArrowRight, ChevronDown, ArrowLeft, AlertCircle } from 'lucide-react';


// ─── Signup Form Component ───────────────────────────────────────
// Clean, isolated component for the registration form card, featuring
// input focus rings, validation handlers, custom select dropdown styles,
// and matching social buttons.

export default function SignupForm() {
  const router = useRouter();
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
  const [error, setError] = useState('');

  // Field focus states for interactive border color changes
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [countryFocused, setCountryFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name) {
      setError('Full name is required');
      return;
    }
    if (!formData.email) {
      setError('Email is required');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }

    setIsLoading(true);
    try {
      await registerApi({
        email: formData.email,
        password: formData.password,
        displayName: formData.name,
      });
      toast.success('Đăng ký tài khoản thành công!', 'Bạn đã có thể đăng nhập ngay bây giờ.');
      router.push('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast.error('Đăng ký thất bại', message);
    } finally {
      setIsLoading(false);
    }
  };

  const countries = [
    '🇯🇵 Japan', '🇨🇳 China', '🇺🇸 United States', '🇰🇷 Korea', '🇧🇷 Brazil',
    '🇩🇪 Germany', '🇷🇺 Russia', '🇲🇽 Mexico', '🇮🇳 India', '🇦🇺 Australia',
  ];

  // ── Shared input styles ──
  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 42px 12px 42px',
    borderRadius: 12,
    border: '1.5px solid rgba(15, 23, 42, 0.12)',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: 15,
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const inputFocusedStyle: React.CSSProperties = {
    borderColor: '#ffb703',
    boxShadow: '0 0 0 3px rgba(255, 183, 3, 0.15)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: 6,
  };

  const iconStyle = (focused: boolean): React.CSSProperties => ({
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: focused ? '#ff9e00' : '#64748b',
    transition: 'color 0.3s',
    pointerEvents: 'none',
    zIndex: 2,
  });

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--background)',
        overflowY: 'auto',
      }}
    >
      {/* Rounded Signup Card */}
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#ffffff',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          border: '1px solid rgba(15, 23, 42, 0.05)',
          animationDelay: '0.15s',
        }}
      >
        {/* Mobile logo (hidden on desktop) */}
        <div id="signup-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Image
              src="/logoCube.png"
              alt="CubeNexus"
              width={38}
              height={38}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            CubeNexus
          </span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={18} style={{ color: '#ff9e00' }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#ff9e00',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Join the Arena
            </span>
          </div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Create your account
          </h2>
          <p
            style={{
              fontSize: 14,
              color: '#475569',
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            Sign up to start competing and tracking your progress
          </p>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div
            className="animate-shake"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              fontSize: 13.5,
              lineHeight: 1.5,
              marginBottom: 20,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSignup} noValidate>
          {/* Full Name */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="signup-name" style={labelStyle}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={iconStyle(nameFocused)} />
              <input
                id="signup-name"
                type="text"
                style={{
                  ...inputBaseStyle,
                  ...(nameFocused ? inputFocusedStyle : {}),
                }}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email Address */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="signup-email" style={labelStyle}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={iconStyle(emailFocused)} />
              <input
                id="signup-email"
                type="email"
                style={{
                  ...inputBaseStyle,
                  ...(emailFocused ? inputFocusedStyle : {}),
                }}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Country Selection */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="signup-country" style={labelStyle}>Country</label>
            <div style={{ position: 'relative' }}>
              <Globe size={18} style={iconStyle(countryFocused)} />
              <select
                id="signup-country"
                style={{
                  ...inputBaseStyle,
                  ...(countryFocused ? inputFocusedStyle : {}),
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                onFocus={() => setCountryFocused(true)}
                onBlur={() => setCountryFocused(false)}
                required
                disabled={isLoading}
              >
                <option value="" style={{ color: '#64748b' }}>Select your country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown
                size={16}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="signup-password" style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={iconStyle(passwordFocused)} />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                style={{
                  ...inputBaseStyle,
                  ...(passwordFocused ? inputFocusedStyle : {}),
                }}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 6,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="signup-confirm-password" style={labelStyle}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={iconStyle(confirmPasswordFocused)} />
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                style={{
                  ...inputBaseStyle,
                  ...(confirmPasswordFocused ? inputFocusedStyle : {}),
                }}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Terms of Service Checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  width: 18,
                  height: 18,
                  border: '1.5px solid rgba(15, 23, 42, 0.15)',
                  borderRadius: 5,
                  background: agreedToTerms ? '#ffb703' : '#ffffff',
                  borderColor: agreedToTerms ? '#ffb703' : 'rgba(15, 23, 42, 0.15)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  position: 'relative',
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
              {agreedToTerms && (
                <span style={{
                  position: 'absolute',
                  fontSize: 11,
                  fontWeight: 950,
                  color: '#0f172a',
                  pointerEvents: 'none',
                  marginTop: -2,
                }}>✓</span>
              )}
              <span style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.4 }}>
                I agree to the{' '}
                <Link href="#" style={{ color: '#e07a00', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="#" style={{ color: '#e07a00', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #ffb703, #e07a00)',
              color: '#0f172a',
              fontSize: 15.5,
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isLoading ? 0.75 : 1,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              letterSpacing: '0.01em',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(224, 122, 0, 0.2)',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(15, 23, 42, 0.08)' }} />
          <span style={{ fontSize: 11.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', fontWeight: 600 }}>
            Or sign up with
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(15, 23, 42, 0.08)' }} />
        </div>

        {/* Social Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 16px',
              borderRadius: 12,
              border: '1.5px solid rgba(15, 23, 42, 0.08)',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 16px',
              borderRadius: 12,
              border: '1.5px solid rgba(15, 23, 42, 0.08)',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2">
              <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/>
            </svg>
            Discord
          </button>
        </div>

        {/* Sign in link with back arrow */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: '#e07a00',
              fontWeight: 750,
              textDecoration: 'none',
              fontSize: 14,
              transition: 'color 0.2s',
            }}
          >
            <ArrowLeft size={16} />
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
