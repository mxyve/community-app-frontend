<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 10 + 'px' }">
    <!-- 顶部定位栏 - 点击选择地区 -->
    <view class="location-bar" @click="goToSelectAddress">
      <image class="loc-icon" src="/static/images/diqiu.png" mode="aspectFit"></image>
      <text class="loc-text">{{ showLocation }}</text>
      <image class="arrow" src="/static/icon/arrow_down.png" mode="aspectFill"></image>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const { safeAreaInsets } = uni.getSystemInfoSync()

// 跳转到地址选择页面
function goToSelectAddress() {
  uni.navigateTo({
    url: '/pages/index/address',
  })
}

// 显示选中的地区
const showLocation = ref('请选择地区')

// 页面显示时，接受上一页传回来的地址（非常重要）
onMounted(() => {
  // 监听页面显示，获取选择后的地址
  uni.$on('addressSelected', (addressInfo) => {
    showLocation.value = addressInfo.fullText || '请选择地区'
  })
})

// 页面卸载时移除监听
onUnmounted(() => {
  uni.$off('addressSelected')
})
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.location-bar {
  display: flex;
  align-items: center;
  height: 62rpx;
  margin: 30rpx 30rpx;
  padding: 10rpx 30rpx;
  background: #fff;
  border-radius: 40rpx;
  box-shadow: 0 2rpx 10rpx rgba(196, 139, 102, 0.25);
  width: fit-content;
  max-width: 80%;

  .loc-icon {
    width: 35rpx;
    height: 35rpx;
    margin-right: 12rpx;
  }
  .loc-text {
    flex: 1;
    font-size: 28rpx;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .arrow {
    width: 30rpx;
    height: 30rpx;
    margin-left: 8rpx;
  }
}
</style>
