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

/**
 * 创建服务订单
 */
export function createOrder(data) {
  return http({
    method: 'POST',
    url: '/api/v1/orders/create',
    data,
  })
}

/**
 * 分页获取当前用户订单列表
 */
export function getOrderPage(data) {
  return http({
    method: 'POST',
    url: '/api/v1/orders/pages',
    data,
  })
}

/**
 * 获取订单详情
 */
export function getOrderDetail(id) {
  return http({
    method: 'GET',
    url: `/api/v1/orders/detail/${id}`,
  })
}

/**
 * 更新订单
 */
export function updateOrder(data) {
  return http({
    method: 'PUT',
    url: '/api/v1/orders/update',
    data,
  })
}

/**
 * 删除订单（逻辑删除）
 */
export function deleteOrder(id) {
  return http({
    method: 'DELETE',
    url: `/api/v1/orders/delete/${id}`,
  })
}
