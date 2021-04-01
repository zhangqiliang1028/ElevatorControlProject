const utils = require("../../utils/util.js");

const ROBOTID = 0x1111111

Page({
  data: {
    rangeError:{
      number:400,//平层距离测定误差
      isShow:false
    },
    toleranceTimes:{
      number:5,//测距异常容忍次数
      isShow:false
    },
    detectionTime:{
      number:1,//平层异常检测时长
      isShow:false
    },
    //容差参数的设置
   payloadConfigTole : {
      data : [
        //cmdID
        0xE8,
        //checkCount
        0x00,
        //toleDistance
        0x00,
        0x00,
        //checkFlatFloorNumber
        0x00,
        0x00,
        //用于内存对齐
        0x00,
        0x00,
      ],
      cmdID : 0xE8,
      checkCount : 0x00,
      toleDistance : 0x00,
      checkFlatFloorNumber : 0x00,
      payloadLength : 8 
    },
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

//平层距离测定误差
  getRangeError(e){
  var that = this ;
  var num = parseInt(e.detail.value);
  that.setData({
      'rangeError.number':num,
  })
},

  rangeErrorAbout(){
    var isShow = this.data.rangeError.isShow;
    this.setData({
      'rangeError.isShow':!isShow
    })
  },

//测距异常容忍次数
  getToleranceTime(e){
    var that = this ;
    var num = parseInt(e.detail.value);
    that.setData({
        'toleranceTimes.number':num,
    })
  },
  toleranceTimesAbout(){
    var isShow = this.data.toleranceTimes.isShow;
    this.setData({
      'toleranceTimes.isShow':!isShow
    })
  },


//获取平层异常检测时长
getDetecttionTime(e){
  var that = this ;
  var num = parseInt(e.detail.value);
  that.setData({
      'detectionTime.number':num,
  })
},

detectionTimeAbout(){
  var isShow = this.data.detectionTime.isShow;
  this.setData({
    'detectionTime.isShow':!isShow
  })
},


  errorConfig(){
    console.log('配置平层参数');
    var that = this ;
    var elevatorId = that.data.elevatorId;
    var info = {
      elevatorId : 0x0,
      robotId : 0x0
    }
    var toleranceTimes = that.data.toleranceTimes.number;
    var rangeError = that.data.rangeError.number;
    var detectionTime = that.data.detectionTime.number;

    if(rangeError<1||rangeError>3000 || isNaN(rangeError)){
      console.log("平层距离测定误差输入有误")
      wx.showToast({
        title: '平层距离测定误差输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }
    if(toleranceTimes<1||toleranceTimes>16 || isNaN(toleranceTimes)){
      console.log("测距异常容忍次数输入有误")
      wx.showToast({
        title: '测距异常容忍次数输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }
    if(detectionTime<1||detectionTime>10 || isNaN(detectionTime)){
      console.log("平层异常检测时长输入有误")
      wx.showToast({
        title: '平层异常检测时长输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }

    info.elevatorId = elevatorId;
    info.robotId = ROBOTID
    var checkCount = that.data.toleranceTimes.number;
    var toleDistance = that.data.rangeError.number;
    var checkFlatFloorTime = that.data.detectionTime.number * 20;
    console.log("checkcount : " + checkCount)
    console.log("toleDistance : " + toleDistance)
    console.log("checkFlatFloorTime : " + checkFlatFloorTime)
    that.setData({
        'payloadConfigTole.checkCount' : checkCount,
        'payloadConfigTole.toleDistance' : toleDistance,
        'payloadConfigTole.checkFlatFloorTime' : checkFlatFloorTime,
        'payloadConfigTole.data[1]' : checkCount % 256,
        'payloadConfigTole.data[3]' : (toleDistance / 256) & 0xff,
        'payloadConfigTole.data[2]' : toleDistance % 256,
        'payloadConfigTole.data[5]' : (checkFlatFloorTime / 256) & 0xff,
        'payloadConfigTole.data[4]' : checkFlatFloorTime % 256 ,
    })
     var deviceId = wx.getStorageSync('deviceId');
     var serviceId = wx.getStorageSync('serviceId');
     var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
     utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,that.data.payloadConfigTole);

  },
onUnload(){
  var pages = getCurrentPages();
  var prevPage = pages[pages.length - 2];
  prevPage.setData({
    errorConfigDisable: true 
  })
}

})