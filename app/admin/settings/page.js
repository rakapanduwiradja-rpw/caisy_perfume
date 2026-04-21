'use client'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, Upload, RefreshCw, Eye, EyeOff } from 'lucide-react'

const DEFAULT_SETTINGS = {
  // Brand
  brand_name: 'Caisy',
  brand_tagline: 'Perfume',
  brand_description: 'Wangian Mewah, Harga Terjangkau. Koleksi parfum dupe premium terinspirasi brand dunia.',
  
  // Logo & Favicon
  logo_primary: '/Primary.png',
  logo_secondary: '/Secondary.png',
  favicon: '/Brandmark.png',
  use_image_logo: false,

  // Contact
  whatsapp: '6281234567890',
  email_cs: 'cs@caisyperfume.com',
  phone: '+62 812-3456-7890',
  address: 'Indonesia',

  // Social Media
  instagram: 'https://instagram.com/caisyperfume',
  tiktok: 'https://tiktok.com/@caisyperfume',
  facebook: 'https://facebook.com/caisyperfume',

  // Colors
  color_primary: '#7B1E2C',
  color_secondary: '#C9A96E',
  color_accent: '#FAF7F2',
  color_text: '#1A1A2E',
  color_background: '#FFFFFF',
  color_card: '#FFFFFF',
  color_border: '#E5E7EB',
  color_success: '#16A34A',
  color_warning: '#D97706',
  color_danger: '#DC2626',

  // SEO
  meta_title: 'Caisy Perfume — Wangian Mewah, Harga Terjangkau',
  meta_description: 'Koleksi parfum dupe berkualitas tinggi terinspirasi dari brand internasional.',
  meta_keywords: 'parfum, perfume, dupe perfume, caisy perfume',

  // Store
  maintenance_mode: false,
  free_shipping_min: 300000,
  currency: 'IDR',
}

const COLOR_PRESETS = [
  { name: 'Burgundy Gold (Default)', primary: '#7B1E2C', secondary: '#C9A96E', accent: '#FAF7F2', text: '#1A1A2E' },
  { name: 'Midnight Rose', primary: '#4A0E2A', secondary: '#E8C5A0', accent: '#FDF8F5', text: '#1A1A2E' },
  { name: 'Forest Luxury', primary: '#1B4332', secondary: '#B7966A', accent: '#F5F5F0', text: '#1A1A2E' },
  { name: 'Royal Navy', primary: '#1E3A5F', secondary: '#C9A96E', accent: '#F8FAFC', text: '#0F172A' },
  { name: 'Deep Purple', primary: '#3B1F5E', secondary: '#D4A96A', accent: '#FAF8FF', text: '#1A1A2E' },
  { name: 'Charcoal Modern', primary: '#1F2937', secondary: '#9CA3AF', accent: '#F9FAFB', text: '#111827' },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('brand')
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    fetch('/api/[[...path]]?path=admin/settings')
      .then(r => r.json())
      .then(d => { if (d.settings) setSettings({ ...DEFAULT_SETTINGS, ...d.settings }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async (section) => {
    setSaving(true)
    try {
      const r = await fetch('/api/[[...path]]', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: ['admin', 'settings'], settings })
      })
      const d = await r.json()
      if (d.ok) toast.success('Pengaturan berhasil disimpan!')
      else toast.error(d.error || 'Gagal menyimpan')
    } catch(e) { toast.error('Terjadi kesalahan') }
    setSaving(false)
  }

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }))

  const applyPreset = (preset) => {
    setSettings(prev => ({
      ...prev,
      color_primary: preset.primary,
      color_secondary: preset.secondary,
      color_accent: preset.accent,
      color_text: preset.text,
    }))
    toast.success('Preset warna diterapkan! Klik Simpan untuk menyimpan.')
  }

  const tabs = [
    { id: 'brand', label: '🏷️ Brand & Logo' },
    { id: 'contact', label: '📞 Kontak' },
    { id: 'colors', label: '🎨 Warna & Tema' },
    { id: 'seo', label: '🔍 SEO' },
    { id: 'store', label: '🏪 Toko' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-caisy-burgundy" />
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-caisy-burgundy">Pengaturan Website</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola tampilan, kontak, dan konfigurasi toko</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Semua
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition ${
              activeTab === t.id
                ? 'bg-white text-caisy-burgundy shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">

        {/* TAB: Brand & Logo */}
        {activeTab === 'brand' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Identitas Brand</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nama Brand</label>
                <input
                  value={settings.brand_name}
                  onChange={e => set('brand_name', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tagline (di bawah nama)</label>
                <input
                  value={settings.brand_tagline}
                  onChange={e => set('brand_tagline', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Deskripsi Brand (di Footer)</label>
              <textarea
                value={settings.brand_description}
                onChange={e => set('brand_description', e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Logo & Favicon</h3>
              
              <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="use_image_logo"
                  checked={settings.use_image_logo}
                  onChange={e => set('use_image_logo', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="use_image_logo" className="text-sm">
                  Gunakan gambar logo (aktifkan jika sudah upload logo ke folder /public)
                </label>
              </div>

              {settings.use_image_logo && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Logo Header (Light bg)</label>
                    <input
                      value={settings.logo_primary}
                      onChange={e => set('logo_primary', e.target.value)}
                      placeholder="/Primary.png"
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Untuk background terang</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Logo Footer (Dark bg)</label>
                    <input
                      value={settings.logo_secondary}
                      onChange={e => set('logo_secondary', e.target.value)}
                      placeholder="/Secondary.png"
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Untuk background gelap</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Favicon</label>
                    <input
                      value={settings.favicon}
                      onChange={e => set('favicon', e.target.value)}
                      placeholder="/Brandmark.png"
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Icon di tab browser</p>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <p className="font-medium text-amber-800">📁 File yang sudah diupload ke /public:</p>
                <div className="flex gap-4 mt-2">
                  {[settings.logo_primary, settings.logo_secondary, settings.favicon].map(src => (
                    <div key={src} className="text-center">
                      <img src={src} alt="" className="h-12 w-12 object-contain border rounded mx-auto" onError={e => e.target.style.display='none'} />
                      <p className="text-xs text-amber-700 mt-1">{src}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Kontak */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Informasi Kontak & Media Sosial</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nomor WhatsApp CS</label>
                <div className="flex mt-1">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-200 rounded-l-md text-sm text-gray-500">62</span>
                  <input
                    value={settings.whatsapp.replace(/^62/, '')}
                    onChange={e => set('whatsapp', '62' + e.target.value.replace(/^62/, ''))}
                    placeholder="81234567890"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-r-md"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Tanpa +62, contoh: 81234567890</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email CS</label>
                <input
                  type="email"
                  value={settings.email_cs}
                  onChange={e => set('email_cs', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nomor Telepon (tampil di footer)</label>
                <input
                  value={settings.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+62 812-3456-7890"
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Alamat</label>
                <input
                  value={settings.address}
                  onChange={e => set('address', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Media Sosial</h3>
              <div className="space-y-3">
                {[
                  { key: 'instagram', label: '📷 Instagram', placeholder: 'https://instagram.com/...' },
                  { key: 'tiktok', label: '🎵 TikTok', placeholder: 'https://tiktok.com/@...' },
                  { key: 'facebook', label: '👍 Facebook', placeholder: 'https://facebook.com/...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-28 text-sm font-medium shrink-0">{label}</span>
                    <input
                      value={settings[key]}
                      onChange={e => set(key, e.target.value)}
                      placeholder={placeholder}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Warna & Tema */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Warna & Tema</h2>
              <button
                onClick={() => setPreview(!preview)}
                className="flex items-center gap-2 text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50"
              >
                {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {preview ? 'Sembunyikan' : 'Preview'}
              </button>
            </div>

            {/* Color Presets */}
            <div>
              <h3 className="text-sm font-semibold mb-3">🎨 Preset Warna Siap Pakai</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="p-3 border rounded-lg hover:border-caisy-burgundy text-left transition"
                  >
                    <div className="flex gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-full border" style={{ background: preset.primary }} />
                      <div className="w-5 h-5 rounded-full border" style={{ background: preset.secondary }} />
                      <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: preset.accent }} />
                    </div>
                    <p className="text-xs font-medium">{preset.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">🖌️ Warna Custom</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: 'color_primary', label: 'Warna Utama (Primary)', desc: 'Header, tombol, aksen utama' },
                  { key: 'color_secondary', label: 'Warna Sekunder (Gold)', desc: 'Aksen, highlight' },
                  { key: 'color_accent', label: 'Warna Background', desc: 'Background halaman utama' },
                  { key: 'color_text', label: 'Warna Teks', desc: 'Teks utama di seluruh halaman' },
                  { key: 'color_card', label: 'Warna Card', desc: 'Background card produk' },
                  { key: 'color_border', label: 'Warna Border', desc: 'Garis pembatas' },
                  { key: 'color_success', label: 'Warna Sukses', desc: 'Notifikasi berhasil, stok aman' },
                  { key: 'color_danger', label: 'Warna Bahaya', desc: 'Error, stok habis' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="relative">
                      <input
                        type="color"
                        value={settings[key]}
                        onChange={e => set(key, e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                      <input
                        type="text"
                        value={settings[key]}
                        onChange={e => set(key, e.target.value)}
                        className="mt-1 w-full text-xs px-2 py-1 border border-gray-200 rounded font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">👁️ Preview Warna</h3>
                <div className="rounded-xl overflow-hidden border" style={{ background: settings.color_accent }}>
                  <div className="p-4" style={{ background: settings.color_primary }}>
                    <p className="text-white font-bold text-lg">{settings.brand_name}</p>
                    <p className="text-xs opacity-70" style={{ color: settings.color_secondary }}>
                      {settings.brand_tagline}
                    </p>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="rounded-lg p-3" style={{ background: settings.color_card, border: `1px solid ${settings.color_border}` }}>
                        <div className="h-16 rounded mb-2" style={{ background: settings.color_accent }} />
                        <p className="text-xs font-medium" style={{ color: settings.color_text }}>Nama Produk</p>
                        <p className="text-xs" style={{ color: settings.color_primary }}>Rp 115.000</p>
                        <button className="mt-2 w-full text-xs py-1 rounded text-white" style={{ background: settings.color_primary }}>
                          Tambah
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center" style={{ background: settings.color_secondary + '20' }}>
                    <p className="text-xs" style={{ color: settings.color_text }}>{settings.brand_description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: SEO */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">SEO & Meta Tags</h2>
            <div>
              <label className="text-sm font-medium">Meta Title (Judul di Tab Browser)</label>
              <input
                value={settings.meta_title}
                onChange={e => set('meta_title', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md"
              />
              <p className="text-xs text-gray-400 mt-1">{settings.meta_title.length}/60 karakter (ideal: maks 60)</p>
            </div>
            <div>
              <label className="text-sm font-medium">Meta Description</label>
              <textarea
                value={settings.meta_description}
                onChange={e => set('meta_description', e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md"
              />
              <p className="text-xs text-gray-400 mt-1">{settings.meta_description.length}/160 karakter (ideal: maks 160)</p>
            </div>
            <div>
              <label className="text-sm font-medium">Keywords (pisahkan dengan koma)</label>
              <input
                value={settings.meta_keywords}
                onChange={e => set('meta_keywords', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md"
              />
            </div>
          </div>
        )}

        {/* TAB: Store */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Pengaturan Toko</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Minimum Belanja Gratis Ongkir (Rp)</label>
                <input
                  type="number"
                  value={settings.free_shipping_min}
                  onChange={e => set('free_shipping_min', Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mata Uang</label>
                <select
                  value={settings.currency}
                  onChange={e => set('currency', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md"
                >
                  <option value="IDR">IDR — Rupiah</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-semibold text-red-800">Mode Maintenance</p>
                  <p className="text-sm text-red-600">Aktifkan untuk menutup website sementara dari pengunjung</p>
                </div>
                <button
                  onClick={() => set('maintenance_mode', !settings.maintenance_mode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              {settings.maintenance_mode && (
                <p className="text-sm text-red-600 mt-2">⚠️ Website sedang dalam mode maintenance. Pengunjung tidak bisa mengakses toko.</p>
              )}
            </div>
          </div>
        )}

        {/* Save Button Bottom */}
        <div className="mt-8 pt-4 border-t flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  )
}
