import { createApp } from 'vue'
import loading from './loading'
import { addClass, removeClass } from '../../../assets/js/dom'
const relativeCls = 'g-reloatvie'
const loadingDirective = {
  mounted(el, binding) {
    const app = createApp(loading)
    const instance = app.mount(document.createElement('div'))
    el.instance = instance
    const title = binding.arg
    if (typeof title !== 'undefined') {
      instance.setTitle(title)
    }
    if (binding.value) {
      append(el)
    }
  },
  updated(el, binding) {
    const title = binding.arg
    if (typeof title !== 'undefined') {
      el.instance.setTitle(title)
    }
    if (binding.value !== binding.oldValue) {
      binding.value ? append(el) : removeEle(el)
    }
  }
}

function append(el) {
  const style = getComputedStyle(el)
  if (['absolute', 'fixed', 'relative'].indexOf(style.position) === -1) {
    addClass(el, relativeCls)
  }
  el.appendChild(el.instance.$el)
}

function removeEle(el) {
  el.removeChild(el.instance.$el)
  removeClass(el, relativeCls)
}

export default loadingDirective
