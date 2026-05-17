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
      <view class="title">意见反馈</view>
    </view>

    <!-- 表单：提交反馈 -->
    <view class="form-box">
      <textarea class="input" placeholder="请输入你的反馈内容" v-model="feedback.content" />

      <view class="upload-box" @click="chooseImage">
        <view class="upload-btn" v-if="imageList.length < 3">
          <text class="plus">+</text>
          <text>上传图片</text>
        </view>
        <image class="preview-img" v-for="(img, idx) in imageList" :key="idx" :src="img" />
      </view>

      <button class="submit-btn" @click="doSubmitFeedback">提交反馈</button>
    </view>

    <!-- 反馈列表 -->
    <scroll-view
      class="session-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refresherTriggered"
      @refresherrefresh="onRefresh"
    >
      <view class="list-box">
        <uni-swipe-action v-for="item in feedbackList" :key="item.id" :auto-close="true">
          <uni-swipe-action-item
            :right-options="getSwipeOptions(item)"
            @click="handleSwipeClick(item.id, $event)"
          >
            <view class="item">
              <view class="content">{{ item.content }}</view>

              <view class="img-list" v-if="item.images">
                <image
                  class="item-img"
                  :src="url"
                  v-for="(url, i) in item.images.split(',')"
                  :key="i"
                />
              </view>

              <view class="info-row">
                <text class="date">{{ item.createTime }}</text>
                <text class="status" :class="getStatusClass(item.status)">
                  {{ getStatusText(item.status) }}
                </text>
              </view>

              <view class="reply" v-if="item.reply"> 管理员回复：{{ item.reply }} </view>
            </view>
          </uni-swipe-action-item>
        </uni-swipe-action>
      </view>
    </scroll-view>

    <!-- 加载提示 -->
    <view class="load-more" v-if="loading">加载中...</view>
    <view class="load-more" v-else-if="!hasMore && feedbackList.length === 0"> 暂无反馈记录 </view>
  </view>
</template>

<script setup>
const { safeAreaInsets } = uni.getSystemInfoSync()
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import {
  submitFeedback,
  getMyFeedbackList,
  cancelFeedback,
  deleteFeedback,
  uploadFeedbackImage,
} from '@/service/feedback.js'

// 用户信息
const userStore = useUserStore()
const userId = userStore.userInfo?.id || 1

// 提交表单
const feedback = ref({
  content: '',
  images: '',
})
const imageList = ref([])

// 列表数据
const feedbackList = ref([])
const loading = ref(false)
const hasMore = ref(true)
const current = ref(1)
const size = ref(10)

const refresherTriggered = ref(false)

// 页面加载获取列表
onMounted(() => {
  getFeedbackList()
})

/**
 * 获取我的反馈列表
 */
const getFeedbackList = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    const res = await getMyFeedbackList({
      pageNum: current.value,
      pageSize: size.value,
    })

    const records = res.data.records || []
    if (current.value === 1) {
      feedbackList.value = records
    } else {
      feedbackList.value = [...feedbackList.value, ...records]
    }

    hasMore.value = records.length === size.value
    if (hasMore.value) current.value++
  } catch (err) {
    console.log('获取反馈失败', err)
  } finally {
    loading.value = false
  }
}

/**
 * 左滑按钮配置
 */
const getSwipeOptions = (item) => {
  // 待处理 → 只显示 撤销
  if (item.status === 0) {
    return [{ text: '撤销', type: 'primary' }]
  }

  // 已处理 / 已撤销 → 只显示 删除
  return [{ text: '删除', type: 'error' }]
}

const handleSwipeClick = async (id, e) => {
  const text = e.content.text

  // 撤销
  if (text === '撤销') {
    uni.showModal({
      title: '确认撤销',
      content: '确定要撤销这条反馈吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await cancelFeedback(id)
          uni.showToast({ title: '撤销成功' })
          refreshList()
        } catch (err) {
          uni.showToast({ title: '撤销失败', icon: 'error' })
        }
      },
    })
    return
  }

  // 删除
  if (text === '删除') {
    uni.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定删除吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await deleteFeedback(id)
          uni.showToast({ title: '删除成功' })
          refreshList()
        } catch (err) {
          uni.showToast({ title: '删除失败', icon: 'error' })
        }
      },
    })
  }
}

/**
 * 选择图片 + 上传
 */
const chooseImage = async () => {
  try {
    const res = await uni.chooseImage({
      count: 3 - imageList.value.length,
      sizeType: ['compressed'],
    })

    const filePath = res.tempFilePaths[0]

    const uploadRes = await uploadFeedbackImage(filePath)
    const data = JSON.parse(uploadRes.data)

    if (data.code === 200) {
      imageList.value.push(data.data)
      feedback.value.images = imageList.value.join(',')
    }
  } catch (err) {
    console.log('上传失败', err)
    uni.showToast({ title: '上传失败', icon: 'error' })
  }
}
/**
 * 提交反馈
 */
const doSubmitFeedback = async () => {
  if (!feedback.value.content) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }

  await submitFeedback({
    content: feedback.value.content,
    images: feedback.value.images,
  })

  uni.showToast({ title: '提交成功' })
  feedback.value.content = ''
  imageList.value = []
  refreshList()
}

/**
 * 刷新列表
 */
const refreshList = () => {
  current.value = 1
  hasMore.value = true
  feedbackList.value = []
  getFeedbackList()
}

/**
 * 状态文本
 */
const getStatusText = (status) => {
  if (status === 0) return '待处理'
  if (status === 1) return '已回复'
  if (status === 3) return '已撤销'
  return '未知'
}

const getStatusClass = (status) => {
  if (status === 0) return 'waiting'
  if (status === 1) return 'success'
  if (status === 3) return 'cancel'
}

function goBack() {
  uni.navigateBack()
}

// 下拉刷新
const onRefresh = async () => {
  if (refresherTriggered.value) return
  refresherTriggered.value = true

  try {
    await refreshList()
  } catch (error) {
    uni.showToast({ title: '刷新失败', icon: 'none' })
  } finally {
    setTimeout(() => {
      refresherTriggered.value = false
    }, 500)
  }
}
</script>

<style lang="scss" scss>
.container {
  background: #f8f6f2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #faf5ef;
  border-bottom: 2rpx solid #f0d4b8;
  .back-icon {
    width: 36rpx;
    height: 36rpx;
  }
  .title {
    font-size: 45rpx;
    font-weight: bold;
    margin-left: 20rpx;
  }
}

.form-box {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 24rpx;
  .input {
    width: 100%;
    min-height: 200rpx;
    background: #f8f6f2;
    border-radius: 16rpx;
    padding: 20rpx;
    font-size: 30rpx;
  }
  .upload-box {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    margin: 20rpx 0;
  }
  .upload-btn {
    width: 140rpx;
    height: 140rpx;
    background: #f8f6f2;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    .plus {
      font-size: 50rpx;
    }
  }
  .preview-img {
    width: 140rpx;
    height: 140rpx;
    border-radius: 16rpx;
  }
  .submit-btn {
    background: #f0d4b8;
    color: #332b22;
    border-radius: 16rpx;
    padding: 20rpx;
    font-size: 34rpx;
    font-weight: bold;
  }
}

.list-box {
  padding: 20rpx;
}
.item {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  .content {
    font-size: 30rpx;
    line-height: 1.6;
  }
  .img-list {
    display: flex;
    gap: 10rpx;
    margin: 10rpx 0;
    .item-img {
      width: 120rpx;
      height: 120rpx;
      border-radius: 12rpx;
    }
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    margin-top: 10rpx;
    font-size: 26rpx;
    color: #999;
  }
  .status {
    padding: 4rpx 10rpx;
    border-radius: 6rpx;
    &.waiting {
      background: #fff4e4;
      color: #ff7d00;
    }
    &.success {
      background: #e8fff4;
      color: #00b42a;
    }
    &.cancel {
      background: #f2f3f5;
      color: #666;
    }
  }
  .reply {
    background: #f8f6f2;
    padding: 10rpx;
    border-radius: 10rpx;
    margin-top: 10rpx;
    color: #666;
  }
}
.load-more {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
}

.session-scroll {
  flex: 1;
  min-height: 0;
}
.empty {
  text-align: center;
  padding: 60rpx 0;
  color: #ccc;
  font-size: 26rpx;
}
</style>
