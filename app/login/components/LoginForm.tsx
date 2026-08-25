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
