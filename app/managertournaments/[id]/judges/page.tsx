'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { toast } from '@/lib/toast';
import {
  getTournamentById,
  getTournamentJudges,
  createTournamentJudge,
  batchCreateTournamentJudges,
  updateTournamentJudge,
  resetTournamentJudgePassword,
  deleteTournamentJudge,
  shuffleTournamentJudges,
  toggleJudgeStatus,
  deactivateAllJudges,
  activateAllJudges,
} from '@/lib/api/tournaments';
import type {
  TournamentDetailDto,
  TournamentJudgeDto,
} from '@/lib/api/types';
import {
  ChevronRight,
  Trophy,
  UserCheck,
  Loader2,
  AlertCircle,
  Plus,
  X,
  CheckCircle,
  Zap,
  Copy,
  Key,
  Pencil,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Sparkles,
  Share2,
  ShieldCheck,
  Shuffle,
  QrCode,
  Users,
  Lock,
  Unlock,
  PowerOff,
} from 'lucide-react';

export default function JudgeManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [judges, setJudges] = useState<TournamentJudgeDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CHECKIN' | 'STATION'>('ALL');

  // Modals state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showShuffleModal, setShowShuffleModal] = useState(false);
  const [judgeToDelete, setJudgeToDelete] = useState<TournamentJudgeDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states - Advanced Batch Allocation
  const [checkInCountInput, setCheckInCountInput] = useState('1');
  const [stationCountInput, setStationCountInput] = useState('5');
  const [judgesPerStationInput, setJudgesPerStationInput] = useState('2');
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [isShuffleSubmitting, setIsShuffleSubmitting] = useState(false);

  const [singleName, setSingleName] = useState('');
  const [singleUsername, setSingleUsername] = useState('');
  const [singlePassword, setSinglePassword] = useState('');
  const [singleRoleCode, setSingleRoleCode] = useState('STATION_JUDGE');
  const [singleStationNumber, setSingleStationNumber] = useState('');
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false);

  const [selectedJudge, setSelectedJudge] = useState<TournamentJudgeDto | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoleCode, setEditRoleCode] = useState('STATION_JUDGE');
  const [editStationNumber, setEditStationNumber] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [resetNewPassword, setResetNewPassword] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // Handover state (holds list of judges with plain-text passwords)
  const [handoverJudges, setHandoverJudges] = useState<TournamentJudgeDto[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isAllCopied, setIsAllCopied] = useState(false);

  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Calculation for Batch Create
  const checkInNum = Math.max(0, parseInt(checkInCountInput, 10) || 0);
  const stationNum = Math.max(0, parseInt(stationCountInput, 10) || 0);
  const perStationNum = Math.max(1, parseInt(judgesPerStationInput, 10) || 1);
  const calculatedTotal = checkInNum + (stationNum * perStationNum);

  // Load tournament and judges
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [tData, jData] = await Promise.all([
        getTournamentById(id),
        getTournamentJudges(id).catch(() => []),
      ]);
      setTournament(tData);
      setJudges(jData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tournament data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Handler: Advanced Batch Create
  const handleBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedTotal < 1) {
      toast.error('Invalid Configuration', 'Please select a judge count greater than 0.');
      return;
    }
    try {
      setIsBatchSubmitting(true);
      const newJudges = await batchCreateTournamentJudges(id, {
        checkInCount: checkInNum,
        stationCount: stationNum,
        judgesPerStation: perStationNum,
      });
      setShowBatchModal(false);
      setHandoverJudges(newJudges);
      setShowHandoverModal(true);
      toast.success('Batch Creation Success', `Successfully created ${newJudges.length} judge accounts.`);
      await loadData();
    } catch (err: any) {
      toast.error('Creation Failed', err?.message || 'Error creating batch judge accounts.');
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  // Handler: Shuffle / Randomize assignments
  const handleShuffle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedTotal > judges.length) {
      toast.error(
        'Over Capacity',
        `Total requested positions (${calculatedTotal}) cannot exceed the number of existing judges (${judges.length}). Please reduce inputs or create new judges.`
      );
      return;
    }
    try {
      setIsShuffleSubmitting(true);
      const updatedJudges = await shuffleTournamentJudges(id, {
        checkInCount: checkInNum,
        stationCount: stationNum,
        judgesPerStation: perStationNum,
      });
      setShowShuffleModal(false);
      await loadData();
      toast.success('Shuffle Completed', `Randomized assignments for ${updatedJudges.length} judges!`);
    } catch (err: any) {
      toast.error('Shuffle Failed', err?.message || 'Error shuffling judges.');
    } finally {
      setIsShuffleSubmitting(false);
    }
  };

  // Handler: Single Create
  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;
    try {
      setIsSingleSubmitting(true);
      const newJudge = await createTournamentJudge(id, {
        displayName: singleName.trim(),
        username: singleUsername.trim() || undefined,
        password: singlePassword.trim() || undefined,
      });
      setShowSingleModal(false);
      setSingleName('');
      setSingleUsername('');
      setSinglePassword('');
      setHandoverJudges([newJudge]);
      setShowHandoverModal(true);
      toast.success('Judge Created', `Account created for ${newJudge.displayName}`);
      await loadData();
    } catch (err: any) {
      toast.error('Creation Failed', err?.message || 'Error creating judge account.');
    } finally {
      setIsSingleSubmitting(false);
    }
  };

  // Handler: Edit Name
  const handleEditJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJudge || !editName.trim()) return;
    try {
      setIsEditSubmitting(true);
      await updateTournamentJudge(id, selectedJudge.userId, {
        displayName: editName.trim(),
      });
      setShowEditModal(false);
      setSelectedJudge(null);
      toast.success('Update Success', 'Judge information updated successfully.');
      await loadData();
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Error updating judge.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Handler: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJudge) return;
    try {
      setIsResetSubmitting(true);
      const updated = await resetTournamentJudgePassword(id, selectedJudge.userId, {
        newPassword: resetNewPassword.trim() || undefined,
      });
      setShowResetPasswordModal(false);
      setResetNewPassword('');
      setHandoverJudges([updated]);
      setShowHandoverModal(true);
      toast.success('Password Reset', `New password generated for ${updated.displayName}`);
      await loadData();
    } catch (err: any) {
      toast.error('Reset Failed', err?.message || 'Error resetting judge password.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // Handler: Delete
  const confirmDeleteJudge = async () => {
    if (!judgeToDelete) return;
    try {
      setIsDeleting(true);
      await deleteTournamentJudge(id, judgeToDelete.userId);
      toast.success('Judge Deleted', `Deleted account "${judgeToDelete.displayName}" from tournament.`);
      setJudgeToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error('Delete Failed', err?.message || 'Error deleting judge account.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler: Toggle individual judge active status
  const handleToggleJudgeStatus = async (j: TournamentJudgeDto) => {
    try {
      const currentActive = j.isActive ?? true;
      const updated = await toggleJudgeStatus(id, j.userId, !currentActive);
      setJudges((prev) =>
        prev.map((item) => (item.userId === j.userId ? { ...item, isActive: updated.isActive } : item))
      );
      toast.success(
        updated.isActive ? 'Activated' : 'Deactivated',
        `Account ${j.displayName} is now ${updated.isActive ? 'unlocked' : 'locked'}.`
      );
    } catch (err: any) {
      toast.error('Action Failed', err?.message || 'Failed to update judge status.');
    }
  };

  // Handler: Activate all judges for this tournament
  const handleActivateAllJudges = async () => {
    if (!window.confirm('Are you sure you want to activate ALL judge accounts for this tournament?')) return;
    try {
      const updatedJudges = await activateAllJudges(id);
      setJudges(updatedJudges);
      toast.success('All Judges Activated', 'All judge accounts are now active and ready for competition.');
    } catch (err: any) {
      toast.error('Action Failed', err?.message || 'Error activating all judges.');
    }
  };

  // Handler: Deactivate all judges for this tournament
  const handleDeactivateAllJudges = async () => {
    if (!window.confirm('Are you sure you want to deactivate ALL judge accounts for this tournament?')) return;
    try {
      const updatedJudges = await deactivateAllJudges(id);
      setJudges(updatedJudges);
      toast.success('All Judges Deactivated', 'All judge accounts have been locked.');
    } catch (err: any) {
      toast.error('Action Failed', err?.message || 'Error deactivating all judges.');
    }
  };

  // Role Badge Helper
  const renderRoleBadge = (j: TournamentJudgeDto) => {
    if (j.roleCode === 'CHECKIN_JUDGE') {
      return (
        <span className="inline-flex items-center rounded bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
          Check-in Desk
        </span>
      );
    }
    if (j.assignedStationNumber) {
      return (
        <span className="inline-flex items-center rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          Station #{j.assignedStationNumber}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
        Reserve Judge
      </span>
    );
  };

  // Copy all handover credentials formatted for chat/messenger/excel
  const copyAllHandover = () => {
    if (handoverJudges.length === 0) return;
    const tournamentName = tournament?.name || 'CubeNexus Tournament';
    let text = `[JUDGE CREDENTIALS - ${tournamentName.toUpperCase()}]\n`;
    text += `----------------------------------------\n\n`;

    const checkInJudges = handoverJudges.filter((j) => j.roleCode === 'CHECKIN_JUDGE');
    const stationJudges = handoverJudges.filter((j) => j.roleCode !== 'CHECKIN_JUDGE');

    if (checkInJudges.length > 0) {
      text += `[CHECK-IN DESK]\n`;
      checkInJudges.forEach((j, index) => {
        text += `${index + 1}. ${j.displayName}\n`;
        text += `   • Username: ${j.username}\n`;
        text += `   • Password: ${j.rawPassword || '(Encrypted)'}\n`;
      });
      text += `\n`;
    }

    if (stationJudges.length > 0) {
      text += `[COMPETITION STATIONS]\n`;
      stationJudges.forEach((j, index) => {
        const stationText = j.assignedStationNumber ? `(Station ${j.assignedStationNumber})` : '';
        text += `${index + 1}. ${j.displayName} ${stationText}\n`;
        text += `   • Username: ${j.username}\n`;
        text += `   • Password: ${j.rawPassword || '(Encrypted)'}\n`;
      });
    }

    text += `----------------------------------------\n`;
    text += `Log in at the CubeNexus tournament portal.`;

    navigator.clipboard.writeText(text);
    setIsAllCopied(true);
    setTimeout(() => setIsAllCopied(false), 2500);
  };

  const copySingleCredential = (judge: TournamentJudgeDto, idx: number) => {
    const text = `Judge Account: ${judge.displayName}\nUsername: ${judge.username}\nPassword: ${judge.rawPassword || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const togglePasswordVisibility = (judgeId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [judgeId]: !prev[judgeId] }));
  };

  const filteredJudges = judges.filter((j) => {
    const matchesSearch =
      j.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (roleFilter === 'CHECKIN') return j.roleCode === 'CHECKIN_JUDGE';
    if (roleFilter === 'STATION') return j.roleCode === 'STATION_JUDGE' || j.assignedStationNumber;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">{error ?? 'Tournament information not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
        <Link href="/managertournaments" className="hover:text-slate-900 transition-colors">
          Tournaments
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link href={`/managertournaments/${id}`} className="hover:text-slate-900 transition-colors truncate max-w-[200px]">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-900 font-bold">Manage Judges</span>
      </div>

      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Judge Management System
            </p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Tournament Judges Directory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Initialize, assign stations, and batch handover credentials for tournament referees.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition cursor-pointer border-none"
            >
              Batch Create Judges
            </button>

            <button
              onClick={() => setShowShuffleModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
              title="Randomize judge station assignments"
            >
              Shuffle Assignments
            </button>

            <button
              onClick={() => setShowSingleModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
            >
              + Add Single Judge
            </button>

            <button
              onClick={handleActivateAllJudges}
              disabled={judges.length === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-2.5 text-xs font-semibold text-emerald-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
              title="Unlock all judge accounts"
            >
              <Unlock className="h-3.5 w-3.5" />
              Unlock All
            </button>

            <button
              onClick={handleDeactivateAllJudges}
              disabled={judges.length === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-2.5 text-xs font-semibold text-rose-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
              title="Deactivate all tournament judge accounts"
            >
              <PowerOff className="h-3.5 w-3.5" />
              Lock All
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search judges by name or username..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 transition shadow-2xs"
          />
        </div>

        {/* Role Filter Segment */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${roleFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            All ({judges.length})
          </button>
          <button
            onClick={() => setRoleFilter('CHECKIN')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${roleFilter === 'CHECKIN' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Check-in ({judges.filter(j => j.roleCode === 'CHECKIN_JUDGE').length})
          </button>
          <button
            onClick={() => setRoleFilter('STATION')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${roleFilter === 'STATION' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Stations ({judges.filter(j => j.roleCode !== 'CHECKIN_JUDGE').length})
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 flex items-center justify-between shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Judges</span>
          <span className="text-xl font-bold text-indigo-600">{judges.length}</span>
        </div>
      </div>

      {/* Judges List Table */}
      {filteredJudges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 px-6 text-center space-y-3 shadow-2xs">
          <p className="text-slate-900 font-bold text-base">No judges assigned for this tournament yet</p>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Click <strong className="text-indigo-600">"Batch Create Judges"</strong> above to quickly initialize your referee team.
          </p>
          <button
            onClick={() => setShowBatchModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white transition shadow-2xs cursor-pointer border-none"
          >
            Batch Create Judges
          </button>
        </div>
      ) : (
        <>
          {/* Clean Modern Light Table (Desktop) */}
          <div className="hidden xl:block rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5 w-16 text-center">No.</th>
                    <th className="py-3.5 px-5">Judge Name</th>
                    <th className="py-3.5 px-5">Role & Station</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Username</th>
                    <th className="py-3.5 px-5">Initial Password</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJudges.map((j, idx) => (
                    <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {j.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{j.displayName}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{j.userCode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {renderRoleBadge(j)}
                      </td>
                      <td className="py-3.5 px-5">
                        {j.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                          {j.username}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {j.rawPassword ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                              {visiblePasswords[j.id] ? j.rawPassword : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(j.id)}
                              className="text-slate-400 hover:text-slate-700 p-1 transition-colors"
                              title="Show/Hide Password"
                            >
                              {visiblePasswords[j.id] ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Encrypted (Hash)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleJudgeStatus(j)}
                            title={j.isActive ? 'Deactivate judge account' : 'Activate judge account'}
                            className={`p-1.5 rounded-lg border transition-all shadow-2xs cursor-pointer ${j.isActive
                              ? 'bg-white hover:bg-amber-50 border-slate-200 text-amber-600'
                              : 'bg-white hover:bg-emerald-50 border-slate-200 text-emerald-600'
                              }`}
                          >
                            {j.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedJudge(j);
                              setShowResetPasswordModal(true);
                            }}
                            title="Reset password"
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 p-1.5 rounded-lg transition-all shadow-2xs"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedJudge(j);
                              setEditName(j.displayName);
                              setEditRoleCode(j.roleCode || 'STATION_JUDGE');
                              setEditStationNumber(j.assignedStationNumber?.toString() || '');
                              setShowEditModal(true);
                            }}
                            title="Edit judge information"
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 p-1.5 rounded-lg transition-all shadow-2xs"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setJudgeToDelete(j)}
                            title="Delete judge"
                            className="bg-white hover:bg-red-50 border border-slate-200 text-red-600 p-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View (Tablets / Mobiles) */}
          <div className="xl:hidden space-y-4">
            {filteredJudges.map((j, idx) => (
              <div key={j.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 text-left">
                {/* Header: Avatar, Name, User Code, and Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {j.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                        {idx + 1}. {j.displayName}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">{j.userCode}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {j.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Details: Role, Username, Initial Password */}
                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Role:</span>
                    <div>{renderRoleBadge(j)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Username:</span>
                    <span className="font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                      {j.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Password:</span>
                    <div>
                      {j.rawPassword ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                            {visiblePasswords[j.id] ? j.rawPassword : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(j.id)}
                            className="text-slate-400 hover:text-slate-700 p-1 transition-colors border-none bg-transparent cursor-pointer"
                            title="Show/Hide Password"
                          >
                            {visiblePasswords[j.id] ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Encrypted (Hash)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2 justify-end">
                  {/* Toggle Active Status */}
                  <button
                    onClick={() => handleToggleJudgeStatus(j)}
                    title={j.isActive ? 'Deactivate judge account' : 'Activate judge account'}
                    className={`p-1.5 rounded-lg border transition-all shadow-2xs cursor-pointer ${j.isActive
                      ? 'bg-white hover:bg-amber-50 border-slate-200 text-amber-600'
                      : 'bg-white hover:bg-emerald-50 border-slate-200 text-emerald-600'
                      }`}
                  >
                    {j.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>

                  {/* Reset Password */}
                  <button
                    onClick={() => {
                      setSelectedJudge(j);
                      setShowResetPasswordModal(true);
                    }}
                    title="Reset password"
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 p-1.5 rounded-lg transition-all shadow-2xs cursor-pointer"
                  >
                    <Key className="h-3.5 w-3.5" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setSelectedJudge(j);
                      setEditName(j.displayName);
                      setEditRoleCode(j.roleCode || 'STATION_JUDGE');
                      setEditStationNumber(j.assignedStationNumber?.toString() || '');
                      setShowEditModal(true);
                    }}
                    title="Edit judge information"
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 p-1.5 rounded-lg transition-all shadow-2xs cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setJudgeToDelete(j)}
                    title="Delete judge"
                    className="bg-white hover:bg-red-50 border border-slate-200 text-red-600 p-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: ADVANCED BATCH CREATE */}
      {/* ============================================================ */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Batch Create Judge Configuration</h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBatchCreate} className="space-y-4">
              {/* Parameter 1: Check-in Desk Count */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Check-in Desk Judges Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={checkInCountInput}
                  onChange={(e) => setCheckInCountInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. 1"
                />
              </div>

              {/* Parameter 2: Station Count */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Competition Stations Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={stationCountInput}
                  onChange={(e) => setStationCountInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. 5"
                />
              </div>

              {/* Parameter 3: Judges Per Station */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Judges Per Station
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={judgesPerStationInput}
                  onChange={(e) => setJudgesPerStationInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. 2 (1 Primary + 1 Support)"
                />
              </div>

              {/* Interactive Calculation Preview Card */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-1.5">
                <p className="font-bold text-slate-900 text-xs">
                  Total Accounts to Auto-Generate:
                </p>
                <div className="space-y-1 text-slate-600 text-xs">
                  <p>• Check-in Desk: <strong className="text-slate-900">{checkInNum}</strong> judges</p>
                  <p>• Competition Stations: <strong className="text-slate-900">{stationNum} stations</strong> x <strong className="text-slate-900">{perStationNum} judges/station</strong> = <strong className="text-slate-900">{stationNum * perStationNum}</strong> judges</p>
                  <p className="pt-2 border-t border-slate-200 font-bold text-xs text-slate-900 flex items-center justify-between">
                    <span>TOTAL INITIALIZATION:</span>
                    <span className="text-indigo-600 font-mono text-sm">{calculatedTotal} Judges</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBatchSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                >
                  {isBatchSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm & Create {calculatedTotal} Judges
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SHUFFLE / RANDOMIZE ASSIGNMENTS */}
      {/* ============================================================ */}
      {showShuffleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Shuffle Judge Assignments</h3>
              <button
                onClick={() => setShowShuffleModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleShuffle} className="space-y-4">
              <p className="text-xs text-slate-500">
                Accounts and credentials will remain unchanged; roles and stations will be randomly redistributed among existing judges.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Check-in Desk Count</label>
                <input
                  type="number" min="0" value={checkInCountInput} onChange={(e) => setCheckInCountInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Competition Stations Count</label>
                <input
                  type="number" min="1" value={stationCountInput} onChange={(e) => setStationCountInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Judges / Station</label>
                <input
                  type="number" min="1" value={judgesPerStationInput} onChange={(e) => setJudgesPerStationInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>

              {/* Interactive Calculation & Capacity Validation Preview Card */}
              <div className={`rounded-lg p-3.5 text-xs space-y-1.5 border ${
                calculatedTotal > judges.length
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>SHUFFLE REQUIREMENT SUMMARY:</span>
                  <span className="font-mono text-xs">{calculatedTotal} / {judges.length} Judges</span>
                </div>
                {calculatedTotal > judges.length ? (
                  <p className="text-[11px] text-rose-600 font-semibold pt-1 border-t border-rose-200">
                    ⚠️ Total requested slots ({calculatedTotal}) exceeds existing judges ({judges.length}). Please reduce inputs or create new judges via Batch Create.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    ✓ Valid configuration. {judges.length - calculatedTotal} reserve judge(s) will be unassigned.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button" onClick={() => setShowShuffleModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isShuffleSubmitting || calculatedTotal > judges.length}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                >
                  {isShuffleSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Randomly Shuffle Roles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: SINGLE CREATE */}
      {/* ============================================================ */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Single Judge</h3>
              <button onClick={() => setShowSingleModal(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSingleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Username <span className="text-slate-400 font-normal lowercase">(Auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  value={singleUsername}
                  onChange={(e) => setSingleUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono placeholder:text-slate-400 px-3 py-2 text-xs outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. judge001"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Initial Password <span className="text-slate-400 font-normal lowercase">(Auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  value={singlePassword}
                  onChange={(e) => setSinglePassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono placeholder:text-slate-400 px-3 py-2 text-xs outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. 1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSingleSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                >
                  {isSingleSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Judge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: HANDOVER CREDENTIALS (EXPORT & COPY CREDENTIALS) */}
      {/* ============================================================ */}
      {showHandoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Judge Credentials Handover</h3>
                <p className="text-xs text-slate-500 mt-0.5">Plain-text credentials below are ready to be shared with judges.</p>
              </div>
              <button onClick={() => setShowHandoverModal(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
              {handoverJudges.map((j, idx) => (
                <div key={j.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{j.displayName}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600">
                      <span>Username: <strong className="font-mono text-slate-900">{j.username}</strong></span>
                      <span>Password: <strong className="font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">{j.rawPassword || 'N/A'}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => copySingleCredential(j, idx)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition shrink-0 shadow-2xs"
                  >
                    {copiedIndex === idx ? (
                      <span className="text-emerald-600 font-bold">✓ Copied</span>
                    ) : (
                      <span>Copy</span>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Copy and send these login credentials to the designated judges.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={copyAllHandover}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition"
                >
                  {isAllCopied ? '✓ Copied All!' : 'Copy All'}
                </button>
                <button
                  onClick={() => setShowHandoverModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: EDIT NAME */}
      {/* ============================================================ */}
      {showEditModal && selectedJudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Judge Name</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditJudge} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  New Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                >
                  {isEditSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Update Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: RESET PASSWORD */}
      {/* ============================================================ */}
      {showResetPasswordModal && selectedJudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Reset Judge Password</h3>
              <button onClick={() => setShowResetPasswordModal(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-500">
                Generate a new password for <strong className="text-slate-900">{selectedJudge.displayName}</strong> ({selectedJudge.username}).
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  New Password <span className="text-slate-400 font-normal lowercase">(Auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono placeholder:text-slate-400 px-3 py-2 text-xs outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. NewPass@123"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                >
                  {isResetSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Assign New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CONFIRM DELETE JUDGE */}
      {/* ============================================================ */}
      {judgeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-center text-slate-900">
            <div>
              <h3 className="text-base font-bold text-slate-900">Confirm Delete Judge</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove judge <strong className="text-slate-900">{judgeToDelete.displayName}</strong> (<span className="font-mono text-slate-700">{judgeToDelete.username}</span>) from this tournament?
              </p>
              <p className="text-[11px] text-slate-400 mt-1 italic">This action cannot be undone.</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setJudgeToDelete(null)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteJudge}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete Judge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
