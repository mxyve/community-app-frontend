import { http } from '@/utils/http'

/**
 * 获取服务分类列表
 */
export function getCategoryList() {
  return http({
    method: 'GET',
    url: '/api/v1/services/category/list',
  })
}

/**
 * 分页获取服务列表
 */
export function getServicePage(data) {
  return http({
    method: 'POST',
    url: '/api/v1/services/pages',
    data,
  })
}

/**
 * 获取服务详情
 */
export function getServiceDetail(id) {
  return http({
    method: 'GET',
    url: `/api/v1/services/detail/${id}`,
  })
}
