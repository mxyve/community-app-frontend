import { http } from '@/utils/http'

/**
 * 分页获取用户所有会话
 */
export const getSessionList = (params) => {
  return http({
    method: 'GET',
    url: '/api/v1/session',
    params,
  })
}

/**
 * 创建会话
 */
export const createSession = (data) => {
  return http({
    method: 'POST',
    url: '/api/v1/session',
    data,
  })
}

// 删除会话
export function deleteSession(sessionId) {
  return http({
    method: 'DELETE',
    url: `/api/v1/session/${sessionId}`,
  })
}
