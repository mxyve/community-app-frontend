<template>
  <view class="input-area">
    <!-- 输入行 -->
    <view class="input-row">
      <view class="camera-icon" @click="handleCamera">
        <image src="/static/icon/camera.png" mode="aspectFit"></image>
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
      <view class="send-button" :class="{ disabled: !inputText || sending }" @click="handleSend">
        <image src="/static/icon/send.png" mode="aspectFit"></image>
      </view>
    </view>

    <!-- 功能开关 -->
    <view class="function-switches">
      <view
        class="switch-item"
        :class="{ active: features.webSearch }"
        @click="toggleFeature('webSearch')"
      >
        <text class="icon">🌐</text>
        <text>联网搜索</text>
      </view>
      <view
        class="switch-item"
        :class="{ active: features.deepThink }"
        @click="toggleFeature('deepThink')"
      >
        <text class="icon">🧠</text>
        <text>深度思考</text>
      </view>
      <view class="switch-item" @click="handleAttachment">
        <text class="icon">📎</text>
        <text>附件</text>
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
})

const emit = defineEmits(['send', 'camera', 'attachment'])

const inputText = ref('')
const features = ref({
  webSearch: false,
  deepThink: false,
})

const handleSend = () => {
  if (!inputText.value.trim() || props.sending) return
  emit('send', {
    content: inputText.value,
    features: features.value,
  })
  inputText.value = ''
}

const handleCamera = () => {
  emit('camera')
}

const handleAttachment = () => {
  emit('attachment')
}

const toggleFeature = (feature) => {
  features.value[feature] = !features.value[feature]
}
</script>

<style lang="scss" scoped>
.input-area {
  background: #ffffff;
  border-top: 2rpx solid #f0e0d2;
  border-radius: 32rpx 32rpx 0 0;
  padding: 20rpx 30rpx 30rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  box-shadow: 0 -6rpx 20rpx -12rpx #a6897a;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.camera-icon {
  width: 60rpx;
  height: 60rpx;
  background: #fceee4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid white;
  box-shadow: 0 4rpx 10rpx -6rpx #a6897a;

  image {
    width: 32rpx;
    height: 32rpx;
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

.function-switches {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 4rpx 0;
}

.switch-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: #f8f2ea;
  padding: 6rpx 20rpx;
  border-radius: 40rpx;
  border: 2rpx solid #ead9ca;
  font-size: 24rpx;
  color: #4a3a2e;

  &.active {
    background: #b86b3f;
    color: white;
    border-color: #b86b3f;
  }

  .icon {
    font-size: 28rpx;
  }
}
</style>
