<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="header-left" @click="goBack">
        <image class="back-icon" src="/static/icon/arrow_left.png" mode="aspectFit"></image>
        <text class="header-title">生活帮手</text>
      </view>
      <view class="header-right">
        <text class="icon-search">🔍</text>
        <text class="icon-lightning">⚡</text>
      </view>
    </view>

    <!-- 搜索框 -->
    <view class="search-bar">
      <view class="search-input" @click="handleSearchClick">
        <text class="search-icon">🔍</text>
        <text class="search-placeholder">搜索家电维修、保洁、寄养...</text>
      </view>
    </view>

    <!-- 快捷分类 -->
    <view class="quick-category">
      <scroll-view class="category-scroll" scroll-x show-scrollbar="false">
        <view
          class="category-item"
          v-for="item in quickCategoryList"
          :key="item.id"
          @click="switchCategory(item.id)"
        >
          <text class="category-emoji">{{ item.emoji }}</text>
          <text class="category-name">{{ item.name }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 新用户优惠 -->
    <view class="promo-banner">
      <view class="promo-content">
        <text class="promo-title">新用户首单立减</text>
        <text class="promo-subtitle">满50减20 · 限今日</text>
      </view>
      <view class="promo-btn" @click="handleClaim">立即领取</view>
    </view>

    <!-- 排序筛选 -->
    <view class="sort-tabs">
      <view class="sort-tab" :class="{ active: currentSort === '综合' }" @click="switchSort('综合')"
        >综合排序</view
      >
      <view class="sort-tab" :class="{ active: currentSort === '距离' }" @click="switchSort('距离')"
        >距离最近</view
      >
      <view class="sort-tab" :class="{ active: currentSort === '好评' }" @click="switchSort('好评')"
        >好评优先</view
      >
      <view class="sort-tab" :class="{ active: currentSort === '价格' }" @click="switchSort('价格')"
        >价格</view
      >
    </view>

    <!-- 服务列表 -->
    <view class="service-list">
      <view
        class="service-item"
        v-for="item in serviceList"
        :key="item.id"
        @click="goToDetail(item.id)"
      >
        <view class="service-card">
          <view class="service-cover">
            <text class="service-emoji">{{ getServiceEmoji(item.categoryId) }}</text>
            <text class="like-icon" @click.stop="toggleLike(item.id)">{{
              item.isLike ? '❤️' : '🤍'
            }}</text>
          </view>
          <view class="service-info">
            <text class="service-name">{{ item.name }}</text>
            <text class="service-subtitle">{{ item.subtitle }}</text>
            <view class="service-meta">
              <text class="rating">⭐ {{ item.ratingScore || 4.5 }}</text>
              <text class="sales">已售{{ item.monthlySales || 0 }}</text>
            </view>
            <text class="service-price">¥{{ item.basePrice }}起</text>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="load-more" v-if="loading">加载中...</view>
      <view class="load-more" v-else-if="!hasMore && serviceList.length === 0">暂无服务</view>
      <view class="load-more" v-else-if="!hasMore && serviceList.length > 0">没有更多了</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getServicePage, getCategoryList } from '@/service/services.js'

const { safeAreaInsets } = uni.getSystemInfoSync()

// 基础状态
const loading = ref(false)
const hasMore = ref(true)
const current = ref(1)
const size = ref(10)

// 筛选状态
const currentCategoryId = ref(null)
const currentSort = ref('综合')
const keyword = ref('')

// 数据列表
const serviceList = ref([])
const quickCategoryList = ref([])

// 服务emoji映射
const serviceEmojiMap = ref({
  1: '🔧', // 家政保洁
  2: '🧹', // 家电维修
  3: '🐕', // 宠物寄养
  4: '👴', // 助老陪护
  5: '🔓', // 开锁换锁
  6: '🚗', // 洗车保养
})

onMounted(() => {
  fetchCategoryList()
  fetchServiceList()
})

// 获取分类列表
const fetchCategoryList = async () => {
  try {
    const res = await getCategoryList()
    quickCategoryList.value =
      res.data?.map((item) => ({
        id: item.id,
        name: item.name,
        emoji: serviceEmojiMap.value[item.id] || '📌',
      })) || []
  } catch (err) {
    console.error('获取分类失败', err)
  }
}

// 获取服务列表
const fetchServiceList = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    const res = await getServicePage({
      current: current.value,
      size: size.value,
      categoryId: currentCategoryId.value,
      keyword: keyword.value,
    })

    const records = res.data.records || []
    const processed = records.map((item) => ({
      ...item,
      isLike: false, // 模拟收藏状态
    }))

    if (current.value === 1) {
      serviceList.value = processed
    } else {
      serviceList.value = [...serviceList.value, ...processed]
    }

    console.log(serviceList)
    hasMore.value = records.length === size.value
    if (hasMore.value) current.value++
  } catch (err) {
    console.error('获取服务列表失败', err)
  } finally {
    loading.value = false
  }
}

// 切换分类
const switchCategory = (categoryId) => {
  currentCategoryId.value = categoryId
  refreshList()
}

// 切换排序
const switchSort = (sort) => {
  currentSort.value = sort
  refreshList()
}

// 刷新列表
const refreshList = () => {
  current.value = 1
  hasMore.value = true
  fetchServiceList()
}

// 加载更多
const loadMore = () => {
  fetchServiceList()
}

// 获取服务emoji
const getServiceEmoji = (categoryId) => {
  return serviceEmojiMap.value[categoryId] || '📌'
}

// 收藏/取消收藏
const toggleLike = (serviceId) => {
  const item = serviceList.value.find((i) => i.id === serviceId)
  if (item) item.isLike = !item.isLike
}

// 搜索点击
const handleSearchClick = () => {
  uni.showToast({ title: '搜索功能开发中', icon: 'none' })
}

// 领取优惠
const handleClaim = () => {
  uni.showToast({ title: '领取成功', icon: 'success' })
}

// 跳转详情
const goToDetail = (serviceId) => {
  uni.navigateTo({ url: `/pages/services/serviceDetail?id=${serviceId}` })
}

// 返回
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  min-height: 100vh;
  padding-bottom: 20rpx;
}

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: #faf5ef;
  border-bottom: 2rpx solid #f0d4b8;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  .back-icon {
    width: 36rpx;
    height: 36rpx;
  }

  .header-title {
    font-size: 45rpx;
    color: #332b22;
    font-weight: bold;
  }

  .header-right {
    display: flex;
    gap: 30rpx;
    font-size: 36rpx;
    color: #332b22;
  }
}

/* 搜索框 */
.search-bar {
  padding: 20rpx 30rpx;

  .search-input {
    display: flex;
    align-items: center;
    gap: 20rpx;
    background: #fff;
    padding: 24rpx 30rpx;
    border-radius: 50rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  }

  .search-icon {
    font-size: 32rpx;
    color: #999;
  }

  .search-placeholder {
    font-size: 30rpx;
    color: #999;
  }
}

/* 快捷分类 */
.quick-category {
  padding: 20rpx 30rpx;

  .category-scroll {
    white-space: nowrap;
  }

  .category-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    margin-right: 40rpx;
  }

  .category-emoji {
    font-size: 48rpx;
  }

  .category-name {
    font-size: 26rpx;
    color: #332b22;
  }
}

/* 优惠横幅 */
.promo-banner {
  margin: 20rpx 30rpx;
  background: linear-gradient(90deg, #f9e0c7 0%, #f7d4b0 100%);
  border-radius: 24rpx;
  padding: 24rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .promo-content {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .promo-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #8b4513;
  }

  .promo-subtitle {
    font-size: 26rpx;
    color: #a0522d;
  }

  .promo-btn {
    background: #d2691e;
    color: #fff;
    padding: 16rpx 32rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: bold;
  }
}

/* 排序标签 */
.sort-tabs {
  display: flex;
  padding: 20rpx 30rpx;
  gap: 20rpx;
  overflow-x: auto;

  .sort-tab {
    padding: 12rpx 24rpx;
    background: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;
    color: #666;
    white-space: nowrap;
    border: 2rpx solid #f0d4b8;
  }

  .sort-tab.active {
    background: #d2691e;
    color: #fff;
    border-color: #d2691e;
  }
}

/* 服务列表 */
.service-list {
  padding: 20rpx 30rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;

  .service-item {
    .service-card {
      background: #fff;
      border-radius: 24rpx;
      overflow: hidden;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

      .service-cover {
        height: 160rpx;
        background: #f9e0c7;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        .service-emoji {
          font-size: 64rpx;
        }

        .like-icon {
          position: absolute;
          top: 16rpx;
          right: 16rpx;
          font-size: 32rpx;
        }
      }

      .service-info {
        padding: 20rpx;
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .service-name {
          font-size: 32rpx;
          font-weight: bold;
          color: #332b22;
        }

        .service-subtitle {
          font-size: 24rpx;
          color: #999;
        }

        .service-meta {
          display: flex;
          align-items: center;
          gap: 20rpx;
          font-size: 24rpx;
          color: #666;
        }

        .service-price {
          font-size: 32rpx;
          font-weight: bold;
          color: #d2691e;
        }
      }
    }
  }
}

/* 加载更多 */
.load-more {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 28rpx;
}
</style>
