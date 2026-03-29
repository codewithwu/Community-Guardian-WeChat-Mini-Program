// components/issue-card/issue-card.js
Component({
  properties: {
    issue: {
      type: Object,
      value: {}
    },
    showStatus: {
      type: Boolean,
      value: true
    }
  },

  data: {
    statusText: {
      pending: '待处理',
      processing: '处理中',
      resolved: '已整改'
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', {
        id: this.properties.issue._id
      })
    },

    onLikeTap(e) {
      e.stopPropagation()
      this.triggerEvent('like', {
        id: this.properties.issue._id
      })
    },

    onCommentTap(e) {
      e.stopPropagation()
      this.triggerEvent('comment', {
        id: this.properties.issue._id
      })
    },

    // 格式化相对时间
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
      } else if (diff < 7 * day) {
        return Math.floor(diff / day) + '天前'
      } else {
        const date = new Date(create)
        return `${date.getMonth() + 1}-${date.getDate()}`
      }
    }
  }
})
