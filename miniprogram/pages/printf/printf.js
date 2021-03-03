const utils = require("../../utils/util.js");

Page({
  data: {
    logs:[]
  },

  onLoad(){
    var that = this ;
    const  db = wx.cloud.database();
    db.collection('logs').get().then(res => {
      that.setData({
        logs:res.data
      })
    })
  },

  onReady(){
    var that = this ;
    const  db = wx.cloud.database();
    db.collection('logs').get().then(res => {
      that.setData({
        logs:res.data
      })
    })
  },

  clearTap(){
    var that = this ;
   console.log('清除所有数据')
   utils.clearDataFormCloud();
    that.setData({
      logs:[]
    })
   that.onLoad();
   that.onReady();
  },
  onUnload(){
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];
    prevPage.setData({
      printfDisable: true 
    })
  }
})