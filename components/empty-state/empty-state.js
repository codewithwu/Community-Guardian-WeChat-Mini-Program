// components/empty-state/empty-state.js
Component({
  properties: {
    type: {
      type: String,
      value: 'no-data'
    },
    text: {
      type: String,
      value: ''
    }
  },

  data: {
    defaultTexts: {
      'no-data': '暂无数据',
      'no-issues': '还没有发布任何问题',
      'no-comments': '还没有评论',
      'loading': '加载中...'
    }
  },

  computed: {
    displayText() {
      return this.properties.text || this.data.defaultTexts[this.properties.type] || '暂无数据'
    }
  },

  methods: {}
})
