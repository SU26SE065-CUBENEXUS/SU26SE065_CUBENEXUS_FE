'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoaderCircle } from 'lucide-react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Users, 
  TrendingUp, 
  Sparkles,
  Send,
  MessageSquare,
  Globe2,
  Bookmark,
  Share
} from 'lucide-react';

export default function CommunityPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState('feed');
  const [newPostText, setNewPostText] = useState('');

  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'SpeedMaster_JP',
      country: '🇯🇵',
      avatar: '🎯',
      timestamp: '2 hours ago',
      content: 'Just broke my personal record with 7.200s! CFOP F2L sequence was incredibly fluid.',
      image: null,
      likes: 2847,
      comments: 2,
      shares: 89,
      liked: false,
    },
    {
      id: 2,
      author: 'CubeNinja_MX',
      country: '🇲🇽',
      avatar: '⚡',
      timestamp: '4 hours ago',
      content: 'New video series on Roux method blockbuilding edge cases now live on YouTube! Check it out.',
      image: 'tutorial',
      likes: 1245,
      comments: 1,
      shares: 542,
      liked: true,
    },
    {
      id: 3,
      author: 'FastFingers_US',
      country: '🇺🇸',
      avatar: '🚀',
      timestamp: '6 hours ago',
      content: 'Competing in the Asian Regional Cup next week. Ready to break some speed barriers! 💪',
      image: null,
      likes: 892,
      comments: 0,
      shares: 234,
      liked: false,
    },
  ]);

  const [communities, setCommunities] = useState([
    {
      name: 'CFOP Method Masters',
      members: 45200,
      icon: '🏆',
      posts: 12400,
      trending: true,
      joined: false,
    },
    {
      name: 'Blind Solving Enthusiasts',
      members: 8900,
      icon: '👁️',
      posts: 3200,
      trending: false,
      joined: false,
    },
    {
      name: 'Speedcube Hardware',
      members: 32100,
      icon: '🔧',
      posts: 8900,
      trending: true,
      joined: true,
    },
    {
      name: 'Youth Cubers (U18)',
      members: 12400,
      icon: '🎓',
      posts: 5600,
      trending: false,
      joined: false,
    },
    {
      name: 'Tournament Preparation',
      members: 28900,
      icon: '🎯',
      posts: 7800,
      trending: true,
      joined: false,
    },
  ]);

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

  const handleLike = (id: number) => {
    setPosts(prev => prev.map(post => {
      if (post.id === id) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleJoinCommunity = (name: string) => {
    setCommunities(prev => prev.map(c => {
      if (c.name === name) {
        return { ...c, joined: !c.joined, members: c.joined ? c.members - 1 : c.members + 1 };
      }
      return c;
    }));
  };

  const handleCreatePost = () => {
    if (!newPostText.trim()) return;
    const newPost = {
      id: posts.length + 1,
      author: 'CuberNexus_Pro',
      country: '🇻🇳',
      avatar: '👤',
      timestamp: 'Just now',
      content: newPostText,
      image: null,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
    };
    setPosts([newPost, ...posts]);
    setNewPostText('');
  };

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
                <span className="rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-3 py-1 text-xs font-semibold text-[#eab308] flex items-center gap-1.5">
                  <Globe2 className="h-3.5 w-3.5" /> SPEEDCUBERS NET
                </span>
                <span className="text-muted-foreground text-xs font-medium">• 12,840 Active Discussions</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl uppercase">
                COMMUNITY HUB
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
                Connect with speedcubing experts worldwide. Share solve techniques, ask questions, review custom hardware, and level up.
              </p>
            </div>
          </div>
        </Card>

        {/* Tab Controls */}
        <div className="flex gap-2 bg-card/40 border border-border/60 p-2 rounded-2xl w-fit">
          <button
            onClick={() => setSelectedTab('feed')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === 'feed'
                ? 'bg-[#eab308] text-black font-black shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Social Feed
          </button>
          <button
            onClick={() => setSelectedTab('communities')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === 'communities'
                ? 'bg-[#eab308] text-black font-black shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Specialist Guilds
          </button>
        </div>

        {selectedTab === 'feed' && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Social feed area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Write New Post Box */}
              <Card className="border border-border/80 bg-card p-6 rounded-2xl shadow-sm">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eab308]/10 text-base flex-shrink-0 border border-[#eab308]/20">
                    👤
                  </div>
                  <div className="flex-grow space-y-3">
                    <textarea
                      placeholder="Share your speedcubing records, algorithm tricks, or solve questions..."
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-[#eab308] resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        onClick={handleCreatePost}
                        className="bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-xs px-5 py-2.5 rounded-xl h-auto flex items-center gap-1.5 uppercase"
                      >
                        Publish <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Feed lists */}
              <div className="space-y-6">
                {posts.map((post) => (
                  <Card key={post.id} className="border border-border/80 bg-card overflow-hidden rounded-2xl shadow-sm hover:border-[#eab308]/20 transition-all duration-300">
                    {/* Header */}
                    <div className="border-b border-border/60 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eab308]/10 border border-[#eab308]/20 text-lg flex-shrink-0">
                            {post.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 font-bold text-foreground text-xs sm:text-sm">
                              <span>{post.author}</span>
                              <span className="text-base leading-none">{post.country}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">{post.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5">
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">{post.content}</p>
                      {post.image && (
                        <div className="mt-4 h-44 rounded-xl bg-gradient-to-br from-[#eab308]/15 to-transparent flex items-center justify-center border border-border/60">
                          <span className="text-4xl">
                            {post.image === 'tutorial' ? '🎥' : '🎁'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats metrics */}
                    <div className="border-t border-border/60 px-6 py-3.5 text-[10px] font-bold text-muted-foreground flex justify-between uppercase">
                      <span>{post.likes.toLocaleString('en-US')} Likes</span>
                      <div className="flex gap-4">
                        <span>{post.comments} Comments</span>
                        <span>{post.shares} Shares</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="border-t border-border/60 px-6 py-2 bg-muted/5 flex gap-2">
                      <Button
                        onClick={() => handleLike(post.id)}
                        variant="ghost"
                        className={`flex-1 justify-center gap-1.5 text-xs font-bold rounded-xl py-4 hover:bg-[#eab308]/5 ${
                          post.liked ? 'text-[#eab308] hover:text-[#eab308]' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} />
                        <span>Like</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 justify-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl py-4 hover:bg-[#eab308]/5"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Comment</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 justify-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl py-4 hover:bg-[#eab308]/5"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              {/* Trending topics */}
              <Card className="border border-border/85 bg-card p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#eab308] mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5" />
                  TRENDING DISCUSSIONS
                </h3>
                <div className="space-y-3">
                  {[
                    { tag: '#SpeedCubeWorldChampionship', posts: '24.5k' },
                    { tag: '#CFOPF2LOptimizing', posts: '12.8k' },
                    { tag: '#RouxBlockBuildingEdgeCases', posts: '8.4k' },
                    { tag: '#GanPro15MaglevHardware', posts: '6.2k' },
                  ].map((topic) => (
                    <button
                      key={topic.tag}
                      className="block w-full text-left hover:bg-muted/30 rounded-xl px-3.5 py-2.5 transition-colors border border-transparent hover:border-border/60"
                    >
                      <p className="text-xs font-bold text-foreground">{topic.tag}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase">{topic.posts} solved runs</p>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Guild suggestions */}
              <Card className="border border-border/85 bg-card p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#eab308] mb-4 flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5" />
                  RECOMMENDED GUILDS
                </h3>
                <div className="space-y-4">
                  {communities.slice(0, 3).map((guild) => (
                    <div key={guild.name} className="flex items-center justify-between gap-3 bg-muted/10 border border-border/60 rounded-xl p-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{guild.icon} {guild.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">{(guild.members / 1000).toFixed(1)}k cubers</p>
                      </div>
                      <Button 
                        onClick={() => handleJoinCommunity(guild.name)}
                        className={`h-7 px-3.5 text-[10px] font-extrabold rounded-lg ${
                          guild.joined 
                            ? 'bg-transparent border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30' 
                            : 'bg-[#eab308] hover:bg-[#ca8a04] text-black'
                        }`}
                      >
                        {guild.joined ? 'LEAVE' : 'JOIN'}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {selectedTab === 'communities' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {communities.map((guild) => (
              <Card key={guild.name} className="border border-border/60 bg-card p-6 rounded-2xl flex flex-col justify-between hover:border-[#eab308]/30 transition-all duration-300 hover:shadow-lg">
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eab308]/10 border border-[#eab308]/20 text-2xl">
                      {guild.icon}
                    </div>
                    {guild.trending && (
                      <span className="flex items-center gap-1 rounded-full bg-[#eab308]/10 border border-[#eab308]/25 px-2.5 py-0.5 text-[9px] font-black uppercase text-[#eab308]">
                        <TrendingUp className="h-2.5 w-2.5" /> Trending
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-foreground tracking-tight">{guild.name}</h3>
                  <div className="my-4 space-y-1 text-[11px] font-bold text-muted-foreground uppercase">
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#eab308]" />
                      {guild.members.toLocaleString('en-US')} Cubers
                    </p>
                    <p>{guild.posts.toLocaleString('en-US')} solved logs</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-border/60">
                  <Button 
                    onClick={() => handleJoinCommunity(guild.name)}
                    className={`flex-1 font-extrabold text-[10px] py-4 rounded-xl ${
                      guild.joined
                        ? 'bg-transparent border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30'
                        : 'bg-[#eab308] hover:bg-[#ca8a04] text-black'
                    }`}
                  >
                    {guild.joined ? 'LEAVE GUILD' : 'JOIN GUILD'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
