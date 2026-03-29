// pages/publish/publish.js
Page({
  data: {
    title: '',
    description: '',
    location: '',
    images: [],
    maxImages: 9,
    maxTitleLength: 30,
    maxDescLength: 200,
    maxLocationLength: 50,
    publishing: false
  },

  onLoad() {},

  onUnload() {
    // 清理临时文件
    this.data.images.forEach(img => {
      if (img.startsWith('cloud://')) {
        // 云存储文件不需要手动清理
      }
    })
  },

  // 标题输入
  onTitleInput(e) {
    const value = e.detail.value
    if (value.length <= this.data.maxTitleLength) {
      this.setData({ title: value })
    }
  },

  // 描述输入
  onDescInput(e) {
    const value = e.detail.value
    if (value.length <= this.data.maxDescLength) {
      this.setData({ description: value })
    }
  },

  // 位置输入
  onLocationInput(e) {
    const value = e.detail.value
    if (value.length <= this.data.maxLocationLength) {
      this.setData({ location: value })
    }
  },

  // 选择图片
  onChooseImage() {
    const that = this
    const remain = this.data.maxImages - this.data.images.length

    if (remain <= 0) {
      wx.showToast({
        title: '最多上传9张图片',
        icon: 'none'
      })
      return
    }

    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePaths = res.tempFilePaths
        that.setData({
          images: [...that.data.images, ...tempFilePaths]
        })
      }
    })
  },

  // 预览图片
  onPreviewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    })
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.images]
    images.splice(index, 1)
    this.setData({ images })
  },

  // 验证表单
  validateForm() {
    if (!this.data.title.trim()) {
      wx.showToast({
        title: '请输入问题标题',
        icon: 'none'
      })
      return false
    }

    if (!this.data.description.trim()) {
      wx.showToast({
        title: '请输入问题描述',
        icon: 'none'
      })
      return false
    }

    if (this.data.images.length === 0) {
      wx.showToast({
        title: '请至少上传一张图片',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 发布问题
  async onPublish() {
    if (this.data.publishing) return

    if (!this.validateForm()) return

    this.setData({ publishing: true })

    wx.showLoading({
      title: '发布中...'
    })

    try {
      // 1. 先上传图片到云存储
      const imageUrls = await this.uploadImages()

      // 2. 调用云函数发布问题
      wx.cloud.callFunction({
        name: 'publishIssue',
        data: {
          title: this.data.title.trim(),
          description: this.data.description.trim(),
          location: this.data.location.trim(),
          images: imageUrls
        }
      }).then(res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showToast({
            title: '发布成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.result?.msg || '发布失败',
            icon: 'none'
          })
          this.setData({ publishing: false })
        }
      }).catch(err => {
        console.error('发布问题失败', err)
        wx.hideLoading()
        wx.showToast({
          title: '发布失败',
          icon: 'none'
        })
        this.setData({ publishing: false })
      })
    } catch (err) {
      console.error('上传图片失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '上传图片失败',
        icon: 'none'
      })
      this.setData({ publishing: false })
    }
  },

  // 上传图片到云存储
  uploadImages() {
    const images = this.data.images
    const uploadTasks = images.map(img => {
      // 如果是云存储URL，直接使用
      if (img.startsWith('cloud://')) {
        return Promise.resolve(img)
      }
      // 如果是本地临时文件，上传到云存储
      const cloudPath = `issues/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`
      return wx.cloud.uploadFile({
        cloudPath,
        filePath: img
      }).then(res => {
        return res.fileID
      })
    })

    return Promise.all(uploadTasks)
  }
})
