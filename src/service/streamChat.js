export const streamChat = (params, onMessage, onError, onComplete) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    console.log('🚀 streamChat 开始请求:', params)

    uni.request({
      url: 'http://localhost:8080/api/v1/messages/stream',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: 'Bearer ' + token,
      },
      data: params,
      enableChunked: true,
      dataType: 'text',

      success(res) {
        console.log('✅ streamChat 请求成功, statusCode:', res.statusCode)
        console.log('📄 原始响应:', res.data)

        try {
          const text = res.data || ''
          const lines = text.split(/\r?\n/)

          let accumulatedText = ''
          let audioSent = false // ✅ 添加标记，防止重复发送音频

          for (let line of lines) {
            line = line.trim()
            if (!line) continue

            // 移除 data: 前缀
            if (line.startsWith('data:')) {
              line = line.substring(5).trim()
            }

            if (line === '[DONE]') continue
            if (!line) continue

            // ✅ 先检查是否是 JSON（音频响应）
            if (line.startsWith('{') && line.includes('"text"') && line.includes('"audio"')) {
              if (!audioSent) {
                try {
                  const parsed = JSON.parse(line)
                  console.log('🎵 收到音频响应, 文字长度:', parsed.text.length)
                  audioSent = true
                  onMessage({ text: parsed.text, audio: parsed.audio, isComplete: true })
                  onComplete()
                  resolve()
                  return
                } catch (e) {
                  console.error('解析音频JSON失败:', e)
                }
              }
              continue // ✅ 跳过音频JSON，不当作普通文本处理
            }

            // 普通文字片段（排除已经是音频JSON的行）
            if (line && !line.startsWith('{')) {
              accumulatedText += line
              console.log('📝 发送文字片段, 当前总长度:', accumulatedText.length)
              onMessage({ content: accumulatedText })
            }
          }

          // 如果没有音频响应，发送完成
          if (!audioSent) {
            onComplete()
          }
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
