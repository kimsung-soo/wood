<script setup lang="ts">
// imported components
// import TotalEarning from './components/TotalEarning.vue';
// import TotalOrder from './components/TotalOrder.vue';
// import TotalIncome from './components/TotalIncome.vue';
// import TotalGrowth from './components/TotalGrowth.vue';
// import PopularStocks from './components/PopularStocks.vue';
</script>

<template>
  <div class="safety-banner">
    <img src="@/assets/images/logos/gg.svg" alt="공작이" class="gongjaki" />
    <div class="safety-text">
      <p><strong>작업의 기본은 안전,</strong></p>
      <p><strong>완성의 핵심은 디테일</strong></p>
    </div>
  </div>
  <!-- <v-row> -->
  <!-- -------------------------------------------------------------------- -->
  <!-- Total Earning -->
  <!-- -------------------------------------------------------------------- -->
  <!-- <v-col cols="12" md="4">
      <TotalEarning />
    </v-col> -->
  <!-- -------------------------------------------------------------------- -->
  <!-- Total Order -->
  <!-- -------------------------------------------------------------------- -->
  <!-- <v-col cols="12" md="4">
      <TotalOrder />
    </v-col> -->
  <!-- -------------------------------------------------------------------- -->
  <!-- Total Income -->
  <!-- -------------------------------------------------------------------- -->
  <!-- <v-col cols="12" md="4">
      <TotalIncome />
    </v-col> -->

  <!-- -------------------------------------------------------------------- -->
  <!-- Total Growth -->
  <!-- -------------------------------------------------------------------- -->
  <!-- <v-col cols="12" lg="8">
      <TotalGrowth />
    </v-col> -->

  <!-- -------------------------------------------------------------------- -->
  <!-- Popular Stocks -->
  <!-- -------------------------------------------------------------------- -->
  <!-- <v-col cols="12" lg="4">
      <PopularStocks />
    </v-col>
  </v-row> -->
</template>

<style scoped>
.safety-banner {
  background-color: rgb(var(--v-theme-secondary), 0.05);
}

.gongjaki {
  width: 250px;
  margin-top: 27%;
}

.safety-text {
  /* margin-left: 2rem; */
  margin-right: 15rem;
  font-size: 6rem;
}

strong {
  user-select: none;
}
</style>
