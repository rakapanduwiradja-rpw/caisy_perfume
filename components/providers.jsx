'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

const CartContext = createContext(null)
const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { setUser(d.user); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Login gagal')
    setUser(d.user)
    return d.user
  }
  const register = async (data) => {
    const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Register gagal')
    setUser(d.user)
    return d.user
  }
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }
  const updateProfile = async (data) => {
    const r = await fetch('/api/auth/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Update gagal')
    setUser(d.user)
    return d.user
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [hydrated, setHydrated] = useState(false)
  const { user } = useAuth()

  // Load cart on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('caisy_cart')
      if (saved) setItems(JSON.parse(saved))
    } catch (e) {}
    setHydrated(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('caisy_cart', JSON.stringify(items))
  }, [items, hydrated])

  // Sync with backend if user logged in
  useEffect(() => {
    if (!hydrated || !user) return
    // Load server cart and merge
    fetch('/api/cart').then(r => r.json()).then(d => {
      const local = items
      const server = d.items || []
      const merged = [...server]
      local.forEach(li => {
        const ex = merged.find(si => si.product_id === li.product_id)
        if (ex) ex.quantity = Math.max(ex.quantity, li.quantity)
        else merged.push(li)
      })
      setItems(merged)
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hydrated])

  useEffect(() => {
    if (!hydrated || !user) return
    fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) }).catch(()=>{})
  }, [items, user, hydrated])

  const add = useCallback((product, qty = 1) => {
    setItems(prev => {
      const ex = prev.find(i => i.product_id === product.id)
      if (ex) return prev.map(i => i.product_id === product.id ? { ...i, quantity: Math.min(i.quantity + qty, product.stock) } : i)
      return [...prev, { product_id: product.id, name: product.name, price: product.price, image_url: product.image_url, quantity: qty, stock: product.stock, slug: product.slug, weight_gram: product.weight_gram || 150 }]
    })
  }, [])
  const update = useCallback((product_id, quantity) => {
    setItems(prev => prev.map(i => i.product_id === product_id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || 99)) } : i))
  }, [])
  const remove = useCallback((product_id) => {
    setItems(prev => prev.filter(i => i.product_id !== product_id))
  }, [])
  const clear = useCallback(() => setItems([]), [])

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalWeight = items.reduce((s, i) => s + (i.weight_gram || 150) * i.quantity, 0)
  const count = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, add, update, remove, clear, subtotal, totalWeight, count, hydrated }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)

export function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  )
}
