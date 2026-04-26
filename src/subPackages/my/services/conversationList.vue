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
      <view class="title">客服消息</view>
    </view>

    <!-- 会话列表 -->
    <scroll-view class="session-list" scroll-y>
      <view class="session-item" v-for="item in sessionList" :key="item.id" @click="goToChat(item)">
        <!-- 头像 -->
        <image class="avatar" src="/static/icon/kf.svg" mode="aspectFill"></image>

        <!-- 信息 -->
        <view class="session-info">
          <view class="session-top">
            <text class="merchant-name">商家客服</text>
            <text class="last-time">{{ formatTime(item.lastMessageTime) }}</text>
          </view>

          <view class="session-bottom">
            <text class="last-message">{{ item.lastMessage || '暂无消息' }}</text>
            <!-- 未读红点 -->
            <view class="unread-badge" v-if="item.userUnreadCount > 0">
              {{ item.userUnreadCount }}
            </view>
          </view>
        </view>
      </view>

      <view class="empty" v-if="sessionList.length === 0 && !loading">
        <text>暂无客服消息</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserSessions } from '@/service/conversation.js'

const { safeAreaInsets } = uni.getSystemInfoSync()

const sessionList = ref([])
const loading = ref(false)

onMounted(() => {
  loadSessionList()
})

// 加载会话列表
const loadSessionList = async () => {
  loading.value = true
  try {
    const res = await getUserSessions(1, 50)
    sessionList.value = res.data.records || []
  } catch (err) {
    console.error('加载会话失败', err)
  } finally {
    loading.value = false
  }
}

// 进入聊天页
const goToChat = (item) => {
  uni.navigateTo({
    url: `/subPackages/my/services/conversationDetail?sessionId=${item.id}&merchantId=${item.merchantId}&merchantName=商家客服`,
  })
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

const goBack = () => uni.navigateBack()
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
  min-height: 100vh;
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

.session-list {
  padding: 20rpx;
  height: calc(100vh - 120rpx);
}

.session-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;

  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: #fde6d2;
    padding: 10rpx;
    box-sizing: border-box;
  }

  .session-info {
    flex: 1;
    margin-left: 20rpx;

    .session-top {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8rpx;

      .merchant-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #332b22;
      }
      .last-time {
        font-size: 24rpx;
        color: #999;
      }
    }

    .session-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .last-message {
        font-size: 26rpx;
        color: #666;
        max-width: 400rpx;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .unread-badge {
        background: #ff4444;
        color: #fff;
        font-size: 22rpx;
        min-width: 32rpx;
        height: 32rpx;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 8rpx;
      }
    }
  }
}

.empty {
  text-align: center;
  padding-top: 200rpx;
  color: #999;
  font-size: 28rpx;
}
</style>
