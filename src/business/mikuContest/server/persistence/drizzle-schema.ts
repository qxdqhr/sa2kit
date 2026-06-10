import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type {
  MikuAnnouncement,
  MikuContestConfig,
  MikuSubmissionContent,
  MikuVoterRestriction,
  MikuVoteRecord,
} from '../../types';

export const mikuContestConfigs = pgTable('miku_contest_configs', {
  contestId: text('contest_id').primaryKey(),
  config: jsonb('config').$type<MikuContestConfig>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mikuContestSubmissions = pgTable('miku_contest_submissions', {
  id: text('id').primaryKey(),
  contestId: text('contest_id').notNull(),
  serialNo: text('serial_no').notNull(),
  authorId: text('author_id').notNull(),
  authorNickname: text('author_nickname').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  description: text('description').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull(),
  content: jsonb('content').$type<MikuSubmissionContent>().notNull(),
  voteCount: integer('vote_count').notNull().default(0),
  status: text('status').notNull(),
  rejectReason: text('reject_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const mikuContestVotes = pgTable('miku_contest_votes', {
  id: text('id').primaryKey(),
  contestId: text('contest_id').notNull(),
  submissionId: text('submission_id').notNull(),
  voterId: text('voter_id').notNull(),
  votedAt: text('voted_at').notNull(),
  dayKey: text('day_key').notNull(),
  deviceId: text('device_id'),
  ip: text('ip'),
});

export const mikuContestNotices = pgTable('miku_contest_notices', {
  id: text('id').primaryKey(),
  contestId: text('contest_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const mikuContestVoterRestrictions = pgTable('miku_contest_voter_restrictions', {
  id: text('id').primaryKey(),
  contestId: text('contest_id').notNull(),
  data: jsonb('data').$type<MikuVoterRestriction>().notNull(),
});

export type MikuContestVoteRow = typeof mikuContestVotes.$inferSelect & MikuVoteRecord;
export type MikuContestNoticeRow = typeof mikuContestNotices.$inferSelect & MikuAnnouncement;
