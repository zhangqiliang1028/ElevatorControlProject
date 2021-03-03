const app = getApp()
const { saveDataToCloud } = require("../../utils/util.js");
const utils = require("../../utils/util.js");

const ROBOTID = 0x1111111

Page({
  data: {
    rangeError:{
      number:400,//平层距离测定误差
      minus:'normal',
      plus:'normal',
      isShow:false
    },
    toleranceTimes:{
      number:5,//测距异常容忍次数
      minus:'normal',
      plus:'normal',
      isShow:false
    },
    detectionTime:{
      number:1,//平层异常检测时长
      minus:'disable',
      plus:'normal',
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
  /*点击减号*/
  bindRangeErrorMinus: function() {
    var num = this.data.rangeError.number;
    if (num>1) {
      num--;
    }
    var minus = num>1 ? 'normal':'disable';
    var plus = num < 3000 ? 'normal' : 'disable';
    this.setData({
      'rangeError.number': num,
      'rangeError.minus':minus,
      'rangeError.plus': plus
    })
  },
  /*点击加号*/
  bindRangeErrorPlus: function() {
    var num = this.data.rangeError.number;
    if(num<3000){
       num++;
    }
    var minus = num>1 ? 'normal':'disable';
    var plus = num < 3000 ? 'normal' : 'disable';
    this.setData({
      'rangeError.number':num,
      'rangeError.minus':minus,
      'rangeError.plus': plus
    })
  },
  rangeErrorAbout(){
    var isShow = this.data.rangeError.isShow;
    this.setData({
      'rangeError.isShow':!isShow
    })
  },
//测距异常容忍次数
  /*点击减号*/
  bindToleranceTimesMinus: function() {
    var num = this.data.toleranceTimes.number;
    if (num>1) {
      num--;
    }
    var minus = num>1 ? 'normal':'disable';
    var plus = num < 16 ? 'normal' : 'disable';
    this.setData({
      'toleranceTimes.number': num,
      'toleranceTimes.minus':minus,
      'toleranceTimes.plus': plus
    })
  },
  /*点击加号*/
  bindToleranceTimesPlus: function() {
    var num = this.data.toleranceTimes.number;
    if(num<16){
       num++;
    }
    var minus = num>1 ? 'normal':'disable';
    var plus = num < 16 ? 'normal' : 'disable';
    this.setData({
      'toleranceTimes.number':num,
      'toleranceTimes.minus':minus,
      'toleranceTimes.plus': plus
    })
  },
  toleranceTimesAbout(){
    var isShow = this.data.toleranceTimes.isShow;
    this.setData({
      'toleranceTimes.isShow':!isShow
    })
  },


//平层异常检测时长
 /*点击减号*/
 bindDetectionTimeMinus: function() {
  var num = this.data.detectionTime.number;
  if (num>1) {
    num--;
  }
  var minus = num>1 ? 'normal':'disable';
  var plus = num < 10 ? 'normal' : 'disable';
  this.setData({
    'detectionTime.number': num,
    'detectionTime.minus':minus,
    'detectionTime.plus': plus
  })
},
/*点击加号*/
bindDetectionTimePlus: function() {
  var num = this.data.detectionTime.number;
  if(num<10){
     num++;
  }
  var minus = num>1 ? 'normal':'disable';
  var plus = num < 10 ? 'normal' : 'disable';
  this.setData({
    'detectionTime.number':num,
    'detectionTime.minus':minus,
    'detectionTime.plus': plus
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
    //  saveDataToCloud("设置容差参数")
     saveDataToCloud(checkCount)
     saveDataToCloud(toleDistance)
     saveDataToCloud(checkFlatFloorTime)
    wx.showToast({
      title: '配置成功',
      icon:'success',
      duration:15000
    })
  },
onUnload(){
  var pages = getCurrentPages();
  var prevPage = pages[pages.length - 2];
  prevPage.setData({
    errorConfigDisable: true 
  })
}

})