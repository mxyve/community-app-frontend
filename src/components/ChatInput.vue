<template>
  <view class="input-area">
    <!-- 选中图片预览 -->
    <view v-if="selectedImages.length" class="image-preview">
      <view v-for="(url, idx) in selectedImages" :key="idx" class="image-item">
        <image :src="url" mode="aspectFill" />
        <view class="del" @click="removeImage(idx)">✕</view>
      </view>
    </view>

    <!-- 功能条：联网搜索 + 深度思考 -->
    <view class="function-top-bar">
      <view
        class="top-switch-item"
        :class="{ active: features.webSearch }"
        @click="toggleFeature('webSearch')"
      >
        <text class="icon">🌐</text>
        <text>联网搜索</text>
      </view>
      <view
        class="top-switch-item"
        :class="{ active: features.deepThink }"
        @click="toggleFeature('deepThink')"
      >
        <text class="icon">🧠</text>
        <text>深度思考</text>
      </view>
    </view>

    <!-- 输入行 -->
    <view class="input-row">
      <!-- 加号按钮 -->
      <view class="plus-icon" @click="showToolPanel = !showToolPanel">
        <text class="plus">+</text>
      </view>

      <!-- 语音/键盘切换按钮 -->
      <view class="voice-keyboard-toggle" @click="toggleInputMode">
        <image
          :src="inputMode === 'text' ? '/static/icon/voice_input.svg' : '/static/icon/keyboard.svg'"
          mode="aspectFit"
          class="toggle-icon"
        />
      </view>

      <!-- 文字输入模式 -->
      <view class="text-input-wrapper" v-if="inputMode === 'text'">
        <input
          type="text"
          v-model="inputText"
          placeholder="向AI助手提问..."
          @confirm="handleSend"
          :disabled="sending"
        />
      </view>

      <!-- 语音输入模式 -->
      <view
        v-else
        class="voice-input-wrapper"
        @touchstart="startRecord"
        @touchend="stopRecord"
        @touchcancel="stopRecord"
      >
        <text class="voice-placeholder">按住 说话</text>
      </view>

      <!-- 发送按钮 -->
      <view
        class="send-button"
        :class="{ disabled: sending }"
        @click="inputMode === 'text' ? handleSend() : sendVoiceMessage()"
      >
        <image src="/static/icon/send.png" mode="aspectFit"></image>
      </view>
    </view>

    <!-- 加号展开：相机 + 相册 -->
    <view v-if="showToolPanel" class="tool-panel">
      <view class="tool-item" @click="handleCamera">
        <image class="tool-icon" src="/static/icon/camera.png" mode="aspectFit" />
        <text>相机</text>
      </view>
      <view class="tool-item" @click="handleAlbum">
        <image class="tool-icon" src="/static/icon/album.svg" mode="aspectFit" />
        <text>相册</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  sending: {
    type: Boolean,
    default: false,
  },
  selectedImages: { type: Array, default: () => [] },
})

const emit = defineEmits(['send', 'camera', 'album', 'removeImage'])

const inputText = ref('')
const features = ref({
  webSearch: false,
  deepThink: false,
})

// 输入模式：'text' 文字输入 / 'voice' 语音输入
const inputMode = ref('text')
const showToolPanel = ref(false)

// 录音相关
const recorderManager = uni.getRecorderManager()
const isRecording = ref(false)
const recordedAudioBase64 = ref('')

// 切换输入模式
const toggleInputMode = () => {
  inputMode.value = inputMode.value === 'text' ? 'voice' : 'text'
}

// 开始录音
const startRecord = () => {
  isRecording.value = true
  uni.showToast({ icon: 'none', title: '录音中...', duration: 60000 })
  recorderManager.start({
    sampleRate: 16000,
    format: 'pcm', // 改为 pcm 格式
    numberOfChannels: 1, // 单声道
    frameSize: 1,
  })
}

// 结束录音 → 保存音频
const stopRecord = () => {
  if (!isRecording.value) return
  isRecording.value = false
  uni.hideToast()

  recorderManager.stop()
  recorderManager.onStop((res) => {
    uni.getFileSystemManager().readFile({
      filePath: res.tempFilePath,
      encoding: 'base64',
      success: (file) => {
        recordedAudioBase64.value = file.data
        uni.showToast({ icon: 'none', title: '录音完成，点击发送', duration: 2000 })
      },
    })
  })
}

// 发送语音消息
const sendVoiceMessage = () => {
  if (!recordedAudioBase64.value) {
    uni.showToast({ icon: 'none', title: '请先录音' })
    return
  }
  if (props.sending) return

  emit('send', {
    content: '',
    features: features.value,
    audio: recordedAudioBase64.value,
  })
  recordedAudioBase64.value = ''
  // 录音发送后切换回文字模式
  inputMode.value = 'text'
}

const handleSend = () => {
  const hasText = inputText.value.trim().length > 0
  const hasImage = props.selectedImages.length > 0

  if ((!hasText && !hasImage) || props.sending) return

  emit('send', {
    content: inputText.value,
    features: features.value,
  })
  inputText.value = ''
}

const handleCamera = () => {
  showToolPanel.value = false
  emit('camera')
}

const handleAlbum = () => {
  showToolPanel.value = false
  emit('album')
}

const toggleFeature = (feature) => {
  features.value[feature] = !features.value[feature]
}

const removeImage = (idx) => {
  emit('removeImage', idx)
}
</script>

<style lang="scss" scoped>
/* 顶部功能条 */
.function-top-bar {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.top-switch-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: #f8f2ea;
  padding: 6rpx 16rpx;
  border-radius: 30rpx;
  font-size: 22rpx;
  color: #4a3a2e;

  &.active {
    background: #b86b3f;
    color: white;
  }
  .icon {
    font-size: 24rpx;
  }
}

.input-area {
  background: #ffffff;
  border-top: 2rpx solid #f0e0d2;
  border-radius: 32rpx 32rpx 0 0;
  padding: 20rpx 30rpx 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  box-shadow: 0 -6rpx 20rpx -12rpx #a6897a;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

/* 加号按钮 */
.plus-icon {
  width: 60rpx;
  height: 60rpx;
  background: #fceee4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .plus {
    font-size: 48rpx;
    color: #b86b3f;
    line-height: 1;
  }
}

/* 语音/键盘切换按钮 */
.voice-keyboard-toggle {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .toggle-icon {
    width: 44rpx;
    height: 44rpx;
  }
}

.text-input-wrapper {
  flex: 1;
  background: #f8f2ea;
  border-radius: 40rpx;
  padding: 2rpx 24rpx;
  border: 2rpx solid #ead9ca;

  input {
    width: 100%;
    background: transparent;
    padding: 16rpx 0;
    font-size: 28rpx;
    color: #332b22;

    &::placeholder {
      color: #b99f8b;
    }
  }
}

/* 语音输入框样式 */
.voice-input-wrapper {
  flex: 1;
  background: #f8f2ea;
  border-radius: 40rpx;
  padding: 2rpx 24rpx;
  border: 2rpx solid #ead9ca;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .voice-placeholder {
    font-size: 28rpx;
    color: #b99f8b;
  }
}

.send-button {
  width: 60rpx;
  height: 60rpx;
  background: #b86b3f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid white;
  box-shadow: 0 6rpx 12rpx -6rpx #7b5e4a;
  flex-shrink: 0;

  image {
    width: 28rpx;
    height: 28rpx;
  }

  &.disabled {
    opacity: 0.5;
  }
}

/* 工具面板 */
.tool-panel {
  display: flex;
  gap: 40rpx;
  padding: 24rpx;
  margin-top: 12rpx;
  background: #faf5ef;
  border-radius: 20rpx;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  font-size: 26rpx;
  color: #333;
}

.tool-icon {
  width: 50rpx;
  height: 50rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 10rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 图片预览 */
.image-preview {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-bottom: 16rpx;
}
.image-item {
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
  background: #f1f1f1;
}
.image-item image {
  width: 100%;
  height: 100%;
}
.del {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 20rpx;
  width: 36rpx;
  height: 36rpx;
  line-height: 36rpx;
  text-align: center;
}

/* 录音时的反馈 */
.voice-input-wrapper:active {
  background: #e8ddd2;
}
</style>
