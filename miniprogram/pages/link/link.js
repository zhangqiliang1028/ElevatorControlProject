var app = getApp();
var utils = require("../../utils/util.js");
Page({
  data: {
    orderInput:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    var deviceId = decodeURIComponent(options.deviceId);
    var name = decodeURIComponent(options.name);
    var serviceId = decodeURIComponent(options.serviceId);
    console.log('获取特征值');
    utils.getBLEDeviceCharacteristics(serviceId,deviceId);
    wx.setStorageSync('deviceId', deviceId);
    wx.setStorageSync('name', name);
    wx.setStorageSync('serviceId', serviceId);
    var Eid = utils.getElevatorID()
    this.setData({
      orderInput:Eid,
    })
  },


  //获取输入
  getInput:function(e){
    var that = this;
    this.setData({
      orderInput: e.detail.value
    })
  },
  //确定连接
  
  sendLinkMsg(){

    var that = this ;
    var orderInput = that.data.orderInput;

    if(orderInput.length>10){
      app.showModal('输入电梯ID有误');
      return;
    }     
      var elevatorId = parseInt(orderInput,16);
      wx.setStorageSync('elevatorId', elevatorId);

    var payload = {
      data : [
        0xea,0x00,0x00,0x00
      ],
      payloadLength : 4
    }
    var info = {
      elevatorId : 0x0,
      robotId : 0x0
    }

    info.elevatorId = elevatorId;
    info.robotId = 0x11111111
    var deviceId = wx.getStorageSync('deviceId');
    var serviceId = wx.getStorageSync('serviceId');
    var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
    console.log("发送查询命令")
    utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,payload);
    wx.showToast({
      title: '正在连接....',
      icon:'loading',
      duration:3000
    });
    setTimeout(that.isLink,4000);
  },

  isLink(){
    var isLink = wx.getStorageSync('isLink');
    var elevatorId = wx.getStorageSync('elevatorId');
    console.log(isLink==1);
    if(isLink){
      wx.showToast({
        title: '连接成功',
        icon:'success',
        duration:2000
      });

      setTimeout(function a(){
        console.log("电梯连接成功")
      },2000)
      var pages = getCurrentPages();
      var prevPage = pages[pages.length - 2];  //设置其他页面的数据
      prevPage.setData({
        isLink: true,
        elevatorId:elevatorId
      })
      wx.navigateBack({
        delta: 1,
      })  
    }else{
      console.log('电梯连接失败！！');
      wx.showToast({
        title: '连接失败',
        icon:'none',
        duration:1000
      });

    }
  }

})