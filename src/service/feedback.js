import { http } from '@/utils/http'

/**
 * 用户提交反馈
 */
export function submitFeedback(data) {
  return http({
    method: 'POST',
    url: '/api/v1/feedback/submit',
    data,
  })
}

/**
 * 查询我的反馈列表
 */
export function getMyFeedbackList(params) {
  return http({
    method: 'GET',
    url: '/api/v1/feedback/myList',
    data: params,
  })
}

/**
 * 删除我的反馈
 */
export function deleteFeedback(id) {
  return http({
    method: 'DELETE',
    url: `/api/v1/feedback/delete/${id}`,
  })
}

/**
 * 撤销我的反馈
 */
export function cancelFeedback(id) {
  return http({
    method: 'POST',
    url: `/api/v1/feedback/cancel/${id}`,
  })
}

/**
 * 上传反馈图片
 */
export function uploadFeedbackImage(filePath) {
  return uni.uploadFile({
    url: '/api/v1/feedback/upload/picture',
    filePath: filePath,
    name: 'file',
  })
}
