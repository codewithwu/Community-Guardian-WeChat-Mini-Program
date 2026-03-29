// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    isAdmin: false
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-1g6a3r7lb71488f7',
        traceUser: true
      })
    }

    // 检查登录状态（不在这里检查管理员，避免启动超时）
    this.checkLogin()
  },

  checkLogin() {
    // 获取缓存的用户信息
    const userInfo = wx.getStorageSync('userInfo')
    const openid = wx.getStorageSync('openid')

    if (userInfo && openid) {
      this.globalData.userInfo = userInfo
      this.globalData.openid = openid
    }
  },

  checkAdminStatus(openid) {
    const db = wx.cloud.database()
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), 5000)
    })

    Promise.race([
      db.collection('config').where({ key: 'adminList' }).get(),
      timeoutPromise
    ]).then(res => {
      if (res && res.data && res.data.length > 0) {
        const adminList = res.data[0].value || []
        this.globalData.isAdmin = adminList.includes(openid)
      }
    }).catch(err => {
      console.error('检查管理员状态失败', err.message || err)
      this.globalData.isAdmin = false
    })
  },

  setUserInfo(userInfo, openid) {
    this.globalData.userInfo = userInfo
    this.globalData.openid = openid
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('openid', openid)
    this.checkAdminStatus(openid)
  }
})
