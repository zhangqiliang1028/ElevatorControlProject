const Decoder = require("Decoder.js");
var isSetElevatorID = false; //是否获取到电梯ID
var ElevatorID = '' //电梯ID初始化
function getIsSetElevatorID(){  //返回是否获取到了电梯ID
  return isSetElevatorID
}
function getElevatorID(){ //返回电梯ID
  return ElevatorID
}
// 字符串转byte
const CRC_HEAD = 18
const ElevatorState = {
  NOT_IN_USE : 0xD0, //未使用，空闲状态
  STAGE1 : 0xD1, //正在前往机器人呼叫楼层
  STAGE2 : 0xD2, //到达呼叫楼层且门已经打开
  STAGE3 : 0xD3, //正在前往机器人目的楼层
  STAGE4 : 0xD4, //到达目的楼层且门已经关闭
  FINISHED : 0xD5, //电梯完成任务
  BUSYORBREAKDOWN : 0xDF, // 忙或者故障
  GETALL_INFO : 0xEA, //查询所有参数
}

const FloorSetting = {
  CLEAN_ALL_FLOORS : 0xE0, //清理所有的楼层信息
  SET_ONE_FLOOR : 0xE1, //设置某一个楼层的信息
  RESET_ACK : 0xF0, //重置命令的ack
  SET_ONE_ACK : 0xF1, //设置某一楼层的ack
  SET_ROBOT : 0xE3, //设置机器人ID
  SET_TIMEDATE : 0xE6, //设置时间
  SET_TOLE : 0xE8, //设置容差
  TEST_SWITCH : 0xE5, //测试继电器
  REBOOT_ACK : 0xEC,	//重启命令；
}


const RobotCmd = {
  ROBOT_QUERY : 0xA0,
  ROBOT_REQUEST : 0xA1,
  ROBOT_PUSHBTN : 0xA2,
  ROBOT_OPENDOOR : 0xA3,
  ROBOT_CLOSEDOOR : 0xA4,
  ROBOT_RELEASE : 0xA5,
  ROBOT_CANCEL : 0xAF
}

var recvData = ""
var flagRemain = false

//存储是否重置成功
var isReBoot = false

function stringToBytes(str) {
  var strArray = new Uint8Array(str.length/2);
  var arr = str.split('');
  var j = 0 ;
  var index = 0;
  while(j<str.length){
    strArray[index] =parseInt(arr[j]+arr[j+1],16);
    index++;
    j+=2;
  }
  for(var i=0;i<strArray.length;i++){
    console.log(strArray[i]);
  }
  
  const array = new Uint8Array(strArray.length)
  strArray.forEach((item, index) => array[index] = item)
  return array.buffer;
}

// ArrayBuffer转16进制字符串示例
function ab2hext(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

//16进制转字符串
function hexToString(str) {
  var trimedStr = str.trim();
  var rawStr =
    trimedStr.substr(0, 2).toLowerCase() === "0x" ?
      trimedStr.substr(2) :
      trimedStr;
  var len = rawStr.length;
  if (len % 2 !== 0) {
    // alert("Illegal Format ASCII Code!");
    return "";
  }
  var curCharCode;
  var resultStr = [];
  for (var i = 0; i < len; i = i + 2) {
    curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
    resultStr.push(String.fromCharCode(curCharCode));
  }
  return resultStr.join("");
}

//计算数据的CRC
function computeRobotMessageCRC(chunk){
  if(chunk.length < 20){
    console.log("头部消息长度错误")
    return
  }
  let payloadLength = chunk[16] + chunk[17] * 256
  console.log("Payload Length : " + payloadLength.toString())
  if(chunk.length < 20 + payloadLength){
    console.log("消息负载长度错误")
    return;
  }
  let sum_CRC = 0
  for(var i = 0;i < CRC_HEAD;++i){
    sum_CRC += chunk[i]
  }
  chunk[CRC_HEAD] = sum_CRC & 0xff
  sum_CRC = 0
  
  for(var i = 20;i < 20 + payloadLength;++i){
    sum_CRC += chunk[i]
  }
  console.log("Sum _CRC : " + sum_CRC.toString())
  chunk[19] = sum_CRC & 0xff;
}
//计算头部的CRC
function computeMsgHeadCRC(chunk){
  if(chunk.length < 20){
    console.log("头部消息长度错误")
    return
  }
  let sum_CRC = 0
  for(var i = 0;i < CRC_HEAD;++i){
    sum_CRC += chunk[i]
  }
  return sum_CRC & 0xff
}
//计算payload的CRC
function computePayloadCRC(chunk,payloadLength){
  let sum_CRC = 0
  for(var i = 0;i < payloadLength;++i){
    sum_CRC += chunk[i]
  }
  return sum_CRC & 0xff
}
//产生发送的消息
function productMessage(info,payload){
  //其中info 中包含梯控ID和机器人ID
  var that = this ;
  let res = [
    0x1E,
    0x1F,
    0x00,
    0x00,
    0x00,
    0x01,
    0x01,
    0xBF,
    0x05,
    0x00,
    0x12,
    0x05,
    0x51,
    0x00,
    0x20,
    0x51,
    0x04,
    0x00,
    0x78,
    0xE6
  ]
  //cmdID
  res[7] = 0xBF
  //Elevator_ID
  console.log(info.elevatorId )

  res[11] = (info.elevatorId / (256 * 256 * 256)) & 0xff
  console.log(info.elevatorId / (256 * 256 * 256))
  res[10] = (info.elevatorId / (256 * 256)) & 0xff
  console.log(info.elevatorId / (256 * 256))
  res[9] = (info.elevatorId / 256) & 0xff
  res[8] = info.elevatorId % 256
  //Robot_ID 12 - 15
  res[15] = (info.robotId / (256 * 256 * 256)) & 0xff
  res[14] = (info.robotId / (256 * 256)) & 0xff
  res[13] = (info.robotId / 256) & 0xff
  res[12] = info.robotId % 256 
  //payloadLength
  res[17] = (payload.payloadLength / 256) & 0xff
  res[16] = payload.payloadLength % 256
  
  let allData = res.concat(payload.data)
  console.log("消息长度 " + allData.length)
  if(allData.length != 20 + payload.payloadLength){
    console.log("消息负载错误")
    return null;
  }
  that.computeRobotMessageCRC(allData)
  console.log("发送查询源数据包")
  console.log(allData.toString(16))
  return allData
}

//获取蓝牙设备某个服务中的所有 characteristic（特征值）
function getBLEDeviceCharacteristics(serviceId,deviceId){
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
}


 //启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。
//注意：必须设备的特征值支持notify或者indicate才可以成功调用，具体参照 characteristic 的 properties 属性
function notifyBLECharacteristicValueChange(deviceId,serviceId,notifyCharacteristicId){
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
          title: '当前蓝牙已断开，请关闭后再尝试',
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
}

 //监听低功耗蓝牙设备的特征值变化。必须先启用notify接口才能接收到设备推送的notification。
 function onBLECharacteristicValueChange(){
   var that = this;
  wx.onBLECharacteristicValueChange(function (res) { //接收蓝牙的返回信息
    var resValue = that.ab2hext(res.value); //16进制字符串
    var strprint = Decoder.GBKHexstrToString(resValue)
    console.log(strprint)
    if(!isSetElevatorID){
      setElevatorID(strprint);
    }
    that.saveDataToCloud(strprint);
    var resValueStr = that.hexToString(resValue);
    var msg = analysis(resValueStr)
    if(msg == undefined){
      console.log("非回复消息") //不用管
      return
    }

    if(msg.length >= 20){
      onReceivedMsg(msg);
    }
    
  });

}

//在这里将消息中有用的部分提取出来
function analysis(valueStr){
  var start,mend
  for(var i = 0 ;i < valueStr.length - 2; ++i){
    
      if(valueStr[i] == '@' && valueStr[i + 1] == '@' && valueStr[i + 2] == '@' ){
        i = i + 5
        start = i
        console.log("找到数据包开头")
        recvData = ""
        //找源数据包的结束标志
        while(valueStr[i] != '#' && i <valueStr.length - 2){
            ++i
        }
        //如果找到结尾都没有找到，说明源数据包分包发了，剩下的数据在下一个数据包中
        if(i == valueStr.length - 2){
          mend = valueStr.length
          flagRemain = true
          recvData = valueStr.substr(start,mend - start + 1)
          console.log("还未找到尾部，等待尾部")
        }else{
          //找到了尾部，和头部在同一个数据包中，直接将源数据返回
          mend = i - 3
          flagRemain = false
          console.log("找到尾部")
          console.log(valueStr.substr(start,mend - start + 1))
          return valueStr.substr(start,mend - start + 1)
        }
      }else if(flagRemain){
        //flagRemian说明这个数据包中还有一部分源数据
        start = 0
        //找源数据的结束标志
        while(valueStr[i] != '#' && i < valueStr.length - 2){
          ++i
        }
        if(i == valueStr.length){
          //依旧没有找到尾部，在下一个数据包中继续找
          console.log("未找到#，找到字符串末尾")
          mend = i
        }else{
          //找到数据包结尾，将falgRemian置为false，表示数据包已经全部找到
          mend = i - 3
          flagRemain = false
          console.log("找到尾部")
        }
        console.log("准备拼接数据")
        //将上一个数据包中的源数据和该数据包中的源数据进行拼接
        recvData += valueStr.substr(start,mend - start + 1)
        return recvData
      }
  }
  
}
//在这里对头部消息进行解析提取电梯ID
function setElevatorID(msg){
  
  console.log("开始解析头部信息")
  if(msg != undefined){
    var strs= new Array(); //定义一数组
    strs=msg.split(" "); //字符分割
    var result = '';
    for(let i=0;i<strs.length;i++){
      if(strs[i] == '1f' && strs[i-1].substring(strs[i-1].length-2,strs[i-1].length)  == '1e'){
        for(let j=10;j>=7;j--){
          if(strs[i+j].length==1){
            result = result + '0'
          }
          result = result.concat(strs[i+j]);
        }
        isSetElevatorID = true; 
        ElevatorID = result;
        console.log(ElevatorID);

      }
    }
  }

}

//在这里对消息进行解析
function onReceivedMsg(msg){
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
    if(computeMsgHeadCRC(msgHead) != msgHead[18]){
      console.log(computeMsgHeadCRC(msgHead))
      console.log(msgHead[18])
      console.log("头部CRC错误")
    }else{
      //构建payload
      var payload = new Uint8Array(payloadLength)
      for(var i = 0;i < payloadLength;++i){
        payload[i] = parseInt(msg.substr(40 + i*2 , 2),16)
      }

      if(computePayloadCRC(payload,payloadLength) != msgHead[19]){
        console.log("负载CRC校验错误")
      }else{
        callBackGetAllInfo(payload)
        var result = payload[2] * 256 + payload[3]
        switch(payload[0]){
          case FloorSetting.SET_TIMEDATE:{
            if(result){
              console.log("时间设置成功")
              wx.showToast({
                title: '时间设置成功',
                icon:'success',
                duration : 1000
              })
            }else{
              console.log("时间设置失败")
              wx.showToast({
                title: '时间设置失败',
                duration : 1000
              })
            }
            break
          }
          case FloorSetting.TEST_SWITCH:{
            if(payload[1]){
              console.log("继电器测试成功")
              wx.showToast({
                title: '继电器测试成功',
                duration : 1000
              })
            }else{
              console.log("继电器测试失败")
              wx.showToast({
                title: '继电器测试失败',
                duration : 1000
              })
            }
            break
          }
        
          case FloorSetting.CLEAN_ALL_FLOORS : {
            //重置轿厢板
            if(payload[2]){
              console.log("重置轿厢板参数成功")
              wx.showToast({
                title: '重置轿厢板参数成功',
                duration : 1000
              })
            }else {
              console.log("重置轿厢板参数失败")
              wx.showToast({
                title: '重置轿厢板参数失败',
                duration : 1000
              })
            }
            break
          }
          case FloorSetting.SET_TOLE : {
            //设置容差参数
            if(payload[0]){
              console.log("设置容差参数成功")
              wx.showToast({
                title: '设置容成功',
                duration : 1000
              })
            }else {
              console.log("设置容差参数失败")
              wx.showToast({
                title: '设置失败',
                duration : 1000
              })
            }
            break
          }
          case FloorSetting.CLEAN_ALL_FLOORS : {
            if(payload[1]){
              console.log("重置楼层成功")
              wx.showToast({
                title: '重置楼层成功',
                duration : 1000
              })
            }else{
              console.log("重置楼层失败")
              wx.showToast({
                title: '重置楼层失败',
                duration : 1000
              })
            }
            break
          }case FloorSetting.SET_ROBOT : {
            if(payload[2]){
              console.log("机器人" + payload[1] + "设置成功")
              wx.showToast({
                title: "机器人" + payload[1] + "设置成功",
                duration : 1000
              })
            }else{
              console.log("机器人" + payload[1] + "设置失败")
              wx.showToast({
                title: "机器人" + payload[1] + "设置失败",
                duration : 1000
              })
            }
            break
          }
          case ElevatorState.NOT_IN_USE : {
            if(payload[1]){
              console.log("梯控状态为空闲，申请电梯成功")
              wx.showToast({
                title: '梯控状态为空闲，申请电梯成功',
                duration : 1000
              })
            }else{
              console.log("申请电梯失败")
              wx.showToast({
                title: '申请电梯失败',
                duration : 1000
              })
            }
            break
          }
          case ElevatorState.STAGE1 : {
            if(payload[1]){
              console.log("梯控正在前往呼叫楼层")
              wx.showToast({
                title: '梯控正在前往呼叫楼层',
                duration : 1000
              })
            }else{
              console.log("收到回复 " + ElevatorState.STAGE1 + " ERROR")
              wx.showToast({
                title: "收到回复 " + ElevatorState.STAGE1 + " ERROR",
                duration : 1000
              })
            }
            break
          }
          case ElevatorState.STAGE2 : {
            if(payload[1]){
              console.log("梯控已经到达并保持开门")
              wx.showToast({
                title: '梯控已经到达并保持开门',
                duration : 1000
              })
            }else{
              console.log("收到回复 " + ElevatorState.STAGE2 + " ERROR")
              wx.showToast({
                title: "收到回复 " + ElevatorState.STAGE1 + " ERROR",
                duration : 1000
              })
            }
            break
          }
          case ElevatorState.STAGE3 : {
            if(payload[1]){
              console.log("梯控开始前往目标楼层")
              wx.showToast({
                title: '梯控开始前往目标楼层',
                duration : 1000
              })
            }else{
              console.log("收到回复 " + ElevatorState.STAGE3 + " ERROR")
              wx.showToast({
                title: "收到回复 " + ElevatorState.STAGE1 + " ERROR",
                duration : 1000
              })
            }
            break
          }
          case ElevatorState.STAGE4 : {
            if(payload[1]){
              console.log("梯控已经到达目标楼层且门已经关闭")
              wx.showToast({
                title: '梯控已经到达目标楼层且门已经关闭',
                duration : 1000
              })
            }else{
              console.log("收到回复 " + ElevatorState.STAGE4 + " ERROR")
              wx.showToast({
                title: "收到回复 " + ElevatorState.STAGE1 + " ERROR",
                duration : 1000
              })
            }
            break
          }
          case ElevatorState.BUSYORBREAKDOWN : {
            if(payload[1]){
              console.log("梯控忙或者发生故障")
              wx.showToast({
                title: '梯控忙或者发生故障',
                duration : 1000
              })
            }else{
              console.log("收到回复 " + ElevatorState.BUSYORBREAKDOWN + " ERROR")
              wx.showToast({
                title: "收到回复 " + ElevatorState.STAGE1 + " ERROR",
                duration : 1000
              })
            }
            break
          }
          case ElevatorState.GETALL_INFO : {
            console.log("接收到所有的信息")
            callBackGetAllInfo(payload)
            break
          }
        }
      }
    }
  }
}

//对查询到的梯控所有信息进行解析
function callBackGetAllInfo(payload){
  console.log("接受到所有的信息")
  console.log(payload)
  if(payload.length < 2){
    console.log("payload接受失败")
    return
  }else{
    //如果type为2表示查询的是楼层，否则为查询的所有楼层信息
    if(payload[2] == 2){
      console.log("收到查询楼层信息" + payload[3])
      let receFloorNumber = payload[3] % 256
      let receState = payload[4]
      console.log("收到的楼层 ： " + receFloorNumber)
      let pages = getCurrentPages()
      if(pages[pages.length - 1].setQueryFloorNumber(receFloorNumber,receState) != undefined){
        pages[pages.length - 1].setQueryFloorNumber(receFloorNumber,receState)
      }
      return
    }
  }
  
  if(payload.length < 70){
    console.log("未接受到所有的信息")
    return
  }

  var mainVer =  payload[3]
  var subVer = payload[4]
  var stageVer = payload[5]
  //6,7是reserved
  var loraH = payload[8]
  var loraL = payload[9]
  var loraC = payload[10]
  var elevatorStatus = payload[11]
  var elevatorID = payload[15] * 256 * 256 * 256 +payload[14] * 256 * 256 + payload[13] * 256 + payload[12]
  var checkCount = payload[19] * 256 + payload[18]
  var toleDistance = payload[21] * 256 + payload[20]
  var checkFlatTime = payload[23] * 256 + payload[22]
  //解析四个机器人ID
  var robot1 = payload[27] * 256 * 256 * 256 +payload[26] * 256 * 256 + payload[25] * 256 + payload[24]
  var robot1loraL = payload[28]
  var robot1loraH = payload[29]
  var robot1loraC = payload[30]

  var robot2 = payload[35] * 256 * 256 * 256 +payload[34] * 256 * 256 + payload[33] * 256 + payload[32]
  var robot2loraL = payload[36]
  var robot2loraH = payload[37]
  var robot2loraC = payload[38]

  var robot3 = payload[43] * 256 * 256 * 256 +payload[42] * 256 * 256 + payload[41] * 256 + payload[40]
  var robot3loraL = payload[44]
  var robot3loraH = payload[45]
  var robot3loraC = payload[46]

  var robot4 = payload[51] * 256 * 256 * 256 +payload[50] * 256 * 256 + payload[49] * 256 + payload[48]
  var robot4loraL = payload[52]
  var robot4loraH = payload[53]
  var robot4loraC = payload[54]

  var btnRepush = payload[57] * 256 + payload[56]
  var btnDown = payload[59] * 256 + payload[58]
  var tellRobot = payload[61] * 256 + payload[60]
  var doorOpen = payload[63] * 256 + payload[62]
  var report2Cloud = payload[65] * 256 + payload[64]
  var disUpdate = payload[67] * 256 + payload[66]
  var waiting = payload[69] * 256 + payload[68]
  var keepAlive = payload[71] * 256 + payload[70]

  console.log("**********************************************************************")
  console.log("查询到如下信息: ")
  console.log("Version :" + mainVer.toString())
  console.log("subVer :" + subVer.toString())
  console.log("stageVer :" + stageVer.toString())
  console.log("* AddrL : " + loraL.toString(16))
  console.log("* AddrH : " + loraH.toString(16))
  console.log("* AddrC : " + loraC.toString(16))
  console.log("* ElevatorID : " + elevatorID.toString(16))
  console.log("电梯状态：elevatorStatus：" + elevatorStatus )
  console.log("梯控下面的四个机器人  : ")
  console.log("Robot1 : " + robot1.toString(16) + " 低地址 ：" + robot1loraL.toString(16)  + " 高地址 ：" + robot1loraH.toString(16) + " 信道 ：" + robot1loraC.toString(16))
  console.log("Robot2 : " + robot2.toString(16) + " 低地址 ：" + robot2loraL.toString(16)  + " 高地址 ：" + robot2loraH.toString(16) + " 信道 ：" + robot2loraC.toString(16))
  console.log("Robot3 : " + robot3.toString(16) + " 低地址 ：" + robot3loraL.toString(16)  + " 高地址 ：" + robot3loraH.toString(16) + " 信道 ：" + robot3loraC.toString(16))
  console.log("Robot4 : " + robot4.toString(16) + " 低地址 ：" + robot4loraL.toString(16)  + " 高地址 ：" + robot4loraH.toString(16) + " 信道 ：" + robot4loraC.toString(16))
  console.log("时间参数：")
  console.log("btnRepush : " + btnRepush.toString(16) + "btnDown : " + btnDown.toString(16))
  console.log("tellRobot : " + tellRobot.toString(16) + "doorOpen : " + doorOpen.toString(16))
  console.log("report2Cloud : " + report2Cloud.toString(16) + "disUpdate : " + disUpdate.toString(16))
  console.log("waiting : " + waiting.toString(16) + "keepAlive : " + keepAlive.toString(16))
  console.log("平层参数：")
  console.log("checkCount : " + checkCount.toString(16))
  console.log("toleDistance : " + toleDistance.toString(16))
  console.log("checkFlatTime : " + checkFlatTime.toString(16))
  console.log("**********************************************************************")

    //验证输入的电梯ID是否正确
  var elevatorId = wx.getStorageSync('elevatorId')
  console.log('当前输入电梯ID：'+elevatorId.toString(16));
  var isLink = false ;
  if(elevatorId.toString(16)===elevatorID.toString(16)||elevatorID===elevatorId){
      console.log('查询到该电梯')
      isLink = true;
      wx.setStorageSync('elevatorId', elevatorId)
  }
  wx.setStorageSync('isLink', isLink)
}

//向低功耗蓝牙设备特征值中写入二进制数据。
//注意：必须设备的特征值支持write才可以成功调用，具体参照 characteristic 的 properties 属性
function writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,payloadTestSwitch){
  var that = this ;
  var res = 1
  //产生传输数据
  var myData = this.productMessage(info,payloadTestSwitch);
  this.computeRobotMessageCRC(myData);
  var buffer = new ArrayBuffer(myData.length);
  var dataView = new DataView(buffer);
  for(var i = 0;i < myData.length;++i){
    dataView.setUint8(i,myData[i])
  }
  let pos = 0;
  let bytes = buffer.byteLength;
  var i = 1
  while(bytes > 0) {
    console.log("正在进行第" + i++ +"次写入")
    let tmpBuffer;
    if(bytes > 20) {
      tmpBuffer = buffer.slice(pos, pos + 20);
      pos += 20;
      bytes -= 20;
    } else {
      tmpBuffer = buffer.slice(pos, pos + bytes);
      pos += bytes;
      bytes -= bytes;
    }
    
    wx.writeBLECharacteristicValue({   //发送信息
      deviceId: deviceId,
      serviceId: serviceId,
      characteristicId: writeCharacteristicId,
    // 这里的value是ArrayBuffer类型
      value: tmpBuffer,
      success: function (res) {
        reTransmission_count = 0
        isSuccess = true
        var log = "写入成功：" + res.errMsg + "\n";
        console.log(log);
      },

      fail: function (res) {
        var log ="写入失败" + res.errMsg+"\n";
        console.log(log);
        if(res.errCode===10006){
          wx.showToast({
            title: '当前连接已断开',
            icon:'none',
            duration:2000
          })
        }else if(res.errCode===10008){
          var pages = getCurrentPages() //获取加载的页面
          var currentPage = pages[pages.length-1] //获取当前页面的对象
          var url = currentPage.route //当前页面url 
         if(url != 'pages/map/map'){
          wx.showModal({
            cancelColor: 'blue',
            title:'温馨提示',
            content:'操作失败，请重试',
            success (res) {
              if (res.confirm) {
                console.log('用户点击确定')
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          }) 
         }

        }else{
          wx.showToast({
            title: '数据写入失败', 
            icon:'none',
            duration:2000
          })
        }
      },
    })

  }
}

//缓存消息数据到云端
function saveDataToCloud(data){
  const  db = wx.cloud.database();
  //获取当前时间
  var date = new Date();
  var currentDate = date.getHours()+"时"+date.getMinutes()+"分"+date.getSeconds()+"秒";
  console.log(currentDate);
  db.collection('logs').add({
    // data 字段表示需新增的 JSON 数据
    data: {
      description: "日志",
      date:currentDate,
      data: data,
    },

    success: function(res) {
      console.log('存储日志成功')
    }
  })
}

//清除日志数据
function clearDataFormCloud(){
  wx.request({
    url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=	wx108345217f87e16e&secret=1928c57419d6eea623391691e9dd46c1', //获取用户凭证
    success(res){
      //删除集合
      
      wx.request({
        url: 'https://api.weixin.qq.com/tcb/databasecollectiondelete?access_token='+res.data.access_token, //仅为示例，并非真实的接口地址
        data: {
          env: 'test-5gbxczf0565156d5',
          collection_name: 'logs'
        },
        method:'POST',
        header: {
          'content-type': 'application/json' // 默认值
        },
        success (e) {
            console.log(e.data)
            //创建集合
            wx.request({
              url: 'https://api.weixin.qq.com/tcb/databasecollectionadd?access_token='+res.data.access_token, //仅为示例，并非真实的接口地址
              data: {
                env: 'test-5gbxczf0565156d5',
                collection_name: 'logs'
              },
              method:'POST',
              header: {
                'content-type': 'application/json' // 默认值
              },
              success (res) {
                console.log(res.data)
              }
            })
        }
      })
    }
  })
}

module.exports = {
  stringToBytes: stringToBytes,
  ab2hext: ab2hext,
  hexToString: hexToString,
  analysis:analysis,
  computeMsgHeadCRC:computeMsgHeadCRC,
  computePayloadCRC:computePayloadCRC,
  computeRobotMessageCRC:computeRobotMessageCRC,
  getBLEDeviceCharacteristics:getBLEDeviceCharacteristics,
  writeBLECharacteristicValue:writeBLECharacteristicValue,
  onBLECharacteristicValueChange:onBLECharacteristicValueChange,
  notifyBLECharacteristicValueChange:notifyBLECharacteristicValueChange,
  productMessage:productMessage,
  saveDataToCloud:saveDataToCloud,
  clearDataFormCloud:clearDataFormCloud,
  getElevatorID:getElevatorID,
  getIsSetElevatorID:getIsSetElevatorID
}
