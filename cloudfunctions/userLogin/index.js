// cloudfunctions/userLogin/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询用户是否已存在
    const users = db.collection('users')
    const { data } = await users.where({
      _openid: openid
    }).get()

    if (data.length === 0) {
      // 用户不存在，创建新用户
      const result = await users.add({
        data: {
          _openid: openid,
          nickName: event.nickName || '匿名用户',
          avatarUrl: event.avatarUrl || '',
          createTime: db.serverDate()
        }
      })

      return {
        success: true,
        openid: openid,
        isNew: true,
        userId: result._id
      }
    } else {
      // 用户已存在，更新用户信息
      await users.doc(data[0]._id).update({
        data: {
          nickName: event.nickName || data[0].nickName,
          avatarUrl: event.avatarUrl || data[0].avatarUrl,
          updateTime: db.serverDate()
        }
      })

      return {
        success: true,
        openid: openid,
        isNew: false
      }
    }
  } catch (err) {
    console.error('userLogin error:', err)
    return {
      success: false,
      msg: err.message || '登录失败'
    }
  }
}
