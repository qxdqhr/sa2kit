export interface XhsPost {
  id: string;
  url: string;
  title?: string;
  publishedAt?: string;
}

export interface XhsSource {
  fetchLatestPosts(limit?: number): Promise<XhsPost[]>;
}

export interface XhsMonitorState {
  seenPostIds: string[];
  updatedAt: string;
}

export interface XhsMonitorStateStore {
  read(): Promise<XhsMonitorState>;
  write(state: XhsMonitorState): Promise<void>;
}

export interface XhsNotificationPayload {
  accountLabel: string;
  post: XhsPost;
  detectedAt: string;
}

export interface XhsNotifier {
  notify(payload: XhsNotificationPayload): Promise<void>;
}
