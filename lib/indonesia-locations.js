// Seed data for Indonesian provinces/cities/districts.
// Representative subset covering most populated regions.
export const LOCATIONS = [
  { id: '31', name: 'DKI Jakarta', cities: [
    { id: '3171', name: 'Jakarta Pusat', districts: [
      { id: '317101', name: 'Gambir', jubelio_destination_id: '10310' },
      { id: '317102', name: 'Tanah Abang', jubelio_destination_id: '10220' },
      { id: '317103', name: 'Menteng', jubelio_destination_id: '10310' },
    ]},
    { id: '3172', name: 'Jakarta Utara', districts: [
      { id: '317201', name: 'Kelapa Gading', jubelio_destination_id: '14240' },
      { id: '317202', name: 'Pademangan', jubelio_destination_id: '14410' },
    ]},
    { id: '3173', name: 'Jakarta Barat', districts: [
      { id: '317301', name: 'Kebon Jeruk', jubelio_destination_id: '11530' },
      { id: '317302', name: 'Grogol Petamburan', jubelio_destination_id: '11440' },
    ]},
    { id: '3174', name: 'Jakarta Selatan', districts: [
      { id: '317401', name: 'Kebayoran Baru', jubelio_destination_id: '12110' },
      { id: '317402', name: 'Tebet', jubelio_destination_id: '12820' },
      { id: '317403', name: 'Pancoran', jubelio_destination_id: '12780' },
    ]},
    { id: '3175', name: 'Jakarta Timur', districts: [
      { id: '317501', name: 'Cakung', jubelio_destination_id: '13910' },
      { id: '317502', name: 'Duren Sawit', jubelio_destination_id: '13440' },
    ]},
  ]},
  { id: '32', name: 'Jawa Barat', cities: [
    { id: '3273', name: 'Kota Bandung', districts: [
      { id: '327301', name: 'Bandung Wetan', jubelio_destination_id: '40115' },
      { id: '327302', name: 'Cibeunying Kaler', jubelio_destination_id: '40134' },
      { id: '327303', name: 'Coblong', jubelio_destination_id: '40132' },
    ]},
    { id: '3271', name: 'Kota Bogor', districts: [
      { id: '327101', name: 'Bogor Tengah', jubelio_destination_id: '16124' },
      { id: '327102', name: 'Bogor Barat', jubelio_destination_id: '16116' },
    ]},
    { id: '3276', name: 'Kota Depok', districts: [
      { id: '327601', name: 'Beji', jubelio_destination_id: '16421' },
      { id: '327602', name: 'Pancoran Mas', jubelio_destination_id: '16431' },
    ]},
    { id: '3275', name: 'Kota Bekasi', districts: [
      { id: '327501', name: 'Bekasi Barat', jubelio_destination_id: '17134' },
      { id: '327502', name: 'Bekasi Timur', jubelio_destination_id: '17111' },
    ]},
  ]},
  { id: '33', name: 'Jawa Tengah', cities: [
    { id: '3374', name: 'Kota Semarang', districts: [
      { id: '337401', name: 'Semarang Tengah', jubelio_destination_id: '50134' },
      { id: '337402', name: 'Candisari', jubelio_destination_id: '50257' },
    ]},
    { id: '3372', name: 'Kota Surakarta', districts: [
      { id: '337201', name: 'Banjarsari', jubelio_destination_id: '57131' },
      { id: '337202', name: 'Laweyan', jubelio_destination_id: '57142' },
    ]},
  ]},
  { id: '35', name: 'Jawa Timur', cities: [
    { id: '3578', name: 'Kota Surabaya', districts: [
      { id: '357801', name: 'Gubeng', jubelio_destination_id: '60281' },
      { id: '357802', name: 'Wonokromo', jubelio_destination_id: '60243' },
      { id: '357803', name: 'Rungkut', jubelio_destination_id: '60293' },
    ]},
    { id: '3573', name: 'Kota Malang', districts: [
      { id: '357301', name: 'Klojen', jubelio_destination_id: '65111' },
      { id: '357302', name: 'Blimbing', jubelio_destination_id: '65125' },
    ]},
  ]},
  { id: '34', name: 'DI Yogyakarta', cities: [
    { id: '3471', name: 'Kota Yogyakarta', districts: [
      { id: '347101', name: 'Gondokusuman', jubelio_destination_id: '55222' },
      { id: '347102', name: 'Umbulharjo', jubelio_destination_id: '55161' },
    ]},
    { id: '3404', name: 'Kab. Sleman', districts: [
      { id: '340401', name: 'Depok', jubelio_destination_id: '55281' },
      { id: '340402', name: 'Ngaglik', jubelio_destination_id: '55581' },
    ]},
  ]},
  { id: '36', name: 'Banten', cities: [
    { id: '3671', name: 'Kota Tangerang', districts: [
      { id: '367101', name: 'Tangerang', jubelio_destination_id: '15111' },
      { id: '367102', name: 'Cipondoh', jubelio_destination_id: '15148' },
    ]},
    { id: '3674', name: 'Kota Tangerang Selatan', districts: [
      { id: '367401', name: 'Serpong', jubelio_destination_id: '15310' },
      { id: '367402', name: 'Pondok Aren', jubelio_destination_id: '15224' },
    ]},
  ]},
]

export function getProvinces() {
  return LOCATIONS.map(p => ({ id: p.id, name: p.name }))
}
export function getCities(provinceId) {
  const p = LOCATIONS.find(p => p.id === provinceId)
  return p ? p.cities.map(c => ({ id: c.id, province_id: provinceId, name: c.name })) : []
}
export function getDistricts(cityId) {
  for (const p of LOCATIONS) {
    const c = p.cities.find(c => c.id === cityId)
    if (c) return c.districts.map(d => ({ id: d.id, city_id: cityId, name: d.name, jubelio_destination_id: d.jubelio_destination_id }))
  }
  return []
}
export function getDistrictById(id) {
  for (const p of LOCATIONS) {
    for (const c of p.cities) {
      const d = c.districts.find(d => d.id === id)
      if (d) return { ...d, city_name: c.name, province_name: p.name }
    }
  }
  return null
}
