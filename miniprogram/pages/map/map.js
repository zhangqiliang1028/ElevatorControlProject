const utils = require("../../utils/util.js");
const Decoder = require("../../utils/Decoder.js");
var timer
const app = getApp()
const ROBOTID = 0x11111111
//用于标识这是映射的第几个继电器
var mappingindex = 0
var mappingList = new Array()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    rIndex:0,
    oIndex:0,
    rGroupArray:[{name:'第一组',id:1},{name:'第二组',id:2},{name:'第三组',id:3},{name:'第四组',id:4},{name:'第五组',id:5},{name:'第六组',id:6},{name:'第七组',id:7},{name:'第八组',id:8}],
    oGroupArray:[{
      name:'不刷卡',
      id:0},
      {name:'刷卡-1',id:1},{name:'刷卡-2',id:2}],
    eightInput:'8',
    sevenInput:'7',
    sixInput:'6',
    fiftyInput:'5',
    fourInput:'4',
    threeInput:'3',
    twoInput:'2',
    oneInput:'1',
//设置标签
    isEightInput:false,
    isSevenInput:false,
    isSixInput:false,
    isFiftyInput:false,
    isFourInput:false,
    isThreeInput:false,
    isTwoInput:false,
    isOneInput:false,
    //楼层映射指令和楼层距离标定的指令
    payloadConfigItem:{
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
    elevatorId:'',
    //设置是否成功
    isSuccess:true,
    singleFloatInfoReplReplied:false,
    deviceId:0,
    serviceId:0,
    writeCharacteristicId:0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    console.log('开始监听蓝牙通信');
    var that =this ;
    mappingindex = 0
      mappingList = []
    var  deviceId =wx.getStorageSync('deviceId');
    var serviceId = wx.getStorageSync('serviceId');
    var elevatorId = wx.getStorageSync('elevatorId');
    that.setData({
      elevatorId:elevatorId
    })
    that.getBLEDeviceCharacteristics(serviceId,deviceId);
  },

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
        var result = payload[2] * 256 + payload[3]
        if(payload[0] == 0xE1){    //收到楼层映射消息回复 
          if(result){ 
            app.globalData.reTransmission_count = 0
            console.log("映射成功")
            /*
            wx.showToast({
              title: mappingindex+'号映射成功',
              duration:1000
            })
            */
            that.mappingByOrder();
          }else{   
            console.log("映射失败")  //可以设置重新映射选项
            wx.showToast({
              title: '映射失败',
              duration:2000
            })
        }
      }
    }
  }
  }
  
},

//picker事件
bindPickerRChange:function(e){
  var that = this ;
  if(e.detail.value!=that.data.rIndex){
    that.setData({
      eightInput:'',
      sevenInput:'',
      sixInput:'',
      fiftyInput:'',
      fourInput:'',
      threeInput:'',
      twoInput:'',
      oneInput:'',
      isEightInput:false,
      isSevenInput:false,
      isSixInput:false,
      isFiftyInput:false,
      isFourInput:false,
      isThreeInput:false,
      isTwoInput:false,
      isOneInput:false,
    })
  }
  that.setData({
    rIndex: e.detail.value
  })
},
bindPickerOChange:function(e){
  this.setData({
    oIndex: e.detail.value
  })
},


oneInput:function(e){
  this.setData({
    oneInput:e.detail.value
  })
},
twoInput(e){
  this.setData({
    twoInput:e.detail.value
  })
},
threeInput(e){
  this.setData({
    threeInput:e.detail.value
  })
},
fourInput(e){
  this.setData({
    fourInput:e.detail.value
  })
},
fiftyInput(e){
  this.setData({
    fiftyInput:e.detail.value
  })
},
sixInput(e){
  this.setData({
    sixInput:e.detail.value
  })
},
sevenInput(e){
  this.setData({
    sevenInput:e.detail.value
  })
},
eightInput(e){
  this.setData({
    eightInput:e.detail.value
  })
},

//显示延迟
oneShow(){
  var that = this ;
  wx.showToast({
    title: '1号设置成功',
    icon:'success',
    duration:1000
  });
  console.log('操作1号')
  that.setData({
    isOneInput:true
  })
},
twoShow(){
  var that = this ;
  wx.showToast({
    title: '2号设置成功',
    icon:'success',
    duration:1000
  })
    console.log('操作2号')
  
    that.setData({
      isTwoInput:true
    })
},
threeShow(){
  var that = this ;
  wx.showToast({
    title: '3号设置成功',
    icon:'success',
    duration:1000
  })
    console.log('操作3号')
  
    that.setData({
      isThreeInput:true
    })
},
fourShow(){
  var that = this ;
  wx.showToast({
    title: '4号设置成功',
    icon:'success',
    duration:1000
  })
    console.log('操作4号')
  
    that.setData({
      isFourInput:true
    })
},
fifftyShow(){
  var that = this ;
  wx.showToast({
    title: '5号设置成功',
    icon:'success',
    duration:1000
  })
    console.log('操作5号')
  
    that.setData({
      isFiftyInput:true
    })
},

sixShow(){
  var that = this ;
  wx.showToast({
    title: '6号设置成功',
    icon:'success',
    duration:1000
  })
    console.log('操作6号')
    that.setData({
      isSixInput:true
    })
},

sevenShow(){
  var that = this ;
  wx.showToast({
    title: '7号设置成功',
    icon:'success',
    duration:1000
  })
    console.log('操作7号')
  
    that.setData({
      isSevenInput:true
    })
},
eightShow(){
  var that = this ;
  wx.showToast({
    title: '8号设置成功',
    icon:'success',
    duration:1000
  })
    console.log('操作8号')
    that.setData({
      isEightInput:true
    })
},

//控制映射的顺序
mappingByOrder(){
  //点击设置后 显示设置成功的内容
  var that =this ;
  var info = {
    elevator_id : 0x0,
    robot_id : 0x0
  }
  var elevatorId = that.data.elevatorId;
  info.elevatorId = elevatorId;
  info.robotId = ROBOTID
  

  if(mappingindex < mappingList.length){
    wx.showToast({
      title: '正在映射...',
      icon:'loading',
      duration:3000
    })
    console.log("配置第" + (mappingindex + 1) + "个继电器")
    this.mappingConfig(info,mappingList[mappingindex].floorNumber,mappingList[mappingindex].relayID,mappingList[mappingindex].needCard)
    that.showRelay(mappingList[mappingindex].relayID);
    mappingindex++
  }else{ 
    that.setData({
      singleFloatInfoReplReplied:true
    })
    clearInterval(timer)
    setTimeout(function(){
      console.log("继电器映射结束")
      wx.showToast({
        title: '继电器映射完成',
        duration:3000
      })
      that.clearAll(); //清除设置的映射数据maplist[]列表
    },1000)
  }
},

//设置延迟展示完成标签
showRelay(relayID){
  var that = this ;
  if(relayID%8==0){
    that.oneShow
  }else if(relayID%8==1){
    that.twoShow
  }else if(relayID%8==2){
   that.threeShow
  }else if(relayID%8==3){
    that.fourShow
  }else if(relayID%8==4){
    that.fifftyShow
  }else if(relayID%8==5){
    that.sixShow
  }else if(relayID%8==6){
    that.sevenShow
  }else if(relayID%8==7){
    that.eightShow;
  }
},

//设置楼层映射
mappingConfig(info,floorNumber,relayID,needCard){
  console.log('设置'+floorNumber+'层映射命令');
  var that = this ;
  that.setData({
    'payloadConfigItem.floorNumber':floorNumber,
    'payloadConfigItem.relayID':relayID,
    'payloadConfigItem.needCard':needCard,
    'payloadConfigItem.data[0]':0xE1,
    'payloadConfigItem.data[1]':(floorNumber + 256) % 256 ,
    'payloadConfigItem.data[2]': relayID % 256,
    'payloadConfigItem.data[3]':needCard % 256,
  })
  var deviceId = wx.getStorageSync('deviceId');
  var serviceId = wx.getStorageSync('serviceId');
  var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId');
  that.setData({
    deviceId:deviceId,
    serviceId:serviceId,
    writeCharacteristicId:writeCharacteristicId,
  })
  utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,that.data.payloadConfigItem); //传一个楼层的映射数据
  
  if(timer){
    clearInterval(timer)
  }
  timer = setInterval(function(){
    if (!that.data.singleFloatInfoReplReplied && app.globalData.reTransmission_count<5){
      app.globalData.reTransmission_count++;
      console.log("未收到楼层设置消息回复，重新发送数据")
      /*
      wx.showToast({
        title: '正在连接...',
        icon:'loading',
        duration:1000
      });
      */
      utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,that.data.payloadConfigItem); //传一个楼层的映射数据
    }
    else if(!that.data.singleFloatInfoReplReplied && app.globalData.reTransmission_count>=5){
      app.globalData.reTransmission_count = 0
      wx.showToast({
        title: '请重试',
        icon:'error',
        duration:2000
      });
    }
  },3000)

},

reTransmission(){

},
//设置继电器映射
sendMappingMsg(){
  console.log('点击继电器映射设置');
  var that = this ;
  mappingindex = 0
  mappingList = []
  that.setData({
    singleFloatInfoReplReplied:false
  })
  var eightInput = that.data.eightInput;
  var sevenInput=that.data.sevenInput;
  var sixInput=that.data.sixInput;
  var fiftyInput=that.data.fiftyInput;
  var fourInput=that.data.fourInput;
  var threeInput=that.data.threeInput;
  var twoInput=that.data.twoInput;
  var oneInput=that.data.oneInput;
  
  

  if((oneInput!=''||oneInput!="")&&!that.data.isOneInput){
    var floorNumber = parseInt(oneInput);
    if(floorNumber<128&&floorNumber>0||floorNumber<0&&floorNumber>-11){
        var relayID = (that.data.rGroupArray[that.data.rIndex].id-1)*8;
        var needCard = that.data.oGroupArray[that.data.oIndex].id ;
        console.log('楼层：'+floorNumber+" "+'映射ID:'+relayID+" "+'刷卡方式：'+needCard);
        var mappingItem = new Object()
        mappingItem.floorNumber = floorNumber
        mappingItem.relayID = relayID
        mappingItem.needCard = needCard
        mappingList.push(mappingItem)
    }
  }

  if((twoInput!=''||twoInput!="")&&!that.data.isTwoInput){
    var floorNumber = parseInt(twoInput);
    if(floorNumber<128&&floorNumber>0||floorNumber<0&&floorNumber>-11){
        var relayID = (that.data.rGroupArray[that.data.rIndex].id-1)*8+1;
        var needCard = that.data.oGroupArray[that.data.oIndex].id ;
        console.log('楼层：'+floorNumber+" "+'映射ID:'+relayID+" "+'刷卡方式：'+needCard);
        var mappingItem = new Object()
        mappingItem.floorNumber = floorNumber
        mappingItem.relayID = relayID
        mappingItem.needCard = needCard
        mappingList.push(mappingItem)
    }
  }

  if((threeInput!=''||threeInput!="")&&!that.data.isThreeInput){
    var floorNumber = parseInt(threeInput);
    if(floorNumber<128&&floorNumber>0||floorNumber<0&&floorNumber>-11){
        var relayID = (that.data.rGroupArray[that.data.rIndex].id-1)*8+2;
        var needCard = that.data.oGroupArray[that.data.oIndex].id ;
        console.log('楼层：'+floorNumber+" "+'映射ID:'+relayID+" "+'刷卡方式：'+needCard);
        var mappingItem = new Object()
        mappingItem.floorNumber = floorNumber
        mappingItem.relayID = relayID
        mappingItem.needCard = needCard
        mappingList.push(mappingItem)
    }
  }
  if((fourInput!=''||fourInput!="")&&!that.data.isFourInput){
    var floorNumber = parseInt(fourInput);
    if(floorNumber<128&&floorNumber>0||floorNumber<0&&floorNumber>-11){
        var relayID = (that.data.rGroupArray[that.data.rIndex].id-1)*8+3;
        var needCard = that.data.oGroupArray[that.data.oIndex].id ;
        console.log('楼层：'+floorNumber+" "+'映射ID:'+relayID+" "+'刷卡方式：'+needCard);
        var mappingItem = new Object()
        mappingItem.floorNumber = floorNumber
        mappingItem.relayID = relayID
        mappingItem.needCard = needCard
        mappingList.push(mappingItem)
    }
  }

  if((fiftyInput!=''||fiftyInput!="")&&!that.data.isFiftyInput){
    var floorNumber = parseInt(fiftyInput);
    if(floorNumber<128&&floorNumber>0||floorNumber<0&&floorNumber>-11){
        var relayID = (that.data.rGroupArray[that.data.rIndex].id-1)*8+4;
        var needCard = that.data.oGroupArray[that.data.oIndex].id ;
        console.log('楼层：'+floorNumber+" "+'映射ID:'+relayID+" "+'刷卡方式：'+needCard);
        var mappingItem = new Object()
        mappingItem.floorNumber = floorNumber
        mappingItem.relayID = relayID
        mappingItem.needCard = needCard
        mappingList.push(mappingItem)
    }
  }

  if((sixInput!=''||sixInput!="")&&!that.data.isSixInput){
    var floorNumber = parseInt(sixInput);
    if(floorNumber<128&&floorNumber>0||floorNumber<0&&floorNumber>-11){
        var relayID = (that.data.rGroupArray[that.data.rIndex].id-1)*8+5;
        var needCard = that.data.oGroupArray[that.data.oIndex].id ;
        console.log('楼层：'+floorNumber+" "+'映射ID:'+relayID+" "+'刷卡方式：'+needCard);
        var mappingItem = new Object()
        mappingItem.floorNumber = floorNumber
        mappingItem.relayID = relayID
        mappingItem.needCard = needCard
        mappingList.push(mappingItem)
    }
  }

  if((sevenInput!=''||sevenInput!="")&&!that.data.isSevenInput){
    var floorNumber = parseInt(sevenInput);
    if(floorNumber<128&&floorNumber>0||floorNumber<0&&floorNumber>-11){
        var relayID = (that.data.rGroupArray[that.data.rIndex].id-1)*8+6;
        var needCard = that.data.oGroupArray[that.data.oIndex].id ;
        console.log('楼层：'+floorNumber+" "+'映射ID:'+relayID+" "+'刷卡方式：'+needCard);
        var mappingItem = new Object()
        mappingItem.floorNumber = floorNumber
        mappingItem.relayID = relayID
        mappingItem.needCard = needCard
        mappingList.push(mappingItem)
    }
  }


  if((eightInput!=''||eightInput!="")&&!that.data.isEightInput){
    var floorNumber = parseInt(eightInput);
    if(floorNumber<128&&floorNumber>0||floorNumber<0&&floorNumber>-11){
        var relayID = (that.data.rGroupArray[that.data.rIndex].id-1)*8+7;
        var needCard = that.data.oGroupArray[that.data.oIndex].id ;
        console.log('楼层：'+floorNumber+" "+'映射ID:'+relayID+" "+'刷卡方式：'+needCard);
        var mappingItem = new Object()
        mappingItem.floorNumber = floorNumber
        mappingItem.relayID = relayID
        mappingItem.needCard = needCard
        mappingList.push(mappingItem)
    }
  }
  console.log("要映射的数据")
  console.log(mappingList)
  if(that.data.isOneInput&&that.data.isTwoInput&&that.data.isThreeInput&&that.data.isFourInput&&that.data.isFiftyInput&&that.data.isSixInput&&that.data.isSevenInput&&that.data.isEightInput){
    app.showModal('设置已全部映射');
  }

  if(that.data.oneInput==''&&that.data.twoInput==''&&that.data.threeInput==''&&that.data.fourInput==''&&that.data.fiftyInput==''&&that.data.sixInput==''&&that.data.sevenInput==''&&that.data.eightInput==''){
    app.showModal('设置输入为空');
  }
  that.mappingByOrder()

},

clearAll(){
  mappingindex = 0;
  mappingList = [];
},


  onUnload(){
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];
    prevPage.setData({
      mapConfigDisable: true 
    })
  }
})

