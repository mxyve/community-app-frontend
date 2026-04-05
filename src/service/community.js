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

/**
 * 文章详情
 */
export function getArticleDetail(articleId) {
  return http({
    method: 'GET',
    url: `/api/v1/community/article/${articleId}`,
  })
}

/**
 * 点赞/取消点赞
 */
export function likeOrCancel(articleId) {
  return http({
    method: 'POST',
    url: `/api/v1/community/article/${articleId}/like`,
  })
}

/**
 * 用户点赞的文章列表
 */
export function getMyLikeArticlePage(data) {
  return http({
    method: 'POST',
    url: '/api/v1/community/article/myLike/pages',
    data,
  })
}

/**
 * 用户发布的文章列表
 */
export function getMyPostArticlePage(data) {
  return http({
    method: 'POST',
    url: '/api/v1/community/article/my/post/pages',
    data,
  })
}

/**
 * 统计：当前用户点赞的文章总数
 */
export function countMyLikeArticles() {
  return http({
    method: 'GET',
    url: '/api/v1/community/article/count/my-like',
  })
}

/**
 * 统计：当前用户发布的文章总数
 */
export function countMyPostArticles() {
  return http({
    method: 'GET',
    url: '/api/v1/community/article/count/my-post',
  })
}

/**
 * 统计：今日发布的帖子总数
 */
export function countTodayPosts() {
  return http({
    method: 'GET',
    url: '/api/v1/community/article/count/today',
  })
}

/**
 * 获取文章评论列表（树形）
 */
export function getCommentPage(data) {
  return http({
    method: 'Post',
    url: '/api/v1/community/comment/pages',
    data,
  })
}

/**
 * 发布评论/回复
 */
export function createComment(data) {
  return http({
    method: 'POST',
    url: '/api/v1/community/comment',
    data,
  })
}

/**
 * 删除评论
 */
export function deleteComment(commentId) {
  return http({
    method: 'DELETE',
    url: `/api/v1/community/comment/${commentId}`,
  })
}

/**
 * 我的评论总数
 */
export function countMyComments() {
  return http({
    method: 'GET',
    url: '/api/v1/community/comment/my/count',
  })
}

/**
 * 我的评论分页列表
 */
export function myCommentPage() {
  return http({
    method: 'GET',
    url: '/api/v1/community/comment/my/page',
  })
}
