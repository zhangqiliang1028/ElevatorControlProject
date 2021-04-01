const { saveDataToCloud } = require("../../utils/util.js");
const utils = require("../../utils/util.js");
const Decoder = require("../../utils/Decoder.js");

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
      elevatorId:'',

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

    that.getBLEDeviceCharacteristics(serviceId,deviceId);
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

      }else{
        wx.showToast({
          title: '输入楼层超出',
          icon:'none',
          duration:1500
        })
      }
    },

// //picker事件
// bindPickerChange:function(e){
//   this.setData({
//     index: e.detail.value
//   })
// },


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
},

//监控标定
//获取蓝牙设备某个服务中的所有 characteristic（特征值）
getBLEDeviceCharacteristics(serviceId,deviceId){
  var that = this;
  wx.getBLEDeviceCharacteristics({
    deviceId: deviceId,
    serviceId: serviceId,
    success: function (res) {
      for (let i = 0; i < res.characteristics.length; i++) {
        let item = res.characteristics[i]
        if (item.properties.read) { //该特征值是否支持 read 操作
          var log = "该特征值支持 read 操作:" + item.uuid + "\n";
          console.log(log);
        }
        if (item.properties.write) {//该特征值是否支持 write 操作
          var log = "该特征值支持 write 操作:" + item.uuid + "\n";
          console.log(log)
          var writeCharacteristicId = item.uuid;
          wx.setStorageSync('writeCharacteristicId', writeCharacteristicId);
        }
        if (item.properties.notify || item.properties.indicate) {//该特征值是否支持 notify或indicate 操作
          var log = "该特征值支持 notify 操作:" + item.uuid + "\n";
          console.log(log)
          that.notifyBLECharacteristicValueChange(deviceId,serviceId,item.uuid);
        }
      }
    }
  })
},

//启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。
//注意：必须设备的特征值支持notify或者indicate才可以成功调用，具体参照 characteristic 的 properties 属性
notifyBLECharacteristicValueChange(deviceId,serviceId,notifyCharacteristicId){
  var that = this;
  wx.notifyBLECharacteristicValueChange({
    state: true, // 启用 notify 功能
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: notifyCharacteristicId,
    success: function (res) {
      var log = "notify启动成功" + res.errMsg+"\n";
      console.log(log);
      that.onBLECharacteristicValueChange();   //监听特征值变化
    },
    fail: function (res) {
      wx.showToast({
        title: 'notify启动失败',
        mask: true
      });
      setTimeout(function () {
        wx.hideToast();
      }, 2000)
    }
  })
},

 //监听低功耗蓝牙设备的特征值变化。必须先启用notify接口才能接收到设备推送的notification。
onBLECharacteristicValueChange(){
  var that = this;
  wx.onBLECharacteristicValueChange(function (res) {

    var resValue = utils.ab2hext(res.value); //16进制字符串
    var strprint = Decoder.GBKHexstrToString(resValue)
    console.log(strprint)
    utils.saveDataToCloud(strprint);
    
    var resValueStr = utils.hexToString(resValue);
    var msg = utils.analysis(resValueStr)
    if(msg == undefined){
      console.log("非回复消息")
      return
    }

    if(msg.length >= 20){
      that.onReceivedMsg(msg)
    }
  });
},


//在这里对消息进行解析
onReceivedMsg(msg){
  var that = this ; 

  console.log("开始解析收到的信息")
  console.log(msg[0] + msg[msg.length])
  var msgHead = [
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00
  ]
  if(msg.length < 40){
    console.log("接受消息小于头部长度")
    return 
  }
  //构建头部消息
  for(var i = 0;i < 20;++i){
    msgHead[i] = parseInt(msg.substr(i*2,2),16)
  }
  
  var payloadLength = msgHead[17] * 256 + msgHead[16]
  console.log(msgHead[17])
  console.log(msgHead[16])
  console.log(payloadLength)
  if(payloadLength != (msg.length - 40) / 2){
    console.log("消息未接受完整 :" + payloadLength + " " + msg.length) 
  }
  if(msgHead[0] != 0x1E || msgHead[1] != 0x1F){
    console.log("Head1 或者 Head2 错误")
  }else{
    if(utils.computeMsgHeadCRC(msgHead) != msgHead[18]){
      console.log(utils.computeMsgHeadCRC(msgHead))
      console.log(msgHead[18])
      console.log("头部CRC错误")
    }else{
      //构建payload
      var payload = new Uint8Array(payloadLength)
      for(var i = 0;i < payloadLength;++i){
        payload[i] = parseInt(msg.substr(40 + i*2 , 2),16)
      }
      if(utils.computePayloadCRC(payload,payloadLength) != msgHead[19]){
        console.log("负载CRC校验错误")
      }else{
        var result = payload[2] * 256 + payload[3]
        if(payload[0] == 0xE1){
          if(result){
            console.log("标定电梯成功")
            wx.showToast({
              title: '标定电梯成功',
              icon:'success',
              duration:1000
            });
          }else{
            console.log("标定电梯失败")
            wx.showToast({
              title: '标定电梯失败',
              duration:1000
            });
          }
        }
      }
    }
  }
},


})