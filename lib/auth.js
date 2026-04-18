import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (e) {
    return null
  }
}

export function getSessionFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/caisy_token=([^;]+)/)
  if (!match) return null
  return verifyToken(match[1])
}

export function getSessionCookies() {
  const c = cookies()
  const token = c.get('caisy_token')?.value
  if (!token) return null
  return verifyToken(token)
}
