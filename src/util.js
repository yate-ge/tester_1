setTimeout(() => {
  document.addEventListener('deviceready', onDeviceReady)
  document.addEventListener('pause', onPause)
}, 0)

function onPause() {
  showInfo('onPause')
}

function onDeviceReady() {
  showInfo('onDeviceReady')
  // window.resolveLocalFileSystemURL(window.cordova.file.externalRootDirectory, onRootDirEntry)
  window.resolveLocalFileSystemURL(window.cordova.file.externalDataDirectory, onDataDirectoryEntry)
}

function onDataDirectoryEntry(entry) {
  showInfo('onDataDirectoryEntry', JSON.stringify(entry))
  entryDir = entry
}

function onRootDirEntry(entry) {
  showInfo('onRootDirEntry', JSON.stringify(entry))
  const p = 'Download' // 'tester', 'Download'
  entry.getDirectory(p, {
    create: true
  }, (e) => {
    showInfo('entry:', JSON.stringify(e))
    entryDir = e
  }, (e) => {
    showError('打开目录失败:', p, JSON.stringify(e))
  })
}

let entryDir = null

export async function createFile(p) {
  showInfo('createFile', p)
  if (!entryDir) {
    // console.log('no entryDir')
    // showError('创建文件失败')
    return null
  }
  const rf = {
    datas: [],
    end: false,
    w: null
  }
  const realWrite = () => {
    if (!rf.w) {
      showInfo('realWrite not ready')
      if (!rf.end) {
        setTimeout(realWrite, 1e3)
      }
      return
    }
    // showInfo('realWrite:', rf.w.readyState, rf.w.INIT, rf.w.DONE)
    if (rf.w.readyState == 0 || rf.w.readyState == 2) {
      const d = rf.datas.join('')
      rf.datas = []
      rf.w.write(d)
    }
    if (!rf.end) {
      setTimeout(realWrite, 1e3)
    }
  }
  setTimeout(realWrite, 1e3)
  return new Promise((resolve) => {
    entryDir.getFile(p, {
      create: true
    }, (f) => {
      f.createWriter((w) => {
        rf.w = w
        resolve(rf)
      }, (e) => {
        showError('创建写文件失败:', p, JSON.stringify(e))
        rf.end = true
        resolve(null)
      })
    }, (e) => {
      showError('创建文件失败:', p, JSON.stringify(e))
      rf.end = true
      resolve(null)
    })
  })
}

// 向文件中写入内容
export function append(f, data) {
  if (!f) {
    showError('文件没有打开')
    return false
  }
  f.datas.push(data)
  return true
}

// 完成文件的写入
export async function endWriter(f) {
  if (!f) {
    showError('文件没有打开')
    return false
  }
  return new Promise((resolve) => {
    f.end = true
    const check = () => {
      showInfo('check:', JSON.stringify(f))
      if (f.datas.length <= 0 && (f.w.readyState == 0 || f.w.readyState == 2)) {
        resolve(true)
      } else {
        setTimeout(check, 1e3)
      }
    }
    check()
  })
}

export function showError(...args) {
  if (errorFun) {
    errorFun(args.join(' '))
  }
}

export function showInfo(...args) {
  if (infoFun) {
    infoFun(args.join(' '))
  }
}

let errorFun = null
let infoFun = null

export function setErrorFunc(f) {
  errorFun = f
}

export function setInfoFunc(f) {
  infoFun = f
}