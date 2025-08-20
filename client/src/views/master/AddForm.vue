<template>
  <div class="add">
    <v-row class="mb-4">
      <v-col cols="6">
        <v-text-field label="공급처" v-model="form.supplier" dense outlined />
      </v-col>

      <v-col cols="6">
        <v-text-field label="발주일자" v-model="form.orderDate" type="date" dense outlined />
      </v-col>
    </v-row>
  </div>
</template>
<script setup>
import { ref } from 'vue';

const form = ref([{ supplier: '' }, { contact: '' }, { issueNumber: '' }, { orderDate: '' }, { dueDate: '' }, { manager: '' }]);
</script>

<style scoped>
.add {
  width: 500px;
}
</style>
