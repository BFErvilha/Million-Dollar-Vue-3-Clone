<template>
  <main>
    <TheGrid />
  </main>
</template>

<script setup lang="ts">
import TheGrid from './components/the-grid/TheGrid.vue'
</script>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f4f5;
}
</style>
