// cloudfunctions/publishIssue/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { title, description, location, images } = event

  // 参数校验
  if (!title || !title.trim()) {
    return { success: false, msg: '请输入问题标题' }
  }

  if (!description || !description.trim()) {
    return { success: false, msg: '请输入问题描述' }
  }

  if (!images || images.length === 0) {
    return { success: false, msg: '请至少上传一张图片' }
  }

  try {
    // 创建问题记录
    const issues = db.collection('issues')
    const result = await issues.add({
      data: {
        _openid: openid,
        title: title.trim(),
        description: description.trim(),
        location: location ? location.trim() : '',
        images: images,
        status: 'pending',
        statusDesc: '',
        statusImages: [],
        likeCount: 0,
        commentCount: 0,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        isDeleted: false
      }
    })

    return { success: true, issueId: result._id }
  } catch (err) {
    console.error('publishIssue error:', err)
    return { success: false, msg: err.message || '发布失败' }
  }
}