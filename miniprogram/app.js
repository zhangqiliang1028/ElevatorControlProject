
App({

  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } 
    else {
      wx.cloud.init({
        traceUser: true,
      })
    }
  },

  //全局变量
  globalData:{
    isLink:false ,//是否连接
    deviceId:'',
    serviceId:'',
    isReBoot:false,
    reTransmission_count:0  //记录重传次数
  },
  //toast提示
  toastTips: function(txt) {
    wx.showToast({
      title: txt
    })
  },
  
  //toast提示，可以设置等待时长
  toastTips1: function(txt, time) {
    wx.showToast({
      title: txt,
      duration: time
    })
  },
  toastTips2: function(txt) {
    wx.showToast({
      title: txt,
      icon: "loading"
    })
  },

  //弹窗提示
  showModal: function(txt) {
    wx.showModal({
      title: '提示',
      content: txt,
      showCancel: false,
    })
  },
  //弹窗提示,有确认按钮
  showModal1: function(txt) {
    wx.showModal({
      title: "提示",
      content: txt,
      showCancel: false,
      confirmText: "确定"
    })
  },
  //loading
  showLoading: function(txt) {
    wx.showLoading({
      title: txt,
      mask: true
    });
  },


})
