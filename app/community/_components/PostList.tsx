'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Share2, MoreHorizontal, Video, Award } from 'lucide-react';

export interface Post {
  id: number;
  author: string;
  country: string;
  avatar: string;
  timestamp: string;
  content: string;
  image: string | null;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
}

interface PostListProps {
  posts: Post[];
  onToggleLike: (id: number) => void;
}

export function PostList({ posts, onToggleLike }: PostListProps) {
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: number]: string }>({});
  const [postComments, setPostComments] = useState<{ [postId: number]: string[] }>({
    1: ['Awesome time! What lube did you use for the cube?', 'Congrats on sub-8!'],
    2: ['The E-line recognition is super helpful. Thanks!'],
  });

  const handlePostComment = (postId: number) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    const currentComments = postComments[postId] || [];
    setPostComments({
      ...postComments,
      [postId]: [...currentComments, text.trim()],
    });
    setCommentInputs({
      ...commentInputs,
      [postId]: '',
    });
  };

  return (
    <div className="space-y-6">
      {posts.map((post) => {
        const comments = postComments[post.id] || [];
        const isCommentsOpen = activeCommentsPostId === post.id;
        
        return (
          <Card key={post.id} className="border border-border overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            {/* Header */}
            <div className="border-b border-border/80 px-6 py-4 bg-gradient-to-r from-accent/5 via-transparent to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent text-lg font-bold border border-accent/10 shadow-inner">
                    {post.avatar}
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 font-bold text-foreground text-sm">
                      {post.author}
                      <span className="text-base filter drop-shadow-sm select-none" title="Competitor Region">{post.country}</span>
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground">{post.timestamp}</p>
                  </div>
                </div>
                <Button variant="ghost" className="rounded-xl p-2 h-auto text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{post.content}</p>
              
              {post.image && (
                <div className="relative mt-2 overflow-hidden rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 flex flex-col items-center justify-center p-8 text-center min-h-[160px] group cursor-pointer hover:border-accent/40 transition-colors">
                  <div className="rounded-2xl bg-accent/20 p-4 border border-accent/20 shadow-md mb-2 group-hover:scale-110 transition-transform duration-300">
                    {post.image === 'tutorial' ? (
                      <Video className="h-7 w-7 text-accent" />
                    ) : (
                      <Award className="h-7 w-7 text-amber-500" />
                    )}
                  </div>
                  <span className="text-xs font-extrabold text-foreground uppercase tracking-widest">
                    {post.image === 'tutorial' ? 'Play Roux Tutorial Video' : 'View Competitor Scramble Log'}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium mt-1">
                    {post.image === 'tutorial' ? 'webrtc-stream-recording-cube.mp4' : 'WCA Official Scrambles Bundle'}
                  </span>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="border-t border-border/60 px-6 py-3 bg-muted/5">
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                <span>{post.likes.toLocaleString()} likes</span>
                <div className="flex gap-4">
                  <span>{comments.length} comments</span>
                  <span>{post.shares} shares</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border/60 px-6 py-2 flex gap-2 bg-muted/10">
              <button
                onClick={() => onToggleLike(post.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all duration-300 ${
                  post.liked
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/10 shadow-sm'
                    : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5'
                }`}
              >
                <Heart className={`h-4.5 w-4.5 transition-transform duration-300 ${post.liked ? 'fill-current text-rose-500 scale-110' : ''}`} />
                <span>Like</span>
              </button>

              <button
                onClick={() => setActiveCommentsPostId(isCommentsOpen ? null : post.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all duration-300 ${
                  isCommentsOpen
                    ? 'bg-accent/15 text-accent border border-accent/25 shadow-sm'
                    : 'text-muted-foreground hover:text-accent hover:bg-accent/5'
                }`}
              >
                <MessageSquare className="h-4.5 w-4.5" />
                <span>Comment</span>
              </button>

              <button
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-muted-foreground hover:text-accent hover:bg-accent/5 transition-all duration-300"
              >
                <Share2 className="h-4.5 w-4.5" />
                <span>Share</span>
              </button>
            </div>

            {/* Comments Expanded Area */}
            {isCommentsOpen && (
              <div className="border-t border-border/80 p-6 bg-muted/20 space-y-4">
                {comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment, index) => (
                      <div key={index} className="flex gap-3 text-xs leading-relaxed items-start">
                        <div className="h-7 w-7 rounded-lg bg-accent/10 border border-accent/10 font-bold flex items-center justify-center shrink-0">
                          💬
                        </div>
                        <div className="rounded-xl border border-border bg-card p-3 shadow-inner max-w-full flex-grow">
                          <p className="font-semibold text-foreground/80">Cuber_Nexus_User</p>
                          <p className="text-muted-foreground mt-1 text-sm">{comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center font-medium py-2">No comments yet. Be the first to share your thoughts!</p>
                )}

                {/* Comment Input */}
                <div className="flex gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post.id)}
                    className="flex-grow rounded-xl border border-border bg-card px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  />
                  <Button
                    onClick={() => handlePostComment(post.id)}
                    disabled={!(commentInputs[post.id] || '').trim()}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:pointer-events-none rounded-xl px-4 text-xs font-bold"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
