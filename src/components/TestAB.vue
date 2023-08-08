<script setup>
import { ref, defineEmits, onMounted, onUpdated } from 'vue'
import { Button, Slider } from 'ant-design-vue'
import msgs from '../configAB/msg'
import msgsStudy from '../configAB/msgStudy'
import * as config from '../configAB/config'

import audioAlert from '../assets/audio_alert.js'

const emit = defineEmits(['end-test'])
const props = defineProps({
  id: String,
  age: Number,
  version: String,
})

let fontSeqIdxs = []

let elAudioAlert = null

onMounted(() => {
  console.log('TestAB onMounted')
  const els = document.getElementsByClassName('audio-alert')
  if (els && els.length > 0) {
    elAudioAlert = els[0]
  }
  init()
})

onUpdated(() => {
  // console.log('TestAB onUpdated')
})

function init() {
  hideAll()
  showGuide.value = true
  switch (props.version) {
    case 'A':
      fontSeqIdxs = config.fontSeqIdxA
      break
    case 'B':
      fontSeqIdxs = config.fontSeqIdxB
      break
    default:
      console.error('invalid version:', props.version)
  }
  console.log('init end. fontSeqIdxs:', fontSeqIdxs)
}

function hideAll() {
  showGuide.value = false
  showGuideFormal.value = false
  showText.value = false
  showResult.value = false
  showQuestionSimple.value = false
  showQuestionComplete.value = false
  showRelax.value = false
}

// === 整体流程
const isStudy = ref(true)
let studyCount = 0
let correctCount = 0
let idx = 0
let testTime = 0
const answer = ref(0)
const answerTrue = ref(0)
let results = []
let timer = null
let tickTimer = null
let questionResults = []

function startStudy() {
  // 开始学习
  showGuide.value = false
  isStudy.value = true
  studyCount = 0
  correctCount = 0
  idx = -1
  nextTest()
}
function startTest() {
  // 开始正式测试
  showGuide.value = false
  isStudy.value = false
  correctCount = 0
  idx = -1
  if (needShowQuestionComplete(idx+1)) {
    hideAll()
    showQuestionComplete.value = true
    return
  }
  nextTest()
}
function needShowQuestionComplete(i) {
  // console.log('needShowQuestionComplete:', i)
  const seqIdx = Math.floor(i / config.groupSize)
  if (!isStudy.value) {
    if (i >= msgs.length || (i % config.groupSize === 0 && seqIdx % config.questionCompleteStep === 0)) {
      // 需要显示完整问卷
      // console.log('need')
      return true
    }
  }
  // console.log('no need')
  return false
}
function nextTest() {
  // 切换一轮测试
  clearTimeout(timer)
  hideAll()
  if (!isStudy.value && idx >= 0) {
    // 写入结果
    const r = {
      idx,
      testTime,
      answer: answer.value,
      answerTrue: answerTrue.value,
      tired: questionSimpleResult
    }
    results.push(r)
  }
  if (isStudy.value && studyCount >= 12 && correctCount >= 2) {
    showGuideFormal.value = true
    return
  }
  idx += 1
  const seqIdx = Math.floor(idx / config.groupSize)
  const ms = isStudy.value ? msgsStudy : msgs
  const len = ms.length
  // console.log('len:', len, ms)
  if (idx >= len) {
    if (isStudy.value) {
      idx = 0 // 循环
    } else {
      console.log('test end')
      emit('end-test', { results, questionResults })
      setTimeout(init, 1e3)
      return
    }
  }
  targetWord.value = ms[idx].word
  text.value = ms[idx].msg
  answerTrue.value = ms[idx].count
  testTime = 0
  answer.value = 0
  // 字体
  let fontSeqIdx = 0
  if (isStudy.value) {
    fontSeqIdx = config.fontSeqIdxStudy[0]
  } else {
    fontSeqIdx = fontSeqIdxs[seqIdx % fontSeqIdxs.length]
  }
  if (fontSeqIdx < 0) {
    // 随机字体
    fontSeqIdx = Math.floor(Math.random() * config.fontSeq.length)
  }
  const f = config.fontSeq[fontSeqIdx][idx % config.groupSize]
  textClass.value = 'font-' + f
  // 显示题目
  showText.value = true
  clearTimeout(timer)
  clearInterval(tickTimer)
  testBeginTime = new Date()
  timer = setTimeout(() => { onAnswer(0) }, config.circleTime)
  tickTimer = setInterval(() => { onCountDown() }, 1e3)
  countDown.value = 30
}

// === 导航
const showGuide = ref(false)
function skipStudy() {
  startTest()
}
// === 进入正式测试的导航
const showGuideFormal = ref(false)

// === 题目
const showText = ref(false)
const textClass = ref('')
const targetWord = ref('')
const text = ref('')
const countDown = ref(30)
let testBeginTime = null
let testEndTime = null
function onCountDown() {
  countDown.value -= 1
}
function onAnswer(n) {
  clearTimeout(timer)
  console.log('onAnswer:', n)
  testEndTime = new Date()
  testTime = Number(testEndTime) - Number(testBeginTime)
  answer.value = n
  if (answer.value == answerTrue.value) {
    correctCount += 1
  } else {
    correctCount = 0
  }
  showText.value = false
  if (isStudy.value) {
    showResult.value = true
    studyCount += 1
  } else {
    questionSimpleBegin()
  }
}
// === 结果
const showResult = ref(false)
function resultOK() {
  showResult.value = false
  questionSimpleBegin()
}
// === 简单问卷
let questionSimpleResult = 0
const showQuestionSimple = ref(false)
const tired = ref(1)
const tiredMarks = ref({
  1: '1分',
  2: '2分',
  3: '3分',
  4: '4分',
  5: '5分',
})
function questionSimpleBegin() {
  showQuestionSimple.value = true
  questionSimpleResult = 0
  timer = setTimeout(questionSimpleEnd, 5e3)
}
function questionSimpleOK() {
  questionSimpleResult = tired.value
  questionSimpleEnd()
}
function questionSimpleEnd() {
  tired.value = 1
  showQuestionSimple.value = false
  clearTimeout(timer)
  console.log('testTime:', testTime)
  const circleTime = Number(new Date()) - Number(testBeginTime)
  if (config.hasRelax && !isStudy.value && circleTime < config.circleTime - 300) {
    // 可以休息
    showRelax.value = true
    timer = setTimeout(relaxEnd, config.circleTime - circleTime)
    setTimeout(() => {
      // 播放提示音
      if (elAudioAlert) {
        // console.log(elAudioAlert)
        elAudioAlert.play()
      }
    }, config.circleTime - circleTime - 300)
  } else {
    relaxEnd()
  }
}
// === 完整问卷
const showQuestionComplete = ref(false)
function questionCompleteOK() {
  showQuestionComplete.value = false
  questionResults.push(questionResult.value)
  questionResult.value = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  nextTest()
}
const questionResult = ref([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
const showQuestionCompleteTexts = ref([
  '1. 头痛',
  '2. 恶心',
  '3. 眼睛刺痛',
  '4. 眼睛干涩',
  '5. 畏光',
  '6. 眼睛有异物感',
  '7. 眼睛流泪',
  '8. 眼睛沉重',
  '9. 视力模糊',
  '10. 重影',
  '11. 眼痒',
  '12. 感觉眨眼变频繁',
  '13. 感觉眼睛疲劳'
])
// === 休息
const showRelax = ref(false)
function relaxEnd() {
  clearTimeout(timer)
  showRelax.value = false
  if (!isStudy.value && needShowQuestionComplete(idx+1)) {
    showQuestionComplete.value = true
    return
  } else {
    nextTest()
  }
}

</script>

<template>
  <div class="ab wrapper">
    <div class="wrapper-inner">
      <div class="guide out" v-show="showGuide">
        <!-- 导航 -->
        <div class="text">指导语</div>
        <div style="height:20px;"></div>
        <div class="text left" style="margin-bottom: 5px">
          欢迎参加本次视觉搜索实验！每一轮任务中，将会展示一个目标搜索词组，需要您30s内找到目标搜索词组在文章中出现的次数，作答完毕并填答问卷。
        </div>
        <div class="text left" style="margin-bottom: 5px">
          请您在保证作答正确率的同时，尽快完成搜索任务。如果不能在30s内完成，则会强制切换屏幕，进入到下一轮的测试。
        </div>
        <div class="text left" style="margin-bottom: 5px">
          如果您准备好了，就开始进入练习阶段吧！
        </div>
        <Button class="btn" size="small" @click="startStudy">开始练习</Button>
        <Button class="btn" size="small" @click="skipStudy">跳过练习</Button>
      </div>
      <div class="guide-formal out" v-show="showGuideFormal">
        <!-- 进入正式测试的导航 -->
        <div class="text">
          接下来进入正式测试阶段，测试任务仍然为视觉搜索任务，您需要检索目标组出现的次数，如果您准备好了，就开始实验吧！
        </div>
        <Button class="btn" size="small" @click="startTest">开始正式测试</Button>
      </div>
      <div class="text out" v-show="showText" style="position: relative">
        <!-- 题目 -->
        <div :class="'text ' + textClass">本轮目标词组： {{ targetWord }}</div>
        <div style="height:20px;"></div>
        <div :class="'text ' + textClass" style="text-align: left">{{ text }}</div>
        <div style="height:20px;"></div>
        <div :class="'text ' + textClass">这段文字中一共出现了多少个“{{ targetWord }}”</div>
        <div>
          <Button v-for="i in [1, 2, 3, 4]" class="btn-answer" size="small" @click="onAnswer(i)" :key="i">{{ i }} 个</Button>
        </div>
        <div>
          <Button v-for="i in [5, 6, 7, 8]" class="btn-answer" size="small" @click="onAnswer(i)" :key="i">{{ i }} 个</Button>
        </div>
      </div>
      <div class="result out" v-show="showResult">
        <!-- 结果 -->
        <div class="text">
          正确答案： {{ answerTrue }}个<br/>
          作答情况： {{ (answerTrue == answer) ? '正确' : '错误' }}
        </div>
        <Button class="btn" size="small" @click="resultOK">确认</Button>
      </div>
      <div class="question-simple out" v-show="showQuestionSimple">
        <!-- 简单问卷 -->
        <div class="text">
          请对您当前的视觉疲劳情况进行打分：<br/>
          <Slider v-model:value="tired" :min="1" :max="5" :marks="tiredMarks" :tooltipVisible="false" />
          <br/>
          <div style="float: left; margin-left: -20px;">基本无疲劳感</div>
          <div style="float: right; margin-right: -20px;">严重疲劳感</div>
        </div>
        <Button class="btn" size="small" @click="questionSimpleOK">确认</Button>
      </div>
      <div class="question-complete out" v-show="showQuestionComplete">
        <!-- 完整问卷 -->
        <div class="text" style="font-weight: 800; margin-bottom: 20px;">主观评价问卷</div>
        <div class="text" style="text-align: left; margin-bottom: 10px;">请按照您当前的主观感受进行评分：</div>
        <div class="complete-dot-wrapper">
          <div class="complete-dot" style="left: 138px;">无</div>
          <div class="complete-dot" style="right: 0px;">非常严重</div>
        </div>
        <div class="complete-dot-wrapper">
          <div class="complete-dot" style="left: 138px;">1</div>
          <div class="complete-dot" style="left: 186px;">2</div>
          <div class="complete-dot" style="left: 234px;">3</div>
          <div class="complete-dot" style="left: 282px;">4</div>
          <div class="complete-dot" style="left: 330px;">5</div>
        </div>
        <div class="text complete">
          <div v-for="line, idx in showQuestionCompleteTexts" :key="idx" class="complete-line">
            <div class="complete-left">{{ line }}</div>
            <Slider class="complete-right" v-model:value="questionResult[idx]" :min="1" :max="5" :tooltipVisible="false" />
          </div>
        </div>
        <Button class="btn" size="small" @click="questionCompleteOK">确认</Button>
      </div>
      <div class="relax out" v-show="showRelax">
        <!-- 休息 -->
        <div class="text">
          休息一下
        </div>
      </div>
    </div>
    <div v-if="showText && isStudy" style="position: absolute; right: 0; top: 0;">
      倒计时：{{ countDown }}秒
    </div>
    <audio class="audio-alert" controls :src="'data:audio/mp3;base64,' + audioAlert" ></audio>
  </div>
</template>

<style lang="scss" scoped>
@import '../configAB/font.scss';
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  place-items: center;
  flex-direction: row;
  .wrapper-inner {
    margin: 0 auto; // 居中
    max-width: 579px;
  }
}
.out {
  text-align: center;
}
.text {
  font-size: 14px;
}
.text.left {
  text-align: left;
}
.btn {
  margin-top: 40px;
  margin-left: 10px;
  margin-right: 10px;
  display: inline-block;
  width: 120px;
  background-color: black;
  color: white;
  height: 30px;
}
.btn-answer {
  display: inline-block;
  margin-top: 20px;
  margin-left: 10px;
  margin-right: 10px;
  width: 60px;
  height: 40px;
}

.question-complete {
  width: 340px;
}

.complete-line {
  position: relative;
  height: 30px;
}
.complete-left {
  position: absolute;
  left: 0px;
  top: 5px;
  width: 140px;
  text-align: left;
}
.complete-right {
  position: absolute;
  right: 0px;
  float: right;
  width: 190px;
}
.complete-dot-wrapper {
  position: relative;
  height: 30px;
}
.complete-dot {
  position: absolute;
  top: 0;
}

audio {
  width: 0;
  height: 0;
}

:deep(.ant-slider) {
  // 整体增高4px
  height: 16px;
  .ant-slider-rail {
    height: 8px;
  }
  .ant-slider-track {
    height: 8px;
  }
  .ant-slider-step {
    height: 8px;
  }
  .ant-slider-handle {
    width: 18px;
    height: 18px;
  }
  .ant-slider-dot {
    width: 12px;
    height: 12px;
  }
}
</style>