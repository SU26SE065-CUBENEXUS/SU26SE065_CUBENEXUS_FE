'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoaderCircle } from 'lucide-react';
import { 
  Clock, 
  Zap, 
  Target, 
  BookOpen, 
  RefreshCw, 
  Timer,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  BookMarked
} from 'lucide-react';

const generateWcaScramble = () => {
  const faces = ["R", "L", "U", "D", "F", "B"];
  const modifiers = ["", "'", "2"];
  const scramble = [];
  let lastFace = "";

  while (scramble.length < 21) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    if (face !== lastFace) {
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      scramble.push(face + modifier);
      lastFace = face;
    }
  }
  return scramble.join(" ");
};

export default function PracticePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [selectedMode, setSelectedMode] = useState('timing');
  const [scramble, setScramble] = useState('');
  
  // Timer States
  const [timerValue, setTimerValue] = useState<number>(0);
  const [timerStatus, setTimerStatus] = useState<'idle' | 'preparing' | 'ready' | 'active'>('idle');
  const [sessionTimes, setSessionTimes] = useState<number[]>([]);
  const timerStartRef = useRef<number>(0);

  const handleGenerateScramble = () => {
    setScramble(generateWcaScramble());
  };

  useEffect(() => {
    handleGenerateScramble();
  }, []);

  // Keyboard Event Listeners for Spacebar Timer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        
        // Prevent key repeat events from messing up state
        if (e.repeat) return;

        if (timerStatus === 'idle') {
          setTimerStatus('preparing');
        } else if (timerStatus === 'active') {
          // Stop the timer
          const elapsed = Date.now() - timerStartRef.current;
          setTimerValue(elapsed);
          setTimerStatus('idle');
          setSessionTimes(prev => [elapsed, ...prev]);
          handleGenerateScramble();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        
        if (timerStatus === 'preparing') {
          // Start the timer
          timerStartRef.current = Date.now();
          setTimerStatus('active');
          setTimerValue(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [timerStatus]);

  // Frame loop updates the active running timer
  useEffect(() => {
    if (timerStatus !== 'active') return;
    
    let frameId: number;
    const tick = () => {
      setTimerValue(Date.now() - timerStartRef.current);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [timerStatus]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#eab308]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    return totalSeconds.toFixed(3) + "s";
  };

  const calculateAverage = (times: number[]) => {
    if (times.length === 0) return '0.000s';
    const sum = times.reduce((a, b) => a + b, 0);
    return formatTime(sum / times.length);
  };

  const calculateBest = (times: number[]) => {
    if (times.length === 0) return '0.000s';
    const best = Math.min(...times);
    return formatTime(best);
  };

  const calculateAo5 = (times: number[]) => {
    if (times.length < 5) return 'N/A';
    const last5 = times.slice(0, 5);
    const sorted = [...last5].sort((a, b) => a - b);
    const middle3 = sorted.slice(1, 4); // Remove best and worst
    const sum = middle3.reduce((a, b) => a + b, 0);
    return formatTime(sum / 3);
  };

  const clearSession = () => {
    setSessionTimes([]);
    setTimerValue(0);
    setTimerStatus('idle');
  };

  const modes = [
    {
      id: 'timing',
      name: 'Timed Solve',
      icon: Clock,
      description: 'Practice speedcubing with spacebar stackmat timer and dynamic statistics.',
    },
    {
      id: 'speedrun',
      name: 'Solo Speed Run',
      icon: Zap,
      description: 'Solve as many cubes as possible within customizable intervals.',
    },
    {
      id: 'blind',
      name: 'Blind Solving',
      icon: Target,
      description: 'Train memorization sequences and executive execution loops.',
    },
    {
      id: 'learn',
      name: 'Learn Methods',
      icon: BookOpen,
      description: 'Master advanced algorithms including CFOP F2L/OLL/PLL cases.',
    },
  ];

  const methods = [
    {
      name: 'CFOP (Fridrich Method)',
      difficulty: 'Intermediate',
      users: 12400,
      progress: 100,
    },
    {
      name: 'Roux Method',
      difficulty: 'Intermediate',
      users: 3200,
      progress: 75,
    },
    {
      name: 'ZZ Method',
      difficulty: 'Advanced',
      users: 1800,
      progress: 45,
    },
    {
      name: 'Petrus Method',
      difficulty: 'Advanced',
      users: 890,
      progress: 20,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Banner Section */}
        <Card className="border border-border bg-card p-8 rounded-3xl relative overflow-hidden shadow-xl shadow-black/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.08),transparent_50%)]" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-3 py-1 text-xs font-semibold text-[#eab308] flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Solo Sandbox
                </span>
                <span className="text-muted-foreground text-xs font-medium">• Spacebar Trigger Enabled</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl uppercase">
                PRACTICE SANDBOX
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
                Test algorithms, generate certified random scrambles, log time records, and analyze speed improvements over sessions.
              </p>
            </div>
          </div>
        </Card>

        {/* Practice Modes Choices */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <Card
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`cursor-pointer border-2 p-6 transition-all duration-300 rounded-2xl flex flex-col justify-between hover:shadow-md ${
                  selectedMode === mode.id
                    ? 'border-[#eab308] bg-[#eab308]/5 shadow-[#eab308]/5'
                    : 'border-border bg-card hover:border-[#eab308]/30'
                }`}
              >
                <div>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eab308]/10 border border-[#eab308]/20">
                    <IconComponent className="h-5 w-5 text-[#eab308]" />
                  </div>
                  <h3 className="font-extrabold text-foreground text-sm">{mode.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{mode.description}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {selectedMode === 'timing' ? (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Interactive Timer Block */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-border/80 bg-card p-8 rounded-2xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden shadow-sm">
                {/* Background effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#eab308]/3 to-transparent pointer-events-none" />
                
                {/* Scramble code header */}
                <div className="w-full text-center space-y-3 relative z-10 mb-8">
                  <div className="flex justify-between items-center px-4">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">WCA SCRAMBLE</span>
                    <button 
                      onClick={handleGenerateScramble}
                      className="p-1.5 rounded-lg border border-border bg-muted/10 text-muted-foreground hover:text-foreground transition hover:border-border/80"
                      title="Next Scramble"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="bg-muted/15 border border-border/60 rounded-xl p-4 font-mono text-xs sm:text-sm text-foreground tracking-wide leading-relaxed">
                    {scramble}
                  </div>
                </div>

                {/* Big Visual Clock display */}
                <div className="flex flex-col items-center justify-center flex-grow py-8 relative z-10">
                  <div 
                    className={`font-mono text-6xl sm:text-7xl font-black transition-colors duration-200 select-none ${
                      timerStatus === 'preparing' 
                        ? 'text-red-400' 
                        : timerStatus === 'active' 
                        ? 'text-[#eab308]' 
                        : 'text-foreground'
                    }`}
                  >
                    {formatTime(timerValue)}
                  </div>
                  
                  <div className="mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                    {timerStatus === 'idle' && "Press & hold [Space] key to prepare timer"}
                    {timerStatus === 'preparing' && "Release [Space] to START solve"}
                    {timerStatus === 'active' && "Press [Space] to STOP solve"}
                  </div>
                </div>

                {/* Reset button bar */}
                <div className="w-full flex justify-end gap-2 border-t border-border pt-6 mt-4 relative z-10">
                  <Button 
                    onClick={clearSession} 
                    variant="outline" 
                    className="border-border text-xs px-4 py-2 h-auto text-muted-foreground hover:text-red-400 hover:border-red-400/30 flex items-center gap-1.5 bg-transparent"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Clear Session
                  </Button>
                </div>
              </Card>

              {/* Statistics overview cards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Session Solves', value: sessionTimes.length },
                  { label: 'Session Avg', value: calculateAverage(sessionTimes) },
                  { label: 'Best Record', value: calculateBest(sessionTimes) },
                  { label: 'Average of 5 (Ao5)', value: calculateAo5(sessionTimes) },
                ].map((stat) => (
                  <Card key={stat.label} className="border border-border bg-card p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl font-black text-foreground mt-1.5">{stat.value}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Session log detail column */}
            <div className="space-y-6">
              <Card className="border border-border/80 bg-card p-6 rounded-2xl flex flex-col justify-between shadow-sm min-h-[480px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#eab308] flex items-center gap-2">
                      <Award className="h-4.5 w-4.5" /> CURRENT SESSION
                    </h3>
                    <span className="text-[10px] font-bold text-muted-foreground">{sessionTimes.length} Solves</span>
                  </div>
                  
                  {sessionTimes.length > 0 ? (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {sessionTimes.map((time, idx) => (
                        <div key={idx} className="flex justify-between items-center rounded-xl bg-muted/20 border border-border/60 p-3 hover:border-[#eab308]/20 transition-all duration-300">
                          <span className="text-xs font-bold text-muted-foreground">#{sessionTimes.length - idx}</span>
                          <span className="text-xs font-black text-foreground">{formatTime(time)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      <Timer className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      No solves completed in this session yet.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Traditional lists for alternate practice modes */}
            <div className="lg:col-span-2">
              <Card className="border border-border bg-card p-6 rounded-2xl space-y-6">
                <div>
                  <h2 className="text-lg font-black text-foreground uppercase tracking-wider">
                    {modes.find(m => m.id === selectedMode)?.name} Exercises
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Select an active program block to begin.</p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { title: 'Cross & F2L Optimization', difficulty: 'Beginner', duration: '20m', status: 'Available' },
                    { title: 'OLL Alg Complete Suite', difficulty: 'Intermediate', duration: '40m', status: 'Available' },
                    { title: 'PLL Case Speed Drills', difficulty: 'Advanced', duration: '30m', status: 'Unlocked' },
                  ].map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/15 p-4 hover:border-[#eab308]/30 transition-all duration-300">
                      <div>
                        <p className="text-xs font-bold text-foreground">{ex.title}</p>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">{ex.difficulty} • {ex.duration}</span>
                      </div>
                      <Button className="bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-[10px] h-8 px-4 rounded-lg">
                        LAUNCH
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Methods progress side column */}
            <div>
              <Card className="border border-border bg-card p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#eab308] flex items-center gap-2">
                  <BookMarked className="h-4.5 w-4.5" /> ALGORITHM PACKS
                </h3>
                <div className="divide-y divide-border/60">
                  {methods.map((method) => (
                    <div key={method.name} className="py-4 first:pt-0 last:pb-0 hover:bg-muted/10 transition-colors rounded-xl px-1 cursor-pointer">
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="text-xs font-bold text-foreground leading-snug">{method.name}</h4>
                        <span className="inline-flex text-[9px] rounded-full px-2 py-0.5 bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/25 font-bold uppercase">
                          {method.difficulty}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                        <span>{method.progress}% Complete</span>
                        <span>{method.users.toLocaleString('en-US')} Cubers</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
