import { getDb } from './mongo'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

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
  { name: 'Rose Elégante', slug: 'rose-elegante', category: 'wanita', inspired_by: 'Chanel Chance Eau Tendre', top_note: 'Bergamot, Lemon, Pink Pepper', middle_note: 'Rose, Jasmine, Iris', base_note: 'White Musk, Cedarwood, Amber', price: 95000, size_ml: 30, stock: 50, is_featured: true, description: 'Keanggunan abadi dalam sebotol parfum. Aroma floral yang lembut dan segar, cocok untuk wanita modern yang mendambakan kesan feminin dan romantis.' },
  { name: 'Velvet Bloom', slug: 'velvet-bloom', category: 'wanita', inspired_by: 'Viktor & Rolf Flowerbomb', top_note: 'Bergamot, Tea', middle_note: 'Rose, Jasmine, Orchid, Freesia', base_note: 'Musk, Patchouli, Oakmoss, Vanilla', price: 110000, size_ml: 30, stock: 50, is_featured: true, description: 'Ledakan bunga yang memikat dengan sentuhan vanilla yang manis. Parfum yang membuat Anda tak terlupakan.' },
  { name: 'Soir de Paris', slug: 'soir-de-paris', category: 'wanita', inspired_by: 'YSL Mon Paris', top_note: 'Pear, Strawberry, Raspberry', middle_note: 'White Peony, Rose, Jasmine', base_note: 'White Musk, Patchouli, Ambroxan', price: 105000, size_ml: 30, stock: 50, is_featured: true, description: 'Romansa malam Paris dalam sebotol. Kombinasi buah manis dan bunga putih yang bercahaya.' },
  { name: 'Cerise Noir', slug: 'cerise-noir', category: 'wanita', inspired_by: 'Dior Miss Dior', top_note: 'Calabrian Bergamot, Mandarin', middle_note: 'Rose Centifolia, Peony, Rosewood', base_note: 'Sandalwood, Patchouli, White Musk', price: 115000, size_ml: 30, stock: 50, is_featured: true, description: 'Klasik mewah dengan sentuhan modern. Rose Centifolia yang halus berpadu kayu hangat.' },
  { name: 'Lumière Dorée', slug: 'lumiere-doree', category: 'wanita', inspired_by: 'Lancôme La Vie Est Belle', top_note: 'Blackcurrant, Pear', middle_note: 'Iris, Jasmine, Orange Blossom', base_note: 'Vanilla, Tonka Bean, Praline, Patchouli', price: 120000, size_ml: 30, stock: 50, is_featured: true, description: 'Kebahagiaan dalam bentuk aroma. Manis, hangat, dan penuh rasa percaya diri.' },
  { name: 'Jasmine Mystique', slug: 'jasmine-mystique', category: 'wanita', inspired_by: 'Jo Malone Jasmine Sambac & Marigold', top_note: 'Marigold, Grapefruit', middle_note: 'Jasmine Sambac, Tuberose', base_note: 'Blonde Wood, Musk', price: 130000, size_ml: 30, stock: 50, description: 'Sensualitas jasmine sambac yang eksotis, dipadukan marigold hangat.' },
  { name: 'Petite Fleur', slug: 'petite-fleur', category: 'wanita', inspired_by: 'Gucci Bloom', top_note: 'Tuberose, Jasmine', middle_note: 'Rangoon Creeper, Coral Jasmine', base_note: 'Musk, Orris Root, Sandalwood', price: 100000, size_ml: 30, stock: 50, description: 'Taman bunga yang mekar sempurna. Lembut, feminin, dan memikat.' },
  { name: 'Amber Goddess', slug: 'amber-goddess', category: 'wanita', inspired_by: 'Thierry Mugler Alien', top_note: 'White Flowers, Cashmeran', middle_note: 'Jasmine Sambac, Lotus', base_note: 'Cashmeran, White Amber, Woody Notes', price: 125000, size_ml: 30, stock: 50, description: 'Aroma misterius dari dewi amber. Kuat, magis, dan tak tertandingi.' },
  { name: 'Satin Nude', slug: 'satin-nude', category: 'wanita', inspired_by: 'Narciso Rodriguez For Her', top_note: 'Peach, Rose', middle_note: 'Musc, Jasmine, Osmanthus', base_note: 'Sandalwood, Amber, Musk', price: 90000, size_ml: 30, stock: 50, description: 'Kelembutan kulit dalam bentuk aroma musk yang sensual.' },
  { name: 'Noir Sauvage', slug: 'noir-sauvage', category: 'pria', inspired_by: 'Dior Sauvage', top_note: 'Bergamot, Calabrian Bergamot', middle_note: 'Ambroxan, Pepper, Sichuan Pepper', base_note: 'Labdanum, Amberwood, Cedar', price: 115000, size_ml: 30, stock: 50, is_featured: true, description: 'Wild, bold, memesona. Parfum pria untuk mereka yang percaya diri.' },
  { name: "L'Homme Boisé", slug: 'lhomme-boise', category: 'pria', inspired_by: 'Bleu de Chanel', top_note: 'Citrus, Grapefruit, Lemon', middle_note: 'Ginger, Nutmeg, Jasmine', base_note: 'Labdanum, Sandalwood, Cedar, Patchouli', price: 120000, size_ml: 30, stock: 50, is_featured: true, description: 'Kesegaran citrus berpadu kayu yang dalam. Pria modern yang berkelas.' },
  { name: 'Titan Aqua', slug: 'titan-aqua', category: 'pria', inspired_by: 'Acqua di Gio Profumo', top_note: 'Aquatic Notes, Bergamot, Geranium', middle_note: 'Sage, Rosemary, Incense', base_note: 'Patchouli, Oakmoss, Mineral Notes', price: 125000, size_ml: 30, stock: 50, is_featured: true, description: 'Segarnya laut Mediterania dalam setiap semprotan. Cocok untuk aktivitas siang.' },
  { name: 'Dark Oud', slug: 'dark-oud', category: 'pria', inspired_by: 'Tom Ford Oud Wood', top_note: 'Oud Wood, Rosewood', middle_note: 'Cardamom, Sandalwood, Vetiver', base_note: 'Tonka Bean, Amber, Vanilla', price: 185000, size_ml: 30, stock: 50, description: 'Kemewahan oud tulen. Aroma eksklusif untuk kesempatan istimewa.' },
  { name: 'Gentleman Frost', slug: 'gentleman-frost', category: 'pria', inspired_by: 'Hugo Boss Bottled Night', top_note: 'Birch, Cardamom, Lavender', middle_note: 'Jasmine, Woody Notes', base_note: 'Musk, Oakmoss, Louro Amarelo', price: 95000, size_ml: 30, stock: 50, description: 'Sejuk seperti malam musim dingin. Gentleman dalam definisi modern.' },
  { name: 'Lumière Neutre', slug: 'lumiere-neutre', category: 'unisex', inspired_by: 'Le Labo Santal 33', top_note: 'Violet, Cardamom, Iris', middle_note: 'Ambrox, Papyrus, Cedarwood', base_note: 'Sandalwood, Leather, Musk, Vanilla', price: 150000, size_ml: 30, stock: 50, is_featured: true, description: 'Aroma kayu santal yang universal, dapat dinikmati siapa saja. Trendy dan timeless.' },
]

export async function seedDatabase() {
  const db = await getDb()
  const productCount = await db.collection('products').countDocuments()
  if (productCount === 0) {
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
  }
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
  const settings = await db.collection('settings').findOne({ key: 'store' })
  if (!settings) {
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
