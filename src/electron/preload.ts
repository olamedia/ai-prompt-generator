import { contextBridge, ipcRenderer } from 'electron';
import type { StartReviewPayload, FileAnalysisData, AnalysisProgressData } from '../types/index';
import { TreeNode } from 'primevue/treenode';

console.log('[Preload] Script started.');

// Define the API to expose
const electronAPI = {
    openDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:openDirectory'),
  readDirectory: (dirPath: string): Promise<any[]> => ipcRenderer.invoke('fs:readDirectory', dirPath),
  readFiles: (filePaths: string[]): Promise<Record<string, { content: string | null; error?: string }>> => ipcRenderer.invoke('fs:readFiles', filePaths),
};

// Expose the API securely
try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);
    console.log('Electron API exposed successfully.');
} catch (error) {
    console.error('Failed to expose Electron API:', error);
}
