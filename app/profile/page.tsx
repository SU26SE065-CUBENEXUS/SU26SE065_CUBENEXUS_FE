'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/contexts/auth-context';
import {
  getMyProfileApi,
  updateProfileApi,
  uploadAvatarApi,
  changePasswordApi,
} from '@/lib/api/auth';
import type { UserProfileDto } from '@/lib/api/types';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Camera,
  Key,
  Copy,
  Check,
  Save,
  Loader2,
  Lock,
  ArrowLeft,
  Sparkles,
  FileBadge,
  LayoutDashboard,
  Trophy,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser, isAuthenticated, isLoading: isAuthLoading, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Copy code feedback
  const [isCopied, setIsCopied] = useState(false);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast.error('Please log in to view profile details');
      router.push('/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Load profile data from API
  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const data = await getMyProfileApi();
      setProfile(data);
      setDisplayName(data.displayName || '');
      setPhone(data.phone || '');
      setAddress(data.address || '');
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      toast.error(err.message || 'Failed to load profile details');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated]);

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    try {
      setIsSavingProfile(true);
      const updated = await updateProfileApi({
        displayName: displayName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setProfile(updated);
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error('Update profile error:', err);
      toast.error(err.message || 'Profile update failed');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Upload avatar
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size cannot exceed 5MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      toast.info('Uploading avatar...');
      const updated = await uploadAvatarApi(file);
      setProfile(updated);
      await refreshUser();
      toast.success('Avatar updated successfully!');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast.error(err.message || 'Avatar upload failed');
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password confirmation does not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePasswordApi({
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Change password error:', err);
      toast.error(err.message || 'Password change failed');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Copy User Code to clipboard
  const handleCopyCode = () => {
    if (!profile?.userCode) return;
    navigator.clipboard.writeText(profile.userCode);
    setIsCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const role = (profile?.userRole || authUser?.role || 'COMPETITOR').toUpperCase();
  const isManagerOrAdmin = role === 'MANAGER' || role === 'ADMIN';

  if (isAuthLoading || isLoadingProfile) {
    return (
      <div className={`flex flex-col min-h-screen ${isManagerOrAdmin ? 'bg-slate-100' : 'bg-slate-50'} text-slate-900`}>
        {!isManagerOrAdmin && <Header />}
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className={`h-9 w-9 animate-spin ${isManagerOrAdmin ? 'text-indigo-600' : 'text-amber-500'}`} />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Loading profile information...
            </p>
          </div>
        </main>
        {!isManagerOrAdmin && <Footer />}
      </div>
    );
  }

  // =========================================================================
  // 1. MANAGER / ADMIN PROFILE UI (Indigo / Purple Workspace Theme)
  // =========================================================================
  if (isManagerOrAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-100 text-slate-900 font-sans">

        {/* Top Navigation Bar for Manager Workspace */}
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-2xs">
          <div className="flex items-center gap-4">
            <Link href="/managertournaments" className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-1">
                <Image src="/logoCube.png" alt="CubeNexus" width={24} height={24} className="object-contain" priority />
              </div>
              <div className="leading-none">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[13px] font-extrabold tracking-tight text-slate-900">CUBE</span>
                  <span className="text-[13px] font-extrabold tracking-tight text-indigo-600">NEXUS</span>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  {role === 'ADMIN' ? 'Admin Workspace' : 'Manager Workspace'}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/managertournaments"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
            >
              <Trophy className="h-3.5 w-3.5" /> Quản Lý Giải Đấu
            </Link>

            {/* Profile Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsManagerDropdownOpen(true)}
              onMouseLeave={() => setIsManagerDropdownOpen(false)}
            >
              <button className="flex items-center gap-2 rounded-lg px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-indigo-600 text-white overflow-hidden shrink-0">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
                  ) : (
                    (profile?.displayName || 'M').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-bold text-slate-900 hidden sm:inline">{profile?.displayName}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {isManagerDropdownOpen && (
                <div className="absolute right-0 top-full pt-1 z-50">
                  <div className="w-52 rounded-xl p-1.5 bg-white border border-slate-200 shadow-xl">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{profile?.displayName}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{profile?.email}</p>
                      <span className="mt-1 inline-block rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {role}
                      </span>
                    </div>
                    <div className="mt-1">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Log Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area for Manager / Admin */}
        <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">

          {/* Header Title Bar */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/managertournaments"
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors group"
                >
                  <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                  Manager Portal
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold text-slate-500">Hồ Sơ Quản Trị</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
                Hồ Sơ Ban Tổ Chức <Shield className="h-6 w-6 text-indigo-600" />
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Quản lý thông tin cá nhân, ảnh đại diện và mật khẩu tài khoản quản trị hệ thống CubeNexus.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-extrabold uppercase text-white shadow-2xs">
                <Shield className="h-4 w-4" /> {role} ACCOUNT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Avatar & Summary Card */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs text-center relative overflow-hidden">
                <div className="relative inline-block mx-auto mb-4 group">
                  <div className="h-28 w-28 rounded-full border-4 border-indigo-100 bg-indigo-50 overflow-hidden flex items-center justify-center text-2xl font-black text-indigo-700 shadow-md">
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (profile?.displayName || 'MN').slice(0, 2).toUpperCase()
                    )}
                  </div>

                  {/* Upload Button overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
                    title="Thay đổi ảnh đại diện"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </div>

                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {profile?.displayName}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{profile?.email}</p>

                {/* Badges */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-[10px] font-extrabold uppercase text-indigo-700">
                    <Shield className="h-3 w-3" /> {role}
                  </span>
                  {profile?.userCode && (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                      title="Bấm để sao chép Mã quản trị"
                    >
                      <FileBadge className="h-3 w-3 text-indigo-600" />
                      <span>Code: {profile.userCode}</span>
                      {isCopied ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* System info */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Thông tin phiên quản trị
                </h3>
                <div className="space-y-2 text-xs font-medium text-slate-600">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span>Mã Định Danh</span>
                    <span className="font-mono text-slate-900 text-[11px]">
                      {profile?.id?.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span>Trạng Thái Quyền</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                      Quản Trị Viên Hợp Lệ
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Cấp Độ Quyền</span>
                    <span className="font-bold text-indigo-700">{role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Forms */}
            <div className="lg:col-span-2 space-y-6">

              {/* Personal Details Form (Indigo Theme) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Thông Tin Ban Tổ Chức</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Cập nhật tên hiển thị, số điện thoại công tác và địa chỉ liên lạc.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                    {/* Display Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Tên Hiển Thị Quản Trị <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Nhập tên hiển thị..."
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Email (Readonly) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Email Quản Trị
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          value={profile?.email || ''}
                          readOnly
                          disabled
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Số Điện Thoại Liên Hệ
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Nhập số điện thoại..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* User Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Mã Số Quản Trị
                      </label>
                      <div className="relative">
                        <FileBadge className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={profile?.userCode || ''}
                          readOnly
                          disabled
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Địa Chỉ Công Tác
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Nhập địa chỉ công tác..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Lưu Hồ Sơ Quản Trị
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security / Password Form (Indigo Theme) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Bảo Mật Mật Khẩu Quản Trị</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Đổi mật khẩu tài khoản quản trị định kỳ để đảm bảo an toàn hệ thống.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Mật Khẩu Hiện Tại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Mật Khẩu Mới <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự..."
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Xác Nhận Mật Khẩu Mới <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới..."
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Change Password Submit */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4" /> Đổi Mật Khẩu
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // 2. COMPETITOR / NORMAL USER PROFILE UI (Amber / Orange Theme with Public Header/Footer)
  // =========================================================================
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
      {/* Background glow tailored for User/Competitor amber theme */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-10 sm:px-6 lg:px-8 relative z-10">

        {/* Navigation & Header Title */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors group mb-2"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Home
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
              User Profile <Sparkles className="h-6 w-6 text-amber-500" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Manage competitor account info, avatar, and CubeNexus system security.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Avatar & Summary Card */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs text-center relative overflow-hidden">
              <div className="relative inline-block mx-auto mb-4 group">
                <div className="h-28 w-28 rounded-full border-4 border-amber-100 bg-amber-50 overflow-hidden flex items-center justify-center text-2xl font-black text-amber-600 shadow-md">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (profile?.displayName || 'CN').slice(0, 2).toUpperCase()
                  )}
                </div>

                {/* Upload Button overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg hover:bg-amber-600 transition cursor-pointer disabled:opacity-50"
                  title="Change avatar"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </div>

              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {profile?.displayName}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{profile?.email}</p>

              {/* Badges */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-extrabold uppercase text-amber-700">
                  <User className="h-3 w-3" /> COMPETITOR
                </span>
                {profile?.userCode && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    title="Click to copy competitor code"
                  >
                    <FileBadge className="h-3 w-3 text-amber-600" />
                    <span>Code: {profile.userCode}</span>
                    {isCopied ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Quick System Info Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Competitor Information
              </h3>
              <div className="space-y-2 text-xs font-medium text-slate-600">
                {/* <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Competitor ID</span>
                  <span className="font-mono text-slate-900 text-[11px]">
                    {profile?.id?.slice(0, 8)}...
                  </span>
                </div> */}
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Account Status</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                    Verified
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>System Role</span>
                  <span className="font-bold text-amber-600">COMPETITOR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Edit & Security Forms */}
          <div className="lg:col-span-2 space-y-8">

            {/* Personal Details Form (Amber Theme) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Update display name, phone number, and contact address.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Display Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter display name..."
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Email (Readonly) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={profile?.email || ''}
                        readOnly
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* User Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Competitor Code
                    </label>
                    <div className="relative">
                      <FileBadge className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={profile?.userCode || ''}
                        readOnly
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Contact Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your address..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition resize-none"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-2.5 text-xs font-bold text-white transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Security / Change Password Form (Amber Theme) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Update password periodically to protect your account.
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters..."
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password..."
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Change Password Submit */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-2.5 text-xs font-bold text-white transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" /> Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
