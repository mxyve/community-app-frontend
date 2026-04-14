<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 10 + 'px' }">
    <!-- 顶部定位栏 - 点击选择地区 -->
    <view class="location-bar" @click="goToSelectAddress">
      <image class="loc-icon" src="/static/images/diqiu.png" mode="aspectFit"></image>
      <text class="loc-text">{{ showLocation }}</text>
      <image class="arrow" src="/static/icon/arrow_down.png" mode="aspectFill"></image>
    </view>

    <view class="divider"></view>

    <!-- 轮播图 -->
    <swiper
      class="banner-swiper"
      :indicator-dots="true"
      :autoplay="true"
      :interval="3000"
      :duration="500"
      indicator-color="#fff"
      indicator-active-color="#c48b66"
    >
      <swiper-item v-for="(item, index) in bannerList" :key="index">
        <image class="banner-img" :src="item.src" mode="aspectFill"></image>
      </swiper-item>
    </swiper>

    <!-- 社区活动模块 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">社区资讯</text>
        <text class="section-more" @click="goToInformation">更多→</text>
      </view>
      <view class="activity-grid">
        <view class="activity-item" @click="goToInformation">
          <view class="activity-icon">
            <image src="/static/icon/trash.svg" mode="aspectFit"></image>
          </view>
          <text class="activity-name">垃圾分类</text>
        </view>
        <view class="activity-item" @click="goToInformation">
          <view class="activity-icon">
            <image src="/static/icon/science.svg" mode="aspectFit"></image>
          </view>
          <text class="activity-name">知识科普</text>
        </view>
        <view class="activity-item" @click="goToInformation">
          <view class="activity-icon">
            <image src="/static/icon/electric.svg" mode="aspectFit"></image>
          </view>
          <text class="activity-name">家电安全</text>
        </view>
      </view>
    </view>

    <!-- 生活帮手服务列表 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">生活帮手</text>
        <text class="section-more" @click="goToservice">更多→</text>
      </view>

      <!-- 服务列表 - 两列网格 -->
      <view class="service-list">
        <view
          class="service-item"
          v-for="item in serviceList"
          :key="item.id"
          @click="goToServiceDetail(item.id)"
        >
          <view class="service-card">
            <view class="service-cover">
              <text class="service-emoji">{{ getServiceEmoji(item.categoryId) }}</text>
              <text class="like-icon" @click.stop="toggleLike(item.id)">
                {{ item.isLike ? '❤️' : '🤍' }}
              </text>
            </view>
            <view class="service-info">
              <text class="service-name">{{ item.name }}</text>
              <text class="service-subtitle">{{
                item.subtitle || item.description?.substring(0, 20)
              }}</text>
              <view class="service-meta">
                <text class="rating">⭐ {{ item.ratingScore || 4.5 }}</text>
                <text class="sales">已售{{ item.monthlySales || 0 }}</text>
              </view>
              <text class="service-price">¥{{ item.basePrice }}起</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="load-more" v-if="serviceLoading">加载中...</view>
      <view class="load-more" v-else-if="serviceList.length === 0">暂无服务</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getUserLocation } from '@/service/location.js'
import { getServicePage } from '@/service/services.js'

const { safeAreaInsets } = uni.getSystemInfoSync()

// 显示选中的地区
const showLocation = ref('请选择地区')

const bannerList = ref([
  { src: '/static/images/banner1.png' },
  { src: '/static/images/banner2.png' },
  { src: '/static/images/banner3.png' },
])

// 服务列表相关
const serviceList = ref([])
const serviceLoading = ref(false)
const userLocation = ref({
  province: '',
  city: '',
  district: '',
})

// 服务emoji映射
const serviceEmojiMap = {
  1: '🔧', // 家政保洁
  2: '🧹', // 家电维修
  3: '🐕', // 宠物寄养
  4: '👴', // 助老陪护
  5: '🔓', // 开锁换锁
  6: '🚗', // 洗车保养
}

// 获取服务emoji
const getServiceEmoji = (categoryId) => {
  return serviceEmojiMap[categoryId] || '📌'
}

// 获取服务列表（首页只显示前4条）
async function fetchServiceList() {
  serviceLoading.value = true
  try {
    const res = await getServicePage({
      current: 1,
      size: 4,
      province: userLocation.value.province,
      city: userLocation.value.city,
      district: userLocation.value.district,
    })

    if (res.code === 200 && res.data) {
      const records = res.data.records || []
      serviceList.value = records.map((item) => ({
        ...item,
        isLike: false,
      }))
    }
  } catch (err) {
    console.error('获取服务列表失败', err)
  } finally {
    serviceLoading.value = false
  }
}

// 收藏/取消收藏
const toggleLike = (serviceId) => {
  const item = serviceList.value.find((i) => i.id === serviceId)
  if (item) item.isLike = !item.isLike
}

// 跳转到服务详情
const goToServiceDetail = (serviceId) => {
  uni.navigateTo({
    url: `/pages/services/serviceDetail?id=${serviceId}`,
  })
}

// 跳转到地址选择页面
function goToSelectAddress() {
  uni.navigateTo({
    url: '/pages/index/address',
  })
}

function goToInformation() {
  uni.navigateTo({
    url: '/pages/content/information/informationList',
  })
}

function goToservice() {
  uni.navigateTo({
    url: '/pages/services/serviceList',
  })
}

// 获取最新位置（用于显示）
async function fetchUserLocation() {
  try {
    const res = await getUserLocation()
    if (res.code === 200 && res.data) {
      showLocation.value = res.data.fullText || '请选择地区'
      console.log('showLocation用户位置', res.data)
      userLocation.value = {
        province: res.data.province || '',
        city: res.data.city || '',
        district: res.data.district || '',
      }
    }
  } catch (e) {
    showLocation.value = '请选择地区'
    console.error('获取位置失败', e)
  }
}

onMounted(async () => {
  // 👇 加这一句，登录回来立刻获取位置
  await fetchUserLocation()
  await fetchServiceList()

  // 监听地址更新
  uni.$on('addressSelected', async (addressInfo) => {
    showLocation.value = addressInfo.fullText || '请选择地区'

    userLocation.value = {
      province: addressInfo.province || '',
      city: addressInfo.city || '',
      district: addressInfo.district || '',
    }

    await fetchServiceList()
  })

  uni.$on('loginSuccess', async () => {
    console.log('登录成功，刷新位置')
    await fetchUserLocation()
    await fetchServiceList()
  })
})

// 页面卸载时移除监听
onUnmounted(() => {
  uni.$off('addressSelected')
})
</script>

<style lang="scss" scoped>
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
}

.banner-swiper {
  width: calc(100% - 60rpx);
  height: 320rpx;
  margin: 20rpx 30rpx 30rpx;
  border-radius: 24rpx;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
}

::v-deep .uni-swiper-dot {
  background: rgba(255, 255, 255, 0.5);
}

::v-deep .uni-swiper-dot-active {
  background: #c48b66;
}

.section {
  padding: 0 30rpx 20rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;

    .section-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #332b22;
    }
    .section-more {
      font-size: 28rpx;
      color: #c48b66;
    }
  }

  .activity-grid {
    display: flex;
    gap: 60rpx;
    padding-left: 20rpx;

    .activity-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12rpx;

      .activity-icon {
        width: 120rpx;
        height: 120rpx;
        border-radius: 50%;
        background: #e8f5e9;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

        image {
          width: 60rpx;
          height: 60rpx;
        }
      }

      .activity-name {
        font-size: 28rpx;
        color: #332b22;
        font-weight: 500;
      }
    }
  }
}

/* 服务列表 - 两列网格 */
.service-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.service-item {
  .service-card {
    background: #fff;
    border-radius: 24rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

    .service-cover {
      height: 160rpx;
      background: #f9e0c7;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;

      .service-emoji {
        font-size: 64rpx;
      }

      .like-icon {
        position: absolute;
        top: 16rpx;
        right: 16rpx;
        font-size: 32rpx;
      }
    }

    .service-info {
      padding: 20rpx;
      display: flex;
      flex-direction: column;
      gap: 8rpx;

      .service-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #332b22;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .service-subtitle {
        font-size: 24rpx;
        color: #999;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .service-meta {
        display: flex;
        align-items: center;
        gap: 20rpx;
        font-size: 24rpx;
        color: #666;
      }

      .service-price {
        font-size: 32rpx;
        font-weight: bold;
        color: #d2691e;
      }
    }
  }
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 28rpx;
}
</style>
