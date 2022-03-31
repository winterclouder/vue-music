<template>
  <ul class="song-list">
    <li
      class="item"
      v-for="(song, index) in songs"
      :key="song.id"
      @click="selectItem(song, index)"
    >
      <!-- <div class="rank" v-if="rank">
        <span :class="getRankCls(index)">{{ getRankText(index) }}</span>
      </div> -->
      <div class="content">
        <h2 class="name">{{song.name}}</h2>
        <p class="desc">{{getDesc(song)}}</p>
      </div>
    </li>
  </ul>
</template>

<script>
  export default {
    name: 'song-list',
    props: {
      songs: {
        type: Array,
        default() {
          return []
        }
      },
      rank: Boolean
    },
    created() {
    },
    emits: ['select'],
    methods: {
      getDesc(song) {
        return `${song.singer}·${song.album}`
      },
      selectItem(song, index) {
        this.$emit('select', { song, index })
      },
      getRankCls(index) {
        if (index <= 2) {
          return `icon icon${index}`
        } else {
          return 'text'
        }
      },
      getRankText(index) {
        if (index > 2) {
          return index + 1
        }
      }
    }
  }
</script>
<style lang="scss" scoped>
  @import "@/assets/scss/variable.scss";
  @import "@/assets/scss/mixin.scss";
  .song-list {
    .item {
      display: flex;
      align-items: center;
      height: 64px;
      box-sizing: border-box;
      font-size: $font-size-medium;
      .rank {
        flex: 1px;
      }
      .content {
        flex: 1;
        line-height: 20px;
        overflow: hidden;
        .name {
          @include no-wrap();
          color: $color-text
        }
        .desc {
          @include no-wrap();
          margin-top: 4px;
          color: $color-text-d;
        }
      }
    }
  }

</style>
