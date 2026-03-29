// pages/detail/detail.js
const app = getApp()

Page({
  data: {
    issueId: '',
    issue: null,
    comments: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    isLiked: false,
    isAdmin: false,
    currentUserOpenid: '',
    commentContent: '',
    focusComment: false,
    // 管理员相关
    showAdminPanel: false,
    newStatus: '',
    statusDesc: '',
    statusImages: [],
    maxStatusImages: 9
  },

  statusOptions: [
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'resolved', label: '已整改' }
  ],

  onLoad(options) {
    if (!options.id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      wx.navigateBack()
      return
    }

    this.setData({
      issueId: options.id,
      focusComment: options.focus === 'comment'
    })

    this.checkAdminStatus()
    this.loadIssue()
    this.loadComments()
  },

  onShow() {
    const openid = wx.getStorageSync('openid')
    this.setData({
      currentUserOpenid: openid
    })
  },

  checkAdminStatus() {
    const openid = wx.getStorageSync('openid')
    const db = wx.cloud.database()

    db.collection('config').where({
      key: 'adminList'
    }).get().then(res => {
      if (res.data.length > 0) {
        const adminList = res.data[0].value || []
        this.setData({
          isAdmin: adminList.includes(openid)
        })
      }
    })
  },

  loadIssue() {
    const db = wx.cloud.database()

    db.collection('issues').doc(this.data.issueId).get()
      .then(res => {
        if (res.data) {
          this.setData({ issue: res.data })
          // 检查是否已点赞
          this.checkLikeStatus()
        }
      })
      .catch(err => {
        console.error('加载问题详情失败', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  checkLikeStatus() {
    const openid = this.data.currentUserOpenid
    if (!openid) return

    const db = wx.cloud.database()

    db.collection('likes').where({
      _openid: openid,
      issueId: this.data.issueId
    }).get().then(res => {
      this.setData({
        isLiked: res.data.length > 0
      })
    })
  },

  loadComments() {
    if (this.data.loading) return

    this.setData({ loading: true })

    const db = wx.cloud.database()

    db.collection('comments')
      .where({
        issueId: this.data.issueId,
        isDeleted: db.command.neq(true)
      })
      .orderBy('createTime', 'desc')
      .skip((this.data.page - 1) * this.data.pageSize)
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        const comments = res.data || []
        this.setData({
          comments: this.data.page === 1 ? comments : [...this.data.comments, ...comments],
          loading: false,
          hasMore: comments.length >= this.data.pageSize
        })

        // 如果需要聚焦评论框
        if (this.data.focusComment) {
          this.setData({ focusComment: false })
        }
      })
      .catch(err => {
        console.error('加载评论失败', err)
        this.setData({ loading: false })
      })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadComments()
    }
  },

  // 图片预览
  onPreviewImage(e) {
    const current = e.currentTarget.dataset.url
    const urls = this.data.issue.images || []
    wx.previewImage({
      current,
      urls
    })
  },

  // 点赞
  onLikeTap() {
    const openid = this.data.currentUserOpenid
    if (!openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.cloud.callFunction({
      name: 'toggleLike',
      data: { issueId: this.data.issueId }
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({
          isLiked: res.result.isLiked,
          ['issue.likeCount']: res.result.likeCount
        })
      }
    }).catch(err => {
      console.error('点赞失败', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({
      commentContent: e.detail.value
    })
  },

  // 提交评论
  onSubmitComment() {
    const content = this.data.commentContent.trim()
    if (!content) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      })
      return
    }

    if (content.length > 100) {
      wx.showToast({
        title: '评论最多100字',
        icon: 'none'
      })
      return
    }

    const openid = this.data.currentUserOpenid
    const userInfo = wx.getStorageSync('userInfo')

    if (!openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.cloud.callFunction({
      name: 'addComment',
      data: {
        issueId: this.data.issueId,
        content: content
      }
    }).then(res => {
      if (res.result && res.result.success) {
        // 添加评论到列表
        const newComment = {
          _id: res.result.commentId,
          issueId: this.data.issueId,
          content: content,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          createTime: new Date()
        }
        this.setData({
          comments: [newComment, ...this.data.comments],
          commentContent: '',
          ['issue.commentCount']: (this.data.issue.commentCount || 0) + 1
        })
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result?.msg || '评论失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('评论失败', err)
      wx.showToast({
        title: '评论失败',
        icon: 'none'
      })
    })
  },

  // 管理员：显示状态更新面板
  onShowAdminPanel() {
    this.setData({
      showAdminPanel: true,
      newStatus: this.data.issue.status,
      statusDesc: '',
      statusImages: []
    })
  },

  // 管理员：隐藏状态更新面板
  onHideAdminPanel() {
    this.setData({
      showAdminPanel: false
    })
  },

  // 管理员：选择状态
  onStatusChange(e) {
    this.setData({
      newStatus: e.currentTarget.dataset.status
    })
  },

  // 管理员：整改说明输入
  onStatusDescInput(e) {
    this.setData({
      statusDesc: e.detail.value
    })
  },

  // 管理员：选择整改图片
  onChooseStatusImage() {
    const that = this
    const remain = this.data.maxStatusImages - this.data.statusImages.length

    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        that.setData({
          statusImages: [...that.data.statusImages, ...res.tempFilePaths]
        })
      }
    })
  },

  // 管理员：删除整改图片
  onDeleteStatusImage(e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.statusImages]
    images.splice(index, 1)
    this.setData({ statusImages: images })
  },

  // 管理员：更新状态
  async onUpdateStatus() {
    if (!this.data.newStatus) {
      wx.showToast({
        title: '请选择状态',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '更新中...'
    })

    try {
      // 上传整改图片
      let statusImageUrls = []
      if (this.data.statusImages.length > 0) {
        const uploadTasks = this.data.statusImages.map(img => {
          if (img.startsWith('cloud://')) {
            return Promise.resolve(img)
          }
          const cloudPath = `status/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`
          return wx.cloud.uploadFile({
            cloudPath,
            filePath: img
          }).then(res => res.fileID)
        })
        statusImageUrls = await Promise.all(uploadTasks)
      }

      // 调用云函数更新状态
      wx.cloud.callFunction({
        name: 'updateIssueStatus',
        data: {
          issueId: this.data.issueId,
          status: this.data.newStatus,
          statusDesc: this.data.statusDesc,
          statusImages: statusImageUrls
        }
      }).then(res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          })
          this.setData({
            showAdminPanel: false,
            ['issue.status']: this.data.newStatus,
            ['issue.statusDesc']: this.data.statusDesc,
            ['issue.statusImages']: statusImageUrls
          })
        } else {
          wx.showToast({
            title: res.result?.msg || '更新失败',
            icon: 'none'
          })
        }
      }).catch(err => {
        console.error('更新状态失败', err)
        wx.hideLoading()
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        })
      })
    } catch (err) {
      console.error('上传整改图片失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '上传图片失败',
        icon: 'none'
      })
    }
  },

  // 格式化时间
  formatTime(createTime) {
    if (!createTime) return ''
    const now = Date.now()
    const create = new Date(createTime).getTime()
    const diff = now - create

    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return Math.floor(diff / minute) + '分钟前'
    } else if (diff < day) {
      return Math.floor(diff / hour) + '小时前'
    } else {
      const date = new Date(create)
      return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  }
})
