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
      <view class="title">会话详情</view>
    </view>

    <!-- 消息列表组件 -->
    <scroll-view
      class="message-scroll"
      scroll-y
      :scroll-top="scrollTop"
      @scrolltoupper="loadMore"
      enhanced
      :show-scrollbar="false"
    >
      <ChatMessageList :messages="messageList" :loading="loadingMore" />
    </scroll-view>

    <!-- 输入框组件 -->
    <ChatInput
      :sending="sending"
      @send="handleSend"
      @camera="handleCamera"
      @attachment="handleAttachment"
    />
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getMessageList } from '@/service/message.js'
import { streamChat } from '@/service/streamChat.js'
import ChatMessageList from '@/components/ChatMessageList.vue'
import ChatInput from '@/components/ChatInput.vue'

const { safeAreaInsets } = uni.getSystemInfoSync()

const messageList = ref([])
const sessionId = ref('')
const sending = ref(false)
const loadingMore = ref(false)
const scrollTop = ref(0)
const currentPage = ref(1)

function goBack() {
  uni.navigateBack()
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options
  sessionId.value = options.sessionId
  console.log('会话ID:', sessionId.value)
  if (sessionId.value) {
    loadMessageList(1)
  }
})

// 获取消息列表
const loadMessageList = async (page) => {
  try {
    const res = await getMessageList(sessionId.value)

    console.log('消息接口返回：', res)
    messageList.value = res.data || []
  } catch (err) {
    console.error('接口报错：', err)
  }
}

// 加载更多
const loadMore = () => {
  if (messageList.value.length >= 20 && !loadingMore.value) {
    currentPage.value++
    loadingMore.value = true
    loadMessageList(currentPage.value).finally(() => {
      loadingMore.value = false
    })
  }
}

// 发送消息
// 发送消息
const handleSend = async (data) => {
  const { content, features } = data

  // 添加用户消息到列表
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: content,
    createTime: new Date().getTime(),
  }
  messageList.value.push(userMessage)

  // 创建临时AI消息用于流式渲染
  const aiMessage = {
    id: Date.now() + 1,
    role: 'assistant',
    content: '',
    isStreaming: true,
    createTime: new Date().getTime(),
  }
  messageList.value.push(aiMessage)

  // 滚动到底部
  nextTick(() => {
    scrollTop.value = 999999
  })

  sending.value = true

  try {
    // 调用流式接口
    await streamChat(
      {
        sessionId: sessionId.value,
        content: content,
        features: features,
      },
      // 消息回调 - 每收到一个chunk就更新
      (chunk) => {
        console.log('收到chunk:', chunk)
        // 追加内容
        aiMessage.content += chunk.content || ''
        // 触发视图更新 - 直接修改对象属性已经触发响应式
        // 但为了保险，可以重新赋值
        messageList.value = [...messageList.value]

        // 滚动到底部
        nextTick(() => {
          scrollTop.value = 999999
        })
      },
      // 错误回调
      (error) => {
        console.error('Stream error:', error)
        aiMessage.content = '抱歉，发生了错误，请重试。'
        aiMessage.isStreaming = false
        sending.value = false
        messageList.value = [...messageList.value]
      },
      // 完成回调
      () => {
        console.log('流式传输完成')
        aiMessage.isStreaming = false
        sending.value = false
        messageList.value = [...messageList.value]
      },
    )
  } catch (error) {
    console.error('Send error:', error)
    aiMessage.content = '抱歉，发生了错误，请重试。'
    aiMessage.isStreaming = false
    sending.value = false
    messageList.value = [...messageList.value]
  }
}

// 拍照
const handleCamera = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const tempFilePaths = res.tempFilePaths
      // 处理图片上传
      console.log('选择图片:', tempFilePaths)
    },
  })
}

// 附件
const handleAttachment = () => {
  uni.chooseImage({
    count: 9,
    success: (res) => {
      const tempFilePaths = res.tempFilePaths
      // 处理附件上传
      console.log('选择附件:', tempFilePaths)
    },
  })
}
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #faf5ef;
  gap: 20rpx;
  border-bottom: 2rpx solid #f0d4b8;
  flex-shrink: 0;

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

.message-scroll {
  flex: 1;
  overflow-y: auto;
}
</style>
