import { useMemo, useCallback } from 'react';
import type { Thread } from '@/types/review';

interface UseThreadNavigationProps {
  threads: Thread[];
  selectedThreadId?: string;
  onSelectThread: (threadId: string) => void;
  onSeekToThread: (time: number) => void;
}

export const useThreadNavigation = ({
  threads,
  selectedThreadId,
  onSelectThread,
  onSeekToThread
}: UseThreadNavigationProps) => {
  // Sort threads by tStart
  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => a.tStart - b.tStart);
  }, [threads]);

  const currentIndex = useMemo(() => {
    if (!selectedThreadId) return -1;
    return sortedThreads.findIndex(t => t.id === selectedThreadId);
  }, [sortedThreads, selectedThreadId]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < sortedThreads.length - 1;

  const goToPrevious = useCallback(() => {
    if (!hasPrevious) return;
    const prevThread = sortedThreads[currentIndex - 1];
    onSelectThread(prevThread.id);
    onSeekToThread(prevThread.tStart);
  }, [hasPrevious, sortedThreads, currentIndex, onSelectThread, onSeekToThread]);

  const goToNext = useCallback(() => {
    if (!hasNext) return;
    const nextThread = sortedThreads[currentIndex + 1];
    onSelectThread(nextThread.id);
    onSeekToThread(nextThread.tStart);
  }, [hasNext, sortedThreads, currentIndex, onSelectThread, onSeekToThread]);

  return {
    hasPrevious,
    hasNext,
    goToPrevious,
    goToNext,
    currentIndex,
    totalThreads: sortedThreads.length
  };
};
