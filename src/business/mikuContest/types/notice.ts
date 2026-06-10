export type MikuNoticeType = 'notice' | 'progress' | 'winner' | 'rejection';

export interface MikuAnnouncement {
  id: string;
  contestId: string;
  title: string;
  content: string;
  type: MikuNoticeType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMikuAnnouncementInput {
  contestId: string;
  title: string;
  content: string;
  type: MikuNoticeType;
  createdBy: string;
}
