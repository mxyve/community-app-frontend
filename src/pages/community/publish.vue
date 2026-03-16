<template>
  <view class="container" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
    <!-- 顶部导航 - 杂志风格 -->
    <view class="header">
      <view class="header-left">
        <image
          class="back-icon"
          src="/static/icon/arrow_left.png"
          mode="aspectFit"
          @click="goBack"
        ></image>
        <text class="header-title">分享新鲜事</text>
      </view>
    </view>

    <!-- 主要内容区 -->
    <scroll-view class="content-wrapper" scroll-y show-scrollbar="false">
      <!-- 标题输入 - 杂志卡片风格 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">标题</text>
          <text class="card-count">{{ form.title.length }}/50</text>
        </view>
        <input
          v-model="form.title"
          placeholder="给你的分享起个吸引人的标题"
          placeholder-class="placeholder"
          maxlength="50"
          class="title-input"
        />
      </view>

      <!-- 内容输入 - 杂志卡片风格 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">内容</text>
          <text class="card-count">{{ form.content.length }}/500</text>
        </view>
        <textarea
          v-model="form.content"
          placeholder="分享你的邻里故事、求助或发现..."
          placeholder-class="placeholder"
          auto-height
          maxlength="500"
          class="content-input"
        />
      </view>

      <!-- 图片上传区域 (模拟杂志风格) -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">图片</text>
          <text class="card-desc">可选，最多9张</text>
        </view>
        <view class="image-section">
          <view class="image-upload" @click="chooseImage">
            <text class="upload-icon">📷</text>
            <text class="upload-text">添加照片</text>
          </view>
          <view class="image-list" v-if="imageList.length > 0">
            <view class="image-item" v-for="(img, index) in imageList" :key="index">
              <image :src="img" mode="aspectFill" class="preview-image"></image>
              <view class="image-remove" @click="removeImage(index)">✕</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 标签选择 - 杂志卡片风格 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">选择标签</text>
          <text class="card-desc">选一个最贴切的</text>
        </view>
        <view class="tag-list">
          <view
            v-for="tag in tagList"
            :key="tag.tagId"
            class="tag-item"
            :class="{ active: form.tagId === tag.tagId }"
            @click="form.tagId = tag.tagId"
          >
            <text class="tag-emoji">{{ getTagEmoji(tag.name) }}</text>
            <text>{{ tag.name }}</text>
          </view>
        </view>
      </view>

      <!-- 位置选择 - 杂志卡片风格 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">所在位置</text>
          <text class="card-desc">让邻居更近</text>
        </view>
        <view class="location-selector" @click="goToSelectLocation">
          <view class="location-left">
            <text class="location-icon">📍</text>
            <text class="location-text">{{ locationText }}</text>
          </view>
          <text class="location-arrow">›</text>
        </view>
      </view>

      <view class="fixed-publish">
        <button class="publish-btn" @click="handlePublish">发布文章</button>
      </view>
      <!-- 留白空间 -->
      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { createArticle } from '@/service/community.js'
import { getTagList } from '@/service/community.js'

const { safeAreaInsets } = uni.getSystemInfoSync()

// 标签列表
const tagList = ref([])
const form = ref({
  title: '',
  content: '',
  img: '',
  tagId: null,
  province: '',
  city: '',
  area: '',
})

// 图片列表
const imageList = ref([])

// 显示选择的地区
const locationText = ref('点击选择地区')

// 标签emoji映射
const tagEmojiMap = {
  失物招领: '🧾',
  生活碎片: '🏠',
  邻里互助: '🤝',
  社区活动: '🎉',
  萌宠日常: '🐕',
  闲置交换: '🔄',
  拼车出行: '🚗',
  紧急求助: '🆘',
}

// 获取标签
onMounted(() => {
  fetchTagList()

  // 监听地址选择
  uni.$on('addressSelected', (addr) => {
    form.value.province = addr.province || ''
    form.value.city = addr.city || ''
    form.value.area = addr.area || ''
    locationText.value = addr.fullText || '未选择地区'
  })
})

onUnmounted(() => {
  uni.$off('addressSelected')
})

const fetchTagList = async () => {
  const res = await getTagList()
  tagList.value = res.data || []
}

const getTagEmoji = (tagName) => {
  return tagEmojiMap[tagName] || '📌'
}

// 去选择地址
const goToSelectLocation = () => {
  uni.navigateTo({
    url: '/pages/index/address',
  })
}

// 选择图片
const chooseImage = () => {
  uni.chooseImage({
    count: 9 - imageList.value.length,
    success: (res) => {
      imageList.value = [...imageList.value, ...res.tempFilePaths]
      // 实际项目中需要上传图片并获取URL
    },
  })
}

// 移除图片
const removeImage = (index) => {
  imageList.value.splice(index, 1)
}

// 发布
const handlePublish = async () => {
  if (!form.value.title) {
    return uni.showToast({ title: '标题不能为空', icon: 'none' })
  }
  if (!form.value.content) {
    return uni.showToast({ title: '内容不能为空', icon: 'none' })
  }
  if (!form.value.tagId) {
    return uni.showToast({ title: '请选择标签', icon: 'none' })
  }

  try {
    // 模拟图片上传，实际需要上传图片并获取URL
    // form.value.img = imageList.value[0] || ''

    await createArticle(form.value)
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch (err) {
    uni.showToast({ title: '发布失败', icon: 'none' })
  }
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.container {
  background: #faf5ef;
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

.header-title {
  font-size: 36rpx;
  color: #4a3a2e; // 深棕色
  font-weight: 600;
}

/* 内容区域 */
.content-wrapper {
  flex: 1;
  padding: 30rpx;
  box-sizing: border-box;
  max-width: 100vw;
}

/* 杂志卡片风格 */
.card {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 30rpx;
  border: 2rpx solid #f0e4d8;
  box-shadow: 0 8rpx 16rpx -12rpx #d4b6a0;

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
  }

  &-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #4a3a2e;
    position: relative;
    padding-left: 16rpx;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6rpx;
      height: 30rpx;
      background: #b86b3f;
      border-radius: 3rpx;
    }
  }

  &-desc {
    font-size: 24rpx;
    color: #b9a89a;
  }

  &-count {
    font-size: 24rpx;
    color: #b9a89a;
    background: #f8f6f2;
    padding: 4rpx 16rpx;
    border-radius: 30rpx;
  }
}

/* 输入框样式 */
.title-input {
  font-size: 34rpx;
  color: #4a3a2e;
  padding: 10rpx 0;
  width: 100%;
}

.content-input {
  font-size: 30rpx;
  color: #5f4e40;
  width: 100%;
  min-height: 200rpx;
  line-height: 1.6;
}

.placeholder {
  color: #b9a89a;
  font-size: 30rpx;
}

/* 图片上传区域 */
.image-section {
  margin-top: 10rpx;
}

.image-upload {
  background: #f8f6f2;
  border: 2rpx dashed #d4b6a0;
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;

  .upload-icon {
    font-size: 64rpx;
    color: #b86b3f;
  }

  .upload-text {
    font-size: 28rpx;
    color: #8f7a68;
  }
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 20rpx;
}

.image-item {
  width: 160rpx;
  height: 160rpx;
  border-radius: 20rpx;
  position: relative;
  border: 4rpx solid white;
  box-shadow: 0 6rpx 12rpx -10rpx #a6897a;
}

.preview-image {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
}

.image-remove {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 40rpx;
  height: 40rpx;
  background: #ff4444;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  border: 2rpx solid white;
}

/* 标签列表 */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 10rpx;
}

.tag-item {
  background: #f8f6f2;
  padding: 16rpx 32rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #5f4e40;
  border: 2rpx solid #f0e4d8;
  display: flex;
  align-items: center;
  gap: 8rpx;
  transition: all 0.2s;

  .tag-emoji {
    font-size: 32rpx;
  }

  &.active {
    background: #b86b3f;
    color: white;
    border-color: #b86b3f;
    transform: translateY(-2rpx);
    box-shadow: 0 6rpx 12rpx -8rpx #b86b3f;
  }

  &:active {
    transform: scale(0.96);
  }
}

/* 位置选择器 */
.location-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f6f2;
  padding: 24rpx 30rpx;
  border-radius: 30rpx;
  border: 2rpx solid #f0e4d8;
  margin-top: 10rpx;
}

.location-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.location-icon {
  font-size: 36rpx;
}

.location-text {
  font-size: 30rpx;
  color: #4a3a2e;

  &:empty {
    color: #b9a89a;
  }
}

.location-arrow {
  font-size: 48rpx;
  color: #b86b3f;
  line-height: 1;
}

/* 底部留白 */
.bottom-space {
  height: 40rpx;
}

/* 移除原生的发布按钮 */
.publish {
  display: none;
}

.fixed-publish {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  padding: 20rpx 30rpx;
  background: #f8f6f2;
  border-top: 1rpx solid #f0d4b8;
  box-sizing: border-box;
}
.publish-btn {
  width: 100%;
  background: #b86b3f;
  color: #fff;
  border-radius: 30rpx;
  padding: 28rpx;
  font-size: 30rpx;
  font-weight: 500;
}
</style>
