<template>
  <view class="markdown-content">
    <rich-text :nodes="parsedContent"></rich-text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
})

// 简单markdown解析（可替换为更强大的库如marked）
const parsedContent = computed(() => {
  let html = props.content
    .replace(/\n/g, '<br/>')
    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<image class="markdown-image" src="$2" alt="$1"></image>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')

  return html
})
</script>

<style lang="scss" scoped>
.markdown-content {
  font-size: 28rpx;
  line-height: 1.6;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;

  :deep(pre) {
    background: #f5f2f0;
    padding: 20rpx;
    border-radius: 16rpx;
    overflow-x: auto;
    margin: 20rpx 0;
  }

  :deep(code) {
    background: #f5f2f0;
    padding: 4rpx 8rpx;
    border-radius: 8rpx;
    font-family: monospace;
    word-break: break-all;
  }

  :deep(.markdown-image) {
    max-width: 100%;
    width: 100%;
    height: auto;
    border-radius: 16rpx;
    margin: 10rpx 0;
  }

  :deep(a) {
    color: #b86b3f;
    text-decoration: underline;
    word-break: break-all;
  }

  :deep(p) {
    word-wrap: break-word;
    word-break: break-word;
  }

  :deep(div) {
    word-wrap: break-word;
    word-break: break-word;
  }
}
</style>
