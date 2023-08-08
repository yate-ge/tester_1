<script setup>
import { ref, provide } from 'vue';
import { Spin } from 'ant-design-vue'
import DateFormat from 'dateformat';
import LoginPage from './components/LoginPage.vue'
import TestFirst from './components/TestFirst.vue'
import TestAB from './components/TestAB.vue'
import Debug from './components/Debug.vue'
import DebugShowFonts from './components/DebugShowFonts.vue'
import TestPage from './components/TestPage.vue'
import CDemo from './components/CDemo.vue'
import * as configAB from './configAB/config'
import msgAB from './configAB/msg'
import * as util from './util'
import * as log from './log'

import Page正式 from './components/page正式.vue'
import Login正式 from './components/login正式.vue'

log.init()

const version = ref(1.0)

const spinning = ref(false)
provide('spinning', spinning)

// const runningTest = ref('')
// const runningTest = ref('demo')
// const runningTest = ref('TestPage')
// const runningTest = ref('DebugShowFonts')
const runningTest = ref('debug')
const id = ref('')
const age = ref(0)
const sex = ref('')

function startTest(version, _id, _age, _sex) {
  log.log('=== begin:', _id, _age, _sex)
  spinning.value = true
  setTimeout(() => {
    runningTest.value = version
    id.value = _id
    age.value = _age
    sex.value = _sex
  }, 0);
  console.log('startTest:', version, _id, _age, _sex, Number(new Date()));
}

// 测试结束，写结果
async function endTest(result) {
  log.log('=== end:', JSON.stringify(result))
  console.log('endTest:', result)
  if (version.value < 1) {
    switch(runningTest.value) {
      case 'A':
      case 'B':
        await writeResultAB(result)
        await util.endWriter(fileWriterAB)
        break
    }
  } else if (version.value < 2) {
    await writeResult正式(result)
    await util.endWriter(fileWriter正式)
  }
  runningTest.value = ''
}


const showError = ref(false)
const errorMessage = ref('')
let errorTimer = null
function showErr(m) {
  if (errorMessage.value.length > 0) {
    errorMessage.value += '\r\n'
    errorMessage.value += m
    clearTimeout(errorTimer)
  } else {
    errorMessage.value = m
  }
  showError.value = true
  errorTimer = setTimeout(() => {
    errorMessage.value = ''
    showError.value = false
  }, 3e4);
}

const showInfomation = ref(false)
const infoMessage = ref('')
let infoTimer = null
function showInfo(m) {
  if (infoMessage.value.length > 0) {
    infoMessage.value += '\r\n'
    infoMessage.value += m
    clearTimeout(infoTimer)
  } else {
    infoMessage.value = m
  }
  showInfomation.value = true
  infoTimer = setTimeout(() => {
    infoMessage.value = ''
    showInfomation.value = false
  }, 3e4);
}

util.setErrorFunc(showErr)
// util.setInfoFunc(showInfo)

let createFileRetryTimes = 5

// ==== AB 文件
let fileWriterAB = null
async function createFileAB_0() {
  const fn = 'tester-result-' + DateFormat(new Date(), 'yyyy-mm-dd_HH-MM-ss') + '.csv'
  fileWriterAB = await util.createFile(fn)
  if (!fileWriterAB) {
    if (createFileRetryTimes > 0) {
      createFileRetryTimes -= 1
      setTimeout(createFileAB, 1e3)
    }
    return
  }
  const header = ['编号', '年龄', '版本']
  const cqCount = Math.floor(msgAB.length / (configAB.groupSize * configAB.questionCompleteStep)) + 1
  for (let i = 0; i < cqCount; i++) {
    header.push('完整问卷-' + (i + 1))
  }
  for (let i = 0; i < msgAB.length; i++) {
    header.push('问题-' + (i + 1))
  }
  await util.append(fileWriterAB, header.join(',') + '\r\n')
}

async function writeResultAB_0(result) {
  const data = [id.value, age.value, runningTest.value]
  const cqCount = Math.floor(msgAB.length / (configAB.groupSize * configAB.questionCompleteStep)) + 1
  for (let i = 0; i < cqCount; i++) {
    const r = result.questionResults[i]
    if (r) {
      data.push(r.join(' '))
    } else {
      data.push('')
    }
  }
  for (let i = 0; i < msgAB.length; i++) {
    const msg = msgAB[i]
    const r = result.results[i]
    if (r) {
      data.push(`${msg.word}(${r.testTime}-${r.answerTrue}-${r.answer}-${r.tired})`)
    } else {
      data.push('')
    }
  }
  await util.append(fileWriterAB, data.join(',') + '\r\n')
}

const cqCount = Math.floor(msgAB.length / (configAB.groupSize * configAB.questionCompleteStep)) + 1
const cqItemCount = 13
async function createFileAB() {
  const fn = 'tester-result-' + DateFormat(new Date(), 'yyyy-mm-dd_HH-MM-ss') + '.csv'
  fileWriterAB = await util.createFile(fn)
  if (!fileWriterAB) {
    if (createFileRetryTimes > 0) {
      createFileRetryTimes -= 1
      setTimeout(createFileAB, 1e3)
    }
    return
  }
  const header = ['编号', '年龄', '版本']
  for (let i = 0; i < cqCount; i++) {
    for (let j = 0; j < cqItemCount; j++) {
      header.push(`完整问卷-${i + 1}-${j + 1}`)
    }
  }
  for (let i = 0; i < msgAB.length; i++) {
    header.push(`问题-${i + 1}-词语`)
    header.push(`问题-${i + 1}-耗时`)
    header.push(`问题-${i + 1}-正确答案`)
    header.push(`问题-${i + 1}-用户答案`)
    header.push(`问题-${i + 1}-是否正确`)
    header.push(`问题-${i + 1}-问卷`)
  }
  await util.append(fileWriterAB, header.join(',') + '\r\n')
}

async function writeResultAB(result) {
  const data = [id.value, age.value, runningTest.value]
  const cqCount = Math.floor(msgAB.length / (configAB.groupSize * configAB.questionCompleteStep)) + 1
  for (let i = 0; i < cqCount; i++) {
    const r = result.questionResults[i]
    for (let j = 0; j < cqItemCount; j++) {
      if (r && r[j]) {
        data.push(String(r[j]))
      } else {
        data.push('')
      }
    }
  }
  for (let i = 0; i < msgAB.length; i++) {
    const msg = msgAB[i]
    const r = result.results[i]
    if (r) {
      data.push(String(msg.word))
      data.push(String(r.testTime))
      data.push(String(r.answerTrue))
      data.push(String(r.answer))
      data.push(String(r.answer == r.answerTrue ? 1 : 0))
      data.push(String(r.tired))
    } else {
      data.push('')
      data.push('')
      data.push('')
      data.push('')
      data.push('')
    }
  }
  await util.append(fileWriterAB, data.join(',') + '\r\n')
}

// ==== 正式 文件
let fileWriter正式 = null
async function createFile正式() {
  // 基本信息
  const header = ['编号', '年龄', '性别']
  // 题目
  for (let i = 1; i <= 20; i++) {
    for (let j = 1; j <= 8; j++) {
      header.push(`${i}-${j}耗时`)
      header.push(`${i}-${j}是否正确`)
    }
  }
  // 问卷
  for (let k = 1; k <= 4; k++) {
    for (let i = 1; i <= 20; i++) {
      for (let j = 1; j <= 2; j++) {
        header.push(`${i}-${j}问卷问题${k}`)
      }
    }
  }
  // 长问卷
  for (let i = 1; i <= 5; i++) {
    for (let j = 1; j <= 13; j++) {
      header.push(`${i}-${j}长问卷${i}问题${j}`)
    }
  }
  console.log('result header:', header)
  const fn = 'tester-result-' + DateFormat(new Date(), 'yyyy-mm-dd_HH-MM-ss') + '.csv'
  fileWriter正式 = await util.createFile(fn)
  if (!fileWriter正式) {
    if (createFileRetryTimes > 0) {
      createFileRetryTimes -= 1
      setTimeout(createFile正式, 1e3)
    }
    return 
  }
  await util.append(fileWriter正式, header.join(',') + '\r\n')
}
async function writeResult正式(result) {
  // 基本信息
  const data = [id.value, age.value, sex.value]
  // 题目
  for (let i = 1; i <= 20; i++) {
    for (let j = 1; j <= 8; j++) {
      const v = result.results[(i-1) * 8 + j-1]
      if (!v) {
        data.push('','')
      } else {
        data.push(String(v.testTime))
        data.push(v.answer == v.answerTrue ? '是' : '否')
      }
    }
  }
  // 短问卷
  for (let k = 1; k <= 4; k++) {
    for (let i = 1; i <= 20; i++) {
      for (let j = 1; j <= 2; j++) {
        const v = result.questionResults[(i-1) * 2 + j-1]
        if (v) {
          const vv = v[k-1]
          if (vv) {
            data.push(String(vv))
            continue
          }
        }
        data.push('')
      }
    }
  }
  // 长问卷
  for (let i = 1; i <= 5; i++) {
    for (let j = 1; j <= 13; j++) {
      const v = result.questionCompleteResults[i-1]
      if (v) {
        const vv = v[j-1]
        if (vv) {
          data.push(String(vv))
          continue
        }
      }
      data.push('')
    }
  }
  console.log('result line:', data)
  await util.append(fileWriter正式, data.join(',') + '\r\n')
}

if (version.value < 1) {
  createFileAB()
} else if (version.value < 2) {
  createFile正式()
}

</script>

<template>
  <Login正式 v-if="version >= 1.0 && !runningTest" @start-test="startTest" />
  <Page正式 v-if="version >= 1.0 && runningTest==='1'" @end-test="endTest" :id="id" :age="age" :sex="sex" />
  <LoginPage v-if="!runningTest && version < 1.0" @start-test="startTest"/>
  <TestFirst v-if="runningTest==='1' && version < 1.0" @end-test="endTest" :id="id" :age="age" />
  <TestAB v-if="(runningTest==='A' || runningTest==='B') && version < 1.0" @end-test="endTest" :id="id" :age="age" :version="runningTest" />
  <Debug v-if="runningTest==='debug'" />
  <TestPage v-if="runningTest==='TestPage'" />
  <DebugShowFonts v-if="runningTest==='DebugShowFonts'" />
  <CDemo v-if="runningTest==='demo'" />
  <div class="msg-block-outer">
    <div v-if="showError" class="err-block-inner">
      {{ errorMessage }}
    </div>
    <div v-if="showInfomation" class="info-block-inner">
      {{ infoMessage }}
    </div>
  </div>
  <div v-if="spinning" class="spin-wrapper">
    <Spin :spinning="spinning" class="spin"></Spin>
  </div>
</template>

<style scoped>
.msg-block-outer {
  position: absolute;
  bottom: 30px;
  width: 100%;
  z-index: 99;
  font-weight: 600;
  font-size: 18px;
}
.err-block-inner {
  white-space: pre;
  word-break: break-all;
  border: 2px solid red;
  margin: 0 auto;
  max-width: 200px;
}
.info-block-inner {
  white-space: pre;
  word-break: break-all;
  border: 2px solid #48f;
  margin: 5px auto;
  max-width: 200px;
}
.spin-wrapper {
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  z-index: 20;
  background-color: #fff9;
}

.spin {
  position: absolute;
  top: 50%;
  left: 50%;
}
</style>
