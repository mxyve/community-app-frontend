<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 10 + 'px' }">
    <view class="app-screen">
      <!-- 标题区 -->
      <view class="magazine-header">
        <view class="logo-area">
          <text class="logo-main">邻里集</text>
          <text class="logo-sub">我的</text>
        </view>
      </view>

      <!-- 个人资料卡片 -->
      <view class="profile-card">
        <view class="profile-avatar">
          <image
            v-if="userStore.userInfo?.avatar"
            :src="userStore.userInfo.avatar"
            mode="aspectFill"
            class="avatar-image"
          />
          <text v-else class="avatar-placeholder">👤</text>
        </view>
        <view class="profile-info">
          <view class="profile-name">
            {{ userStore.userInfo?.nickName || '设置昵称' }}
          </view>
          <view class="profile-phone">
            {{ formatPhone(userStore.userInfo?.phone) }}
          </view>
          <view class="profile-location" v-if="userStore.userInfo?.province">
            {{
              formatLocation(
                userStore.userInfo?.province,
                userStore.userInfo?.city,
                userStore.userInfo?.district,
              )
            }}
          </view>
        </view>
        <view class="profile-edit" @click="goToEditProfile">✎</view>
      </view>

      <!-- 我的订单区域 -->
      <view class="order-stats-section">
        <view class="section-label">
          <text class="section-title">我的订单</text>
          <text class="section-link">查看全部 →</text>
        </view>
        <view class="stats-grid">
          <view class="stat-card" @click="goToCollections">
            <text class="stat-number">3</text>
            <text class="stat-label">我的收藏</text>
          </view>
          <view class="stat-card" @click="goToOrders">
            <text class="stat-number">3</text>
            <text class="stat-label">全部订单</text>
          </view>
          <view class="stat-card">
            <text class="stat-number">1</text>
            <text class="stat-label">待服务</text>
          </view>
          <view class="stat-card" @click="goToReviews">
            <text class="stat-number">2</text>
            <text class="stat-label">我的评价</text>
          </view>
        </view>
      </view>

      <!-- 邻里圈模块 -->
      <view class="neighborhood-stats-section">
        <view class="section-label">
          <text class="section-title">邻里圈</text>
          <text class="section-link">全部记录 →</text>
        </view>
        <view class="neighborhood-grid">
          <view class="neighbor-card" @click="goToPosts">
            <text class="neighbor-icon">📝</text>
            <text class="neighbor-number">{{ myPostCount }}</text>
            <text class="neighbor-title">我的发布</text>
          </view>
          <view class="neighbor-card" @click="goToLikes">
            <text class="neighbor-icon">❤️</text>
            <text class="neighbor-number">{{ myLikeCount }}</text>
            <text class="neighbor-title">我的点赞</text>
          </view>
          <view class="neighbor-card" @click="goToComments">
            <text class="neighbor-icon">💬</text>
            <text class="neighbor-number">{{ myComments }}</text>
            <text class="neighbor-title">我的评论</text>
          </view>
        </view>
      </view>

      <!-- 功能菜单列表 -->
      <view class="menu-section">
        <view class="menu-list">
          <view class="menu-item" @click="goToFeedback">
            <view class="menu-left">
              <view class="menu-icon">📝</view>
              <text class="menu-text">意见反馈</text>
            </view>
            <text class="menu-arrow">→</text>
          </view>
          <view class="menu-item" @click="goToAbout">
            <view class="menu-left">
              <view class="menu-icon">ℹ️</view>
              <text class="menu-text">关于平台</text>
            </view>
            <text class="menu-arrow">→</text>
          </view>
          <view class="menu-item" @click="goToSettings">
            <view class="menu-left">
              <view class="menu-icon">⚙️</view>
              <text class="menu-text">系统设置</text>
            </view>
            <text class="menu-arrow">→</text>
          </view>
        </view>
      </view>

      <!-- 退出登录按钮 -->
      <view class="logout-section">
        <view class="logout-btn" @tap="handleQuitClick">
          <view class="logout-icon">🚪</view>
          <text class="logout-text">退出登录</text>
          <text class="logout-arrow">→</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { logout } from '@/service/user'
import { useUserStore } from '@/stores/user'
import { countMyLikeArticles, countMyPostArticles, countMyComments } from '@/service/community.js'

const { safeAreaInsets } = uni.getSystemInfoSync()
const userStore = useUserStore()

// 邻里圈统计数量
const myPostCount = ref(0)
const myLikeCount = ref(0)
const myComments = ref(0)

onShow(() => {
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo) {
    userStore.setUserInfo(userInfo)
  }
  fetchMyCommunityCount()
})

// 获取我的发布、我的点赞数量
const fetchMyCommunityCount = async () => {
  try {
    // 我的发布数量
    const res1 = await countMyPostArticles()
    myPostCount.value = res1.data || 0
  } catch {
    myPostCount.value = 0
  }

  try {
    // 我的点赞数量
    const res2 = await countMyLikeArticles()
    myLikeCount.value = res2.data || 0
  } catch {
    myLikeCount.value = 0
  }

  try {
    // 我的点赞数量
    const res3 = await countMyComments()
    myComments.value = res3.data || 0
  } catch {
    myComments.value = 0
  }
}

function goToEditProfile() {
  uni.navigateTo({
    url: '/pages/my/editProfile',
  })
}

function goToCollections() {
  uni.navigateTo({
    url: '/pages/my/services/collections',
  })
}

function goToOrders() {
  uni.navigateTo({
    url: '/pages/my/services/orders',
  })
}

function goToReviews() {
  uni.navigateTo({
    url: '/pages/my/services/reviews',
  })
}

function goToPosts() {
  uni.navigateTo({
    url: '/pages/my/community/posts',
  })
}

function goToLikes() {
  uni.navigateTo({
    url: '/pages/my/community/likes',
  })
}

function goToComments() {
  uni.navigateTo({
    url: '/pages/my/community/comments',
  })
}

function goToFeedback() {
  uni.navigateTo({
    url: '/pages/my/feedback',
  })
}

function goToAbout() {
  uni.navigateTo({
    url: '/pages/my/about',
  })
}

function goToSettings() {
  uni.navigateTo({
    url: '/pages/my/settings',
  })
}

/**
 * 格式化手机号（隐藏中间4位）
 */
const formatPhone = (phone) => {
  if (!phone) return '未绑定手机号'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 格式化位置信息
 */
const formatLocation = (province, city, district) => {
  const parts = []
  if (province) parts.push(province)
  if (city && city !== province) parts.push(city)
  if (district) parts.push(district)
  return parts.join(' ') || '未设置位置'
}

/**
 * 退出登录
 */
const handleQuitClick = () => {
  uni.showModal({
    title: '提示',
    content: '你确定要退出吗?',
    success: async (res) => {
      if (res.confirm) {
        const resData = await logout()
        if (resData.code === 200) {
          userStore.clearUserInfo()
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.showToast({
            title: '退出登录成功',
            icon: 'success',
          })
          uni.reLaunch({
            url: '/pages/login/login',
          })
        }
      }
    },
  })
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.container {
  background: $bg-primary;
  min-height: 100vh;
}

.app-screen {
  display: flex;
  flex-direction: column;
  min-height: 780px;
  background: #f8f6f2;
  position: relative;
}

.magazine-header {
  padding: 0px 20px 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0e4d8;
}

.logo-area {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.logo-main {
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(135deg, #c36a2d, #b25f3a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.logo-sub {
  font-size: 12px;
  color: #9b7b6b;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.profile-card {
  margin: 12px 20px 8px;
  background: #ffffff;
  border-radius: 24px;
  padding: 20px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow:
    0 20px 30px -15px #c4a690,
    0 4px 0 0 #e8d9cc;
  border: 1px solid #f5e6d9;
  position: relative;
}

.profile-avatar {
  width: 70px;
  height: 70px;
  background: #fde6d2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #b86b3f;
  border: 4px solid white;
  box-shadow: 0 8px 16px -8px #d4b6a0;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 32px;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 22px;
  font-weight: 700;
  color: #4a3a2e;
  margin-bottom: 6px;
  letter-spacing: -0.3px;
}

.profile-phone {
  color: #9b7b6b;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.profile-location {
  color: #9b7b6b;
  font-size: 12px;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: '📍';
    font-size: 12px;
    opacity: 0.8;
  }
}

.profile-edit {
  position: absolute;
  top: 18px;
  right: 20px;
  color: #c6865a;
  font-size: 18px;
  background: #fff1e6;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px #e8d9cc;
}

.order-stats-section,
.neighborhood-stats-section {
  padding: 6px 20px 12px;
}

.section-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #4a3a2e;
  letter-spacing: -0.2px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 0;
    width: 32px;
    height: 3px;
    background: #c6865a;
    border-radius: 4px;
    opacity: 0.5;
  }
}

.section-link {
  color: #b86b3f;
  font-size: 12px;
  font-weight: 600;
  background: #fff1e6;
  padding: 4px 10px;
  border-radius: 40px;
}

.stats-grid {
  display: flex;
  gap: 8px;
}

.stat-card {
  flex: 1;
  background: #ffffff;
  border-radius: 20px;
  padding: 14px 4px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow:
    0 10px 20px -12px #c4a690,
    0 2px 0 0 #e8d9cc;
  border: 1px solid #f5e6d9;
}

.stat-number {
  font-size: 22px;
  font-weight: 800;
  color: #b86b3f;
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  color: #8f7a68;
  font-weight: 500;
  text-align: center;
  line-height: 1.3;
}

.neighborhood-grid {
  display: flex;
  gap: 8px;
}

.neighbor-card {
  flex: 1;
  background: #ffffff;
  border-radius: 20px;
  padding: 14px 4px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow:
    0 10px 20px -12px #c4a690,
    0 2px 0 0 #e8d9cc;
  border: 1px solid #f5e6d9;
}

.neighbor-icon {
  font-size: 26px;
  margin-bottom: 4px;
}

.neighbor-number {
  font-size: 22px;
  font-weight: 800;
  color: #b86b3f;
  line-height: 1;
}

.neighbor-title {
  font-size: 12px;
  color: #4a3a2e;
  font-weight: 600;
}

.menu-section {
  padding: 6px 20px 12px;
}

.menu-list {
  background: #ffffff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 20px 30px -15px #c4a690,
    0 4px 0 0 #e8d9cc;
  border: 1px solid #f5e6d9;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f5e6d9;

  &:last-child {
    border-bottom: none;
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.menu-icon {
  width: 36px;
  height: 36px;
  background: #fde6d2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #b86b3f;
}

.menu-text {
  font-weight: 600;
  color: #4a3a2e;
  font-size: 14px;
}

.menu-arrow {
  color: #c6865a;
  font-size: 18px;
}

.logout-section {
  padding: 6px 20px 20px;
}

.logout-btn {
  background: #ffffff;
  border-radius: 32px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow:
    0 12px 24px -12px #c4a690,
    0 4px 0 0 #e8d9cc;
  border: 1px solid #f5e6d9;
}

.logout-icon {
  width: 44px;
  height: 44px;
  background: #ffeae5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #d65757;
}

.logout-text {
  flex: 1;
  font-weight: 700;
  color: #d65757;
  font-size: 16px;
  letter-spacing: 0.3px;
}

.logout-arrow {
  color: #d65757;
  font-size: 22px;
  opacity: 0.6;
}
</style>
