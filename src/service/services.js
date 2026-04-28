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

/* ---------------- 购物车相关 ----------------- */
// 新增购物车
export function addCart(data) {
  return http({
    method: 'POST',
    url: '/api/v1/carts/add',
    data,
  })
}

// 获取购物车列表
export function getCartPage(data) {
  return http({
    method: 'POST',
    url: '/api/v1/carts/pages',
    data,
  })
}

// 更新购物车
export function updateCart(data) {
  return http({
    method: 'PUT',
    url: '/api/v1/carts/update',
    data,
  })
}

// 删除购物车项
export function deleteCart(id) {
  return http({
    method: 'DELETE',
    url: `/api/v1/carts/delete/${id}`,
  })
}

/* ---------------- 订单支付相关 ----------------- */
// 创建支付宝支付二维码
export function createAlipayOrder(data) {
  return http({
    method: 'POST',
    url: '/api/v1/orders/createPay',
    data,
  })
}

// 查询订单支付状态
export function getPayStatus(orderNo) {
  return http({
    method: 'GET',
    url: `/api/v1/orders/payStatus/${orderNo}`,
  })
}

/* ---------------- 订单评价相关 ----------------- */
// 根据订单ID查询评价
export function getReviewByOrderId(orderId) {
  return http({
    method: 'GET',
    url: `/api/v1/service/comment/order/${orderId}`,
  })
}

// 提交服务评价
export function createServiceReview(data) {
  return http({
    method: 'POST',
    url: '/api/v1/service/comment',
    data,
  })
}

// 获取服务评价列表
export function getServiceCommentPage(data) {
  return http({
    method: 'POST',
    url: '/api/v1/service/comment/pages',
    data,
  })
}

// 删除服务评论
export function deleteServiceComment(commentId) {
  return http({
    method: 'DELETE',
    url: `/api/v1/service/comment/${commentId}`,
  })
}

// 获取我的服务评价列表
export function getMyServiceCommentList(params) {
  return http({
    url: '/api/v1/service/comment/my/list',
    method: 'GET',
    params: params,
  })
}

// 上传评论图片
export const uploadCommentImage = (filePath) => {
  return uni.uploadFile({
    url: '/api/v1/service/comment/upload/picture',
    filePath: filePath,
    name: 'file',
  })
}
