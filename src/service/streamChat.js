export const streamChat = (params, onMessage, onError, onComplete) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

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
        try {
          const text = res.data || ''
          const chunks = text.split(/\n+/)

          // 模拟流式逐字返回
          let index = 0
          function run() {
            if (index >= chunks.length) {
              onComplete()
              resolve()
              return
            }
            let line = chunks[index].trim()
            if (line.startsWith('data:')) line = line.replace('data:', '').trim()
            if (line && line !== '[DONE]') {
              onMessage({ content: line })
            }
            index++
            setTimeout(run, 80) // 打字速度
          }
          run()
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
