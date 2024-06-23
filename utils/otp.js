import fs from 'fs'
import Jimp from 'jimp'
import QrCode from 'qrcode-reader'
import { authenticator } from 'otplib'
import axios from 'axios'
import { DATA_DIR, mkdirs } from './common.js'

mkdirs(DATA_DIR)
if (!fs.existsSync(DATA_DIR + '/otp.json')) {
  fs.writeFileSync(DATA_DIR + '/otp.json', '[]')
}

export const readQRCode = (url) => {
  return new Promise((resolve, reject) => {
    axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
    }).then((response) => {
      const imageBuffer = response.data
      Jimp.read(imageBuffer, (err, image) => {
        if (err) {
          return reject(err)
        }
        const qr = new QrCode()
        qr.callback = (err, value) => {
          if (err) {
            return reject(err)
          }
          resolve(value.result)
        }
        qr.decode(image.bitmap)
      })
    })
  })
}

export const getSecretFromURL = async (qrCodeUrl) => {
  try {
    const secret = new URL(qrCodeUrl).searchParams.get('secret')
    logger.debug('Secret:', secret)
    return secret
  } catch (err) {
    logger.error('Error:', err)
  }
}

export const generateOTP = (secret) => {
  const otp = authenticator.generate(secret)
  logger.debug('Current OTP:', otp)
  return otp
}

export const saveOtp = (otp) => {
  if (readOtpByName(otp?.name, otp?.uid)) {
    throw new Error('OTP name already exists')
  }
  const otps = JSON.parse(fs.readFileSync(DATA_DIR + '/otp.json', 'utf8'))
  otps.push(otp)
  fs.writeFileSync(DATA_DIR + '/otp.json', JSON.stringify(otps))
}

export const readOtpByName = (name, uid) => {
  const otps = JSON.parse(fs.readFileSync(DATA_DIR + '/otp.json', 'utf8'))
  return otps.find(otp => otp.name === name && otp.uid === uid)
}

export const listOtps = (uid) => {
  const otps = JSON.parse(fs.readFileSync(DATA_DIR + '/otp.json', 'utf8'))
  if (uid) {
    return otps.filter(otp => otp.uid === uid)
  }
  return otps
}

export const deleteOtp = (name, uid) => {
  const otps = JSON.parse(fs.readFileSync(DATA_DIR + '/otp.json', 'utf8'))
  const newOtps = otps.filter(otp => otp.name !== name || otp.uid !== uid)
  fs.writeFileSync(DATA_DIR + '/otp.json', JSON.stringify(newOtps))
}
