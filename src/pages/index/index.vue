<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 10 + 'px' }">
    <!-- 顶部定位栏 - 点击选择地区 -->
    <view class="location-bar" @click="goToSelectAddress">
      <image class="loc-icon" src="/static/images/diqiu.png" mode="aspectFit"></image>
      <text class="loc-text">{{ showLocation }}</text>
      <image class="arrow" src="/static/icon/arrow_down.png" mode="aspectFill"></image>
    </view>

    <view class="divider"></view>

    <!-- 公告区域 -->
    <view class="notice-bar" @click="goToNoticeDetail">
      <image class="notice-icon" src="/static/images/notice.png" mode="aspectFit"></image>
      <text class="notice-label">社区公告：</text>
      <text class="notice-content">{{ noticeContent }}</text>
    </view>

    <view @click="goToservice">
      <text>生活帮手：</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const { safeAreaInsets } = uni.getSystemInfoSync()

// 显示选中的地区
const showLocation = ref('请选择地区')

// 社区公告
const noticeContent = ref('周末跳蚤市场...')

// 跳转到地址选择页面
function goToSelectAddress() {
  uni.navigateTo({
    url: '/pages/index/address',
  })
}

// 跳转到公告页面
function goToNoticeDetail() {
  uni.navigateTo({
    url: '/pages/index/notice',
  })
}

function goToservice() {
  uni.navigateTo({
    url: '/pages/services/serviceList',
  })
}

// 页面显示时，接受上一页传回来的地址（非常重  要）
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
// 引入颜色变量
@import '@/uni.scss';

.container {
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.location-bar {
  display: flex;
  align-items: center;
  height: 54rpx;
  margin: 0rpx 0rpx 12rpx 30rpx;
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

.divider {
  height: 2rpx;
  background: #f0d4b8;
  margin: 2rpx 0rpx 2rpx 0rpx;
  // width: calc(100% - 60rpx);
}

.notice-bar {
  display: flex;
  align-items: center;
  height: 88rpx;
  margin: 12rpx 30rpx 30rpx;
  padding: 0 30rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 10rpx rgba(196, 139, 102, 0.25);
  max-width: 80%;

  .notice-icon {
    width: 40rpx;
    height: 40rpx;
    margin-right: 20rpx;
  }

  .notice-label {
    font-size: 32rpx;
    color: #c48b66;
    font-weight: 600;
    margin-right: 16rpx;
  }

  .notice-content {
    flex: 1;
    font-size: 28rpx;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
