<template>
  <view class="loginPage">
    <view class="top">
      <view class="title">验证码登录</view>
      <view class="info">未注册的⼿机号验证后⾃动完成注册</view>
    </view>
    <view class="form">
      <input class="input" type="text" placeholder="请输⼊⼿机号码" v-model="phoneForm.phone" />
      <view class="code">
        <input class="password" type="text" placeholder="请输⼊验证码" v-model="phoneForm.code" />
        <text class="btn" @click="sendPhoneCode" v-if="!timer">获取验证码 </text>
        <text class="btn" v-else>还剩下{{ count }}秒</text>
      </view>
      <button class="button" @click="handleLoginClick">登录</button>
      <view class="extra">
        <view class="caption">
          <text>其他登录⽅式</text>
        </view>
        <view class="options">
          <button type="default" size="mini" @click="wxLogin">
            <text class="icon icon-weixin">微信⼀键登录</text>
          </button>
        </view>
      </view>
      <view class="tips">登录/注册即视为你同意《服务条款》和《隐私协议》</view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { isCodeAvailable, isPhoneAvailable } from '@/utils/validate'
import { phoneLogin, sendCode, myWxLogin, getUserInfo } from '@/service/user'

const userStore = useUserStore()

// 倒计时
const count = ref(60)
// 是否显示倒计时
const timer = ref(false)
// 登录表单数据
const phoneForm = reactive({
  phone: '',
  code: '',
})

/**
 * 发送⼿机验证码
 */
const sendPhoneCode = async () => {
  let interval
  // 手机号校验
  if (phoneForm.phone && isPhoneAvailable(phoneForm.phone)) {
    timer.value = true
    const res = await sendCode(phoneForm.phone)
    if (res.code === 200) {
      uni.showToast({
        title: '验证码发送成功',
        icon: 'none',
      })
      // 定时器启动
      interval = setInterval(() => {
        count.value--
        if (count.value <= 0) {
          timer.value = false
          count.value = 60
          clearInterval(interval)
        }
      }, 1000)
    } else {
      uni.showToast({
        title: '验证码发送失败',
        icon: 'none',
      })
      return
    }
  } else {
    uni.showToast({
      title: '请输入正确的手机号码',
      icon: 'none',
    })
  }
}

/**
 * ⼿机号验证码登录
 */
const handleLoginClick = async () => {
  // 1.手机号校验
  if (!phoneForm.phone || !isPhoneAvailable(phoneForm.phone)) {
    uni.showToast({
      title: '请输入正确的手机号码',
      icon: 'none',
    })
    return
  }
  // 2.验证码校验
  if (!phoneForm.code || !isCodeAvailable(phoneForm.code)) {
    uni.showToast({
      title: '请输入正确的验证码',
      icon: 'none',
    })
    return
  }
  // 3.手机号登录 保存token 并获取用户信息
  const res = await phoneLogin(phoneForm.phone, phoneForm.code)
  if (res.code === 200) {
    uni.setStorageSync('token', res.data.accessToken)
    await getLoginUserInfo()
    uni.showToast({
      title: '登录成功',
      icon: 'success',
    })
    // 这里先跳到首页
    uni.switchTab({
      url: '/pages/index/index',
    })
  } else {
    uni.showToast({
      title: res.message,
      icon: 'none',
    })
  }
}

/**
 * 微信登录
 */
const wxLogin = () => {
  // 1.获取用户信息
  uni.getUserProfile({
    desc: '获取你的昵称、头像、地区及性别',
    success: (res) => {
      // 2.微信登录
      uni.login({
        provider: 'weixin',
        success: async (loginRes) => {
          // 3.调用后台接口登录
          const wxLoginRes = await myWxLogin(loginRes.code, res.encryptedData, res.iv)
          if (wxLoginRes.code === 200) {
            uni.showToast({
              title: '登录成功',
              icon: 'success',
            })
            // 4.保存token以及回退页面
            uni.setStorageSync('token', wxLoginRes.data.accessToken)
            await getLoginUserInfo()
            uni.switchTab({
              url: '/pages/index/index',
            })
          } else {
            uni.showToast({
              title: wxLoginRes.message,
              icon: 'none',
            })
            return
          }
        },
      })
    },
    fail: function (err) {
      uni.showToast({
        title: '获取用户信息失败',
        icon: 'none',
      })
      return
    },
  })
}

/**
 * 获取登录后⽤户信息
 */
const getLoginUserInfo = async () => {
  const res = await getUserInfo()
  if (res.code === 200) {
    userStore.setUserInfo(res.data)
    uni.setStorageSync('userInfo', res.data)
    console.log(res)
  } else {
    uni.showToast({
      title: res.message,
      icon: 'none',
    })
  }
}
</script>

<style lang="scss" scoped>
page {
  height: 100%;
}

.loginPage {
  padding: 60rpx;
  display: flex;
  flex-direction: column;
  .top {
    .title {
      font-size: 48rpx;
      color: #000;
      margin-bottom: 30rpx;
    }
    .info {
      font-size: 24rpx;
      color: #999;
    }
  }
  .form {
    padding: 80rpx 0;
    .input {
      width: 100%;
      height: 100rpx;
      font-size: 28rpx;
      border-bottom: 1px solid #ddd;
      margin-bottom: 20rpx;
    }
    .code {
      display: flex;
      align-items: center;
      height: 100rpx;
      justify-content: space-between;
      border-bottom: 1px solid #ddd;
      .password {
        flex: 1;
        height: 80rpx;
        font-size: 28rpx;
        margin-bottom: 20rpx;
      }
      .btn {
        border: 1px solid #d2d2d2;
        padding: 10rpx 40rpx;
        border-radius: 10rpx;
        font-size: 24rpx;
        color: #333;
        text-align: center;
      }
    }
    .button {
      margin-top: 60rpx;
      border-radius: 10rpx;
      font-size: 32rpx;
      background: linear-gradient(to right, #4876e0, #0ca0ed);
      color: #fff;
    }
    .extra {
      flex: 1;
      padding: 100rpx 70rpx 0;
      .caption {
        width: 440rpx;
        line-height: 1;
        border-top: 1rpx solid #ddd;
        font-size: 26rpx;
        color: #999;
        position: relative;
        text {
          transform: translate(-40%);
          background-color: #fff;
          position: absolute;
          top: -12rpx;
          left: 50%;
        }
      }
      .options {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 70rpx;
        button {
          padding: 0;
          background-color: transparent;
        }
      }
      .icon {
        font-size: 24rpx;
        color: #444;
        display: flex;
        flex-direction: column;
        align-items: center;
        &::before {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80rpx;
          height: 80rpx;
          margin-bottom: 6rpx;
          font-size: 40rpx;
          border: 1rpx solid #444;
          border-radius: 50%;
        }
      }
      .icon-weixin::before {
        border-color: #1296db;
        color: #1296db;
      }
    }
  }
  .tips {
    position: absolute;
    bottom: 80rpx;
    left: 20rpx;
    right: 20rpx;
    font-size: 22rpx;
    color: #999;
    text-align: center;
  }
}
</style>
