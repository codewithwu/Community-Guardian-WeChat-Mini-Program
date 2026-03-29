// cloudfunctions/securityCheck/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 文本安全检测
    if (event.text) {
      const textCheckResult = await cloud.openapi.security.msgSecCheck({
        content: event.text
      })

      if (textCheckResult.errCode !== 0) {
        return {
          success: false,
          pass: false,
          msg: '文本内容包含违规信息，请修改后重试'
        }
      }
    }

    // 图片安全检测
    if (event.imgUrl) {
      const imgCheckResult = await cloud.openapi.security.imgSecCheck({
        media: {
          url: event.imgUrl,
          type: 'image'
        }
      })

      if (imgCheckResult.errCode !== 0) {
        return {
          success: false,
          pass: false,
          msg: '图片内容包含违规信息，请更换图片后重试'
        }
      }
    }

    return {
      success: true,
      pass: true
    }
  } catch (err) {
    console.error('securityCheck error:', err)
    // 如果是内容违规，errCode 不为 0
    if (err.errCode && err.errCode !== 0) {
      return {
        success: false,
        pass: false,
        msg: err.errMsg || '内容检测未通过'
      }
    }
    // 其他错误
    return {
      success: false,
      msg: err.message || '检测失败'
    }
  }
}
