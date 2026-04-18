import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { seedDatabase } from '@/lib/seed'
import { hashPassword, verifyPassword, signToken, getSessionFromRequest } from '@/lib/auth'
import { getProvinces, getCities, getDistricts, getDistrictById } from '@/lib/indonesia-locations'
import crypto from 'crypto'
import midtransClient from 'midtrans-client'

function corsHeaders(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
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

async function requireAdmin(request) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const db = await getDb()
  const user = await db.collection('users').findOne({ id: session.userId })
  if (!user || user.role !== 'admin') return null
  return user
}

async function handle(request, { params }) {
  const { path = [] } = params
  const route = '/' + path.join('/')
  const method = request.method
  const url = new URL(request.url)
  const qs = Object.fromEntries(url.searchParams)

  try {
    const db = await getDb()
    // Ensure seed (lazy)
    await seedDatabase()

    // Health
    if (route === '/' || route === '/health') return json({ message: 'Caisy Perfume API', ok: true })

    // ============ AUTH ============
    if (route === '/auth/register' && method === 'POST') {
      const { name, email, password, phone } = await request.json()
      if (!name || !email || !password) return err('Nama, email, dan password wajib diisi')
      const existing = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (existing) return err('Email sudah terdaftar', 409)
      const user = {
        id: uuidv4(),
        name, email: email.toLowerCase(), phone: phone || '',
        password: await hashPassword(password),
        role: 'customer',
        email_verified_at: null,
        created_at: new Date(), updated_at: new Date(),
      }
      await db.collection('users').insertOne(user)
      const token = signToken({ userId: user.id, role: user.role })
      const res = json({ user: { id: user.id, name, email, phone, role: 'customer' }, token })
      res.cookies.set('caisy_token', token, { httpOnly: true, path: '/', maxAge: 60*60*24*30, sameSite: 'lax' })
      return res
    }

    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json()
      const user = await db.collection('users').findOne({ email: (email || '').toLowerCase() })
      if (!user) return err('Email atau password salah', 401)
      const ok = await verifyPassword(password, user.password)
      if (!ok) return err('Email atau password salah', 401)
      const token = signToken({ userId: user.id, role: user.role })
      const res = json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }, token })
      res.cookies.set('caisy_token', token, { httpOnly: true, path: '/', maxAge: 60*60*24*30, sameSite: 'lax' })
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
      if (body.name) update.name = body.name
      if (body.phone !== undefined) update.phone = body.phone
      if (body.email) update.email = body.email.toLowerCase()
      if (body.password) update.password = await hashPassword(body.password)
      await db.collection('users').updateOne({ id: session.userId }, { $set: update })
      const user = await db.collection('users').findOne({ id: session.userId })
      return json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } })
    }

    // ============ PRODUCTS ============
    if (route === '/products' && method === 'GET') {
      const { category, search, sort, min_price, max_price, in_stock, page = 1, limit = 12 } = qs
      const filter = { is_active: true }
      if (category) filter.category = category
      if (search) filter.name = { $regex: search, $options: 'i' }
      if (min_price || max_price) {
        filter.price = {}
        if (min_price) filter.price.$gte = parseInt(min_price)
        if (max_price) filter.price.$lte = parseInt(max_price)
      }
      if (in_stock === 'true') filter.stock = { $gt: 0 }
      let sortObj = { created_at: -1 }
      if (sort === 'price_asc') sortObj = { price: 1 }
      if (sort === 'price_desc') sortObj = { price: -1 }
      const p = parseInt(page), l = parseInt(limit)
      const total = await db.collection('products').countDocuments(filter)
      const products = await db.collection('products').find(filter).sort(sortObj).skip((p-1)*l).limit(l).toArray()
      return json({ products: clean(products), total, page: p, limit: l, pages: Math.ceil(total/l) })
    }

    if (route === '/products/featured' && method === 'GET') {
      const products = await db.collection('products').find({ is_active: true, is_featured: true }).limit(8).toArray()
      return json({ products: clean(products) })
    }

    if (route.startsWith('/products/slug/') && method === 'GET') {
      const slug = route.replace('/products/slug/', '')
      const p = await db.collection('products').findOne({ slug })
      if (!p) return err('Product not found', 404)
      const related = await db.collection('products').find({ category: p.category, slug: { $ne: slug }, is_active: true }).limit(4).toArray()
      return json({ product: clean(p), related: clean(related) })
    }

    // ============ AI SMART SEARCH (Gemini) ============
    if (route === '/smart-search' && method === 'POST') {
      const { query } = await request.json()
      if (!query) return err('Query is required')
      const products = await db.collection('products').find({ is_active: true }).toArray()
      const cleanProducts = clean(products)
      const productList = JSON.stringify(cleanProducts.map(p => ({
        id: p.id, name: p.name, category: p.category, inspired_by: p.inspired_by,
        top_note: p.top_note, middle_note: p.middle_note, base_note: p.base_note,
        description: p.description, price: p.price
      })))
      const prompt = `Kamu adalah asisten parfum profesional untuk toko Caisy Perfume.\nDaftar produk yang tersedia:\n${productList}\n\nPermintaan customer: "${query}"\n\nRekomendasikan 3-5 produk yang paling relevan berdasarkan permintaan tersebut.\nBalas HANYA dengan format JSON array berikut, tanpa teks lain, tanpa markdown code fence:\n[{"product_id": "id_produk_string", "reason": "alasan singkat dalam bahasa Indonesia maksimal 15 kata"}]\nJika tidak ada yang relevan, kembalikan array kosong [].`
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
        try { recommendations = JSON.parse(cleaned) } catch (e) { recommendations = [] }
        const recommendedIds = recommendations.map(r => String(r.product_id))
        const recommendedProducts = cleanProducts.filter(p => recommendedIds.includes(String(p.id)))
        const withReasons = recommendedProducts.map(p => ({
          ...p,
          ai_reason: recommendations.find(r => String(r.product_id) === String(p.id))?.reason || ''
        }))
        return json({ products: withReasons, query })
      } catch (e) {
        console.error('Gemini error:', e)
        return err('AI search failed: ' + e.message, 500)
      }
    }

    // ============ CART (for logged-in users) ============
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
      return json({ provinces: getProvinces() })
    }
    if (route === '/location/cities' && method === 'GET') {
      return json({ cities: getCities(qs.province_id) })
    }
    if (route === '/location/districts' && method === 'GET') {
      return json({ districts: getDistricts(qs.city_id) })
    }

    // ============ SHIPPING (Jubelio) ============
    if (route === '/shipping/rates' && method === 'POST') {
      const { district_id, weight, subtotal } = await request.json()
      const district = getDistrictById(district_id)
      if (!district) return err('District not found', 404)
      let rates = []
      try {
        const tokenRes = await fetch('https://api.jubelio.com/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: process.env.JUBELIO_CLIENT_ID, password: process.env.JUBELIO_CLIENT_SECRET })
        })
        const tokenData = await tokenRes.json()
        if (tokenData.token) {
          const ratesRes = await fetch('https://api.jubelio.com/shipment/check-rate', {
            method: 'POST', headers: { 'Authorization': `Bearer ${tokenData.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination_id: district.jubelio_destination_id, weight, item_value: subtotal })
          })
          const data = await ratesRes.json()
          rates = data?.data || []
        }
      } catch (e) {
        console.warn('Jubelio error (using fallback):', e.message)
      }
      if (!rates.length) {
        // Fallback mock rates
        rates = [
          { courier: 'JNE', service: 'REG', etd: '2-3 hari', price: 15000 },
          { courier: 'JNE', service: 'YES', etd: '1 hari', price: 25000 },
          { courier: 'J&T Express', service: 'REG', etd: '2-3 hari', price: 14000 },
          { courier: 'SiCepat', service: 'BEST', etd: '1-2 hari', price: 13000 },
          { courier: 'Anteraja', service: 'Regular', etd: '2-4 hari', price: 12000 },
          { courier: 'Pos Indonesia', service: 'Paket Kilat', etd: '3-5 hari', price: 10000 },
        ]
      }
      return json({ rates, district })
    }

    // ============ ORDERS ============
    if (route === '/orders' && method === 'POST') {
      const body = await request.json()
      const session = getSessionFromRequest(request)
      const orderCode = 'CAISY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase()
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
          id: uuidv4(),
          product_id: p.id, product_name: p.name, product_image: p.image_url,
          quantity: item.quantity, price: p.price, subtotal: sub,
        })
      }
      const shipping_cost = body.shipping_cost || 0
      const total_amount = subtotal + shipping_cost
      const district = body.district_id ? getDistrictById(body.district_id) : null
      const order = {
        id: uuidv4(),
        order_code: orderCode,
        user_id: session?.userId || null,
        guest_name: body.guest_name || null,
        guest_email: body.guest_email || null,
        guest_phone: body.guest_phone || null,
        items: enrichedItems,
        subtotal, shipping_cost, total_amount,
        shipping_carrier: body.shipping_carrier || null,
        shipping_service: body.shipping_service || null,
        shipping_etd: body.shipping_etd || null,
        status: 'pending', snap_token: null, payment_method: null, paid_at: null,
        province_id: body.province_id || null, province_name: district?.province_name || null,
        city_id: body.city_id || null, city_name: district?.city_name || null,
        district_id: body.district_id || null, district_name: district?.name || null,
        address_detail: body.address_detail || null,
        postal_code: body.postal_code || null,
        notes: body.notes || null,
        created_at: new Date(), updated_at: new Date(),
      }
      await db.collection('orders').insertOne(order)
      return json({ order: clean(order) })
    }

    if (route.startsWith('/orders/') && method === 'GET') {
      const id = route.replace('/orders/', '')
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

    // ============ PAYMENT (Midtrans Snap) ============
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
        id: String(item.product_id),
        price: item.price,
        quantity: item.quantity,
        name: (item.product_name || 'Product').substring(0, 50),
      }))
      if (order.shipping_cost > 0) {
        itemDetails.push({ id: 'ONGKIR', price: order.shipping_cost, quantity: 1, name: `Ongkir ${order.shipping_carrier || ''}`.substring(0, 50) })
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
        console.error('Midtrans error:', e)
        return err('Gagal membuat transaksi: ' + (e.ApiResponse?.error_messages?.join(', ') || e.message), 500)
      }
    }

    // ============ MIDTRANS WEBHOOK ============
    if (route === '/webhook/midtrans' && method === 'POST') {
      const body = await request.json()
      const signatureString = body.order_id + body.status_code + body.gross_amount + process.env.MIDTRANS_SERVER_KEY
      const expectedSignature = crypto.createHash('sha512').update(signatureString).digest('hex')
      if (body.signature_key !== expectedSignature) {
        return err('Invalid signature', 403)
      }
      const { transaction_status, order_id, payment_type } = body
      const order = await db.collection('orders').findOne({ order_code: order_id })
      if (!order) return err('Order not found', 404)
      if (['settlement', 'capture'].includes(transaction_status)) {
        await db.collection('orders').updateOne({ order_code: order_id }, { $set: { status: 'paid', payment_method: payment_type, paid_at: new Date(), updated_at: new Date() } })
        for (const item of order.items) {
          const p = await db.collection('products').findOne({ id: item.product_id })
          if (!p) continue
          const stockBefore = p.stock
          const stockAfter = stockBefore - item.quantity
          await db.collection('products').updateOne({ id: item.product_id }, { $set: { stock: stockAfter, updated_at: new Date() } })
          await db.collection('stock_logs').insertOne({
            id: uuidv4(), product_id: item.product_id, type: 'purchase',
            quantity_change: -item.quantity, stock_before: stockBefore, stock_after: stockAfter,
            reason: `Pembelian #${order_id}`, notes: '', created_by: null, created_at: new Date(),
          })
        }
      } else if (['expire', 'cancel', 'deny', 'failure'].includes(transaction_status)) {
        await db.collection('orders').updateOne({ order_code: order_id }, { $set: { status: 'cancelled', updated_at: new Date() } })
      } else if (transaction_status === 'pending') {
        await db.collection('orders').updateOne({ order_code: order_id }, { $set: { status: 'pending', payment_method: payment_type, updated_at: new Date() } })
      }
      return json({ status: 'OK' })
    }

    // ============ WAITING LIST ============
    if (route === '/waiting-list' && method === 'POST') {
      const body = await request.json()
      const perfumeKey = (body.perfume_name || '').toLowerCase().trim()
      if (!perfumeKey) return err('Nama parfum wajib diisi')
      const existing = await db.collection('waiting_list_requests').findOne({ perfume_key: perfumeKey })
      if (existing) {
        await db.collection('waiting_list_requests').updateOne(
          { id: existing.id },
          { $inc: { request_count: 1 }, $set: { updated_at: new Date() }, $push: { requesters: { name: body.requester_name, email: body.requester_email, at: new Date() } } }
        )
      } else {
        await db.collection('waiting_list_requests').insertOne({
          id: uuidv4(),
          requester_name: body.requester_name, requester_email: body.requester_email,
          perfume_name: body.perfume_name, perfume_key: perfumeKey,
          brand: body.brand || '', gender_preference: body.gender_preference || '',
          description: body.description || '',
          request_count: 1, status: 'open',
          requesters: [{ name: body.requester_name, email: body.requester_email, at: new Date() }],
          created_at: new Date(), updated_at: new Date(),
        })
      }
      return json({ ok: true })
    }

    if (route === '/waiting-list/top' && method === 'GET') {
      const items = await db.collection('waiting_list_requests').find({}).sort({ request_count: -1 }).limit(10).toArray()
      return json({ items: clean(items) })
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
        // Sales last 7 days
        const salesByDay = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i*24*60*60*1000)
          const key = d.toISOString().slice(0,10)
          salesByDay[key] = 0
        }
        paidOrders.filter(o => o.paid_at && new Date(o.paid_at) >= sevenDaysAgo).forEach(o => {
          const key = new Date(o.paid_at).toISOString().slice(0,10)
          if (salesByDay[key] !== undefined) salesByDay[key] += o.total_amount
        })
        const salesChart = Object.entries(salesByDay).map(([date, total]) => ({ date, total }))
        // Category distribution
        const products = await db.collection('products').find({}).toArray()
        const catDist = { wanita:0, pria:0, unisex:0 }
        for (const o of paidOrders) {
          for (const it of o.items) {
            const p = products.find(p => p.id === it.product_id)
            if (p && catDist[p.category] !== undefined) catDist[p.category] += it.quantity
          }
        }
        const latest = orders.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5)
        return json({
          revenueToday, revenueMonth,
          ordersToday: ordersToday.length, ordersMonth: ordersMonth.length,
          statusBreakdown, criticalStock: clean(criticalStock),
          salesChart, categoryDistribution: catDist,
          latestOrders: clean(latest),
          totalProducts: products.length, totalCustomers: await db.collection('users').countDocuments({ role: 'customer' }),
        })
      }

      if (route === '/admin/products' && method === 'GET') {
        const products = await db.collection('products').find({}).sort({ created_at: -1 }).toArray()
        return json({ products: clean(products) })
      }
      if (route === '/admin/products' && method === 'POST') {
        const b = await request.json()
        const slug = b.slug || b.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
        const p = {
          id: uuidv4(),
          name: b.name, slug, category: b.category, description: b.description || '',
          inspired_by: b.inspired_by || '', top_note: b.top_note || '', middle_note: b.middle_note || '', base_note: b.base_note || '',
          price: parseInt(b.price), size_ml: parseInt(b.size_ml) || 30, weight_gram: parseInt(b.weight_gram) || 150,
          stock: parseInt(b.stock) || 0, image_url: b.image_url || '',
          is_active: b.is_active !== false, is_featured: !!b.is_featured,
          created_at: new Date(), updated_at: new Date(),
        }
        await db.collection('products').insertOne(p)
        return json({ product: clean(p) })
      }
      if (route.startsWith('/admin/products/') && method === 'PUT') {
        const id = route.replace('/admin/products/', '')
        const b = await request.json()
        const update = { ...b, updated_at: new Date() }
        delete update._id; delete update.id
        if (update.price) update.price = parseInt(update.price)
        if (update.stock !== undefined) update.stock = parseInt(update.stock)
        await db.collection('products').updateOne({ id }, { $set: update })
        const p = await db.collection('products').findOne({ id })
        return json({ product: clean(p) })
      }
      if (route.startsWith('/admin/products/') && method === 'DELETE') {
        const id = route.replace('/admin/products/', '')
        await db.collection('products').deleteOne({ id })
        return json({ ok: true })
      }

      if (route === '/admin/orders' && method === 'GET') {
        const orders = await db.collection('orders').find({}).sort({ created_at: -1 }).toArray()
        return json({ orders: clean(orders) })
      }
      if (route.match(/^\/admin\/orders\/[^/]+\/status$/) && method === 'PATCH') {
        const id = route.split('/')[3]
        const { status, tracking_number } = await request.json()
        const update = { status, updated_at: new Date() }
        if (tracking_number) update.tracking_number = tracking_number
        await db.collection('orders').updateOne({ id }, { $set: update })
        return json({ ok: true })
      }

      if (route === '/admin/customers' && method === 'GET') {
        const users = await db.collection('users').find({ role: 'customer' }).toArray()
        const orders = await db.collection('orders').find({ status: 'paid' }).toArray()
        const result = users.map(u => {
          const userOrders = orders.filter(o => o.user_id === u.id)
          return {
            id: u.id, name: u.name, email: u.email, phone: u.phone,
            created_at: u.created_at,
            order_count: userOrders.length,
            total_spend: userOrders.reduce((s,o)=>s+o.total_amount,0),
          }
        })
        return json({ customers: result })
      }

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
          reason, notes: notes || '', created_by: admin.id, created_at: new Date(),
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

      if (route === '/admin/waiting-list' && method === 'GET') {
        const items = await db.collection('waiting_list_requests').find({}).sort({ request_count: -1 }).toArray()
        return json({ items: clean(items) })
      }
      if (route.match(/^\/admin\/waiting-list\/[^/]+$/) && method === 'PATCH') {
        const id = route.split('/')[3]
        const { status } = await request.json()
        await db.collection('waiting_list_requests').updateOne({ id }, { $set: { status, updated_at: new Date() } })
        return json({ ok: true })
      }

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
        const topProducts = Object.entries(productSales).map(([id, v]) => ({ product_id: id, ...v })).sort((a,b) => b.quantity - a.quantity).slice(0,10)
        return json({ totalRevenue, orderCount: orders.length, topProducts })
      }

      if (route === '/admin/settings' && method === 'GET') {
        const s = await db.collection('settings').findOne({ key: 'store' })
        return json({ settings: clean(s) })
      }
      if (route === '/admin/settings' && method === 'PUT') {
        const b = await request.json()
        await db.collection('settings').updateOne({ key: 'store' }, { $set: { ...b, updated_at: new Date() } }, { upsert: true })
        return json({ ok: true })
      }
    }

    // Public settings
    if (route === '/settings' && method === 'GET') {
      const s = await db.collection('settings').findOne({ key: 'store' })
      return json({ settings: clean(s) })
    }

    return err(`Route ${route} not found`, 404)
  } catch (e) {
    console.error('API Error:', e)
    return err('Internal server error: ' + e.message, 500)
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const DELETE = handle
export const PATCH = handle
