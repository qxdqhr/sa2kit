import type { LearningRecord } from '../types';
import type { TeachHubApiClient } from '../api/client';
import { parseLearningRecordMarkdown } from '../parsers/learningRecordParser';

export async function fetchLearningRecords(
  client: TeachHubApiClient,
  workspaceId: string,
): Promise<LearningRecord[]> {
  const files = await client.fetchWorkspaceFiles(workspaceId);
  const paths = files
    .filter(
      (f) =>
        f.relativePath.startsWith('learning-records/') && f.relativePath.endsWith('.md'),
    )
    .map((f) => f.relativePath)
    .sort();

  return Promise.all(
    paths.map(async (path) => {
      const content = await client.fetchWorkspaceFileText(workspaceId, path);
      return parseLearningRecordMarkdown(content, path);
    }),
  );
}
