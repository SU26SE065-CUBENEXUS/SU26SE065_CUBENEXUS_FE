'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Video, Link, Tag, Send } from 'lucide-react';

interface CreatePostCardProps {
  onAddPost: (content: string) => void;
}

export function CreatePostCard({ onAddPost }: CreatePostCardProps) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddPost(content);
    setContent('');
    setIsFocused(false);
  };

  return (
    <Card className="border border-border p-6 shadow-sm mb-6 rounded-2xl transition-all duration-300">
      <form onSubmit={handleSubmit} className="flex gap-4">
        {/* Avatar */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground text-lg font-bold shadow-md">
          👤
        </div>

        {/* Input & Options */}
        <div className="flex-grow">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Share your speedcubing record, scramble, or gear mod..."
            rows={isFocused ? 3 : 1}
            className="w-full resize-none border-0 border-b border-border/60 bg-transparent px-0 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-0 transition-all duration-300"
          />

          <div className={`flex items-center justify-between mt-4 transition-all duration-300 ${isFocused ? 'opacity-100 h-auto' : 'opacity-80'}`}>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-lg p-2 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                title="Add Image"
              >
                <Image className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                className="rounded-lg p-2 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                title="Add Video Tutorial"
              >
                <Video className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                className="rounded-lg p-2 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                title="Add Scramble link"
              >
                <Link className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                className="rounded-lg p-2 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                title="Tag Method"
              >
                <Tag className="h-4.5 w-4.5" />
              </button>
            </div>

            <Button
              type="submit"
              disabled={!content.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:pointer-events-none rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              Share Post
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
