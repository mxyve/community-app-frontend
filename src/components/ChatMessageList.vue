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
          <!-- 用户消息底部：复制按钮 + 时间 -->
          <view class="message-footer user-footer">
            <view class="copy-control" @click="copyContent(item)">
              <image src="/static/icon/copy.svg" mode="aspectFit" class="copy-icon" />
            </view>
            <view class="message-time">{{ formatTime(item.createTime) }}</view>
          </view>
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
          <!-- 社区帖子卡片 -->
          <view v-if="item.isCommunityData" class="community-post-list">
            <view
              v-for="(post, idx) in parseCommunityPosts(item.content)"
              :key="idx"
              class="community-post-item"
              @click="goToPostDetail(post.articleId)"
            >
              <view class="post-header">
                <image :src="post.avatar" class="avatar" />
                <view class="post-info">
                  <text class="nickname">{{ post.nickName }}</text>
                  <text class="time">{{ formatPostTime(post.createTime) }}</text>
                </view>
                <view class="tag" :style="{ backgroundColor: post.tagColor }">
                  {{ post.tagName }}
                </view>
              </view>
              <view class="post-title">{{ post.title }}</view>
              <view class="post-content">{{ post.content }}</view>
            </view>
          </view>

          <!-- 服务/普通文本 -->
          <template v-else>
            <ChatMarkdown :key="item.id + item.content.length" :content="item.content" />
            <view v-if="item.isStreaming" class="cursor"></view>
            <!-- 时间和图标放在同一行 -->
            <view class="message-footer">
              <!-- 复制按钮 -->
              <view class="copy-control" @click="copyContent(item)">
                <image src="/static/icon/copy.svg" mode="aspectFit" class="copy-icon" />
              </view>
              <!-- 语音播放按钮放在前面 -->
              <view class="audio-control" v-if="item.audio">
                <image
                  :src="item.isPlaying ? '/static/icon/voice_off.svg' : '/static/icon/voice_on.svg'"
                  mode="aspectFit"
                  class="audio-icon"
                  @click="handleAudioClick(item.audio, item.id)"
                />
              </view>
              <view class="message-time">{{ formatTime(item.createTime) }}</view>
            </view>
          </template>
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

const emit = defineEmits(['toggleAudio'])

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
  if (!urls) return []
  if (Array.isArray(urls)) return urls
  if (typeof urls !== 'string') return []
  return urls
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)
}

// 处理音频点击，向父组件发送事件
const handleAudioClick = (audio, messageId) => {
  emit('toggleAudio', { audio, messageId })
}

const parseCommunityPosts = (content) => {
  try {
    const data = JSON.parse(content)
    return data.records || []
  } catch (e) {
    console.error('解析社区帖子失败', e)
    return []
  }
}

const formatPostTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const goToPostDetail = (articleId) => {
  uni.navigateTo({
    url: `/subPackages/community/detail?articleId=${articleId}`,
  })
}

// 复制内容
const copyContent = (item) => {
  let copyText = item.content || ''

  // 如果是社区帖子数据，尝试解析并复制标题和内容
  if (item.isCommunityData) {
    try {
      const posts = JSON.parse(item.content)
      if (posts.records && posts.records.length) {
        copyText = posts.records.map((post) => `${post.title}\n${post.content}`).join('\n\n')
      }
    } catch (e) {
      copyText = item.content || ''
    }
  }

  if (!copyText) {
    uni.showToast({ icon: 'none', title: '无内容可复制' })
    return
  }

  uni.setClipboardData({
    data: copyText,
    success: () => {
      uni.showToast({ icon: 'success', title: '复制成功' })
    },
    fail: () => {
      uni.showToast({ icon: 'none', title: '复制失败' })
    },
  })
}
</script>

<style lang="scss" scoped>
.message-list {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  padding-bottom: 60rpx;
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
  position: relative;

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

.message-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 10rpx;
  gap: 12rpx;
  flex-direction: row;
}

.message-time {
  font-size: 20rpx;
  color: #9b7b6b;
  opacity: 0.8;
  margin-top: 0;
}

.audio-control {
  display: inline-flex;
  align-items: center;
}

.audio-icon {
  width: 32rpx;
  height: 32rpx;
  padding: 4rpx;
}

.community-post-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.community-post-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1rpx solid #eee;
}
.post-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.post-header .avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
}
.post-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.nickname {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
}
.time {
  font-size: 22rpx;
  color: #999;
}
.tag {
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #fff;
}
.post-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}
.post-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

/* 复制按钮样式 */
.copy-control {
  display: inline-flex;
  align-items: center;
}

.copy-icon {
  width: 28rpx;
  height: 28rpx;
  padding: 4rpx;
}

/* 用户消息底部样式 */
.user-footer {
  justify-content: flex-end;
  margin-top: 10rpx;
}
</style>
