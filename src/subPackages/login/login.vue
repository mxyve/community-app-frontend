<template>
  <view
    class="container"
    :style="{ paddingTop: safeAreaInsets.top + 10 + 'px', backgroundColor: '#f7f4ef' }"
  >
    <view class="login-page">
      <!-- 杂志风格背景纹理 -->
      <view class="magazine-bg"></view>

      <view class="content-wrapper">
        <!-- 主视觉区：温暖问候 -->
        <view class="hero-section">
          <view class="hero-title">验证码登录</view>
          <view class="hero-subtitle">未注册的手机号验证后自动完成注册</view>
        </view>

        <!-- 表单区：简洁平铺 -->
        <view class="form-wrapper">
          <!-- 手机号码输入 -->
          <view class="input-group">
            <view class="input-icon">📱</view>
            <input
              class="input-field"
              type="text"
              placeholder="手机号码"
              placeholder-class="input-placeholder"
              v-model="phoneForm.phone"
            />
          </view>

          <!-- 验证码输入 + 获取按钮 -->
          <view class="input-group code-group">
            <view class="input-icon">✉️</view>
            <input
              class="input-field code-input"
              type="text"
              placeholder="验证码"
              placeholder-class="input-placeholder"
              v-model="phoneForm.code"
            />
            <view
              class="code-btn"
              :class="{ 'code-btn-active': !timer, 'code-btn-disabled': timer }"
              @tap="sendPhoneCode"
            >
              <text v-if="!timer">获取验证码</text>
              <text v-else>{{ count }}秒后重试</text>
            </view>
          </view>

          <!-- 登录按钮：杂志色系渐变 -->
          <button class="login-btn" @tap="handleLoginClick" hover-class="login-btn-hover">
            <text class="btn-text">登录</text>
          </button>

          <!-- 杂志风格分割装饰 -->
          <view class="divider-section">
            <view class="divider-line"></view>
            <view class="divider-text">其他登录方式</view>
            <view class="divider-line"></view>
          </view>

          <!-- 微信登录：简洁样式 -->
          <view class="wx-login-card" @tap="wxLogin">
            <view class="wx-icon">💬</view>
            <view class="wx-text">微信一键登录</view>
            <view class="wx-arrow">↗</view>
          </view>

          <!-- 协议提示 -->
          <view class="legal-footer">
            <text>登录/注册即视为你同意</text>
            <text class="legal-link">《服务条款》</text>
            <text>和</text>
            <text class="legal-link">《隐私协议》</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { isCodeAvailable, isPhoneAvailable } from '@/utils/validate'
import { phoneLogin, sendCode, myWxLogin, getUserInfo } from '@/service/user'

const { safeAreaInsets } = uni.getSystemInfoSync()
const userStore = useUserStore()

// 倒计时
const count = ref(60)
const timer = ref(false)
let interval = null

// 登录表单数据
const phoneForm = reactive({
  phone: '',
  code: '',
})

/**
 * 发送手机验证码
 */
const sendPhoneCode = async () => {
  if (!phoneForm.phone || !isPhoneAvailable(phoneForm.phone)) {
    uni.showToast({
      title: '请输入正确的手机号码',
      icon: 'none',
      duration: 2000,
    })
    return
  }

  if (timer.value) return

  try {
    const res = await sendCode(phoneForm.phone)
    if (res.code === 200) {
      timer.value = true
      uni.showToast({
        title: '验证码发送成功',
        icon: 'success',
        duration: 1500,
      })

      if (interval) clearInterval(interval)
      interval = setInterval(() => {
        count.value--
        if (count.value <= 0) {
          timer.value = false
          count.value = 60
          clearInterval(interval)
          interval = null
        }
      }, 1000)
    } else {
      uni.showToast({
        title: res.message || '验证码发送失败',
        icon: 'none',
      })
    }
  } catch (error) {
    uni.showToast({
      title: '网络开小差了',
      icon: 'none',
    })
  }
}

/**
 * 手机号验证码登录
 */
const handleLoginClick = async () => {
  if (!phoneForm.phone || !isPhoneAvailable(phoneForm.phone)) {
    uni.showToast({
      title: '请输入正确的手机号码',
      icon: 'none',
    })
    return
  }

  if (!phoneForm.code || !isCodeAvailable(phoneForm.code)) {
    uni.showToast({
      title: '请输入6位验证码',
      icon: 'none',
    })
    return
  }

  try {
    uni.showLoading({ title: '登录中...', mask: true })
    const res = await phoneLogin(phoneForm.phone, phoneForm.code)
    uni.hideLoading()

    if (res.code === 200) {
      uni.setStorageSync('token', res.data.accessToken)
      await getLoginUserInfo()
      // 发送登录成功事件
      uni.$emit('loginSuccess')
      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
      })
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index',
        })
      }, 1500)
    } else {
      uni.showToast({
        title: res.message || '登录失败',
        icon: 'none',
      })
    }
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '登录异常，请稍后重试',
      icon: 'none',
    })
  }
}

/**
 * 微信登录
 */
const wxLogin = () => {
  // #ifdef MP-WEIXIN
  uni.getUserProfile({
    desc: '获取你的昵称、头像用于邻里展示',
    success: (userRes) => {
      uni.login({
        provider: 'weixin',
        success: async (loginRes) => {
          try {
            uni.showLoading({ title: '微信登录中...', mask: true })
            const wxLoginRes = await myWxLogin(loginRes.code, userRes.encryptedData, userRes.iv)
            uni.hideLoading()

            if (wxLoginRes.code === 200) {
              uni.setStorageSync('token', wxLoginRes.data.accessToken)
              await getLoginUserInfo()
              // 发送登录成功事件
              uni.$emit('loginSuccess')

              uni.showToast({
                title: '登录成功',
                icon: 'success',
              })
              setTimeout(() => {
                uni.switchTab({
                  url: '/pages/index/index',
                })
              }, 1500)
            } else {
              uni.showToast({
                title: wxLoginRes.message || '微信登录失败',
                icon: 'none',
              })
            }
          } catch (err) {
            uni.hideLoading()
            uni.showToast({
              title: '微信登录异常',
              icon: 'none',
            })
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '微信授权失败',
            icon: 'none',
          })
        },
      })
    },
    fail: (err) => {
      uni.showToast({
        title: '需要获取您的信息才能登录',
        icon: 'none',
      })
    },
  })
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '请在小程序内使用微信登录',
    icon: 'none',
  })
  // #endif
}

/**
 * 获取登录后用户信息
 */
const getLoginUserInfo = async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 200) {
      userStore.setUserInfo(res.data)
      uni.setStorageSync('userInfo', res.data)
    } else {
      uni.showToast({
        title: res.message,
        icon: 'none',
      })
    }
  } catch (error) {
    console.error('获取用户信息异常', error)
  }
}
</script>

<style lang="scss" scoped>
page {
  height: 100%;
  background-color: #f7f4ef;
  margin: 0;
  padding: 0;
}

.login-page {
  width: 100%;
  min-height: 100vh;
  position: relative;
  background: linear-gradient(145deg, #faf8f4 0%, #f3efe8 100%);
  padding: 120rpx 32rpx 60rpx;
  box-sizing: border-box;
}

.magazine-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 25% 40%, rgba(200, 170, 140, 0.03) 2%, transparent 2.5%),
    radial-gradient(circle at 75% 85%, rgba(160, 120, 90, 0.03) 1.5%, transparent 2%);
  background-size:
    48rpx 48rpx,
    60rpx 60rpx;
  z-index: 0;
}

.content-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.hero-section {
  margin-bottom: 40rpx;
  .hero-title {
    font-size: 56rpx;
    font-weight: 700;
    letter-spacing: -0.5rpx;
    margin-bottom: 18rpx;
    font-family: 'Georgia', 'Playfair Display', serif;
    background: linear-gradient(135deg, #3e2c1f, #6b4c34);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
  .hero-subtitle {
    font-size: 26rpx;
    color: #8e7a68;
    line-height: 1.45;
    font-weight: 400;
  }
}

.form-wrapper {
  width: 100%;
}

.input-group {
  display: flex;
  align-items: center;
  background: #fefbf7;
  border-radius: 100rpx;
  padding: 8rpx 24rpx 8rpx 20rpx;
  margin-bottom: 28rpx;
  border: 1rpx solid #efe3d6;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: #dbb48b;
    background: #ffffff;
  }

  .input-icon {
    font-size: 36rpx;
    margin-right: 16rpx;
    opacity: 0.7;
  }

  .input-field {
    flex: 1;
    height: 88rpx;
    font-size: 30rpx;
    color: #2c241a;
    font-weight: 500;
    background: transparent;
  }

  .input-placeholder {
    color: #c9b6a2;
    font-weight: 400;
    font-size: 28rpx;
  }
}

.code-group {
  padding-right: 16rpx;
  .code-input {
    flex: 1;
  }
  .code-btn {
    background: #f5ede4;
    padding: 14rpx 28rpx;
    border-radius: 60rpx;
    font-size: 24rpx;
    font-weight: 500;
    color: #b16e3c;
    white-space: nowrap;
    transition: all 0.2s;
    border: 0.5rpx solid #e5d5c6;

    &-active {
      background: #f0e3d8;
      color: #a56132;
      &:active {
        transform: scale(0.96);
        opacity: 0.8;
      }
    }

    &-disabled {
      background: #ede5dd;
      color: #bbaa99;
      opacity: 0.7;
    }
  }
}

.login-btn {
  width: 100%;
  background: linear-gradient(105deg, #c38254 0%, #b46a3a 100%);
  border-radius: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-top: 32rpx;
  margin-bottom: 44rpx;
  transition: all 0.2s ease;
  border: none;

  &-hover {
    transform: scale(0.98);
    opacity: 0.92;
  }

  .btn-text {
    font-size: 36rpx;
    font-weight: 600;
    color: #fff;
    letter-spacing: 2rpx;
  }
}

.divider-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  margin-bottom: 36rpx;

  .divider-line {
    flex: 1;
    height: 1rpx;
    background: linear-gradient(90deg, transparent, #e2d4c8, #dccbbc, #e2d4c8, transparent);
  }

  .divider-text {
    font-size: 24rpx;
    color: #a68f7c;
    font-weight: 400;
    letter-spacing: 2rpx;
    background: #fefbf7;
    padding: 0 20rpx;
  }
}

.wx-login-card {
  background: transparent;
  border-radius: 80rpx;
  padding: 24rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1rpx solid #ece0d4;
  transition: all 0.2s;
  margin-bottom: 48rpx;

  &:active {
    background: #f2ece4;
    transform: scale(0.98);
  }

  .wx-icon {
    font-size: 44rpx;
    background: #e9f0e6;
    width: 68rpx;
    height: 68rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .wx-text {
    flex: 1;
    font-size: 30rpx;
    font-weight: 500;
    color: #3c3026;
    margin-left: 20rpx;
    letter-spacing: 1rpx;
  }

  .wx-arrow {
    font-size: 36rpx;
    color: #b87b5a;
    opacity: 0.7;
  }
}

.legal-footer {
  text-align: center;
  font-size: 22rpx;
  color: #aa9b8c;
  line-height: 1.5;

  .legal-link {
    color: #b87b5a;
    font-weight: 500;
    margin: 0 6rpx;
  }
}
</style>
