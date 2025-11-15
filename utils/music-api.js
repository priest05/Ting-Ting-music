// 基地址
const baseUrl='http://localhost:3000'
//热门歌曲列表
function getHotSong(){
    return new Promise((resolve,reject)=>{
        const url=`${baseUrl}/top/song`
    wx.request({
      url: url,
      success:(res)=>{
        // console.log('原始响应：',res.data.data);
        if (res.statusCode !== 200) {
          reject(new Error(`请求失败，状态码：${res.statusCode}`))
          return
        }
        try {
            const rawData=res.data.data
            resolve(rawData)
        } catch (e) {
            reject(new Error('数据解析失败'))
        }
    },
      fail: (err) => {
        reject(new Error(`网络错误:${err.errMsg}`))
    }
    })
    })
}

//播放链接
function getPlayUrl(songhash) {
    return new Promise((resolve, reject) => {
        const url=`${baseUrl}/song/url?hash=${songhash}`
      wx.request({
        url: url,
        success: (res) => {
            console.log('原始响应：',res.data);
          if (res.statusCode !== 200) {
            reject(new Error(`请求失败，状态码：${res.statusCode}`))
            return
          }
          try {
            const playUrl = res.data.url[0]
            console.log(playUrl)
            // 缓存策略优化
            // wx.setStorageSync(songName,playUrl)
            resolve(playUrl)
          } catch (e) {
            reject(new Error('数据解析失败'))
          }
        },
        fail: (err) => {
            reject(new Error(`网络错误:${err.errMsg}`))
        }
      })
    })
  }
  
 module.exports = {
    getPlayUrl,
    getHotSong
 }