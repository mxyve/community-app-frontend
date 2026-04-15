<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
    <!-- 顶部导航 -->
    <view class="header">
      <image
        class="back-icon"
        src="/static/icon/arrow_left.png"
        mode="aspectFit"
        @click="goBack"
      ></image>
      <view class="title">订单详情</view>
    </view>

    <!-- 订单状态 -->
    <view class="status-box">
      <view class="status-header">
        <text class="status-placeholder"></text>
        <text class="status">{{ getStatusText(order.status) }}</text>
        <view
          class="refresh-btn"
          :class="{ disabled: order.status === 3 }"
          @click="handleRefresh"
          v-if="order.status !== 3"
        >
          <text class="refresh-icon">🔄</text>
          <text class="refresh-text">刷新</text>
        </view>
      </view>
      <text class="desc" v-if="order.status === 1">等待商家接单服务</text>
    </view>

    <!-- ===================== 支付区域（新增） ===================== -->
    <view class="pay-card" v-if="order.status === 3">
      <view class="pay-title">支付宝扫码支付</view>
      <view class="price">实付金额：¥{{ order.payAmount }}</view>

      <!-- 二维码 -->
      <view class="qrcode-box" v-if="qrCodeUrl">
        <image :src="qrCodeUrl" mode="widthFix"></image>
        <view class="tip">使用沙箱支付宝APP扫码支付</view>
      </view>

      <!-- 支付中 -->
      <view class="paying" v-if="isPaying">
        <text>⌛ 等待支付中...</text>
      </view>

      <!-- 支付成功 -->
      <view class="success" v-if="paySuccess">
        <text>✅ 支付成功，订单已完成</text>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="card">
      <view class="row">
        <text class="label">订单编号</text>
        <text class="value">{{ order.orderNo }}</text>
      </view>
      <view class="row">
        <text class="label">创建时间</text>
        <text class="value">{{ formatTime(order.createTime) }}</text>
      </view>
      <view class="row">
        <text class="label">服务时间</text>
        <text class="value">{{ formatTime(order.serviceTime) }}</text>
      </view>
    </view>

    <!-- 服务信息 -->
    <view class="card">
      <view class="service-title">服务信息</view>
      <view class="row">
        <text class="label">服务名称</text>
        <text class="value">{{ order.serviceName }}</text>
      </view>
      <view class="row">
        <text class="label">商家名称</text>
        <text class="value">{{ order.merchantName }}</text>
      </view>
      <view class="row">
        <text class="label">数量</text>
        <text class="value">{{ order.quantity }}</text>
      </view>
    </view>

    <!-- 价格信息 -->
    <view class="card">
      <view class="service-title">费用信息</view>
      <view class="row">
        <text class="label">单价</text>
        <text class="value">¥{{ order.unitPrice }}</text>
      </view>
      <view class="row">
        <text class="label">总价</text>
        <text class="value">¥{{ order.totalAmount }}</text>
      </view>
      <view class="row">
        <text class="label">优惠金额</text>
        <text class="value">¥{{ order.discountAmount }}</text>
      </view>
      <view class="row bold">
        <text class="label">实付金额</text>
        <text class="value red">¥{{ order.payAmount }}</text>
      </view>
    </view>

    <!-- 联系信息 -->
    <view class="card">
      <view class="service-title">服务地址</view>
      <view class="row">
        <text class="label">联系电话</text>
        <text class="value">{{ order.contactPhone }}</text>
      </view>
      <view class="row">
        <text class="label">联系人</text>
        <text class="value">{{ order.contactName }}</text>
      </view>
      <view class="row">
        <text class="label">服务地址</text>
        <text class="value">{{ order.serviceAddress }}</text>
      </view>
    </view>

    <!-- 备注 -->
    <view class="card" v-if="order.userRemark">
      <view class="service-title">用户备注</view>
      <view class="remark">{{ order.userRemark }}</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getOrderDetail, createAlipayOrder, getPayStatus } from '@/service/services.js'

const { safeAreaInsets } = uni.getSystemInfoSync()
const order = ref({}) // 订单详情

// ==================== 支付相关（新增） ====================
const qrCodeUrl = ref('') // 支付宝二维码
const isPaying = ref(false) // 正在支付
const paySuccess = ref(false) // 支付成功
let pollTimer = null // 轮询定时器

onMounted(() => {
  // 获取页面传递的订单id
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = currentPage.options.id
  if (id) fetchOrderDetail(id)
})

// 获取订单详情
const fetchOrderDetail = async (id) => {
  try {
    const res = await getOrderDetail(id)
    order.value = res.data

    // 如果是待付款，自动创建支付
    if (res.data.status === 3 && !qrCodeUrl.value) {
      createPayOrder()
    }
  } catch (err) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

// 订单状态文字
const getStatusText = (status) => {
  const map = {
    1: '待服务',
    2: '服务中',
    3: '待付款',
    4: '已完成',
    5: '取消申请中',
    6: '已取消',
    7: '退款中',
    8: '已退款',
  }
  return map[status] || '未知状态'
}

// 时间格式化
const formatTime = (time) => {
  if (!time) return ''
  return time.replace('T', ' ')
}

// ==================== 创建支付宝订单（新增） ====================
const createPayOrder = async () => {
  try {
    const res = await createAlipayOrder({
      orderNo: order.value.orderNo,
    })
    if (res.code === 200) {
      // 生成二维码图片
      qrCodeUrl.value =
        'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' +
        encodeURIComponent(res.data)
      // 开始轮询支付状态
      startPollPay()
    }
  } catch (e) {
    uni.showToast({ title: '支付创建失败', icon: 'none' })
  }
}

// ==================== 轮询查询支付状态（新增） ====================
const startPollPay = () => {
  isPaying.value = true

  pollTimer = setInterval(async () => {
    try {
      const res = await getPayStatus(order.value.orderNo)
      if (res.data === true) {
        // 支付成功
        paySuccess.value = true
        isPaying.value = false
        order.value.status = 4 // 改成已完成
        clearInterval(pollTimer)
      }
    } catch (e) {
      console.log('查询支付状态失败')
    }
  }, 5000)
}

// 添加刷新方法
const handleRefresh = () => {
  uni.showLoading({ title: '刷新中...' })

  // 获取订单id
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = currentPage.options.id

  if (id) {
    // 清空二维码，重新获取
    qrCodeUrl.value = ''
    paySuccess.value = false
    isPaying.value = false
    if (pollTimer) clearInterval(pollTimer)

    fetchOrderDetail(id)

    setTimeout(() => {
      uni.hideLoading()
      uni.showToast({ title: '刷新成功', icon: 'success' })
    }, 500)
  } else {
    uni.hideLoading()
    uni.showToast({ title: '刷新失败', icon: 'none' })
  }
}

// 页面销毁清除定时器
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.container {
  background: #f8f6f2;
  min-height: 100vh;
  padding-bottom: 20rpx;
}

/* 头部 */
.header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #faf5ef;
  gap: 20rpx;
  border-bottom: 2rpx solid #f0d4b8;

  .back-icon {
    width: 36rpx;
    height: 36rpx;
  }

  .title {
    font-size: 45rpx;
    color: #332b22;
    font-weight: bold;
  }
}

/* 订单状态 */
/* 订单状态 */
.status-box {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;

  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10rpx;
    position: relative;
  }

  .status-placeholder {
    width: 100rpx; /* 与刷新按钮宽度一致，保持平衡 */
    visibility: hidden;
  }

  .status {
    font-size: 40rpx;
    font-weight: bold;
    color: #ff9500;
    flex: 1;
    text-align: center;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 16rpx;
    background: #f5f0ea;
    border-radius: 30rpx;
    width: 100rpx;
    justify-content: center;

    .refresh-icon {
      font-size: 28rpx;
      color: #b86b3f;
    }

    .refresh-text {
      font-size: 24rpx;
      color: #b86b3f;
    }

    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  }

  .desc {
    font-size: 26rpx;
    color: #999;
  }
}

/* 卡片 */
.card {
  background: #fff;
  margin: 0 30rpx 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}
.service-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #332b22;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  font-size: 28rpx;
  &:last-child {
    border-bottom: none;
  }
  .label {
    color: #666;
  }
  .value {
    color: #333;
  }
  .red {
    color: #ff5f3f;
    font-weight: bold;
  }
}
.row.bold {
  font-weight: bold;
}
.remark {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}
/* ==================== 支付样式 ==================== */
.pay-card {
  background: #fff;
  margin: 0 30rpx 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  text-align: center;
}
.pay-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #d2691e;
}
.price {
  font-size: 36rpx;
  color: #ff5f3f;
  font-weight: bold;
  margin-bottom: 30rpx;
}
.qrcode-box image {
  width: 300rpx;
  height: 300rpx;
  margin: 0 auto;
}
.qrcode-box .tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}
.paying {
  font-size: 28rpx;
  color: #007aff;
  padding: 20rpx;
}
.success {
  font-size: 30rpx;
  color: #06c160;
  font-weight: bold;
  padding: 20rpx;
}
</style>
