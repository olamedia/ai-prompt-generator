import type { TreeNode } from 'primevue/tree';
import type { StartReviewPayload, FileAnalysisData, AnalysisProgressData } from './types/index';

// Define the structure of the API exposed by the preload script
export interface IElectronAPI {
    openDirectory: () => Promise<string | null>;
  readDirectory: (dirPath: string) => Promise<any[]>; // Use a more specific TreeNode type here if possible
  readFiles: (filePaths: string[]) => Promise<Record<string, { content: string | null; error?: string }>>;
}

// Augment the global Window interface
declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}