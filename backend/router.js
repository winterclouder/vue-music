/*
 * 該文件是運行在 Node.js 端的，獲取數據的基本的思路就是後端代理，即提供接口路由供前端頁面使用，然後在路由內部，我們接收到前端請求後，再發送 HTTP 請求到第三方服務接口，攜帶相應的請求參數，包括簽名的參數字段等等。
 * 對於從第三方接口返回的數據，我們會做一層數據處理，最終提供給前端的數據前端可以直接使用，無需再處理。這樣也比較符合真實企業項目的開發規範，即數據的處理放在後端做，前端只做數據渲染和交互。
 */
const axios = require('axios')
const pinyin = require('pinyin')
const Base64 = require('js-base64').Base64
// 獲取簽名方法
const getSecuritySign = require('./sign')

const ERR_OK = 0
const token = 5381

// 歌曲圖片加載失敗時使用的默認圖片
const fallbackPicUrl = 'https://y.gtimg.cn/mediastyle/music_v11/extra/default_300x300.jpg?max_age=31536000'

// 公共參數
const commonParams = {
  g_tk: token,
  loginUin: 0,
  hostUin: 0,
  inCharset: 'utf8',
  outCharset: 'utf-8',
  notice: 0,
  needNewCode: 0,
  format: 'json',
  platform: 'yqq.json'
}

// 獲取一個隨機數值
function getRandomVal(prefix = '') {
  return prefix + (Math.random() + '').replace('0.', '')
}

// 獲取一個隨機 uid
function getUid() {
  const t = (new Date()).getUTCMilliseconds()
  return '' + Math.round(2147483647 * Math.random()) * t % 1e10
}

// 對 axios get 請求的封裝
// 修改請求的 headers 值，合併公共請求參數
function get(url, params) {
  return axios.get(url, {
    headers: {
      referer: 'https://y.qq.com/',
      origin: 'https://y.qq.com/'
    },
    params: Object.assign({}, commonParams, params)
  })
}

// 對 axios post 請求的封裝
// 修改請求的 headers 值
function post(url, params) {
  return axios.post(url, params, {
    headers: {
      referer: 'https://y.qq.com/',
      origin: 'https://y.qq.com/',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

// 處理歌曲列表
function handleSongList(list) {
  const songList = []

  list.forEach((item) => {
    const info = item.songInfo || item
    if (info.pay.pay_play !== 0 || !info.interval) {
      // 過濾付費歌曲和獲取不到時長的歌曲
      return
    }

    // 構造歌曲的數據結構
    const song = {
      id: info.id,
      mid: info.mid,
      name: info.name,
      singer: mergeSinger(info.singer),
      url: '', // 在另一個接口獲取
      duration: info.interval,
      pic: info.album.mid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${info.album.mid}.jpg?max_age=2592000` : fallbackPicUrl,
      album: info.album.name
    }

    songList.push(song)
  })

  return songList
}

// 合併多個歌手的姓名
function mergeSinger(singer) {
  const ret = []
  if (!singer) {
    return ''
  }
  singer.forEach((s) => {
    ret.push(s.name)
  })
  return ret.join('/')
}

// 註冊後端路由
function registerRouter(app) {
  registerRecommend(app)

  registerSingerList(app)

  registerSingerDetail(app)

  registerSongsUrl(app)

  registerLyric(app)

  registerAlbum(app)

  registerTopList(app)

  registerTopDetail(app)

  registerHotKeys(app)

  registerSearch(app)
}

// 註冊推薦列表接口路由
function registerRecommend(app) {
  app.get('/api/getRecommend', (req, res) => {
    // 第三方服務接口 url
    const url = 'https://u.y.qq.com/cgi-bin/musics.fcg'
    // 構造請求 data 參數
    const data = JSON.stringify({
      comm: { ct: 24 },
      recomPlaylist: {
        method: 'get_hot_recommend',
        param: { async: 1, cmd: 2 },
        module: 'playlist.HotRecommendServer'
      },
      focus: { module: 'music.musicHall.MusicHallPlatform', method: 'GetFocus', param: {} }
    })

    // 隨機數值
    const randomVal = getRandomVal('recom')
    // 計算簽名值
    const sign = getSecuritySign(data)

    // 發送 get 請求
    get(url, {
      sign,
      '-': randomVal,
      data
    }).then((response) => {
      const data = response.data
      if (data.code === ERR_OK) {
        // 處理輪播圖數據
        const focusList = data.focus.data.shelf.v_niche[0].v_card
        const sliders = []
        const jumpPrefixMap = {
          10002: 'https://y.qq.com/n/yqq/album/',
          10014: 'https://y.qq.com/n/yqq/playlist/',
          10012: 'https://y.qq.com/n/yqq/mv/v/'
        }
        // 最多獲取 10 條數據
        const len = Math.min(focusList.length, 10)
        for (let i = 0; i < len; i++) {
          const item = focusList[i]
          const sliderItem = {}
          // 單個輪播圖數據包括 id、pic、link 等字段
          sliderItem.id = item.id
          sliderItem.pic = item.cover
          if (jumpPrefixMap[item.jumptype]) {
            sliderItem.link = jumpPrefixMap[item.jumptype] + (item.subid || item.id) + '.html'
          } else if (item.jumptype === 3001) {
            sliderItem.link = item.id
          }

          sliders.push(sliderItem)
        }

        // 處理推薦歌單數據
        const albumList = data.recomPlaylist.data.v_hot
        const albums = []
        for (let i = 0; i < albumList.length; i++) {
          const item = albumList[i]
          const albumItem = {}
          // 推薦歌單數據包括 id、username、title、pic 等字段
          albumItem.id = item.content_id
          albumItem.username = item.username
          albumItem.title = item.title
          albumItem.pic = item.cover

          albums.push(albumItem)
        }

        // 往前端發送一個標準格式的響應數據，包括成功錯誤碼和數據
        res.json({
          code: ERR_OK,
          result: {
            sliders,
            albums
          }
        })
      } else {
        res.json(data)
      }
    })
  })
}

// 註冊歌手列表接口路由
function registerSingerList(app) {
  app.get('/api/getSingerList', (req, res) => {
    const url = 'https://u.y.qq.com/cgi-bin/musics.fcg'
    const HOT_NAME = '熱'

    const data = JSON.stringify({
      comm: { ct: 24, cv: 0 },
      singerList: {
        module: 'Music.SingerListServer',
        method: 'get_singer_list',
        param: { area: -100, sex: -100, genre: -100, index: -100, sin: 0, cur_page: 1 }
      }
    })

    const randomKey = getRandomVal('getUCGI')
    const sign = getSecuritySign(data)

    get(url, {
      sign,
      '-': randomKey,
      data
    }).then((response) => {
      const data = response.data
      if (data.code === ERR_OK) {
        // 處理歌手列表數據
        const singerList = data.singerList.data.singerlist

        // 構造歌手 Map 數據結構
        const singerMap = {
          hot: {
            title: HOT_NAME,
            list: map(singerList.slice(0, 10))
          }
        }

        singerList.forEach((item) => {
          // 把歌手名轉成拼音
          const p = pinyin(item.singer_name)
          if (!p || !p.length) {
            return
          }
          // 獲取歌手名拼音的首字母
          const key = p[0][0].slice(0, 1).toUpperCase()
          if (key) {
            if (!singerMap[key]) {
              singerMap[key] = {
                title: key,
                list: []
              }
            }
            // 每個字母下面會有多名歌手
            singerMap[key].list.push(map([item])[0])
          }
        })

        // 熱門歌手
        const hot = []
        // 字母歌手
        const letter = []

        // 遍歷處理 singerMap，讓結果有序
        for (const key in singerMap) {
          const item = singerMap[key]
          if (item.title.match(/[a-zA-Z]/)) {
            letter.push(item)
          } else if (item.title === HOT_NAME) {
            hot.push(item)
          }
        }
        // 按字母順序排序
        letter.sort((a, b) => {
          return a.title.charCodeAt(0) - b.title.charCodeAt(0)
        })

        res.json({
          code: ERR_OK,
          result: {
            singers: hot.concat(letter)
          }
        })
      } else {
        res.json(data)
      }
    })
  })

  // 做一層數據映射，構造單個 singer 數據結構
  function map(singerList) {
    return singerList.map((item) => {
      return {
        id: item.singer_id,
        mid: item.singer_mid,
        name: item.singer_name,
        pic: item.singer_pic.replace(/\.webp$/, '.jpg').replace('150x150', '800x800')
      }
    })
  }
}

// 註冊歌手詳情接口路由
function registerSingerDetail(app) {
  app.get('/api/getSingerDetail', (req, res) => {
    const url = 'https://u.y.qq.com/cgi-bin/musics.fcg'

    const data = JSON.stringify({
      comm: { ct: 24, cv: 0 },
      singerSongList: {
        method: 'GetSingerSongList',
        param: { order: 1, singerMid: req.query.mid, begin: 0, num: 100 },
        module: 'musichall.song_list_server'
      }
    })

    const randomKey = getRandomVal('getSingerSong')
    const sign = getSecuritySign(data)

    get(url, {
      sign,
      '-': randomKey,
      data
    }).then((response) => {
      const data = response.data
      if (data.code === ERR_OK) {
        const list = data.singerSongList.data.songList
        // 歌單詳情、榜單詳情接口都有類似處理邏輯，固封裝成函數
        const songList = handleSongList(list)

        res.json({
          code: ERR_OK,
          result: {
            songs: songList
          }
        })
      } else {
        res.json(data)
      }
    })
  })
}

// 註冊歌曲 url 獲取接口路由
// 因為歌曲的 url 每天都在變化，所以需要單獨的接口根據歌曲的 mid 獲取
function registerSongsUrl(app) {
  app.get('/api/getSongsUrl', (req, res) => {
    const mid = req.query.mid

    let midGroup = []
    // 第三方接口只支持最多處理 100 條數據，所以如果超過 100 條數據，我們要把數據按每組 100 條切割，發送多個請求
    if (mid.length > 100) {
      const groupLen = Math.ceil(mid.length / 100)
      for (let i = 0; i < groupLen; i++) {
        midGroup.push(mid.slice(i * 100, (100 * (i + 1))))
      }
    } else {
      midGroup = [mid]
    }

    // 以歌曲的 mid 為 key，存儲歌曲 URL
    const urlMap = {}

    // 處理返回的 mid
    function process(mid) {
      const data = {
        req_0: {
          module: 'vkey.GetVkeyServer',
          method: 'CgiGetVkey',
          param: {
            guid: getUid(),
            songmid: mid,
            songtype: new Array(mid.length).fill(0),
            uin: '0',
            loginflag: 0,
            platform: '23',
            h5to: 'speed'
          }
        },
        comm: {
          g_tk: token,
          uin: '0',
          format: 'json',
          platform: 'h5'
        }
      }

      const sign = getSecuritySign(JSON.stringify(data))
      const url = `https://u.y.qq.com/cgi-bin/musics.fcg?_=${getRandomVal()}&sign=${sign}`

      // 發送 post 請求
      return post(url, data).then((response) => {
        const data = response.data
        if (data.code === ERR_OK) {
          const midInfo = data.req_0.data.midurlinfo
          const sip = data.req_0.data.sip
          const domain = sip[sip.length - 1]
          midInfo.forEach((info) => {
            // 獲取歌曲的真實播放 URL
            urlMap[info.songmid] = domain + info.purl
          })
        }
      })
    }

    // 構造多個 Promise 請求
    const requests = midGroup.map((mid) => {
      return process(mid)
    })

    // 並行發送多個請求
    return Promise.all(requests).then(() => {
      // 所有請求響應完畢，urlMap 也就構造完畢了
      res.json({
        code: ERR_OK,
        result: {
          map: urlMap
        }
      })
    })
  })
}

// 註冊歌詞接口
function registerLyric(app) {
  app.get('/api/getLyric', (req, res) => {
    const url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg'

    get(url, {
      '-': 'MusicJsonCallback_lrc',
      pcachetime: +new Date(),
      songmid: req.query.mid,
      g_tk_new_20200303: token
    }).then((response) => {
      const data = response.data
      if (data.code === ERR_OK) {
        res.json({
          code: ERR_OK,
          result: {
            lyric: Base64.decode(data.lyric)
          }
        })
      } else {
        res.json(data)
      }
    })
  })
}

// 註冊歌單專輯接口
function registerAlbum(app) {
  app.get('/api/getAlbum', (req, res) => {
    const data = {
      req_0: {
        module: 'srf_diss_info.DissInfoServer',
        method: 'CgiGetDiss',
        param: {
          disstid: Number(req.query.id),
          onlysonglist: 1,
          song_begin: 0,
          song_num: 100
        }
      },
      comm: {
        g_tk: token,
        uin: '0',
        format: 'json',
        platform: 'h5'
      }
    }

    const sign = getSecuritySign(JSON.stringify(data))

    const url = `https://u.y.qq.com/cgi-bin/musics.fcg?_=${getRandomVal()}&sign=${sign}`

    post(url, data).then((response) => {
      const data = response.data
      if (data.code === ERR_OK) {
        const list = data.req_0.data.songlist
        const songList = handleSongList(list)

        res.json({
          code: ERR_OK,
          result: {
            songs: songList
          }
        })
      } else {
        res.json(data)
      }
    })
  })
}

// 註冊排行榜接口
function registerTopList(app) {
  app.get('/api/getTopList', (req, res) => {
    const url = 'https://u.y.qq.com/cgi-bin/musics.fcg'

    const data = JSON.stringify({
      comm: { ct: 24 },
      toplist: { module: 'musicToplist.ToplistInfoServer', method: 'GetAll', param: {} }
    })

    const randomKey = getRandomVal('recom')
    const sign = getSecuritySign(data)

    get(url, {
      sign,
      '-': randomKey,
      data
    }).then((response) => {
      const data = response.data
      if (data.code === ERR_OK) {
        const topList = []
        const group = data.toplist.data.group

        group.forEach((item) => {
          item.toplist.forEach((listItem) => {
            topList.push({
              id: listItem.topId,
              pic: listItem.frontPicUrl,
              name: listItem.title,
              period: listItem.period,
              songList: listItem.song.map((songItem) => {
                return {
                  id: songItem.songId,
                  singerName: songItem.singerName,
                  songName: songItem.title
                }
              })
            })
          })
        })

        res.json({
          code: ERR_OK,
          result: {
            topList
          }
        })
      } else {
        res.json(data)
      }
    })
  })
}

// 註冊排行榜詳情接口
function registerTopDetail(app) {
  app.get('/api/getTopDetail', (req, res) => {
    const url = 'https://u.y.qq.com/cgi-bin/musics.fcg'
    const { id, period } = req.query

    const data = JSON.stringify({
      detail: {
        module: 'musicToplist.ToplistInfoServer',
        method: 'GetDetail',
        param: {
          topId: Number(id),
          offset: 0,
          num: 100,
          period
        }
      },
      comm: {
        ct: 24,
        cv: 0
      }
    })

    const randomKey = getRandomVal('getUCGI')
    const sign = getSecuritySign(data)

    get(url, {
      sign,
      '-': randomKey,
      data
    }).then((response) => {
      const data = response.data
      if (data.code === ERR_OK) {
        const list = data.detail.data.songInfoList
        const songList = handleSongList(list)

        res.json({
          code: ERR_OK,
          result: {
            songs: songList
          }
        })
      } else {
        res.json(data)
      }
    })
  })
}

// 註冊熱門搜索接口
function registerHotKeys(app) {
  app.get('/api/getHotKeys', (req, res) => {
    const url = 'https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg'

    get(url, {
      g_tk_new_20200303: token
    }).then((response) => {
      const data = response.data
      if (data.code === ERR_OK) {
        res.json({
          code: ERR_OK,
          result: {
            hotKeys: data.data.hotkey.map((key) => {
              return {
                key: key.k,
                id: key.n
              }
            }).slice(0, 10)
          }
        })
      } else {
        res.json(data)
      }
    })
  })
}

// 註冊搜索查詢接口
function registerSearch(app) {
  app.get('/api/search', (req, res) => {
    const url = 'https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp'

    const { query, page, showSinger } = req.query

    const data = {
      _: getRandomVal(),
      g_tk_new_20200303: token,
      w: query,
      p: page,
      perpage: 20,
      n: 20,
      zhidaqu: 1,
      catZhida: showSinger === 'true' ? 1 : 0,
      t: 0,
      flag: 1,
      ie: 'utf-8',
      sem: 1,
      aggr: 0,
      remoteplace: 'txt.mqq.all',
      uin: '0',
      needNewCode: 1,
      platform: 'h5',
      format: 'json'
    }

    get(url, data).then((response) => {
      const data = response.data
      if (data.code === ERR_OK) {
        const songList = []
        const songData = data.data.song
        const list = songData.list

        list.forEach((item) => {
          const info = item
          if (info.pay.payplay !== 0 || !info.interval) {
            // 過濾付費歌曲
            return
          }

          const song = {
            id: info.songid,
            mid: info.songmid,
            name: info.songname,
            singer: mergeSinger(info.singer),
            url: '',
            duration: info.interval,
            pic: info.albummid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${info.albummid}.jpg?max_age=2592000` : fallbackPicUrl,
            album: info.albumname
          }
          songList.push(song)
        })

        let singer
        const zhida = data.data.zhida
        if (zhida && zhida.type === 2) {
          singer = {
            id: zhida.singerid,
            mid: zhida.singermid,
            name: zhida.singername,
            pic: `https://y.gtimg.cn/music/photo_new/T001R800x800M000${zhida.singermid}.jpg?max_age=2592000`
          }
        }

        const { curnum, curpage, totalnum } = songData
        const hasMore = 20 * (curpage - 1) + curnum < totalnum

        res.json({
          code: ERR_OK,
          result: {
            songs: songList,
            singer,
            hasMore
          }
        })
      } else {
        res.json(data)
      }
    })
  })
}

module.exports = registerRouter
