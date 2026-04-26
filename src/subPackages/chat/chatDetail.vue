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
      <view class="voice-toggle" @click="toggleAutoPlay">
        <image
          :src="autoPlayEnabled ? '/static/icon/voice_on.svg' : '/static/icon/voice_off.svg'"
          mode="aspectFit"
          class="voice-icon"
        />
      </view>
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
      <ChatMessageList
        :messages="messageList"
        :loading="loadingMore"
        @toggleAudio="handleToggleAudio"
      />
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

// 全局自动播放设置（默认开启）
const autoPlayEnabled = ref(true)

// 切换全局自动播放
const toggleAutoPlay = () => {
  autoPlayEnabled.value = !autoPlayEnabled.value
  const status = autoPlayEnabled.value ? '开启' : '关闭'
  uni.showToast({ icon: 'none', title: `语音自动播放${status}` })
}

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
  const { content, features, audio } = data
  const text = content || ''

  // 无内容无图片不发送
  if (!text && selectedImages.value.length === 0 && !audio) return
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
    isPlaying: false,
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
        audio: audio || '',
      },
      (chunk) => {
        console.log('📨 页面收到chunk:', chunk)

        // ✅ 检查是否是最终包含音频的响应（使用 isComplete 标记）
        if (chunk.isComplete && chunk.text && chunk.audio) {
          console.log('🎵 收到完整响应，文字:', chunk.text.substring(0, 50))
          aiMessage.content = chunk.text
          aiMessage.isStreaming = false
          aiMessage.audio = chunk.audio
          aiMessage.isPlaying = false
          messageList.value = [...messageList.value]
          // 只有全局自动播放开启时才自动播放
          if (chunk.audio && autoPlayEnabled.value) {
            playAudio(chunk.audio, aiMessage.id)
          }
          scrollToBottom()
          return
        }

        // 流式文字片段累加
        if (chunk.content) {
          aiMessage.content = chunk.content
          console.log('💬 更新AI内容长度:', aiMessage.content.length)
          messageList.value = [...messageList.value]
          scrollToBottom()
        }
      },
      (err) => {
        console.error('❌ 流式错误:', err)
        aiMessage.content = '出错了，请稍后重试'
        aiMessage.isStreaming = false
        sending.value = false
        messageList.value = [...messageList.value]
      },
      () => {
        console.log('✅ 流式完成')
        sending.value = false
        selectedImages.value = []
        scrollToBottom()
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

// 当前播放的消息ID
let currentPlayingMessageId = null
let audioPlayer = null

// 播放音频（小程序专用）
const playAudio = (base64, messageId) => {
  // 如果点击的是正在播放的消息，则停止
  if (currentPlayingMessageId === messageId && audioPlayer) {
    stopAudio()
    return
  }

  // 停止当前正在播放的
  stopAudio()

  // 更新消息的播放状态
  const msg = messageList.value.find((m) => m.id === messageId)
  if (msg) {
    // 重置所有消息的播放状态
    messageList.value.forEach((m) => {
      m.isPlaying = false
    })
    msg.isPlaying = true
    messageList.value = [...messageList.value]
  }

  currentPlayingMessageId = messageId

  // 小程序需要将 base64 写入临时文件后才能播放
  const fileManager = uni.getFileSystemManager()
  const filePath = `${uni.env.USER_DATA_PATH}/audio_${Date.now()}.mp3`

  // 将 base64 写入临时文件
  fileManager.writeFile({
    filePath: filePath,
    data: base64,
    encoding: 'base64',
    success: () => {
      audioPlayer = uni.createInnerAudioContext()
      audioPlayer.src = filePath
      audioPlayer.onPlay(() => {
        console.log('开始播放')
      })
      audioPlayer.onEnded(() => {
        // 播放结束，重置状态
        if (currentPlayingMessageId) {
          const msg = messageList.value.find((m) => m.id === currentPlayingMessageId)
          if (msg) {
            msg.isPlaying = false
            messageList.value = [...messageList.value]
          }
        }
        currentPlayingMessageId = null
        audioPlayer = null
      })
      audioPlayer.onError((err) => {
        console.error('音频播放失败:', err)
        if (currentPlayingMessageId) {
          const msg = messageList.value.find((m) => m.id === currentPlayingMessageId)
          if (msg) {
            msg.isPlaying = false
            messageList.value = [...messageList.value]
          }
        }
        currentPlayingMessageId = null
        uni.showToast({ icon: 'none', title: '音频播放失败' })
      })
      audioPlayer.play()
    },
    fail: (err) => {
      console.error('写入音频文件失败:', err)
    },
  })
}

// 停止音频
const stopAudio = () => {
  if (audioPlayer) {
    audioPlayer.stop()
    audioPlayer.destroy()
    audioPlayer = null
  }
  // 重置播放状态
  if (currentPlayingMessageId) {
    const msg = messageList.value.find((m) => m.id === currentPlayingMessageId)
    if (msg) {
      msg.isPlaying = false
      messageList.value = [...messageList.value]
    }
    currentPlayingMessageId = null
  }
}

// 切换音频播放/停止
const handleToggleAudio = ({ audio, messageId }) => {
  playAudio(audio, messageId)
}

// 自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => (scrollTop.value = 9999999))
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
  flex-shrink: 0;
  position: relative;

  .back-icon {
    width: 36rpx;
    height: 36rpx;
  }

  .title {
    font-size: 45rpx;
    color: #332b22;
    font-weight: bold;
    flex: 1;
  }

  .voice-toggle {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 165rpx;

    .voice-icon {
      width: 40rpx;
      height: 40rpx;
    }
  }
}

.message-scroll {
  flex: 1;
  overflow-y: auto;
}
</style>
