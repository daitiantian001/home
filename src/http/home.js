import * as http from './base'

/**
 * 登陆
 * @param {object} data 
 */
const home = () => {
  return http.fetch('/getQrcode')
}

const qrCode =()=>{
    return http.fetch('/getQrCode')
}

export { home,qrCode}