'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Heart, MessageCircle, Share2, Users, TrendingUp, Sparkles } from 'lucide-react';

export default function CommunityPage() {
  const [selectedTab, setSelectedTab] = useState('feed');

  const posts = [
    {
      id: 1,
      author: 'SpeedMaster_JP',
      country: '🇯🇵',
      avatar: '🎯',
      timestamp: '2 hours ago',
      content: 'Just broke my personal record with 7.2s! CFOP method is incredible.',
      image: null,
      likes: 2847,
      comments: 156,
      shares: 89,
      liked: false,
    },
    {
      id: 2,
      author: 'CubeNinja_MX',
      country: '🇲🇽',
      avatar: '⚡',
      timestamp: '4 hours ago',
      content: 'New tutorial on Roux method edge cases now live on YouTube! Check it out.',
      image: 'tutorial',
      likes: 1245,
      comments: 203,
      shares: 542,
      liked: true,
    },
    {
      id: 3,
      author: 'FastFingers_US',
      country: '🇺🇸',
      avatar: '🚀',
      timestamp: '6 hours ago',
      content: 'Competing in the Asian Regional Cup next week. Wish me luck! 💪',
      image: null,
      likes: 892,
      comments: 127,
      shares: 234,
      liked: false,
    },
    {
      id: 4,
      author: 'PuzzleWizard_DE',
      country: '🇩🇪',
      avatar: '🧩',
      timestamp: '8 hours ago',
      content: 'Released my new speedcubing gear review. Link in bio!',
      image: 'gear',
      likes: 3421,
      comments: 456,
      shares: 1023,
      liked: false,
    },
    {
      id: 5,
      author: 'TwistyKing_KR',
      country: '🇰🇷',
      avatar: '👑',
      timestamp: '10 hours ago',
      content: 'Training bootcamp starting next month. First 50 cubers get 50% off!',
      image: null,
      likes: 2156,
      comments: 342,
      shares: 678,
      liked: true,
    },
  ];

  const communities = [
    {
      name: 'CFOP Method Masters',
      members: 45200,
      icon: '🏆',
      posts: 12400,
      trending: true,
    },
    {
      name: 'Blind Solving Enthusiasts',
      members: 8900,
      icon: '👁️',
      posts: 3200,
      trending: false,
    },
    {
      name: 'Speedcube Hardware',
      members: 32100,
      icon: '🔧',
      posts: 8900,
      trending: true,
    },
    {
      name: 'Youth Cubers (U18)',
      members: 12400,
      icon: '🎓',
      posts: 5600,
      trending: false,
    },
    {
      name: 'Tournament Preparation',
      members: 28900,
      icon: '🎯',
      posts: 7800,
      trending: true,
    },
    {
      name: 'Breaking Records',
      members: 19800,
      icon: '⚡',
      posts: 6200,
      trending: false,
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Community
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect with speedcubers worldwide, share experiences, and learn together
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2">
          <Button
            onClick={() => setSelectedTab('feed')}
            variant={selectedTab === 'feed' ? 'default' : 'outline'}
            className={
              selectedTab === 'feed'
                ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                : 'border-border'
            }
          >
            Feed
          </Button>
          <Button
            onClick={() => setSelectedTab('communities')}
            variant={selectedTab === 'communities' ? 'default' : 'outline'}
            className={
              selectedTab === 'communities'
                ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                : 'border-border'
            }
          >
            Communities
          </Button>
        </div>

        {selectedTab === 'feed' && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Feed */}
            <div className="lg:col-span-2">
              {/* New Post */}
              <Card className="border-border mb-6 p-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-lg">
                    👤
                  </div>
                  <div className="flex-grow">
                    <input
                      type="text"
                      placeholder="Share your speedcubing moment..."
                      className="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm placeholder-muted-foreground focus:outline-none focus:border-accent"
                    />
                    <div className="mt-4 flex justify-end gap-2">
                      <Button variant="outline" className="border-border">
                        Media
                      </Button>
                      <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Posts */}
              {posts.map((post) => (
                <Card key={post.id} className="border-border mb-6 overflow-hidden">
                  {/* Header */}
                  <div className="border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg">
                          {post.avatar}
                        </div>
                        <div>
                          <p className="flex items-center gap-2 font-semibold text-foreground">
                            {post.author}
                            <span className="text-lg">{post.country}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                        ⋯
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4">
                    <p className="text-foreground">{post.content}</p>
                    {post.image && (
                      <div className="mt-4 h-48 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                        <span className="text-4xl">
                          {post.image === 'tutorial' ? '🎥' : '🎁'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{post.likes.toLocaleString()} likes</span>
                      <span>{post.comments} comments</span>
                      <span>{post.shares} shares</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-border px-6 py-3 flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 justify-center gap-2 text-muted-foreground hover:text-accent hover:bg-accent/5"
                    >
                      <Heart
                        className={`h-5 w-5 ${post.liked ? 'fill-current text-accent' : ''}`}
                      />
                      <span className="hidden sm:inline">Like</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 justify-center gap-2 text-muted-foreground hover:text-accent hover:bg-accent/5"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="hidden sm:inline">Comment</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 justify-center gap-2 text-muted-foreground hover:text-accent hover:bg-accent/5"
                    >
                      <Share2 className="h-5 w-5" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Sidebar - Trending & Communities */}
            <div className="space-y-6">
              {/* Trending */}
              <Card className="border-border p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Trending
                </h3>
                <div className="space-y-3">
                  {['#SpeedCubeChallenge', '#CFOP', '#World Records', '#Blind Solving'].map((tag) => (
                    <button
                      key={tag}
                      className="block w-full text-left hover:bg-muted/50 rounded-lg px-3 py-2 transition-colors"
                    >
                      <p className="text-sm font-medium text-accent">{tag}</p>
                      <p className="text-xs text-muted-foreground">2.4M posts</p>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Suggested Communities */}
              <Card className="border-border p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Suggested
                </h3>
                <div className="space-y-3">
                  {communities.slice(0, 3).map((community) => (
                    <div key={community.name} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{community.icon} {community.name}</p>
                        <p className="text-xs text-muted-foreground">{community.members.toLocaleString()} members</p>
                      </div>
                      <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 px-3 text-xs">
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {selectedTab === 'communities' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {communities.map((community) => (
              <Card key={community.name} className="border-border p-6 cursor-pointer hover:border-accent/50 transition-colors">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent/10 text-3xl">
                    {community.icon}
                  </div>
                  {community.trending && (
                    <div className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                      <TrendingUp className="h-3 w-3" />
                      Trending
                    </div>
                  )}
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{community.name}</h3>
                <div className="mb-4 space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {community.members.toLocaleString()} members
                  </p>
                  <p>{community.posts.toLocaleString()} posts</p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    Join
                  </Button>
                  <Button variant="outline" className="flex-1 border-border">
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
