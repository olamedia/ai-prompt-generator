// src/app/components/PromptGeneratorContainer.vue
<template>
    <Splitter class="prompt-generator-container" style="height: 100%">
      <SplitterPanel class="p-d-flex" :size="25" :minSize="15">
        <ProjectFilesPanel />
      </SplitterPanel>
      <SplitterPanel :size="75" :minSize="30">
        <Splitter layout="vertical" style="height: 100%">
          <SplitterPanel class="p-d-flex" :size="30" :minSize="15">
            <UserInputsPanel />
          </SplitterPanel>
          <SplitterPanel class="p-d-flex" :size="70" :minSize="20">
            <PromptPreviewPanel />
          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
    </Splitter>
  </template>

  <script lang="ts">
  // Corrected imports: Remove deepReadonly, keep readonly (it's used later)
  import { defineComponent, ref, provide, watch, computed, readonly } from 'vue';
  import type { TreeNode } from 'primevue/treenode';
  import Splitter from 'primevue/splitter';
  import SplitterPanel from 'primevue/splitterpanel';

  import ProjectFilesPanel from './ProjectFilesPanel.vue';
  import UserInputsPanel from './UserInputsPanel.vue';
  import PromptPreviewPanel from './PromptPreviewPanel.vue';
  import { PromptGeneratorContextKey, type PromptGeneratorContext } from './PromptGeneratorKeys';

  // --- Helper Function (same as before) ---
  const getLanguage = (filePath: string): string => {
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      switch (ext) {
        case 'ts': case 'tsx': return 'typescript';
        case 'js': case 'jsx': return 'javascript';
        case 'vue': return 'vue';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'scss': case 'sass': return 'scss';
        case 'json': return 'json';
        case 'py': return 'python';
        case 'md': return 'markdown';
        case 'java': return 'java';
        case 'cs': return 'csharp';
        case 'go': return 'go';
        case 'php': return 'php';
        case 'rb': return 'ruby';
        case 'swift': return 'swift';
        case 'kt': return 'kotlin';
        case 'rs': return 'rust';
        case 'sh': return 'bash';
        case 'xml': return 'xml';
        case 'yaml': case 'yml': return 'yaml';
        default: return ext || 'text';
      }
  };

  export default defineComponent({
    name: 'PromptGeneratorContainer',
    components: {
      Splitter,
      SplitterPanel,
      ProjectFilesPanel,
      UserInputsPanel,
      PromptPreviewPanel,
    },
    setup() {
      // --- Reactive State ---
      const selectedDirectory = ref<string | null>(null);
      const treeNodes = ref<TreeNode[]>([]); // Stays as Ref<TreeNode[]>
      const selectedKeys = ref<Record<string, { checked: boolean; partialChecked: boolean }>>({});
      const promptPrefix = ref<string>('');
      const promptSuffix = ref<string>('');
      const generatedPromptDisplay = ref<string>('');
      const isLoadingDirectory = ref<boolean>(false);
      const isLoadingFiles = ref<boolean>(false);
      const directoryErrorMessage = ref<string | null>(null);
      const fileContents = ref<Record<string, string | null>>({});
      const fileReadErrors = ref<{ path: string; error: string }[]>([]);

      // --- Timeouts ---
      const fetchFilesTimeout = ref<number | null>(null);
      const generatePromptTimeout = ref<number | null>(null);
      const debounceDelay = 300;

      // --- Helper Methods ---
      const getFileName = (fullPath: string): string => {
        return fullPath?.split(/[\\/]/).pop() || fullPath || '';
      };

      const getRelativePath = (absolutePath: string): string => {
          if (!selectedDirectory.value) {
              return getFileName(absolutePath);
          }
          const normalizedAbsolutePath = absolutePath.replace(/\\/g, '/');
          const normalizedBaseDir = selectedDirectory.value.replace(/\\/g, '/');
          const baseDirWithSlash = normalizedBaseDir.endsWith('/') ? normalizedBaseDir : normalizedBaseDir + '/';

          if (normalizedAbsolutePath.startsWith(baseDirWithSlash)) {
              return normalizedAbsolutePath.substring(baseDirWithSlash.length);
          }
          return getFileName(absolutePath);
      };

      const findNodeByKey = (key: string, nodes: TreeNode[]): TreeNode | null => {
          for (const node of nodes) {
              if (node.key === key) return node;
              if (node.children?.length) {
                  const found = findNodeByKey(key, node.children);
                  if (found) return found;
              }
          }
          return null;
      };

       const getAllFilesFromNode = (node: TreeNode, filePathsSet: Set<string>): void => {
          if (!node.children && node.data && typeof node.data === 'string' && node.selectable !== false) {
              filePathsSet.add(node.data);
          } else if (node.children) {
              for (const child of node.children) {
                  getAllFilesFromNode(child, filePathsSet);
              }
          }
       };

       // --- Core Logic Methods ---
       const getSelectedFilePaths = (): string[] => {
          // console.log('[getSelectedFilePaths] Running. Raw selectedKeys:', JSON.stringify(selectedKeys.value));
          const finalFilePaths = new Set<string>();
          const selectedKeysObject = selectedKeys.value || {};
          const checkedKeys = Object.keys(selectedKeysObject).filter(key => selectedKeysObject[key]?.checked === true);

          // console.log('[getSelectedFilePaths] Keys with checked=true:', JSON.stringify(checkedKeys));
          if (checkedKeys.length > 0 && (!treeNodes.value || treeNodes.value.length === 0)) {
                console.error('[getSelectedFilePaths] CRITICAL: Have selected keys but treeNodes structure is missing!');
                return [];
            }

          for (const key of checkedKeys) {
              const node = findNodeByKey(key, treeNodes.value);
              if (!node) {
                  console.warn(`[getSelectedFilePaths] Node *NOT FOUND* for key: "${key}".`);
                  continue;
              }
              if (!node.children && node.data && typeof node.data === 'string' && node.selectable !== false) {
                 finalFilePaths.add(node.data);
              } else if (node.children && node.selectable !== false) {
                 getAllFilesFromNode(node, finalFilePaths);
              }
          }
          const resultPaths = Array.from(finalFilePaths);
          // console.log('[getSelectedFilePaths] Finished. Returning final paths:', JSON.stringify(resultPaths));
          return resultPaths;
       };

       const buildPromptString = (usePlaceholders: boolean): string => {
          const parts: string[] = [];
          const selectedAbsolutePaths = getSelectedFilePaths();
          const currentFileContents = fileContents.value;

          const trimmedPrefix = promptPrefix.value.trim();
          if (trimmedPrefix) parts.push(trimmedPrefix);

          for (const absolutePath of selectedAbsolutePaths) {
              if (Object.prototype.hasOwnProperty.call(currentFileContents, absolutePath) && currentFileContents[absolutePath] !== null) {
                  const content = currentFileContents[absolutePath];
                  const lang = getLanguage(absolutePath);
                  const relativePath = getRelativePath(absolutePath);
                  const fileBlock = `// ${relativePath}\n\`\`\`${lang}\n${usePlaceholders ? `[Content of ${getFileName(absolutePath)}]` : content?.trim() ?? ''}\n\`\`\``;
                  parts.push(fileBlock);
              } else {
                  const errorInfo = fileReadErrors.value.find(err => err.path === absolutePath);
                  console.warn(`[buildPromptString] Skipping file block for ${getFileName(absolutePath)}. Reason: ${errorInfo ? 'Read error' : 'Content not loaded or null'}`);
              }
          }

          const trimmedSuffix = promptSuffix.value.trim();
          if (trimmedSuffix) parts.push(trimmedSuffix);

          return parts.join('\n\n');
       };

       const generatePromptDisplayMethod = () => {
          generatedPromptDisplay.value = buildPromptString(true);
       };

       const debounceGeneratePromptDisplay = () => {
          if (generatePromptTimeout.value) clearTimeout(generatePromptTimeout.value);
          if(isLoadingFiles.value) return;
          generatePromptTimeout.value = window.setTimeout(generatePromptDisplayMethod, debounceDelay / 2);
       };

        const fetchSelectedFilesContent = async () => {
          const pathsToFetch = getSelectedFilePaths();
          const pathsNeedingFetch: string[] = [];
          const currentSelectedSet = new Set(pathsToFetch);
          const currentFileContents = fileContents.value;
          const currentErrors = fileReadErrors.value;

          const updatedContents: Record<string, string | null> = {};
          let updatedErrors = [...currentErrors];

          for (const path in currentFileContents) {
              if (currentSelectedSet.has(path)) {
                  updatedContents[path] = currentFileContents[path];
              }
          }
          updatedErrors = updatedErrors.filter(err => currentSelectedSet.has(err.path));

           for (const path of pathsToFetch) {
              if (!(path in updatedContents)) {
                  pathsNeedingFetch.push(path);
              }
          }

          fileContents.value = updatedContents;
          fileReadErrors.value = updatedErrors;

          if (pathsNeedingFetch.length === 0) {
              debounceGeneratePromptDisplay();
              return;
          }

          isLoadingFiles.value = true;
          fileReadErrors.value = fileReadErrors.value.filter(err => !pathsNeedingFetch.includes(err.path));

          try {
            const results = await window.electronAPI.readFiles(pathsNeedingFetch);
            const newContents = { ...fileContents.value };
            let newErrors = [...fileReadErrors.value];

            for (const path in results) {
                const normalizedPath = path.replace(/\\/g, '/');
                newContents[normalizedPath] = results[path].content;
                if (results[path].error) {
                     if (!newErrors.some(err => err.path === normalizedPath)) {
                        newErrors.push({ path: normalizedPath, error: results[path].error! });
                     }
                } else {
                     newErrors = newErrors.filter(err => err.path !== normalizedPath);
                }
            }
            fileContents.value = newContents;
            fileReadErrors.value = newErrors;

        } catch (error: any) {
          console.error('Error invoking fs:readFiles:', error);
           let newErrors = [...fileReadErrors.value];
           pathsNeedingFetch.forEach(path => {
               const normalizedPath = path.replace(/\\/g, '/');
               if (!(normalizedPath in fileContents.value) && !newErrors.some(err => err.path === normalizedPath)) {
                   newErrors.push({ path: normalizedPath, error: `IPC Error: ${error?.message || 'Unknown'}` });
                   fileContents.value[normalizedPath] = null;
               }
           });
           fileReadErrors.value = newErrors;
        } finally {
          isLoadingFiles.value = false;
          debounceGeneratePromptDisplay();
        }
       };

       const debounceFetchSelectedFiles = () => {
          if (fetchFilesTimeout.value) clearTimeout(fetchFilesTimeout.value);
          fetchFilesTimeout.value = window.setTimeout(fetchSelectedFilesContent, debounceDelay);
       };

      const loadDirectoryTree = async (dirPath: string) => {
          isLoadingDirectory.value = true;
          directoryErrorMessage.value = null;
          treeNodes.value = [];
          try {
            const nodes = await window.electronAPI.readDirectory(dirPath);
            treeNodes.value = nodes;
            selectedKeys.value = {};
            fileContents.value = {};
            fileReadErrors.value = [];
            generatedPromptDisplay.value = '';
          } catch (error: any) {
            console.error('Error reading directory structure:', error);
            directoryErrorMessage.value = `Failed to read directory: ${error?.message || String(error)}`;
            treeNodes.value = [];
          } finally {
            isLoadingDirectory.value = false;
          }
        };

        const selectDirectory = async () => {
          isLoadingDirectory.value = true;
          directoryErrorMessage.value = null;
          selectedDirectory.value = null;
          treeNodes.value = [];
          selectedKeys.value = {};
          fileContents.value = {};
          fileReadErrors.value = [];
          generatedPromptDisplay.value = '';

          try {
            const pathResult = await window.electronAPI.openDirectory();
            if (pathResult) {
              selectedDirectory.value = pathResult;
              await loadDirectoryTree(pathResult);
            } else {
                isLoadingDirectory.value = false;
            }
          } catch (error: any) {
            console.error('Error selecting directory:', error);
            directoryErrorMessage.value = `Failed to select directory: ${error?.message || String(error)}`;
            isLoadingDirectory.value = false;
          }
        };

        const copyActualPrompt = async () => {
           const actualPrompt = buildPromptString(false);
           if (!actualPrompt.trim()) return;
           try {
               await navigator.clipboard.writeText(actualPrompt);
               console.log('Actual prompt copied!');
           } catch (err) {
               console.error('Failed to copy actual prompt: ', err);
           }
        };

        const onNodeSelect = (_node: TreeNode) => { /* Logic handled by watcher */ };
        const onNodeUnselect = (_node: TreeNode) => { /* Logic handled by watcher */ };


      // --- Computed Properties ---
      const fileReadErrorSummary = computed((): string => {
          const errors = fileReadErrors.value;
          if (!errors || errors.length === 0) return '';
          if (errors.length === 1) return getFileName(errors[0].path);
          const firstFew = errors.slice(0, 3).map(e => getFileName(e.path)).join(', ');
          const remaining = errors.length - 3;
          return remaining > 0 ? `${firstFew} and ${remaining} more` : firstFew;
      });

      // --- Watchers ---
      watch(selectedKeys, (newKeys, oldKeys) => {
          if (JSON.stringify(newKeys) !== JSON.stringify(oldKeys)) {
              // console.log('[Watcher selectedKeys] Value changed:', JSON.stringify(newKeys));
               debounceFetchSelectedFiles();
          }
      }, { deep: true });

      watch(promptPrefix, debounceGeneratePromptDisplay);
      watch(promptSuffix, debounceGeneratePromptDisplay);

      // --- Provide Context ---
      // Use readonly() to make the Ref itself readonly for consumers where appropriate.
      // This matches the Readonly<Ref<T>> types in PromptGeneratorKeys.ts
      const context: PromptGeneratorContext = {
        selectedDirectory: readonly(selectedDirectory),
        treeNodes: treeNodes, // Provide mutable ref - needed for Tree :value
        selectedKeys,
        promptPrefix,
        promptSuffix,
        generatedPromptDisplay: readonly(generatedPromptDisplay),
        isLoadingDirectory: readonly(isLoadingDirectory),
        isLoadingFiles: readonly(isLoadingFiles),
        directoryErrorMessage: readonly(directoryErrorMessage),
        fileReadErrors: readonly(fileReadErrors),
        fileContents: readonly(fileContents),

        // Computed
        fileReadErrorSummary, // Computed refs are already readonly

        // Methods
        selectDirectory,
        copyActualPrompt,
        getFileName,
        getRelativePath,
        getSelectedFilePaths,
        buildPromptString,
        onNodeSelect,
        onNodeUnselect,
      };
      provide(PromptGeneratorContextKey, context);

      // --- Return anything needed by the template ---
      return {}; // Template only has splitter setup
    },
  });
  </script>

  <style scoped>
.prompt-generator-container {
  width: 100%;
  height: 100%;
}

:deep(.p-splitter-panel) {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
:deep(.p-splitter-panel > *) {
    flex-grow: 1;
    min-height: 0;
    min-width: 0;
}

</style>