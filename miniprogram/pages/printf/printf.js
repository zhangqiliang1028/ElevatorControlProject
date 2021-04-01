const utils = require("../../utils/util.js");

Page({
  data: {
    logs:[],
  },

  onLoad(){
    var that = this ;
    const  db = wx.cloud.database();
    db.collection('logs').get().then(res => {
      console.log(res);
      that.setData({
        logs:res.data,
      })
    })
  },


  onReady(){
    var that = this ;
    const  db = wx.cloud.database();
    db.collection('logs').get().then(res => {
      that.setData({
        logs:res.data,
      })
    })
  },

  clearTap(){
    var that = this ;
   console.log('清除所有数据')
   utils.clearDataFormCloud();
    that.setData({
      logs:[],
    })
    wx.showToast({
      title: '清除成功...',
      icon:'success',
      duration:1500
    });
  
  },

 text() {
    console.log("测试");
  },

  onUnload(){
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];
    prevPage.setData({
      printfDisable: true
    })
  },

  //上拉刷新
  onPullDownRefresh: function () {
    var that = this;
    wx.showNavigationBarLoading() 
    setTimeout(function(){
      that.onReady();
      wx.hideNavigationBarLoading() //完成停止加载
    },1500);
  },


  //上拉刷新
  onReachBottom:function(){
    var that = this;
    wx.showNavigationBarLoading() //在标题栏中显示加载
    
    //模拟加载
    setTimeout(function(){
      var old_logs = that.data.logs;
      var length = old_logs.length;
      const  db = wx.cloud.database();
      db.collection('logs').skip(length)
        .get()
        .then(res=>{
          that.setData({
            logs:old_logs.concat(res.data),
          })
        })
        .catch(err=>{
          console.error(err);
        })
      console.log("循环下一页");
      console.log(that.data.logs)
      wx.showToast({
        title: '数据已刷新',
         icon:'success',
         duration:1500
      });
      wx.hideNavigationBarLoading() //完成停止加载
    },1500);

    console.log("数据刷新成功");
  }
})