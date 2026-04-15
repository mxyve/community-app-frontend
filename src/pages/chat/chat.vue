<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 10 + 'px' }">
    <text class="loc-text">AI助手</text>
    <view class="divider"></view>

    <!-- 智能助理区域 -->
    <view class="assistant-header">
      <text class="assistant-title">智能助理</text>
      <!-- <text class="assistant-status">8位在线 →</text> -->
    </view>
    <!-- <view class="assistant-icons">
      <view class="assistant-item" v-for="item in assistantList" :key="item.label">
        <view class="assistant-icon">
          <image :src="item.icon" mode="aspectFit"></image>
        </view>
        <text class="assistant-label">{{ item.label }}</text>
      </view>
    </view> -->

    <!-- 开始新对话按钮 -->
    <view class="new-chat-btn" @click="handleNewChat">
      <view class="new-chat-icon">
        <image src="/static/icon/robot.png" mode="aspectFit"></image>
      </view>
      <view class="new-chat-content">
        <text class="new-chat-title">开始新对话</text>
        <text class="new-chat-desc">向AI助手提问</text>
      </view>
      <image class="new-chat-arrow" src="/static/icon/arrow_right.png" mode="aspectFit"></image>
    </view>

    <!-- 会话列表 -->
    <scroll-view
      class="session-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refresherTriggered"
      @refresherrefresh="onRefresh"
    >
      <view class="session-list" v-if="sessionList.length > 0">
        <text class="list-title">历史对话</text>

        <!-- 左滑删除 -->
        <uni-swipe-action v-for="item in sessionList" :key="item.id" :auto-close="true">
          <uni-swipe-action-item
            :right-options="[{ text: '删除', type: 'error' }]"
            @click="handleDeleteSession(item.id)"
          >
            <view class="session-item" @click="openChat(item)">
              <view class="left">
                <image class="avatar" src="/static/icon/robot.png"></image>
                <view class="info">
                  <text class="title">{{ item.title }}</text>
                  <text class="lastMsg">
                    {{
                      (item.lastMessage || '').length > 22
                        ? (item.lastMessage || '').slice(0, 22) + '...'
                        : item.lastMessage || ''
                    }}
                  </text>
                </view>
              </view>
              <view class="tag">
                <text>{{ item.agentType === 'normal' ? '通用' : '教育' }}</text>
              </view>
            </view>
          </uni-swipe-action-item>
        </uni-swipe-action>
      </view>

      <!-- 空状态 -->
      <view class="empty" v-else>
        <text>暂无对话记录</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSessionList, createSession, deleteSession } from '@/service/session.js'

const { safeAreaInsets, windowHeight } = uni.getSystemInfoSync()

const sessionList = ref([]) // 会话列表
const loading = ref(false)

// 计算滚动区域高度（减去顶部元素高度）
const scrollHeight = ref(windowHeight - 400)
// 下拉刷新状态
const refresherTriggered = ref(false)

// 获取会话列表
const fetchSessions = async () => {
  loading.value = true
  try {
    const res = await getSessionList({ current: 1, size: 100 })
    sessionList.value = res.data.records || []
  } catch (err) {
    console.error(err)
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 新建会话
const handleNewChat = async () => {
  const res = await createSession({
    title: '新对话',
    modelName: 'qwen-plus',
    agentType: 'normal',
  })
  const sessionId = res.data.id
  uni.navigateTo({
    url: `/pages/chat/chatDetail?sessionId=${sessionId}`,
  })
}

// 进入历史对话
const openChat = (item) => {
  console.log(item)
  uni.navigateTo({
    url: `/pages/chat/chatDetail?sessionId=${item.id}`,
  })
}
const assistantList = [
  { label: '维修助手', icon: '/static/icon/robot.png' },
  { label: '回收助手', icon: '/static/icon/robot.png' },
  { label: '宠物助手', icon: '/static/icon/robot.png' },
]

// 下拉刷新方法
const onRefresh = async () => {
  if (refresherTriggered.value) return

  refresherTriggered.value = true

  try {
    // 重新获取会话列表
    await fetchSessions()
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

// 删除会话
const handleDeleteSession = async (sessionId) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除该会话吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteSession(sessionId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          fetchSessions() // 删除后刷新列表
        } catch (err) {
          console.error(err)
          uni.showToast({ title: '删除失败', icon: 'error' })
        }
      }
    },
  })
}

onMounted(() => {
  fetchSessions()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.container {
  background: $bg-primary;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.loc-text {
  display: block;
  font-size: 48rpx;
  font-weight: 600;
  color: #333;
  margin: 20rpx 30rpx 12rpx;
}

.divider {
  height: 1rpx;
  background: #f0d4b8;
  margin: 20rpx 0rpx 20rpx 0rpx;
}

/* 智能助理区域样式 */
.assistant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 30rpx 30rpx 20rpx;

  .assistant-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
  }

  .assistant-status {
    font-size: 28rpx;
    color: #999;
  }
}

.assistant-icons {
  display: flex;
  justify-content: space-around;
  padding: 0 20rpx 30rpx;

  .assistant-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .assistant-icon {
      width: 120rpx;
      height: 120rpx;
      background: #fff;
      border-radius: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
      margin-bottom: 16rpx;

      image {
        width: 60rpx;
        height: 60rpx;
      }
    }

    .assistant-label {
      font-size: 28rpx;
      color: #333;
      background: #fff;
      padding: 8rpx 20rpx;
      border-radius: 20rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    }
  }
}

/* 开始新对话按钮样式 */
.new-chat-btn {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 24rpx;
  margin: 0 30rpx 40rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

  .new-chat-icon {
    width: 60rpx;
    height: 60rpx;
    background: #fef3e9;
    border-radius: 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;

    image {
      width: 32rpx;
      height: 32rpx;
    }
  }

  .new-chat-content {
    flex: 1;
    display: flex;
    flex-direction: column;

    .new-chat-title {
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
      margin-bottom: 8rpx;
    }

    .new-chat-desc {
      font-size: 26rpx;
      color: #999;
    }
  }

  .new-chat-arrow {
    width: 30rpx;
    height: 30rpx;
  }
}

/* 会话列表 */
.session-list {
  padding: 30rpx;

  .list-title {
    font-size: 32rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 20rpx;
    display: block;
  }

  .session-item {
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

    .left {
      display: flex;
      align-items: center;
      flex: 1;

      .avatar {
        width: 50rpx;
        height: 50rpx;
        margin-right: 20rpx;
      }

      .info {
        display: flex;
        flex-direction: column;

        .title {
          font-size: 30rpx;
          color: #333;
          margin-bottom: 6rpx;
        }

        .lastMsg {
          font-size: 24rpx;
          color: #999;
        }
      }
    }

    .tag {
      background: #f5f5f5;
      padding: 6rpx 14rpx;
      border-radius: 12rpx;
      font-size: 22rpx;
      color: #666;
    }
  }
}

.empty {
  text-align: center;
  padding: 60rpx 0;
  color: #ccc;
  font-size: 26rpx;
}

/* 会话滚动区域 - 使用 flex 自动撑开 */
.session-scroll {
  flex: 1;
  min-height: 0; /* 关键：防止 flex 子项溢出 */
}

/* 确保内容可以滚动 */
.session-list {
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}
</style>
