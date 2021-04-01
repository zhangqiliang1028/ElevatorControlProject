const app = getApp()
const { saveDataToCloud } = require("../../utils/util.js");
const utils = require("../../utils/util.js");
const ROBOTID = 0x00000000

Page({
  data: {
    status:{
      number:10,//梯控状态上报周期
      isShow:false
    },
    distance:{
      number:200, //楼层距离测定周期
      isShow:false
    },
    call:{
      number:30, //等待呼梯任务超时
      isShow:false
    },
    message:{
      number:15, //开门消息回复超时
      isShow:false
    },
    reset:{
      number:15, //开门超时重置周期
      isShow:false
    },
    maxKeep:{
      number:30, //开门最长保持时间
      isShow:false
    },
    btnReset:{
      number:10, //开门最长保持时间
      isShow:false
    },
    pause:{
      number:100, //按键按下停顿时间
      isShow:false
    },  
    cardKeepPeriod:{
      number:100, //刷卡保持时间
      isShow:false
    },
    doorOpenPeriod:{
      number:100, //开门速度
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
        //cardKeepPeriod
        0x00,
        0x00,
        //doorOpenPeriod
        0x00,
        0x00,
        //用于扩展对齐
        0x00,
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
      cardKeepPeriod:0,
      doorOpenPeriod:0,
      reserve:0,
      payloadLength : 24
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
getStatus(e){
  var num = parseInt(e.detail.value);
  var that = this;
  that.setData({
    'status.number':num
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

  getDistance(e){
    var num = parseInt(e.detail.value);
    var that = this;
    that.setData({
      'distance.number':num
    })
  },

  distanceAbout(){
    var isShow = this.data.distance.isShow;
    this.setData({
      'distance.isShow':!isShow
    })
  },

  //等待呼叫任务超时
  getCall(e){
    var num = parseInt(e.detail.value);
    var that = this;
    that.setData({
      'call.number':num
    })
  },

  callAbout(){
    var isShow = this.data.call.isShow;
    this.setData({
      'call.isShow':!isShow
    })
  },

  //开门消息回复超时

  getMessage(e){
    var num = parseInt(e.detail.value);
    var that = this;
    that.setData({
      'message.number':num
    })
  },

  messageAbout(){
    var isShow = this.data.message.isShow;
    this.setData({
      'message.isShow':!isShow
    })
  },

  //开门超时重置周期
  getReset(e){
    var num = parseInt(e.detail.value);
    var that = this;
    that.setData({
      'reset.number':num
    })
  },

  resetAbout(){
    var isShow = this.data.reset.isShow;
    this.setData({
      'reset.isShow':!isShow
    })
  },

  //开门最长时间保持

  getMaxKeep(e){
    var num = parseInt(e.detail.value);
    var that = this;
    that.setData({
      'maxKeep.number':num
    })
  },

  maxKeepAbout(){
    var isShow = this.data.maxKeep.isShow;
    this.setData({
      'maxKeep.isShow':!isShow
    })
  },
 
  //楼层按钮重按间隔

  getBtnReset(e){
    var num = parseInt(e.detail.value);
    var that = this;
    that.setData({
      'btnReset.number':num
    })
  },

  btnResetAbout(){
    var isShow = this.data.btnReset.isShow;
    this.setData({
      'btnReset.isShow':!isShow
    })
  },

  //按键按下停顿时间
  getPause(e){
    var num = parseInt(e.detail.value);
    var that = this;
    that.setData({
      'pause.number':num
    })
  },

  pauseAbout(){
    var isShow = this.data.pause.isShow;
    this.setData({
      'pause.isShow':!isShow
    })
  },


   //刷卡保持时间
 
   getCardKeepPeriod(e){
    var num = parseInt(e.detail.value);
    var that = this;
    that.setData({
      'cardKeepPeriod.number':num
    })
  },

  cardKeepAbout(){
    var isShow = this.data.cardKeepPeriod.isShow;
    this.setData({
      'cardKeepPeriod.isShow':!isShow
    })
  },

  //开门速度

  getDoorOpenPeriod(e){
    var num = parseInt(e.detail.value);
    var that = this;
    that.setData({
      'doorOpenPeriod.number':num
    })
  },

  doorOpenAbout(){
    var isShow = this.data.doorOpenPeriod.isShow;
    this.setData({
      'doorOpenPeriod.isShow':!isShow
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
    //检验输入是否符合要求
    console.log("检验输入是否符合要求")
   //梯控状态上报周期
    var statusNumber = that.data.status.number;
    if(statusNumber<5||statusNumber>60||isNaN(statusNumber)){
      console.log("梯控状态上报周期输入有误")
      wx.showToast({
        title: '梯控状态上报周期输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }
    //楼层距离测定周期
    var distanceNumber = that.data.distance.number;
    if(distanceNumber<50||distanceNumber>5000||isNaN(distanceNumber)){
      console.log("楼层距离测定周期输入有误")
      wx.showToast({
        title: '楼层距离测定周期输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }
    //等待呼梯任务超时
    var callNumber = that.data.call.number;
    if(callNumber<10||callNumber>600||isNaN(callNumber)){
      console.log("等待呼梯任务超时输入有误")
      wx.showToast({
        title: '等待呼梯任务超时输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }

    //开门消息回复超时
    var messageNumber = that.data.message.number;
    if(messageNumber<1||messageNumber>60||isNaN(messageNumber)){
      console.log("开门消息回复超时输入有误")
      wx.showToast({
        title: '开门消息回复超时输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }

    //开门超时重置周期
    var resetNumber = that.data.reset.number;
    if(resetNumber<1||resetNumber>60||isNaN(resetNumber)){
      console.log("开门超时重置周期输入有误")
      wx.showToast({
        title: '开门超时重置周期输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }
    
    //开门最长保持时间
    var maxKeepNumber = that.data.maxKeep.number;
    if(maxKeepNumber<1||maxKeepNumber>600||isNaN(maxKeepNumber)){
      console.log("开门最长保持时间输入有误")
      wx.showToast({
        title: '开门最长保持时间输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }

    //楼层按键重按间隔
    var btnResetNumber = that.data.btnReset.number;
    if(btnResetNumber<1||btnResetNumber>60||isNaN(btnResetNumber)){
      console.log("楼层按键重按间隔输入有误")
      wx.showToast({
        title: '楼层按键重按间隔输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }

    //按键按下停顿时间
    var pauseNumber = that.data.pause.number;
    if(pauseNumber<50||pauseNumber>1000||isNaN(pauseNumber)){
      console.log("按键按下停顿时间输入有误")
      wx.showToast({
        title: '按键按下停顿时间输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }
    //刷卡保持时间
    var cardKeepPeriodNumber = that.data.cardKeepPeriod.number;
    if(cardKeepPeriodNumber<50||cardKeepPeriodNumber>10000||isNaN(cardKeepPeriodNumber)){
      console.log("刷卡保持时间输入有误")
      wx.showToast({
        title: '刷卡保持时间输入有误',
        icon:'none',
        duration:1000
      })
      return;
    }
    //开门速度
    var doorOpenPeriodNumber =that.data.doorOpenPeriod.number;
    if(doorOpenPeriodNumber<50||doorOpenPeriodNumber>10000||isNaN(doorOpenPeriodNumber)){
      console.log("开门速度输入有误")
      wx.showToast({
        title: '开门速度输入有误',
        icon:'none',
        duration:1000
      })
      return ;
    }

    console.log("输入检验合格")
    var btnRepushPeriod = that.data.btnReset.number * 20
    var btnDownPeriod = that.data.pause.number / 50
    var tellRobotArrPeriod = that.data.message.number * 20
    var doorOpenTimeOut = that.data.maxKeep.number * 20
    var report2CloudPeriod = that.data.status.number * 20
    var disUpdatePeriod = that.data.distance.number / 50
    var waitingPeriod = that.data.call.number * 20
    var D3KeepAlivedPeriod = that.data.reset.number * 20
    var cardKeepPeriod = that.data.cardKeepPeriod.number / 50
    var doorOpenPeriod = that.data.doorOpenPeriod.number / 50
    var reserve = 0x00;

    //时间参数
    console.log("时间参数")
    console.log("梯控状态上报周期:"+report2CloudPeriod )
    console.log("楼层间距采样间隔:"+disUpdatePeriod )
    console.log("等待呼梯任务超时:"+waitingPeriod  )
    console.log("到达消息发送间隔:"+tellRobotArrPeriod)
    console.log("开门超时重置周期:"+D3KeepAlivedPeriod )
    console.log("开门最长保持时间:"+doorOpenTimeOut )
    console.log("楼层按键重按间隔:"+btnRepushPeriod )
    console.log("按键按下停顿时间:"+btnDownPeriod)
    console.log("刷卡保持时间:"+cardKeepPeriod)
    console.log("开门速度:"+doorOpenPeriod)
    console.log(reserve)

    that.setData({
        'payloadConfigTime.btnRepushPeriod' : btnRepushPeriod,
        'payloadConfigTime.btnDownPeriod' : btnDownPeriod,
        'payloadConfigTime.tellRobotArrPeriod' : tellRobotArrPeriod,
        'payloadConfigTime.doorOpenTimeOut' : doorOpenTimeOut,
        'payloadConfigTime.report2CloudPeriod' : report2CloudPeriod,
        'payloadConfigTime.disUpdatePeriod' : disUpdatePeriod,
       'payloadConfigTime.waitingPeriod' : waitingPeriod,
        'payloadConfigTime.D3KeepAlivedPeriod' : D3KeepAlivedPeriod,
        'payloadConfigTime.cardKeepPeriod' : cardKeepPeriod,
        'payloadConfigTime.doorOpenPeriod' : doorOpenPeriod,
        'payloadConfigTime.reserve' : reserve,

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
        'payloadConfigTime.data[17]' : (D3KeepAlivedPeriod / 256) & 0xff,
        'payloadConfigTime.data[18]' : cardKeepPeriod % 256,
        'payloadConfigTime.data[19]' : (cardKeepPeriod / 256) & 0xff,
        'payloadConfigTime.data[20]' : doorOpenPeriod % 256,
        'payloadConfigTime.data[21]' : (doorOpenPeriod / 256) & 0xff,
        'payloadConfigTime.data[22]' : 0x00,
        'payloadConfigTime.data[23]' : 0x00
    })

     var deviceId = wx.getStorageSync('deviceId');
     var serviceId = wx.getStorageSync('serviceId');
     var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
     utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,that.data.payloadConfigTime);
  },
  
onUnload(){
  var pages = getCurrentPages();
  var prevPage = pages[pages.length - 2];
  prevPage.setData({
    timeConfigDisable: true 
  })
}

})