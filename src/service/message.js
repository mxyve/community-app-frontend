import { http } from '@/utils/http'

// 查询会话消息历史
export const getMessageList = (sessionId) => {
  return http({
    method: 'GET',
    url: `/api/v1/messages/session/${sessionId}`,
  })
}
// 上传图片
export const uploadChatImage = (filePath) => {
  return uni.uploadFile({
    url: '/api/v1/messages/me/image/chat',
    filePath: filePath,
    name: 'files',
  })
}
