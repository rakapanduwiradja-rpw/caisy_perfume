import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount) {
  if (amount === null || amount === undefined) return 'Rp 0'
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount)
}

export function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function stockStatus(stock) {
  if (stock <= 0) return { label: 'Habis', color: 'bg-gray-400 text-white' }
  if (stock <= 5) return { label: 'Kritis', color: 'bg-red-500 text-white' }
  if (stock <= 20) return { label: 'Menipis', color: 'bg-yellow-500 text-white' }
  return { label: 'Aman', color: 'bg-green-500 text-white' }
}
