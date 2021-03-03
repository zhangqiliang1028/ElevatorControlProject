const ROBOTID = 0x11111111
const utils = require("../../utils/util.js");

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    elevatorId:''


  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    console.log('开始重启轿厢板/井顶设备');
    var that =this ;
    var  deviceId =wx.getStorageSync('deviceId');
    var serviceId = wx.getStorageSync('serviceId');
    var elevatorId = wx.getStorageSync('elevatorId');
    that.setData({
      elevatorId:elevatorId
    })
    utils.getBLEDeviceCharacteristics(serviceId,deviceId);
  },


//重启-桥厢顶设备
rebootTop(){
  var that = this;
  console.log('重启-桥厢顶设备');
  var payload = {
    data : [
      0xec,0x00,0x00,0x00
    ],
    payloadLength : 4
  }

  var info = {
    elevatorId : 0x0,
    robotId : 0x0
  }
  info.elevatorId=that.data.elevatorId;
  info.robotId=ROBOTID;
  var deviceId = wx.getStorageSync('deviceId');
  var serviceId = wx.getStorageSync('serviceId');
  var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
  console.log("发送重启轿厢板命令")
  utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,payload);
  wx.showToast({
    title: '正在重启....',
    icon:'loading',
    duration:3000
  });

},

//重启-梯井顶设备
rebootButtom(){
 console.log('重启-桥厢顶设备');
 var that = this;
  var payload = {
    data : [
      0xec,0x00,0x01,0x00
    ],
    payloadLength : 4
  }

  var info = {
    elevatorId : 0x0,
    robotId : 0x0
  }
  
  info.elevatorId=that.data.elevatorId;
  info.robotId=ROBOTID;
  var deviceId = wx.getStorageSync('deviceId');
  var serviceId = wx.getStorageSync('serviceId');
  var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
  console.log("发送重启井顶命令")
  utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,payload);
  wx.showToast({
    title: '正在重启....',
    icon:'loading',
    duration:3000
  });
},

onUnload(){
  var pages = getCurrentPages();
  var prevPage = pages[pages.length - 2];
  prevPage.setData({
    rebootDisable: true 
  })
}

})