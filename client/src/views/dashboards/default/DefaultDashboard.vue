<script setup lang="ts"></script>

<template>
  <div class="safety-banner">
    <img src="@/assets/images/logos/gg.svg" alt="공작이" class="gongjaki" />
    <div class="safety-text">
      <p><strong>작업의 기본은 안전,</strong></p>
      <p><strong>완성의 핵심은 디테일</strong></p>
    </div>
  </div>
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
