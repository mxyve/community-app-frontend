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
      <view class="title">我的点赞</view>
    </view>

    <!-- 帖子列表（完全和首页一样） -->
    <view class="posts-section">
      <scroll-view
        scroll-y
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="onLoadMore"
        style="height: 100%"
      >
        <view class="posts-list" v-for="item in articleList" :key="item.articleId">
          <view class="post-card">
            <view class="post-header">
              <view class="post-type" :style="{ borderColor: item.tagColor }">
                <text class="tag-icon">{{ getTagEmoji(item.tagId) }}</text>
                <text>{{ item.tagName }}</text>
              </view>
              <view class="post-location" v-if="item.area">
                <text>📍</text>
                <text>{{ item.area }}</text>
              </view>
            </view>

            <view @click="goToDetail(item.articleId)">
              <view class="post-title">{{ item.title }}</view>
              <view class="post-content">{{ item.content }}</view>
            </view>

            <view class="post-images" v-if="item.images && item.images.length">
              <view
                class="image-placeholder"
                v-for="(img, idx) in item.images.slice(0, 3)"
                :key="idx"
              >
                🖼️
              </view>
            </view>

            <view class="post-meta">
              <view class="meta-left">
                <text>⏰ {{ formatTime(item.createTime) }}</text>
                <text>👀 {{ item.viewCount || 0 }}浏览</text>
                <text>💬 {{ item.commentCount || 0 }}回复</text>
              </view>
              <view class="meta-right">
                <view class="like-wrap" @click.stop="handleLike(item.articleId, item)">
                  <image
                    src="/static/icon/heart.svg"
                    class="like-svg"
                    :class="{ liked: item.isLiked }"
                  />
                  <text class="like-num">{{ item.likeCount || 0 }}</text>
                </view>
                <text>↗️</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view class="load-more" v-if="loading">加载中...</view>
      <view class="load-more" v-else-if="!hasMore && articleList.length === 0">暂无点赞</view>
      <view class="load-more" v-else-if="!hasMore && articleList.length > 0">没有更多了</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMyLikeArticlePage, likeOrCancel } from '@/service/community.js'

const { safeAreaInsets } = uni.getSystemInfoSync()
const articleList = ref([])
const loading = ref(false)
const hasMore = ref(true)
const current = ref(1)
const size = ref(10)
const refreshing = ref(false)

// 返回
function goBack() {
  uni.navigateBack()
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  refreshList()
  setTimeout(() => {
    refreshing.value = false
  }, 800)
}

// 上拉加载
const onLoadMore = () => {
  if (hasMore.value && !loading.value) {
    fetchMyLikeList()
  }
}

// 获取我的点赞列表
const fetchMyLikeList = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    const res = await getMyLikeArticlePage({
      current: current.value,
      size: size.value,
    })

    const records = res.data.records || []

    const processed = records.map((item) => ({
      ...item,
      images: item.img ? [item.img] : [],
    }))

    if (current.value === 1) {
      articleList.value = processed
    } else {
      articleList.value = [...articleList.value, ...processed]
    }

    hasMore.value = records.length === size.value
    if (hasMore.value) current.value++
  } catch (err) {
    console.error('加载失败', err)
  } finally {
    loading.value = false
  }
}

// 点赞
const handleLike = async (articleId, item) => {
  try {
    await likeOrCancel(articleId)
    item.isLiked = !item.isLiked
    item.likeCount += item.isLiked ? 1 : -1

    if (!item.isLiked) {
      setTimeout(() => {
        refreshList()
      }, 500)
    }
  } catch (err) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

// 刷新
const refreshList = () => {
  current.value = 1
  hasMore.value = true
  fetchMyLikeList()
}

// 跳详情
const goToDetail = (articleId) => {
  uni.navigateTo({
    url: `/pages/community/detail?articleId=${articleId}`,
  })
}

// 时间格式化
const formatTime = (timeStr) => {
  if (!timeStr) return '刚刚'
  return timeStr
}

// 标签表情
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
  return emojiMap[tagId] || '📝'
}

onMounted(() => {
  fetchMyLikeList()
})
</script>

<style lang="scss" scoped>
.container {
  background: #f8f6f2;
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

/* 完全复用你原来的文章列表样式 */
.posts-section {
  padding: 8rpx 30rpx 20rpx;
  flex: 1;
}
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.post-card {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 20rpx 24rpx 20rpx;
  border: 2rpx solid #f5e6d9;
  box-shadow:
    0 12rpx 20rpx -15rpx #c4a690,
    0 2rpx 0 0 #e8d9cc;
  margin-bottom: 18rpx;
}
.post-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 28rpx;
}
.post-type {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 30rpx;
  background: transparent;
  border: 2rpx solid #ccc;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #4a3a2e;
  gap: 8rpx;
}
.post-location {
  font-size: 26rpx;
  color: #8f7a68;
  display: flex;
  align-items: center;
  gap: 4rpx;
  background: #f8f6f2;
  padding: 4rpx 24rpx;
  border-radius: 30rpx;
}
.post-title {
  font-weight: 700;
  color: #4a3a2e;
  font-size: 40rpx;
  margin-bottom: 24rpx;
  line-height: 1.3;
}
.post-content {
  color: #5f4e40;
  font-size: 30rpx;
  line-height: 1.5;
  margin-bottom: 32rpx;
  padding-bottom: 32rpx;
  border-bottom: 2rpx dashed #f0e4d8;
}
.post-images {
  display: flex;
  gap: 16rpx;
  margin-bottom: 32rpx;
}
.image-placeholder {
  width: 160rpx;
  height: 160rpx;
  background: #f0e4d8;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8f7a68;
  font-size: 48rpx;
  border: 4rpx solid white;
  box-shadow: 0 6rpx 12rpx -10rpx #a6897a;
}
.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
}
.meta-left {
  display: flex;
  align-items: center;
  gap: 32rpx;
  color: #9b7b6b;
  font-size: 26rpx;
}
.meta-right {
  display: flex;
  gap: 32rpx;
  color: #b86b3f;
  font-size: 26rpx;
}
.like-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.like-svg {
  width: 28rpx;
  height: 28rpx;
  filter: grayscale(1) opacity(0.5);
}
.like-svg.liked {
  filter: none;
}
.like-num {
  font-size: 26rpx;
  color: #b86b3f;
}
.load-more {
  text-align: center;
  padding: 40rpx 0 20rpx;
  color: #8f7a68;
  font-weight: 500;
  font-size: 28rpx;
}
</style>
