import DateFormat from 'dateformat';
import * as util from './util'

let createFileRetryTimes = 5
let fileWriter = null

export async function init() {
  const fn = 'log-' + DateFormat(new Date(), 'yyyy-mm-dd_HH-MM-ss') + '.txt'
  fileWriter = await util.createFile(fn)
  if (!fileWriter) {
    if (createFileRetryTimes > 0) {
      createFileRetryTimes -= 1
      setTimeout(init, 1e3)
    }
    return 
  }
  util.append(fileWriter, '------ begin [' + DateFormat(new Date(), 'yyyy-mm-dd_HH-MM-ss') + '] ------\r\n')
}

export function log(...args) {
  if (!fileWriter) {
    return
  }
  util.append(fileWriter, '[' + DateFormat(new Date(), 'yyyy-mm-dd_HH-MM-ss') + '] ' + args.join(' ') + '\r\n')
}