import BScroll from 'better-scroll'
// import ObserveDOM from '@better-scroll/observe-dom'
// import Slide from '@better-scroll/slide'
import { onMounted, onUnmounted, ref } from 'vue'

// BScroll.use(ObserveDOM)
export default function useScroll(wrapperRef, options, emit) {
  const scroll = ref(null)
  onMounted(() => {
    // debugger
    scroll.value = new BScroll(wrapperRef.value, {
      observeDOM: true,
      ...options
    })
    if (options.probeType > 0) {
      scroll.value.on('scroll', (pos) => {
        emit('scroll', pos)
      })
    }
  })

  onUnmounted(() => {
    scroll.value.destroy()
  })

  return scroll
}
