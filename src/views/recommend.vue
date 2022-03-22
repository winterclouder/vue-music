<template>
  <div class="recommend">
    <div v-for="a in result.value.albums" :key="a">
      {{ a.title }}
    </div>
    <!-- {{ albums }} -->
  </div>
</template>

<script setup>
import { getRecommend } from '@/service/recommend'
import { onBeforeMount, reactive } from 'vue'
const result = reactive({ })
onBeforeMount(async () => {
  const res = await getRecommend()
  result.value = res
  console.log(result)
})
</script>
