// components/comment-item/comment-item.js
Component({
  properties: {
    comment: {
      type: Object,
      value: {}
    }
  },

  data: {},

  methods: {
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
