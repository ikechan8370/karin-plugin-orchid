import fs from 'fs'
import Jimp from 'jimp'
import jsQR from 'jsqr'
import { authenticator } from 'otplib'
import axios from 'node-karin/axios'
import { mkdirs } from './common'
import { logger } from 'node-karin'
import { DATA_DIR } from './config'

mkdirs(DATA_DIR)
if (!fs.existsSync(DATA_DIR + '/otp.json')) {
  fs.writeFileSync(DATA_DIR + '/otp.json', '[]')
}

export const readQRCode = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
    }).then((response) => {
      const imageBuffer = response.data
      Jimp.read(imageBuffer, (err, image) => {
        if (err) {
          return resolve(null)
        }
        const qrData = jsQR(new Uint8ClampedArray(image.bitmap.data), image.bitmap.width, image.bitmap.height)
        if (qrData) {
          resolve(qrData.data) // 返回解码后的二维码内容
        } else {
          resolve(null)
        }
      })
    }).catch(() => {
      resolve(null)
    })
  })
}

export const getSecretFromURL = async (qrCodeUrl: string) => {
  try {
    const secret = new URL(qrCodeUrl).searchParams.get('secret')
    logger.debug('Secret:', secret)
    return secret
  } catch (err) {
    logger.error('Error:', err)
  }
}

export const generateOTP = (secret: string) => {
  const otp = authenticator.generate(secret)
  logger.debug('Current OTP:', otp)
  return otp
}

export const saveOtp = (otp: {
  name: string
  uid: string
  url: string
}) => {
  if (readOtpByName(otp?.name, otp?.uid)) {
    throw new Error('OTP name already exists')
  }
  const otps = JSON.parse(fs.readFileSync(DATA_DIR + '/otp.json', 'utf8'))
  otps.push(otp)
  fs.writeFileSync(DATA_DIR + '/otp.json', JSON.stringify(otps))
}

export const readOtpByName = (name: any, uid: any) => {
  const otps = JSON.parse(fs.readFileSync(DATA_DIR + '/otp.json', 'utf8'))
  return otps.find((otp: { name: any; uid: any }) => otp.name === name && otp.uid === uid)
}

export const listOtps = (uid: any) => {
  const otps = JSON.parse(fs.readFileSync(DATA_DIR + '/otp.json', 'utf8'))
  if (uid) {
    return otps.filter((otp: { uid: any }) => otp.uid === uid)
  }
  return otps
}

export const deleteOtp = (name: any, uid: any) => {
  const otps = JSON.parse(fs.readFileSync(DATA_DIR + '/otp.json', 'utf8'))
  const newOtps = otps.filter((otp: { name: any; uid: any }) => otp.name !== name || otp.uid !== uid)
  fs.writeFileSync(DATA_DIR + '/otp.json', JSON.stringify(newOtps))
}
