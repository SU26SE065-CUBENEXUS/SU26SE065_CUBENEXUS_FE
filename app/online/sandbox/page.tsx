'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { OnlineArenaScannerTestPanel } from '@/features/rubik-scanner-test/components/OnlineArenaScannerTestPanel';
import { ShieldAlert, Server, HelpCircle } from 'lucide-react';

export default function SandboxScannerPage() {
  const [backendUrl, setBackendUrl] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount (client-side only)
    const storedUrl = localStorage.getItem('sandbox_backend_url') ?? 'http://localhost:5212';
    setBackendUrl(storedUrl);
    setIsLoaded(true);
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBackendUrl(val);
    localStorage.setItem('sandbox_backend_url', val);
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white relative pb-20">
        <Header />
        <div className="flex justify-center items-center h-[50vh]">
          <span className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative pb-20">
      <Header />

      {/* Cyber Grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.5_0.15_40_/_0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute top-20 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10 space-y-8">
        {/* Welcome Hero Panel */}
        <div className="flex flex-col justify-between gap-6 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase animate-pulse">
                Sandbox Environment
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">
              AI SCANNER SANDBOX
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Test and calibrate the Rubik's Cube scanner AI system isolated from online matchmaking. This page bypasses JWT checks and match state requirements.
            </p>
          </div>

          {/* Backend Connection Config */}
          <div className="border-t border-zinc-800/80 pt-6 mt-2 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                <Server className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Backend API Configuration</h4>
                <p className="text-zinc-500 text-[10px] sm:text-xs">Configure the server target. Leave blank to use proxy rewrites.</p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto md:max-w-md shrink-0">
              <input
                type="text"
                value={backendUrl}
                onChange={handleUrlChange}
                placeholder="http://localhost:5212 (mặc định trống dùng Proxy)"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Info checklist for developers */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <OnlineArenaScannerTestPanel backendUrl={backendUrl} />
          </div>

          <div className="space-y-6">
            {/* Guide Card */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase text-orange-500 tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Hướng dẫn test
              </h3>
              <ol className="text-zinc-400 text-xs space-y-3 font-medium list-decimal list-inside">
                <li>Bật backend cục bộ (C# API + AI Service).</li>
                <li>Nhấn <strong className="text-white">Start Camera</strong> để kích hoạt luồng camera.</li>
                <li>Nhấn <strong className="text-white">Start Scan Session</strong> tạo session test dev mới.</li>
                <li>Cầm Rubik hướng mặt đầy đủ 9 stickers và nhấn <strong className="text-white">Scan / Accept Next Face</strong>.</li>
                <li>AI sẽ tự động đọc liên tục các frame camera để thu thập 3 frame ổn định trùng khớp liên tiếp (Stability Check).</li>
                <li>Khi trạng thái chuyển thành <strong className="text-orange-500">ACCEPTED</strong>, xoay sang mặt có màu tâm khác và tiếp tục cho đến khi đủ 6 mặt.</li>
              </ol>
            </div>

            {/* Warning Card */}
            <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-orange-500 animate-pulse" /> Sandbox Bypass
              </span>
              <p className="text-zinc-400 text-[10px] sm:text-xs leading-relaxed">
                Tất cả dữ liệu quét và session trong sandbox được xử lý bởi endpoint dev. Khi flow đã mượt, logic này sẽ được áp dụng trực tiếp cho flow thi đấu online.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
