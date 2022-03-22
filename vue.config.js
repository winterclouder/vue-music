const registerRouter = require('./backend/router')

module.exports = {
  devServer: {
    before (app) {
      registerRouter(app)
    }
  }
  // css: {
  //   loaderOptions: {
  //     sass: {
  //       additionalData: `
  //         @import "@/assets/scss/variable.scss;
  //         @import "@/assets/scss/mixin.scss;
  //       `
  //     }
  //   }
  // }
}
