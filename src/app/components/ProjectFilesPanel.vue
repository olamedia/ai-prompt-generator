// src/app/components/ProjectFilesPanel.vue
<template>
  <div class="project-files-panel">
    <div class="top-section">
      <Button
        label="Select Project Directory"
        icon="pi pi-folder-open"
        @click="selectDirectory"
        :disabled="isLoadingDirectory || isLoadingFiles"
        class="select-directory-button"
      />
      <div v-if="isLoadingDirectory" class="loading-indicator">
          <ProgressSpinner style="width: 20px; height: 20px" strokeWidth="6" animationDuration=".8s" class="spinner"/>
          <span>Loading Tree...</span>
      </div>
      <div v-if="selectedDirectory && !isLoadingDirectory" class="directory-path">
        Selected: {{ selectedDirectory }}
      </div>
      <Message v-if="directoryErrorMessage && !isLoadingDirectory" severity="error" :closable="false" class="error-message">{{ directoryErrorMessage }}</Message>
    </div>

    <Divider v-if="treeNodes && treeNodes.length > 0 && !directoryErrorMessage" class="section-divider" />

    <div v-if="treeNodes && treeNodes.length > 0 && !directoryErrorMessage"
         class="tree-section">
       <h4 class="tree-title">Project Files</h4>
       <div class="tree-wrapper">
            <Tree
              :value="treeNodes"
              selectionMode="checkbox"
              :selectionKeys="selectedKeys"
              @update:selectionKeys="onSelectionChange"
              :filter="true"
              filterPlaceholder="Filter files/folders"
              :loading="isLoadingDirectory"
              class="file-tree"
              @node-select="onNodeSelect"
              @node-unselect="onNodeUnselect"
            >
              <template #default="slotProps">
                  <span :class="{'file-node': !slotProps.node.children}">{{ slotProps.node.label }}</span>
              </template>
            </Tree>
       </div>
    </div>
    <div v-else-if="selectedDirectory && !isLoadingDirectory && (!treeNodes || treeNodes.length === 0) && !directoryErrorMessage" class="message-area">
       <p>No readable files or folders found in the selected directory.</p>
    </div>
    <div v-else-if="!selectedDirectory && !isLoadingDirectory && !directoryErrorMessage" class="message-area empty-state">
       <p>Select a project directory to view files.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue'; // Removed unused computed
import Button from 'primevue/button';
import Tree from 'primevue/tree';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';
import Divider from 'primevue/divider';
import type { PromptGeneratorContext } from './PromptGeneratorKeys';
import { PromptGeneratorContextKey } from './PromptGeneratorKeys';

export default defineComponent({
  name: 'ProjectFilesPanel',
  components: { Button, Tree, ProgressSpinner, Message, Divider },
  setup(_) {
    const context = inject<PromptGeneratorContext>(PromptGeneratorContextKey);

    if (!context) {
      throw new Error("ProjectFilesPanel must be used within a PromptGeneratorContainer");
    }

    const {
      selectedDirectory,
      treeNodes, // This is now Ref<TreeNode[]> from context
      selectedKeys,
      isLoadingDirectory,
      isLoadingFiles,
      directoryErrorMessage,
      selectDirectory,
      onNodeSelect,
      onNodeUnselect
    } = context;

    const onSelectionChange = (keys: Record<string, { checked: boolean; partialChecked: boolean }>) => {
      if (selectedKeys && typeof selectedKeys.value !== 'undefined') {
           selectedKeys.value = keys;
      } else {
          console.warn("Could not update selectedKeys via context");
      }
    };

    // treeNodes is now the correct mutable type Ref<TreeNode[]> needed for :value
    return {
      selectedDirectory,
      treeNodes, // Pass the ref directly
      selectedKeys,
      isLoadingDirectory,
      isLoadingFiles,
      directoryErrorMessage,
      selectDirectory,
      onSelectionChange,
      onNodeSelect,
      onNodeUnselect,
    };
  },
});
</script>

<style scoped>
:root {
  --p-spacing-1: 0.25rem;
  --p-spacing-2: 0.5rem;
  --p-spacing-3: 1rem;
}

.project-files-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: var(--p-surface-a);
}

.top-section {
  padding: var(--p-spacing-3, 1rem);
  flex-shrink: 0;
}

.select-directory-button {
    width: 100%;
}

.loading-indicator {
    display: flex;
    align-items: center;
    margin-top: var(--p-spacing-2, 0.5rem);
}
.spinner {
    margin-right: var(--p-spacing-2, 0.5rem);
}

.directory-path {
  font-style: italic;
  color: var(--p-text-color-secondary);
  font-size: 0.9em;
  word-break: break-all;
  margin-top: var(--p-spacing-2, 0.5rem);
}

.error-message {
    margin-top: var(--p-spacing-2, 0.5rem);
}

.section-divider {
    flex-shrink: 0;
    margin-top: 0;
    margin-bottom: 0;
}

.tree-section {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 0;
    overflow: hidden;
}

.tree-title {
    margin-top: 0;
    margin-bottom: var(--p-spacing-2, 0.5rem);
    padding-top: var(--p-spacing-2, 0.5rem);
    padding-left: var(--p-spacing-3, 1rem);
    padding-right: var(--p-spacing-3, 1rem);
    font-weight: 600;
    flex-shrink: 0;
}

.tree-wrapper {
    flex-grow: 1;
    min-height: 0;
    overflow-y: auto;
}

.file-tree {
    width: 100%;
    border: 1px solid var(--p-content-border-color);
    border-radius: var(--p-border-radius);
}

:deep(.file-tree .p-tree-wrapper) {
    padding: var(--p-spacing-1, 0.25rem);
}


.file-node { }

.message-area {
    padding: var(--p-spacing-3, 1rem);
    flex-shrink: 0;
}

.empty-state {
    text-align: center;
}

</style>