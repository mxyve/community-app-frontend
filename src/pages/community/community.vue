<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
    <!-- 顶部导航 + 地区选择 -->
    <view class="top-bar">
      <view class="location-selector" @click="goToSelectAddress">
        <text class="location-icon">🌍</text>
        <text class="location-text">{{ showLocation }}</text>
        <text class="location-arrow">▼</text>
      </view>
      <!-- <view class="right-icons">
        <view class="icon-bell">🔔</view>
        <view class="icon-ai">🤖</view>
      </view> -->
    </view>

    <!-- 邻里圈头部 -->
    <view class="neighborhood-header">
      <text class="title">邻里圈</text>
      <view class="subtitle">
        <text>👥 {{ onlineCount }}位邻居在线</text>
        <text class="stats">今日新帖 {{ todayNewCount }}</text>
      </view>
    </view>

    <!-- 发布按钮 - 仿杂志风格 -->
    <view class="post-action" @click="goToPublish">
      <view class="new-post-btn">
        <view class="new-post-icon">✏️</view>
        <view class="new-post-text">分享邻里新鲜事...</view>
        <view class="new-post-arrow">📷</view>
      </view>
    </view>

    <!-- 标签分类 -->
    <view class="categories-section">
      <scroll-view class="categories-scroll" scroll-x show-scrollbar="false">
        <view
          class="category-tag"
          :class="{ active: currentTagId === null }"
          @click="switchTag(null)"
          >全部</view
        >
        <view
          class="category-tag"
          :class="{ active: currentTagId === item.tagId }"
          v-for="item in tagList"
          :key="item.tagId"
          @click="switchTag(item.tagId)"
        >
          <text v-if="item.emoji">{{ item.emoji }}</text>
          {{ item.name }}
        </view>
      </scroll-view>
    </view>

    <!-- 帖子列表 -->
    <view class="posts-section">
      <view class="posts-list" v-for="item in articleList" :key="item.articleId">
        <!-- 帖子卡片 -->
        <view class="post-card">
          <view class="post-header">
            <view class="post-type">
              <text>{{ getTagEmoji(item.tagId) }}</text>
              <text>{{ item.tagName }}</text>
            </view>
            <view class="post-location" v-if="item.area">
              <text>📍</text>
              <text>{{ item.area }}</text>
            </view>
          </view>

          <view class="post-title">{{ item.title }}</view>
          <view class="post-content">{{ item.content }}</view>

          <!-- 图片占位（如有图片字段可扩展） -->
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
              <text>❤️ {{ item.likeCount || 0 }}</text>
              <text>↗️</text>
            </view>
          </view>

          <view class="post-footer">
            <view class="author-info">
              <view class="author-avatar">{{ item.authorAvatar || '👤' }}</view>
              <view class="author-details">
                <text class="author-name">{{ item.authorName || '邻居' }}</text>
                <text class="author-badge">{{ item.authorBadge || '热心邻居' }}</text>
              </view>
            </view>
            <view class="post-actions">
              <!-- 删除按钮（仅自己可见） -->
              <text v-if="item.isSelf" class="del-icon" @click.stop="handleDelete(item.articleId)"
                >🗑️</text
              >
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="loading">加载中...</view>
      <view class="load-more" v-else-if="!hasMore && articleList.length === 0">暂无内容</view>
      <view class="load-more" v-else-if="!hasMore && articleList.length > 0">没有更多了</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getArticlePage, deleteArticle, getTagList } from '@/service/community.js'
import { getUserLocation } from '@/service/location.js'

const { safeAreaInsets } = uni.getSystemInfoSync()

// 定位显示
const showLocation = ref('请选择地区')
const onlineCount = ref(123)
const todayNewCount = ref(18)

// 文章列表
const articleList = ref([])
const loading = ref(false)
const hasMore = ref(true)
const current = ref(1)
const size = ref(10)

const tagList = ref([])
const currentTagId = ref(null)

// 标签emoji映射
const tagEmojiMap = ref({
  失物招领: '🧾',
  生活碎片: '🏠',
  邻里互助: '🤝',
  社区活动: '🎉',
  萌宠日常: '🐕',
})

onMounted(() => {
  fetchUserLocation()
  fetchTagList()
  fetchArticleList()

  uni.$on('addressSelected', (addr) => {
    showLocation.value = addr.fullText || '请选择地区'
    refreshList()
  })
})

onUnmounted(() => {
  uni.$off('addressSelected')
})

async function fetchUserLocation() {
  try {
    const res = await getUserLocation()
    showLocation.value = res.data.fullText || '请选择地区'
  } catch (err) {
    showLocation.value = '请选择地区'
  }
}

const getTagEmoji = (tagId) => {
  const tag = tagList.value.find((t) => t.tagId === tagId)
  if (!tag) return '📌'
  return tagEmojiMap.value[tag.name] || '📌'
}

const fetchTagList = async () => {
  try {
    const res = await getTagList()
    tagList.value = res.data || []
  } catch (err) {
    console.log('获取标签失败', err)
  }
}

const switchTag = (tagId) => {
  currentTagId.value = tagId
  refreshList()
}

const fetchArticleList = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    const res = await getArticlePage({
      current: current.value,
      size: size.value,
      tagId: currentTagId.value,
    })

    const records = res.data.records || []

    // 处理数据，添加模拟字段（实际应根据接口调整）
    const processed = records.map((item) => ({
      ...item,
      authorName: item.authorName || '邻居',
      authorBadge: item.authorBadge || (item.area || '社区') + '·热心邻居',
      authorAvatar: item.authorAvatar || '👤',
      isSelf: item.userId === uni.getStorageSync('userInfo')?.userId,
      images: item.images || (item.tagId === 1 ? [''] : []), // 模拟图片
    }))

    if (current.value === 1) {
      articleList.value = processed
    } else {
      articleList.value = [...articleList.value, ...processed]
    }

    hasMore.value = records.length === size.value
    if (hasMore.value) current.value++
  } catch (err) {
    console.error('获取文章失败', err)
  } finally {
    loading.value = false
  }
}

const refreshList = () => {
  current.value = 1
  hasMore.value = true
  fetchArticleList()
}

const loadMore = () => {
  fetchArticleList()
}

const formatTime = (timeStr) => {
  if (!timeStr) return '刚刚'
  // 简单格式化，可根据需要完善
  return timeStr
}

const handleDelete = async (articleId) => {
  uni.showModal({
    title: '确认删除',
    success: async (res) => {
      if (res.confirm) {
        await deleteArticle(articleId)
        uni.showToast({ title: '删除成功', icon: 'none' })
        refreshList()
      }
    },
  })
}

const goToSelectAddress = () => {
  uni.navigateTo({ url: '/pages/index/address' })
}

const goToPublish = () => {
  uni.navigateTo({ url: '/pages/community/publish' })
}
</script>

<style lang="scss" scoped>
.container {
  background: #f8f6f2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.top-bar {
  padding: 24rpx 30rpx 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2rpx solid #f0e4d8;
}

.location-selector {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: #ffffff;
  padding: 8rpx 16rpx 8rpx 12rpx;
  border-radius: 40rpx;
  box-shadow:
    0 4rpx 10rpx -5rpx #d4b6a0,
    0 0 0 2rpx #f0e4d8;
}

.location-icon {
  font-size: 36rpx;
}

.location-text {
  font-weight: 600;
  color: #4a3a2e;
  font-size: 30rpx;
}

.location-arrow {
  color: #b86b3f;
  font-size: 28rpx;
}

.right-icons {
  display: flex;
  gap: 12rpx;
}

.icon-bell,
.icon-ai {
  width: 88rpx;
  height: 88rpx;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #b25f3a;
  box-shadow:
    0 6rpx 12rpx -8rpx #d4b6a0,
    0 0 0 2rpx #f0e4d8;
}

/* 邻里圈头部 */
.neighborhood-header {
  padding: 20rpx 30rpx 12rpx;
}

.neighborhood-header .title {
  font-size: 64rpx;
  font-weight: 700;
  color: #4a3a2e;
  letter-spacing: -1rpx;
  margin-bottom: 4rpx;
  display: block;
}

.neighborhood-header .subtitle {
  color: #8f7a68;
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.subtitle .stats {
  background: #fde6d2;
  padding: 4rpx 24rpx;
  border-radius: 30rpx;
  color: #b86b3f;
  font-size: 26rpx;
}

/* 发布按钮 */
.post-action {
  padding: 8rpx 30rpx 16rpx;
}

.new-post-btn {
  background: #ffffff;
  border-radius: 40rpx;
  padding: 14rpx 22rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  box-shadow:
    0 10rpx 18rpx -12rpx #c4a690,
    0 2rpx 0 0 #e8d9cc;
  border: 2rpx solid #f5e6d9;
}

.new-post-icon {
  width: 88rpx;
  height: 88rpx;
  background: #fde6d2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  color: #b86b3f;
}

.new-post-text {
  flex: 1;
  font-weight: 500;
  color: #8f7a68;
  font-size: 30rpx;
}

.new-post-arrow {
  color: #b86b3f;
  font-size: 40rpx;
}

/* 标签分类 */
.categories-section {
  padding: 8rpx 30rpx 16rpx;
}

.categories-scroll {
  white-space: nowrap;
  display: flex;
  gap: 10rpx;
  overflow-x: auto;
  padding: 4rpx 0;
}

.category-tag {
  display: inline-block;
  padding: 8rpx 40rpx;
  background: #ffffff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #8f7a68;
  border: 2rpx solid #f0e4d8;
  margin-right: 10rpx;
  box-shadow: 0 4rpx 8rpx -6rpx #d4b6a0;
  white-space: nowrap;
}

.category-tag.active {
  background: #b86b3f;
  color: white;
  border: none;
}

/* 帖子列表 */
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
  padding: 44rpx 44rpx 40rpx;
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
  background: #fde6d2;
  padding: 6rpx 36rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #b86b3f;
  display: flex;
  align-items: center;
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

.meta-left text {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.meta-right {
  display: flex;
  gap: 32rpx;
  color: #b86b3f;
  font-size: 26rpx;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 24rpx;
  border-top: 2rpx solid #f0e4d8;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.author-avatar {
  width: 72rpx;
  height: 72rpx;
  background: #fde6d2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #b86b3f;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #4a3a2e;
  font-size: 28rpx;
}

.author-badge {
  font-size: 24rpx;
  color: #8f7a68;
}

.post-actions {
  display: flex;
  gap: 36rpx;
  color: #b86b3f;
  font-size: 40rpx;
}

.del-icon {
  font-size: 32rpx;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 40rpx 0 20rpx;
  color: #8f7a68;
  font-weight: 500;
  font-size: 28rpx;
}
</style>
