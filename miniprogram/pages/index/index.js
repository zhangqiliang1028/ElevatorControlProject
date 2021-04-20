const app = getApp()
const utils = require("../../utils/util.js");

const ROBOTID = 0x11111111

Page({
  data: {
    //登录
    isLogin:true,
    isLink:false,
    winWidth: 0,
    winHeight: 0,
    deviceName:'',
    list: [],
    showDialog: false,
    //设置点击后的颜色
    isTouchTab:false,
    isApplyTap:false,
    //点击连接设置变量
    isLinkdeviceName:'',
    isLinkdeviceId:'',

    //设置电梯ID
    elevatorId:'',

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
    //机器人模拟运行指令的发送
    payloadRobotMsg:{
      data : [
        //cmdID
        0x00,
        //floorNumber
        0x01,
        //ack
        0x00,
        //内存对齐
        0x00
      ],
      floorNumber : 0x00,
      cmdID : 0x00,
      payloadLength : 4
    },
    //用户信息
    userInfo:{
      account:'',
      password:''
    },
    //设置防止多次点击问题
    //蓝牙列表页面
    linkDisable:true,

    //主页面
    mapConfigDisable:true,
    calibrationDisable:true,

    storeyTestDisable:true,
    rebootDisable:true,
    timeConfigDisable:true,
    errorConfigDisable:true,
    touchDisable:true,
    printfDisable:true,
  },


  //登录所需
  //获取账号
  getAccount(e){
    this.setData({
      'userInfo.account':e.detail.value
    })
  },

//获取密码
  getPassword(e){
    this.setData({
      'userInfo.password':e.detail.value
    })
  },


  //登录
  login(){
    //清除云端日志记录
    console.log('清除日志数据');
    var that = this ;
    var userInfo = that.data.userInfo; 
    if(userInfo.account===''){
      wx.showToast({
        title: '账号输入为空',
        icon:'none',
        duration:2000
      })
    }else if(userInfo.account.length>18){
      wx.showToast({
        title: '账号输入非法',
        icon:'none',
        duration:2000
      })
    }else{
      if(userInfo.password===''){
        wx.showToast({
          title: '密码输入为空',
          icon:'none',
          duration:2000
        })
      }else if(userInfo.password.length>18){
        wx.showToast({
          title: '密码输入非法',
          icon:'none',
          duration:2000
        })
      }else{
        wx.showToast({
          title: '正在登陆...',
          icon:'loading',
          duration:2000
        })
        //数据库操作
          const  db = wx.cloud.database();
          db.collection('user').get().then(res => {
            console.log(res.data)
            for(let i=0;i<res.data.length;i++){
              var t = res.data[i].userInfo ; 
              if(t.account===userInfo.account&&t.password===userInfo.password){
                  wx.showToast({
                    title: '登录成功',
                    icon:'success',
                    duration:3000
                  });
                  
                that.setData({
                  isLogin:!that.data.isLogin
                })

                  that.scanBlueTooth();
                  var  deviceId =wx.getStorageSync('deviceId');
                  var serviceId = wx.getStorageSync('serviceId');
                  if(deviceId!=''||serviceId!=''){
                      console.log('开始监听蓝牙通信');
                      utils.getBLEDeviceCharacteristics(serviceId,deviceId);
                  }
                 return ;
                }
            };
            wx.showToast({
              title: '账号或密码错误！',
              icon:'none',
              duration:2000
            })
      
        })
        }
      }
  },

  //注册
  registered(){
    wx.navigateTo({
      url: '../registered/registered',
    })
  },

  //微信授权登录
  wechatLogin(){
    var that = this ;
    //清除云端日志记录
    console.log('微信授权登录');
        // 查看是否授权
        wx.getSetting({
          success: function (res) {
            console.log(res);
            if (res.authSetting['scope.userInfo']) {
              wx.getUserInfo({
                success: function (res) {
                  var user = res.userInfo;
                  console.log(user);
                  wx.login({
                    success: res => {
                      console.log(res);
                      wx.request({
                        url: 'https://api.weixin.qq.com/sns/jscode2session?appid=wxb67b23a24ceb75e5&secret=2a91184c0f0a97a4afa5fa8548843189&js_code=' + res.code + '&grant_type=authorization_code',
                        success: res => {
                          // 获取到用户的 openid
                          wx.showToast({
                            title: '登录成功',
                            icon:'success',
                            duration:2000
                          })

                          that.setData({
                            isLogin:!that.data.isLogin,
                          })
                            that.scanBlueTooth();
                            var  deviceId =wx.getStorageSync('deviceId');
                            var serviceId = wx.getStorageSync('serviceId');
                            if(deviceId!=''||serviceId!=''){
                                console.log('开始监听蓝牙通信');
                                utils.getBLEDeviceCharacteristics(serviceId,deviceId);
                            }
                          return ;
                        }
                      });
                    }
                  });
                }
              });
            } else {
              // 用户没有授权
              // 改变 isHide 的值，显示授权页面
              console.log('登录失败');
             return;
            }
          }
        });   
      
  },

  //其他界面函数
  //弹出窗口设置
  toggleDialog() {
    this.setData({
      showDialog: !this.data.showDialog
  })},

  onReady: function() {
    var that = this;
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }
    });
  },

  //进入页面就加载数据
  onLoad: function () {
    //清除云端日志记录
    console.log('清除云端日志记录')
    //utils.clearDataFormCloud();
    //清除缓存
    wx.clearStorage();
  },

    //搜索蓝牙设备
    scanBlueTooth: function () {

      var that = this;
      //1.打开蓝牙适配器
      wx.openBluetoothAdapter({
        success: function (res) {
          // success
          console.log("-----适配器打开成功-----");
          console.log(res);
          //2.开始搜索蓝牙设备：会费电，请注意关闭
          wx.startBluetoothDevicesDiscovery({
            services: [],
            success: function (res) {
              console.log("-----开始蓝牙设备搜索：----------");
                    //开始搜索蓝牙设备
              setTimeout(function(){
                wx.showToast({
                  title: '正在搜索中....',
                  icon:'loading',
                  duration:3000
                  })
              },2000);
              console.log(res);
            },
            fail: function (res) {
              // fail
              console.log(res);
            },
            complete: function (res) {
              // complete
              console.log(res);
            }
          });

          //读取设备列表
          setTimeout(function () {
            that.getBlueToothList();
          }, 3000);

        },
        fail: function (res) {
          console.log("-----蓝牙适配器打开失败-------");
          console.log(res);
          wx.showToast({
            title: '请打开设备蓝牙',
            icon:'none',
            duration:2000
          })
          that.setData({
            showLoad: false,
            searchResult: true,
            isLink:false,
            isLogin:true
          });
        }
      });
    },
  
    //读取搜索到的蓝牙列表信息
    getBlueToothList: function () {
      var that = this;
      //获得搜索到的蓝牙设备列表
      wx.getBluetoothDevices({
        success: function (res) {
          console.log("读取搜索到的蓝牙设备列表");
          //如果蓝牙设备信息为0，则显示重新扫描按钮
          if (res.devices.length > 0) {
            that.setData({
              showLoad: false,
              searchResult: false,
            });

            //关闭蓝牙适配器
            wx.stopBluetoothDevicesDiscovery({
              success: function (res) {
                console.log(res);
              },
            });
          };
          console.log(res);
          that.setData({
            list: res.devices
          });
          console.log(that.data.list);
        },
        fail: function (res) {
          // fail
          wx.showToast({
            title: '读取蓝牙列表信息失败',
            icon:'none',
            duration:1500
          })

          that.setData({
            searchResult: true,
          });
        },
        complete: function (res) {
          // complete
        }
      });
    },


    //点击连接事件处理
    bindLinkTap: function (e) {
          var that = this;
          var linkDisable = that.data.linkDisable;
          if(linkDisable){
            wx.showModal({
              cancelColor: 'blue',
              title:'温馨提示',
              content:'是否连接该蓝牙设备？',
              success (res) {
                if (res.confirm) {
                 //设置蓝牙列表不可再点击
                 that.setData({
                   linkDisable:false
                 })
                  //进入确定电梯ID是否正确
                  const ds = e.currentTarget.dataset;
                  console.log(ds);
                  const devId = ds.deviceid; //设备UUID
                  const name = ds.name; //设备名 
                  console.log('用户连接'+ds.name+'蓝牙');
                  console.log(devId+':'+name);
                  wx.showToast({
                    title: '连接中',
                    icon:'loading',
                    duration:1500
                  })
                  //连接蓝牙
                  wx.createBLEConnection({
                    deviceId: devId,
                    success:function(e){
                      wx.hideLoading();//隐藏loading
                      that.setData({
                        isLinkdeviceId:devId,
                        isLinkdeviceName:name,
                        linkDisable:true
                      })
                      console.log()
                      that.getBLEDeviceServices(devId);
                    },
  
                    fail:function(err){
                      that.setData({
                        linkDisable:true
                      })
                      wx.hideLoading(); //隐藏loading
                      if (err.errCode === 10012) {
                        app.showModal1("连接超时,请重试!");
                      } else if (err.errCode === 10013) {
                        app.showModal1("连接失败,蓝牙地址无效!");
                      }
                      console.log('连接失败，断开连接');
                      app.showModal1("连接失败，正在断开连接");
                      that.closeBLEConnection()
                    }
                  })
                } else if (res.cancel) {
                  console.log('用户点击取消')
                  that.setData({
                    linkDisable:true
                  })
                }
              }
            })
          }else{
            wx.showToast({
              title: '正在连接，请稍后',
              icon:'none',
              duration:2000
            })
          }
         
    },
  
    //获取蓝牙设备所有 service 服务
    getBLEDeviceServices: function(devId) {
      var that = this ;
      wx.getBLEDeviceServices({
        deviceId: devId,
        success:function(res){
          for (let i = 0; i < res.services.length; i++) {
            if (res.services[i].isPrimary) { //该服务是否为主服务
              wx.navigateTo({
                url: '../link/link?name=' + encodeURIComponent(that.data.isLinkdeviceName) + '&deviceId=' + encodeURIComponent(devId) + '&serviceId=' + encodeURIComponent(res.services[i].uuid)
              });
              return;
            }
          }
        }
      })
    },

    //断开与低功耗蓝牙设备的连接
    closeBLEConnection: function() {
      wx.closeBLEConnection({
        deviceId: this.data.isLinkdeviceId,
        fail:function(err){
          console.log(err);
          if(err.errCode === 10006){
            wx.showToast({
              title: '请稍后再尝试，当前蓝牙未断开',
              icon:'none',
              duration:2000
            });
          }
        }
      })
    },

    //防止多次点击事件
    tip(){
      wx.showToast({
        title: '正在加载，请稍等...',
        icon:'none',
        duration:1500
      })
    },

  //菜单功能列表
  resetTap(){
    console.log('设置重置 提示弹出框');
    var that = this ;
    var elevatorId = that.data.elevatorId;
    console.log(elevatorId.toString(16));
      wx.showModal({
        cancelColor: 'blue',
        title:'温馨提示',
        content:'是否重置该设备？',
        success (res) {
          if (res.confirm) {
            that.setData({
              resetDisable:false
            })
            console.log('用户点击确定,重置设备')
            
            var info = {
              elevatorId : 0x0,
              robotId : 0x0
            }
            
            info.elevatorId = elevatorId;
            console.log("当前电梯ID为："+elevatorId.toString(16))
            info.robotId = ROBOTID
            var floorNumber = 0
            var relayID = 0
            var needCard = 0
            that.setData({
               'payloadConfigItem.floorNumber':0,
               'payloadConfigItem.relayID':0,
               'payloadConfigItem.needCard':needCard,
               'payloadConfigItem.data[0]' : 0xE0,
               'payloadConfigItem.data[1]' : (floorNumber + 256) % 256,
               'payloadConfigItem.data[2]' : relayID % 256,
               'payloadConfigItem.data[3]' : needCard % 256
            })
            
            var deviceId = wx.getStorageSync('deviceId');
            var serviceId = wx.getStorageSync('serviceId');
            var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
            utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,that.data.payloadConfigItem);
            //进入确定电梯ID是否正确
              wx.showToast({
                title: '正在继电器重置...',
                icon:'loading',
                duration:1500
              })
        
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      }) 
  },

//时间配置
timeConfigTap(){
  var that = this ;
  var timeConfigDisable = that.data.timeConfigDisable;
  if(timeConfigDisable){
      that.setData({
      timeConfigDisable:false
    })

    wx.navigateTo({
        url: '../timeConfig/timeConfig',
    })
  }else{
    wx.showToast({
      title: '正在加载，请稍等...',
      icon:'none',
      duration:1500
    })
  }
},

//容错参数配置
errorConfigTap(){
  var that = this ;
  var errorConfigDisable = that.data.errorConfigDisable;
  if(errorConfigDisable){
      that.setData({
      errorConfigDisable:false
    })
    wx.navigateTo({
      url: '../errorConfig/errorConfig',
    })
  }else{
    wx.showToast({
      title: '正在加载，请稍等...',
      icon:'none',
      duration:1500
    })
  }

},


  //继电器映射操作
  mapTap(){
    console.log('点击继电器映射')
    var that = this ;
    var mapConfigDisable = that.data.mapConfigDisable;
    if(mapConfigDisable){
      that.setData({
        mapConfigDisable:false
      })
      wx.navigateTo({
        url: '../map/map',
      })
    }else{
      wx.showToast({
        title: '正在加载，请稍等...',
        icon:'none',
        duration:1500
      })
    }
  },


  //继电器标定操作
  calibrationTap(){
    console.log('点击继电器标定');
    var that = this ;
    var calibrationDisable = that.data.calibrationDisable;
    if(calibrationDisable){
      that.setData({
        calibrationDisable:false
      })
      wx.navigateTo({
        url: '../calibration/calibration',
      })
    }else{
      wx.showToast({
        title: '正在加载，请稍等...',
        icon:'none',
        duration:1500
      })
    }
  },

  //测试
  testTap(){
    console.log('点击测试');
    var that = this ;
    var storeyTestDisable = that.data.storeyTestDisable;
    if(storeyTestDisable){
      that.setData({
        storeyTestDisable:false
      })
  
      wx.navigateTo({
        url: '../storeyTest/storeyTest',
      })
    }else{
      wx.showToast({
        title: '正在加载，请稍等...',
        icon:'none',
        duration:1500
      })
    }
  },

//申请电梯
applyTap(){
  var that = this 
  var elevatorId =that.data.elevatorId;
  var isApplyTap = that.data.isApplyTap;
  if(isApplyTap){
    wx.showToast({
      title: '此电梯已申请',
      icon:'none',
      duration:1000
    })
    return;
  }else{
    wx.showModal({
    cancelColor: 'blue',
    title:'温馨提示',
    content:'是否申请该电梯？',
    success (res) {
      if (res.confirm) {
        console.log('用户点击确定')
        //进入确定电梯ID是否正确
        var info = {
          elevatorId : 0x0,
          robotId : 0x0
        }
        var cmdID = 0xA1
         info.elevatorId = elevatorId;
        info.robotId = ROBOTID
        that.setData({
          'payloadRobotMsg.data[0]' : cmdID
        })
        var deviceId = wx.getStorageSync('deviceId');
        var serviceId = wx.getStorageSync('serviceId');
        var writeCharacteristicId = wx.getStorageSync('writeCharacteristicId')
        utils.writeBLECharacteristicValue(deviceId,serviceId,writeCharacteristicId,info,that.data.payloadRobotMsg);

        wx.showToast({
          title: '正在申请该电梯...',
          icon:'loading',
          duration:1500
        })
        that.setData({
          isApplyTap:!isApplyTap
        })
        console.log(that.data.isApplyTap);
      } else if (res.cancel) {
        console.log('用户点击取消')
      }
    }
  })
  }
  
},

    //触发楼层按键
touchTap:function(){
  var that = this 
  var isApplyTap = that.data.isApplyTap;
  var touchDisable = that.data.touchDisable;
  console.log('点击触发楼层按键')
  if(isApplyTap){
    if(touchDisable){
      that.setData({
        touchDisable:false
      })
      wx.navigateTo({
        url: '../touch/touch',
      })
    }else{
      wx.showToast({
        title: '正在加载，请稍等...',
        icon:'none',
        duration:1500
      })
    }
  }else{
    wx.showToast({
      title: '未申请电梯',
      icon:'none',
      duration:1000
    })
  }
 },
 keepDoor(){
  var that = this 
  var isTouchTab = that.data.isTouchTab;
  console.log('点击保持电梯开门')
  if(isTouchTab){
    wx.showToast({
      title: '正在加载中...',
      icon:'loading',
      duration:1500
    })
  }else{
    wx.showToast({
      title: '未触发楼层按键',
      icon:'none',
      duration:1000
    })
  }
 },

 closeDoor(){
  var that = this 
  var isTouchTab = that.data.isTouchTab;
  console.log('点击关闭电梯门')
  if(isTouchTab){
    wx.showToast({
      title: '正在加载中...',
      icon:'loading',
      duration:1500
    })
  }else{
    wx.showToast({
      title: '未触发楼层按键',
      icon:'none',
      duration:1000
    })
  }
 },

 cancelTap(){
  var that = this 
  var isTouchTab = that.data.isTouchTab;
  console.log('点击取消任务')
  if(isTouchTab){
    that.setData({
      isTouchTab:!isTouchTab
    })
    wx.showToast({
      title: '正在取消任务中...',
      icon:'loading',
      duration:1500
    })
  }else{
    wx.showToast({
      title: '未触发任务',
      icon:'none',
      duration:1000
    })
  }
 },

 freshenTap(){
  var that = this 
  var isApplyTap = that.data.isApplyTap;
  if(isApplyTap){
    wx.showModal({
    cancelColor: 'blue',
    title:'温馨提示',
    content:'是否释放电梯？',
    success (res) {
      if (res.confirm) {
        console.log('用户点击确定')
        //进入确定电梯ID是否正确
        wx.showToast({
          title: '正在释放电梯...',
          icon:'loading',
          duration:1500
        })
        that.setData({
          isApplyTap:!isApplyTap,
          isTouchTab:false
        })
        console.log(that.data.isApplyTap);
      } else if (res.cancel) {
        console.log('用户点击取消')
      }
    }
  })
  }else{
    wx.showToast({
      title: '还未申请电梯',
      icon:'none',
      duration:1500
    })
}
 },

   //重启
   rebootTap(){
    console.log('点击重启');
    var that = this ;
    var rebootDisable = that.data.rebootDisable;
    if(rebootDisable){
      that.setData({
        rebootDisable:false
      })
      wx.navigateTo({
        url: '../reboot/reboot',
      })
    }else{
      wx.showToast({
        title: '正在加载，请稍等...',
        icon:'none',
        duration:1500
      })
    }
   },

   
   //调试输出
   printfTap(){
    var that = this ;
    var printfDisable = that.data.printfDisable
    if(printfDisable){
      that.setData({
        printfDisable:false
      })
      wx.navigateTo({
        url: '../printf/printf',
      })
    }else{
      wx.showToast({
        title: '正在加载，请稍等...',
        icon:'none',
        duration:1500
      })
    }
   },

//    //下拉刷新页面操作
//   onPullDownRefresh: function () {
//     console.log('下拉刷新');//设置触发事件时间效果方法
//     setTimeout(()=>{// 在此调取接口
//       wx.showNavigationBarLoading(); // 显示顶部刷新图标
//       wx.redirectTo({
//         url: '../index/index',
//         success:function(res){
//           wx.stopPullDownRefresh({
//             success: (res) => {
//               console.log("刷新成功");
//             },
//           })
//         }
//       })
//     ,1000})
// },

})