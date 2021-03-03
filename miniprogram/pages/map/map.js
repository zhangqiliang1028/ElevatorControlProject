
const { saveDataToCloud } = require("../../utils/util.js");
const utils = require("../../utils/util.js");

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
    eightInput:'',
    sevenInput:'',
    sixInput:'',
    fiftyInput:'',
    fourInput:'',
    threeInput:'',
    twoInput:'',
    oneInput:'',
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
    console.log('操作7号')
  
    that.setData({
      isEightInput:true
    })
},

//控制映射的顺序
mappingByOrder(){
  //点击设置后 显示设置成功的内容
  var that =this ;
  var time = 0; //延迟展示完成标签
  var info = {
    elevator_id : 0x0,
    robot_id : 0x0
  }
  var elevatorId = that.data.elevatorId;
  info.elevatorId = elevatorId;
  info.robotId = ROBOTID
  
  if(mappingindex < mappingList.length){
    console.log("配置第" + (mappingindex + 1) + "个继电器")
    this.mappingConfig(info,mappingList[mappingindex].floorNumber,mappingList[mappingindex].relayID,mappingList[mappingindex].needCard)
    that.showRelay(mappingList[mappingindex].relayID);
    mappingindex++
  }else{
    console.log("继电器映射结束")
    mappingindex = 0
  }
},

//设置延迟展示完成标签
showRelay(relayID){
  var that = this ;
  if(relayID%8==0){
    setTimeout(that.oneShow,2000);
  }else if(relayID%8==1){
    setTimeout(that.twoShow,2000);
  }else if(relayID%8==2){
    setTimeout(that.threeShow,2000);
  }else if(relayID%8==3){
    setTimeout(that.fourShow,2000);
  }else if(relayID%8==4){
    setTimeout(that.fifftyShow,2000);
  }else if(relayID%8==5){
    setTimeout(that.sixShow,2000);
  }else if(relayID%8==6){
    setTimeout(that.sevenShow,2000);
  }else if(relayID%8==7){
    setTimeout(that.eightShow,2000);
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
    utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,that.data.payloadConfigItem);
},

//设置继电器映射
sendMappingMsg(){
    console.log('点击继电器映射设置');
    var that = this ;
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
    setTimeout(that.clearAll,3000);
  },

  clearAll(){
    var that = this ;
    mappingindex = 0;
    mappingList = [];
    that.setData({
      oneInput:'',
      twoInput:'',
      threeInput:'',
      fourInput:'',
      fiftyInput:'',
      sixInput:'',
      sevenInput:'',
      eightInput:''
    })
  },
  onUnload(){
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];
    prevPage.setData({
      mapConfigDisable: true 
    })
  }

})

