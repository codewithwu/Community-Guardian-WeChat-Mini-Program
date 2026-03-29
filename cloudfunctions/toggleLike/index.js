// cloudfunctions/toggleLike/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { issueId } = event

  if (!issueId) {
    return {
      success: false,
      msg: '参数错误'
    }
  }

  try {
    // 查询用户是否已点赞
    const likes = db.collection('likes')
    const { data } = await likes.where({
      _openid: openid,
      issueId: issueId
    }).get()

    let isLiked
    let likeCount

    if (data.length > 0) {
      // 已点赞，取消点赞
      await likes.doc(data[0]._id).remove()

      // 问题点赞数 -1
      const issues = db.collection('issues')
      const issueRes = await issues.doc(issueId).get()

      if (issueRes.data) {
        likeCount = Math.max(0, (issueRes.data.likeCount || 0) - 1)
        await issues.doc(issueId).update({
          data: {
            likeCount: likeCount,
            updateTime: db.serverDate()
          }
        })
      }

      isLiked = false
    } else {
      // 未点赞，添加点赞
      await likes.add({
        data: {
          _openid: openid,
          issueId: issueId,
          createTime: db.serverDate()
        }
      })

      // 问题点赞数 +1
      const issues = db.collection('issues')
      const issueRes = await issues.doc(issueId).get()

      if (issueRes.data) {
        likeCount = (issueRes.data.likeCount || 0) + 1
        await issues.doc(issueId).update({
          data: {
            likeCount: likeCount,
            updateTime: db.serverDate()
          }
        })
      }

      isLiked = true
    }

    return {
      success: true,
      isLiked: isLiked,
      likeCount: likeCount
    }
  } catch (err) {
    console.error('toggleLike error:', err)
    return {
      success: false,
      msg: err.message || '操作失败'
    }
  }
}
