const baseUrl='http://localhost:3000'
//搜索接口
function getSearch(){
    return new Promise((resolve,reject)=>{
        const url=`${baseUrl}/search?keywords=唯一`
        wx.request({
            url:url,
            success:(res)=>{
                console.log(res);
                if(res.statusCode!==200){
                    reject(new Error(`请求失败，状态码：${res.statusCode}`))
                    return
                }
                try{
                    const rawData=res
                    resolve(rawData)
                }catch(e){
                    reject(new Error('数据解析失败'))
                }
            },
            fail:(err)=>{
                reject(new Error(`网络错误：${err.errMsg}`))
            }
        })
    })
  }
  
  module.exports = {
      getSearch
  }