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
      <view class="title">我的收藏服务</view>
    </view>

    <view class="cart-list" v-if="!loading || cartList.length > 0">
      <uni-swipe-action v-for="item in cartList" :key="item.id" :auto-close="true">
        <uni-swipe-action-item
          :right-options="[{ text: '删除', type: 'error' }]"
          @click="handleDelete(item.id)"
        >
          <view class="cart-item" @click="goToDetail(item.serviceId)">
            <view class="cart-left">
              <text class="icon">📦</text>
            </view>
            <view class="cart-info">
              <text class="server-name">{{ item.serviceName }}</text>
              <text class="merchant-name">{{ item.merchantName }}</text>
              <view class="price-row">
                <text class="price">￥{{ item.basePrice }}</text>
                <text class="quantity">x {{ item.quantity }}</text>
              </view>
            </view>
            <view class="book-btn" @click.stop="handleBook(item)"> 预约 </view>
          </view>
        </uni-swipe-action-item>
      </uni-swipe-action>
    </view>

    <view clss="load-more" v-if="loading">加载中...</view>
    <view class="load-more" v-else-if="!hasMore && cartList.length === 0">暂无收藏服务</view>
    <view class="load-more" v-else-if="!hasMore">没有更多了</view>
  </view>
</template>

<script setup>
const { safeAreaInsets } = uni.getSystemInfoSync()
import { ref, onMounted } from 'vue'
import { getCartPage, deleteCart } from '@/service/services.js'

// 购物车列表
const cartList = ref([])
const loading = ref(false)
const hasMore = ref(true)
const current = ref(1)
const size = ref(10)

// 加载购物车
onMounted(() => {
  fetchCartList()
})

// 获取购物车列表
const fetchCartList = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    const res = await getCartPage({
      currnt: current.value,
      size: size.value,
    })

    const records = res.data.records || []
    if (current.value === 1) {
      cartList.value = records
    } else {
      cartList.value = [...cartList.value, ...records]
    }

    hasMore.value = records.length === size.value
    if (hasMore.value) current.value++
  } catch (err) {
    console.log('获取购物车失败', err)
  } finally {
    loading.value = false
  }
}

// 删除购物车
const handleDelete = async (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定删除该服务吗？',
    success: async (res) => {
      if (res.confirm) {
        await deleteCart(id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        refreshList()
      }
    },
  })
}

// 刷新
const refreshList = () => {
  current.value = 1
  hasMore.value = true
  cartList.value = []
  fetchCartList()
}

function goBack() {
  uni.navigateBack()
}

const goToDetail = (serviceId) => {
  uni.navigateTo({ url: `/pages/services/serviceDetail?id=${serviceId}` })
}

// 预约跳转
const handleBook = (item) => {
  // 构建服务详情对象
  const serviceData = {
    id: item.serviceId,
    name: item.serviceName,
    merchantName: item.merchantName,
    merchantId: item.merchantId,
    basePrice: item.basePrice,
    // 如果有其他需要传递的字段可以继续添加
  }

  uni.navigateTo({
    url: `/pages/services/book?service=${JSON.stringify(serviceData)}`,
  })
}
</script>

<style lang="scss" scoped>
.container {
  background: #f8f6f2;
  min-height: 100vh;
  padding-bottom: 20rpx;
}

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
.cart-list {
  padding: 20rpx;
}
.cart-item {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.cart-left .icon {
  font-size: 40rpx;
  width: 60rpx;
  height: 60rpx;
  background: #f5e9d7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cart-info {
  flex: 1;
}
.service-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #332b22;
}
.merchant-name {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}
.price-row {
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
}
.price {
  font-size: 30rpx;
  color: #ff5f3f;
  font-weight: bold;
}
.quantity {
  font-size: 26rpx;
  color: #666;
}
.book-btn {
  background: #ff5f3f;
  color: #fff;
  padding: 12rpx 24rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  white-space: nowrap;
}
.load-more {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
}
</style>
