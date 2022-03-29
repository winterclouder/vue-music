import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueLazyLoad from 'vue3-lazyload'
import '@/assets/scss/index.scss'
import loadingDirective from '@/components/base/loading/directive.js'
createApp(App)
  .use(store)
  .use(router)
  .use(VueLazyLoad, {
    loading: require('@/assets/images/default.png')
  })
  .directive('loading', loadingDirective)
  .mount('#app')
