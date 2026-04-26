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
      <view class="title">我的订单</view>
    </view>

    <!-- 订单分类标签 -->
    <scroll-view class="tab-scroll" scroll-x show-scrollbar="false">
      <view class="tab-list">
        <view class="tab-item" :class="{ active: currentStatus === '' }" @click="switchStatus('')">
          全部
        </view>
        <view class="tab-item" :class="{ active: currentStatus === 3 }" @click="switchStatus(3)">
          待付款
        </view>
        <view class="tab-item" :class="{ active: currentStatus === 1 }" @click="switchStatus(1)">
          待服务
        </view>
        <view class="tab-item" :class="{ active: currentStatus === 2 }" @click="switchStatus(2)">
          服务中
        </view>
        <view class="tab-item" :class="{ active: currentStatus === 4 }" @click="switchStatus(4)">
          已完成
        </view>
        <view
          class="tab-item"
          :class="{ active: currentStatus === 6 || currentStatus === 8 }"
          @click="switchStatus(6)"
        >
          已取消/退款
        </view>
      </view>
    </scroll-view>

    <!-- 订单列表 -->
    <scroll-view
      class="order-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refresherTriggered"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
      :style="{ height: scrollHeight + 'px' }"
    >
      <view class="order-list" v-if="!loading || orderList.length > 0">
        <!-- 左滑删除组件 -->
        <uni-swipe-action v-for="item in orderList" :key="item.id" :auto-close="true">
          <uni-swipe-action-item
            :right-options="[{ text: '删除', type: 'error' }]"
            @click="handleDelete(item.id)"
          >
            <view class="order-item" @click="goDetail(item.id)">
              <!-- 订单编号 + 状态 -->
              <view class="order-top">
                <view class="order-left">
                  <text class="order-no">订单号：{{ item.orderNo }}</text>
                  <text class="merchant-name">{{ item.merchantName }}</text>
                </view>
                <text class="order-status" :style="getStatusStyle(item.status)">
                  {{ getStatusText(item.status) }}
                </text>
              </view>

              <!-- 服务信息 -->
              <view class="service-info">
                <view class="icon">📦</view>
                <view class="info-box">
                  <text class="service-name">{{ item.serviceName }}</text>
                  <text class="service-time" v-if="item.serviceTime">
                    服务时间：{{ formatTime(item.serviceTime) }}
                  </text>
                </view>
              </view>

              <!-- 金额 + 底部 -->
              <view class="order-bottom">
                <text class="price">¥{{ item.payAmount }}</text>
                <view class="contact">
                  <text>{{ item.contactName }}</text>
                  <text>{{ item.contactPhone }}</text>
                </view>
              </view>
            </view>
          </uni-swipe-action-item>
        </uni-swipe-action>

        <!-- 加载更多 -->
        <view class="load-more" v-if="loading">加载中...</view>
        <view class="load-more" v-else-if="!hasMore && orderList.length === 0"> 暂无订单 </view>
        <view class="load-more" v-else-if="!hasMore">没有更多订单了</view>
      </view>

      <!-- 加载中 -->
      <view class="empty-loading" v-else>
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOrderPage, deleteOrder } from '@/service/services.js'

const { safeAreaInsets, windowHeight } = uni.getSystemInfoSync()

// 订单列表
const orderList = ref([])
const loading = ref(false)
const hasMore = ref(true)
const current = ref(1)
const size = ref(10)

// 筛选状态
const currentStatus = ref('') // 空=全部

// 下拉刷新状态
const refresherTriggered = ref(false)

// 滚动区域高度
const scrollHeight = ref(windowHeight - 200)

// 页面加载时获取订单列表
onMounted(() => {
  fetchOrderList()
})

// 获取订单列表
const fetchOrderList = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    const params = {
      current: current.value,
      size: size.value,
    }
    // 状态筛选
    if (currentStatus.value !== '') {
      params.status = currentStatus.value
    }

    const res = await getOrderPage(params)
    const records = res.data.records || []
    console.log(res)

    if (current.value === 1) {
      orderList.value = records
    } else {
      orderList.value = [...orderList.value, ...records]
    }

    hasMore.value = records.length === size.value
    if (hasMore.value) current.value++
  } catch (err) {
    console.error('获取订单失败', err)
  } finally {
    loading.value = false
  }
}

// 切换状态标签
const switchStatus = (status) => {
  currentStatus.value = status
  refreshList()
}

// 下拉刷新
const onRefresh = async () => {
  if (refresherTriggered.value) return

  refresherTriggered.value = true

  try {
    // 重置分页参数
    current.value = 1
    hasMore.value = true

    // 重新获取数据
    await fetchOrderList(true)
  } catch (error) {
    console.error('刷新失败', error)
    uni.showToast({
      title: '刷新失败',
      icon: 'none',
    })
  } finally {
    // 关闭刷新动画
    setTimeout(() => {
      refresherTriggered.value = false
    }, 500)
  }
}

// 加载更多
const loadMore = () => {
  if (hasMore.value && !loading.value) {
    fetchOrderList()
  }
}

// 删除订单
const handleDelete = async (id) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定删除该订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteOrder(id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          refreshList()
        } catch (err) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    },
  })
}

// 刷新列表
const refreshList = () => {
  current.value = 1
  hasMore.value = true
  orderList.value = []
  fetchOrderList()
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

// 订单状态颜色
const getStatusStyle = (status) => {
  const colorMap = {
    1: '#ff9500', // 待服务
    2: '#007aff', // 服务中
    3: '#ff5f3f', // 待付款
    4: '#06c160', // 已完成
    5: '#999', // 取消中
    6: '#999', // 已取消
    7: '#999', // 退款中
    8: '#999', // 已退款
  }
  return `color: ${colorMap[status] || '#666'}`
}

// 时间格式化
const formatTime = (time) => {
  if (!time) return ''
  return time
}

// 返回
function goBack() {
  uni.navigateBack()
}

const goDetail = (id) => {
  uni.navigateTo({
    url: `/subPackages/my/services/ordersDetail?id=${id}`,
  })
}
</script>

<style lang="scss" scoped>
.container {
  background: #f8f6f2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 订单滚动区域 */
.order-scroll {
  flex: 1;
  min-height: 0;
}

/* 自定义下拉刷新样式 */
.order-scroll {
  ::v-deep .uni-scroll-view-refresher {
    color: #b86b3f;
  }
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

/* 分类标签 */
.tab-scroll {
  background: #fff;
  border-bottom: 1rpx solid #f0d4b8;

  .tab-list {
    display: flex;
    padding: 20rpx 24rpx;
    gap: 24rpx;
  }

  .tab-item {
    padding: 12rpx 24rpx;
    font-size: 28rpx;
    color: #666;
    white-space: nowrap;
    border-radius: 40rpx;
    background: #f5f0e9;
  }

  .tab-item.active {
    background: #d2691e;
    color: #fff;
  }
}

/* 订单列表 */
.order-list {
  padding: 20rpx;
}

.order-item {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
}

/* 订单顶部：编号 + 状态 */
.order-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;

  .order-left {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  .order-no {
    font-size: 28rpx;
    color: #666;
  }

  /* 商家名称样式 */
  .merchant-name {
    font-size: 24rpx;
    color: #999;
  }

  .order-status {
    font-size: 28rpx;
    font-weight: 500;
  }
}

/* 服务信息 */
.service-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 24rpx;

  .icon {
    font-size: 40rpx;
    width: 60rpx;
    height: 60rpx;
    background: #f5f5f5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .info-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .service-name {
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
    }

    .service-time {
      font-size: 24rpx;
      color: #999;
    }
  }
}

/* 订单底部：金额 + 联系方式 */
.order-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;

  .price {
    font-size: 36rpx;
    font-weight: bold;
    color: #ff5f3f;
  }

  .contact {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 24rpx;
    color: #999;
    gap: 4rpx;
  }
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 26rpx;
}

.empty-loading {
  text-align: center;
  padding: 60rpx 0;
  color: #ccc;
}
</style>
