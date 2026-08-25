'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { registerApi } from '@/lib/api/auth';
import { toast } from '@/lib/toast';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Loader2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';


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
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');

  // Field focus states for interactive border color changes
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
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
