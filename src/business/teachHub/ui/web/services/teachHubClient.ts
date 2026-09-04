import {
  TeachHubApiClient,
  type GenerateLessonTrigger,
} from '../shared/api/client';

export type { GenerateLessonTrigger };

const webClient = new TeachHubApiClient({
  apiBaseUrl: '',
  credentials: 'include',
});

export const fetchWorkspaces = webClient.fetchWorkspaces.bind(webClient);
export const createWorkspace = webClient.createWorkspace.bind(webClient);
/** @deprecated 使用 createWorkspace */
export const createWorkspaceViaApi = createWorkspace;
export const fetchWorkspaceDetail = webClient.fetchWorkspaceDetail.bind(webClient);
export const updateWorkspace = webClient.updateWorkspace.bind(webClient);
export const archiveWorkspace = webClient.archiveWorkspace.bind(webClient);
/** @deprecated 使用 archiveWorkspace */
export const archiveWorkspaceViaApi = archiveWorkspace;
export const fetchWorkspaceFiles = webClient.fetchWorkspaceFiles.bind(webClient);
export const getWorkspaceFileUrl = webClient.getWorkspaceFileUrl.bind(webClient);
export const fetchWorkspaceFileText = webClient.fetchWorkspaceFileText.bind(webClient);
export const putWorkspaceFileText = webClient.putWorkspaceFileText.bind(webClient);
export const importWorkspaceZip = webClient.importWorkspaceZip.bind(webClient);
export const fetchLessonProgress = webClient.fetchLessonProgress.bind(webClient);
export const updateLessonProgress = webClient.updateLessonProgress.bind(webClient);
export const generateLesson = webClient.generateLesson.bind(webClient);
export const fetchGenerateJobs = webClient.fetchGenerateJobs.bind(webClient);
export const fetchGenerateJob = webClient.fetchGenerateJob.bind(webClient);
