'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { parseJwt } from '@/lib/api/config';
import { toast } from '@/lib/toast';

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

// ─── Login Form ─────────────────────────────────────────────────
// Left-side form panel (within a rounded white card on desktop)
// using dark navy text, yellow accent branding, and a minimal light-gray page background.

/** Map Vietnamese BE error messages to user-friendly English */
function mapErrorMessage(msg: string): string {
  if (!msg) return 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
  if (msg.includes('Email hoặc mật khẩu không đúng'))
    return 'Tên đăng nhập hoặc mật khẩu không chính xác.';
  if (msg.includes('bị vô hiệu hóa'))
    return 'Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.';
  if (msg.includes('bị cấm'))
    return msg;
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch'))
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  return msg;
}

/** Validate email format */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ── Validate email ──
  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!isValidEmail(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // ── Handle form submission ──
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const isEmailValid = validateEmail(email);
    if (!password) {
      setError('Mật khẩu không được để trống');
      return;
    }
    if (!isEmailValid) return;

    setIsLoading(true);
    try {
      const res = await login({ email, password });
      const payload = parseJwt(res.accessToken);
      
      const role =
        (payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string) ||
        (payload?.['role'] as string) ||
        (res as any)?.role ||
        '';

      toast.success('Đăng nhập thành công!', `Chào mừng quay trở lại, ${res.displayName || email}!`);

      const upperRole = role.toUpperCase();
      if (upperRole === 'ADMIN') {
        router.push('/admin');
      } else if (upperRole === 'MANAGER') {
        router.push('/managertournaments');
      } else if (upperRole === 'JUDGE') {
        const assignedId = (res as any).assignedTournamentId || (payload?.['tournament_id'] as string);
        const judgeRole = (res as any).judgeRoleCode;
        const stationNum = (res as any).assignedStationNumber;
        if (assignedId) {
          if (judgeRole === 'CHECKIN_JUDGE') {
            router.push(`/managertournaments/${assignedId}/checkin`);
          } else if (stationNum) {
            router.push(`/managertournaments/${assignedId}/live?station=${stationNum}`);
          } else {
            router.push(`/managertournaments/${assignedId}`);
          }
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      const mapped = mapErrorMessage(message);
      setError(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared input styles ──
  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 44px 13px 42px',
    borderRadius: 12,
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: 'rgba(15, 23, 42, 0.12)',
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

  const inputErrorStyle: React.CSSProperties = {
    borderColor: '#ef4444',
    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.12)',
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
        background: 'var(--background)', // Matches landing page background
        overflowY: 'auto',
      }}
    >
      {/* Rounded Login Card */}
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          border: '1px solid rgba(15, 23, 42, 0.05)',
          animationDelay: '0.15s',
        }}
      >
        {/* Mobile logo (hidden on desktop) */}
        <div id="login-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: 12, marginBottom: 28 }}>
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

        {/* ── Heading ── */}
        <div style={{ marginBottom: 28 }}>
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
              Welcome back
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
            Sign in to your account
          </h2>
          <p
            style={{
              fontSize: 14,
              color: '#475569',
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Enter your credentials to access the arena
          </p>
        </div>

        {/* ── Login Form ── */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="login-email" style={labelStyle}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={iconStyle(emailFocused)} />
              <input
                id="login-email"
                type="email"
                style={{
                  ...inputBaseStyle,
                  ...(emailFocused ? inputFocusedStyle : {}),
                  ...(emailError ? inputErrorStyle : {}),
                }}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                  if (error) setError('');
                }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => {
                  setEmailFocused(false);
                  if (email) validateEmail(email);
                }}
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>
            {emailError && (
              <p
                className="animate-slide-up"
                style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}
              >
                {emailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="login-password" style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={iconStyle(passwordFocused)} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                style={{
                  ...inputBaseStyle,
                  ...(passwordFocused ? inputFocusedStyle : {}),
                  ...(error ? inputErrorStyle : {}),
                }}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Enter your password"
                autoComplete="current-password"
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

            {/* Inline Error Message directly under Password input box */}
            {error && (
              <div
                className="animate-slide-up"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  marginTop: 6,
                  color: '#ef4444',
                  fontSize: 12.5,
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Remember & Forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  width: 18,
                  height: 18,
                  border: '1.5px solid rgba(15, 23, 42, 0.15)',
                  borderRadius: 5,
                  background: rememberMe ? '#ffb703' : '#ffffff',
                  borderColor: rememberMe ? '#ffb703' : 'rgba(15, 23, 42, 0.15)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
              {rememberMe && (
                <span style={{
                  position: 'absolute',
                  left: 5,
                  fontSize: 11,
                  fontWeight: 900,
                  color: '#0f172a',
                  pointerEvents: 'none',
                }}>✓</span>
              )}
              <span style={{ fontSize: 13.5, color: '#475569' }}>Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              style={{
                fontSize: 13.5,
                color: '#e07a00',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #ffb703, #e07a00)',
              color: '#0f172a', // Dark navy text on yellow button for high contrast & premium look
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
                Signing in...
              </>
            ) : (
              <>
                Sign In
               
              </>
            )}
          </button>
        </form>

        {/* ── Divider ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(15, 23, 42, 0.08)' }} />
          <span style={{ fontSize: 11.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', fontWeight: 600 }}>
            Or continue with
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(15, 23, 42, 0.08)' }} />
        </div>

        {/* ── Social Buttons ── */}
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

        {/* ── Sign up link ── */}
        <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 28 }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            style={{ color: '#e07a00', fontWeight: 700, textDecoration: 'none' }}
          >
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}
