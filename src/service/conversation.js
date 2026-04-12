import { http } from '@/utils/http'

/**
 * 创建会话
 * @param {Object} data - { merchantId, orderId? }
 */
export function createSession(data) {
  return http({
    method: 'POST',
    url: '/api/v1/conversation/session',
    data,
  })
}

/**
 * 获取用户会话列表
 * @param {Number} current - 当前页码，默认1
 * @param {Number} size - 每页条数，默认20
 */
export function getUserSessions(current = 1, size = 20) {
  return http({
    method: 'GET',
    url: `/api/v1/conversation/session/list?current=${current}&size=${size}`,
  })
}

/**
 * 获取会话详情
 * @param {Number} sessionId - 会话ID
 */
export function getSessionDetail(sessionId) {
  return http({
    method: 'GET',
    url: `/api/v1/conversation/session/${sessionId}`,
  })
}

/**
 * 删除会话
 * @param {Number} sessionId - 会话ID
 */
export function deleteSession(sessionId) {
  return http({
    method: 'DELETE',
    url: `/api/v1/conversation/session/${sessionId}`,
  })
}

/**
 * 关闭会话
 * @param {Number} sessionId - 会话ID
 */
export function closeSession(sessionId) {
  return http({
    method: 'PUT',
    url: `/api/v1/conversation/session/${sessionId}/close`,
  })
}

// ----------------------- 消息部分 ---------------------------

/**
 * 发送消息
 * @param {Object} data - { sessionId?, receiverId, receiverType, content, msgType? }
 */
export function sendMessage(data) {
  return http({
    method: 'POST',
    url: '/api/v1/conversation/message',
    data,
  })
}

/**
 * 获取历史消息
 * @param {Number} sessionId - 会话ID
 * @param {Number} current - 当前页码
 * @param {Number} size - 每页条数
 */
export function getHistoryMessages(sessionId, current = 1, size = 20) {
  return http({
    method: 'GET',
    url: `/api/v1/conversation/message/session/${sessionId}?current=${current}&size=${size}`,
  })
}

/**
 * 拉取新消息（轮询专用）
 * @param {Number} sessionId - 会话ID
 * @param {Number} fromId - 已有消息的最大ID
 */
export function getNewMessages(sessionId, fromId = 0) {
  return http({
    method: 'GET',
    url: `/api/v1/conversation/message/new?sessionId=${sessionId}&fromId=${fromId}`,
  })
}

/**
 * 标记消息已读
 * @param {Number} sessionId - 会话ID
 */
export function markMessagesAsRead(sessionId) {
  return http({
    method: 'PUT',
    url: '/api/v1/conversation/message/read',
    data: { sessionId },
  })
}

/**
 * 删除消息
 * @param {Number} messageId - 消息ID
 */
export function deleteMessage(messageId) {
  return http({
    method: 'DELETE',
    url: `/api/v1/conversation/message/${messageId}`,
  })
}

/**
 * 获取会话未读数
 * @param {Number} sessionId - 会话ID
 */
export function getUnreadCount(sessionId) {
  return http({
    method: 'GET',
    url: `/api/v1/conversation/message/unread/${sessionId}`,
  })
}
