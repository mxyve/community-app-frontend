import { http } from '@/utils/http'

// 查询会话消息历史
export const getMessageList = (sessionId) => {
  return http({
    method: 'GET',
    url: `/api/v1/messages/session/${sessionId}`,
  })
}

// 流式接口
export const streamChat = (data, onChunk) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: '/api/v1/messages/stream',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      data,
      enableChunked: true,
      success(res) {
        resolve(res.data)
      },
      fail: reject,
    })
  })
}
