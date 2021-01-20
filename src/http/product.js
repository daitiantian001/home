import * as http from './base'
import configBase from './configBase'

/** 
 * 登陆
 * @param {object} data 
 */
const login = (data) => {
  return http.post('/users/login', data)
}

const order = (data) => {
  return http.post('/taskInfoApi', data)
}

const getFile = (data) => {
  return http.post('/getFile', data)
}

const getUserInfo = (i) => {
  return http.fetch('userInfo?userId='+i)
}

const upFile = (data) => {
  return http.post(configBase.uploadUrl+'upload/file?type=1', data)
}

const subFile = (data) => {
  return http.post(configBase.subUrl+'/insertMaterial', data)
}

export { login , order , getFile ,upFile ,subFile ,getUserInfo}