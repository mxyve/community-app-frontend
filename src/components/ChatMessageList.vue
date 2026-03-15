<template>
  <view class="message-list">
    <view v-for="(item, index) in messages" :key="item.id || index" class="message-item">
      <!-- 用户消息 -->
      <view v-if="item.role === 'user'" class="message-wrapper user">
        <view class="message-bubble user">
          <text>{{ item.content }}</text>
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
          <!-- 使用v-if强制重新渲染组件 -->
          <ChatMarkdown :key="item.id + item.content.length" :content="item.content" />
          <!-- 流式光标 -->
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
  messages: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
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

  &.user {
    flex-direction: row-reverse;
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
  max-width: 70%;
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

.streaming-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.cursor {
  display: inline-block;
  width: 4rpx;
  height: 32rpx;
  background: #b86b3f;
  margin-left: 4rpx;
  animation: blink 1s infinite;
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
</style>
