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
      <view class="title">{{ merchantName }}</view>
    </view>

    <!-- 消息列表区域 -->
    <scroll-view
      class="message-list"
      scroll-y
      :scroll-top="scrollTop"
      :scroll-with-animation="true"
      @scrolltoupper="loadMoreMessages"
    >
      <!-- 加载更多提示 -->
      <view class="load-more" v-if="hasMore">
        <text class="load-more-text">{{ loadingMore ? '加载中...' : '上拉加载更多' }}</text>
      </view>

      <!-- 消息项 -->
      <view
        class="message-item"
        v-for="msg in messageList"
        :key="msg.id"
        :class="{ self: msg.senderType === 0 }"
      >
        <!-- 头像 -->
        <image class="avatar" :src="msg.senderAvatar || defaultAvatar" mode="aspectFill"></image>

        <!-- 消息内容 -->
        <view class="message-content">
          <view class="message-bubble">
            <text class="message-text">{{ msg.content }}</text>
          </view>
          <text class="message-time">{{ formatTime(msg.createTime) }}</text>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- 底部输入区域 -->
    <view class="input-bar">
      <input
        class="input-field"
        type="text"
        v-model="inputText"
        placeholder="请输入消息..."
        confirm-type="send"
        @confirm="sendMessageHandler"
      />
      <view class="send-btn" @click="sendMessageHandler">
        <text class="send-text">发送</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  getHistoryMessages,
  sendMessage,
  getNewMessages,
  markMessagesAsRead,
  deleteMessage,
} from '@/service/conversation.js'

const { safeAreaInsets } = uni.getSystemInfoSync()

// 路由参数
const sessionId = ref('')
const merchantId = ref('')
const merchantName = ref('商家客服')

// 消息列表相关
const messageList = ref([])
const currentPage = ref(1)
const pageSize = 20
const totalPages = ref(1)
const hasMore = ref(true)
const loadingMore = ref(false)

// 轮询相关
let pollingTimer = null
const lastMessageId = ref(0)

// UI 相关
const inputText = ref('')
const scrollTop = ref(0)
const defaultAvatar = '/static/icon/user.png'

onMounted(() => {
  // 获取路由参数
  const pages = getCurrentPages()
  const currentPageData = pages[pages.length - 1]
  const options = currentPageData.options

  sessionId.value = options.sessionId || ''
  merchantId.value = options.merchantId || ''
  merchantName.value = decodeURIComponent(options.merchantName || '商家客服')

  if (sessionId.value) {
    // 加载历史消息
    loadHistoryMessages()
    // 标记已读
    markMessagesAsReadHandler()
    // 启动轮询
    startPolling()
  } else {
    uni.showToast({ title: '会话不存在', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})

onUnmounted(() => {
  // 清除轮询定时器
  stopPolling()
})

/**
 * 加载历史消息
 */
const loadHistoryMessages = async (isLoadMore = false) => {
  if (isLoadMore && !hasMore.value) return
  if (loadingMore.value) return

  loadingMore.value = true

  try {
    const page = isLoadMore ? currentPage.value + 1 : 1
    const res = await getHistoryMessages(sessionId.value, page, pageSize)
    const records = res.data || []

    // 处理消息列表
    const formattedMessages = records.map((msg) => ({
      ...msg,
      createTime: msg.createTime,
    }))

    if (isLoadMore) {
      // 上拉加载更多：添加到列表开头
      messageList.value = [...formattedMessages, ...messageList.value]
      currentPage.value = page
    } else {
      // 首次加载：直接赋值
      messageList.value = formattedMessages
      currentPage.value = 1
    }

    // 更新最后一条消息ID（用于轮询）
    if (messageList.value.length > 0) {
      lastMessageId.value = messageList.value[messageList.value.length - 1].id
    }

    // 判断是否还有更多
    hasMore.value = records.length === pageSize

    // 滚动到底部
    setTimeout(() => {
      scrollTop.value = 99999
    }, 100)
  } catch (err) {
    console.error('加载历史消息失败:', err)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loadingMore.value = false
  }
}

/**
 * 加载更多（上拉触发）
 */
const loadMoreMessages = () => {
  if (hasMore.value && !loadingMore.value) {
    loadHistoryMessages(true)
  }
}

/**
 * 发送消息
 */
const sendMessageHandler = async () => {
  const content = inputText.value.trim()
  if (!content) {
    uni.showToast({ title: '请输入消息内容', icon: 'none' })
    return
  }

  try {
    const res = await sendMessage({
      sessionId: sessionId.value,
      receiverId: Number(merchantId.value),
      receiverType: 1, // 1-商家
      content: content,
      msgType: 0, // 0-文本
    })

    // 添加消息到列表
    const newMessage = {
      id: res.data.id,
      sessionId: sessionId.value,
      senderId: res.data.senderId,
      senderType: 0, // 0-用户
      receiverId: merchantId.value,
      receiverType: 1,
      content: content,
      isRead: 0,
      createTime: new Date().toISOString(),
    }

    messageList.value.push(newMessage)
    lastMessageId.value = newMessage.id

    // 清空输入框
    inputText.value = ''

    // 滚动到底部
    setTimeout(() => {
      scrollTop.value = 99999
    }, 100)
  } catch (err) {
    console.error('发送消息失败:', err)
    uni.showToast({ title: '发送失败', icon: 'none' })
  }
}

/**
 * 拉取新消息（轮询）
 */
const fetchNewMessages = async () => {
  if (!sessionId.value) return

  console.log('轮询请求参数:', sessionId.value, lastMessageId.value)

  try {
    const res = await getNewMessages(sessionId.value, lastMessageId.value)
    const newMessages = res.data || []

    if (newMessages.length > 0) {
      // 添加新消息到列表
      messageList.value.push(...newMessages)
      lastMessageId.value = newMessages[newMessages.length - 1].id

      // 滚动到底部
      setTimeout(() => {
        scrollTop.value = 99999
      }, 100)

      // 标记新消息为已读
      markMessagesAsReadHandler()
    }
  } catch (err) {
    console.error('拉取新消息失败:', err)
  }
}

/**
 * 标记消息已读
 */
const markMessagesAsReadHandler = async () => {
  if (!sessionId.value) return

  try {
    await markMessagesAsRead(sessionId.value)
  } catch (err) {
    console.error('标记已读失败:', err)
  }
}

/**
 * 启动轮询
 */
const startPolling = () => {
  if (pollingTimer) return
  pollingTimer = setInterval(() => {
    fetchNewMessages()
  }, 10000) // 每  秒轮询一次
}

/**
 * 停止轮询
 */
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

/**
 * 格式化时间
 */
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 返回上一页
 */
const goBack = () => {
  stopPolling()
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
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

.message-list {
  flex: 1;
  padding: 20rpx 30rpx;
  overflow-y: auto;
  box-sizing: border-box;
}

.message-item {
  display: flex;
  margin-bottom: 30rpx;
  align-items: flex-start;

  &.self {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;
    }

    .message-bubble {
      background: #ff5f3f;

      .message-text {
        color: #fff;
      }
    }
  }

  .avatar {
    width: 70rpx;
    height: 70rpx;
    border-radius: 50%;
    background: #f0d4b8;
    flex-shrink: 0;
    object-fit: cover;
  }

  .message-content {
    max-width: 60%;
    margin: 0 20rpx;
    display: flex;
    flex-direction: column;

    .message-bubble {
      background: #fff;
      border-radius: 20rpx;
      padding: 20rpx;
      word-break: break-all;

      .message-text {
        font-size: 28rpx;
        color: #332b22;
        line-height: 1.5;
      }
    }

    .message-time {
      font-size: 20rpx;
      color: #999;
      margin-top: 8rpx;
      text-align: center;
    }
  }
}

.bottom-placeholder {
  height: 20rpx;
}

.input-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #eee;
  gap: 20rpx;
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;

  .input-field {
    flex: 1;
    height: 70rpx;
    background: #f5f5f5;
    border-radius: 35rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
  }

  .send-btn {
    background: #ff5f3f;
    padding: 15rpx 30rpx;
    border-radius: 35rpx;

    .send-text {
      color: #fff;
      font-size: 28rpx;
    }
  }
}
</style>
