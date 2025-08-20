import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import vuetify from './plugins/vuetify';
import '@/scss/style.scss';
import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar';
import VueApexCharts from 'vue3-apexcharts';
import VueTablerIcons from 'vue-tabler-icons';

import { fakeBackend } from '@/utils/helpers/fake-backend';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { startSimTicker } from '@/sim/simTicker.js';

// AG Grid 모듈 한번 등록
ModuleRegistry.registerModules([AllCommunityModule]);
// print
import print from 'vue3-print-nb';

const app = createApp(App);
fakeBackend();
app.use(router);
app.use(PerfectScrollbarPlugin);
app.use(createPinia());
app.use(VueTablerIcons);
app.use(print);
app.use(VueApexCharts);
app.use(vuetify).mount('#app');
app.use(createPinia());

const pinia = createPinia();
app.use(pinia);
startSimTicker();
