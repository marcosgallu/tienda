// ─────────────────────────────────────────────────────────────
//  TIENDACAMI — Servidor Definitivo
// ─────────────────────────────────────────────────────────────

require('dotenv').config({ path: __dirname + '/.env' });
const express  = require('express');
const cors     = require('cors');
const Database = require('better-sqlite3');
const path     = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

const db = new Database(path.join(__dirname, 'catalogo.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT,
    cat       TEXT,
    price     REAL,
    old_price REAL,
    img       TEXT,
    sizes     TEXT,
    color     TEXT,
    badge     TEXT
  )
`);

// ── RUTA NUEVA: ENVÍA EL NÚMERO DE WHATSAPP AL HTML ───────────
app.get('/api/config', (req, res) => {
  res.json({ wsp: process.env.WSP_NUMBER });
});

// ── ADMIN: LOGIN ──────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Contraseña incorrecta' });
  }
});

// ── PRODUCTOS ─────────────────────────────────────────────────
app.get('/api/products', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
    const products = rows.map(row => ({
      ...row,
      sizes: row.sizes ? JSON.parse(row.sizes) : []
    }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer la base de datos' });
  }
});

app.post('/api/products', (req, res) => {
  const { name, cat, price, oldPrice, img, sizes, color, badge } = req.body;
  try {
    const info = db.prepare(`
      INSERT INTO products (name, cat, price, old_price, img, sizes, color, badge)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, cat || 'General', price, oldPrice || null, img || null, JSON.stringify(sizes || []), color || '', badge || 'Nuevo'
    );
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar el producto' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al borrar' });
  }
});

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
// ── ARRANCAR ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🛍  TIENDACAMI corriendo en el puerto ${PORT}`);
});
