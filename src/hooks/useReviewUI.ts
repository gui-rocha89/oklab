import { useReview } from '@/stores/reviewStore';

export const useReviewUI = () => {
  const { 
    asset, 
    selectedThreadId, 
    isLoading,
    error,
    getOpenThreads, 
    getResolvedThreads,
    getSelectedThread 
  } = useReview();

  const openThreads = getOpenThreads();
  const resolvedThreads = getResolvedThreads();
  const selectedThread = getSelectedThread();

  return {
    asset,
    selectedThreadId,
    selectedThread,
    openThreads,
    resolvedThreads,
    isLoading,
    error,
    hasOpenThreads: openThreads.length > 0,
    hasResolvedThreads: resolvedThreads.length > 0,
    threadCount: asset?.threads.length ?? 0,
    openThreadCount: openThreads.length,
    resolvedThreadCount: resolvedThreads.length
  };
};
