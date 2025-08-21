// app.js
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
        this.globalData.playlist=cachedList
    }
    this.initBgAudioManager()
    
  },
  globalData: {
    userInfo: null,
    playList:[], //原始播放列表
    isPlaying:false, //当前是否在播放
    playMode:0, //播放模式
    bgAudioManager:null,
    currentSong:null
  },

//初始化音频播放器
initBgAudioManager(){
    if(!this.globalData.bgAudioManager){
        this.globalData.bgAudioManager=wx.getBackgroundAudioManager()
    //监听音频事件
    this.globalData.bgAudioManager.onPlay(()=>{
        this.globalEvent.emit('playStatusChange',true)
    })
    this.globalData.bgAudioManager.onPause(()=>{
        this.globalEvent.emit('playStatusChange',false)
    })
    this.globalData.bgAudioManager.onEnded(()=>{
        this.playNext()
    })
    this.globalData.bgAudioManager.onError((res)=>{
        console.log('音频播放错误',res.errMsg)
        wx.showToast({
          title: '播放失败',
          icon:'none'
        })
    })
    this.globalData.bgAudioManager.onTimeUpdate(()=>{
        this.globalEvent.emit('timeUpdate', {
            currentTime: this.globalData.bgAudioManager.currentTime,
            duration: this.globalData.bgAudioManager.duration
        })
    })
    this.globalData.bgAudioManager.onCanplay(()=>{
        if (this.globalData.bgAudioManager.duration === 0) {
            setTimeout(() => {
              this.globalEvent.emit('timeUpdate', {
                currentTime: this.globalData.bgAudioManager.currentTime,
                duration: this.globalData.bgAudioManager.duration
              })
            }, 500)
        }
    })
    }
},

globalEvent:{
    listeners:{},
    on(event,callback){
        if(!this.listeners[event]){
            this.listeners[event]=[]
        }
        this.listeners[event].push(callback)
    },
    emit(event,data){
        const app=getApp()
        if(this.listeners[event]){
            this.listeners[event].forEach(callback=>callback(data))
        }
        if(event==='currentSongChange'){
            app.globalData.currentSong=data
        }else if(event==='playStatusChange'){
            app.globalData.isPlaying=data
        }
    }
},
//播放歌曲
playSong(song){
    this.initBgAudioManager()
    this.globalData.bgAudioManager.src=song.url
    this.globalData.bgAudioManager.title=song.song
    this.globalData.bgAudioManager.singer=song.singer
    this.globalData.bgAudioManager.coverImgUrl=song.imgUrl
    this.globalData.bgAudioManager.play()
    this.globalEvent.emit('currentSongChange',song)
    this.globalEvent.emit('playStatusChange',true)
},
//切换播放状态
togglePlay(){
    if(!this.globalData.bgAudioManager) return
    if (this.globalData.isPlaying){
        this.globalData.bgAudioManager.pause()
    }else{
        this.globalData.bgAudioManager.play()
    }
}

})
