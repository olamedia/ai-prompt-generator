// src/app/components/UserInputsPanel.vue
<template>
    <div class="user-inputs-panel">
         <div class="input-group">
             <label for="prefix">Prompt Prefix (Optional)</label>
             <Textarea
               id="prefix"
               :modelValue="promptPrefix"
               @update:modelValue="updatePrefix"
               rows="4"
               autoResize
               :disabled="isLoadingFiles"
               class="input-textarea"
             />
         </div>

         <div class="input-group">
             <label for="suffix">Prompt Suffix (Optional)</label>
             <Textarea
               id="suffix"
               :modelValue="promptSuffix"
               @update:modelValue="updateSuffix"
               rows="4"
               autoResize
               :disabled="isLoadingFiles"
               class="input-textarea"
             />
         </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import Textarea from 'primevue/textarea';
import { PromptGeneratorContextKey, type PromptGeneratorContext } from './PromptGeneratorKeys';

export default defineComponent({
  name: 'UserInputsPanel',
  components: { Textarea },
  setup() {
    const context = inject<PromptGeneratorContext>(PromptGeneratorContextKey);

    if (!context) {
      throw new Error("UserInputsPanel must be used within a PromptGeneratorContainer");
    }

    // Destructure the refs needed. isLoadingFiles is DeepReadonly, but reading .value is fine.
    // promptPrefix and promptSuffix are mutable Refs as per the interface.
    const { promptPrefix, promptSuffix, isLoadingFiles } = context;

    // Methods to update the parent's refs
    const updatePrefix = (value: string) => {
      // promptPrefix is guaranteed to be a Ref if context exists
      promptPrefix.value = value;
    };
    const updateSuffix = (value: string) => {
      // promptSuffix is guaranteed to be a Ref if context exists
      promptSuffix.value = value;
    };

    // Provide default refs ONLY if context might be null (which it shouldn't be due to the check)
    // Directly use the refs from the context.
    return {
      promptPrefix, // Use directly from context
      promptSuffix, // Use directly from context
      isLoadingFiles, // Use directly from context
      updatePrefix,
      updateSuffix,
    };
  },
});
</script>

<style scoped>
:root {
  --p-spacing-2: 0.5rem;
  --p-spacing-3: 1rem;
}

.user-inputs-panel {
    padding: var(--p-spacing-3, 1rem);
    background-color: var(--p-surface-a);
}

.input-group {
    margin-bottom: var(--p-spacing-3, 1rem);
}

.input-group:last-child {
    margin-bottom: 0;
}

.input-group label {
  display: block;
  margin-bottom: var(--p-spacing-2, 0.5rem);
  font-weight: 600;
}

.input-textarea {
    width: 100%;
    box-sizing: border-box;
}
</style>