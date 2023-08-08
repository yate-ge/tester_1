<script setup>
import { ref, defineEmits, onMounted } from 'vue'
import { Button, Slider } from 'ant-design-vue'
import msgs from '../config/msg'
import msgsStudy from '../config/msgStudy'
import * as config from '../config/config'

const emit = defineEmits(['end-test'])
const props = defineProps({
  id: String,
  age: Number
})

onMounted(() => {
  init()
})

function init() {
  hideAll()
  showGuide.value = true
}

function hideAll() {
  showGuide.value = false
  showGuideFormal.value = false
  showTarget.value = false
  showText.value = false
  showAnswer.value = false
  showResult.value = false
  showQuestionSimple.value = false
  showQuestionComplete.value = false
  showRelax.value = false
  changeScreen.value = false
}

// 整体流程
let isStudy = true
let correctCount = 0
let idx = 0
let testTime = 0
const answer = ref(0)
const answerTrue = ref(0)
let results = []
let timer = null
let questionResults = []

function startStudy() {
  // 开始学习
  showGuide.value = false
  isStudy = true
  correctCount = 0
  idx = -1
  nextTest()
}
function startTest() {
  // 开始正式测试
  showGuide.value = false
  isStudy = false
  correctCount = 0
  idx = -1
  if (needShowQuestionComplete(idx+1)) {
    showQuestionComplete.value = true
    return
  }
  nextTest()
}
function needShowQuestionComplete(i) {
  console.log('needShowQuestionComplete:', i)
  const seqIdx = Math.floor(i / config.groupSize)
  if (!isStudy) {
    if (i >= msgs.length || (i % config.groupSize === 0 && seqIdx % config.questionCompleteStep === 0)) {
      // 需要显示完整问卷
      console.log('need')
      return true
    }
  }
  console.log('no need')
  return false
}
function nextTest() {
  // 切换一轮测试
  clearTimeout(timer)
  hideAll()
  if (!isStudy && idx >= 0) {
    // 写入结果
    const r = {
      idx,
      testTime,
      answer: answer.value,
      answerTrue: answerTrue.value,
      tired: tired.value
    }
    results.push(r)
  }
  if (isStudy && correctCount >= 2) {
    showGuideFormal.value = true
    return
  }
  idx += 1
  const seqIdx = Math.floor(idx / config.groupSize)
  const ms = isStudy ? msgsStudy : msgs
  const len = ms.length
  if (idx >= len) {
    if (isStudy) {
      idx = 0 // 循环
    } else {
      // todo: 结束，写文件
      emit('end-test')
      setTimeout(init, 1e3)
      return
    }
  }
  targetWord.value = ms[idx].word
  text.value = ms[idx].msg
  answerTrue.value = ms[idx].count
  testTime = 0
  answer.value = 0
  if (!isStudy) {
    // 字体： textClass
    let fontSeqIdx = config.fontSeqIdx[seqIdx]
    if (fontSeqIdx < 0) {
      fontSeqIdx = Math.floor(Math.random() * config.fontSeq.length)
    }
    const f = config.fontSeq[fontSeqIdx][idx % config.groupSize]
    textClass.value = 'font-' + f
  }
  showTarget.value = true
}

// 导航
const showGuide = ref(false)
function skipStudy() {
  startTest()
}
// 进入正式测试的导航
const showGuideFormal = ref(false)

// 目标词
const showTarget = ref(false)
const targetWord = ref('')
function targetOK() {
  showTarget.value = false
  showText.value = true
  testBeginTime = new Date()
  timer = setTimeout(textOK, config.circleTime)
}
// 题目
const showText = ref(false)
const textClass = ref('')
const text = ref('')
let testBeginTime = null
let testEndTime = null
function textOK() {
  clearTimeout(timer)
  testEndTime = new Date()
  testTime = Number(testEndTime) - Number(testBeginTime)
  showText.value = false
  showAnswer.value = true
  timer = setTimeout(() => { onAnswer(0) }, 5 * 1e3)
}
// 作答
const showAnswer = ref(false)
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
  if (isStudy) {
    showResult.value = true
  } else {
    showQuestionSimple.value = true
  }
}
// 结果
const showResult = ref(false)
function resultOK() {
  showResult.value = false
  showQuestionSimple.value = true
}
// 简单问卷
const showQuestionSimple = ref(false)
const tired = ref(1)
const tiredMarks = ref({
  1: '1分',
  2: '2分',
  3: '3分',
  4: '4分',
  5: '5分',
})
function questionSimpleOK() {
  showQuestionSimple.value = false
  console.log('testTime:', testTime)
  if (testTime >= config.circleTime) {
    if (needShowQuestionComplete(idx+1)) {
      showQuestionComplete.value = true
      return
    } else {
      nextTest()
    }
  } else {
    showRelax.value = true
    timer = setTimeout(() => {
      showRelax.value = false
      if (needShowQuestionComplete(idx+1)) {
        showQuestionComplete.value = true
        return
      } else {
        nextTest()
      }
    }, config.circleTime - testTime);
  }
}
// 完整问卷
const showQuestionComplete = ref(false)
function questionCompleteOK() {
  showQuestionComplete.value = false
  questionResults.push(questionResult.value)
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
// 休息
const showRelax = ref(false)
// 切换屏幕
const changeScreen = ref(false)

</script>

<template>
  <div class="first wrapper">
    <div class="wrapper-inner">
      <div class="out" v-show="showGuide">
        <!-- 导航 -->
        <div class="text">
          欢迎参加本次实验。您需要在30秒内完成一次完整的视觉搜索任务，如果不能完成，则会强制切换屏幕，进入到下一轮的测试。如果您准备好了，就开始进入练习阶段吧！
        </div>
        <Button class="btn" size="small" @click="startStudy">开始练习</Button>
        <Button class="btn" size="small" @click="skipStudy">跳过练习</Button>
      </div>
      <div class="out" v-show="showGuideFormal">
        <!-- 进入正式测试的导航 -->
        <div class="text">
          接下来进入正式测试阶段，测试任务仍然为视觉搜索任务，您需要检索目标组出现的次数，如果您准备好了，就开始实验吧！
        </div>
        <Button class="btn" size="small" @click="startTest">开始正式测试</Button>
      </div>
      <div class="out" v-show="showTarget">
        <!-- 目标词 -->
        <div class="text">
          请阅读之后的文字<br/>
          数一数这段文字中<br/>
          一共出现了多少个<b>“{{ targetWord }}”</b>
        </div>
        <Button class="btn" size="small" @click="targetOK">确认</Button>
      </div>
      <div class="out" v-show="showText">
        <!-- 题目 -->
        <div :class="'text ' + textClass">{{ text }}</div>
        <Button class="btn" size="small" @click="textOK">记住了</Button>
      </div>
      <div class="out" v-show="showAnswer">
        <!-- 作答 -->
        <div class="text">
          这段文字中共有几个“{{ targetWord }}”？<br/>
          提示：请在5秒内作答完毕
        </div>
        <div>
          <Button v-for="i in [1, 2, 3]" class="btn-answer" size="small" @click="onAnswer(i)" :key="i">{{ i }} 个</Button>
        </div>
        <div>
          <Button v-for="i in [4, 5, 6]" class="btn-answer" size="small" @click="onAnswer(i)" :key="i">{{ i }} 个</Button>
        </div>
      </div>
      <div class="out" v-show="showResult">
        <!-- 结果 -->
        <div class="text">
          正确答案： {{ answerTrue }}个<br/>
          作答情况： {{ (answerTrue == answer) ? '正确' : '错误' }}
        </div>
        <Button class="btn" size="small" @click="resultOK">确认</Button>
      </div>
      <div class="out" v-show="showQuestionSimple">
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
      <div class="out" v-show="showQuestionComplete">
        <!-- 完整问卷 -->
        <div class="text complete">
          <div style="font-weight: 800; margin-bottom: 20px;">主观评价问卷</div>
          <div style="text-align: left; margin-left: -50px;">请按照您当前的主观感受进行评分：</div>
          <div style="position: relative; height: 60px;">
            <div class="complete-dot" style="left: 52px; top: 15px;">无</div>
            <div class="complete-dot" style="right: -90px; top: 15px">非常严重</div>
            <div class="complete-dot" style="left: 52px; top: 40px;">1</div>
            <div class="complete-dot" style="left: 100px; top: 40px;">2</div>
            <div class="complete-dot" style="left: 148px; top: 40px;">3</div>
            <div class="complete-dot" style="left: 196px; top: 40px;">4</div>
            <div class="complete-dot" style="left: 244px; top: 40px;">5</div>
          </div>
          <div v-for="line, idx in showQuestionCompleteTexts" :key="idx" class="complete-line">
            <div class="complete-left">{{ line }}</div>
            <Slider class="complete-right" v-model:value="questionResult[idx]" :min="1" :max="5" :tooltipVisible="false" />
          </div>
        </div>
        <Button class="btn" size="small" @click="questionCompleteOK">确认</Button>
      </div>
      <div class="out" v-show="showRelax">
        <!-- 休息 -->
        <div class="text">
          休息一下
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../config/font.scss';
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  place-items: center;
  flex-direction: row;
  .wrapper-inner {
    margin: 0 auto; // 居中
    max-width: 500px;
  }
}
.out {
  text-align: center;
}
.text {
  font-size: 14px;
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

.complete-line {
  position: relative;
  height: 35px;
}
.complete-left {
  position: absolute;
  left: -80px;
  top: 5px;
  width: 140px;
  text-align: left;
}
.complete-right {
  position: absolute;
  right: -80px;
  float: right;
  width: 190px;
}
.complete-dot {
  position: absolute;
}
</style>