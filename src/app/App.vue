// src/app/App.vue
<template>
  <div class="app-container">
    <PromptGeneratorContainer />
  </div>
</template>

<script lang="ts">
// ... script remains the same
import { defineComponent } from 'vue';
import PromptGeneratorContainer from './components/PromptGeneratorContainer.vue';

export default defineComponent({
  name: 'App',
  components: {
    PromptGeneratorContainer,
  },
  setup() {
    return {};
  }
});
</script>

<style>
html, body, #app {
  /* ... other base styles ... */
  height: 100%; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; overflow: hidden; background-color: var(--p-surface-b); color: var(--p-text-color); font-size: 14px; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
}

.app-container {
  display: flex; height: 100vh; width: 100vw; box-sizing: border-box;
}

</style>