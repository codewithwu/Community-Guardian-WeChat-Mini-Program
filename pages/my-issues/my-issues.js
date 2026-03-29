// pages/my-issues/my-issues.js
Page({
  data: {
    issues: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadMyIssues()
  },

  onShow() {
    // 每次显示时刷新数据
    this.refreshData()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreData()
    }
  },

  refreshData() {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.loadMyIssues()
  },

  loadMyIssues() {
    if (this.data.loading) return

    this.setData({ loading: true })

    const openid = wx.getStorageSync('openid')
    if (!openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      this.setData({ loading: false })
      return
    }

    const db = wx.cloud.database()
    const _ = db.command

    db.collection('issues')
      .where({
        _openid: openid,
        isDeleted: _.neq(true)
      })
      .orderBy('createTime', 'desc')
      .skip((this.data.page - 1) * this.data.pageSize)
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        const issues = res.data || []
        this.setData({
          issues: issues,
          loading: false,
          hasMore: issues.length >= this.data.pageSize
        })
        wx.stopPullDownRefresh()
      })
      .catch(err => {
        console.error('加载我的问题失败', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
        wx.stopPullDownRefresh()
      })
  },

  loadMoreData() {
    this.setData({
      page: this.data.page + 1,
      loading: true
    })
    this.loadMyIssues()
  },

  onIssueTap(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      })
    }
  },

  onDeleteIssue(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个问题吗？删除后不可恢复',
      success: (res) => {
        if (res.confirm) {
          this.deleteIssue(id)
        }
      }
    })
  },

  deleteIssue(id) {
    const db = wx.cloud.database()

    db.collection('issues').doc(id).update({
      data: {
        isDeleted: true,
        deleteTime: db.serverDate()
      }
    }).then(res => {
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
      // 从列表中移除
      const issues = this.data.issues.filter(issue => issue._id !== id)
      this.setData({ issues })
    }).catch(err => {
      console.error('删除问题失败', err)
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    })
  }
})
