
App({

  onLaunch: function () {
    if(!wx.cloud){
      console.log("基础库较低");
    }else{
      wx.cloud.init({
        env:'offer-123',
        traceUser: true,
      })
    }

  },

  //全局变量
  globalData:{
    isLink:false ,//是否连接
    deviceId:'',
    serviceId:'',
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
