// src/app/components/PromptGeneratorKeys.ts
import { InjectionKey, Ref, ComputedRef } from 'vue';
import type { TreeNode } from 'primevue/treenode';

// Define the structure of the data/methods being provided
export interface PromptGeneratorContext {
  selectedDirectory: Readonly<Ref<string | null>>;
  treeNodes: Ref<TreeNode[]>; // Mutable for Tree :value
  selectedKeys: Ref<Record<string, { checked: boolean; partialChecked: boolean }>>; // Mutable for v-model
  promptPrefix: Ref<string>; // Mutable for v-model
  promptSuffix: Ref<string>; // Mutable for v-model
  generatedPromptDisplay: Readonly<Ref<string>>;
  isLoadingDirectory: Readonly<Ref<boolean>>;
  isLoadingFiles: Readonly<Ref<boolean>>;
  directoryErrorMessage: Readonly<Ref<string | null>>;
  // Adjust the type to reflect that the .value (the array) is also readonly
  fileReadErrors: Readonly<Ref<ReadonlyArray<{ path: string; error: string }>>>;
  fileReadErrorSummary: ComputedRef<string>;
  // Adjust fileContents as well if readonly() is used on it
  fileContents: Readonly<Ref<Readonly<Record<string, string | null>>>>;


  // Methods remain the same
  selectDirectory: () => Promise<void>;
  copyActualPrompt: () => Promise<void>;
  getFileName: (fullPath: string) => string;
  getRelativePath: (absolutePath: string) => string;
  getSelectedFilePaths: () => string[];
  buildPromptString: (usePlaceholders: boolean) => string;
  onNodeSelect: (node: TreeNode) => void;
  onNodeUnselect: (node: TreeNode) => void;
}

// Create the InjectionKey
export const PromptGeneratorContextKey: InjectionKey<PromptGeneratorContext> = Symbol('PromptGeneratorContext');