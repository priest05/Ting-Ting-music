// index.js
import {getHotSong} from '../../utils/music-api'
import {getSearch} from '../../utils/search-api'
const app=getApp()

Page({
  data: {
    // 若有后端接口可初始化为空，通过接口动态填充
// 两组轮播图数据
    bannerList:[
        [
            {imageUrl:'https://p1.music.126.net/oFTg33aY0-Ilsn_zs78tqQ==/109951170647636987.jpg?imageView&quality=89'},
            {imageUrl:'https://p1.music.126.net/jEqwUDKm6DlHFfWuicrlkQ==/109951170647681697.jpg?imageView&quality=89'},
            {imageUrl:'https://p1.music.126.net/CYJIeNJ2mr0iNvqWn1wiVA==/109951170647711537.jpg?imageView&quality=89'},
            {imageUrl:'https://p1.music.126.net/yPreD4ywIgNab883skLsnA==/109951170647720258.jpg?imageView&quality=89'},
            {imageUrl:'https://p1.music.126.net/uNbF4CCJwfQ3Iw43IhY-uA==/109951170648010162.jpg?imageView&quality=89'}
        ],
        [
            {imageUrl:'https://p1.music.126.net/rZIXjvQ4rgXha9qFjY7kYg==/109951170647616473.jpg?imageView&quality=89'},
            {imageUrl:'https://p1.music.126.net/egx9CMeVff8Illd_rtYMIg==/109951170647625411.jpg?imageView&quality=89'},
            {imageUrl:'https://p1.music.126.net/69ByEFcy1bC4b3VQvjp2Ug==/109951170647664960.jpg?imageView&quality=89'},
            {imageUrl:'https://p1.music.126.net/11BT0KYP7JYSmBCEFQhA_g==/109951170647654270.jpg?imageView&quality=89'},
            {imageUrl:'https://p1.music.126.net/TWj1KoeAYDKXttVTnef9NQ==/109951170648040888.jpg?imageView&quality=89'}
        ]
    ],
    // 当前显示的轮播图索引
    currentBannerIndex:0,
//推荐歌单
    recommendList:[], //歌单数据
    loading:false, //加载状态
    hasMore:true, //是否有更多的数据
    leftPadding:30,
    rightPadding:30,
//热门歌曲
    hotSongs:[], //热门歌曲数据
    isLoading:true, //加载状态
    isError:false //错误状态
    },

    onLoad(){
        this.setData({
            currentBanners:this.data.bannerList[0]
        })
        this.getHotlist(),
        this.loadHotsong()
    },
    onShow(){
        this.loadHotsong()
    },
    
// 下拉刷新更换轮播图
    onPullDownRefresh(){
        // 下拉时切换轮播图组索引
        const newIndex=this.data.currentBannerIndex===0?1:0
        this.setData({
            currentBannerIndex:newIndex,
            currentBanners:this.data.bannerList[newIndex]
        },()=>{
            wx.stopPullDownRefresh()//停止下拉刷新
        })
    },
//推荐歌单
    getHotlist:function(){
        //防抖处理
        if(this.data.loading||!this.data.hasMore){
            return this.setData({loading:true})
        }
        //数据获取
        wx.request({
            url:'http://mobilecdnbj.kugou.com/api/v5/special/recommend',
            data:{
                recommend_expire:0,
                sign:'52186982747e1404d426fa3f2a1e8ee4',
                plat:0,
                uid:0,
                version:9108,
                page:1,
                area_code:1,
                appid:1005,
                mid:'286974383886022203545511837994020015101',
                _t:'1545746286'
            },
            dataType:"json",
            success:(res)=>{
                if(res.statusCode!==200){
                    throw new Error(`请求失败`)
                }
                const list=res.data?.data?.list||[]
                // console.log(list)
                this.setData({
                    recommendList:this.data.recommendList.concat(this.processData(list)),
                    hasMore:list.length>=15
                })
            },
            fail:(res)=>{},
            complete:(res)=>{}
        })
    },
    // 数据处理方法
    processData(list){
        return list.map(item=>({
            id:item.specialid,
            name:item.specialname,
            coverImgurl:item.imgurl.replace('{size}','240'),
            playCount:this.formatCount(item.playcount),
            creator:item.nickname
        }))
    },
    // 播放量格式化方法
    formatCount:function(count){
        return count>10000?(count/10000).toFixed(1)+'万':count.toString()
    },

    onReady(){
        const query=wx.createSelectorQuery()
        query.select('.scrollView').boundingClientRect()
        query.exec(res=>{
            if(res[0]){
                this.scrollWidth=res[0].width
            }
        })
    },

    // 动态边距,滚动事件处理
    handleScroll:function(e){
        const scrollLeft=e.detail.scrollLeft
        const scrollWidth=e.detail.scrollWidth
        // 计算最大滚动距离
        const maxScroll=scrollWidth-this.scrollWidth
        // // 动态调整边距
        const newLeftPadding=Math.max(30-scrollLeft*0.5,0)
        const newRightPadding=Math.max(30-(maxScroll-scrollLeft)*0.5,0)
        // // 更新边缘边距大小
        this.setData({
            leftPadding:newLeftPadding,
            rightPadding:newRightPadding
        })
    },

//热门歌曲
    // 加载热门歌曲数据
    async loadHotsong(){
        try{
            const rawData=await getHotSong()
            const list=rawData.map(item=>({
                id:item.ad_id,
                song:this.removeContent(item.songname),
                album:this.removeContent(item.album_name),
                singer:item.author_name,
                songhash:item.hash,
                videohash:item.video_hash,
                imgUrl:item.album_sizable_cover.replace('{size}/','')
        }))
        this.setData({hotSongs:list})  
        app.globalData.playList=this.data.hotSongs
        }catch(error){
            console.error('获取热门歌曲失败：',error)
            wx.showToast({
              title: '加载热门歌曲失败',
              icon:'none'
            })
        }
    },
    removeContent:function(text) {
        return text.replace(/[\(（].*?[）)]/g,'');
    },

      //搜索信息获取
    // async loadSearch(){
    //     try{
    //         const rawData=await getSearch()
    //     }catch(error){
    //         console.error('搜索失败：',error)
    //     }
    // },

    //跳转到播放页并将当前点击的歌曲数据传递给播放页
    navigateToPlayer:function(e){
        //拿到当前点击的下标
        const currentIndex=e.currentTarget.dataset.index
        //拿到当前热门歌曲列表数据
        const musicplay=this.data.hotSongs
        //定义一个数据对象，由列表数据和当前下标组成
        const objdata={}
        objdata.musicList=musicplay
        objdata.currentIndex=currentIndex
        wx.navigateTo({
          url: '/pages/play/play',
          success:(res)=>{
            res.eventChannel.emit('acceptDataFromOpenerPage',{ data: objdata })
          }
        })
    }
  
})
