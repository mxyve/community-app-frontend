import { http } from '@/utils/http'

/**
 * 前台分页查询资讯列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页条数
 * @param {string} params.title - 标题关键词（可选）
 * @param {string} params.province - 省份（可选）
 * @param {string} params.city - 城市（可选）
 * @param {string} params.district - 区县（可选）
 */
export function getInformationPage(params) {
  return http({
    method: 'GET',
    url: '/api/front/information/page',
    data: params,
  }) 
}

/**
 * 前台获取资讯详情
 * @param {number} id - 资讯ID
 */
export function getInformationDetail(id) {
  return http({
    method: 'GET',
    url: `/api/front/information/detail/${id}`,
  })
}
