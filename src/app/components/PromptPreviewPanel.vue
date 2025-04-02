// src/app/components/PromptPreviewPanel.vue
<template>
    <div class="prompt-preview-panel">
      <label for="generatedPrompt" class="preview-label">Generated Prompt (Preview)</label>

      <div class="preview-area">
        <Textarea
           id="generatedPrompt"
           :value="generatedPromptDisplay"
           readonly
           class="preview-textarea"
           placeholder="Select files and enter optional prefix/suffix to generate prompt..."
        />
        <Button
          icon="pi pi-copy"
          class="copy-button"
          @click="copyActualPrompt"
          v-tooltip.bottom="'Copy Actual Prompt to Clipboard'"
          :disabled="!generatedPromptDisplay || isLoadingFiles"
         />
      </div>

      <div class="status-messages">
         <div v-if="isLoadingFiles" class="loading-indicator">
            <ProgressSpinner style="width: 16px; height: 16px" strokeWidth="8" animationDuration=".8s" class="spinner"/>
            <span>Reading selected files...</span>
         </div>
          <div v-if="fileReadErrors && fileReadErrors.length > 0" class="error-summary">
            <Message severity="warn" :closable="false">
                Could not read {{ fileReadErrors.length }} file(s): {{ fileReadErrorSummary }}
                <ul v-if="fileReadErrors.length <= 5" class="error-list">
                   <li v-for="err in fileReadErrors" :key="err.path">
                        {{ getFileName(err.path) }}: {{ err.error }}
                   </li>
                </ul>
            </Message>
         </div>
      </div>
    </div>
</template>

<script lang="ts">
// Removed unused computed, ref imports
import { defineComponent, inject } from 'vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';
import Tooltip from 'primevue/tooltip';
import { PromptGeneratorContextKey, type PromptGeneratorContext } from './PromptGeneratorKeys';

export default defineComponent({
  name: 'PromptPreviewPanel',
  components: { Textarea, Button, ProgressSpinner, Message },
  directives: { 'tooltip': Tooltip },
  setup() {
    const context = inject<PromptGeneratorContext>(PromptGeneratorContextKey);

    if (!context) {
      throw new Error("PromptPreviewPanel must be used within a PromptGeneratorContainer");
    }

    // Directly destructure the needed values/methods from the context.
    // Context guarantees these exist and have the correct types (including Readonly<Ref<T>> where applicable).
    const {
      generatedPromptDisplay,
      isLoadingFiles,
      fileReadErrors,
      fileReadErrorSummary, // This is a ComputedRef, already readonly
      copyActualPrompt,
      getFileName,
    } = context;

    // Return the destructured values directly. No need for local refs or computeds here.
    return {
      generatedPromptDisplay,
      isLoadingFiles,
      fileReadErrors,
      fileReadErrorSummary,
      copyActualPrompt,
      getFileName,
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

.prompt-preview-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    padding: var(--p-spacing-3, 1rem);
    background-color: var(--p-surface-a);
}

.preview-label {
  display: block;
  margin-bottom: var(--p-spacing-2, 0.5rem);
  font-weight: 600;
  flex-shrink: 0;
}

.preview-area {
    display: flex;
    flex-grow: 1;
    min-height: 0;
    margin-bottom: var(--p-spacing-2, 0.5rem);
    position: relative;
    border: 1px solid var(--p-content-border-color);
    border-radius: var(--p-border-radius);
    overflow: hidden;
}

.preview-textarea {
    flex-grow: 1;
    width: 100%;
    height: 100%;
    resize: none;
    overflow-y: auto;
    border: none;
    padding: var(--p-spacing-2, 0.5rem);
    box-sizing: border-box;
    background-color: var(--p-input-bg, var(--p-surface-b));
    color: var(--p-text-color);
}
.preview-textarea::placeholder {
    color: var(--p-text-color-secondary);
    opacity: 1;
}

.copy-button {
    flex-shrink: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: none;
    align-self: flex-start;
    height: auto;
}

.status-messages {
    flex-shrink: 0;
    margin-top: auto;
}

.loading-indicator {
    display: flex;
    align-items: center;
    margin-top: var(--p-spacing-1, 0.25rem);
    font-size: 0.9em;
    color: var(--p-text-color-secondary);
}
.spinner {
    margin-right: var(--p-spacing-2, 0.5rem);
}

.error-summary {
    margin-top: var(--p-spacing-2, 0.5rem);
}

.error-list {
    margin-top: var(--p-spacing-2, 0.5rem);
    margin-bottom: 0;
    padding-left: var(--p-spacing-3, 1rem);
    list-style-type: disc;
}
.error-list li {
    font-size: 0.9em;
    margin-bottom: var(--p-spacing-1, 0.25rem);
}

</style>