<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="header-left" @click="goBack">
        <image class="back-icon" src="/static/icon/arrow_left.png" mode="aspectFit"></image>
        <text class="header-title">服务详情</text>
      </view>
      <view class="header-right">
        <text class="icon">🔍</text>
        <text class="icon">⋯</text>
      </view>
    </view>

    <!-- 轮播图 -->
    <view class="swiper-box">
      <swiper class="swiper" indicator-dots circular>
        <swiper-item v-for="(img, idx) in bannerList" :key="idx">
          <image class="swiper-img" :src="img" mode="aspectFill"></image>
        </swiper-item>
      </swiper>
    </view>

    <!-- 服务基础信息 -->
    <view class="base-info">
      <text class="service-name">{{ detail.name }}</text>
      <text class="service-subtitle">{{ detail.subtitle }}</text>
      <view class="meta-row">
        <text>⭐ {{ detail.ratingScore }} 分</text>
        <text>销量 {{ detail.totalSales }}</text>
        <text>月售 {{ detail.monthlySales }}</text>
      </view>
      <view class="tag-list">
        <text class="tag" v-for="tag in tagArray" :key="tag">{{ tag }}</text>
      </view>
    </view>

    <!-- 价格 -->
    <view class="price-section">
      <text class="price">¥{{ detail.basePrice }}</text>
      <text class="original-price">¥{{ detail.originalPrice }}</text>
      <text class="unit">{{ detail.unit }}</text>
    </view>

    <!-- 服务区域 -->
    <view class="service-area">
      <text class="label">服务区域：</text>
      <text class="value">{{ serviceAreaText }}</text>
    </view>

    <!-- 服务介绍 -->
    <view class="section">
      <text class="section-title">服务介绍</text>
      <view class="content-text">{{ detail.description }}</view>
    </view>

    <!-- 商家信息 -->
    <view class="merchant-section">
      <view class="merchant-info">
        <text class="avatar">🏪</text>
        <view>
          <text class="merchant-name">{{ detail.merchantName }}</text>
          <text class="merchant-desc">专业服务商家</text>
        </view>
      </view>
    </view>

    <!-- 底部 -->
    <view class="bottom-bar">
      <view class="btn-left" @click="handleCar">收藏</view>
      <view class="btn-right" @click="handleBook">立即预约</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getServiceDetail } from '@/service/services.js'
import { addCart } from '@/service/services.js'

const { safeAreaInsets } = uni.getSystemInfoSync()

const detail = ref({})
const bannerList = ref([])
const tagArray = ref([])
const serviceAreaText = ref('')

onMounted(() => {
  // ✅ 正确获取 id
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = currentPage.options.id
  console.log('服务ID:', id)
  if (id) {
    fetchDetail(id)
  }
})

// 获取服务详情
const fetchDetail = async (id) => {
  const res = await getServiceDetail(id)
  detail.value = res.data

  // 解析轮播图
  if (detail.value.bannerImages) {
    bannerList.value = JSON.parse(detail.value.bannerImages)
  }

  // 解析标签
  if (detail.value.tags) {
    tagArray.value = detail.value.tags.split(',')
  }

  // 解析服务区域
  if (detail.value.serviceArea) {
    const areaArr = JSON.parse(detail.value.serviceArea)
    serviceAreaText.value = areaArr.join('、')
  }
}

const goBack = () => uni.navigateBack()
const handleCar = async () => {
  try {
    await addCart({
      merchantId: detail.value.merchantId,
      serviceId: detail.value.id,
      specId: 1,
      quantity: 1,
    })
    uni.showToast({ title: '收藏成功', icon: 'success' })
  } catch (err) {
    uni.showToast({ title: '加入失败', icon: 'none' })
  }
}
const handleBook = () => {
  uni.navigateTo({
    url: `/pages/services/book?service=${JSON.stringify(detail.value)}`,
  })
}
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  min-height: 100vh;
  padding-bottom: 20rpx;
}

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: #faf5ef;
  border-bottom: 2rpx solid #f0d4b8;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  .back-icon {
    width: 36rpx;
    height: 36rpx;
  }

  .header-title {
    font-size: 45rpx;
    color: #332b22;
    font-weight: bold;
  }

  .header-right {
    display: flex;
    gap: 30rpx;
    font-size: 36rpx;
    color: #332b22;
  }
}

/* 轮播 */
.swiper-box {
  width: 100%;
  height: 400rpx;
  .swiper {
    width: 100%;
    height: 100%;
  }
  .swiper-img {
    width: 100%;
    height: 100%;
  }
}

/* 基础信息 */
.base-info {
  padding: 30rpx;
  .service-name {
    font-size: 44rpx;
    font-weight: bold;
    color: #332b22;
  }
  .service-subtitle {
    font-size: 28rpx;
    color: #999;
    margin-top: 8rpx;
    display: block;
  }
  .meta-row {
    display: flex;
    gap: 20rpx;
    margin-top: 16rpx;
    font-size: 26rpx;
    color: #666;
  }
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 16rpx;
  }
  .tag {
    background: #fff;
    padding: 8rpx 20rpx;
    border-radius: 30rpx;
    font-size: 24rpx;
    color: #666;
  }
}

/* 价格 */
.price-section {
  padding: 0 30rpx;
  margin-bottom: 20rpx;
  .price {
    font-size: 48rpx;
    color: #ff5f3f;
    font-weight: bold;
  }
  .original-price {
    font-size: 28rpx;
    color: #999;
    text-decoration: line-through;
    margin-left: 16rpx;
  }
  .unit {
    font-size: 26rpx;
    color: #666;
    margin-left: 10rpx;
  }
}

/* 服务区域 */
.service-area {
  padding: 0 30rpx;
  margin-bottom: 30rpx;
  font-size: 28rpx;
  color: #666;
}

/* 区块 */
.section {
  background: #fff;
  margin: 0 30rpx 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  .section-title {
    font-size: 34rpx;
    font-weight: bold;
    margin-bottom: 20rpx;
    color: #332b22;
  }
  .content-text {
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;
  }
}

/* 商家 */
.merchant-section {
  background: #fff;
  margin: 0 30rpx 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  .merchant-info {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }
  .avatar {
    width: 60rpx;
    height: 60rpx;
    background: #f5e9d7;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
  }
  .merchant-name {
    font-size: 32rpx;
    font-weight: bold;
  }
  .merchant-desc {
    font-size: 24rpx;
    color: #999;
  }
}

/* 底部 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  display: flex;
  border-top: 1rpx solid #eee;

  .btn-left {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    color: #666;
  }
  .btn-right {
    flex: 2;
    background: #ff5f3f;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: bold;
  }
}
</style>
