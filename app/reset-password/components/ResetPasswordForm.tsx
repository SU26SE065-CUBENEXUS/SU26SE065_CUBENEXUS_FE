'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Sparkles, Loader2, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { resetPasswordApi } from '@/lib/api/auth';
import { toast } from '@/lib/toast';


// ─── Reset Password Form Component ──────────────────────────────
// Component for resetting passwords, featuring email and token detection,
// validation check for matching passwords, loading, error, and success screens.

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get token and email from URL
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateNewPassword = (val: string): boolean => {
    if (!val) {
      setNewPasswordError('New password is required');
      return false;
    }
    if (val.length < 6) {
      setNewPasswordError('Password must be at least 6 characters');
      return false;
    }
    setNewPasswordError('');
    return true;
  };

  const validateConfirmPassword = (val: string): boolean => {
    if (!val) {
      setConfirmPasswordError('Please confirm your new password');
      return false;
    }
    if (val !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleResetPassword = async () => {
    setError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setSuccessMessage('');

    if (!email || !token) {
      setError('Invalid link. Email or token is missing from the URL.');
      return;
    }

    const isPassValid = validateNewPassword(newPassword);
    const isConfirmValid = validateConfirmPassword(confirmNewPassword);

    if (!isPassValid || !isConfirmValid) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPasswordApi({
        email,
        otp: token,
        newPassword,
        confirmNewPassword,
      });
      const successMsg = response.message || 'Password reset successful.';
      setSuccessMessage(successMsg);
      toast.success(successMsg, 'You can now log in with your new password.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      const userFriendlyMsg = message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('fetch')
        ? 'Unable to connect to server. Please check your connection.'
        : message;
      setError(userFriendlyMsg);
      toast.error('Password reset failed', userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared input styles ──
  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 44px 13px 42px',
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

  // If email or token are missing, show immediate warning layout
  const missingParams = !email || !token;

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
      {/* Rounded Recovery Card */}
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
        {successMessage ? (
          /* Success Screen */
          <div style={{ textAlign: 'center', padding: '10px 0' }} className="animate-slide-up">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.08)',
                color: '#10b981',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle size={32} />
            </div>
            <h3
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: 10,
                letterSpacing: '-0.02em',
              }}
            >
              Password Reset
            </h3>
            <p
              style={{
                fontSize: 14.5,
                color: '#475569',
                lineHeight: 1.6,
                marginBottom: 28,
              }}
            >
              {successMessage}
            </p>
            <Link
              href="/login"
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #ffb703, #e07a00)',
                color: '#0f172a',
                fontSize: 15.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(224, 122, 0, 0.2)',
              }}
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </div>
        ) : (
          /* Form Screen */
          <>
            {/* Heading */}
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
                  Create New Password
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
                Reset password
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: '#475569',
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                {missingParams
                  ? 'The password reset link is invalid or incomplete. Please request a new one.'
                  : `Resetting password for ${email}. Enter your new credentials below.`}
              </p>
            </div>

            {/* Error Banner */}
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

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }} noValidate>
              {/* New Password */}
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="new-password" style={labelStyle}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={iconStyle(newPasswordFocused)} />
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    style={{
                      ...inputBaseStyle,
                      ...(newPasswordFocused ? inputFocusedStyle : {}),
                      ...(newPasswordError ? inputErrorStyle : {}),
                    }}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (newPasswordError) validateNewPassword(e.target.value);
                      if (error) setError('');
                    }}
                    onFocus={() => setNewPasswordFocused(true)}
                    onBlur={() => {
                      setNewPasswordFocused(false);
                      if (newPassword) validateNewPassword(newPassword);
                    }}
                    placeholder="Min 6 characters"
                    required
                    disabled={isLoading || missingParams}
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
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    disabled={missingParams}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {newPasswordError && (
                  <p
                    className="animate-slide-up"
                    style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}
                  >
                    {newPasswordError}
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="confirm-new-password" style={labelStyle}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={iconStyle(confirmPasswordFocused)} />
                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    style={{
                      ...inputBaseStyle,
                      ...(confirmPasswordFocused ? inputFocusedStyle : {}),
                      ...(confirmPasswordError ? inputErrorStyle : {}),
                    }}
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      if (confirmPasswordError) validateConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    onFocus={() => setNewPasswordFocused(true)}
                    onBlur={() => {
                      setNewPasswordFocused(false);
                      if (confirmNewPassword) validateConfirmPassword(confirmNewPassword);
                    }}
                    placeholder="Repeat new password"
                    required
                    disabled={isLoading || missingParams}
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    disabled={missingParams}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p
                    className="animate-slide-up"
                    style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}
                  >
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || missingParams}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: missingParams ? '#cbd5e1' : 'linear-gradient(135deg, #ffb703, #e07a00)',
                  color: missingParams ? '#64748b' : '#0f172a',
                  fontSize: 15.5,
                  fontWeight: 700,
                  cursor: (isLoading || missingParams) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: isLoading ? 0.75 : 1,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  letterSpacing: '0.01em',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: missingParams ? 'none' : '0 4px 14px rgba(224, 122, 0, 0.2)',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Reset Password
                  </>
                )}
              </button>
            </form>

            {/* Back to Login Link */}
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#e07a00',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: 14,
                  transition: 'color 0.2s',
                }}
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
