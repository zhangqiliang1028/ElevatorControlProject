const app = getApp()
const { saveDataToCloud } = require("../../utils/util.js");
const utils = require("../../utils/util.js");
const ROBOTID = 0x11111111

Page({
  data: {
    cardArray:[{name:'不刷卡',id:0},{name:'刷卡-1',id:1},{name:'刷卡-2',id:2}],
    index:0,
    //楼层映射指令和楼层距离标定的指令
      payloadConfigItem : {
        data:[
          0xE1,
          0x00,//注意0xFF是-1,楼层
          0x00,//继电器ID
          0x00,//是否需要刷卡
        ],
        floorNumber : 0,
        relayID : 0,
        needCard : 0,
        payloadLength : 4
      },
      floorNumberInput:'',
      elevatorId:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  
  onLoad: function () {
    console.log('开始监听蓝牙通信');
    var that =this ;
    var  deviceId =wx.getStorageSync('deviceId');
    var serviceId = wx.getStorageSync('serviceId');
    var elevatorId = wx.getStorageSync('elevatorId');
    that.setData({
      elevatorId:elevatorId
    })
    utils.getBLEDeviceCharacteristics(serviceId,deviceId);
  },

    //继电器标定设置
    sendDistanceMsg(){
      console.log('点击继电器标定设置');
      var that = this ;
      var elevatorId = that.data.elevatorId;
      var floorNumber = parseInt(that.data.floorNumberInput);
      console.log("楼层："+floorNumber);
      if(floorNumber<128&&floorNumber>0||floorNumber<0&&floorNumber>-11){
            //操作服务
          var info = {
            elevatorId : 0x0,
            robotId : 0x0
          }
          
          info.elevatorId = elevatorId
          info.robotId = ROBOTID
          var relayID = 0xff
          var needCard = 0xff
          that.setData({
            'payloadConfigItem.floorNumber' : floorNumber,
            'payloadConfigItem.relayID' : relayID,
            'payloadConfigItem.needCard' : needCard,
            'payloadConfigItem.data[0]' : 0xE1,
            'payloadConfigItem.data[1]' : (floorNumber + 256) % 256,
            'payloadConfigItem.data[2]' : relayID,
            'payloadConfigItem.data[3]' : needCard,
          })

          var deviceId = wx.getStorageSync('deviceId');
          var serviceId = wx.getStorageSync('serviceId');
          var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
          utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,that.data.payloadConfigItem);
          saveDataToCloud(floorNumber)
          wx.showToast({
              title: '标定成功',
              icon:'success',
              duration:1500
          })
      }else{
        wx.showToast({
          title: '输入楼层超出',
          icon:'none',
          duration:1500
        })
      }
    },

//picker事件
bindPickerChange:function(e){
  this.setData({
    index: e.detail.value
  })
},


getInput(e){
  this.setData({
    floorNumberInput:e.detail.value
  })
},

onUnload(){
  var pages = getCurrentPages();
  var prevPage = pages[pages.length - 2];
  prevPage.setData({
    calibrationDisable: true 
  })
}

})