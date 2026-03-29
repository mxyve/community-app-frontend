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
      <text class="status">{{ getStatusText(order.status) }}</text>
      <text class="desc" v-if="order.status === 1">等待商家接单服务</text>
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
import { ref, onMounted } from 'vue'
import { getOrderDetail } from '@/service/services.js'

const { safeAreaInsets } = uni.getSystemInfoSync()
const order = ref({}) // 订单详情

onMounted(() => {
  // 获取页面传递的订单id
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = currentPage.options.id
  if (id) fetchOrderDetail(id)
})

// 获取订单详情
const fetchOrderDetail = async (id) => {
  const res = await getOrderDetail(id)
  order.value = res.data
}

// 订单状态文字
const getStatusText = (status) => {
  const map = {
    0: '待付款',
    1: '待服务',
    2: '服务中',
    3: '已完成',
    4: '已取消/退款',
  }
  return map[status] || '未知状态'
}

// 时间格式化
const formatTime = (time) => {
  if (!time) return ''
  return time.replace('T', ' ')
}

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
.status-box {
  background: #fff;
  padding: 30rpx;
  text-align: center;
  margin-bottom: 20rpx;
  .status {
    font-size: 40rpx;
    font-weight: bold;
    color: #ff9500;
    display: block;
    margin-bottom: 10rpx;
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
</style>
