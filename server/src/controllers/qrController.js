import QRCode from 'qrcode';
import prisma from '../utils/prisma.js';

export async function generate(req, res) {
  try {
    const { id } = req.params;
    const cuestionario = await prisma.cuestionario.findUnique({
      where: { id: Number(id) },
    });

    if (!cuestionario) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/c/${cuestionario.urlToken}`;

    const qrSvg = await QRCode.toString(url, { type: 'svg', width: 300, margin: 2 });

    res.json({ url, qrSvg });
  } catch (error) {
    console.error('Error generate QR:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function download(req, res) {
  try {
    const { id } = req.params;
    const cuestionario = await prisma.cuestionario.findUnique({
      where: { id: Number(id) },
    });

    if (!cuestionario) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/c/${cuestionario.urlToken}`;

    const qrPng = await QRCode.toBuffer(url, { type: 'png', width: 600, margin: 2 });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${cuestionario.urlToken}.png"`);
    res.send(qrPng);
  } catch (error) {
    console.error('Error download QR:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
