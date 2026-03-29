// cloudfunctions/updateIssueStatus/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { issueId, status, statusDesc, statusImages } = event

  // 参数校验
  if (!issueId) {
    return {
      success: false,
      msg: '参数错误'
    }
  }

  const validStatuses = ['pending', 'processing', 'resolved']
  if (!status || !validStatuses.includes(status)) {
    return {
      success: false,
      msg: '请选择有效的状态'
    }
  }

  try {
    // 1. 校验管理员权限
    const config = db.collection('config')
    const configRes = await config.where({
      key: 'adminList'
    }).get()

    const adminList = configRes.data && configRes.data[0] ? configRes.data[0].value || [] : []

    if (!adminList.includes(openid)) {
      return {
        success: false,
        msg: '无权限执行此操作'
      }
    }

    // 2. 更新问题状态
    const issues = db.collection('issues')
    const issueRes = await issues.doc(issueId).get()

    if (!issueRes.data) {
      return {
        success: false,
        msg: '问题不存在'
      }
    }

    const updateData = {
      status: status,
      updateTime: db.serverDate()
    }

    // 如果有整改说明
    if (statusDesc !== undefined) {
      updateData.statusDesc = statusDesc
    }

    // 如果有整改照片
    if (statusImages !== undefined) {
      updateData.statusImages = statusImages
    }

    await issues.doc(issueId).update({
      data: updateData
    })

    // 3. 记录操作日志（可选）
    const logs = db.collection('statusChangeLogs')
    await logs.add({
      data: {
        issueId: issueId,
        operatorOpenid: openid,
        oldStatus: issueRes.data.status,
        newStatus: status,
        statusDesc: statusDesc || '',
        statusImages: statusImages || [],
        createTime: db.serverDate()
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('updateIssueStatus error:', err)
    return {
      success: false,
      msg: err.message || '更新失败'
    }
  }
}
