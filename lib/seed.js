import { getDb } from './mongo'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const SEED_VERSION = 'v2-caisy-catalog-2024'

const IMAGES = [
  'https://images.unsplash.com/photo-1774280347934-9c74dff6ab2e?crop=entropy&cs=srgb&fm=jpg&q=85',
  'https://images.unsplash.com/photo-1773527142304-58116364b8a1?crop=entropy&cs=srgb&fm=jpg&q=85',
  'https://images.pexels.com/photos/36389344/pexels-photo-36389344.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800',
  'https://images.pexels.com/photos/36389341/pexels-photo-36389341.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800',
  'https://images.unsplash.com/photo-1759793500112-c588839cfc6e?crop=entropy&cs=srgb&fm=jpg&q=85',
  'https://images.unsplash.com/photo-1704961212944-524f56df23fa?crop=entropy&cs=srgb&fm=jpg&q=85',
  'https://images.unsplash.com/photo-1774682060992-4ae4fb77e73f?crop=entropy&cs=srgb&fm=jpg&q=85',
  'https://images.unsplash.com/photo-1458538977777-0549b2370168?crop=entropy&cs=srgb&fm=jpg&q=85',
  'https://images.unsplash.com/photo-1635796496346-31c6bde431b8?crop=entropy&cs=srgb&fm=jpg&q=85',
  'https://images.unsplash.com/photo-1716978499366-d5a84bf1fe70?crop=entropy&cs=srgb&fm=jpg&q=85',
  'https://images.unsplash.com/photo-1626953313883-9d031d98307e?crop=entropy&cs=srgb&fm=jpg&q=85',
]

const PRODUCTS = [
  // MEN (7)
  { name: 'CH 212 Sexy Man', slug: 'ch-212-sexy-man', category: 'pria', inspired_by: 'Carolina Herrera 212 Sexy Men', top_note: 'Bergamot, Pink Pepper, Ginger', middle_note: 'Lavender, Leather, Vetiver', base_note: 'Cedarwood, Vanilla, Gaiac Wood', price: 115000, size_ml: 30, stock: 50, is_featured: true, description: 'Pria percaya diri dan karismatik dengan aura magnetis. Sensual, hangat, dan tak terlupakan.' },
  { name: 'Kasturi Kijang Putih', slug: 'kasturi-kijang-putih', category: 'pria', inspired_by: 'Kasturi Kijang Putih Original', top_note: 'White Musk, Floral', middle_note: 'Kasturi, Oud Wood', base_note: 'Amber, Sandalwood, Musk', price: 85000, size_ml: 30, stock: 50, description: 'Kasturi legendaris dengan aroma musk lembut yang clean dan tahan lama.' },
  { name: 'Dunhill Blue', slug: 'dunhill-blue', category: 'pria', inspired_by: 'Dunhill Desire Blue', top_note: 'Grapefruit, Pineapple, Bergamot', middle_note: 'Pink Pepper, Cinnamon, Rosemary', base_note: 'Sandalwood, Cedar, Musk, Amber', price: 120000, size_ml: 30, stock: 50, is_featured: true, description: 'Segarnya pagi dengan karakter pria dewasa. Fresh, woody, dan sophisticated.' },
  { name: 'Aigner Blue', slug: 'aigner-blue', category: 'pria', inspired_by: 'Aigner Blue Emotion', top_note: 'Bergamot, Lavender', middle_note: 'Basil, Clove, Geranium', base_note: 'Patchouli, Cedarwood, Musk', price: 110000, size_ml: 30, stock: 50, description: 'Aroma biru laut yang menenangkan. Cocok untuk aktivitas siang hari.' },
  { name: 'HMNS Alpha', slug: 'hmns-alpha', category: 'pria', inspired_by: 'HMNS Alpha', top_note: 'Cedarwood, Bergamot', middle_note: 'Pepper, Saffron', base_note: 'Musk, Amber, Labdanum', price: 125000, size_ml: 30, stock: 50, is_featured: true, description: 'Parfum lokal HMNS bercita rasa woody-aromatic. Bold dan modern.' },
  { name: 'Choco Musk', slug: 'choco-musk', category: 'pria', inspired_by: 'Al Rehab Choco Musk', top_note: 'Chocolate, Coffee', middle_note: 'Vanilla, Caramel', base_note: 'White Musk, Amber', price: 75000, size_ml: 30, stock: 50, description: 'Sensasi cokelat manis yang hangat dan adiktif. Comfort scent yang cocok sehari-hari.' },
  { name: 'HMNS Orgasm', slug: 'hmns-orgasm', category: 'pria', inspired_by: 'HMNS Orgasm', top_note: 'Vanilla, Sweet Spice', middle_note: 'Floral, Jasmine', base_note: 'Musk, Amber, Sandalwood', price: 135000, size_ml: 30, stock: 50, description: 'Aroma sensual yang memikat. Seduktif dan sophisticated.' },
  // UNISEX (2)
  { name: 'Baccarat Rouge', slug: 'baccarat-rouge', category: 'unisex', inspired_by: 'Maison Francis Kurkdjian Baccarat Rouge 540', top_note: 'Saffron, Jasmine', middle_note: 'Amberwood, Ambergris', base_note: 'Cedar, Fir Resin', price: 185000, size_ml: 30, stock: 50, is_featured: true, description: 'Aroma ikonik yang luxurious. Saffron mewah berpadu kayu resin dalam harmoni yang sempurna.' },
  { name: 'Vanilla Cake', slug: 'vanilla-cake', category: 'unisex', inspired_by: 'Kayali Vanilla | 28', top_note: 'Vanilla, Cream', middle_note: 'Caramel, Coffee', base_note: 'Musk, Tonka Bean, Amber', price: 130000, size_ml: 30, stock: 50, is_featured: true, description: 'Gourmand vanila kue manis yang cozy. Sweet but not overpowering.' },
  // WOMEN (7)
  { name: 'Scandalous', slug: 'scandalous', category: 'wanita', inspired_by: 'Jean Paul Gaultier Scandal', top_note: 'Honey, Orange Blossom', middle_note: 'Gardenia, Caramel', base_note: 'Patchouli, Beeswax', price: 125000, size_ml: 30, stock: 50, is_featured: true, description: 'Seduktif dengan sentuhan madu dan gardenia. Aroma wanita yang percaya diri.' },
  { name: 'Black Opium', slug: 'black-opium', category: 'wanita', inspired_by: 'YSL Black Opium', top_note: 'Coffee, Pink Pepper', middle_note: 'Orange Blossom, Jasmine', base_note: 'Vanilla, Cedarwood, Patchouli', price: 140000, size_ml: 30, stock: 50, is_featured: true, description: 'Energi malam dengan kopi dan vanilla. Feminin yang bold dan adiktif.' },
  { name: 'Bombshell', slug: 'bombshell', category: 'wanita', inspired_by: "Victoria's Secret Bombshell", top_note: 'Purple Passion Fruit, Grapefruit, Pineapple', middle_note: 'Peony, Vanilla Orchid, Freesia', base_note: 'Musk, Oakmoss, Sandalwood', price: 115000, size_ml: 30, stock: 50, description: 'Fruity floral yang fresh dan fun. Aroma wanita muda yang ceria.' },
  { name: 'Taylor Swift Wonderstruck', slug: 'taylor-swift', category: 'wanita', inspired_by: 'Taylor Swift Wonderstruck', top_note: 'Raspberry, Apple, Freesia', middle_note: 'Honeysuckle, Peach', base_note: 'Sandalwood, Musk, Amber', price: 100000, size_ml: 30, stock: 50, description: 'Aroma manis-buah yang playful. Young, fresh, dan feminin.' },
  { name: 'D&G Imperatrice', slug: 'dg-imperatrice', category: 'wanita', inspired_by: "Dolce & Gabbana 3 L'Imperatrice", top_note: 'Watermelon, Kiwi, Grapefruit', middle_note: 'Pineapple, Frangipani, Redcurrant', base_note: 'Musk, Patchouli, Ambery', price: 120000, size_ml: 30, stock: 50, description: 'Segarnya buah tropis dan floral. Wanita ceria dan energik.' },
  { name: 'Zahrat Hawai', slug: 'zahrat-hawai', category: 'wanita', inspired_by: 'Al Haramain Zahrat Hawai', top_note: 'Rose, Floral', middle_note: 'Jasmine, Vanilla', base_note: 'Oud, Musk, Amber', price: 95000, size_ml: 30, stock: 50, description: 'Aroma Arab modern yang eksotis. Oriental floral yang mewah.' },
  { name: 'Romance Wish', slug: 'romance-wish', category: 'wanita', inspired_by: 'Ralph Lauren Romance', top_note: 'Rose, Peach, Ginger', middle_note: 'Lotus, Freesia, Jasmine', base_note: 'Musk, Patchouli, Cashmere Wood', price: 110000, size_ml: 30, stock: 50, description: 'Romansa dalam sebotol. Lembut, feminin, dan timeless.' },
]

export async function seedDatabase() {
  const db = await getDb()
  // Version check for products
  const versionDoc = await db.collection('settings').findOne({ key: 'seed_version' })
  if (!versionDoc || versionDoc.value !== SEED_VERSION) {
    // Reseed products
    await db.collection('products').deleteMany({})
    const now = new Date()
    const docs = PRODUCTS.map((p, i) => ({
      id: uuidv4(),
      ...p,
      weight_gram: 150,
      image_url: IMAGES[i % IMAGES.length],
      is_active: true,
      is_featured: p.is_featured || false,
      created_at: now,
      updated_at: now,
    }))
    await db.collection('products').insertMany(docs)
    await db.collection('settings').updateOne(
      { key: 'seed_version' },
      { $set: { key: 'seed_version', value: SEED_VERSION, updated_at: now } },
      { upsert: true }
    )
  }

  // Admin user
  const adminExists = await db.collection('users').findOne({ email: 'admin@caisyperfume.com' })
  if (!adminExists) {
    const hash = await bcrypt.hash('Admin@Caisy2024!', 10)
    await db.collection('users').insertOne({
      id: uuidv4(),
      name: 'Admin Caisy',
      email: 'admin@caisyperfume.com',
      password: hash,
      phone: '',
      role: 'admin',
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
  }

  // Default store settings
  const storeSettings = await db.collection('settings').findOne({ key: 'store' })
  if (!storeSettings) {
    await db.collection('settings').insertOne({
      key: 'store',
      store_name: 'Caisy Perfume',
      description: 'Wangian Mewah, Harga Terjangkau',
      whatsapp_cs: '6281234567890',
      email_cs: 'cs@caisyperfume.com',
      maintenance_mode: false,
    })
  }
  return true
}
