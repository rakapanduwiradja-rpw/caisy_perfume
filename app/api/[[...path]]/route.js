import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { seedDatabase } from '@/lib/seed'
import { hashPassword, verifyPassword, signToken, getSessionFromRequest } from '@/lib/auth'
import crypto from 'crypto'
import midtransClient from 'midtrans-client'

// ============================================================
// SECURITY: Rate limiting store (in-memory, resets on restart)
// ============================================================
const rateLimitStore = new Map()
function rateLimit(key, maxRequests = 30, windowMs = 60000) {
  const now = Date.now()
  const windowStart = now - windowMs
  if (!rateLimitStore.has(key)) rateLimitStore.set(key, [])
  const requests = rateLimitStore.get(key).filter(t => t > windowStart)
  requests.push(now)
  rateLimitStore.set(key, requests)
  return requests.length <= maxRequests
}

// ============================================================
// CORS & Security Headers
// ============================================================
function corsHeaders(res) {
  const origin = process.env.ALLOWED_ORIGIN || '*'
  res.headers.set('Access-Control-Allow-Origin', origin)
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return res
}

export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 200 }))
}

function json(data, status = 200) {
  return corsHeaders(NextResponse.json(data, { status }))
}

function err(message, status = 400) {
  return json({ error: message }, status)
}

function clean(docs) {
  if (!docs) return docs
  if (Array.isArray(docs)) return docs.map(d => { const { _id, ...rest } = d; return rest })
  const { _id, ...rest } = docs
  return rest
}

// Sanitize string input to prevent XSS
function sanitize(str) {
  if (typeof str !== 'string') return str
  return str.replace(/[<>\"']/g, '')
}

async function requireAdmin(request) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const db = await getDb()
  const user = await db.collection('users').findOne({ id: session.userId })
  if (!user || user.role !== 'admin') return null
  return user
}

// ============================================================
// BITESHIP API
// ============================================================
const BITESHIP_BASE = 'https://api.biteship.com'

async function biteshipRequest(endpoint, method = 'GET', body = null) {
  const apiKey = process.env.BITESHIP_API_KEY
  if (!apiKey) throw new Error('BITESHIP_API_KEY not configured')
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BITESHIP_BASE}${endpoint}`, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.message || 'Biteship API error')
  return data
}

// Search area by postal code (for destination)
async function biteshipSearchArea(postalCode) {
  try {
    const data = await biteshipRequest(`/v1/maps/areas?countries=ID&input=${postalCode}&type=single`)
    return data.areas || []
  } catch (e) {
    console.warn('Biteship area search failed:', e.message)
    return []
  }
}

// Get shipping rates
async function biteshipGetRates({ originPostalCode, destinationPostalCode, items, couriers }) {
  const body = {
    origin_postal_code: parseInt(originPostalCode),
    destination_postal_code: parseInt(destinationPostalCode),
    couriers: couriers || 'jne,jnt,sicepat,anteraja,gosend,grab_express,pos',
    items: items.map(i => ({
      name: i.name,
      description: i.name,
      value: i.price,
      length: 10,
      width: 10,
      height: 10,
      weight: i.weight || 300,
      quantity: i.quantity,
    }))
  }
  const data = await biteshipRequest('/v1/rates/couriers', 'POST', body)
  return data.pricing || []
}

// Create biteship order (after payment success)
async function biteshipCreateOrder(order, storeSettings) {
  const body = {
    shipper_contact_name: storeSettings.store_name || 'Caisy Perfume',
    shipper_contact_phone: storeSettings.whatsapp_cs || '6281234567890',
    shipper_contact_email: storeSettings.email_cs || 'cs@caisyperfume.com',
    shipper_organization: storeSettings.store_name || 'Caisy Perfume',
    origin_contact_name: storeSettings.store_name || 'Caisy Perfume',
    origin_contact_phone: storeSettings.whatsapp_cs || '6281234567890',
    origin_address: storeSettings.address || 'Indonesia',
    origin_note: 'Caisy Perfume Store',
    origin_postal_code: parseInt(storeSettings.postal_code || '10110'),
    destination_contact_name: order.guest_name || 'Customer',
    destination_contact_phone: order.guest_phone || '08123456789',
    destination_contact_email: order.guest_email || '',
    destination_address: order.address_detail || '',
    destination_note: order.notes || '',
    destination_postal_code: parseInt(order.postal_code || '10110'),
    courier_company: order.shipping_carrier?.toLowerCase() || 'jne',
    courier_type: order.shipping_service?.toLowerCase() || 'reg',
    delivery_type: 'now',
    order_note: order.notes || '',
    items: order.items.map(item => ({
      name: item.product_name,
      description: item.product_name,
      value: item.price,
      length: 10, width: 10, height: 10,
      weight: 300,
      quantity: item.quantity,
    }))
  }
  return await biteshipRequest('/v1/orders', 'POST', body)
}

// Track shipment
async function biteshipTrackOrder(waybillId, courier) {
  try {
    const data = await biteshipRequest(`/v1/trackings/${waybillId}/couriers/${courier}`)
    return data
  } catch (e) {
    return null
  }
}

// ============================================================
// EMAIL SERVICE (Nodemailer)
// ============================================================
async function sendEmail({ to, subject, html }) {
  try {
    const nodemailer = (await import('nodemailer')).default
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Caisy Perfume'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    return true
  } catch (e) {
    console.error('Email send failed:', e.message)
    return false
  }
}

function formatRupiah(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID')
}

// Email: Order Confirmation (after order created, before payment)
function emailOrderConfirmation(order) {
  const itemsHtml = order.items.map(i => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f0e8dc;">${i.product_name}</td>
      <td style="padding:8px;border-bottom:1px solid #f0e8dc;text-align:center;">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #f0e8dc;text-align:right;">${formatRupiah(i.subtotal)}</td>
    </tr>`).join('')

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:Georgia,serif;background:#FAF7F2;margin:0;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="background:#7B1E2C;padding:32px;text-align:center;">
        <h1 style="color:#C9A96E;font-size:28px;margin:0;">Caisy Perfume</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Wangian Mewah, Harga Terjangkau</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#7B1E2C;margin-top:0;">Konfirmasi Pesanan</h2>
        <p>Halo <strong>${order.guest_name || 'Customer'}</strong>,</p>
        <p>Pesanan Anda telah kami terima. Silakan selesaikan pembayaran untuk memproses pesanan.</p>
        <div style="background:#FAF7F2;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 4px;font-size:12px;color:#888;">Kode Pesanan</p>
          <p style="margin:0;font-size:20px;font-weight:bold;color:#7B1E2C;letter-spacing:2px;">${order.order_code}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#7B1E2C;color:#fff;">
              <th style="padding:10px;text-align:left;">Produk</th>
              <th style="padding:10px;text-align:center;">Qty</th>
              <th style="padding:10px;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr><td colspan="2" style="padding:8px;text-align:right;">Subtotal</td><td style="padding:8px;text-align:right;">${formatRupiah(order.subtotal)}</td></tr>
            <tr><td colspan="2" style="padding:8px;text-align:right;">Ongkos Kirim</td><td style="padding:8px;text-align:right;">${formatRupiah(order.shipping_cost || 0)}</td></tr>
            ${order.voucher_discount > 0 ? `<tr><td colspan="2" style="padding:8px;text-align:right;color:green;">Diskon</td><td style="padding:8px;text-align:right;color:green;">-${formatRupiah(order.voucher_discount)}</td></tr>` : ''}
            <tr style="font-weight:bold;background:#FAF7F2;"><td colspan="2" style="padding:10px;text-align:right;color:#7B1E2C;">Total</td><td style="padding:10px;text-align:right;color:#7B1E2C;">${formatRupiah(order.total_amount)}</td></tr>
          </tfoot>
        </table>
        ${order.is_pickup ? `
        <div style="background:#FFF3CD;border:1px solid #C9A96E;border-radius:8px;padding:16px;margin:20px 0;">
          <h3 style="color:#7B1E2C;margin:0 0 8px;">🏪 Pickup di Toko</h3>
          <p style="margin:0;">Kode Pickup Anda: <strong style="font-size:24px;color:#7B1E2C;letter-spacing:4px;">${order.pickup_code}</strong></p>
          <p style="margin:8px 0 0;font-size:13px;color:#666;">Tunjukkan kode ini saat mengambil pesanan di toko.</p>
        </div>` : `
        <div style="background:#FAF7F2;border-radius:8px;padding:16px;margin:20px 0;">
          <h3 style="color:#7B1E2C;margin:0 0 8px;">📦 Alamat Pengiriman</h3>
          <p style="margin:0;">${order.address_detail}, ${order.district_name}, ${order.city_name}, ${order.province_name} ${order.postal_code}</p>
          <p style="margin:8px 0 0;">Kurir: <strong>${order.shipping_carrier} ${order.shipping_service}</strong> (Est. ${order.shipping_etd})</p>
        </div>`}
      </div>
      <div style="background:#7B1E2C;padding:20px;text-align:center;">
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;">© ${new Date().getFullYear()} Caisy Perfume. All rights reserved.</p>
        <p style="color:rgba(255,255,255,0.5);margin:4px 0 0;font-size:12px;">Butuh bantuan? WhatsApp kami</p>
      </div>
    </div>
  </body>
  </html>`
}

// Email: Payment Success
function emailPaymentSuccess(order) {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:Georgia,serif;background:#FAF7F2;margin:0;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="background:#7B1E2C;padding:32px;text-align:center;">
        <h1 style="color:#C9A96E;font-size:28px;margin:0;">Caisy Perfume</h1>
      </div>
      <div style="padding:32px;text-align:center;">
        <div style="width:72px;height:72px;background:#E8F5E9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
          <span style="font-size:36px;">✅</span>
        </div>
        <h2 style="color:#7B1E2C;">Pembayaran Berhasil!</h2>
        <p>Halo <strong>${order.guest_name || 'Customer'}</strong>, pembayaran untuk pesanan <strong>${order.order_code}</strong> telah dikonfirmasi.</p>
        <div style="background:#FAF7F2;border-radius:8px;padding:16px;margin:20px 0;text-align:left;">
          <p><strong>Total Dibayar:</strong> ${formatRupiah(order.total_amount)}</p>
          <p><strong>Metode Bayar:</strong> ${order.payment_method || '-'}</p>
        </div>
        ${order.is_pickup ? `
        <div style="background:#FFF3CD;border:2px solid #C9A96E;border-radius:12px;padding:24px;margin:20px 0;">
          <h3 style="color:#7B1E2C;margin:0 0 12px;">🏪 Kode Pickup Anda</h3>
          <div style="font-size:36px;font-weight:bold;color:#7B1E2C;letter-spacing:8px;font-family:monospace;">${order.pickup_code}</div>
          <p style="color:#666;margin:12px 0 0;font-size:14px;">Tunjukkan kode ini kepada kami saat mengambil pesanan. Pesanan siap diambil setelah konfirmasi ini.</p>
        </div>` : `
        <div style="background:#FAF7F2;border-radius:8px;padding:16px;margin:20px 0;text-align:left;">
          <h3 style="color:#7B1E2C;margin:0 0 8px;">📦 Info Pengiriman</h3>
          <p>Pesanan Anda sedang diproses dan akan segera dikirim.</p>
          <p><strong>Kurir:</strong> ${order.shipping_carrier} ${order.shipping_service}</p>
          <p><strong>Estimasi:</strong> ${order.shipping_etd}</p>
          <p><strong>Alamat:</strong> ${order.address_detail}, ${order.district_name}, ${order.city_name}</p>
        </div>`}
      </div>
      <div style="background:#7B1E2C;padding:20px;text-align:center;">
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;">© ${new Date().getFullYear()} Caisy Perfume</p>
      </div>
    </div>
  </body>
  </html>`
}

// Email: Order Shipped with tracking
function emailOrderShipped(order) {
  const trackingUrl = order.biteship_tracking_url || 
    `https://biteship.com/id/track/${order.tracking_number || ''}`
  
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:Georgia,serif;background:#FAF7F2;margin:0;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#7B1E2C;padding:32px;text-align:center;">
        <h1 style="color:#C9A96E;font-size:28px;margin:0;">Caisy Perfume</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#7B1E2C;">📦 Pesanan Sedang Dikirim!</h2>
        <p>Halo <strong>${order.guest_name || 'Customer'}</strong>, pesanan Anda <strong>${order.order_code}</strong> telah dikirim.</p>
        <div style="background:#E3F2FD;border-radius:8px;padding:20px;margin:20px 0;">
          <h3 style="color:#1565C0;margin:0 0 12px;">Info Pengiriman</h3>
          <p style="margin:0 0 8px;"><strong>Kurir:</strong> ${order.shipping_carrier} ${order.shipping_service}</p>
          <p style="margin:0 0 8px;"><strong>No. Resi:</strong> <span style="font-family:monospace;font-size:18px;color:#7B1E2C;">${order.tracking_number || '-'}</span></p>
          <p style="margin:0 0 8px;"><strong>Estimasi Tiba:</strong> ${order.shipping_etd}</p>
        </div>
        ${order.tracking_number ? `
        <div style="text-align:center;margin:24px 0;">
          <a href="${trackingUrl}" style="background:#7B1E2C;color:#C9A96E;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
            🔍 Lacak Paket Saya
          </a>
          <p style="margin:8px 0 0;font-size:12px;color:#888;">Atau kunjungi: <a href="${trackingUrl}">${trackingUrl}</a></p>
        </div>` : ''}
        <div style="background:#FAF7F2;border-radius:8px;padding:16px;">
          <p style="margin:0;"><strong>Alamat Tujuan:</strong></p>
          <p style="margin:4px 0 0;">${order.address_detail}, ${order.district_name}, ${order.city_name}, ${order.province_name} ${order.postal_code}</p>
        </div>
      </div>
      <div style="background:#7B1E2C;padding:20px;text-align:center;">
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;">© ${new Date().getFullYear()} Caisy Perfume</p>
      </div>
    </div>
  </body>
  </html>`
}

// Email: Payment Failed
function emailPaymentFailed(order) {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:Georgia,serif;background:#FAF7F2;margin:0;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#7B1E2C;padding:32px;text-align:center;">
        <h1 style="color:#C9A96E;font-size:28px;margin:0;">Caisy Perfume</h1>
      </div>
      <div style="padding:32px;text-align:center;">
        <span style="font-size:48px;">❌</span>
        <h2 style="color:#DC2626;">Pembayaran Gagal / Kadaluwarsa</h2>
        <p>Halo <strong>${order.guest_name || 'Customer'}</strong>, sayang sekali pembayaran untuk pesanan <strong>${order.order_code}</strong> tidak berhasil atau telah kadaluwarsa.</p>
        <p>Jangan khawatir — Anda bisa melakukan pemesanan ulang kapan saja.</p>
        <div style="margin:24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://caisyperfume.com'}/catalog" style="background:#7B1E2C;color:#C9A96E;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
            Belanja Lagi →
          </a>
        </div>
        <p style="color:#888;font-size:13px;">Butuh bantuan? Hubungi CS kami melalui WhatsApp.</p>
      </div>
      <div style="background:#7B1E2C;padding:20px;text-align:center;">
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;">© ${new Date().getFullYear()} Caisy Perfume</p>
      </div>
    </div>
  </body>
  </html>`
}

// ============================================================
// MAIN HANDLER
// ============================================================
async function handle(request, { params }) {
  const { path = [] } = params
  const route = '/' + path.join('/')
  const method = request.method
  const url = new URL(request.url)
  const qs = Object.fromEntries(url.searchParams)

  // SECURITY: IP-based rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimitKey = `${ip}:${route}`
  const maxReq = route.includes('auth') ? 10 : route.includes('smart-search') ? 10 : 60
  if (!rateLimit(rateLimitKey, maxReq)) {
    return err('Too many requests. Coba lagi nanti.', 429)
  }

  try {
    const db = await getDb()
    await seedDatabase()

    if (route === '/' || route === '/health') return json({ message: 'Caisy Perfume API', ok: true })

    // ============ AUTH ============
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const name = sanitize(body.name || '')
      const email = sanitize(body.email || '').toLowerCase()
      const password = body.password || ''
      const phone = sanitize(body.phone || '')
      if (!name || !email || !password) return err('Nama, email, dan password wajib diisi')
      if (password.length < 8) return err('Password minimal 8 karakter')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Format email tidak valid')
      const existing = await db.collection('users').findOne({ email })
      if (existing) return err('Email sudah terdaftar', 409)
      const user = {
        id: uuidv4(), name, email, phone,
        password: await hashPassword(password),
        role: 'customer',
        email_verified_at: null,
        created_at: new Date(), updated_at: new Date(),
      }
      await db.collection('users').insertOne(user)
      const token = signToken({ userId: user.id, role: user.role })
      const res = json({ user: { id: user.id, name, email, phone, role: 'customer' }, token })
      res.cookies.set('caisy_token', token, { httpOnly: true, secure: true, path: '/', maxAge: 60*60*24*30, sameSite: 'lax' })
      return res
    }

    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const email = sanitize(body.email || '').toLowerCase()
      const password = body.password || ''
      const user = await db.collection('users').findOne({ email })
      if (!user) return err('Email atau password salah', 401)
      const ok = await verifyPassword(password, user.password)
      if (!ok) return err('Email atau password salah', 401)
      const token = signToken({ userId: user.id, role: user.role })
      const res = json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }, token })
      res.cookies.set('caisy_token', token, { httpOnly: true, secure: true, path: '/', maxAge: 60*60*24*30, sameSite: 'lax' })
      return res
    }

    if (route === '/auth/logout' && method === 'POST') {
      const res = json({ ok: true })
      res.cookies.set('caisy_token', '', { httpOnly: true, path: '/', maxAge: 0 })
      return res
    }

    if (route === '/auth/me' && method === 'GET') {
      const session = getSessionFromRequest(request)
      if (!session) return json({ user: null })
      const user = await db.collection('users').findOne({ id: session.userId })
      if (!user) return json({ user: null })
      return json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } })
    }

    if (route === '/auth/update' && method === 'POST') {
      const session = getSessionFromRequest(request)
      if (!session) return err('Unauthorized', 401)
      const body = await request.json()
      const update = { updated_at: new Date() }
      if (body.name) update.name = sanitize(body.name)
      if (body.phone !== undefined) update.phone = sanitize(body.phone)
      if (body.email) update.email = sanitize(body.email).toLowerCase()
      if (body.password) {
        if (body.password.length < 8) return err('Password minimal 8 karakter')
        update.password = await hashPassword(body.password)
      }
      await db.collection('users').updateOne({ id: session.userId }, { $set: update })
      const user = await db.collection('users').findOne({ id: session.userId })
      return json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } })
    }

    // ============ PRODUCTS ============
    if (route === '/products' && method === 'GET') {
      const { category, search, sort, min_price, max_price, in_stock, page = 1, limit = 12 } = qs
      const filter = { is_active: true }
      if (category && ['wanita','pria','unisex'].includes(category)) filter.category = category
      if (search) filter.name = { $regex: sanitize(search), $options: 'i' }
      if (min_price || max_price) {
        filter.price = {}
        if (min_price) filter.price.$gte = parseInt(min_price)
        if (max_price) filter.price.$lte = parseInt(max_price)
      }
      if (in_stock === 'true') filter.stock = { $gt: 0 }
      let sortObj = { created_at: -1 }
      if (sort === 'price_asc') sortObj = { price: 1 }
      if (sort === 'price_desc') sortObj = { price: -1 }
      const p = Math.max(1, parseInt(page)), l = Math.min(50, parseInt(limit))
      const total = await db.collection('products').countDocuments(filter)
      const products = await db.collection('products').find(filter).sort(sortObj).skip((p-1)*l).limit(l).toArray()
      return json({ products: clean(products), total, page: p, limit: l, pages: Math.ceil(total/l) })
    }

    if (route === '/products/featured' && method === 'GET') {
      const products = await db.collection('products').find({ is_active: true, is_featured: true }).limit(8).toArray()
      return json({ products: clean(products) })
    }

    if (route.startsWith('/products/slug/') && method === 'GET') {
      const slug = sanitize(route.replace('/products/slug/', ''))
      const p = await db.collection('products').findOne({ slug })
      if (!p) return err('Product not found', 404)
      const related = await db.collection('products').find({ category: p.category, slug: { $ne: slug }, is_active: true }).limit(4).toArray()
      return json({ product: clean(p), related: clean(related) })
    }

    // ============ AI SMART SEARCH ============
    if (route === '/smart-search' && method === 'POST') {
      const { query } = await request.json()
      if (!query || query.length > 500) return err('Query tidak valid')
      const products = await db.collection('products').find({ is_active: true }).toArray()
      const cleanProducts = clean(products)
      const productList = JSON.stringify(cleanProducts.map(p => ({
        id: p.id, name: p.name, category: p.category, inspired_by: p.inspired_by,
        top_note: p.top_note, middle_note: p.middle_note, base_note: p.base_note,
        description: p.description, price: p.price
      })))
      const prompt = `Kamu adalah asisten parfum profesional untuk toko Caisy Perfume.\nDaftar produk yang tersedia:\n${productList}\n\nPermintaan customer: "${sanitize(query)}"\n\nRekomendasikan 3-5 produk yang paling relevan berdasarkan permintaan tersebut.\nBalas HANYA dengan format JSON array berikut, tanpa teks lain, tanpa markdown code fence:\n[{"product_id": "id_produk_string", "reason": "alasan singkat dalam bahasa Indonesia maksimal 15 kata"}]\nJika tidak ada yang relevan, kembalikan array kosong [].`
      try {
        const apiKey = process.env.GEMINI_API_KEY
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } } })
        })
        const data = await geminiRes.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
        const cleaned = text.replace(/```json|```/g, '').trim()
        let recommendations = []
        try { recommendations = JSON.parse(cleaned) } catch { recommendations = [] }
        const recommendedIds = recommendations.map(r => String(r.product_id))
        const recommendedProducts = cleanProducts.filter(p => recommendedIds.includes(String(p.id)))
        const withReasons = recommendedProducts.map(p => ({
          ...p,
          ai_reason: recommendations.find(r => String(r.product_id) === String(p.id))?.reason || ''
        }))
        return json({ products: withReasons, query })
      } catch (e) {
        return err('AI search failed: ' + e.message, 500)
      }
    }

    // ============ CART ============
    if (route === '/cart' && method === 'GET') {
      const session = getSessionFromRequest(request)
      if (!session) return json({ items: [] })
      const cart = await db.collection('carts').findOne({ user_id: session.userId })
      return json({ items: cart?.items || [] })
    }

    if (route === '/cart' && method === 'POST') {
      const session = getSessionFromRequest(request)
      if (!session) return err('Unauthorized', 401)
      const { items } = await request.json()
      await db.collection('carts').updateOne(
        { user_id: session.userId },
        { $set: { user_id: session.userId, items: items || [], updated_at: new Date() } },
        { upsert: true }
      )
      return json({ ok: true })
    }

    // ============ LOCATION ============
    if (route === '/location/provinces' && method === 'GET') {
      try {
        const r = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json', { next: { revalidate: 86400 } })
        return json({ provinces: await r.json() })
      } catch { return json({ provinces: [] }) }
    }
    if (route === '/location/regencies' && method === 'GET') {
      try {
        if (!qs.province_id || !/^\d+$/.test(qs.province_id)) return err('Invalid province_id')
        const r = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${qs.province_id}.json`, { next: { revalidate: 86400 } })
        return json({ regencies: await r.json() })
      } catch { return json({ regencies: [] }) }
    }
    if (route === '/location/districts' && method === 'GET') {
      try {
        if (!qs.regency_id || !/^\d+$/.test(qs.regency_id)) return err('Invalid regency_id')
        const r = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${qs.regency_id}.json`, { next: { revalidate: 86400 } })
        return json({ districts: await r.json() })
      } catch { return json({ districts: [] }) }
    }
    if (route === '/location/villages' && method === 'GET') {
      try {
        if (!qs.district_id || !/^\d+$/.test(qs.district_id)) return err('Invalid district_id')
        const r = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${qs.district_id}.json`, { next: { revalidate: 86400 } })
        return json({ villages: await r.json() })
      } catch { return json({ villages: [] }) }
    }

    // ============ BITESHIP SHIPPING ============
    if (route === '/shipping/rates' && method === 'POST') {
      const body = await request.json()
      const { origin_postal_code, destination_postal_code, items, is_pickup } = body

      // If pickup, return no shipping needed
      if (is_pickup) {
        return json({ rates: [], is_pickup: true })
      }

      if (!destination_postal_code) return err('Kode pos tujuan wajib diisi')

      let rates = []
      try {
        const storeSettings = await db.collection('settings').findOne({ key: 'store' })
        const originPostal = origin_postal_code || storeSettings?.postal_code || '10110'
        const biteshipRates = await biteshipGetRates({
          originPostalCode: originPostal,
          destinationPostalCode: destination_postal_code,
          items: items || [{ name: 'Parfum', price: 100000, weight: 300, quantity: 1 }],
        })
        rates = biteshipRates.map(r => ({
          courier: r.courier_name,
          courier_code: r.courier_code,
          service: r.courier_service_name,
          service_code: r.courier_service_code,
          etd: r.duration || r.shipment_duration_range || '-',
          price: r.price,
          description: r.description || '',
        }))
      } catch (e) {
        console.warn('Biteship rates error, using fallback:', e.message)
        rates = [
          { courier: 'JNE', courier_code: 'jne', service: 'REG', service_code: 'reg', etd: '2-3 hari', price: 15000 },
          { courier: 'JNE', courier_code: 'jne', service: 'YES', service_code: 'yes', etd: '1 hari', price: 25000 },
          { courier: 'J&T Express', courier_code: 'jnt', service: 'EZ', service_code: 'ez', etd: '2-3 hari', price: 14000 },
          { courier: 'SiCepat', courier_code: 'sicepat', service: 'BEST', service_code: 'best', etd: '1-2 hari', price: 13000 },
          { courier: 'Anteraja', courier_code: 'anteraja', service: 'Regular', service_code: 'regular', etd: '2-4 hari', price: 12000 },
          { courier: 'Pos Indonesia', courier_code: 'pos', service: 'Paket Kilat', service_code: 'kilat', etd: '3-5 hari', price: 10000 },
        ]
      }
      return json({ rates })
    }

    // Biteship area search
    if (route === '/shipping/areas' && method === 'GET') {
      if (!qs.postal_code) return err('postal_code required')
      const areas = await biteshipSearchArea(qs.postal_code)
      return json({ areas })
    }

    // Shipment tracking
    if (route === '/shipping/track' && method === 'GET') {
      const { waybill_id, courier } = qs
      if (!waybill_id || !courier) return err('waybill_id dan courier wajib diisi')
      const tracking = await biteshipTrackOrder(waybill_id, courier)
      return json({ tracking })
    }

    // ============ VOUCHERS ============
    if (route === '/vouchers/validate' && method === 'POST') {
      const { code, subtotal } = await request.json()
      if (!code) return err('Kode voucher kosong')
      const v = await db.collection('vouchers').findOne({ code: sanitize(code).toUpperCase() })
      if (!v) return err('Voucher tidak ditemukan', 404)
      if (!v.is_active) return err('Voucher tidak aktif')
      const now = new Date()
      if (v.valid_from && new Date(v.valid_from) > now) return err('Voucher belum berlaku')
      if (v.valid_until && new Date(v.valid_until) < now) return err('Voucher sudah kadaluwarsa')
      if (v.usage_limit && v.used_count >= v.usage_limit) return err('Voucher sudah habis dipakai')
      if (v.min_purchase && subtotal < v.min_purchase) return err(`Minimum belanja ${formatRupiah(v.min_purchase)}`)
      let discount = 0
      if (v.type === 'percentage') {
        discount = Math.floor(subtotal * v.value / 100)
        if (v.max_discount) discount = Math.min(discount, v.max_discount)
      } else { discount = v.value }
      discount = Math.min(discount, subtotal)
      return json({ valid: true, code: v.code, type: v.type, value: v.value, discount, description: v.description || '' })
    }

    // ============ ORDERS ============
    if (route === '/orders' && method === 'POST') {
      const body = await request.json()
      const session = getSessionFromRequest(request)
      const orderCode = 'CAISY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase()
      const isPickup = body.is_pickup === true

      const items = body.items || []
      let subtotal = 0
      const enrichedItems = []
      for (const item of items) {
        const p = await db.collection('products').findOne({ id: item.product_id })
        if (!p) return err(`Product ${item.product_id} not found`)
        if (p.stock < item.quantity) return err(`Stok tidak cukup untuk ${p.name}`)
        const sub = p.price * item.quantity
        subtotal += sub
        enrichedItems.push({
          id: uuidv4(), product_id: p.id, product_name: p.name, product_image: p.image_url,
          quantity: item.quantity, price: p.price, subtotal: sub,
        })
      }

      const shipping_cost = isPickup ? 0 : (body.shipping_cost || 0)
      let voucher_code = null, voucher_discount = 0
      if (body.voucher_code) {
        const v = await db.collection('vouchers').findOne({ code: body.voucher_code.toUpperCase() })
        if (v && v.is_active) {
          const now = new Date()
          if ((!v.valid_from || new Date(v.valid_from) <= now) && (!v.valid_until || new Date(v.valid_until) >= now) &&
              (!v.usage_limit || v.used_count < v.usage_limit) && (!v.min_purchase || subtotal >= v.min_purchase)) {
            if (v.type === 'percentage') {
              voucher_discount = Math.floor(subtotal * v.value / 100)
              if (v.max_discount) voucher_discount = Math.min(voucher_discount, v.max_discount)
            } else { voucher_discount = v.value }
            voucher_discount = Math.min(voucher_discount, subtotal)
            voucher_code = v.code
            await db.collection('vouchers').updateOne({ id: v.id }, { $inc: { used_count: 1 } })
          }
        }
      }

      const total_amount = subtotal + shipping_cost - voucher_discount

      // Generate pickup code if pickup order
      const pickup_code = isPickup ? 'CP' + Math.random().toString(36).substr(2, 6).toUpperCase() : null

      const order = {
        id: uuidv4(), order_code: orderCode,
        user_id: session?.userId || null,
        guest_name: sanitize(body.guest_name || ''),
        guest_email: sanitize(body.guest_email || ''),
        guest_phone: sanitize(body.guest_phone || ''),
        items: enrichedItems, subtotal, shipping_cost,
        voucher_code, voucher_discount, total_amount,
        shipping_carrier: isPickup ? null : sanitize(body.shipping_carrier || ''),
        shipping_service: isPickup ? null : sanitize(body.shipping_service || ''),
        shipping_etd: isPickup ? null : sanitize(body.shipping_etd || ''),
        is_pickup: isPickup,
        pickup_code,
        status: 'pending', snap_token: null, payment_method: null, paid_at: null,
        province_id: body.province_id || null, province_name: sanitize(body.province_name || ''),
        city_id: body.city_id || null, city_name: sanitize(body.city_name || ''),
        district_id: body.district_id || null, district_name: sanitize(body.district_name || ''),
        village_id: body.village_id || null, village_name: sanitize(body.village_name || ''),
        address_detail: isPickup ? 'Pickup di Toko' : sanitize(body.address_detail || ''),
        postal_code: body.postal_code || null,
        notes: sanitize(body.notes || ''),
        tracking_number: null, biteship_order_id: null, biteship_tracking_url: null,
        created_at: new Date(), updated_at: new Date(),
      }
      await db.collection('orders').insertOne(order)

      // Send order confirmation email
      const emailTo = order.guest_email
      if (emailTo) {
        sendEmail({
          to: emailTo,
          subject: `Konfirmasi Pesanan #${orderCode} - Caisy Perfume`,
          html: emailOrderConfirmation(order)
        }).catch(e => console.error('Email error:', e))
      }

      return json({ order: clean(order) })
    }

    if (route.startsWith('/orders/') && method === 'GET') {
      const id = sanitize(route.replace('/orders/', ''))
      const order = await db.collection('orders').findOne({ $or: [{ id }, { order_code: id }] })
      if (!order) return err('Order not found', 404)
      return json({ order: clean(order) })
    }

    if (route === '/orders' && method === 'GET') {
      const session = getSessionFromRequest(request)
      if (!session) return err('Unauthorized', 401)
      const orders = await db.collection('orders').find({ user_id: session.userId }).sort({ created_at: -1 }).toArray()
      return json({ orders: clean(orders) })
    }

    // ============ PAYMENT ============
    if (route === '/payment/create-transaction' && method === 'POST') {
      const { order_id } = await request.json()
      const order = await db.collection('orders').findOne({ id: order_id })
      if (!order) return err('Order not found', 404)
      const snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        serverKey: process.env.MIDTRANS_SERVER_KEY,
      })
      const customerName = order.guest_name || 'Customer'
      const nameParts = customerName.split(' ')
      const itemDetails = order.items.map(item => ({
        id: String(item.product_id), price: item.price, quantity: item.quantity,
        name: (item.product_name || 'Product').substring(0, 50),
      }))
      if (order.shipping_cost > 0) {
        itemDetails.push({ id: 'ONGKIR', price: order.shipping_cost, quantity: 1, name: `Ongkir ${order.shipping_carrier || ''}`.substring(0, 50) })
      }
      if (order.voucher_discount > 0) {
        itemDetails.push({ id: 'VOUCHER', price: -order.voucher_discount, quantity: 1, name: `Voucher ${order.voucher_code || ''}`.substring(0, 50) })
      }
      const parameter = {
        transaction_details: { order_id: order.order_code, gross_amount: order.total_amount },
        customer_details: {
          first_name: nameParts[0] || 'Customer',
          last_name: nameParts.slice(1).join(' ') || '',
          email: order.guest_email || 'customer@caisy.com',
          phone: order.guest_phone || '',
        },
        item_details: itemDetails,
      }
      try {
        const transaction = await snap.createTransaction(parameter)
        await db.collection('orders').updateOne({ id: order_id }, { $set: { snap_token: transaction.token, updated_at: new Date() } })
        return json({ snap_token: transaction.token, redirect_url: transaction.redirect_url })
      } catch (e) {
        return err('Gagal membuat transaksi: ' + (e.ApiResponse?.error_messages?.join(', ') || e.message), 500)
      }
    }

    // ============ MIDTRANS WEBHOOK ============
    // IMPORTANT: This route must be excluded from CSRF in middleware
    if (route === '/webhook/midtrans' && method === 'POST') {
      const body = await request.json()
      
      // SECURITY: Verify Midtrans signature
      const signatureString = body.order_id + body.status_code + body.gross_amount + process.env.MIDTRANS_SERVER_KEY
      const expectedSignature = crypto.createHash('sha512').update(signatureString).digest('hex')
      if (body.signature_key !== expectedSignature) {
        console.error('Invalid Midtrans signature for order:', body.order_id)
        return err('Invalid signature', 403)
      }

      const { transaction_status, order_id, payment_type } = body
      const order = await db.collection('orders').findOne({ order_code: order_id })
      if (!order) return err('Order not found', 404)

      if (['settlement', 'capture'].includes(transaction_status)) {
        // Update order status
        await db.collection('orders').updateOne({ order_code: order_id }, {
          $set: { status: 'paid', payment_method: payment_type, paid_at: new Date(), updated_at: new Date() }
        })

        // Reduce stock
        for (const item of order.items) {
          const p = await db.collection('products').findOne({ id: item.product_id })
          if (!p) continue
          const stockBefore = p.stock
          const newStock = Math.max(0, stockBefore - item.quantity)
          await db.collection('products').updateOne({ id: item.product_id }, { $set: { stock: newStock, updated_at: new Date() } })
          await db.collection('stock_logs').insertOne({
            id: uuidv4(), product_id: item.product_id, type: 'purchase',
            quantity_change: -item.quantity, stock_before: stockBefore, stock_after: newStock,
            reason: `Pembelian #${order_id}`, notes: '', created_by: null, created_at: new Date(),
          })
        }

        // Create Biteship shipment order (only if not pickup)
        if (!order.is_pickup) {
          try {
            const storeSettings = await db.collection('settings').findOne({ key: 'store' })
            const biteshipOrder = await biteshipCreateOrder(order, storeSettings || {})
            if (biteshipOrder.id) {
              await db.collection('orders').updateOne({ order_code: order_id }, {
                $set: {
                  biteship_order_id: biteshipOrder.id,
                  tracking_number: biteshipOrder.courier?.waybill_id || null,
                  biteship_tracking_url: biteshipOrder.courier?.tracking_url || null,
                  updated_at: new Date()
                }
              })
            }
          } catch (e) {
            console.error('Biteship order creation failed:', e.message)
            // Continue even if biteship fails — admin can create manually
          }
        }

        // Re-fetch order with updated data for email
        const updatedOrder = await db.collection('orders').findOne({ order_code: order_id })

        // Send payment success email
        if (updatedOrder?.guest_email) {
          sendEmail({
            to: updatedOrder.guest_email,
            subject: `✅ Pembayaran Berhasil #${order_id} - Caisy Perfume`,
            html: emailPaymentSuccess(updatedOrder)
          }).catch(e => console.error('Email error:', e))
        }

      } else if (['expire', 'cancel', 'deny', 'failure'].includes(transaction_status)) {
        await db.collection('orders').updateOne({ order_code: order_id }, {
          $set: { status: 'cancelled', updated_at: new Date() }
        })

        // Send payment failed email
        if (order.guest_email) {
          sendEmail({
            to: order.guest_email,
            subject: `❌ Pembayaran Gagal #${order_id} - Caisy Perfume`,
            html: emailPaymentFailed(order)
          }).catch(e => console.error('Email error:', e))
        }

      } else if (transaction_status === 'pending') {
        await db.collection('orders').updateOne({ order_code: order_id }, {
          $set: { status: 'pending', payment_method: payment_type, updated_at: new Date() }
        })
      }

      return json({ status: 'OK' })
    }

    // ============ WAITING LIST ============
    if (route === '/waiting-list' && method === 'POST') {
      const body = await request.json()
      const perfumeKey = sanitize(body.perfume_name || '').toLowerCase().trim()
      if (!perfumeKey) return err('Nama parfum wajib diisi')
      const existing = await db.collection('waiting_list_requests').findOne({ perfume_key: perfumeKey })
      if (existing) {
        await db.collection('waiting_list_requests').updateOne(
          { id: existing.id },
          { $inc: { request_count: 1 }, $set: { updated_at: new Date() }, $push: { requesters: { name: sanitize(body.requester_name), email: sanitize(body.requester_email), at: new Date() } } }
        )
      } else {
        await db.collection('waiting_list_requests').insertOne({
          id: uuidv4(),
          requester_name: sanitize(body.requester_name), requester_email: sanitize(body.requester_email),
          perfume_name: sanitize(body.perfume_name), perfume_key: perfumeKey,
          brand: sanitize(body.brand || ''), gender_preference: sanitize(body.gender_preference || ''),
          description: sanitize(body.description || ''),
          request_count: 1, status: 'open',
          requesters: [{ name: sanitize(body.requester_name), email: sanitize(body.requester_email), at: new Date() }],
          created_at: new Date(), updated_at: new Date(),
        })
      }
      return json({ ok: true })
    }

    if (route === '/waiting-list/top' && method === 'GET') {
      const items = await db.collection('waiting_list_requests').find({}).sort({ request_count: -1 }).limit(10).toArray()
      return json({ items: clean(items) })
    }

    // ============ FILES ============
    if (route === '/admin/upload' && method === 'POST') {
      const admin = await requireAdmin(request)
      if (!admin) return err('Forbidden', 403)
      const body = await request.json()
      const match = (body.data || '').match(/^data:([^;]+);base64,(.+)$/)
      if (!match) return err('Invalid data URL')
      const mime = match[1]
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedMimes.includes(mime)) return err('Tipe file tidak diizinkan. Gunakan JPG, PNG, WebP, atau GIF.')
      const base64 = match[2]
      if (base64.length * 0.75 > 5 * 1024 * 1024) return err('File terlalu besar (maks 5MB)', 413)
      const id = uuidv4()
      await db.collection('files').insertOne({ id, data: base64, content_type: mime, size: base64.length, filename: sanitize(body.filename || 'upload'), created_at: new Date() })
      return json({ url: `/api/files/${id}`, id })
    }

    if (route.startsWith('/files/') && method === 'GET') {
      const id = sanitize(route.replace('/files/', ''))
      if (!id.match(/^[0-9a-f-]{36}$/i)) return err('Invalid file ID', 400)
      const f = await db.collection('files').findOne({ id })
      if (!f) return err('Not found', 404)
      const buffer = Buffer.from(f.data, 'base64')
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': f.content_type || 'application/octet-stream',
          'Cache-Control': 'public, max-age=86400',
          'Content-Disposition': 'inline',
        },
      })
    }

    // ============ PUBLIC ENDPOINTS ============
    if (route === '/banners' && method === 'GET') {
      const banners = await db.collection('banners').find({ is_active: true }).sort({ order: 1 }).limit(3).toArray()
      return json({ banners: clean(banners) })
    }

    if (route === '/settings' && method === 'GET') {
      const s = await db.collection('settings').findOne({ key: 'store' })
      // Only return public-safe settings
      const publicSettings = s ? {
        store_name: s.store_name, brand_name: s.brand_name, brand_tagline: s.brand_tagline,
        description: s.description, logo_primary: s.logo_primary, logo_secondary: s.logo_secondary,
        favicon: s.favicon, use_image_logo: s.use_image_logo,
        whatsapp_cs: s.whatsapp_cs, email_cs: s.email_cs, phone: s.phone,
        instagram: s.instagram, tiktok: s.tiktok, facebook: s.facebook,
        color_primary: s.color_primary, color_secondary: s.color_secondary,
        color_accent: s.color_accent, color_text: s.color_text,
        color_card: s.color_card, color_border: s.color_border,
        color_success: s.color_success, color_danger: s.color_danger,
        meta_title: s.meta_title, meta_description: s.meta_description,
        maintenance_mode: s.maintenance_mode,
      } : {}
      return json({ settings: publicSettings })
    }

    // ============ WISHLIST ============
    if (route === '/wishlist' && method === 'GET') {
      const session = getSessionFromRequest(request)
      if (!session) return json({ product_ids: [] })
      const w = await db.collection('wishlists').findOne({ user_id: session.userId })
      const ids = w?.product_ids || []
      if (!ids.length) return json({ product_ids: [], products: [] })
      const products = await db.collection('products').find({ id: { $in: ids }, is_active: true }).toArray()
      return json({ product_ids: ids, products: clean(products) })
    }
    if (route === '/wishlist/toggle' && method === 'POST') {
      const session = getSessionFromRequest(request)
      if (!session) return err('Login dulu untuk menggunakan wishlist', 401)
      const { product_id } = await request.json()
      const w = await db.collection('wishlists').findOne({ user_id: session.userId })
      let ids = w?.product_ids || []
      let added
      if (ids.includes(product_id)) { ids = ids.filter(i => i !== product_id); added = false }
      else { ids.push(product_id); added = true }
      await db.collection('wishlists').updateOne({ user_id: session.userId }, { $set: { user_id: session.userId, product_ids: ids, updated_at: new Date() } }, { upsert: true })
      return json({ ok: true, added, product_ids: ids })
    }

    // ============ REVIEWS ============
    if (route.match(/^\/products\/[^/]+\/reviews$/) && method === 'GET') {
      const productId = route.split('/')[2]
      let pid = productId
      const p = await db.collection('products').findOne({ $or: [{ id: pid }, { slug: pid }] })
      if (p) pid = p.id
      const reviews = await db.collection('reviews').find({ product_id: pid, is_approved: true }).sort({ created_at: -1 }).toArray()
      const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
      return json({ reviews: clean(reviews), count: reviews.length, average: Math.round(avg * 10) / 10 })
    }
    if (route.match(/^\/products\/[^/]+\/reviews$/) && method === 'POST') {
      const productId = route.split('/')[2]
      const session = getSessionFromRequest(request)
      if (!session) return err('Login dulu untuk memberi review', 401)
      const { rating, content } = await request.json()
      if (!rating || rating < 1 || rating > 5) return err('Rating harus 1-5')
      const user = await db.collection('users').findOne({ id: session.userId })
      const p = await db.collection('products').findOne({ $or: [{ id: productId }, { slug: productId }] })
      if (!p) return err('Product not found', 404)
      const review = {
        id: uuidv4(), product_id: p.id, user_id: session.userId,
        user_name: user?.name || 'Customer',
        rating: parseInt(rating), content: sanitize(content || ''),
        is_approved: true, created_at: new Date(),
      }
      await db.collection('reviews').insertOne(review)
      return json({ review: clean(review) })
    }

    // ============ ADMIN ============
    if (route.startsWith('/admin/')) {
      const admin = await requireAdmin(request)
      if (!admin) return err('Forbidden: admin only', 403)

      if (route === '/admin/stats' && method === 'GET') {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const sevenDaysAgo = new Date(now.getTime() - 7*24*60*60*1000)
        const orders = await db.collection('orders').find({}).toArray()
        const paidOrders = orders.filter(o => o.status === 'paid')
        const revenueToday = paidOrders.filter(o => o.paid_at && new Date(o.paid_at) >= startOfDay).reduce((s,o)=>s+o.total_amount,0)
        const revenueMonth = paidOrders.filter(o => o.paid_at && new Date(o.paid_at) >= startOfMonth).reduce((s,o)=>s+o.total_amount,0)
        const ordersToday = orders.filter(o => new Date(o.created_at) >= startOfDay)
        const ordersMonth = orders.filter(o => new Date(o.created_at) >= startOfMonth)
        const statusBreakdown = orders.reduce((acc,o)=>{ acc[o.status]=(acc[o.status]||0)+1; return acc }, {})
        const criticalStock = await db.collection('products').find({ stock: { $lt: 10 } }).toArray()
        const salesByDay = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i*24*60*60*1000)
          salesByDay[d.toISOString().slice(0,10)] = 0
        }
        paidOrders.filter(o => o.paid_at && new Date(o.paid_at) >= sevenDaysAgo).forEach(o => {
          const key = new Date(o.paid_at).toISOString().slice(0,10)
          if (salesByDay[key] !== undefined) salesByDay[key] += o.total_amount
        })
        const products = await db.collection('products').find({}).toArray()
        const catDist = { wanita:0, pria:0, unisex:0 }
        for (const o of paidOrders) for (const it of o.items) {
          const p = products.find(p => p.id === it.product_id)
          if (p && catDist[p.category] !== undefined) catDist[p.category] += it.quantity
        }
        return json({
          revenueToday, revenueMonth,
          ordersToday: ordersToday.length, ordersMonth: ordersMonth.length,
          statusBreakdown, criticalStock: clean(criticalStock),
          salesChart: Object.entries(salesByDay).map(([date, total]) => ({ date, total })),
          categoryDistribution: catDist,
          latestOrders: clean(orders.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5)),
          totalProducts: products.length,
          totalCustomers: await db.collection('users').countDocuments({ role: 'customer' }),
        })
      }

      // Products CRUD
      if (route === '/admin/products' && method === 'GET') {
        return json({ products: clean(await db.collection('products').find({}).sort({ created_at: -1 }).toArray()) })
      }
      if (route === '/admin/products' && method === 'POST') {
        const b = await request.json()
        const slug = sanitize(b.slug || b.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''))
        const p = {
          id: uuidv4(), name: sanitize(b.name), slug, category: b.category,
          description: sanitize(b.description || ''), inspired_by: sanitize(b.inspired_by || ''),
          top_note: sanitize(b.top_note || ''), middle_note: sanitize(b.middle_note || ''), base_note: sanitize(b.base_note || ''),
          price: parseInt(b.price), size_ml: parseInt(b.size_ml) || 30,
          weight_gram: parseInt(b.weight_gram) || 150, stock: parseInt(b.stock) || 0,
          image_url: b.image_url || '', is_active: b.is_active !== false, is_featured: !!b.is_featured,
          created_at: new Date(), updated_at: new Date(),
        }
        await db.collection('products').insertOne(p)
        return json({ product: clean(p) })
      }
      if (route.startsWith('/admin/products/') && method === 'PUT') {
        const id = route.replace('/admin/products/', '')
        const b = await request.json()
        const update = { updated_at: new Date() }
        for (const k of ['name','description','inspired_by','top_note','middle_note','base_note','image_url','category']) {
          if (b[k] !== undefined) update[k] = sanitize(b[k])
        }
        if (b.price) update.price = parseInt(b.price)
        if (b.stock !== undefined) update.stock = parseInt(b.stock)
        if (b.is_active !== undefined) update.is_active = !!b.is_active
        if (b.is_featured !== undefined) update.is_featured = !!b.is_featured
        delete update._id; delete update.id
        await db.collection('products').updateOne({ id }, { $set: update })
        return json({ product: clean(await db.collection('products').findOne({ id })) })
      }
      if (route.startsWith('/admin/products/') && method === 'DELETE') {
        const id = route.replace('/admin/products/', '')
        await db.collection('products').deleteOne({ id })
        return json({ ok: true })
      }

      // Orders
      if (route === '/admin/orders' && method === 'GET') {
        return json({ orders: clean(await db.collection('orders').find({}).sort({ created_at: -1 }).toArray()) })
      }
      if (route.match(/^\/admin\/orders\/[^/]+\/status$/) && method === 'PATCH') {
        const id = route.split('/')[3]
        const { status, tracking_number, biteship_tracking_url } = await request.json()
        const update = { status, updated_at: new Date() }
        if (tracking_number) update.tracking_number = tracking_number
        if (biteship_tracking_url) update.biteship_tracking_url = biteship_tracking_url
        await db.collection('orders').updateOne({ id }, { $set: update })

        // If shipped, send email with tracking
        if (status === 'shipped' && tracking_number) {
          const order = await db.collection('orders').findOne({ id })
          if (order?.guest_email) {
            sendEmail({
              to: order.guest_email,
              subject: `📦 Pesanan #${order.order_code} Sedang Dikirim - Caisy Perfume`,
              html: emailOrderShipped({ ...order, tracking_number, biteship_tracking_url })
            }).catch(e => console.error('Email error:', e))
          }
        }
        return json({ ok: true })
      }

      // Stock
      if (route === '/admin/stock' && method === 'GET') {
        const products = await db.collection('products').find({}).toArray()
        const orders = await db.collection('orders').find({ status: 'paid' }).toArray()
        const result = products.map(p => {
          let sold = 0
          for (const o of orders) for (const i of o.items) if (i.product_id === p.id) sold += i.quantity
          return { ...p, total_sold: sold }
        })
        return json({ stock: clean(result) })
      }
      if (route === '/admin/stock/adjust' && method === 'POST') {
        const { product_id, quantity_change, reason, notes } = await request.json()
        const p = await db.collection('products').findOne({ id: product_id })
        if (!p) return err('Product not found', 404)
        const stockBefore = p.stock
        const stockAfter = stockBefore + parseInt(quantity_change)
        if (stockAfter < 0) return err('Stok tidak boleh kurang dari 0', 400)
        await db.collection('products').updateOne({ id: product_id }, { $set: { stock: stockAfter, updated_at: new Date() } })
        await db.collection('stock_logs').insertOne({
          id: uuidv4(), product_id, type: quantity_change > 0 ? 'manual_increase' : 'manual_decrease',
          quantity_change: parseInt(quantity_change), stock_before: stockBefore, stock_after: stockAfter,
          reason: sanitize(reason), notes: sanitize(notes || ''), created_by: admin.id, created_at: new Date(),
        })
        return json({ ok: true, new_stock: stockAfter })
      }
      if (route === '/admin/stock/logs' && method === 'GET') {
        const filter = {}
        if (qs.product_id) filter.product_id = qs.product_id
        if (qs.type) filter.type = qs.type
        const logs = await db.collection('stock_logs').find(filter).sort({ created_at: -1 }).limit(200).toArray()
        const products = await db.collection('products').find({}).toArray()
        const pmap = {}; products.forEach(p => pmap[p.id] = p.name)
        return json({ logs: clean(logs).map(l => ({ ...l, product_name: pmap[l.product_id] || 'Unknown' })) })
      }

      // Customers
      if (route === '/admin/customers' && method === 'GET') {
        const users = await db.collection('users').find({ role: 'customer' }).toArray()
        const orders = await db.collection('orders').find({ status: 'paid' }).toArray()
        const result = users.map(u => {
          const userOrders = orders.filter(o => o.user_id === u.id)
          return { id: u.id, name: u.name, email: u.email, phone: u.phone, created_at: u.created_at, order_count: userOrders.length, total_spend: userOrders.reduce((s,o)=>s+o.total_amount,0) }
        })
        return json({ customers: result })
      }

      // Waiting list
      if (route === '/admin/waiting-list' && method === 'GET') {
        return json({ items: clean(await db.collection('waiting_list_requests').find({}).sort({ request_count: -1 }).toArray()) })
      }
      if (route.match(/^\/admin\/waiting-list\/[^/]+$/) && method === 'PATCH') {
        const id = route.split('/')[3]
        const { status } = await request.json()
        await db.collection('waiting_list_requests').updateOne({ id }, { $set: { status, updated_at: new Date() } })

        // If fulfilled, notify all requesters
        if (status === 'fulfilled') {
          const item = await db.collection('waiting_list_requests').findOne({ id })
          if (item?.requesters?.length) {
            for (const requester of item.requesters) {
              if (requester.email) {
                sendEmail({
                  to: requester.email,
                  subject: `🎉 ${item.perfume_name} Sudah Tersedia! - Caisy Perfume`,
                  html: `<p>Halo ${requester.name}! Kabar gembira — parfum dupe <strong>${item.perfume_name}</strong> yang Anda request sudah tersedia di Caisy Perfume. <a href="${process.env.NEXT_PUBLIC_APP_URL}/catalog">Lihat Katalog →</a></p>`
                }).catch(e => console.error('Email error:', e))
              }
            }
          }
        }
        return json({ ok: true })
      }

      // Reports
      if (route === '/admin/reports' && method === 'GET') {
        const { from, to } = qs
        const filter = { status: 'paid' }
        if (from || to) {
          filter.paid_at = {}
          if (from) filter.paid_at.$gte = new Date(from)
          if (to) filter.paid_at.$lte = new Date(to)
        }
        const orders = await db.collection('orders').find(filter).toArray()
        const totalRevenue = orders.reduce((s,o)=>s+o.total_amount,0)
        const productSales = {}
        for (const o of orders) for (const i of o.items) {
          if (!productSales[i.product_id]) productSales[i.product_id] = { name: i.product_name, quantity: 0, revenue: 0 }
          productSales[i.product_id].quantity += i.quantity
          productSales[i.product_id].revenue += i.subtotal
        }
        return json({
          totalRevenue, orderCount: orders.length,
          topProducts: Object.entries(productSales).map(([id, v]) => ({ product_id: id, ...v })).sort((a,b) => b.quantity - a.quantity).slice(0,10)
        })
      }

      // Settings
      if (route === '/admin/settings' && method === 'GET') {
        const s = await db.collection('settings').findOne({ key: 'store' })
        return json({ settings: clean(s) })
      }
      if (route === '/admin/settings' && method === 'PUT') {
        const b = await request.json()
        // Only allow whitelisted fields to be saved
        const allowed = ['store_name','brand_name','brand_tagline','description','logo_primary','logo_secondary',
          'favicon','use_image_logo','whatsapp_cs','email_cs','phone','address','postal_code',
          'instagram','tiktok','facebook','color_primary','color_secondary','color_accent','color_text',
          'color_card','color_border','color_success','color_danger','meta_title','meta_description',
          'meta_keywords','maintenance_mode']
        const update = { key: 'store', updated_at: new Date() }
        for (const k of allowed) {
          if (b[k] !== undefined) update[k] = typeof b[k] === 'string' ? sanitize(b[k]) : b[k]
        }
        await db.collection('settings').updateOne({ key: 'store' }, { $set: update }, { upsert: true })
        return json({ ok: true })
      }

      // Vouchers
      if (route === '/admin/vouchers' && method === 'GET') {
        return json({ vouchers: clean(await db.collection('vouchers').find({}).sort({ created_at: -1 }).toArray()) })
      }
      if (route === '/admin/vouchers' && method === 'POST') {
        const b = await request.json()
        if (!b.code) return err('Kode voucher wajib diisi')
        const code = sanitize(b.code).toUpperCase()
        if (await db.collection('vouchers').findOne({ code })) return err('Kode voucher sudah ada', 409)
        const v = {
          id: uuidv4(), code, type: b.type || 'percentage', value: parseInt(b.value) || 0,
          min_purchase: parseInt(b.min_purchase) || 0, max_discount: parseInt(b.max_discount) || 0,
          usage_limit: parseInt(b.usage_limit) || 0, used_count: 0,
          valid_from: b.valid_from ? new Date(b.valid_from) : null,
          valid_until: b.valid_until ? new Date(b.valid_until) : null,
          is_active: b.is_active !== false, description: sanitize(b.description || ''),
          created_at: new Date(), updated_at: new Date(),
        }
        await db.collection('vouchers').insertOne(v)
        return json({ voucher: clean(v) })
      }
      if (route.startsWith('/admin/vouchers/') && method === 'PUT') {
        const id = route.replace('/admin/vouchers/', '')
        const b = await request.json()
        const update = { updated_at: new Date() }
        if (b.code) update.code = sanitize(b.code).toUpperCase()
        if (b.type) update.type = b.type
        if (b.value !== undefined) update.value = parseInt(b.value) || 0
        if (b.min_purchase !== undefined) update.min_purchase = parseInt(b.min_purchase) || 0
        if (b.max_discount !== undefined) update.max_discount = parseInt(b.max_discount) || 0
        if (b.usage_limit !== undefined) update.usage_limit = parseInt(b.usage_limit) || 0
        if (b.valid_from !== undefined) update.valid_from = b.valid_from ? new Date(b.valid_from) : null
        if (b.valid_until !== undefined) update.valid_until = b.valid_until ? new Date(b.valid_until) : null
        if (b.is_active !== undefined) update.is_active = !!b.is_active
        if (b.description !== undefined) update.description = sanitize(b.description)
        await db.collection('vouchers').updateOne({ id }, { $set: update })
        return json({ voucher: clean(await db.collection('vouchers').findOne({ id })) })
      }
      if (route.startsWith('/admin/vouchers/') && method === 'DELETE') {
        await db.collection('vouchers').deleteOne({ id: route.replace('/admin/vouchers/', '') })
        return json({ ok: true })
      }

      // Banners
      if (route === '/admin/banners' && method === 'GET') {
        return json({ banners: clean(await db.collection('banners').find({}).sort({ order: 1, created_at: -1 }).toArray()) })
      }
      if (route === '/admin/banners' && method === 'POST') {
        const b = await request.json()
        const count = await db.collection('banners').countDocuments()
        if (count >= 3 && !b.allow_over_limit) return err('Maksimal 3 banner.', 400)
        const banner = {
          id: uuidv4(), image_url: b.image_url || '', title: sanitize(b.title || ''),
          subtitle: sanitize(b.subtitle || ''), link_url: sanitize(b.link_url || ''),
          voucher_code: sanitize(b.voucher_code || ''), is_active: b.is_active !== false,
          order: parseInt(b.order) || 0, created_at: new Date(), updated_at: new Date(),
        }
        await db.collection('banners').insertOne(banner)
        return json({ banner: clean(banner) })
      }
      if (route.startsWith('/admin/banners/') && method === 'PUT') {
        const id = route.replace('/admin/banners/', '')
        const b = await request.json()
        const update = { updated_at: new Date() }
        for (const k of ['image_url','title','subtitle','link_url','voucher_code','is_active','order']) {
          if (b[k] !== undefined) update[k] = k === 'order' ? (parseInt(b[k]) || 0) : (typeof b[k] === 'string' ? sanitize(b[k]) : b[k])
        }
        await db.collection('banners').updateOne({ id }, { $set: update })
        return json({ banner: clean(await db.collection('banners').findOne({ id })) })
      }
      if (route.startsWith('/admin/banners/') && method === 'DELETE') {
        await db.collection('banners').deleteOne({ id: route.replace('/admin/banners/', '') })
        return json({ ok: true })
      }

      // Reviews
      if (route === '/admin/reviews' && method === 'GET') {
        const reviews = await db.collection('reviews').find({}).sort({ created_at: -1 }).toArray()
        const products = await db.collection('products').find({}).toArray()
        const pmap = {}; products.forEach(p => pmap[p.id] = p.name)
        return json({ reviews: clean(reviews).map(r => ({ ...r, product_name: pmap[r.product_id] || 'Unknown' })) })
      }
      if (route.startsWith('/admin/reviews/') && method === 'PATCH') {
        const id = route.replace('/admin/reviews/', '')
        const { is_approved } = await request.json()
        await db.collection('reviews').updateOne({ id }, { $set: { is_approved } })
        return json({ ok: true })
      }
      if (route.startsWith('/admin/reviews/') && method === 'DELETE') {
        await db.collection('reviews').deleteOne({ id: route.replace('/admin/reviews/', '') })
        return json({ ok: true })
      }

      // Admin: send email manually
      if (route === '/admin/email/test' && method === 'POST') {
        const { to, subject } = await request.json()
        if (!to) return err('Email tujuan wajib diisi')
        await sendEmail({ to, subject: subject || 'Test Email - Caisy Perfume', html: '<p>Test email dari Caisy Perfume berhasil! ✅</p>' })
        return json({ ok: true })
      }

      // Admin: manually trigger shipped email
      if (route.match(/^\/admin\/orders\/[^/]+\/notify-shipped$/) && method === 'POST') {
        const id = route.split('/')[3]
        const order = await db.collection('orders').findOne({ id })
        if (!order) return err('Order not found', 404)
        if (order.guest_email) {
          await sendEmail({
            to: order.guest_email,
            subject: `📦 Pesanan #${order.order_code} Sedang Dikirim - Caisy Perfume`,
            html: emailOrderShipped(order)
          })
        }
        return json({ ok: true })
      }
    }

    return err(`Route ${route} not found`, 404)
  } catch (e) {
    console.error('API Error:', e)
    return err('Internal server error', 500) // Don't expose error details in production
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const DELETE = handle
export const PATCH = handle
