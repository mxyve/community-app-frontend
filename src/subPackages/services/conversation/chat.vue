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
import { getHistoryMessages, sendMessage, markMessagesAsRead } from '@/service/conversation.js'
import { useUserStore } from '@/stores/user'

const { safeAreaInsets } = uni.getSystemInfoSync()

const userStore = useUserStore()

const sessionId = ref('')
const merchantId = ref('')
const merchantName = ref('商家客服')

const messageList = ref([])
const currentPage = ref(1)
const pageSize = 20
const hasMore = ref(true)
const loadingMore = ref(false)

const inputText = ref('')
const scrollTop = ref(0)
const defaultAvatar = '/static/icon/user.png'

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPageData = pages[pages.length - 1]
  const options = currentPageData.options

  sessionId.value = options.sessionId || ''
  merchantId.value = options.merchantId || ''
  merchantName.value = decodeURIComponent(options.merchantName || '商家客服')

  if (!sessionId.value) {
    uni.showToast({ title: '会话不存在', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return
  }

  // 第一次进入页面 → 强制加载最新消息
  await loadHistoryMessages()
  await markMessagesAsReadHandler()

  connectWebSocket()
})

onUnmounted(() => {
  closeSocket()
})

const loadHistoryMessages = async (isLoadMore = false) => {
  if (isLoadMore && !hasMore.value) return
  if (loadingMore.value) return

  loadingMore.value = true
  try {
    const page = isLoadMore ? currentPage.value + 1 : 1
    const res = await getHistoryMessages(sessionId.value, page, pageSize)
    const records = res.data || []

    const formattedMessages = records.map((msg) => ({
      ...msg,
      createTime: msg.createTime,
    }))

    if (isLoadMore) {
      messageList.value = [...formattedMessages, ...messageList.value]
      currentPage.value = page
    } else {
      messageList.value = formattedMessages
      currentPage.value = 1
    }

    hasMore.value = records.length === pageSize

    setTimeout(() => {
      scrollTop.value = 99999
    }, 100)
  } catch (err) {
    console.error('加载失败', err)
  } finally {
    loadingMore.value = false
  }
}

const loadMoreMessages = () => {
  if (hasMore.value && !loadingMore.value) {
    loadHistoryMessages(true)
  }
}

const sendMessageHandler = async () => {
  const content = inputText.value.trim()
  if (!content) return

  try {
    const res = await sendMessage({
      sessionId: sessionId.value,
      receiverId: Number(merchantId.value),
      receiverType: 1,
      content: content,
      msgType: 0,
    })

    const newMessage = {
      id: res.data.id,
      sessionId: sessionId.value,
      senderId: res.data.senderId,
      senderType: 0,
      receiverId: merchantId.value,
      receiverType: 1,
      content: content,
      isRead: 0,
      createTime: new Date().toISOString(),
    }

    messageList.value.push(newMessage)
    inputText.value = ''

    setTimeout(() => {
      scrollTop.value = 99999
    }, 100)
  } catch (err) {
    uni.showToast({ title: '发送失败', icon: 'none' })
  }
}

const markMessagesAsReadHandler = async () => {
  if (!sessionId.value) return
  try {
    await markMessagesAsRead(sessionId.value)
  } catch (err) {}
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const goBack = () => {
  uni.navigateBack()
}

// ==================== WebSocket 正确版本 ====================
const socketTask = ref(null)

function connectWebSocket() {
  // 安全获取 userId（绝对不报错）
  const userInfo = userStore.userInfo || uni.getStorageSync('userInfo')
  const userId = userInfo?.userId

  console.log('【最终 userId】', userId)
  if (!userId) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  // 关闭旧连接
  if (socketTask.value) {
    socketTask.value.close()
    socketTask.value = null
  }

  // 创建连接
  socketTask.value = uni.connectSocket({
    url: `ws://127.0.0.1:8080/ws/app/chat/${userId}`,
  })

  // ✅ 正确的 uni-app 小程序 WebSocket 写法
  // 连接打开
  uni.onSocketOpen(() => {
    console.log('✅ 小程序 WebSocket 连接成功')
  })

  // ✅ 收到消息（这里会收到后台推送！）
  uni.onSocketMessage((res) => {
    console.log('【小程序收到消息】', res.data)

    try {
      const msg = JSON.parse(res.data)

      // 只显示当前会话
      if (msg.sessionId == sessionId.value) {
        const exists = messageList.value.some((x) => x.id === msg.id)
        if (!exists) {
          messageList.value.push(msg)
        }

        // 滚动到底
        setTimeout(() => {
          scrollTop.value = 999999
        }, 60)
      }
    } catch (e) {
      console.error('解析消息失败', e)
    }
  })

  // 连接关闭
  uni.onSocketClose(() => {
    console.log('🔌 WebSocket 已断开')
  })

  // 连接错误
  uni.onSocketError((err) => {
    console.error('WebSocket 错误', err)
  })
}

function closeSocket() {
  if (socketTask.value) {
    uni.closeSocket()
    socketTask.value = null
  }
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
