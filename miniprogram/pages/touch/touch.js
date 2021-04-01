const utils = require("../../utils/util.js");

const ROBOTID = 0x11111111
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //机器人模拟运行指令的发送
    payloadRobotMsg:{
      data : [
        //cmdID
        0x00,
        //floorNumber
        0x01,
        //ack
        0x00,
        //内存对齐
        0x00
      ],
      floorNumber : 0x00,
      cmdID : 0x00,
      payloadLength : 4
    },
    getFloorNumber:''
  },

  //获取输入楼层数
  getInput(e){
    this.setData({
      getFloorNumber:e.detail.value
    })
  },

  //发送楼层按钮的消息
  touch(){
    var that = this
    console.log('确定选择目标楼层');
    wx.showToast({
      title: '正在设置目标楼层...',
      icon:'loading',
      duration:2000
    })
    var floorNumber = parseInt(that.data.getFloorNumber);
    if(floorNumber<128&&floorNumber>0||floorNumber<0&&floorNumber>-11){
      var info = {
        elevatorId : 0x0,
        robotId : 0x0
      }
      var cmdID = 0xA2

      info.elevatorId =  wx.getStorageSync('elevatorId');
      info.robotId = ROBOTID
      that.setData({
          'payloadRobotMsg.cmdID' : cmdID,
          'payloadRobotMsg.floorNumber' : floorNumber,
          'payloadRobotMsg.data[0]' : cmdID,
          'payloadRobotMsg.data[1]' : (floorNumber + 256) % 256
      })

      var deviceId = wx.getStorageSync('deviceId');
      var serviceId = wx.getStorageSync('serviceId');
      var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
      console.log("发送触发楼层按钮命令")
      utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,payloadRobotMsg);

    }

    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];
    prevPage.setData({
      isTouchTab: true 
    })
    wx.navigateBack({
      delta: 1,
    })
  },
  
  onUnload(){
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];
    prevPage.setData({
      touchDisable: true 
    })
  }

})