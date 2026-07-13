'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Sparkles, Loader2, ArrowLeft, AlertCircle, CheckCircle, Lock, Key, Eye, EyeOff } from 'lucide-react';
import { forgotPasswordApi, verifyOtpApi, resetPasswordApi } from '@/lib/api/auth';
import { toast } from '@/lib/toast';


// ─── Forgot Password Form Component ──────────────────────────────
// Modular component for password recovery, featuring:
// 1. Email request (send OTP)
// 2. OTP verification (validate OTP code)
// 3. New password creation
// 4. Success screen

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: Verify OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Field states
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Step 2 states (OTP Verification)
  const [otp, setOtp] = useState('');
  const [otpFocused, setOtpFocused] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Step 3 states (New Password)
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validateOtp = (value: string): boolean => {
    if (!value) {
      setOtpError('OTP is required');
      return false;
    }
    if (!/^\d{6}$/.test(value)) {
      setOtpError('OTP must be exactly 6 digits');
      return false;
    }
    setOtpError('');
    return true;
  };

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
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (val !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleRequestOtp = async () => {
    setError('');
    setEmailError('');

    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPasswordApi({ email });
      if (response.devOtp) {
        setDevOtp(response.devOtp);
      }
      toast.success('OTP sent successfully!', 'Please check your email.');
      setStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      const userFriendlyMsg = message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('fetch')
        ? 'Unable to connect to server. Please check your connection.'
        : message;
      setError(userFriendlyMsg);
      toast.error('Failed to send OTP', userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setOtpError('');

    if (!validateOtp(otp)) {
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtpApi({ email, otp });
      toast.success('OTP verified successfully!', 'Please set your new password.');
      setStep(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      const userFriendlyMsg = message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('fetch')
        ? 'Unable to connect to server. Please check your connection.'
        : message;
      setError(userFriendlyMsg);
      toast.error('OTP verification failed', userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    const isPassValid = validateNewPassword(newPassword);
    const isConfirmValid = validateConfirmPassword(confirmPassword);

    if (!isPassValid || !isConfirmValid) {
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordApi({
        email,
        otp,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      toast.success('Password reset successful!', 'You can now log in with your new password.');
      setStep(4);
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
        {step === 4 ? (
          /* Step 4: Success Screen */
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
              Your password has been reset successfully. You can now sign in with your new password.
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
        ) : step === 3 ? (
          /* Step 3: Enter New Password */
          <>
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
                  New Password
                </span>
              </div>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Set New Password
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: '#475569',
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                Create a strong new password for your account <strong>{email}</strong>.
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

            {/* Step 3 Form */}
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
                    placeholder="At least 6 characters"
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
                    }}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
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

              {/* Confirm Password */}
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="confirm-password" style={labelStyle}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={iconStyle(confirmPasswordFocused)} />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    style={{
                      ...inputBaseStyle,
                      ...(confirmPasswordFocused ? inputFocusedStyle : {}),
                      ...(confirmPasswordError ? inputErrorStyle : {}),
                    }}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) validateConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => {
                      setConfirmPasswordFocused(false);
                      if (confirmPassword) validateConfirmPassword(confirmPassword);
                    }}
                    placeholder="Repeat new password"
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
                    }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
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

              {/* Submit Reset */}
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
                  boxShadow: '0 4px 14px rgba(224, 122, 0, 0.2)',
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
          </>
        ) : step === 2 ? (
          /* Step 2: Verify OTP */
          <>
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
                  Verify OTP
                </span>
              </div>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Enter OTP Code
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: '#475569',
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                Enter the 6-digit OTP code sent to <strong>{email}</strong> to verify your request.
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

            {/* Step 2 Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} noValidate>
              {/* OTP Input */}
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="otp" style={labelStyle}>6-Digit OTP Code</label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={iconStyle(otpFocused)} />
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    style={{
                      ...inputBaseStyle,
                      ...(otpFocused ? inputFocusedStyle : {}),
                      ...(otpError ? inputErrorStyle : {}),
                      letterSpacing: '0.3em',
                      fontWeight: 'bold',
                      fontSize: 16,
                    }}
                    value={otp}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, '');
                      setOtp(cleanVal);
                      if (otpError) validateOtp(cleanVal);
                      if (error) setError('');
                    }}
                    onFocus={() => setOtpFocused(true)}
                    onBlur={() => {
                      setOtpFocused(false);
                      validateOtp(otp);
                    }}
                    placeholder="000000"
                    required
                    disabled={isLoading}
                  />
                </div>
                {otpError && (
                  <p
                    className="animate-slide-up"
                    style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}
                  >
                    {otpError}
                  </p>
                )}
              </div>

              {/* Submit Verification */}
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
                  boxShadow: '0 4px 14px rgba(224, 122, 0, 0.2)',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    Verify OTP
                  </>
                )}
              </button>
            </form>

            {/* Back Button step 1 */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ArrowLeft size={14} /> Back to email entry
              </button>
            </div>
          </>
        ) : (
          /* Step 1: Form Screen (Request OTP) */
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
                  Password Recovery
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
                Forgot password?
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: '#475569',
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                Enter the email address associated with your account and we&apos;ll send you a 6-digit OTP code to reset your password.
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

            {/* Recovery Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleRequestOtp(); }} noValidate>
              {/* Email field */}
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="recovery-email" style={labelStyle}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={iconStyle(emailFocused)} />
                  <input
                    id="recovery-email"
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
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP Code
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
