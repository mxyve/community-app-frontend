export const streamChat = (params, onMessage, onError, onComplete) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    uni.request({
      url: 'http://192.168.66.19:8080/api/v1/messages/stream',
      method: 'POST',
      timeout: 600000,
      header: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      data: params,

      success(res) {
        try {
          console.log('✅ 最终返回:', res.data)
          const result = res.data.data || res.data

          // 如果是订单卡片（字符串数组）
          if (typeof result === 'string' && result.trim().startsWith('[')) {
            onMessage({ content: result, isServiceData: true })
            onComplete()
            resolve()
            return
          }

          // 如果是 { text, audio } 格式
          if (typeof result === 'string' && result.trim().startsWith('{')) {
            const data = JSON.parse(result)
            if (data.text && typeof data.text === 'string') {
              try {
                const innerData = JSON.parse(data.text)
                if (innerData.records && Array.isArray(innerData.records)) {
                  // 返回社区卡片
                  onMessage({
                    content: data.text,
                    isCommunityData: true,
                  })
                  onComplete()
                  resolve()
                  return
                }
              } catch (e) {}
            }

            // 普通文字语音
            if (data.text) {
              onMessage({
                text: data.text,
                audio: data.audio,
                isComplete: true,
              })
              onComplete()
              resolve()
              return
            }
          }

          // 普通文本
          onMessage({ content: result || '' })
          onComplete()
          resolve()
        } catch (e) {
          onError(e)
          reject(e)
        }
      },

      fail(err) {
        onError(err)
        reject(err)
      },
    })
  })
}
