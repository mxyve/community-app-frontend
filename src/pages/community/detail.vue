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
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getArticleDetail, likeOrCancel } from '@/service/community.js'

const { safeAreaInsets } = uni.getSystemInfoSync()
const article = ref({})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const articleId = currentPage.options.articleId

  console.log('文章ID：', articleId)

  if (articleId) {
    fetchArticleDetail(articleId)
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
</style>
