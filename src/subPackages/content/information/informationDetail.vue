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
      <view class="title">资讯详情</view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 详情内容 -->
    <scroll-view class="detail-content" v-else-if="detailData" scroll-y>
      <view class="detail-title">{{ detailData.title }}</view>

      <view class="detail-meta">
        <text class="view-count">👁️ {{ detailData.viewCount || 0 }}次阅读</text>
        <text class="create-time">{{ formatDateTime(detailData.createTime) }}</text>
      </view>

      <!-- 使用 ChatMarkdown 组件渲染内容 -->
      <ChatMarkdown :content="detailData.content" />
    </scroll-view>

    <!-- 错误状态 -->
    <view class="error-state" v-else-if="!loading">
      <image class="error-icon" src="/static/images/noData.png" mode="aspectFit"></image>
      <text class="error-text">资讯不存在或已下架</text>
      <button class="back-btn" @click="goBack">返回上一页</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getInformationDetail } from '@/service/information'
import ChatMarkdown from '@/components/ChatMarkdown.vue'

const { safeAreaInsets } = uni.getSystemInfoSync()

const loading = ref(true)
const detailData = ref(null)

// 格式化日期时间
function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}.${month}.${day} ${hour}:${minute}`
}

// 获取详情
async function fetchDetail() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = currentPage.$page?.options?.id || currentPage.options?.id

  if (!id) {
    uni.showToast({
      title: '参数错误',
      icon: 'none',
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }

  loading.value = true

  try {
    const res = await getInformationDetail(parseInt(id))
    if (res.code === 200 && res.data) {
      detailData.value = res.data
    } else {
      uni.showToast({
        title: res.msg || '资讯不存在',
        icon: 'none',
      })
    }
  } catch (error) {
    console.error('获取详情失败', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}

onMounted(() => {
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden; // 新增：隐藏横向滚动
}

.header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #faf5ef;
  gap: 20rpx;
  border-bottom: 2rpx solid #f0d4b8;
  position: sticky;
  top: 0;
  z-index: 10;

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

.detail-content {
  flex: 1;
  padding: 30rpx;
  width: 100%; // 新增：确保宽度100%
  box-sizing: border-box; // 新增：边框盒模型
}

.detail-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #332b22;
  line-height: 1.4;
  margin-bottom: 20rpx;
  word-wrap: break-word; // 新增：允许换行
  word-break: break-word; // 新增：断词换行
}

.detail-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0d4b8;
  margin-bottom: 30rpx;

  .view-count {
    font-size: 24rpx;
    color: #c48b66;
  }

  .create-time {
    font-size: 24rpx;
    color: #bbb;
  }
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .error-icon {
    width: 200rpx;
    height: 200rpx;
  }

  .error-text {
    font-size: 28rpx;
    color: #999;
    margin-top: 20rpx;
    margin-bottom: 40rpx;
  }

  .back-btn {
    background: #c48b66;
    color: #fff;
    border-radius: 50rpx;
    padding: 16rpx 40rpx;
    font-size: 28rpx;
  }
}
</style>
