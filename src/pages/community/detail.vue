<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
    <!-- 顶部导航 -->
    <view class="header">
      <image
        class="back-icon"
        src="/static/icon/arrow_left.png"
        mode="aspectFit"
        @click="goBack"
      ></image>
      <view class="title">文章详情</view>
    </view>

    <scroll-view class="content" scroll-y show-scrollbar="false">
      <!-- 标签&位置 -->
      <view class="tag-location-bar">
        <view class="tag-item" :style="{ borderColor: article.tagColor }">
          <text class="tag-icon">{{ getTagEmoji(article.tagId) }}</text>
          <text>{{ article.tagName }}</text>
        </view>
        <view class="location-item" v-if="article.province">
          <text class="location-icon">📍</text>
          <text
            >{{ article.province }}{{ article.city ? `·${article.city}` : ''
            }}{{ article.area ? `·${article.area}` : '' }}</text
          >
        </view>
      </view>

      <!-- 标题 -->
      <view class="title">{{ article.title }}</view>

      <!-- 作者信息 -->
      <view class="author-bar">
        <image class="avatar" :src="article.avatar" mode="aspectFill"></image>
        <view class="author-info">
          <view class="author-name">{{ article.nickName }}</view>
        </view>
        <view class="stats-bar">
          <view class="stat-item">
            <text class="stat-icon">👀</text>
            <text class="stat-num">{{ article.viewCount || 0 }}</text>
          </view>
          <view class="stat-item">
            <image
              src="/static/icon/heart.svg"
              class="like-svg"
              :class="{ liked: article.isLiked }"
              @click="handleLike"
            />
            <text class="stat-num">{{ article.likeCount || 0 }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-icon">💬</text>
            <text class="stat-num">{{ article.commentCount || 0 }}</text>
          </view>
        </view>
      </view>

      <view class="divider"></view>

      <!-- 正文内容 -->
      <view class="content-text">{{ article.content }}</view>

      <!-- 图片展示（有图时显示） -->
      <view class="image-wrap" v-if="article.img">
        <image :src="article.img" mode="widthFix" class="content-image"></image>
      </view>

      <!-- 邻里回声 评论区 -->
      <view class="comment-section">
        <view class="comment-header">
          <text class="comment-title">邻里回声</text>
          <text class="comment-count">{{ article.commentCount || 0 }}条回复</text>
        </view>

        <view class="comment-input-bar">
          <image
            class="input-avatar"
            :src="userInfo?.avatar || '/static/icon/user.png'"
            mode="aspectFill"
          ></image>
          <input
            class="comment-input"
            v-model="commentContent"
            placeholder="写下你的想法..."
            placeholder-class="input-placeholder"
          />
          <text class="publish-btn" @click="handlePublishComment">发布</text>
        </view>

        <!-- 评论列表（递归渲染树形） -->
        <view class="comment-list">
          <view class="comment-item" v-for="item in commentList" :key="item.commentId">
            <!-- 父评论 -->
            <view class="comment-main">
              <image class="comment-avatar" :src="item.avatar" mode="aspectFill"></image>
              <view class="comment-content">
                <view class="comment-user">{{ item.nickName }}</view>
                <view class="comment-text">{{ item.content }}</view>
                <view class="comment-meta">
                  <text class="meta-like">❤️ {{ item.likeCount || 0 }}</text>
                  <text class="meta-reply" @click="handleReplyComment(item)">回复</text>
                  <text
                    class="meta-delete"
                    v-if="item.userId === userInfo?.userId"
                    @click="handleDeleteComment(item.commentId)"
                    >删除</text
                  >
                </view>
              </view>
            </view>

            <!-- 子评论（递归渲染） -->
            <view class="child-comment-list" v-if="item.childList && item.childList.length">
              <view
                class="child-comment-item"
                v-for="child in item.childList"
                :key="child.commentId"
              >
                <image class="child-avatar" :src="child.avatar" mode="aspectFill"></image>
                <view class="child-content">
                  <view class="child-user">
                    {{ child.nickName }}
                    <!-- 显示 “@ 被回复的人” -->
                    <text v-if="child.toUserId && child.toUserId > 0" class="reply-at">
                      @ {{ child.toUserName || '楼主' }}
                    </text>
                  </view>
                  <view class="child-text">{{ child.content }}</view>
                  <!-- 显示时间 -->
                  <view class="comment-time">{{ formatTime(child.createTime) }}</view>
                  <view class="child-meta">
                    <text class="meta-like">❤️ {{ child.likeCount || 0 }}</text>
                    <text class="meta-reply" @click="handleReplyComment(child)">回复</text>
                    <text
                      class="meta-delete"
                      v-if="child.userId === userInfo?.userId"
                      @click="handleDeleteComment(child.commentId)"
                      >删除</text
                    >
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 回复弹窗 - 遮罩层方式 -->
    <view class="reply-mask" v-if="showReplyPopup" @click="closeReplyPopup">
      <view class="reply-popup-container" @click.stop>
        <view class="reply-popup-header">
          <text class="reply-popup-title">回复：{{ replyToComment?.nickName || '' }}</text>
          <text class="reply-popup-close" @click="closeReplyPopup">取消</text>
        </view>
        <view class="reply-popup-content">
          <textarea
            class="reply-popup-textarea"
            v-model="replyContent"
            :placeholder="`回复 @${replyToComment?.nickName || '对方'}`"
            auto-height
            focus
          />
        </view>
        <view class="reply-popup-footer">
          <view class="reply-popup-btn" @click="handlePublishReply">发送</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  getArticleDetail,
  likeOrCancel,
  getCommentPage,
  createComment,
  deleteComment,
} from '@/service/community.js'

const { safeAreaInsets } = uni.getSystemInfoSync()
const article = ref({})

const commentList = ref([])
const commentContent = ref('')
const userInfo = ref(uni.getStorageSync('userInfo') || {})

const showReplyPopup = ref(false) // 控制回复弹窗显示
const replyToComment = ref(null) // 要回复的评论对象
const replyContent = ref('') // 回复内容

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const articleId = currentPage.options.articleId

  console.log('文章ID：', articleId)

  if (articleId) {
    fetchArticleDetail(articleId)
    fetchCommentList(articleId)
  }
})

// 点赞 / 取消点赞
const handleLike = async () => {
  try {
    let articleId = article.value.articleId
    await likeOrCancel(articleId)

    // 前端立即刷新状态
    article.value.isLiked = !article.value.isLiked
    article.value.likeCount += article.value.isLiked ? 1 : -1
  } catch (err) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

// 获取文章详情
const fetchArticleDetail = async (articleId) => {
  try {
    const res = await getArticleDetail(articleId)
    article.value = res.data
  } catch (err) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

// 标签emoji
const getTagEmoji = (tagId) => {
  const emojiMap = {
    1: '🔍',
    2: '📷',
    3: '🤝',
    4: '🍳',
    5: '🐾',
    6: '📦',
    7: '🏠',
    8: '🌿',
  }
  return emojiMap[tagId] || '📌'
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ').substring(0, 16)
}

const fetchCommentList = async (articleId) => {
  try {
    const res = await getCommentPage({
      articleId,
      current: 1,
      size: 20,
    })
    commentList.value = res.data.records || []
  } catch (err) {
    console.error('获取评论失败', err)
  }
}

const handlePublishComment = async () => {
  if (!commentContent.value.trim()) {
    return uni.showToast({ title: '请输入评论内容', icon: 'none' })
  }

  try {
    await createComment({
      articleId: article.value.articleId,
      content: commentContent.value,
      parentCommentId: 0, // 评论顶级，不是回复
      toUserId: 0, // 回复顶级，不@任何人
      img: '',
    })

    uni.showToast({ title: '发布成功', icon: 'success' })
    commentContent.value = '' // 清空输入
    fetchCommentList(article.value.articleId)
    fetchArticleDetail(article.value.articleId)
  } catch (err) {
    uni.showToast({ title: '发布失败', icon: 'none' })
  }
}

const handleReplyComment = (item) => {
  replyToComment.value = item
  replyContent.value = ''
  showReplyPopup.value = true // 显示弹窗
}

const handleDeleteComment = async (commentId) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后该评论及所有回复将不可恢复',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteComment(commentId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          fetchCommentList(article.value.articleId)
          fetchArticleDetail(article.value.articleId)
        } catch (err) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    },
  })
}

// 发布回复（专用）
const handlePublishReply = async () => {
  if (!replyContent.value.trim()) {
    return uni.showToast({ title: '请输入回复内容', icon: 'none' })
  }

  // 增加空值判断
  if (!replyToComment.value) {
    uni.showToast({ title: '回复对象不存在', icon: 'none' })
    closeReplyPopup()
    return
  }

  try {
    await createComment({
      articleId: article.value.articleId,
      content: replyContent.value,
      parentCommentId: replyToComment.value.commentId,
      toUserId: replyToComment.value.userId,
      img: '',
    })
    uni.showToast({ title: '回复成功', icon: 'success' })
    closeReplyPopup()
    fetchCommentList(article.value.articleId)
    fetchArticleDetail(article.value.articleId)
  } catch (err) {
    uni.showToast({ title: '回复失败', icon: 'none' })
    console.error('回复失败:', err)
  }
}

// 关闭回复弹窗
const closeReplyPopup = () => {
  showReplyPopup.value = false
  replyToComment.value = null
  replyContent.value = ''
}

// 返回
function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  min-height: 100vh;
  padding-bottom: 20rpx;
}

.header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #faf5ef;
  gap: 20rpx;
  border-bottom: 2rpx solid #f0d4b8;

  .back-icon {
    width: 36rpx;
    height: 36rpx;
  }

  .title {
    font-size: 45rpx;
    color: #332b22;
    font-weight: bold;
  }
}

/* 标签&位置栏 */
.tag-location-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 30rpx 30rpx 20rpx;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 30rpx;
  background: #fde6d2;
  border: 2rpx solid #fde6d2;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #b86b3f;
  gap: 8rpx;
}

.location-item {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 30rpx;
  background: #f8f6f2;
  border: 2rpx solid #f0e4d8;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #8f7a68;
  gap: 8rpx;
}

/* 标题 */
.title {
  font-size: 56rpx;
  font-weight: 700;
  color: #4a3a2e;
  line-height: 1.3;
  padding: 0 30rpx 30rpx;
}

/* 作者栏 */
.author-bar {
  display: flex;
  align-items: center;
  padding: 0 30rpx 30rpx;
  gap: 20rpx;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #fde6d2;
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #4a3a2e;
  margin-bottom: 8rpx;
}

.author-badge {
  font-size: 26rpx;
  color: #b86b3f;
  background: #fde6d2;
  padding: 4rpx 20rpx;
  border-radius: 30rpx;
  display: inline-block;
}

.like-svg {
  width: 28rpx;
  height: 28rpx;
  filter: grayscale(1) opacity(0.5);
}
.like-svg.liked {
  filter: none;
}

.stats-bar {
  display: flex;
  gap: 30rpx;
  background: #f8f6f2;
  padding: 16rpx 30rpx;
  border-radius: 40rpx;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 28rpx;
  color: #8f7a68;
}

.stat-num {
  font-weight: 600;
}

.divider {
  height: 2rpx;
  background: #f0e4d8;
  margin: 0 30rpx 30rpx;
}

/* 正文 */
.content-text {
  font-size: 32rpx;
  line-height: 1.8;
  color: #5f4e40;
  padding: 0 30rpx 30rpx;
  white-space: pre-wrap;
}

/* 无图占位卡 */
.empty-card {
  background: #f8f6f2;
  border-radius: 32rpx;
  margin: 0 30rpx 30rpx;
  padding: 60rpx 40rpx;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #b86b3f;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #8f7a68;
}

/* 图片展示 */
.image-wrap {
  padding: 0 30rpx 30rpx;
}

.content-image {
  width: 100%;
  border-radius: 24rpx;
}
/* 评论区 */
.comment-section {
  padding: 30rpx;
  margin-top: 20rpx;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.comment-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #4a3a2e;
}

.comment-count {
  background: #fde6d2;
  padding: 6rpx 24rpx;
  border-radius: 30rpx;
  color: #b86b3f;
  font-size: 26rpx;
  font-weight: 600;
}

/* 评论输入框 */
.comment-input-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #fff;
  padding: 20rpx;
  border-radius: 40rpx;
  margin-bottom: 30rpx;
  border: 2rpx solid #f0e4d8;
}

.input-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #fde6d2;
}

.comment-input {
  flex: 1;
  font-size: 30rpx;
  color: #4a3a2e;
}

.input-placeholder {
  color: #8f7a68;
}

.publish-btn {
  font-size: 32rpx;
  font-weight: 700;
  color: #b86b3f;
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
  background: #fde6d2;
}

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.comment-item {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  border: 2rpx solid #f0e4d8;
}

.comment-main {
  display: flex;
  gap: 20rpx;
}

.comment-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #fde6d2;
}

.comment-content {
  flex: 1;
}

.comment-user {
  font-size: 30rpx;
  font-weight: 600;
  color: #4a3a2e;
  margin-bottom: 10rpx;
}

.comment-text {
  font-size: 30rpx;
  color: #5f4e40;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.comment-meta {
  display: flex;
  gap: 30rpx;
  font-size: 26rpx;
  color: #8f7a68;
}

.meta-like,
.meta-reply,
.meta-delete {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.meta-delete {
  color: #d65757;
}

/* 子评论 */
.child-comment-list {
  margin-top: 20rpx;
  padding-left: 92rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.child-comment-item {
  display: flex;
  gap: 16rpx;
}

.child-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #fde6d2;
}

.child-content {
  flex: 1;
  background: #f8f6f2;
  padding: 20rpx;
  border-radius: 20rpx;
}

.child-user {
  font-size: 28rpx;
  font-weight: 600;
  color: #4a3a2e;
  margin-bottom: 8rpx;
}

.child-text {
  font-size: 28rpx;
  color: #5f4e40;
  line-height: 1.6;
  margin-bottom: 12rpx;
}

.child-meta {
  display: flex;
  gap: 24rpx;
  font-size: 24rpx;
  color: #8f7a68;
}

.reply-at {
  color: #b86b3f;
  margin-left: 8rpx;
  font-size: 26rpx;
}
.comment-time {
  font-size: 24rpx;
  color: #c0a994;
  margin-top: 6rpx;
  margin-bottom: 10rpx;
}
/* 回复弹窗遮罩层 */
.reply-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.reply-popup-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 30rpx 30rpx 0 0;
  padding: 30rpx;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.reply-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0e4d8;
}

.reply-popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #4a3a2e;
}

.reply-popup-close {
  font-size: 28rpx;
  color: #999;
}

.reply-popup-content {
  padding: 30rpx 0;
}

.reply-popup-textarea {
  width: 100%;
  min-height: 150rpx;
  font-size: 30rpx;
  color: #4a3a2e;
  padding: 20rpx;
  background: #f8f6f2;
  border-radius: 20rpx;
  box-sizing: border-box;
}

.reply-popup-footer {
  padding-top: 20rpx;
}

.reply-popup-btn {
  background: #b86b3f;
  color: #fff;
  text-align: center;
  padding: 24rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
}
</style>
