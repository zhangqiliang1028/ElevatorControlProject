const utils = require("../../utils/util.js");

const app = getApp()
const ROBOTID = 0x11111111

Page({

  /**
   * 页面的初始数据
   */
  data: {
    //测试用的指令
    payloadTestSwitch:{
      data:[
        0xE5,
        0x00,
        0x00,
        0x00,
      ],
      floorNumber : 0,
      payloadLength : 4
    },
    queryFloorNumber : 0,
    runningState : "",
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


      //点击测试
storeyTest(){
  console.log('开始测试');
  var that = this ;
  var elevatorId =that.data.elevatorId;
  wx.showToast({
    title: '测试楼层中...',
    icon:'loading',
    duration:1500
})

  var floorNumber = that.data.payloadTestSwitch.floorNumber;
  if(floorNumber<128&&floorNumber>0||floorNumber<0&&floorNumber>=-10){
      var info ={
      elevatorId : 0x0,
      robotId : 0x0
    }

    console.log("data[3]:"+(((floorNumber+ 256) % 256) & 0xff));
    console.log("data[2]:"+(floorNumber + 256)%256)

    if(floorNumber < 0){
      that.setData({
        'payloadTestSwitch.data[3]': 0xff,
        'payloadTestSwitch.data[2]': (floorNumber + 256)%256
      })
    }else{
      that.setData({
        'payloadTestSwitch.data[3]': 0x00,
        'payloadTestSwitch.data[2]': (floorNumber + 256)%256
      })
    }
    
    info.elevatorId = elevatorId
    console.log( +info.elevatorId);
    info.robotId = ROBOTID
    console.log('测试楼层');
    var deviceId = wx.getStorageSync('deviceId');
    var serviceId = wx.getStorageSync('serviceId');
    var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
    utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,that.data.payloadTestSwitch);
  }else{
    console.log('输入楼层有误');
    app.showModal('输入楼层有误');
  }
},
//测试开门的命令
testOpenDoor(){
  console.log("测试开门")
  var that = this ;
  var elevatorId =that.data.elevatorId;
  var info ={
    elevatorId : 0x0,
    robotId : 0x0
  }
  that.setData({
    'payloadTestSwitch.data[3]': 0x00,
    'payloadTestSwitch.data[2]': 0x00,
  })
  info.elevatorId = elevatorId
  console.log( +info.elevatorId);
  info.robotId = ROBOTID
  console.log('测试楼层');

  var deviceId = wx.getStorageSync('deviceId');
  var serviceId = wx.getStorageSync('serviceId');
  var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
  utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,that.data.payloadTestSwitch)
},
//单次查询楼层命令
queryCurrentFloor_Once(){
  var that = this ;
  
  var elevatorId =that.data.elevatorId;
  var info ={
    elevatorId : 0x0,
    robotId : 0x0
  }
  info.elevatorId = elevatorId
  console.log( +info.elevatorId);
  info.robotId = ROBOTID
  console.log('查询楼层');
  //这里命令是写死的，不能改变
  var payload = {
    data:[
      0xEA,
      0x02,
      0x00,
      0x00,
    ],
    payloadLength : 4
  }
  var deviceId = wx.getStorageSync('deviceId');
  var serviceId = wx.getStorageSync('serviceId');
  var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
  utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,payload)
 
},
getInput(e){
  var floorNumber = parseInt(e.detail.value);
  this.setData({
    'payloadTestSwitch.floorNumber':floorNumber
  })
  console.log(this.data.payloadTestSwitch.floorNumber);
},

//接收到查询楼层信息后显示查询的楼层信息
setQueryFloorNumber(number,state){
  console.log("查询楼层in test页面" + number)
  let stateStr = state == 1? "停靠" : "运行"
  this.setData({
    'queryFloorNumber' : number,
    'runningState' : stateStr
  })
},

onUnload(){
  var pages = getCurrentPages();
  var prevPage = pages[pages.length - 2];
  prevPage.setData({
    storeyTestDisable: true 
  })
},

})