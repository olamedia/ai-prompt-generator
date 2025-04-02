// src/app/client-entry.ts
import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import Material from '@primeuix/themes/material';
import 'primeicons/primeicons.css';
import Tooltip from 'primevue/tooltip'; // Import Tooltip service

// Import PrimeVue components
import Button from 'primevue/button';
import Tree from 'primevue/tree';
import Textarea from 'primevue/textarea';
// import Dropdown from 'primevue/dropdown'; // Keep if used elsewhere
// import TabView from 'primevue/tabview'; // Keep if used elsewhere
// import TabPanel from 'primevue/tabpanel'; // Keep if used elsewhere
import ProgressSpinner from 'primevue/progressspinner';
// import Panel from 'primevue/panel'; // Keep if used elsewhere
import Divider from 'primevue/divider'; // Keep if used elsewhere
import InputGroup from 'primevue/inputgroup';
import Message from 'primevue/message';
import Splitter from 'primevue/splitter';       // <-- Add Splitter
import SplitterPanel from 'primevue/splitterpanel'; // <-- Add SplitterPanel

import { definePreset, palette } from '@primeuix/themes';

const app = createApp(App);

const primaryColor = palette('{slate}');
const MyPreset = definePreset(Material, {
  semantic: {
      primary: primaryColor
  }
});
app.use(PrimeVue, {
  theme: {
      preset: MyPreset,
  }
});

// Register Tooltip directive
app.directive('tooltip', Tooltip);

// Register components globally
app.component('Button', Button);
app.component('Tree', Tree);
app.component('Textarea', Textarea);
// app.component('Dropdown', Dropdown);
// app.component('TabView', TabView);
// app.component('TabPanel', TabPanel);
app.component('ProgressSpinner', ProgressSpinner);
// app.component('Panel', Panel);
app.component('Divider', Divider);
app.component('InputGroup', InputGroup);
app.component('Message', Message);
app.component('Splitter', Splitter);           // <-- Register Splitter
app.component('SplitterPanel', SplitterPanel); // <-- Register SplitterPanel

app.mount('#app'); // Simplified mount