// Email notification templates (HTML).
// These templates are ready to use. When SMTP is configured, integrate via nodemailer in backend
// using process.env.EMAIL_SERVER_HOST etc. For now, they're stored here for preview and future use.

export const emailTemplates = {
  welcome: ({ name }) => ({
    subject: 'Selamat Datang di Caisy Perfume!',
    html: `
      <div style="font-family:Poppins,sans-serif;background:#FAF7F2;padding:40px 20px;color:#2D2A22">
        <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
          <div style="background:linear-gradient(135deg,#A59F79,#857F5E);padding:40px 30px;text-align:center;color:white">
            <h1 style="font-family:'Playfair Display',serif;font-size:32px;margin:0">Caisy Perfume</h1>
            <p style="margin:5px 0 0;letter-spacing:3px;font-size:11px;opacity:0.9">WANGIAN MEWAH, HARGA TERJANGKAU</p>
          </div>
          <div style="padding:40px 30px">
            <h2 style="font-family:'Playfair Display',serif;color:#A59F79">Halo, ${name}! 🌹</h2>
            <p>Selamat datang di keluarga Caisy Perfume. Kami sangat senang kamu bergabung!</p>
            <p>Jelajahi koleksi parfum dupe kami yang terinspirasi dari brand dunia — wangi mewah tanpa menguras kantong.</p>
            <p style="text-align:center;margin:30px 0">
              <a href="https://caisyperfume.com/catalog" style="background:#A59F79;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600">Mulai Belanja</a>
            </p>
            <p style="color:#6B5B4A;font-size:13px;margin-top:30px">Salam wangi,<br/>Tim Caisy Perfume</p>
          </div>
        </div>
      </div>`
  }),
  order_confirmation: ({ name, order_code, items, total_amount, address }) => ({
    subject: `Konfirmasi Pesanan ${order_code} - Caisy Perfume`,
    html: `
      <div style="font-family:Poppins,sans-serif;background:#FAF7F2;padding:40px 20px;color:#2D2A22">
        <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden">
          <div style="background:#A59F79;padding:30px;text-align:center;color:white">
            <h1 style="font-family:'Playfair Display',serif;margin:0">Pesanan Diterima ✓</h1>
            <p style="margin:5px 0 0">${order_code}</p>
          </div>
          <div style="padding:30px">
            <p>Hai ${name}, terima kasih atas pesananmu!</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <tr style="background:#EFEAE0"><th style="padding:10px;text-align:left">Produk</th><th style="padding:10px">Qty</th><th style="padding:10px">Harga</th></tr>
              ${(items||[]).map(i => `<tr><td style="padding:10px;border-bottom:1px solid #eee">${i.product_name}</td><td style="text-align:center;border-bottom:1px solid #eee">${i.quantity}</td><td style="text-align:right;border-bottom:1px solid #eee">Rp ${i.subtotal.toLocaleString('id-ID')}</td></tr>`).join('')}
              <tr><td colspan="2" style="padding:10px;font-weight:bold">Total</td><td style="text-align:right;font-weight:bold;color:#A59F79">Rp ${(total_amount||0).toLocaleString('id-ID')}</td></tr>
            </table>
            <p><b>Dikirim ke:</b><br/>${address || '-'}</p>
            <p style="margin-top:20px;color:#6B5B4A">Pesananmu akan diproses setelah pembayaran terkonfirmasi.</p>
          </div>
        </div>
      </div>`
  }),
  order_shipped: ({ name, order_code, tracking_number, courier }) => ({
    subject: `Pesanan ${order_code} Sedang Dikirim - Caisy Perfume`,
    html: `
      <div style="font-family:Poppins,sans-serif;background:#FAF7F2;padding:40px 20px;color:#2D2A22">
        <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;padding:30px">
          <h1 style="font-family:'Playfair Display',serif;color:#A59F79">Pesananmu dalam perjalanan! 🚚</h1>
          <p>Hai ${name}, pesanan ${order_code} telah dikirim.</p>
          <div style="background:#EFEAE0;padding:20px;border-radius:8px;margin:20px 0">
            <p style="margin:0"><b>Kurir:</b> ${courier || '-'}</p>
            <p style="margin:5px 0 0"><b>Nomor Resi:</b> <code>${tracking_number || '-'}</code></p>
          </div>
          <p>Pantau paketmu dengan resi di atas melalui situs kurir.</p>
        </div>
      </div>`
  }),
  password_reset: ({ name, reset_url }) => ({
    subject: 'Reset Password - Caisy Perfume',
    html: `<div style="font-family:Poppins,sans-serif;padding:30px"><h2>Halo ${name},</h2><p>Klik link di bawah untuk reset password:</p><p><a href="${reset_url}" style="background:#A59F79;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">Reset Password</a></p><p style="color:#888;font-size:12px">Jika kamu tidak meminta reset, abaikan email ini.</p></div>`
  }),
  waiting_list_fulfilled: ({ name, perfume_name }) => ({
    subject: `Kabar Gembira! ${perfume_name} Sekarang Tersedia - Caisy Perfume`,
    html: `<div style="font-family:Poppins,sans-serif;padding:30px"><h2>Halo ${name}! ✨</h2><p>Kabar baik: parfum <b>${perfume_name}</b> yang kamu request kini tersedia di Caisy Perfume!</p><p><a href="https://caisyperfume.com/catalog" style="background:#A59F79;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">Beli Sekarang</a></p></div>`
  }),
}

// Integration stub — call this when SMTP is configured.
// Example with nodemailer:
// import nodemailer from 'nodemailer'
// const transporter = nodemailer.createTransport({ host: process.env.EMAIL_SERVER_HOST, port: process.env.EMAIL_SERVER_PORT, auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD } })
// await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html })
export async function sendEmail({ to, template, data }) {
  if (!process.env.EMAIL_SERVER_HOST) {
    // TEMPLATE PREVIEW MODE (no SMTP configured yet)
    console.log('[Email MOCK]', template, '->', to, emailTemplates[template]?.(data)?.subject)
    return { mocked: true }
  }
  // TODO: nodemailer integration when SMTP is configured
  return { sent: false }
}
