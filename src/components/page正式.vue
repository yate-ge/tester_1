<script setup>
import { ref, inject, defineEmits, onMounted, onUpdated, computed } from 'vue'
import { Button, Slider, RadioGroup } from 'ant-design-vue'
import msgsOrg from '../config正式/msg'
import msgsStudy from '../config正式/msgStudy'
import * as config from '../config正式/config'
import * as log from '../log'

import audioAlert from '../assets/audio_alert.js'

const spinning = inject('spinning')

const emit = defineEmits(['end-test'])
const props = defineProps({
  id: String,
  age: Number,
  sex: String,
})

let elAudioAlert = null

console.log('正式 create', Number(new Date()))

let msgs = msgsOrg
if (config.debugMode) {
  msgs = msgs.slice(0, 24)
}

onMounted(() => {
  console.log('正式 onMounted', Number(new Date()))
  const els = document.getElementsByClassName('audio-alert')
  if (els && els.length > 0) {
    elAudioAlert = els[0]
  }
  init()
  spinning.value = false
})

onUpdated(() => {
  // console.log('TestAB onUpdated')
})

function init() {
  hideAll()
  showGuide.value = true
  console.log('init end.')
}

function hideAll() {
  showGuide.value = false
  showGuideFormal.value = false
  showCross.value = false
  showText.value = false
  showAnswer.value = false
  showResult.value = false
  showQuestionNew.value = false
  showLoading.value = false
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
let questionCompleteResults = []

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
  testTime = 20e3 // 防止出现载入中界面
  hideAll()
  ifShowQuestionComplete() // 正式开始前进行一次长问卷
  // nextTest()
}
function nextTest() {
  // 切换一轮测试
  clearTimeout(timer)
  hideAll()
  if (isStudy.value && studyCount >= 6 && correctCount >= 2) {
    // 学习结束
    showGuideFormal.value = true
    return
  }
  if (!isStudy.value && idx >= 0) {
    // 写入结果
    const r = {
      idx,
      testTime,
      answer: answer.value,
      answerTrue: answerTrue.value
    }
    results.push(r)
  }
  idx += 1
  answer.value = 0
  if (isStudy.value) {
    const i = idx % 6
    const m = msgsStudy[i]
    targetWord.value = m.word
    text.value = m.msg
    answerTrue.value = m.count
    const f = config.fontSeq[config.fontSeqIdxStudy][i]
    textClass.value = 'font-' + f
  } else {
    if (idx >= msgs.length) {
      // 结束
      console.log('test end')
      emit('end-test', { results, questionResults, questionCompleteResults })
      setTimeout(init, 1e3)
      return
    }
    const m = msgs[idx]
    targetWord.value = m.word
    text.value = m.msg
    answerTrue.value = m.count
    const block = Math.floor(idx / 40)
    const blockIdx = idx % 40
    const line = Math.floor(blockIdx / 8)
    const f = config.fontSeq[block][line]
    textClass.value = 'font-' + f
  }
  // 显示十字
  beginShowCross()
}

// === 导航
const showGuide = ref(false)
function skipStudy() {
  startTest()
}
// === 进入正式测试的导航
const showGuideFormal = ref(false)

// === 十字
const showCross = ref(false)
function beginShowCross() {
  showCross.value = true
  clearTimeout(timer)
  let tm = 300 // 默认时间
  if (idx > 0) {
    // 之前有过测试，需要判断时间
    tm = 20e3 - testTime - 3
    if (tm < 300) {
      tm = 300
    } else if (tm > 1e3) {
      tm = 1e3
    }
  }
  if (config.debugMode) {
    tm = 300
  }
  timer = setTimeout(() => { beginShowText() }, tm)
  setTimeout(() => {
    // 播放提示音
    if (elAudioAlert) {
      // console.log(elAudioAlert)
      elAudioAlert.play()
    }
  }, tm - 300);
}

// === 题目
const showText = ref(false)
const textClass = ref('')
const targetWord = ref('')
const text = ref('')
const countDown = ref(30)
let testBeginTime = 0
let testEndTime = 0
function beginShowText() {
  showCross.value = false
  countDown.value = 20
  showText.value = true
  clearTimeout(timer)
  clearInterval(tickTimer)
  testBeginTime = Number(new Date())
  timer = setTimeout(() => { beginShowAnswer() }, 20e3)
  tickTimer = setInterval(() => { onCountDown() }, 1e3)
}
function onCountDown() {
  countDown.value -= 1
}

// === 回答
const showAnswer = ref(false)
function beginShowAnswer() {
  clearTimeout(timer)
  clearInterval(tickTimer)
  testEndTime = Number(new Date())
  testTime = testEndTime - testBeginTime
  showText.value = false
  showAnswer.value = true
}
function onAnswer(n) {
  clearTimeout(timer)
  console.log('onAnswer:', n)
  answer.value = n
  if (answer.value == answerTrue.value) {
    correctCount += 1
  } else {
    correctCount = 0
  }
  showAnswer.value = false
  if (isStudy.value) {
    log.log('练习:', idx, ': 时间 ', testTime, ', 结果 ', (answer.value == answerTrue.value) ? 'true' : 'false')
    beginShowResult()
  } else {
    log.log(idx, ': 时间 ', testTime, ', 结果 ', (answer.value == answerTrue.value) ? 'true' : 'false')
    ifShowQuestionNew()
  }
}

// === 结果
const showResult = ref(false)
function beginShowResult() {
  showResult.value = true
  studyCount += 1
}
function resultOK() {
  showResult.value = false
  ifShowQuestionNew()
}

// === 新问卷
let questionResult = []
const showQuestionNew = ref(false)
const questionNewValue = ref(0)
const questionNewValueMarks = ref({
  1: '1分',
  2: '2分',
  3: '3分',
  4: '4分',
  5: '5分',
  6: '6分',
  7: '7分',
  8: '8分',
  9: '9分',
})
const questionNewOptions = [
  { value: 1, label: '1分' },
  { value: 2, label: '2分' },
  { value: 3, label: '3分' },
  { value: 4, label: '4分' },
  { value: 5, label: '5分' },
  { value: 6, label: '6分' },
  { value: 7, label: '7分' },
  { value: 8, label: '8分' },
  { value: 9, label: '9分' }
]
const questionNewTextFirstLine = ref('')
const questionNewTextSecondLine = ref('')
const questionNewTextLeft = ref('')
const questionNewTextRight = ref('')
let questionNewIdx = 0
const questionNewTextFirstLines = [
  '请对您当前的视觉疲劳度进行打分：',
  '请对您当前的视觉舒适度进行打分：',
  '请对您当前字号的易辨识度进行打分：',
  '请对您当前的阅读速度进行打分：',
]
const questionNewTextSecondLines = [
  '视觉疲劳度的定义是：阅读时眼睛是否感到疲劳',
  '视觉舒适度的定义是：阅读时眼睛是否感觉舒服',
  '易辨识度的定义是：文字辨识是否轻松',
  '',
]
const questionNewTextLefts = [
  '基本无疲劳感',
  '非常不舒服',
  '非常困难',
  '非常慢',
]
const questionNewTextRights = [
  '严重疲劳感',
  '非常舒服',
  '非常轻松',
  '非常快',
]
function ifShowQuestionNew() {
  showAnswer.value = false
  showResult.value = false
  let qcStep = 4
  if (config.debugMode) {
    qcStep = 4;
  }
  if ((idx + 1) % qcStep == 0) {
    questionNewIdx = 0
    questionResult = []
    questionNewValue.value = 0
    beginShowQuestionNew()
  } else {
    // beginShowLoading()
    ifShowQuestionComplete()
  }
}
function beginShowQuestionNew() {
  showQuestionNew.value = true
  questionNewTextFirstLine.value = questionNewTextFirstLines[questionNewIdx];
  questionNewTextSecondLine.value = questionNewTextSecondLines[questionNewIdx];
  questionNewTextLeft.value = questionNewTextLefts[questionNewIdx];
  questionNewTextRight.value = questionNewTextRights[questionNewIdx];
}
function questionNewOK() {
  questionResult.push(questionNewValue.value)
  questionNewValue.value = 0
  questionNewIdx++
  if (questionNewIdx < 4) {
    beginShowQuestionNew()
    return
  }
  if (!isStudy.value) {
    log.log('问卷', questionResult)
    questionResults.push(questionResult)
  }
  // beginShowLoading()
  ifShowQuestionComplete()
}

// === 完整问卷
const showQuestionComplete = ref(false)
const questionCompleteOptions = [
  { value: 1, label: '' },
  { value: 2, label: '' },
  { value: 3, label: '' },
  { value: 4, label: '' },
  { value: 5, label: '' },
  { value: 6, label: '' },
  { value: 7, label: '' },
  { value: 8, label: '' },
  { value: 9, label: '' }
]
const showQuestionCompleteTexts = [
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
]
const questionCompleteResult = ref([])
for (let i=0; i<showQuestionCompleteTexts.length; i++) {
  questionCompleteResult.value.push(0)
}
const disableQuestionCompleteOK = computed(() => {
  let r = false
  for (const v of questionCompleteResult.value) {
    if (Number(v) < 1) {
      r = true
      break
    }
  }
  return r
})
function ifShowQuestionComplete() {
  showQuestionNew.value = false
  let qcStep = 40  // 一大轮一次完整问卷（8*5）
  if (config.debugMode) {
    qcStep = 8
  }
  if ((idx + 1) % qcStep == 0) { // 测试时使用
    // 清空结果
    for (const i in questionCompleteResult.value) {
      questionCompleteResult.value[i] = 0
    }
    beginShowQuestionComplete()
  } else {
    beginShowLoading()
  }
}
function beginShowQuestionComplete() {
  showQuestionComplete.value = true
}
function questionCompleteOK() {
  showQuestionComplete.value = false
  console.log('complete result:', questionCompleteResult)
  if (!isStudy.value) {
    log.log('长问卷:', questionCompleteResult.value)
    questionCompleteResults.push(questionCompleteResult.value.map(v => v))
  }
  beginShowLoading()
}

// === 加载中
const showLoading = ref(false)
function beginShowLoading() {
  showQuestionNew.value = false
  showLoading.value = true
  clearTimeout(timer)
  let tm = 20e3 - testTime
  if (tm > 3e3) {
    tm = 3e3
  } else if (tm <= 0) {
    tm = 0
  }
  if (config.debugMode) {
    if (tm > 100) {
      tm = 100
    }
  }
  timer = setTimeout(() => { 
    clearTimeout(timer)
    showLoading.value = false
    nextTest()
  }, tm)
}

</script>

<template>
  <div class="正式 wrapper">
    <div class="wrapper-inner">
      <div class="guide out" v-show="showGuide">
        <!-- 导航 -->
        <div class="text">指导语</div>
        <div style="height:20px;"></div>
        <div class="text left" style="margin-bottom: 5px">
          欢迎参加本次视觉搜索实验！每一轮任务中，将会展示一个目标搜索词组，需要您找到目标搜索词组在文章中出现的次数，进行作答并填答问卷。
        </div>
        <div class="text left" style="margin-bottom: 5px">
          请您在保证作答正确率的同时，尽快完成搜索任务。如果您准备好了，就开始进入练习阶段吧！
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
      <div class="cross out" v-show="showCross">
        <div class="cross-wrapper">
          <div class="cross-row">
            <div class="cross-item lt" /><div class="cross-item rt" />
          </div>
          <div class="cross-row">
            <div class="cross-item lb" /><div class="cross-item rb" />
          </div>
        </div>
      </div>
      <div class="text out" v-show="showText" style="position: relative">
        <!-- 题目 -->
        <div :class="'text ' + textClass">本轮目标词组： {{ targetWord }}</div>
        <div style="height:20px;"></div>
        <div :class="'text ' + textClass" style="text-align: left">{{ text }}</div>
        <div style="height:20px;"></div>
        <Button class="btn" size="small" @click="beginShowAnswer">下一步</Button>
      </div>
      <div class="answer out" v-show="showAnswer">
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
      <div class="question-new out" v-show="showQuestionNew">
        <!-- 新问卷 -->
        <div class="text">
          <div>{{ questionNewTextFirstLine }}</div>
          <div v-if="questionNewTextSecondLine">{{ questionNewTextSecondLine }}</div>
          <!-- <Slider v-model:value="questionNewValue" :min="1" :max="9" :marks="questionNewValueMarks" :tooltipVisible="false" /> -->
          <RadioGroup v-model:value="questionNewValue" :options="questionNewOptions" />
          <div style="float: left; margin-left: -20px;">{{ questionNewTextLeft }}</div>
          <div style="float: right; margin-right: -20px;">{{ questionNewTextRight }}</div>
        </div>
        <Button :disabled="Number(questionNewValue) < 1" class="btn" size="small" @click="questionNewOK">确认</Button>
      </div>
      <div class="question-complete out" v-show="showQuestionComplete">
        <!-- 完整问卷 -->
        <div class="text" style="font-weight: 800; margin-bottom: 10px;">主观评价问卷</div>
        <div class="text" style="text-align: left; margin-bottom: 5px;">请按照您当前的主观感受进行评分：</div>
        <div class="text complete-dot-wrapper">
          <div class="complete-dot" style="left: 190px;">无</div>
          <div class="complete-dot" style="right: 0px;">非常严重</div>
        </div>
        <div class="complete-dot-wrapper">
          <div class="complete-dot" style="left: 193px;">1</div>
          <div class="complete-dot" style="left: 233px;">2</div>
          <div class="complete-dot" style="left: 273px;">3</div>
          <div class="complete-dot" style="left: 314px;">4</div>
          <div class="complete-dot" style="left: 354px;">5</div>
          <div class="complete-dot" style="left: 394px;">6</div>
          <div class="complete-dot" style="left: 435px;">7</div>
          <div class="complete-dot" style="left: 475px;">8</div>
          <div class="complete-dot" style="left: 515px;">9</div>
        </div>
        <div class="text complete">
          <div v-for="line, idx in showQuestionCompleteTexts" :key="idx" class="complete-line">
            <div class="complete-left">{{ line }}</div>
            <RadioGroup class="complete-right" v-model:value="questionCompleteResult[idx]" :options="questionCompleteOptions" />
          </div>
        </div>
        <Button :disabled="disableQuestionCompleteOK" class="btn" size="small" @click="questionCompleteOK">确认</Button>
      </div>
      <div class="loading out" v-show="showLoading">
        <!-- 加载中 -->
        <div class="text">
          加载中......
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
@import '../config正式/font.scss';
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
  // font-size: 19px;
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

.cross {
  .cross-wrapper {
    width: 50px;
    height: 50px;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    .cross-row {
      width: 100%;
      height: 50%;
      .cross-item {
        width: 50%;
        height: 100%;
        display: inline-block;
        &.lt {
          border-right: 0.5px solid;
          border-bottom: 0.5px solid;
        }
        &.rt {
          border-left: 0.5px solid;
          border-bottom: 0.5px solid;
        }
        &.lb {
          border-right: 0.5px solid;
          border-top: 0.5px solid;
        }
        &.rb {
          border-left: 0.5px solid;
          border-top: 0.5px solid;
        }
      }
    }
  }
}

.question-new {
  width: 570px;
  text-align: left;
  overflow: show;
  position: relative;
  .text {
    font-size: 19px;
  }
  button {
    position: absolute;
    left: 50%;
    top: 200px;
    transform: translate(-50%, 0);
  }
}
.question-complete {
  width: 570px;
  .text {
    font-size: 19px;
  }
  .complete-line {
    position: relative;
    height: 30px;
    line-height: 30px;
    border-bottom: 1px solid #ddd;
  }
  .complete-left {
    position: absolute;
    height: 30px;
    line-height: 30px;
    left: 0px;
    top: 0px;
    width: 180px;
    text-align: left;
  }
  .complete-right {
    position: absolute;
    height: 30px;
    line-height: 30px;
    right: 0px;
    top: 0px;
    padding-top: 4px;
    width: 400px;
  }
  .complete-dot-wrapper {
    position: relative;
    height: 30px;
  }
  .complete-dot {
    position: absolute;
    top: 0;
  }
  .btn {
    margin-top: 20px;
  }
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