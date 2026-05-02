<template>
  <view class="markdown-content">
    <!-- 服务卡片列表 -->
    <view v-if="isServiceList" class="service-card-list">
      <view
        class="service-card"
        v-for="item in serviceList"
        :key="item.id"
        @click="goToDetail(item.serviceId)"
      >
        <image class="cover" :src="item.coverImage" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ item.serviceName }}</text>
          <text class="desc">{{ item.description }}</text>
          <view class="bottom">
            <text class="price">¥{{ item.price }}</text>
            <text class="star">⭐{{ (item.avgStar || 0).toFixed(1) }}</text>
          </view>
        </view>
      </view>
    </view>
    <!-- 普通 markdown 内容 -->
    <rich-text v-else :nodes="parsedContent"></rich-text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
})

// 判断是否是服务列表 JSON
const isServiceList = computed(() => {
  if (!props.content) return false
  const trimmed = props.content.trim()
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return false
  try {
    const arr = JSON.parse(trimmed)
    return Array.isArray(arr) && arr.length > 0 && arr[0].serviceId
  } catch (e) {
    return false
  }
})

// 解析服务列表
const serviceList = computed(() => {
  try {
    return JSON.parse(props.content.trim())
  } catch (e) {
    return []
  }
})

// 跳转详情
const goToDetail = (serviceId) => {
  uni.navigateTo({
    url: `/subPackages/services/serviceDetail?id=${serviceId}`,
  })
}

// 简单markdown解析
const parsedContent = computed(() => {
  let html = props.content
    .replace(/\n/g, '<br/>')
    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<image class="markdown-image" src="$2" alt="$1"></image>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
  return html
})
</script>

<style lang="scss" scoped>
.markdown-content {
  font-size: 28rpx;
  line-height: 1.6;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;

  :deep(pre) {
    background: #f5f2f0;
    padding: 20rpx;
    border-radius: 16rpx;
    overflow-x: auto;
    margin: 20rpx 0;
  }

  :deep(code) {
    background: #f5f2f0;
    padding: 4rpx 8rpx;
    border-radius: 8rpx;
    font-family: monospace;
    word-break: break-all;
  }

  :deep(.markdown-image) {
    max-width: 100%;
    width: 100%;
    height: auto;
    border-radius: 16rpx;
    margin: 10rpx 0;
  }

  :deep(a) {
    color: #b86b3f;
    text-decoration: underline;
    word-break: break-all;
  }

  :deep(p) {
    word-wrap: break-word;
    word-break: break-word;
  }

  :deep(div) {
    word-wrap: break-word;
    word-break: break-word;
  }
}

.service-card-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin: 10rpx 0;
}

.service-card {
  display: flex;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 6rpx 22rpx rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.cover {
  width: 160rpx;
  height: 160rpx;
  flex-shrink: 0;
}

.info {
  flex: 1;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.desc {
  font-size: 24rpx;
  color: #666;
  margin-top: 6rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
}

.price {
  color: #ff5f3f;
  font-size: 28rpx;
  font-weight: bold;
}

.star {
  font-size: 24rpx;
  color: #666;
}
</style>
