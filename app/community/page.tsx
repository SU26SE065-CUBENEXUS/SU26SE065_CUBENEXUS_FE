'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

// Subcomponents
import { CommunityHeader } from './_components/CommunityHeader';
import { CommunityTabs } from './_components/CommunityTabs';
import { CreatePostCard } from './_components/CreatePostCard';
import { PostList, Post } from './_components/PostList';
import { CommunitySidebar } from './_components/CommunitySidebar';
import { CommunitiesGrid } from './_components/CommunitiesGrid';

export default function CommunityPage() {
  const [selectedTab, setSelectedTab] = useState('feed');
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: 'SpeedMaster_JP',
      country: '🇯🇵',
      avatar: '🎯',
      timestamp: '2 hours ago',
      content: 'Just broke my personal record with 7.22s! The custom core magnetic layout is incredible.',
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
      content: 'New video walkthrough explaining Roux method corner orientation is online! Check it out below.',
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
      content: 'Currently bootcamping for the Asian Regional Cup next week. Working on medley sequencing!',
      image: 'gear',
      likes: 892,
      comments: 0,
      shares: 234,
      liked: false,
    },
    {
      id: 4,
      author: 'PuzzleWizard_DE',
      country: '🇩🇪',
      avatar: '🧩',
      timestamp: '8 hours ago',
      content: 'Just received my custom magnetic medley puzzle bundle. Testing alignment today.',
      image: null,
      likes: 3421,
      comments: 0,
      shares: 1023,
      liked: false,
    },
  ]);

  const handleAddPost = (content: string) => {
    const newPost: Post = {
      id: Date.now(),
      author: 'Cuber_Nexus_User',
      country: '🇻🇳',
      avatar: '👑',
      timestamp: 'Just now',
      content: content,
      image: null,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
    };
    setPosts([newPost, ...posts]);
  };

  const handleToggleLike = (id: number) => {
    setPosts(
      posts.map((post) => {
        if (post.id === id) {
          return {
            ...post,
            liked: !post.liked,
            likes: post.liked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      })
    );
  };

  return (
    <main className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <CommunityHeader />
          <CommunityTabs selectedTab={selectedTab} onSelectTab={setSelectedTab} />

          {selectedTab === 'feed' ? (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Feed */}
              <div className="lg:col-span-2">
                <CreatePostCard onAddPost={handleAddPost} />
                <PostList posts={posts} onToggleLike={handleToggleLike} />
              </div>

              {/* Sidebar */}
              <div>
                <CommunitySidebar />
              </div>
            </div>
          ) : (
            <CommunitiesGrid />
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
