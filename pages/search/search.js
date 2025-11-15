// pages/search/search.js
const app = getApp()
import { searchMusic } from '../../utils/search-api'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    searchKeyword: '', // 搜索关键词
    searchResults: [], // 搜索结果
    searchHistory: [], // 搜索历史
    showResult: false, // 是否显示搜索结果
    isFocused: true // 输入框是否自动聚焦
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载搜索历史
    this.loadSearchHistory()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 页面显示时设置输入框聚焦
    this.setData({
      isFocused: true
    })
  },

  /**
   * 加载搜索历史
   */
  loadSearchHistory: function () {
    const history = wx.getStorageSync('searchHistory') || []
    this.setData({
      searchHistory: history
    })
  },

  /**
   * 保存搜索历史
   */
  saveSearchHistory: function (keyword) {
    if (!keyword || keyword.trim() === '') return
    
    let history = wx.getStorageSync('searchHistory') || []
    
    // 如果已存在，先删除
    const index = history.indexOf(keyword)
    if (index > -1) {
      history.splice(index, 1)
    }
    
    // 添加到开头
    history.unshift(keyword)
    
    // 限制历史记录数量
    if (history.length > 10) {
      history = history.slice(0, 10)
    }
    
    wx.setStorageSync('searchHistory', history)
    this.setData({
      searchHistory: history
    })
  },

  /**
   * 清除搜索历史
   */
  clearHistory: function () {
    wx.showModal({
      title: '提示',
      content: '确定要清除搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          this.setData({
            searchHistory: []
          })
        }
      }
    })
  },

  /**
   * 输入框内容变化
   */
  onInput: function (e) {
    const value = e.detail.value
    this.setData({
      searchKeyword: value
    })
  },

  /**
   * 执行搜索
   */
  onSearch: function () {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none'
      })
      return
    }

    // 保存搜索历史
    this.saveSearchHistory(keyword)

    // 显示加载提示
    wx.showLoading({
      title: '搜索中...'
    })

    // 调用搜索接口
    searchMusic(keyword).then(res => {
      wx.hideLoading()
      if (res && res.data && res.data.list) {
        this.setData({
          searchResults: res.data.list,
          showResult: true
        })
      } else {
        this.setData({
          searchResults: [],
          showResult: true
        })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: '搜索失败，请重试',
        icon: 'none'
      })
      console.error('搜索失败:', err)
    })
  },

  /**
   * 根据历史记录搜索
   */
  searchByHistory: function (e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({
      searchKeyword: keyword
    })
    this.onSearch()
  },

  /**
   * 播放歌曲
   */
  playSong: function (e) {
    const song = e.currentTarget.dataset.song
    if (song && song.songhash) {
      // 设置全局播放列表和当前歌曲
      app.globalData.playList = [song]
      app.globalData.currentIndex = 0
      app.globalData.currentSong = song
      
      // 跳转到播放页面
      wx.navigateTo({
        url: '/pages/play/play'
      })
    }
  },

  /**
   * 取消搜索，返回上一页
   */
  onCancel: function () {
    wx.navigateBack()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 页面卸载时可以执行一些清理操作
  }
})