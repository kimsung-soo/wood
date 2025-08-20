<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard>
    <h5>제품목록</h5>
    <br />
    <ag-grid-vue :rowData="rowData" :columnDefs="colDefs" :theme="quartz" style="height: 200px"> </ag-grid-vue>
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3'; // Vue Data Grid Component
import UiParentCard from '@/components/shared/UiParentCard.vue';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const quartz = themeQuartz;

const rowData = ref([
  { make: 'Tesla', model: 'Model Y', price: 64950, electric: true },
  { make: 'Ford', model: 'F-Series', price: 33850, electric: false },
  { make: 'Toyota', model: 'Corolla', price: 29600, electric: false }
]);

// Column Definitions: Defines the columns to be displayed.
const colDefs = ref([
  { field: 'make', editable: true }, //
  { field: 'model' },
  { field: 'price' },
  { field: 'electric' }
]);
const page = ref({ title: 'BOM관리' });
const breadcrumbs = shallowRef([
  {
    title: '기준정보',
    disabled: true,
    href: '#'
  },
  {
    title: 'BOM 관리',
    disabled: false,
    href: '#'
  }
]);
</script>
