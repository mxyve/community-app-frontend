import { http } from '@/utils/http'

/**
 * 分页获取文章列表
 */
export function getArticlePage(data) {
  return http({
    method: 'POST',
    url: '/api/v1/community/article/pages',
    data,
  })
}

/**
 * 创建文章
 */
export function createArticle(data) {
  return http({
    method: 'POST',
    url: '/api/v1/community/article',
    data,
  })
}

/**
 * 删除文章
 */
export function deleteArticle(articleId) {
  return http({
    method: 'DELETE',
    url: `/api/v1/community/article/${articleId}`,
  })
}

// 获取标签列表
export const getTagList = () => {
  return http({
    method: 'GET',
    url: '/api/v1/community/tag/list',
  })
}
