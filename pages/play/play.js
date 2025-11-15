// pages/play/play.js
const app=getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
      currentSong:{}, //当前播放歌曲
      isPlaying:true,
      progress:0,
      currentTime:'00:00', //当前播放时间
      duration:'00:00',
      lyrics:[], //歌词
      currentLyricIndex:0, //当前歌词行索引
      playMode:0,  //播放模式0是顺序播放，1是循环播放
      songUrl:'',
      isLiked:false, //是否喜爱歌曲
      isLoading:false, //是否加载歌曲
      musicList: [], //歌曲列表
      currentIndex: -1, //当前歌曲索引
      isDragging: false, //是否正在拖拽进度条
      currentPage:0 //当前swiper页面
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {     
    const eventChannel = this.getOpenerEventChannel()    
    eventChannel.on('acceptDataFromOpenerPage', (data)=>{        
        let musicList=data.data.musicList || []    
        const currentIndex=data.data.currentIndex || 0    
        // 检查并设置播放列表    
        if(musicList.length === 0) {        
            if(app.globalData.playList && app.globalData.playList.length > 0) {    
                musicList = app.globalData.playList    
            } else {        
                wx.showToast({title: '播放列表为空', icon: 'none'})    
                return   
            }    
        }    
        const limitedMusicList = musicList.slice(0, 30)    
        // 更新全局播放列表    
        app.globalData.playList = limitedMusicList    
        app.globalData.currentIndex = currentIndex    
        this.setData({
            musicList: limitedMusicList,
            currentIndex: currentIndex,
            currentSong: limitedMusicList[currentIndex] || {},
            isLoading:true,
            isPlaying: app.globalData.isPlaying,
            playMode: app.globalData.playMode
        },()=>{    
            app.globalData.currentSong = this.data.currentSong      
            app.globalData.currentSonghash = this.data.currentSong.songhash    
            app.globalData.currentIndex = this.data.currentIndex
            if(app.globalData.currentSonghash) {    
                app.loadSong(app.globalData.currentSonghash)    
            } else {    
                this.setData({isLoading: false})    
                wx.showToast({title: '未找到歌曲hash', icon: 'none'})    
            }    
        })    
      })    
    //确保从其他页面进入时播放列表不为空    
    setTimeout(() => {    
        if(this.data.musicList.length === 0 && app.globalData.playList && app.globalData.playList.length > 0) {       
            const limitedMusicList = app.globalData.playList.slice(0, 30)   
            const defaultIndex = 0    
            this.setData({    
                musicList: limitedMusicList,    
                currentIndex: defaultIndex,    
                currentSong: limitedMusicList[defaultIndex] || {},    
                isLoading: true    
            }, () => {    
                app.globalData.currentSonghash = this.data.currentSong.songhash    
                if(app.globalData.currentSonghash) {    
                    app.loadSong(app.globalData.currentSonghash)    
                }    
            })    
        }    
    }, 500)    

    this.playStatusChange = (isPlaying) => {    
      console.log('播放状态变化:', isPlaying)    
      this.setData({isPlaying})   
    }    
    this.updateProgress = (data) => {    
      const {currentTime,duration}=data   
      // 在拖拽过程中，只更新duration，不更新progress和currentTime，避免UI闪烁    
      if (this.data.isDragging) {    
        if (duration) {    
          this.setData({    
            duration:isNaN(duration) ? '00:00' :this.formatTime(duration)    
          })    
        }    
      } else {    
        // 正常播放时更新所有数据    
        this.setData({    
          currentTime:isNaN(currentTime) ? '00:00' : this.formatTime(currentTime),    
          duration:isNaN(duration) ? '00:00' :this.formatTime(duration),    
          progress:duration>0 ? (currentTime/duration)*100 : 0    
        })    
      }    
    }    
    //歌曲切换事件监听    
    this.currentSongChange = (song) => {    
      if (song && song.songhash) {    
        this.setData({currentSong: song})   
      }    
    }    
    app.globalEvent.on('playStatusChange', this.playStatusChange)    
    app.globalEvent.on('timeUpdate', this.updateProgress)    
    app.globalEvent.on('currentSongChange', this.currentSongChange)          
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.setData({
      isPlaying: app.globalData.isPlaying,
      playMode: app.globalData.playMode,
      currentIndex: app.globalData.currentIndex,
      currentSong: app.globalData.currentSong || this.data.currentSong
    })
  },
// 切换播放模式
  togglePlayMode() {
    const newMode = (this.data.playMode + 1) % 3;
    this.setData({playMode: newMode})
    app.globalData.playMode = newMode
    let modeName;
    switch(newMode) {
      case 0:
        modeName = '列表循环';
        break;
      case 1:
        modeName = '单曲循环';
        break;
      case 2:
        modeName = '随机播放';
        break;
    }
    wx.showToast({
      title: modeName,
      icon: 'none',
      duration: 1500
    })
    console.log('播放模式切换:', modeName)
  },
// 切换播放/暂停状态
  togglePlay() {
    console.log('切换播放状态')
    app.togglePlay()
  },
// 播放上一首
  playPrev() {
    app.playPrev()
    this.setData({
      currentIndex: app.globalData.prevIndex,
      currentSong: app.globalData.playList[app.globalData.prevIndex] || {},
    })
  },
// 播放下一首
  playNext() {
    app.playNext()
    this.setData({
      currentIndex: app.globalData.nextIndex,
      currentSong: app.globalData.playList[app.globalData.nextIndex] || {},
    })
  },
// 下载歌曲
  downloadSong() {
    console.log('下载歌曲:', this.data.currentSong.song);
    if (!this.data.currentSong.url) {
      wx.showToast({title: '歌曲地址不可用', icon: 'none'});
      return;
    }
    wx.showLoading({title: '正在下载...'});
    wx.downloadFile({
      url: this.data.currentSong.url,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存到本地
          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: (res) => {
              const savedFilePath = res.savedFilePath;
              wx.showToast({title: '下载成功'});
              console.log('歌曲保存路径:', savedFilePath);
            },
            fail: (err) => {
              console.error('保存文件失败:', err);
              wx.showToast({title: '保存失败', icon: 'none'});
            }
          });
        } else {
          wx.showToast({title: '下载失败', icon: 'none'});
        }
      },
      fail: (err) => {
        console.error('下载文件失败:', err);
        wx.showToast({title: '下载失败', icon: 'none'});
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },
// 页面切换
  swiperChange(e) {
    this.setData({currentPage: e.detail.current});
  },
// 进度条点击事件
  onProgressBarTap(e) {
    const {clientX} = e.touches[0];
    const query = wx.createSelectorQuery();
    query.select('.progress-bar').boundingClientRect();
    query.exec((res) => {
      const barWidth = res[0].width;
      const progress = (clientX - res[0].left) / barWidth * 100;
      if (app.globalData.audioManager && app.globalData.audioManager.duration) {
        const seekTime = (progress / 100) * app.globalData.audioManager.duration;
        app.globalData.audioManager.seek(seekTime);
        console.log('点击进度条跳转位置:', seekTime, '秒');
      }
    });
  },
  // 进度条拖动开始
  onTouchStart(e) {
    this.setData({ isDragging: true });
    console.log('进度条拖动开始');
    // 立即执行一次拖动逻辑，确保拖动起点正确
    this.updateProgressOnDrag(e);
  }, 
  // 进度条拖动中
  onTouchMove(e) {
    if (this.data.isDragging) {
      this.updateProgressOnDrag(e);
    }
  },
  // 进度条拖动结束
  onTouchEnd(e) {
    if (this.data.isDragging) {
      this.setData({ isDragging: false });
      console.log('进度条拖动结束');
      // 拖动结束后，实际调整音频播放位置
      const { clientX } = e.changedTouches[0];
      
      if (this.progressBarWidth) {
        // 使用缓存的进度条信息，提高性能
        const progress = Math.max(0, Math.min(100, (clientX - this.progressBarLeft) / this.progressBarWidth * 100));
        
        if (app.globalData.audioManager && app.globalData.audioManager.duration) {
          const seekTime = (progress / 100) * app.globalData.audioManager.duration;
          app.globalData.audioManager.seek(seekTime);
          console.log('进度条跳转位置:', seekTime, '秒');
        }
      } else {
        // 降级方案：如果没有缓存的宽度，再查询DOM
        const query = wx.createSelectorQuery();
        query.select('.progress-bar').boundingClientRect();
        query.exec((res) => {
          if (res && res[0]) {
            const barWidth = res[0].width;
            const progress = Math.max(0, Math.min(100, (clientX - res[0].left) / barWidth * 100));
            
            if (app.globalData.audioManager && app.globalData.audioManager.duration) {
              const seekTime = (progress / 100) * app.globalData.audioManager.duration;
              app.globalData.audioManager.seek(seekTime);
              console.log('进度条跳转位置:', seekTime, '秒');
            }
          }
        });
      }
    }
  },
  // 在拖动过程中更新进度条UI
  updateProgressOnDrag(e) {
    const { clientX } = e.touches[0];
    // 使用缓存的进度条宽度，避免每次拖拽都重新查询DOM
    if (!this.progressBarWidth) {
      const query = wx.createSelectorQuery();
      query.select('.progress-bar').boundingClientRect();
      query.exec((res) => {
        if (res && res[0]) {
          this.progressBarWidth = res[0].width;
          this.progressBarLeft = res[0].left;
          this.calculateProgress(clientX);
        }
      });
    } else {
      // 直接计算进度，提高响应速度
      this.calculateProgress(clientX);
    }
  },
  
  // 单独的进度计算函数，提高代码复用性和性能
  calculateProgress(clientX) {
    const progress = Math.max(0, Math.min(100, (clientX - this.progressBarLeft) / this.progressBarWidth * 100));
    
    // 只更新UI，不调整音频播放位置
    this.setData({ progress });
    
    // 计算并更新当前时间显示
    if (app.globalData.bgAudioManager && app.globalData.bgAudioManager.duration) {
      const seekTime = (progress / 100) * app.globalData.bgAudioManager.duration;
      this.setData({
        currentTime: isNaN(seekTime) ? '00:00' : this.formatTime(seekTime)
      });
    }
  },
  toggleLike(){
      const isLiked=this.data.isLiked
      if(isLiked){
        this.setData({
            isLiked:false
        })
      }else{
          this.setData({
              isLiked:true
          })
      }
  },
//对时间进行格式化处理
formatTime(time){
    const minutes=Math.floor(time/60)
    const seconds=Math.floor(time%60)
    return `${minutes<10 ? '0'+minutes:minutes }:${seconds<10 ? '0' + seconds : seconds}`
},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    app.globalEvent.off('playStatusChange', this.playStatusChange)
    app.globalEvent.off('timeUpdate', this.updateProgress)
    app.globalEvent.off('currentSongChange', this.currentSongChange)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})