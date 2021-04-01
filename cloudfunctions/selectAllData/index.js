//云函数入口文件
const cloud = require('wx-server-sdk')
 
const db = wx.cloud.database()
cloud.init()
 
//云函数入口函数
exports.main = async (event, context) => {
  getall:async()=>{
    const db = wx.cloud.database
    const Max_limit = 100
    // 先取出集合记录总数
    const countResult = await db.collection('logs').count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / Max_limit)
    
    const tasks = []
    for(let i = 0; i < batchTimes; i++) {
      const promise = db.collection('logs').skip(i * Max_limit).limit(Max_limit).get()
        tasks.push(promise)
    }
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => {
      data: acc.data.concat(cur.data),acc.errMsg
    })
  }
}