<template>
  <div class="singer" v-loading="!singers.length">
    <IndexList :data="singers"></IndexList>
  </div>
</template>
<script>
import { getSingerList } from '../service/singer.js'

import IndexList from '@/components/base/index-list/index-list.vue'
export default {
  name: 'singer',
  components: {
    IndexList
  },
  data() {
    return {
      singers: []
    }
  },
  async created() {
    const result = await getSingerList()
    this.singers = result.singers
    // console.log(result.singers)
    // this.singers = result.singers.map(v => {
    //   const temp = v
    //   temp.list = temp.list.map(v2 => {
    //     const temp2 = v2
    //     temp2.name = opencc.simplifiedToTraditional(v2.name)
    //     return temp2
    //   })
    //   return temp
    // })
  }
}
</script>

<style lang="scss" scoped>
  .singer {
    position: fixed;
    width: 100%;
    top:88px;
    bottom: 0;
  }
</style>
