import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function ensureAdminHash() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  return hash;
}

let adminHash = null;

export async function login(req, res) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }

    if (!adminHash) {
      adminHash = await ensureAdminHash();
    }

    const valid = await bcrypt.compare(password, adminHash);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function me(req, res) {
  res.json({ admin: true });
}
