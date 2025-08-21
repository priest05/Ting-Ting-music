// pages/play/play.js
const app=getApp()
import {getHotSong,getPlayUrl} from '../../utils/music-api'
Page({

  /**
   * 页面的初始数据
   */
  data: {
      currentSong:[], //当前播放歌曲
      isPlaying:false,
      progress:0,
      currentTime:'00:00', //当前播放时间
      duration:'00:00',
      lyrics:[], //歌词
      currentLyricIndex:0, //当前歌词行索引
      playMode:0,  //播放模式0是
      songUrl:'',
      isLiked:false, //是否喜爱歌曲
      isLoading:false, //是否加载歌曲
      rotateAngle:0, //当前旋转角度
      rotateInterval:null //旋转定时器
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('acceptDataFromOpenerPage', (data)=>{
        const musicList=data.data.musicList
        const currentIndex=data.data.currentIndex
        this.setData({
            currentSong:musicList[currentIndex]
            // playMode:app.globalData.playMode,
            // isPlaying:app.globalData.isPlaying
        },()=>{
            app.globalData.currentSong=this.data.currentSong
            const currentSonghash=this.data.currentSong.songhash
            this.loadSong(currentSonghash)
            this.setData({
                isLoading:true
            })
        })
      })
    app.globalEvent.on('playStatusChange',this.playStatusChange)
    app.globalEvent.on('timeUpdate',this.updateProgress)
    this.startRotate()
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

  },

  //加载歌曲
  async loadSong(currentSonghash){
      if(!currentSonghash){
          console.error('hash 参数缺失');
          return
      }
      try{
          const playUrl=await getPlayUrl(currentSonghash);
          const songWithUrl={
              ...this.data.currentSong,
              url:playUrl
          }
          this.setData({currentSong:songWithUrl});
          console.log(this.data.currentSong);
          app.playSong(songWithUrl)
          console.log('播放地址获取成功：',this.data.songUrl);
      }catch(error){
          console.error('播放地址获取失败',error);
          wx.showToast({title:'播放地址获取失败',icon:'none'})
      }  
  },
  //歌曲播放状态
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
  //播放状态变化
 playStatusChange(isPlaying){
      this.setData({isPlaying});
      if (isPlaying) {
        this.startRotate();
      } else {
        this.stopRotate();
      }
  },
//进度条更新
updateProgress(data){
    const {currentTime,duration}=data
    this.setData({
        currentTime:isNaN(currentTime) ? '00:00' : this.formatTime(currentTime),
        duration:isNaN(duration) ? '00:00' :this.formatTime(duration),
        progress:duration>0 ? (currentTime/duration)*100 : 0
    })
},
//对时间进行格式化处理
formatTime(time){
    const minutes=Math.floor(time/60)
    const seconds=Math.floor(time%60)
    return `${minutes<10 ? '0'+minutes:minutes }:${seconds<10 ? '0' + seconds : seconds}`
},
//旋转开始
startRotate(){
    if(this.data.rotateInterval) return;
    const interval=setInterval(()=>{
        this.setData(prevState=>({
            rotateAngle:(prevState.rotateAngle+1) % 360
        }))
    },50)
    this.setData({rotateInterval:interval})
},
//停止旋转
stopRotate(){
    if(this.data.rotateInterval){
        clearInterval(this.data.rotateInterval)
        this.setData({rotateInterval:null})
    }
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
    this.stopRotate()

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})