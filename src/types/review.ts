export type Pt = { x: number; y: number };

export type Shape = {
  id: string;
  type: 'path' | 'rect' | 'circle';
  color: string;
  width: number;
  points: Pt[];
};

export type ThreadState = 'open' | 'resolved';

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  attachments?: string[];
}

export interface Thread {
  id: string;
  chip: number;
  tStart: number;
  tEnd?: number;
  shapes: Shape[];
  comments: Comment[];
  state: ThreadState;
}

export interface ReviewAsset {
  id: string;
  videoUrl: string;
  duration: number;
  version: number;
  status: 'in_review' | 'changes_requested' | 'approved';
  shareToken?: string;
  threads: Thread[];
}
