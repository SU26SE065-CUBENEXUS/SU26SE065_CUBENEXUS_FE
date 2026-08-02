'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user: authUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
      toast.error('Vui lòng đăng nhập để xem thông tin cá nhân');
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
      toast.error(err.message || 'Không thể tải thông tin hồ sơ');
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
      toast.error('Tên hiển thị không được bỏ trống');
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
      toast.success('Cập nhật hồ sơ cá nhân thành công!');
    } catch (err: any) {
      console.error('Update profile error:', err);
      toast.error(err.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Upload avatar
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      toast.info('Đang tải ảnh lên Cloudflare R2...');
      const updated = await uploadAvatarApi(file);
      setProfile(updated);
      toast.success('Đổi ảnh đại diện thành công!');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast.error(err.message || 'Tải ảnh đại diện thất bại');
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không trùng khớp');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePasswordApi({
        currentPassword,
        newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Change password error:', err);
      toast.error(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Copy User Code to clipboard
  const handleCopyCode = () => {
    if (!profile?.userCode) return;
    navigator.clipboard.writeText(profile.userCode);
    setIsCopied(true);
    toast.success('Đã sao chép mã thí sinh!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isAuthLoading || isLoadingProfile) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Đang tải thông tin hồ sơ...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
      {/* Soft background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[140px] pointer-events-none" />
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
              Trang Chủ
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
              Hồ Sơ Cá Nhân <Sparkles className="h-6 w-6 text-amber-500" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Quản lý thông tin tài khoản, ảnh đại diện và bảo mật hệ thống CubeNexus.
            </p>
          </div>

          {/* Quick Manager Button if Manager */}
          {profile?.userRole === 'MANAGER' && (
            <Link
              href="/managertournaments"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-2xs cursor-pointer"
            >
              <Shield className="h-4 w-4" /> Manager Portal
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar & Summary Card */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs text-center relative overflow-hidden">
              <div className="relative inline-block mx-auto mb-4 group">
                <div className="h-28 w-28 rounded-full border-4 border-indigo-100 bg-indigo-50 overflow-hidden flex items-center justify-center text-2xl font-black text-indigo-700 shadow-md">
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
                  <Shield className="h-3 w-3" /> {profile?.userRole || 'COMPETITOR'}
                </span>
                {profile?.userCode && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    title="Bấm để sao chép Mã thí sinh"
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

            {/* Quick System Info Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thông tin hệ thống
              </h3>
              <div className="space-y-2 text-xs font-medium text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>ID Tài Khoản</span>
                  <span className="font-mono text-slate-900 text-[11px]">
                    {profile?.id?.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Trạng Thái Token</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                    Đã Xác Thực
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Quyền Hạn Hợp Lệ</span>
                  <span className="font-bold text-slate-900">{profile?.userRole}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Edit & Security Forms */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Personal Details Form */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Thông Tin Cá Nhân</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Cập nhật tên hiển thị, số điện thoại và địa chỉ liên lạc.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Display Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Tên Hiển Thị <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Nhập tên hiển thị..."
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Email (Readonly) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Email Trực Tuyến
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
                      Số Điện Thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Nhập số điện thoại..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* User Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Mã Số Thí Sinh
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
                    Địa Chỉ Liên Hệ
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Nhập địa chỉ của bạn..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
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
                        <Save className="h-4 w-4" /> Lưu Thay Đổi
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Security / Change Password Form */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Đổi Mật Khẩu</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Cập nhật mật khẩu bảo vệ tài khoản định kỳ.
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
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
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-amber-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
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

      <Footer />
    </div>
  );
}
