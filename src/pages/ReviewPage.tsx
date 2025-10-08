import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReviewVideoPlayer } from '@/components/review/ReviewVideoPlayer';
import { ThreadPanel } from '@/components/review/ThreadPanel';
import { ThreadDetailSheet } from '@/components/review/ThreadDetailSheet';
import { ReviewActions } from '@/components/review/ReviewActions';
import { useReview } from '@/stores/reviewStore';
import { useReviewUI } from '@/hooks/useReviewUI';
import type { Shape, Thread } from '@/types/review';

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const { loadAsset, addThread } = useReview();
  const { asset, isLoading, error } = useReviewUI();
  const [currentTime, setCurrentTime] = useState(0);
  const [openThreadDetail, setOpenThreadDetail] = useState<Thread | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (token) {
      // Mock data for now - will load from Supabase by token later
      loadAsset('mock-asset-id');
    }
  }, [token, loadAsset]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Carregando revisão...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive font-semibold">Erro ao carregar revisão</p>
          <p className="text-muted-foreground">{error || 'Asset não encontrado'}</p>
        </div>
      </div>
    );
  }

  const handleSeekToThread = (time: number) => {
    setCurrentTime(time);
  };

  const handleOpenThread = (thread: Thread) => {
    setOpenThreadDetail(thread);
    setCurrentTime(thread.tStart);
  };

  const handleAddShapes = async (shapes: Shape[], timestamp: number, tEnd?: number) => {
    try {
      await addThread({
        tStart: timestamp,
        tEnd,
        shapes,
      });
    } catch (err) {
      console.error('Error adding thread:', err);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <ReviewActions
        assetId={asset.id}
        currentStatus={asset.status}
        shareToken={asset.shareToken}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Video Player */}
        <div className="flex-1 flex flex-col bg-muted/30">
          <ReviewVideoPlayer
            src={asset.videoUrl}
            threads={asset.threads}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
            onAddShapes={handleAddShapes}
            onThreadClick={(threadId) => {
              const thread = asset.threads.find(t => t.id === threadId);
              if (thread) handleOpenThread(thread);
            }}
          />
        </div>

        {/* Right: Thread Panel (always visible, fixed width) */}
        <div className="w-96 border-l bg-background flex flex-col">
          <ThreadPanel
            threads={asset.threads}
            onOpenThread={handleOpenThread}
            onSeekToThread={handleSeekToThread}
            formatTime={formatTime}
          />
        </div>
      </div>

      {/* Thread Detail Sheet (overlay) */}
      <ThreadDetailSheet
        thread={openThreadDetail}
        open={!!openThreadDetail}
        onClose={() => setOpenThreadDetail(null)}
        formatTime={formatTime}
      />
    </div>
  );
}
