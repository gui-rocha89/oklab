import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { ReviewAsset, Thread, Shape, Comment } from '@/types/review';

interface ReviewState {
  // Estado
  asset: ReviewAsset | null;
  selectedThreadId?: string;
  isLoading: boolean;
  error: string | null;

  // Carregamento
  loadAsset: (assetId: string) => Promise<void>;
  setAsset: (a: ReviewAsset) => void;

  // Threads
  selectThread: (id?: string) => void;
  addThread: (t: Omit<Thread, 'id' | 'chip' | 'state' | 'comments'>) => Promise<Thread>;
  resolveThread: (threadId: string) => Promise<void>;
  reopenThread: (threadId: string) => Promise<void>;
  updateThreadShapes: (threadId: string, shapes: Shape[]) => Promise<void>;

  // Comentários
  addComment: (threadId: string, c: Omit<Comment, 'id' | 'createdAt'>) => Promise<void>;

  // Status do Asset
  setStatus: (s: ReviewAsset['status']) => Promise<void>;

  // Share Token
  generateShareToken: () => Promise<string | undefined>;

  // Seletores
  getOpenThreads: () => Thread[];
  getResolvedThreads: () => Thread[];
  getSelectedThread: () => Thread | undefined;
}

export const useReview = create<ReviewState>((set, get) => ({
  asset: null,
  isLoading: false,
  error: null,

  setAsset: (a) => set({ asset: a }),
  
  selectThread: (id) => set({ selectedThreadId: id }),

  loadAsset: async (assetId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: assetData, error: assetError } = await supabase
        .from('review_assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (assetError) throw assetError;

      const { data: threadsData, error: threadsError } = await supabase
        .from('threads')
        .select(`
          *,
          thread_comments (*)
        `)
        .eq('asset_id', assetId)
        .order('chip', { ascending: true });

      if (threadsError) throw threadsError;

      const threads: Thread[] = (threadsData || []).map(th => ({
        id: th.id,
        chip: th.chip,
        tStart: th.t_start,
        tEnd: th.t_end,
        shapes: th.shapes || [],
        state: th.state as 'open' | 'resolved',
        comments: (th.thread_comments || []).map((c: any) => ({
          id: c.id,
          authorId: c.author_id,
          body: c.body,
          createdAt: c.created_at,
          attachments: c.attachments || []
        }))
      }));

      const asset: ReviewAsset = {
        id: assetData.id,
        videoUrl: assetData.video_url,
        duration: assetData.duration,
        version: assetData.version,
        status: assetData.status as 'in_review' | 'changes_requested' | 'approved',
        shareToken: assetData.share_token,
        threads
      };

      set({ asset, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      console.error('Error loading asset:', err);
    }
  },

  addThread: async (t) => {
    const a = get().asset;
    if (!a) throw new Error('No asset loaded');

    const chip = a.threads.length > 0 
      ? Math.max(...a.threads.map(th => th.chip)) + 1 
      : 1;
    
    const newThread: Thread = {
      ...t,
      id: crypto.randomUUID(),
      chip,
      state: 'open',
      comments: []
    };

    // Optimistic update
    set({
      asset: { ...a, threads: [...a.threads, newThread] },
      selectedThreadId: newThread.id
    });

    // Persist to DB
    try {
      const { error } = await supabase
        .from('threads')
        .insert({
          id: newThread.id,
          asset_id: a.id,
          chip: newThread.chip,
          t_start: newThread.tStart,
          t_end: newThread.tEnd,
          shapes: newThread.shapes,
          state: newThread.state
        });

      if (error) throw error;
      return newThread;
    } catch (err) {
      // Rollback on error
      set({ asset: a, selectedThreadId: undefined });
      throw err;
    }
  },

  addComment: async (threadId, c) => {
    const a = get().asset;
    if (!a) return;

    const now = new Date().toISOString();
    const newComment: Comment = {
      ...c,
      id: crypto.randomUUID(),
      createdAt: now
    };

    // Optimistic update
    const updatedAsset = {
      ...a,
      threads: a.threads.map(th =>
        th.id === threadId
          ? { ...th, comments: [...th.comments, newComment] }
          : th
      )
    };
    set({ asset: updatedAsset });

    // Persist to DB
    try {
      const { error } = await supabase
        .from('thread_comments')
        .insert({
          id: newComment.id,
          thread_id: threadId,
          author_id: c.authorId,
          body: c.body,
          attachments: c.attachments || []
        });

      if (error) throw error;
    } catch (err) {
      // Rollback on error
      set({ asset: a });
      console.error('Error adding comment:', err);
      throw err;
    }
  },

  resolveThread: async (threadId) => {
    const a = get().asset;
    if (!a) return;

    // Optimistic update
    const updatedAsset = {
      ...a,
      threads: a.threads.map(th =>
        th.id === threadId ? { ...th, state: 'resolved' as const } : th
      )
    };
    set({ asset: updatedAsset });

    try {
      const { error } = await supabase
        .from('threads')
        .update({ state: 'resolved' })
        .eq('id', threadId);

      if (error) throw error;
    } catch (err) {
      set({ asset: a });
      console.error('Error resolving thread:', err);
      throw err;
    }
  },

  reopenThread: async (threadId) => {
    const a = get().asset;
    if (!a) return;

    const updatedAsset = {
      ...a,
      threads: a.threads.map(th =>
        th.id === threadId ? { ...th, state: 'open' as const } : th
      )
    };
    set({ asset: updatedAsset });

    try {
      const { error } = await supabase
        .from('threads')
        .update({ state: 'open' })
        .eq('id', threadId);

      if (error) throw error;
    } catch (err) {
      set({ asset: a });
      console.error('Error reopening thread:', err);
      throw err;
    }
  },

  updateThreadShapes: async (threadId, shapes) => {
    const a = get().asset;
    if (!a) return;

    const updatedAsset = {
      ...a,
      threads: a.threads.map(th =>
        th.id === threadId ? { ...th, shapes } : th
      )
    };
    set({ asset: updatedAsset });

    try {
      const { error } = await supabase
        .from('threads')
        .update({ shapes })
        .eq('id', threadId);

      if (error) throw error;
    } catch (err) {
      set({ asset: a });
      console.error('Error updating shapes:', err);
      throw err;
    }
  },

  setStatus: async (status) => {
    const a = get().asset;
    if (!a) return;

    const updatedAsset = { ...a, status };
    set({ asset: updatedAsset });

    try {
      const { error } = await supabase
        .from('review_assets')
        .update({ status })
        .eq('id', a.id);

      if (error) throw error;
    } catch (err) {
      set({ asset: a });
      console.error('Error updating status:', err);
      throw err;
    }
  },

  generateShareToken: async () => {
    const a = get().asset;
    if (!a) return undefined;
    
    // If already has token, return it
    if (a.shareToken) return a.shareToken;
    
    // Generate new token (8 characters from UUID)
    const token = crypto.randomUUID().split('-')[0];
    
    try {
      const { error } = await supabase
        .from('review_assets')
        .update({ share_token: token })
        .eq('id', a.id);

      if (error) throw error;
      
      // Update local state
      const updatedAsset = { ...a, shareToken: token };
      set({ asset: updatedAsset });
      
      return token;
    } catch (err) {
      console.error('Error generating share token:', err);
      throw err;
    }
  },

  // Seletores
  getOpenThreads: () => get().asset?.threads.filter(t => t.state === 'open') ?? [],
  getResolvedThreads: () => get().asset?.threads.filter(t => t.state === 'resolved') ?? [],
  getSelectedThread: () => {
    const { asset, selectedThreadId } = get();
    return asset?.threads.find(t => t.id === selectedThreadId);
  }
}));
