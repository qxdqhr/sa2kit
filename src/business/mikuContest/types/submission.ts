export type MikuWorkType = 'visual' | 'video' | 'text' | 'audio';

export type MikuSubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface MikuSubmissionContent {
  images?: string[];
  videoLink?: string;
  textContent?: string;
  audioLink?: string;
  coverImage?: string;
}

export interface MikuSubmission {
  id: string;
  contestId: string;
  serialNo: string;
  authorId: string;
  authorNickname: string;
  title: string;
  type: MikuWorkType;
  description: string;
  tags: string[];
  content: MikuSubmissionContent;
  voteCount: number;
  status: MikuSubmissionStatus;
  rejectReason?: string;
  createdAt: string;
  reviewedAt?: string;
  updatedAt: string;
}

export interface MikuSubmissionFilter {
  status?: MikuSubmissionStatus;
  type?: MikuWorkType;
  authorId?: string;
  authorKeyword?: string;
  titleKeyword?: string;
}

export interface CreateMikuSubmissionInput {
  contestId: string;
  authorId: string;
  authorNickname: string;
  title: string;
  type: MikuWorkType;
  description: string;
  tags?: string[];
  content: MikuSubmissionContent;
}

export interface ReviewMikuSubmissionInput {
  submissionId: string;
  reviewerId: string;
  action: 'approve' | 'reject';
  rejectReason?: string;
}

export interface MikuSubmissionExportRow {
  投稿编号: string;
  投稿ID: string;
  赛事ID: string;
  作者ID: string;
  作者昵称: string;
  作品名称: string;
  作品类型: MikuWorkType;
  简介: string;
  标签: string;
  审核状态: MikuSubmissionStatus;
  驳回原因: string;
  票数: number;
  提交时间: string;
  更新时间: string;
}
