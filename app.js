// app.js
const { getPlayUrl, getHotSong } = require('./utils/music-api');
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    //播放列表初始化
    const cachedList=JSON.parse(JSON.stringify(wx.getStorageSync('playlist')))
    if(cachedList){
        this.globalData.playList=cachedList
    }
    this.initAudioManager()
  },
  globalData: {
    userInfo: null,
    playList:[], //原始播放列表
    isPlaying:true, //当前是否在播放
    playMode:0, //播放模式
    audioManager:null,
    currentSong:{},
    currentSonghash:'', //当前歌曲的hash值
    currentIndex: -1 //当前歌曲在列表中的索引
  },

//初始化播放器
initAudioManager(){
    this.globalData.audioManager = wx.createInnerAudioContext()
    this.globalData.audioManager.id = 'musicPlayer'
    this.globalData.audioManager.autoplay = true
    this.globalData.audioManager.loop = false
    this.globalData.audioManager.obeyMuteSwitch = false
    this.globalData.audioManager.volume = 1.0
    // 播放事件监听
    this.globalData.audioManager.onPlay(() => {
        console.log('音频开始播放');
        this.globalData.isPlaying = true;
        this.globalEvent.emit('playStatusChange', true)
    })
    // 暂停事件监听
    this.globalData.audioManager.onPause(() => {
        console.log('音频暂停');
        this.globalData.isPlaying = false;
        this.globalEvent.emit('playStatusChange', false)
    })
    // 停止事件监听
    this.globalData.audioManager.onStop(() => {
        console.log('音频停止');
        this.globalData.isPlaying = false;
        this.globalEvent.emit('playStatusChange', false)
    })
    // 播放结束事件监听
    this.globalData.audioManager.onEnded(() => {
        // 根据播放模式切换歌曲
        if (this.globalData.playMode === 0) {
            // 顺序播放，播放下一首
            this.playNext()
        } else if (this.globalData.playMode === 1) {
            // 单曲循环，重新播放当前歌曲
            if (this.globalData.currentSong && this.globalData.currentSong.url) {
                // 重置当前时间并播放
                this.globalData.audioManager.currentTime = 0
                this.globalData.audioManager.play()
                this.globalData.isPlaying = true
                this.globalEvent.emit('playStatusChange', true)
            } else {
                this.loadSong(this.globalData.currentSong.songhash, this.globalData.currentIndex)
            }
        } else if (this.globalData.playMode === 2) {
            // 随机播放，随机播放列表中的歌曲
            const randomIndex = Math.floor(Math.random() * this.globalData.playList.length)
            this.globalData.currentIndex = randomIndex
            this.globalData.currentSong = this.globalData.playList[randomIndex]
            this.loadSong(this.globalData.playList[randomIndex].songhash, randomIndex)
        }
    })
    // 错误事件监听
    this.globalData.audioManager.onError((res) => {
        console.error('音频播放错误:', res);
        this.globalData.isPlaying = false;
        this.globalEvent.emit('playStatusChange', false)
        wx.showToast({
            title: '播放失败: ' + res.errMsg,
            icon: 'none'
        })
    })
    // 进度更新事件监听
    this.globalData.audioManager.onTimeUpdate(() => {
        this.globalEvent.emit('timeUpdate', {
            currentTime: this.globalData.audioManager.currentTime || 0,
            duration: this.globalData.audioManager.duration || 0
        })  
    })
    // 可以播放事件监听
    this.globalData.audioManager.onCanplay(() => {
        console.log('音频可以播放了')
        if (this.globalData.audioManager.duration === 0) {
            setTimeout(() => {
                if (this.globalData.audioManager && this.globalData.audioManager.duration > 0) {
                    this.globalEvent.emit('timeUpdate', {
                        currentTime: this.globalData.audioManager.currentTime,
                        duration: this.globalData.audioManager.duration
                    })
                }
            }, 500)
        }
    })
    // 加载中事件监听
    this.globalData.audioManager.onWaiting(() => {
        console.log('音频加载中...')
    })
    // 跳转中事件监听
    this.globalData.audioManager.onSeeking(() => {
        console.log('音频跳转中...')
    })
    // 跳转完成事件监听
    this.globalData.audioManager.onSeeked(() => {
        console.log('音频跳转完成')
    })
},
globalEvent:{
    listeners:{},
    /**
     * 注册事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback){
        if (!event || typeof callback !== 'function') {
            console.error('事件名称和回调函数必须提供')
            return
        }
        if (!this.listeners[event]) {
            this.listeners[event] = []
        }
        // 避免重复添加同一个回调函数
        if (!this.listeners[event].includes(callback)) {
            this.listeners[event].push(callback)
            console.log(`事件监听器已注册: ${event}`)
        }
    },
    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (!event || !this.listeners[event]) {
            return
        }
        // 如果提供了特定回调函数，则只移除该回调
        if (callback && typeof callback === 'function') {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1)
                console.log(`事件监听器已移除: ${event}`)
            }
        } else {
            // 如果没有提供回调函数，则移除该事件的所有监听器
            this.listeners[event] = []
            console.log(`事件所有监听器已移除: ${event}`)       
        }
        // 清理空事件
        if (this.listeners[event] && this.listeners[event].length === 0) {
            delete this.listeners[event]
        }
    },
    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 传递给回调函数的数据
     */
    emit(event, data) {
        if (!event) {
            console.error('事件名称必须提供')
            return  
        }
        const app = getApp()    
        // 处理特殊事件类型，直接更新全局状态
        if (event === 'currentSongChange') {
            app.globalData.currentSong = data
            console.log('当前歌曲已更新')
        } else if (event === 'playStatusChange') {
            app.globalData.isPlaying = data
            console.log(`播放状态已更新: ${data ? '播放中' : '已暂停'}`)
        }
        // 触发注册的回调函数
        if (this.listeners[event] && this.listeners[event].length > 0) {
            console.log(`触发事件: ${event}，${this.listeners[event].length} 个监听器`)
            // 复制回调数组，避免在回调执行过程中修改数组导致的问题
            const callbacks = [...this.listeners[event]]
            callbacks.forEach((callback, index) => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`执行事件 ${event} 的监听器 ${index} 时出错:`, error)
                }
            })
        }
    },
    /**
     * 清除所有事件监听器
     */
    clear() {
        this.listeners = {}
        console.log('所有事件监听器已清除')     
    },
    /**
     * 获取指定事件的监听器数量
     * @param {string} event - 事件名称
     * @returns {number} 监听器数量
     */
    getListenerCount(event) {
        if (!event || !this.listeners[event]) {
            return 0
        }
        return this.listeners[event].length
    }
},
//加载歌曲
  async loadSong(currentSonghash,index){
      if(!currentSonghash){
          console.error('hash 参数缺失')
          return
      }
      try{
          const playUrl=await getPlayUrl(currentSonghash)
          const songWithUrl={
              ...this.globalData.currentSong,
              url:playUrl
          }
          this.globalData.currentSong=songWithUrl
          this.globalData.isLoading = false
          this.playSong(songWithUrl, index)
      }catch(error){
          this.globalData.isLoading = false
          wx.showToast({title:'播放地址获取失败',icon:'none'})
      }  
  },
//播放歌曲
playSong(song, index){
    if (!song || !song.url) {
        wx.showToast({title: '歌曲信息不完整', icon: 'none'})
        return
    }
    if (!this.globalData.audioManager) {
        this.initAudioManager()
    }
    this.globalData.currentSong = song
    this.globalEvent.emit('currentSongChange', song)
    if (typeof index === 'number' && index >= 0) {
        this.globalData.currentIndex = index
    } else if (this.globalData.playList.length > 0) {
        const songIndex = this.globalData.playList.findIndex(item => item.songhash === song.songhash)
        this.globalData.currentIndex = songIndex >= 0 ? songIndex : 0
    } else {
        this.globalData.currentIndex = 0
    }
    try {
        this.globalData.audioManager.stop()
        this.globalData.audioManager.offCanplay()
        this.globalData.audioManager.offTimeUpdate()
        this.globalData.audioManager.src = song.url
        console.log('设置音频源:', song.url)
        // 重新绑定时间更新事件
        this.globalData.audioManager.onTimeUpdate(() => {
            this.globalEvent.emit('timeUpdate', {
                currentTime: this.globalData.audioManager.currentTime || 0,
                duration: this.globalData.audioManager.duration || 0
            })
        })
        // 监听可以播放事件后执行播放
        this.globalData.audioManager.onCanplay(() => {
            if (this.globalData.audioManager && this.globalData.audioManager.duration) {
                this.globalEvent.emit('timeUpdate', {
                    currentTime: this.globalData.audioManager.currentTime || 0,
                    duration: this.globalData.audioManager.duration || 0
                })
            }
            this.globalData.audioManager.play()
            this.globalData.isPlaying = true
            this.globalEvent.emit('playStatusChange', true)
        })
    } catch (error) {
        console.error('播放歌曲时出错:', error)
        wx.showToast({
            title: '播放失败: ' + error.message,
            icon: 'none'
        })
        this.globalData.isPlaying = false
        this.globalEvent.emit('playStatusChange', false)
    }
},
//切换播放状态
togglePlay(){
    if(!this.globalData.audioManager || !this.globalData.currentSong) {
        console.log('无法切换播放状态：音频管理器未初始化或没有当前歌曲')
        return
    }
    try {
        if (this.globalData.isPlaying){
            console.log('暂停播放')
            this.globalData.audioManager.pause()
        }else{
            console.log('开始播放')
            this.globalData.audioManager.play()
        }
    } catch (error) {
        console.error('切换播放状态时出错:', error)
        wx.showToast({
            title: '操作失败: ' + error.message,
            icon: 'none'
        })
    }
},
//播放下一首
playNext() {
    const { playList, currentIndex, playMode } = this.globalData
    if (playList.length === 0) {
        wx.showToast({title: '播放列表为空', icon: 'none'})
        return
    }
    const nextIndex = (currentIndex + 1) % playList.length
    this.globalData.currentIndex = nextIndex
    this.globalData.currentSong = playList[nextIndex]
    this.loadSong(playList[nextIndex].songhash,nextIndex)
},
//播放上一首
playPrev() {
    const { playList, currentIndex, playMode } = this.globalData;
    if (playList.length === 0) {
        wx.showToast({title: '播放列表为空', icon: 'none'})
        return
    }            
    const prevIndex = (currentIndex - 1 + playList.length) % playList.length
    this.globalData.currentIndex= prevIndex
    this.globalData.currentSong = playList[prevIndex]
    this.loadSong(playList[prevIndex].songhash,prevIndex)
}

})
