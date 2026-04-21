<template>
  <view class="message-list">
    <view v-for="(item, index) in messages" :key="item.id || index" class="message-item">
      <!-- 用户消息 -->
      <view v-if="item.role === 'user'" class="message-wrapper user">
        <view class="message-bubble user">
          <text>{{ item.content }}</text>

          <!-- 横向滚动图片列表 -->
          <scroll-view
            v-if="getImages(item.imageUrls).length"
            scroll-x
            class="image-scroll-view"
            show-scrollbar="false"
          >
            <view class="image-scroll-list">
              <image
                v-for="(img, idx) in getImages(item.imageUrls)"
                :key="idx"
                :src="img"
                mode="aspectFill"
                class="chat-image-item"
                @click="previewImage(img, getImages(item.imageUrls))"
              />
            </view>
          </scroll-view>
        </view>
        <view class="avatar user">
          <image src="/static/icon/user.png" mode="aspectFill"></image>
        </view>
      </view>

      <!-- AI消息 -->
      <view v-else class="message-wrapper assistant">
        <view class="avatar assistant">
          <image src="/static/icon/robot.png" mode="aspectFill"></image>
        </view>
        <view class="message-bubble assistant">
          <ChatMarkdown :key="item.id + item.content.length" :content="item.content" />
          <view v-if="item.isStreaming" class="cursor"></view>
          <view class="message-time">{{ formatTime(item.createTime) }}</view>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view v-if="loading" class="loading-more">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import ChatMarkdown from './ChatMarkdown.vue'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 图片预览
const previewImage = (current, urls) => {
  uni.previewImage({
    current,
    urls,
    loop: true,
  })
}

// 工具方法：统一格式化图片链接
const getImages = (urls) => {
  if (!urls) return [] // 空值 → 空数组
  if (Array.isArray(urls)) return urls // 数组 → 直接返回
  if (typeof urls !== 'string') return [] // 不是字符串 → 空数组
  return urls
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)
}
</script>

<style lang="scss" scoped>
.message-list {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.message-item {
  width: 100%;
}

.message-wrapper {
  display: flex;
  gap: 20rpx;
  width: 100%;
  flex-direction: row; // 改为统一使用row方向

  // 用户消息靠右
  &.user {
    justify-content: flex-end; // 改为flex-end使其靠右
  }

  // AI消息靠左
  &.assistant {
    justify-content: flex-start; // 保持靠左
  }
}

.avatar {
  width: 60rpx;
  height: 60rpx;
  flex-shrink: 0;

  image {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2rpx solid #f0d4b8;
  }

  &.assistant image {
    background: #fde6d2;
  }

  &.user image {
    background: #b86b3f;
  }
}

.message-bubble {
  max-width: 75%;
  padding: 24rpx 30rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #332b22;
  word-break: break-word;

  &.assistant {
    background: #ffffff;
    border: 2rpx solid #f0d4b8;
    border-radius: 30rpx 30rpx 30rpx 10rpx;
  }

  &.user {
    background: #fde9db;
    border: 2rpx solid #dbbc9f;
    border-radius: 30rpx 30rpx 10rpx 30rpx;
  }
}

.message-time {
  font-size: 20rpx;
  color: #9b7b6b;
  margin-top: 10rpx;
  text-align: right;
  opacity: 0.8;
}

.cursor {
  display: inline-block;
  width: 4rpx;
  height: 32rpx;
  background: #b86b3f;
  margin-left: 4rpx;
  animation: blink 1s infinite;
  vertical-align: middle;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

.loading-more {
  text-align: center;
  padding: 20rpx;
  color: #999;
  font-size: 24rpx;
}

/* 横向滚动图片样式 */
.image-scroll-view {
  margin-top: 16rpx;
  width: 100%;
}

.image-scroll-list {
  display: flex;
  flex-direction: row;
  gap: 10rpx;
}

.chat-image-item {
  width: 150rpx !important;
  height: 150rpx !important;
  border-radius: 16rpx !important;
  object-fit: cover !important;
  flex-shrink: 0;
}

.message-bubble.user {
  max-width: 80%;
  width: auto;
}
.message-bubble.assistant {
  max-width: 80%;
  width: auto;
}
</style>
