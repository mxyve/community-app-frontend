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

    <!-- 输入行：加号 + 输入框 + 发送 -->
    <view class="input-row">
      <!-- 加号按钮 -->
      <view class="plus-icon" @click="showToolPanel = !showToolPanel">
        <text class="plus">+</text>
      </view>

      <view class="text-input-wrapper">
        <input
          type="text"
          v-model="inputText"
          placeholder="向AI助手提问..."
          @confirm="handleSend"
          :disabled="sending"
        />
      </view>

      <view
        class="send-button"
        :class="{ disabled: (inputText.length === 0 && selectedImages.length === 0) || sending }"
        @click="handleSend"
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

const showToolPanel = ref(false) // 加号面板显示

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

const handleSend = () => {
  // 只要有文字 或 有图片 就能发送
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
  emit('camera')
}

const handleAlbum = () => {
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

/* 加号按钮 */
.plus-icon {
  width: 60rpx;
  height: 60rpx;
  background: #fceee4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #666;
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

.input-area {
  background: #ffffff;
  border-top: 2rpx solid #f0e0d2;
  border-radius: 32rpx 32rpx 0 0;
  padding: 20rpx 30rpx 30rpx; // 调整底部内边距
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); // 适配底部安全区
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  box-shadow: 0 -6rpx 20rpx -12rpx #a6897a;
  flex-shrink: 0; /* 防止输入框被压缩 */
  position: relative;
  z-index: 10;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
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

  image {
    width: 28rpx;
    height: 28rpx;
  }

  &.disabled {
    opacity: 0.5;
  }
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
</style>
