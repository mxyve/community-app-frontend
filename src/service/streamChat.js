export const streamChat = (params, onMessage, onError, onComplete) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    console.log('🚀 发送消息请求:', params)

    uni.request({
      url: 'http://localhost:8080/api/v1/messages/stream',
      method: 'POST',
      timeout: 60000,
      header: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer ' + token,
      },
      data: params,

      success(res) {
        try {
          console.log('✅ 接口返回原始:', res.data)

          // 后端现在返回 Result.data
          const result = res.data.data || res.data

          // 1. 服务卡片 JSON 数组
          if (typeof result === 'string' && result.trim().startsWith('[')) {
            onMessage({ content: result, isServiceData: true })
            onComplete()
            resolve()
            return
          }

          // 2. 文字 + 语音 JSON
          if (typeof result === 'string' && result.trim().startsWith('{')) {
            const data = JSON.parse(result)
            onMessage({
              text: data.text,
              audio: data.audio,
              isComplete: true,
            })
            onComplete()
            resolve()
            return
          }

          onComplete()
          resolve()
        } catch (e) {
          console.error('❌ 解析失败:', e)
          onError(e)
          reject(e)
        }
      },

      fail(err) {
        console.error('❌ 请求失败:', err)
        onError(err)
        reject(err)
      },
    })
  })
}
