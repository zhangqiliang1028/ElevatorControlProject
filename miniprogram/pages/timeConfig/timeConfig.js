const app = getApp()
const { saveDataToCloud } = require("../../utils/util.js");
const utils = require("../../utils/util.js");
const ROBOTID = 0x00000000

Page({
  data: {
    status:{
      number:10,//梯控状态上报周期
      minus:'normal',
      plus:'normal',
      isShow:false
    },
    distance:{
      number:200, //楼层距离测定周期
      minus:'normal',
      plus:'normal',
      isShow:false
    },
    call:{
      number:300, //等待呼梯任务超时
      minus:'normal',
      plus:'normal',
      isShow:false
    },
    message:{
      number:60, //开门消息回复超时
      minus:'normal',
      plus:'disable',
      isShow:false
    },
    reset:{
      number:15, //开门超时重置周期
      minus:'normal',
      plus:'normal',
      isShow:false
    },
    maxKeep:{
      number:30, //开门最长保持时间
      minus:'normal',
      plus:'normal',
      isShow:false
    },
    btnReset:{
      number:10, //开门最长保持时间
      minus:'normal',
      plus:'normal',
      isShow:false
    },
    pause:{
      number:100, //按键按下停顿时间
      minus:'normal',
      plus:'normal',
      isShow:false
    },  
  //时间设置的指令
  payloadConfigTime:{
      data : [
        //cmdID
        0xE6,
        0x00,
        //btnRepushPeriod
        0x00,
        0x00,
        //btnDownPeriod
        0x00,
        0x00,
        //tellRobotArrPeriod
        0x00,
        0x00,
        //doorOpenTimeOut
        0x00,
        0x00,
        //report2CloudPeriod
        0x00,
        0x00,
        //disUpdatePeriod
        0x00,
        0x00,
        //waitingPeriod
        0x00,
        0x00,
        //D3KeepAlivedPeriod
        0x00,
        0x00,
        //用于内存对齐
        0x00,
        0x00
      ],
      cmdID : 0xE6,
      btnRepushPeriod : 0,
      btnDownPeriod : 0,
      tellRobotArrPeriod : 0,
      doorOpenTimeOut : 0,
      report2CloudPeriod : 0,
      disUpdatePeriod : 0,
      waitingPeriod : 0,
      D3KeepAlivedPeriod : 0,
      payloadLength : 20
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


//梯控状态上报周期
  /*点击减号*/
  bindStatusMnius: function() {
    var num = this.data.status.number;
    if (num>5) {
      num--;
    }
    var minusStatus = num>5 ? 'normal':'disable';
    var plusStatus = num < 60 ? 'normal' : 'disable';
    this.setData({
      'status.number': num,
      'status.minus':minusStatus,
      'status.plus': plusStatus
    })
  },
  /*点击加号*/
  bindStatusPlus: function() {
    var num = this.data.status.number;
    if(num<60){
       num++;
    }
    var minusStatus = num>5 ? 'normal':'disable';
    var plusStatus = num < 60 ? 'normal' : 'disable';
    this.setData({
      'status.number':num,
      'status.minus':minusStatus,
      'status.plus': plusStatus
    })
  },
  aboutStatus(){
    var isShow = this.data.status.isShow;
    this.setData({
      'status.isShow':!isShow
    })
  },

  //楼层距离测定周期
  /*点击减号*/
  bindDistanceMnius: function() {
    var num = this.data.distance.number;
    if (num>100) {
      num--;
    }
    var minus= num>100 ? 'normal':'disable';
    var plus = num < 5000 ? 'normal' : 'disable';
    this.setData({
      'distance.number': num,
      'distance.minus':minus,
      'distance.plus': plus
    })
  },
  /*点击加号*/
  bindDistancePlus: function() {
    var num = this.data.distance.number;
    if(num<5000){
       num++;
    }
    var minus= num>100 ? 'normal':'disable';
    var plus = num < 5000 ? 'normal' : 'disable';
    this.setData({
      'distance.number':num,
      'distance.minus':minus,
      'distance.plus': plus
    })
  },
  distanceAbout(){
    var isShow = this.data.distance.isShow;
    this.setData({
      'distance.isShow':!isShow
    })
  },

  //等待呼叫任务超时
  bindCallMnius: function() {
    var num = this.data.call.number;
    if (num>10) {
      num--;
    }
    var minus= num>10 ? 'normal':'disable';
    var plus = num < 500 ? 'normal' : 'disable';
    this.setData({
      'call.number': num,
      'call.minus':minus,
      'call.plus': plus
    })
  },
  /*点击加号*/
  bindCallPlus: function() {
    var num = this.data.call.number;
    if(num<500){
       num++;
    }
    var minus= num>10 ? 'normal':'disable';
    var plus = num < 500 ? 'normal' : 'disable';
    this.setData({
      'call.number':num,
      'call.minus':minus,
      'call.plus': plus
    })
  },
  callAbout(){
    var isShow = this.data.call.isShow;
    this.setData({
      'call.isShow':!isShow
    })
  },

  //开门消息回复超时
  bindMessageMinus: function() {
    var num = this.data.message.number;
    if (num>1) {
      num--;
    }
    var minus= num>1 ? 'normal':'disable';
    var plus = num < 60 ? 'normal' : 'disable';
    this.setData({
      'message.number': num,
      'message.minus':minus,
      'message.plus': plus
    })
  },
  /*点击加号*/
  bindMessagePlus: function() {
    var num = this.data.message.number;
    if(num<60){
       num++;
    }
    var minus= num>1 ? 'normal':'disable';
    var plus = num < 60 ? 'normal' : 'disable';
    this.setData({
      'message.number':num,
      'message.minus':minus,
      'message.plus': plus
    })
  },
  messageAbout(){
    var isShow = this.data.message.isShow;
    this.setData({
      'message.isShow':!isShow
    })
  },

  //开门超时重置周期
  bindResetMinus: function() {
    var num = this.data.reset.number;
    if (num>1) {
      num--;
    }
    var minus= num>1 ? 'normal':'disable';
    var plus = num < 60 ? 'normal' : 'disable';
    this.setData({
      'reset.number': num,
      'reset.minus':minus,
      'reset.plus': plus
    })
  },
  /*点击加号*/
  bindResetPlus: function() {
    var num = this.data.reset.number;
    if(num<60){
       num++;
    }
    var minus= num>1 ? 'normal':'disable';
    var plus = num < 60 ? 'normal' : 'disable';
    this.setData({
      'reset.number':num,
      'reset.minus':minus,
      'reset.plus': plus
    })
  },
  resetAbout(){
    var isShow = this.data.reset.isShow;
    this.setData({
      'reset.isShow':!isShow
    })
  },

  //开门最长时间保持
  bindMaxKeepMinus: function() {
    var num = this.data.maxKeep.number;
    if (num>1) {
      num--;
    }
    var minus= num>1 ? 'normal':'disable';
    var plus = num < 600 ? 'normal' : 'disable';
    this.setData({
      'maxKeep.number': num,
      'maxKeep.minus':minus,
      'maxKeep.plus': plus
    })
  },
  /*点击加号*/
  bindMaxKeepPlus: function() {
    var num = this.data.maxKeep.number;
    if(num<600){
       num++;
    }
    var minus= num>1 ? 'normal':'disable';
    var plus = num < 600 ? 'normal' : 'disable';
    this.setData({
      'maxKeep.number':num,
      'maxKeep.minus':minus,
      'maxKeep.plus': plus
    })
  },
  maxKeepAbout(){
    var isShow = this.data.maxKeep.isShow;
    this.setData({
      'maxKeep.isShow':!isShow
    })
  },
 
  //楼层按钮重按间隔
  bindBtnResetMinus: function() {
    var num = this.data.btnReset.number;
    if (num>1) {
      num--;
    }
    var minus= num>1 ? 'normal':'disable';
    var plus = num < 60 ? 'normal' : 'disable';
    this.setData({
      'btnReset.number': num,
      'btnReset.minus':minus,
      'btnReset.plus': plus
    })
  },
  /*点击加号*/
  bindBtnResetPlus: function() {
    var num = this.data.btnReset.number;
    if(num<60){
       num++;
    }
    var minus= num>1 ? 'normal':'disable';
    var plus = num < 60 ? 'normal' : 'disable';
    this.setData({
      'btnReset.number':num,
      'btnReset.minus':minus,
      'btnReset.plus': plus
    })
  },
  btnResetAbout(){
    var isShow = this.data.btnReset.isShow;
    this.setData({
      'btnReset.isShow':!isShow
    })
  },

  //按键按下停顿时间
  bindPauseMinus: function() {
    var num = this.data.pause.number;
    if (num>50) {
      num--;
    }
    var minus= num>50 ? 'normal':'disable';
    var plus = num < 1000 ? 'normal' : 'disable';
    this.setData({
      'pause.number': num,
      'pause.minus':minus,
      'pause.plus': plus
    })
  },
  /*点击加号*/
  bindPausePlus: function() {
    var num = this.data.pause.number;
    if(num<1000){
       num++;
    }
    var minus= num>50 ? 'normal':'disable';
    var plus = num < 1000 ? 'normal' : 'disable';
    this.setData({
      'pause.number':num,
      'pause.minus':minus,
      'pause.plus': plus
    })
  },
  pauseAbout(){
    var isShow = this.data.pause.isShow;
    this.setData({
      'pause.isShow':!isShow
    })
  },

  // 时间配置
  sendTimeMsg(){
    var that = this
    var elevatorId = that.data.elevatorId;
    var info = {
      elevatorId : 0x0,
      robotId : 0x0
    }
    info.elevatorId = elevatorId
    info.robotId = ROBOTID

    var btnRepushPeriod = that.data.btnReset.number * 20
    var btnDownPeriod = that.data.pause.number / 50
    var tellRobotArrPeriod = that.data.message.number * 20
    var doorOpenTimeOut = that.data.maxKeep.number * 20
    var report2CloudPeriod = that.data.status.number * 20
    var disUpdatePeriod = that.data.distance.number / 50
    var waitingPeriod = that.data.call.number * 20
    var D3KeepAlivedPeriod = that.data.reset.number * 20
    console.log(report2CloudPeriod )
    console.log(disUpdatePeriod )
    console.log(waitingPeriod  )
    console.log(tellRobotArrPeriod)
    console.log(D3KeepAlivedPeriod )
    console.log(doorOpenTimeOut )
    console.log(btnRepushPeriod )
    console.log(btnDownPeriod)

    that.setData({
        'payloadConfigTime.btnRepushPeriod' : btnRepushPeriod,
        'payloadConfigTime.btnDownPeriod' : btnDownPeriod,
        'payloadConfigTime.tellRobotArrPeriod' : tellRobotArrPeriod,
        'payloadConfigTime.doorOpenTimeOut' : doorOpenTimeOut,
        'payloadConfigTime.report2CloudPeriod' : report2CloudPeriod,
        'payloadConfigTime.disUpdatePeriod' : disUpdatePeriod,
       'payloadConfigTime.waitingPeriod' : waitingPeriod,
        'payloadConfigTime.D3KeepAlivedPeriod' : D3KeepAlivedPeriod,
        'payloadConfigTime.data[2]' : btnRepushPeriod % 256,
        'payloadConfigTime.data[3]' : (btnRepushPeriod / 256) & 0xff,
        'payloadConfigTime.data[4]' : btnDownPeriod % 256,
        'payloadConfigTime.data[5]' : (btnDownPeriod / 256) & 0xff,
        'payloadConfigTime.data[6]' : tellRobotArrPeriod % 256,
        'payloadConfigTime.data[7]' : (tellRobotArrPeriod / 256) & 0xff,
        'payloadConfigTime.data[8]' : doorOpenTimeOut % 256,
        'payloadConfigTime.data[9]' : (doorOpenTimeOut / 256) & 0xff,
        'payloadConfigTime.data[10]' : report2CloudPeriod % 256,
        'payloadConfigTime.data[11]' : (report2CloudPeriod / 256) & 0xff,
        'payloadConfigTime.data[12]' : disUpdatePeriod % 256,
        'payloadConfigTime.data[13]' : (disUpdatePeriod / 256) & 0xff,
        'payloadConfigTime.data[14]' : waitingPeriod % 256,
        'payloadConfigTime.data[15]' : (waitingPeriod / 256) & 0xff,
        'payloadConfigTime.data[16]' : D3KeepAlivedPeriod % 256,
        'payloadConfigTime.data[17]' : (D3KeepAlivedPeriod / 256) & 0xff
    })

     var deviceId = wx.getStorageSync('deviceId');
     var serviceId = wx.getStorageSync('serviceId');
     var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
     utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,that.data.payloadConfigTime);
    // saveDataToCloud("进行时间设置")
    saveDataToCloud(btnRepushPeriod)
    saveDataToCloud(btnDownPeriod)
    saveDataToCloud(tellRobotArrPeriod)
    saveDataToCloud( doorOpenTimeOut)
    saveDataToCloud(report2CloudPeriod)
    saveDataToCloud(disUpdatePeriod)
    saveDataToCloud(waitingPeriod)
    saveDataToCloud(D3KeepAlivedPeriod)

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
    timeConfigDisable: true 
  })
}

})