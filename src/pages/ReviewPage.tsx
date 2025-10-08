import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReviewVideoPlayer } from '@/components/review/ReviewVideoPlayer';
import { ThreadPanel } from '@/components/review/ThreadPanel';
import { CommentPanel } from '@/components/review/CommentPanel';
import { ReviewActions } from '@/components/review/ReviewActions';
import { useReview } from '@/stores/reviewStore';
import { useReviewUI } from '@/hooks/useReviewUI';
import type { Shape } from '@/types/review';

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const { loadAsset, selectThread, addThread } = useReview();
  const { asset, isLoading, error, selectedThread } = useReviewUI();
  const [currentTime, setCurrentTime] = useState(0);

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

  const handleAddShapes = async (shapes: Shape[], timestamp: number) => {
    try {
      await addThread({
        tStart: timestamp,
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
            onThreadClick={selectThread}
          />
        </div>

        {/* Right: Thread/Comment Panels */}
        <div className="w-96 border-l bg-background flex flex-col">
          {selectedThread ? (
            <CommentPanel thread={selectedThread} formatTime={formatTime} />
          ) : (
            <ThreadPanel
              threads={asset.threads}
              selectedThreadId={selectedThread?.id}
              onSelectThread={selectThread}
              onSeekToThread={handleSeekToThread}
              formatTime={formatTime}
            />
          )}
        </div>
      </div>
    </div>
  );
}
