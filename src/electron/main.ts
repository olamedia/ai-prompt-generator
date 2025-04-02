import path, { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import type { Dirent } from 'fs'; // Import Dirent type
import * as fs from 'fs/promises';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../icon_256.png?asset'; 

// --- ESM __dirname Equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Types ---
// Define the structure expected by the PrimeVue Tree component in the renderer
// This matches the structure created by readDirectoryRecursive below.
interface FileTreeNode {
    key: string;       // Unique key for the node (full path used here)
    label: string;     // Display name (file/folder name)
    data: string;      // Custom data payload (full path used here)
    icon?: string;     // Icon for the node
    children?: FileTreeNode[]; // Child nodes for directories
    selectable: boolean;// If the node can be selected/checked
}

// --- Globals ---
let mainWindow: BrowserWindow | null = null;

// --- Window Creation ---
function createWindow(): void {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'), // Ensure this path is correct relative to the built main.js
            sandbox: false, // Review security implications if loading external content
            contextIsolation: true, // Recommended for security
            nodeIntegration: false, // Recommended for security
        },
    });

    // Determine the path to the renderer's index.html
    // VITE_DEV_SERVER_URL is injected by vite-plugin-electron in development
    if (process.env.VITE_DEV_SERVER_URL) {
        console.log(`Loading from Dev Server: ${process.env.VITE_DEV_SERVER_URL}`);
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        // Open DevTools automatically in development
        if (!app.isPackaged) {
            mainWindow.webContents.openDevTools();
        }
    } else {
        // Load the built index.html in production
        // Path is relative from dist/electron/main.js to dist/renderer/index.html
        const indexPath = path.join(__dirname, '../renderer/index.html');
        console.log(`Loading from Production Path: file://${indexPath}`);
        mainWindow.loadFile(indexPath);
    }

    mainWindow.on('ready-to-show', () => {
        if (!mainWindow) return;
        mainWindow.show();
    });

    // Open external links in the default browser
    mainWindow.webContents.setWindowOpenHandler((details) => {
        try {
            const url = new URL(details.url);
            if (['http:', 'https:'].includes(url.protocol)) {
                shell.openExternal(details.url);
            }
        } catch (e) {
            console.error('Failed to open URL:', details.url, e);
        }
        return { action: 'deny' }; // Prevent Electron from opening a new window
    });

    mainWindow.on('closed', () => {
        mainWindow = null; // Dereference window object for garbage collection
    });
}

// --- App Lifecycle ---
app.whenReady().then(() => {
    // Set app user model id for windows (improves taskbar behavior)
    electronApp.setAppUserModelId('com.yourcompany.promptgenerator'); // <-- Set a relevant App ID

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    // Register IPC Handlers BEFORE creating the window
    registerIPCHandlers();

    createWindow();

    app.on('activate', function () {
        // On macOS, re-create a window when the dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    // Quit when all windows are closed, except on macOS
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

console.log("Electron Main Process Started");

// --- IPC Handlers ---

/**
 * Recursively reads a directory and builds a tree structure suitable for PrimeVue Tree.
 * Marks both files and directories as selectable.
 *
 * @param dirPath The absolute path to the directory to read.
 * @returns A Promise resolving to an array of FileTreeNode objects.
 */
async function readDirectoryRecursive(dirPath: string): Promise<FileTreeNode[]> {
    const nodes: FileTreeNode[] = [];
    const ignoreList = new Set(['node_modules', 'dist', 'build', '.git', '.svn', '.hg', 'bower_components', '.vscode', '.idea', '.DS_Store']); // Common ignores

    try {
        // Read directory entries, getting Dirent objects with type info
        const entries: Dirent[] = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            // Basic filtering for common nuisance/build folders/files
            if (entry.name.startsWith('.') || ignoreList.has(entry.name)) {
                continue;
            }

            // Base node structure - both files and folders are selectable for the prompt generator
            const node: Partial<FileTreeNode> = {
                key: fullPath.replace(/\\/g, '/'), // Normalize path separators for key consistency
                label: entry.name,
                data: fullPath.replace(/\\/g, '/'), // Store normalized full path in data
                selectable: true,
            };

            if (entry.isDirectory()) {
                node.icon = 'pi pi-fw pi-folder';
                node.children = await readDirectoryRecursive(fullPath);
                // Only add folder node if it's not empty after filtering children
                if (node.children.length > 0) {
                     nodes.push(node as FileTreeNode);
                }
            } else if (entry.isFile()) {
                node.icon = 'pi pi-fw pi-file';
                nodes.push(node as FileTreeNode);
            }
            // Skip symlinks, block devices, etc.
        }

        // Sort entries: folders first, then files, alphabetically
        nodes.sort((a, b) => {
            const aIsDir = !!a.children;
            const bIsDir = !!b.children;
            if (aIsDir !== bIsDir) {
                return aIsDir ? -1 : 1; // Directories first
            }
            return a.label.localeCompare(b.label);
        });

    } catch (err: any) {
        // Log errors during filesystem access (e.g., permissions) but don't crash
        console.error(`Error reading directory ${dirPath}: ${err.message}`);
        // Optionally return an empty array or re-throw depending on desired error handling
    }
    return nodes;
}

// --- IPC Handler Registration ---
function registerIPCHandlers(): void {

    /**
     * IPC handler: Opens a dialog for the user to select a directory.
     */
    ipcMain.handle('dialog:openDirectory', async () => {
        if (!mainWindow) return null; // Ensure window exists
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
        });
        if (!canceled && filePaths.length > 0) {
            return filePaths[0].replace(/\\/g, '/'); // Normalize path
        }
        return null;
    });

    /**
     * IPC handler: Reads the directory structure for a given path.
     * Returns an array containing a single root node representing the selected directory.
     */
    ipcMain.handle('fs:readDirectory', async (event, dirPath: string): Promise<FileTreeNode[]> => {
        if (!dirPath || typeof dirPath !== 'string') {
            console.warn('fs:readDirectory called with invalid path:', dirPath);
            return [];
        }

        try {
            const stats = await fs.stat(dirPath);
            if (!stats.isDirectory()) {
                console.error(`fs:readDirectory: Path is not a directory: ${dirPath}`);
                throw new Error('Selected path is not a valid directory.'); // Throw error to be caught below
            }

            const rootName = path.basename(dirPath);
            const normalizedDirPath = dirPath.replace(/\\/g, '/');

            const rootNode: FileTreeNode = {
                key: normalizedDirPath,
                label: rootName,
                data: normalizedDirPath,
                icon: 'pi pi-fw pi-folder-open', // Icon for the root
                selectable: true,              // Make root selectable
                children: await readDirectoryRecursive(dirPath), // Populate children
            };

            // Return the structure wrapped in an array for the Tree component
            return [rootNode];

        } catch (err: any) {
            console.error(`Error in fs:readDirectory handler for path ${dirPath}: ${err.message}`);
            // Send error back to renderer to display
            throw new Error(`Failed to read directory: ${err.message}`);
        }
    });

    /**
     * IPC handler: Reads the content of multiple text files.
     */
    ipcMain.handle('fs:readFiles', async (event, filePaths: string[]) => {
        const results: Record<string, { content: string | null; error?: string }> = {};
        // More comprehensive list, but adjust as needed
        const textExtensions = new Set([
            '.txt', '.md', '.markdown', '.json', '.yaml', '.yml', '.xml', '.html', '.htm', '.css', '.scss', '.sass', '.less',
            '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.php', '.py', '.rb', '.java', '.cs', '.go', '.rs',
            '.c', '.cpp', '.h', '.hpp', '.swift', '.kt', '.kts', '.sh', '.bash', '.zsh', '.ps1', '.bat', '.sql', '.csv', '.log',
            '.gitignore', '.dockerfile', 'dockerfile', '.env', '.config', '.ini', '.toml', '.properties'
            // Add or remove extensions relevant to your use case
        ]);

        for (const filePath of filePaths) {
             const normalizedPath = filePath.replace(/\\/g, '/'); // Use normalized path as key
            try {
                const ext = path.extname(normalizedPath).toLowerCase();
                const baseName = path.basename(normalizedPath).toLowerCase(); // For files like 'dockerfile'

                // Skip likely non-text files
                if (!textExtensions.has(ext) && !textExtensions.has(baseName)) {
                     // Check if it looks like text despite extension (e.g., file with no extension)
                     // This is a basic heuristic and might misclassify binary files
                     const peekBuffer = Buffer.alloc(1024);
                     let isText = true;
                     try {
                         const fd = await fs.open(normalizedPath, 'r');
                         const { bytesRead } = await fd.read(peekBuffer, 0, 1024, 0);
                         await fd.close();
                         // Check for null bytes or common non-printable ASCII/control chars
                         for (let i = 0; i < bytesRead; i++) {
                             if (peekBuffer[i] === 0) { // Null byte often indicates binary
                                 isText = false;
                                 break;
                             }
                         }
                     } catch { /* Ignore peek errors */ }


                    if (!isText) {
                        console.warn(`Skipping potentially non-text file: ${normalizedPath}`);
                        results[normalizedPath] = { content: null, error: 'Skipped: Likely binary file' };
                        continue;
                    } else {
                         console.log(`Reading file without common text extension (assuming text): ${normalizedPath}`);
                    }
                }

                // Add file size check
                const stats = await fs.stat(normalizedPath);
                const maxSizeMB = 5; // Example: 5 MB limit
                if (stats.size > maxSizeMB * 1024 * 1024) {
                    console.warn(`Skipping large file: ${normalizedPath} (${(stats.size / (1024*1024)).toFixed(2)} MB)`);
                    results[normalizedPath] = { content: null, error: `Skipped: File exceeds ${maxSizeMB}MB limit` };
                    continue;
                }
                if (stats.size === 0) {
                    results[normalizedPath] = { content: '' }; // Return empty string for empty files
                    continue;
                }


                const content = await fs.readFile(normalizedPath, 'utf-8');
                results[normalizedPath] = { content };
            } catch (err: any) {
                console.error(`Error reading file ${normalizedPath}:`, err);
                results[normalizedPath] = { content: null, error: err.code === 'ENOENT' ? 'File not found' : err.message || 'Failed to read file' };
            }
        }
        return results;
    });

} // End of registerIPCHandlers