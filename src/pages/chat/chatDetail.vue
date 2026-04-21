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
      :selectedImages="selectedImages"
      @send="handleSend"
      @camera="handleCamera"
      @album="handleAlbum"
      @removeImage="removeImage"
    />
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getMessageList, uploadChatImage } from '@/service/message.js'
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

// 选中待发送的图片
const selectedImages = ref([])

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

// 发送消息（支持文字 + 多图）
const handleSend = async (data) => {
  const { content, features } = data
  const text = content || ''

  // 无内容无图片不发送
  if (!text && selectedImages.value.length === 0) return
  if (sending.value) return

  // ----------------------
  // 第一步：批量上传所有图片
  // ----------------------
  let imageUrls = []
  if (selectedImages.value.length > 0) {
    uni.showLoading({ title: '图片上传中...' })
    try {
      const uploadPromises = selectedImages.value.map((filePath) => uploadChatImage(filePath))
      const uploadResults = await Promise.all(uploadPromises)
      imageUrls = uploadResults.map((res) => JSON.parse(res.data).data[0])
    } catch (err) {
      uni.hideLoading()
      uni.showToast({ icon: 'none', title: '图片上传失败' })
      return
    }
    uni.hideLoading()
  }

  // ----------------------
  // 第二步：组装消息
  // ----------------------
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: text,
    imageUrls: imageUrls,
    createTime: new Date().getTime(),
  }
  messageList.value.push(userMessage)

  const aiMessage = {
    id: Date.now() + 1,
    role: 'assistant',
    content: '',
    isStreaming: true,
    createTime: new Date().getTime(),
  }
  messageList.value.push(aiMessage)

  nextTick(() => (scrollTop.value = 999999))
  sending.value = true

  // ----------------------
  // 第三步：发送流式请求
  // ----------------------
  try {
    await streamChat(
      {
        sessionId: sessionId.value,
        content: text,
        features: features,
        attachments: imageUrls.map((url) => ({ type: 'image', url })),
      },
      (chunk) => {
        aiMessage.content += chunk.content || ''
        messageList.value = [...messageList.value]
        nextTick(() => (scrollTop.value = 999999))
      },
      (error) => {
        aiMessage.content = '抱歉，发生错误'
        aiMessage.isStreaming = false
        sending.value = false
        messageList.value = [...messageList.value]
      },
      () => {
        aiMessage.isStreaming = false
        sending.value = false
        messageList.value = [...messageList.value]
        // 发送完毕清空图片
        selectedImages.value = []
      },
    )
  } catch (error) {
    aiMessage.content = '抱歉，发生错误'
    aiMessage.isStreaming = false
    sending.value = false
    messageList.value = [...messageList.value]
    selectedImages.value = []
  }
}

// 拍照
const handleCamera = () => {
  uni.chooseImage({
    count: 9 - selectedImages.value.length,
    sourceType: ['camera'],
    success: (res) => {
      selectedImages.value = [...selectedImages.value, ...res.tempFilePaths]
    },
  })
}

// 相册
const handleAlbum = () => {
  uni.chooseImage({
    count: 9 - selectedImages.value.length,
    sourceType: ['album'],
    success: (res) => {
      selectedImages.value = [...selectedImages.value, ...res.tempFilePaths]
    },
  })
}

// 删除选中的图片
const removeImage = (idx) => {
  selectedImages.value.splice(idx, 1)
}
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止整体滚动 */
}

.header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #faf5ef;
  gap: 20rpx;
  border-bottom: 2rpx solid #f0d4b8;
  flex-shrink: 0; /* 防止被压缩 */

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
