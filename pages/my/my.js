// pages/my/my.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    isLogin: false,
    isAdmin: false,
    stats: {
      issueCount: 0,
      commentCount: 0
    }
  },

  onLoad() {
    // 检查登录状态
    this.checkLoginStatus()
  },

  onShow() {
    // 每次显示时更新数据
    if (this.data.isLogin) {
      this.loadStats()
    }
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    const openid = wx.getStorageSync('openid')

    if (userInfo && openid) {
      this.setData({
        userInfo: userInfo,
        isLogin: true,
        isAdmin: app.globalData.isAdmin || false
      })
      this.loadStats()
    }
  },

  loadStats() {
    const openid = wx.getStorageSync('openid')
    if (!openid) return

    const db = wx.cloud.database()
    const _ = db.command

    // 并行查询用户的发布数量和评论数量
    Promise.all([
      db.collection('issues').where({
        _openid: openid,
        isDeleted: _.neq(true)
      }).count(),
      db.collection('comments').where({
        _openid: openid,
        isDeleted: _.neq(true)
      }).count()
    ]).then(([issueRes, commentRes]) => {
      this.setData({
        stats: {
          issueCount: issueRes.total,
          commentCount: commentRes.total
        }
      })
    }).catch(err => {
      console.error('加载统计数据失败', err)
    })
  },

  // 登录
  onGetUserInfo(res) {
    wx.showLoading({ title: '登录中...' })

    const userInfo = {
      nickName: res.detail.userInfo.nickName,
      avatarUrl: res.detail.userInfo.avatarUrl
    }

    wx.cloud.callFunction({
      name: 'userLogin',
      data: {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      }
    }).then(loginRes => {
      wx.hideLoading()
      console.log('loginRes:', loginRes)
      if (loginRes.result && loginRes.result.success) {
        const openid = loginRes.result.openid
        app.setUserInfo(userInfo, openid)
        this.setData({
          userInfo: userInfo,
          isLogin: true,
          isAdmin: app.globalData.isAdmin
        })
        this.loadStats()
        wx.showToast({ title: '登录成功', icon: 'success' })
      } else {
        wx.showToast({ title: '登录失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('登录失败', err)
      wx.hideLoading()
      wx.showToast({ title: '登录失败', icon: 'none' })
    })
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('openid')
          // 重置全局数据
          app.globalData.userInfo = null
          app.globalData.openid = null
          app.globalData.isAdmin = false
          // 重置页面数据
          this.setData({
            userInfo: null,
            isLogin: false,
            isAdmin: false,
            stats: {
              issueCount: 0,
              commentCount: 0
            }
          })
        }
      }
    })
  },

  // 跳转到我的发布
  onMyIssuesTap() {
    if (!this.data.isLogin) {
      this.onLogin()
      return
    }
    wx.navigateTo({
      url: '/pages/my-issues/my-issues'
    })
  },

  // 跳转到关于我们
  onAboutTap() {
    wx.showModal({
      title: '关于我们',
      content: '小区物业监督助手\n\n一款为小区业主提供的物业问题监督工具，业主可以记录、反馈小区内的物业服务问题，并通过社区互动形成监督合力。\n\n如有问题请联系：support@example.com',
      showCancel: false
    })
  }
})
