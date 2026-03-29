// cloudfunctions/addComment/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { issueId, content } = event

  // 参数校验
  if (!issueId) {
    return {
      success: false,
      msg: '参数错误'
    }
  }

  if (!content || !content.trim()) {
    return {
      success: false,
      msg: '请输入评论内容'
    }
  }

  if (content.length > 100) {
    return {
      success: false,
      msg: '评论最多100字'
    }
  }

  try {
    // 内容安全检测
    const checkResult = await cloud.openapi.security.msgSecCheck({
      content: content.trim()
    })

    if (checkResult.errCode !== 0) {
      return {
        success: false,
        msg: '评论包含违规信息，请修改后重试'
      }
    }

    // 获取用户信息
    const users = db.collection('users')
    const userRes = await users.where({
      _openid: openid
    }).get()

    const userInfo = userRes.data && userRes.data[0] ? userRes.data[0] : {}
    const nickName = userInfo.nickName || '匿名用户'
    const avatarUrl = userInfo.avatarUrl || ''

    // 创建评论记录
    const comments = db.collection('comments')
    const result = await comments.add({
      data: {
        _openid: openid,
        issueId: issueId,
        content: content.trim(),
        nickName: nickName,
        avatarUrl: avatarUrl,
        createTime: db.serverDate(),
        isDeleted: false
      }
    })

    // 更新问题的评论数
    const issues = db.collection('issues')
    const issueRes = await issues.doc(issueId).get()

    if (issueRes.data) {
      await issues.doc(issueId).update({
        data: {
          commentCount: (issueRes.data.commentCount || 0) + 1,
          updateTime: db.serverDate()
        }
      })
    }

    return {
      success: true,
      commentId: result._id
    }
  } catch (err) {
    console.error('addComment error:', err)
    return {
      success: false,
      msg: err.message || '评论失败'
    }
  }
}
