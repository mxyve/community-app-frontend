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

    <!-- ===================== 订单评价功能 ===================== -->
    <view class="card" v-if="order.status === 4">
      <view class="service-title">服务评价</view>

      <!-- 已评价 → 展示 -->
      <view v-if="hasReviewed" class="reviewed-box">
        <view class="star-show">
          <text class="star on" v-for="n in userReview.star" :key="n">★</text>
        </view>
        <view class="review-content">{{ userReview.content }}</view>
        <image v-if="userReview.img" :src="userReview.img" class="review-image" mode="aspectFill" />
        <view class="review-time">{{ formatTime(userReview.createTime) }}</view>
      </view>

      <!-- 未评价 → 显示去评价按钮 -->
      <view v-else class="review-btn-wrap">
        <view class="review-btn" @click="openReviewPopup">去评价</view>
      </view>
    </view>

    <!-- 评价弹窗 -->
    <view class="popup-mask" v-if="showReviewPopup" @click="closeReviewPopup">
      <view class="popup-content" @click.stop>
        <view class="popup-header">
          <text>服务评价</text>
          <text @click="closeReviewPopup">关闭</text>
        </view>

        <!-- 星级评分 -->
        <view class="star-row">
          <text class="star" :class="{ on: star >= 1 }" @click="star = 1">★</text>
          <text class="star" :class="{ on: star >= 2 }" @click="star = 2">★</text>
          <text class="star" :class="{ on: star >= 3 }" @click="star = 3">★</text>
          <text class="star" :class="{ on: star >= 4 }" @click="star = 4">★</text>
          <text class="star" :class="{ on: star >= 5 }" @click="star = 5">★</text>
        </view>

        <!-- 评价内容 -->
        <textarea
          v-model="reviewContent"
          class="review-textarea"
          placeholder="请输入评价内容"
        ></textarea>

        <view class="upload-section">
          <view class="upload-btn" @click="chooseImage">
            <text class="plus">+</text>
          </view>
          <view class="image-preview" v-if="reviewImage">
            <image :src="reviewImage" class="preview-img"></image>
            <text class="del" @click="clearImage">×</text>
          </view>
        </view>

        <!-- 提交 -->
        <view class="submit-btn" @click="submitReview">提交评价</view>
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
    <view class="card clickable-card" @click="goToServiceDetail">
      <view class="service-title service-title-clickable">
        服务信息
        <text class="arrow">→</text>
      </view>
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
import {
  getOrderDetail,
  createAlipayOrder,
  getPayStatus,
  getReviewByOrderId,
  createServiceReview,
  uploadCommentImage,
} from '@/service/services.js'

const { safeAreaInsets } = uni.getSystemInfoSync()
const order = ref({}) // 订单详情

// ==================== 支付相关 ====================
const qrCodeUrl = ref('') // 支付宝二维码
const isPaying = ref(false) // 正在支付
const paySuccess = ref(false) // 支付成功
let pollTimer = null // 轮询定时器

// 评价相关
const showReviewPopup = ref(false)
const star = ref(5)
const reviewContent = ref('')
const hasReviewed = ref(false)
const userReview = ref({})

// ================== 图片上传 ==================
const reviewImage = ref('')
const reviewImageUrl = ref('')

// 清空图片
const clearImage = () => {
  reviewImage.value = ''
  reviewImageUrl.value = ''
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const tempPath = res.tempFilePaths[0]
      reviewImage.value = tempPath

      uni.showLoading({ title: '上传中...' })
      try {
        const resUpload = await uploadCommentImage(tempPath)
        console.log('上传返回', resUpload)

        // 解析 JSON
        const result = JSON.parse(resUpload.data)
        // 只存图片链接
        reviewImageUrl.value = result.data
      } catch (err) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
      uni.hideLoading()
    },
  })
}

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

    fetchUserReview(id)

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

// ==================== 创建支付宝订单 ====================
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

// ==================== 轮询查询支付状态 ====================
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

    hasReviewed.value = false
    userReview.value = {}

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

const goToServiceDetail = () => {
  uni.navigateTo({
    url: `/subPackages/services/serviceDetail?id=${order.value.serviceId}`,
  })
}

// 获取用户评价
const fetchUserReview = async (orderId) => {
  try {
    const res = await getReviewByOrderId(orderId)
    console.log('用户评价', res)
    if (res.data) {
      hasReviewed.value = true
      userReview.value = res.data
    }
  } catch (e) {
    /* 未评价 */
  }
}

// 打开评价弹窗
const openReviewPopup = () => {
  showReviewPopup.value = true
  star.value = 5
  reviewContent.value = ''
}

// 关闭弹窗
const closeReviewPopup = () => {
  showReviewPopup.value = false
  reviewImage.value = ''
  reviewImageUrl.value = ''
}

// 提交评价
const submitReview = async () => {
  if (star.value < 1) {
    return uni.showToast({ title: '请选择评分', icon: 'none' })
  }

  try {
    await createServiceReview({
      serviceId: order.value.serviceId,
      merchantId: order.value.merchantId,
      orderId: order.value.id,
      parentCommentId: 0,
      toUserId: 0,
      star: star.value,
      content: reviewContent.value,
      img: reviewImageUrl.value || '',
    })

    uni.showToast({ title: '评价成功' })
    closeReviewPopup()
    fetchUserReview(order.value.id)
  } catch (err) {
    uni.showToast({ title: '评价失败', icon: 'none' })
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

/* ==================== 评价样式 ==================== */
.review-btn-wrap {
  padding: 20rpx 0;
}
.review-btn {
  background: #b86b3f;
  color: #fff;
  text-align: center;
  padding: 20rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
}

/* 已评价展示 */
.reviewed-box {
  padding: 20rpx 0;
}
.star-show {
  display: flex;
  gap: 6rpx;
  margin-bottom: 16rpx;
}
.star {
  font-size: 50rpx;
  color: #ccc;
  transition: all 0.2s;
}
.star.on {
  color: #ff9500;
}
.review-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 10rpx;
}
.review-time {
  font-size: 24rpx;
  color: #999;
}

/* 评价弹窗 */
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.popup-content {
  width: 80%;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
}
.star-row {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 30rpx;
}
.review-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  margin-bottom: 30rpx;
}
.submit-btn {
  background: #b86b3f;
  color: #fff;
  text-align: center;
  padding: 20rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
}

/* 可点击卡片 */
.clickable-card {
  cursor: pointer;
}
/* 标题加箭头 */
.service-title-clickable {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.arrow {
  font-size: 28rpx;
  color: #b86b3f;
  font-weight: bold;
}

/* 评价上传图片样式 */
.upload-section {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}
.upload-btn {
  width: 120rpx;
  height: 120rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}
.upload-btn .plus {
  font-size: 40rpx;
  color: #999;
}
.image-preview {
  position: relative;
  width: 120rpx;
  height: 120rpx;
}
.preview-img {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
}
.del {
  position: absolute;
  top: -20rpx;
  right: -20rpx;
  background: #ff4d4f;
  color: #fff;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}
.review-image {
  width: 320rpx;
  height: 320rpx;
  border-radius: 12rpx;
  margin: 10rpx 0;
}
</style>
