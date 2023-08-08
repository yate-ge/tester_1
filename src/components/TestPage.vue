<script setup>
import { ref } from 'vue';
import * as util from '../util'
  
const text = ref('')

// setTimeout(() => {
//   if (window.cordova) {
//     text.value += 'has cordova\r\n'
//     // text.value += 'file:' + JSON.stringify(window.cordova.file, null, 2)
//     window.resolveLocalFileSystemURL(window.cordova.file.resolveLocalFileSystemURL + 'Download', (entry) => {
//       text.value += 'isFile:' + entry.isFile + ', isDir:' + entry.isDirectory + '\r\n'
//       text.value += 'name:' + entry.name + ', full:' + entry.fullPath + ', native:' + entry.nativeURL + '\r\n'
//     }, (err) => {
//       text.value += 'err:' + err + '\r\n'
//     })
//   } else {
//     text.value += 'no cordova\r\n'
//   }
//   // text.value += 'cordova:' + String(cordova) + '\r\n'
// }, 1e3);

let writer = null

function textLine(...args) {
  text.value += args.join(' ') + '\r\n'
}

// document.addEventListener('deviceready', onDeviceReady1, false);
document.addEventListener('deviceready', onDeviceReady2, false);
function onDeviceReady1() {
  text.value += 'onDeviceReady\r\n'
  // console.log(cordova.file);
  // text.value += 'deviceready:' + String(cordova.file) + '\r\n'
  window.resolveLocalFileSystemURL(
    window.cordova.file.externalRootDirectory,
    // window.cordova.file.externalDataDirectory,
    (entry) => {
      text.value += 'isFile:' + entry.isFile + ', isDir:' + entry.isDirectory + '\r\n'
      text.value += 'name:' + entry.name + ', full:' + entry.fullPath + ', native:' + entry.nativeURL + '\r\n'
      const dirReader = entry.createReader()
      dirReader.readEntries(
        (es) => {
          text.value += 'readEntries entries:' + JSON.stringify(es) + '\r\n'
          let e = es.find((v) => {
            // text.value += 'file:' + JSON.stringify(v) + '\r\n'
            return v.isDirectory && v.name.toLowerCase() === 'download'
            // return v.isDirectory && v.name.toLowerCase() === 'tester'
          })
          text.value += 'e:' + JSON.stringify(e) + '\r\n'
          if (e) {
            e.getFile(
              `test_${Number(new Date)}.csv`,
              {
                create: true
              }, fe => {
                text.value += 'fe:' + JSON.stringify(fe) + '\r\n'
                fe.createWriter(
                  w => {
                    text.value += 'code:' + w.INIT + ', ' + w.WRITING + ', ' + w.DONE
                    text.value += 'readyState:' + w.readyState + '\r\n'
                    w.onwriteend = () => {
                      text.value += 'onwriteend\r\n'
                      text.value += 'readyState:' + w.readyState + '\r\n'
                    }
                    w.onerror = () => {
                      text.value += 'onerror\r\n'
                      text.value += 'readyState:' + w.readyState + '\r\n'
                    }
                    w.onwritestart = () => {
                      text.value += 'onwritestart\r\n'
                      text.value += 'readyState:' + w.readyState + '\r\n'
                    }
                    w.onprogress = () => {
                      text.value += 'onprogress\r\n'
                      text.value += 'readyState:' + w.readyState + '\r\n'
                    }
                    w.onwrite = () => {
                      text.value += 'onwrite\r\n'
                      text.value += 'readyState:' + w.readyState + '\r\n'
                    }
                    w.onabort = () => {
                      text.value += 'onabort\r\n'
                      text.value += 'readyState:' + w.readyState + '\r\n'
                    }
                    // w.write('a,b,c\r\n')
                    // w.write('1,1,1\r\n')
                    // w.write('1,2,3\r\n')
                    writer = w
                  }, err => {
                    text.value += 'err:' + JSON.stringify(err) + '\r\n'
                  })
              }, err => {
                text.value += 'err:' + JSON.stringify(err) + '\r\n'
              })
          } else {
            text.value += 'find fail\r\n'
          }
        }, (err) => {
          text.value += 'err:' + JSON.stringify(err) + '\r\n'
        }
        )
    }, (err) => {
      text.value += 'err:' + JSON.stringify(err) + '\r\n'
    })
}

function onDeviceReady2() {
  // textLine('window.requestFileSystem:', JSON.stringify(window.requestFileSystem))
  // textLine('cordova:', JSON.stringify(window.cordova, null, 2))
  // textLine('cordova keys:', JSON.stringify(Object.keys(window.cordova)))
  // textLine('cordova.file keys:', JSON.stringify(Object.keys(window.cordova.file)))
  try {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (fs) => {
      textLine('file system open: ', fs.name, JSON.stringify(fs, null, 2))
    })
  } catch (e) {
    textLine('e:', e)
  }
}
  
function save() {
  console.log('save')
  text.value += 'save\r\n'
  if (writer) {
    writer.write('a,b,c,' + new Date() + '\r\n')
  }
}

let f = null

async function create() {
  f = await util.createFile('abc.txt')
  text.value += 'create:' + JSON.stringify(f) + '\r\n'
}

async function append() {
  const r = await util.append(f, '123,' + new Date() + '\r\n')
  text.value += 'append:' + JSON.stringify(r) + '\r\n'
}

async function end() {
  const r = await util.endWriter(f)
  text.value += 'end:' + JSON.stringify(r) + '\r\n'
}

</script>

<template>
  <div class="about">
    <h1>test</h1>
    <button @click="save">保存</button>
    <br>
    <button @click="create">创建</button>
    <button @click="append">追加</button>
    <button @click="end">关闭</button>
    <br>
    <br>
    <textarea :value="text" />
  </div>
</template>

<style lang="scss" scoped>
.about {
  min-height: 100vh;
  align-items: center;
  textarea {
    width: 300px;
    height: 400px;
  }
}
</style>
