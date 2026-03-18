<template>
  <view class="markdown-container">
    <view class="markdown-item" v-for="(item, index) in contentList" :key="index">
      <text class="markdown-title" v-if="item.type === 'title'">{{ item.text }}</text>
      <text class="markdown-text" v-else-if="item.type === 'text'">{{ item.text }}</text>
      <view class="markdown-list" v-else-if="item.type === 'list'">
        <text class="list-item" v-for="(li, idx) in item.list" :key="idx">• {{ li }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  contentList: {
    type: Array,
    default: () => [],
  },
})
</script>

<style lang="scss" scoped>
.markdown-container {
  padding: 10rpx 0;

  .markdown-item {
    margin-bottom: 20rpx;
  }

  .markdown-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #332b22;
    margin-bottom: 12rpx;
    display: block;
  }

  .markdown-text {
    font-size: 30rpx;
    color: #555;
    line-height: 1.6;
    display: block;
  }

  .markdown-list {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    margin-top: 12rpx;
  }

  .list-item {
    font-size: 28rpx;
    color: #666;
  }
}
</style>
