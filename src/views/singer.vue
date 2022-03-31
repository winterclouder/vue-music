<template>
  <div class="singer" v-loading="!singers.length">
    <IndexList :data="singers" @select="selectSinger">
    </IndexList>
    <!-- <router-view :singer="selectedSinger"></router-view> -->
    <router-view v-slot="{Component}">
      <transition name="slide">
        <component :is="Component" :singer="selectedSinger"></component>
      </transition>
    </router-view>
  </div>
</template>
<script>
import { getSingerList } from '../service/singer.js'
import storage from 'good-storage'
import { SINGER_KEY } from '@/assets/js/constant'
import IndexList from '@/components/base/index-list/index-list.vue'
export default {
  name: 'singer',
  components: {
    IndexList
  },
  data() {
    return {
      singers: [],
      selectedSinger: null
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
  },
  methods: {
    selectSinger (singer) {
      console.log(singer.mid)
      this.selectedSinger = singer
      this.cacheSinger(singer)
      this.$router.push({
        path: `/singer/${singer.mid}`
      })
    },
    cacheSinger(singer) {
      storage.session.set(SINGER_KEY, singer)
    }
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
