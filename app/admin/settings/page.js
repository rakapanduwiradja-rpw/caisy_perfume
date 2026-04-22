'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, Eye, EyeOff } from 'lucide-react'

const DEFAULT_SETTINGS = {
  // Brand
  store_name: 'Caisy Perfume',
  brand_name: 'Caisy',
  brand_tagline: 'Perfume',
  description: 'Wangian Mewah, Harga Terjangkau. Koleksi parfum dupe premium terinspirasi brand dunia.',

  // Logo & Favicon
  logo_primary: '/Primary.png',
  logo_secondary: '/Secondary.png',
  favicon: '/Brandmark.png',
  use_image_logo: false,

  // Contact
  whatsapp_cs: '6281234567890',
  email_cs: 'cs@caisyperfume.com',
  phone: '+62 812-3456-7890',
  address: 'Indonesia',

  // Social Media
  instagram: '',
  tiktok: '',
  facebook: '',

  // Colors
  color_primary: '#7B1E2C',
  color_secondary: '#C9A96E',
  color_accent: '#FAF7F2',
  color_text: '#1A1A2E',
  color_card: '#FFFFFF',
  color_border: '#E5E7EB',
  color_success: '#16A34A',
  color_danger: '#DC2626',

  // SEO
  meta_title: 'Caisy Perfume — Wangian Mewah, Harga Terjangkau',
  meta_description: 'Koleksi parfum dupe berkualitas tinggi terinspirasi dari brand internasional.',
  meta_keywords: 'parfum, perfume, dupe perfume, caisy perfume',

  // Store
  maintenance_mode: false,
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
    // Gunakan URL API yang benar sesuai route.js
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings) {
          setSettings(prev => ({ ...prev, ...d.settings }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      // Gunakan PUT sesuai route.js: PUT /admin/settings
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('Pengaturan berhasil disimpan! Refresh halaman untuk melihat perubahan.')
      } else {
        toast.error(d.error || 'Gagal menyimpan')
      }
    } catch (e) {
      toast.error('Terjadi kesalahan: ' + e.message)
    }
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
    toast.info('Preset diterapkan! Klik Simpan untuk menyimpan.')
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
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Menyimpan...' : 'Simpan Semua'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition ${
              activeTab === t.id ? 'bg-white text-caisy-burgundy shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
            <h2 className="text-lg font-semibold">Identitas Brand & Logo</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nama Brand</label>
                <input value={settings.brand_name} onChange={e => set('brand_name', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md" />
              </div>
              <div>
                <label className="text-sm font-medium">Tagline (di bawah nama)</label>
                <input value={settings.brand_tagline} onChange={e => set('brand_tagline', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md" />
              </div>
              <div>
                <label className="text-sm font-medium">Nama Toko (untuk sistem)</label>
                <input value={settings.store_name} onChange={e => set('store_name', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Deskripsi Brand (di Footer)</label>
              <textarea value={settings.description} onChange={e => set('description', e.target.value)}
                rows={3} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md" />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Logo & Favicon</h3>

              <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                <input type="checkbox" id="use_image_logo" checked={settings.use_image_logo}
                  onChange={e => set('use_image_logo', e.target.checked)} className="w-4 h-4" />
                <label htmlFor="use_image_logo" className="text-sm cursor-pointer">
                  Gunakan gambar logo (aktifkan jika file sudah ada di folder /public)
                </label>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Logo Header (background terang)</label>
                  <input value={settings.logo_primary} onChange={e => set('logo_primary', e.target.value)}
                    placeholder="/Primary.png" className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Logo Footer (background gelap)</label>
                  <input value={settings.logo_secondary} onChange={e => set('logo_secondary', e.target.value)}
                    placeholder="/Secondary.png" className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Favicon (icon tab browser)</label>
                  <input value={settings.favicon} onChange={e => set('favicon', e.target.value)}
                    placeholder="/Brandmark.png" className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
                </div>
              </div>

              {/* Preview logo files */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800 mb-2">Preview file logo:</p>
                <div className="flex gap-6">
                  {[
                    { src: settings.logo_primary, label: 'Header' },
                    { src: settings.logo_secondary, label: 'Footer' },
                    { src: settings.favicon, label: 'Favicon' },
                  ].map(({ src, label }) => (
                    <div key={label} className="text-center">
                      <div className="w-16 h-16 border rounded-lg bg-white flex items-center justify-center overflow-hidden mx-auto">
                        <img src={src} alt={label} className="max-w-full max-h-full object-contain"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
                        <span style={{ display: 'none' }} className="text-xs text-gray-400">Tidak ditemukan</span>
                      </div>
                      <p className="text-xs text-amber-700 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  ⓘ Upload file ke folder <code className="bg-amber-100 px-1 rounded">public/</code> di GitHub terlebih dahulu
                </p>
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
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-200 rounded-l-md text-sm text-gray-500">+62</span>
                  <input
                    value={settings.whatsapp_cs?.replace(/^62/, '') || ''}
                    onChange={e => set('whatsapp_cs', '62' + e.target.value.replace(/^0/, '').replace(/^62/, ''))}
                    placeholder="81234567890"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-r-md"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Format: tanpa 0 di depan. Contoh: 81234567890</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email CS</label>
                <input type="email" value={settings.email_cs} onChange={e => set('email_cs', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md" />
              </div>
              <div>
                <label className="text-sm font-medium">Nomor Telepon (tampil di footer)</label>
                <input value={settings.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+62 812-3456-7890" className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md" />
              </div>
              <div>
                <label className="text-sm font-medium">Alamat</label>
                <input value={settings.address} onChange={e => set('address', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md" />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Media Sosial</h3>
              <div className="space-y-3">
                {[
                  { key: 'instagram', label: '📷 Instagram', placeholder: 'https://instagram.com/caisyperfume' },
                  { key: 'tiktok', label: '🎵 TikTok', placeholder: 'https://tiktok.com/@caisyperfume' },
                  { key: 'facebook', label: '👍 Facebook', placeholder: 'https://facebook.com/caisyperfume' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-28 text-sm font-medium shrink-0">{label}</span>
                    <input value={settings[key] || ''} onChange={e => set(key, e.target.value)}
                      placeholder={placeholder} className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm" />
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
              <button onClick={() => setPreview(!preview)}
                className="flex items-center gap-2 text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50">
                {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {preview ? 'Sembunyikan Preview' : 'Lihat Preview'}
              </button>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">🎨 Preset Warna Siap Pakai</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COLOR_PRESETS.map(preset => (
                  <button key={preset.name} onClick={() => applyPreset(preset)}
                    className="p-3 border rounded-lg hover:border-caisy-burgundy text-left transition hover:shadow-sm">
                    <div className="flex gap-1.5 mb-2">
                      <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ background: preset.primary }} />
                      <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ background: preset.secondary }} />
                      <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ background: preset.accent }} />
                    </div>
                    <p className="text-xs font-medium">{preset.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">🖌️ Warna Custom</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { key: 'color_primary', label: 'Warna Utama', desc: 'Header, tombol utama, aksen' },
                  { key: 'color_secondary', label: 'Warna Sekunder (Gold)', desc: 'Aksen, highlight, border' },
                  { key: 'color_accent', label: 'Warna Background', desc: 'Latar halaman utama' },
                  { key: 'color_text', label: 'Warna Teks', desc: 'Teks utama di semua halaman' },
                  { key: 'color_card', label: 'Warna Card', desc: 'Background card produk' },
                  { key: 'color_border', label: 'Warna Border', desc: 'Garis pembatas, outline' },
                  { key: 'color_success', label: 'Warna Sukses', desc: 'Notifikasi berhasil, stok aman' },
                  { key: 'color_danger', label: 'Warna Bahaya', desc: 'Error, stok habis, peringatan' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center gap-3 p-3 border rounded-lg">
                    <input type="color" value={settings[key] || '#000000'} onChange={e => set(key, e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                      <input type="text" value={settings[key] || ''} onChange={e => set(key, e.target.value)}
                        className="mt-1 w-full text-xs px-2 py-1 border border-gray-200 rounded font-mono" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">👁️ Preview Tampilan</h3>
                <div className="rounded-xl overflow-hidden border" style={{ background: settings.color_accent }}>
                  <div className="p-4 flex items-center justify-between" style={{ background: settings.color_primary }}>
                    <div>
                      <span className="text-white font-bold text-lg">{settings.brand_name}</span>
                      <span className="text-xs ml-2 opacity-70" style={{ color: settings.color_secondary }}>{settings.brand_tagline}</span>
                    </div>
                    <div className="flex gap-3 text-white text-sm opacity-80">
                      <span>Home</span><span>Katalog</span><span>AI Search</span>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="rounded-lg overflow-hidden" style={{ background: settings.color_card, border: `1px solid ${settings.color_border}` }}>
                        <div className="h-20" style={{ background: settings.color_accent + 'cc' }} />
                        <div className="p-2">
                          <p className="text-xs font-semibold" style={{ color: settings.color_text }}>Nama Produk {i}</p>
                          <p className="text-xs font-bold mt-0.5" style={{ color: settings.color_primary }}>Rp 115.000</p>
                          <button className="mt-1.5 w-full text-xs py-1 rounded text-white font-medium" style={{ background: settings.color_primary }}>
                            + Keranjang
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3" style={{ background: settings.color_primary + 'dd' }}>
                    <p className="text-xs text-white text-center opacity-80">{settings.description}</p>
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
              <input value={settings.meta_title} onChange={e => set('meta_title', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md" />
              <p className="text-xs text-gray-400 mt-1">{(settings.meta_title || '').length}/60 karakter (ideal: maks 60)</p>
            </div>
            <div>
              <label className="text-sm font-medium">Meta Description</label>
              <textarea value={settings.meta_description} onChange={e => set('meta_description', e.target.value)}
                rows={3} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md" />
              <p className="text-xs text-gray-400 mt-1">{(settings.meta_description || '').length}/160 karakter (ideal: maks 160)</p>
            </div>
            <div>
              <label className="text-sm font-medium">Keywords (pisahkan dengan koma)</label>
              <input value={settings.meta_keywords} onChange={e => set('meta_keywords', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md" />
            </div>
          </div>
        )}

        {/* TAB: Store */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Pengaturan Toko</h2>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              ⓘ Perubahan pengaturan toko memerlukan refresh halaman setelah disimpan.
            </div>

            <div className="border-t pt-4">
              <div className={`flex items-center justify-between p-4 rounded-lg border ${settings.maintenance_mode ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <p className="font-semibold text-gray-800">Mode Maintenance</p>
                  <p className="text-sm text-gray-500 mt-0.5">Aktifkan untuk menutup website sementara dari pengunjung</p>
                  {settings.maintenance_mode && (
                    <p className="text-sm text-red-600 font-medium mt-1">⚠️ Website sedang OFFLINE untuk pengunjung</p>
                  )}
                </div>
                <button
                  onClick={() => set('maintenance_mode', !settings.maintenance_mode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button Bottom */}
        <div className="mt-8 pt-4 border-t flex justify-between items-center">
          <p className="text-xs text-gray-400">Perubahan tersimpan ke database dan aktif setelah halaman di-refresh</p>
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  )
}
