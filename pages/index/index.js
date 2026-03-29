// pages/index/index.js
const app = getApp()

Page({
  data: {
    issues: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    isLogin: false,
    userInfo: null
  },

  onLoad(options) {
    // 检查登录状态
    this.checkLogin()
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.isLogin) {
      this.refreshData()
    }
  },

  onPullDownRefresh() {
    // 下拉刷新
    this.refreshData()
  },

  onReachBottom() {
    // 上拉加载更多
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreData()
    }
  },

  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo')
    const openid = wx.getStorageSync('openid')

    if (userInfo && openid) {
      this.setData({
        isLogin: true,
        userInfo: userInfo
      })
      this.refreshData()
    } else {
      // 提示用户登录
      this.showLoginTip()
    }
  },

  showLoginTip() {
    wx.showModal({
      title: '提示',
      content: '请先登录后再使用',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/my/my'
          })
        }
      }
    })
  },

  refreshData() {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.loadIssues()
  },

  loadIssues() {
    if (this.data.loading) return

    this.setData({ loading: true })

    const db = wx.cloud.database()
    const _ = db.command

    db.collection('issues')
      .where({
        isDeleted: _.neq(true)
      })
      .orderBy('createTime', 'desc')
      .skip((this.data.page - 1) * this.data.pageSize)
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        const openid = wx.getStorageSync('openid')
        const issues = res.data || []

        // 检查当前用户是否点赞过
        if (openid && issues.length > 0) {
          this.checkUserLikes(issues, openid)
        } else {
          this.setData({
            issues: issues,
            loading: false,
            hasMore: issues.length >= this.data.pageSize
          })
          wx.stopPullDownRefresh()
        }
      })
      .catch(err => {
        console.error('加载问题失败', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
        wx.stopPullDownRefresh()
      })
  },

  checkUserLikes(issues, openid) {
    const db = wx.cloud.database()
    const _ = db.command

    db.collection('likes')
      .where({
        _openid: openid,
        issueId: _.in(issues.map(i => i._id))
      })
      .get()
      .then(res => {
        const likedIssueIds = new Set(res.data.map(l => l.issueId))
        issues.forEach(issue => {
          issue.isLiked = likedIssueIds.has(issue._id)
        })
        this.setData({
          issues: issues,
          loading: false,
          hasMore: issues.length >= this.data.pageSize
        })
        wx.stopPullDownRefresh()
      })
      .catch(err => {
        console.error('检查点赞状态失败', err)
        this.setData({
          issues: issues,
          loading: false,
          hasMore: issues.length >= this.data.pageSize
        })
        wx.stopPullDownRefresh()
      })
  },

  loadMoreData() {
    this.setData({
      page: this.data.page + 1,
      loading: true
    })
    this.loadIssues()
  },

  onIssueTap(e) {
    const { id } = e.detail || e.currentTarget.dataset
    if (id) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      })
    }
  },

  onLikeTap(e) {
    if (!this.data.isLogin) {
      this.showLoginTip()
      return
    }

    const { id } = e.detail || e.currentTarget.dataset
    if (!id) return

    wx.cloud.callFunction({
      name: 'toggleLike',
      data: { issueId: id }
    }).then(res => {
      if (res.result && res.result.success) {
        // 更新本地数据
        const issues = this.data.issues.map(issue => {
          if (issue._id === id) {
            return {
              ...issue,
              isLiked: res.result.isLiked,
              likeCount: res.result.likeCount
            }
          }
          return issue
        })
        this.setData({ issues })
      }
    }).catch(err => {
      console.error('点赞失败', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  onCommentTap(e) {
    const { id } = e.detail || e.currentTarget.dataset
    if (id) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}&focus=comment`
      })
    }
  },

  onPublishTap() {
    if (!this.data.isLogin) {
      this.showLoginTip()
      return
    }
    wx.navigateTo({
      url: '/pages/publish/publish'
    })
  }
})
