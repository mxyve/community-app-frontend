<template>
  <view class="my">
    <view>用户信息：{{ userStore.userInfo }}</view>
    <button @tap="handleQuitClick" @top="userStore.clearUserInfo()" size="mini" plain type="warn">
      清理用户信息
    </button>
    <uni-section title="设置" type="line">
      <uni-list>
        <uni-list-item showArrow title="去登录" :to="`/pages/login/login`" />
      </uni-list>
    </uni-section>
  </view>

  <view class="father">
    father
    <view class="son">son</view>
  </view>
</template>

<script setup>
import { logout } from '@/service/user'
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()

/**
 * 退出登录
 */
const handleQuitClick = () => {
  uni.showModal({
    title: '你确定要退出吗?',
    success: async (res) => {
      if (res.confirm) {
        const res = await logout()
        if (res.code === 200) {
          userStore.clearUserInfo()
          uni.removeStorageSync('token')
          uni.showToast({
            title: '退出登录成功',
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
.father {
  height: 200rpx;
  padding: 10rpx;
  background-color: #3fbbe5;
  .son {
    height: 100rpx;
    background-color: #8dc9dc;
  }
}
</style>
