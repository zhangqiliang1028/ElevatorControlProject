const utils = require("../../utils/util.js");
const Decoder = require("../../utils/Decoder.js");
const ROBOTID = 0x11111111

Page({

  /**
   * 页面的初始数据
   */
  data: {
    elevatorId:'',
    isTop:false,
    isBottom:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */

  onLoad: function (options) {
    console.log('开始重启轿厢板/井顶设备');
    var that =this ;
    var  deviceId =wx.getStorageSync('deviceId');
    var serviceId = wx.getStorageSync('serviceId');
    var elevatorId = wx.getStorageSync('elevatorId');
    that.setData({
      elevatorId:elevatorId
    })
    that.getBLEDeviceCharacteristics(serviceId,deviceId);
  },

  //获取蓝牙监听结果
  
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
      if(res.errCode===10006){
        wx.showToast({
          title: '当前连接已断开',
          icon:'none',
          duration:2000
        })
      }else{
        wx.showToast({
        title: 'notify启动失败',
        mask: true
      });
      setTimeout(function () {
        wx.hideToast();
      }, 2000)
      }
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
        if(payload[0] == 0xEC){
          console.log("进行轿厢板重启:")
          if(payload[1]==0){
            if(payload[2]==1){
              console.log("梯顶板重启成功")
              wx.showToast({
                title: '梯顶板重启成功',
                icon:'success',
                duration:1000
              });
              that.setData({
                isTop:true
              })
            }else if(payload[2]==0){
              console.log("梯顶板重启失败")
              wx.showToast({
                title: '梯顶板重启失败',
                duration:1000
              });
              that.setData({
                isTop:false
              })
              }else if(payload[2]==2){
                console.log("电梯正忙")
                wx.showToast({
                  title: '电梯正忙...',
                  duration:1000
                });
                that.setData({
                  isTop:false
                })
              }
            }
            console.log("进行梯顶板重启:")
            if(payload[1]==1){
              if(payload[2]==1){
                console.log("梯顶板重启成功")
                wx.showToast({
                  title: '梯顶板重启成功',
                  icon:'success',
                  duration:1000
                });
                that.setData({
                  isBottom:true
                })
              }else if(payload[2]==0){
                console.log("梯顶板重启失败")
                wx.showToast({
                  title: '梯顶板重启失败',
                  duration:1000
                });
                that.setData({
                  isBottom:false
                })
                }else if(payload[2]==2){
                  console.log("电梯正忙")
                  wx.showToast({
                    title: '电梯正忙...',
                    duration:1000
                  });
                  that.setData({
                    isBottom:false
                  })
                }
            }
        }
      }
    }
  }
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
  wx.showToast({
    title: '正在重启轿厢板....',
    icon:'loading',
    duration:3000
  });
  utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,payload);

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

  that.setData({
    isBottom:true,
    isSuccess:false
  })

  var info = {
    elevatorId : 0x0,
    robotId : 0x0
  }
  
  info.elevatorId=that.data.elevatorId;
  info.robotId=ROBOTID;
  var deviceId = wx.getStorageSync('deviceId');
  var serviceId = wx.getStorageSync('serviceId');
  var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
  console.log("发送重启梯井顶命令")
  wx.showToast({
    title: '正在重启....',
    icon:'loading',
    duration:3000
  });
  utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,payload);
  
},

onUnload(){
  var pages = getCurrentPages();
  var prevPage = pages[pages.length - 2];
  prevPage.setData({
    rebootDisable: true 
  })
}
})