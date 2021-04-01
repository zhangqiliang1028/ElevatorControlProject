
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:{
      account:'',
      password:''
    },
    agPassword:'',
    email:'',
    hiddenmodalput:true
  },

  //获取数据
  getAccount(e){
    this.setData({
      'userInfo.account':e.detail.value
    })
  },
  getPassword(e){
    this.setData({
      'userInfo.password':e.detail.value
    })
  },
  getAgPassword(e){
    this.setData({
      agPassword:e.detail.value
    })
  },

  //注册
  registered(){
    var that = this ;
    var userInfo = that.data.userInfo;
    var agPassword =  that.data.agPassword;
    if(userInfo.account===""||userInfo.password===""||agPassword===""){
        wx.showToast({
          title: '输入不能为空',
          icon:'none',
          duration:2000
        })
    }else if(userInfo.password!==agPassword){
      wx.showToast({
        title: '两次输入密码不正确',
        icon:'none',
        duration:2000
      })
    }else{
      //查询数据库，确定是否已经注册
      //数据库操作 - 查询
      const  db = wx.cloud.database();
      db.collection('user').get().then(res => {
        for(let i=0;i<res.data.length;i++){
          var t = res.data[i].userInfo ; 
          if(t.account===userInfo.account){
              wx.showToast({
                title: '该账号已经注册',
                icon:'none',
                duration:3000
              });
              that.setData({
                'userInfo.account':'',
                'userInfo.password':'',
                agPassword:''
              })
              console.log('该账号已经注册')
              return ; 
            }
          }

          console.log('开始注册');
             //添加数据
              db.collection('user').add({
                // data 字段表示需新增的 JSON 数据
                data: {
                  description: "注册",
                  due: (new Date()).toLocaleString(),
                  userInfo: userInfo,
                },
                success: function(res) {
                  wx.showToast({
                    title: '注册成功',
                    icon:'success',
                    duration:2000
                  })
  
                  that.setData({
                    'userInfo.account':'',
                    'userInfo.password':'',
                    agPassword:''
                  })
                },
                fail: function(err){
                  console.log(err);
                  wx.showToast({
                    title: '注册失败',
                    icon:'none',
                    duration:3000
                  })
                },
              })
        })

    }
  },


  //忘记密码
  forgetPassword(){
    console.log('忘记密码....');
    this.setData({
      hiddenmodalput: !this.data.hiddenmodalput
     })
  },
//取消按钮
cancel: function(){
  this.setData({
    hiddenmodalput: true,
    email:''
  });
},

//获取邮箱号
getEmail(e){
  this.setData({
    email:e.detail.value
  })
},

//确认
confirm: function(){
  console.log(this.data.email);
  this.setData({
    hiddenmodalput: true,
    email:''
  })
},

  //登录
  login(){
    wx.navigateBack({
      delta: 1
    })
  }

})