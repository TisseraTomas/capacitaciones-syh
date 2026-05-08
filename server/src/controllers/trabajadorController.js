import prisma from '../utils/prisma.js';

export async function list(req, res) {
  try {
    const { empresaId } = req.params;
    const { search } = req.query;

    const where = { empresaId: Number(empresaId) };
    if (search) {
      where.OR = [
        { nombreCompleto: { contains: search } },
        { dni: { contains: search } },
      ];
    }

    const trabajadores = await prisma.trabajador.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(trabajadores);
  } catch (error) {
    console.error('Error list trabajadores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function create(req, res) {
  try {
    const { empresaId } = req.params;
    const { nombreCompleto, dni } = req.body;
    if (!nombreCompleto || !nombreCompleto.trim()) {
      return res.status(400).json({ error: 'El nombre completo es requerido' });
    }
    if (!dni || !dni.trim()) {
      return res.status(400).json({ error: 'El DNI es requerido' });
    }

    const existe = await prisma.trabajador.findUnique({ where: { dni: dni.trim() } });
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un trabajador con ese DNI' });
    }

    const trabajador = await prisma.trabajador.create({
      data: {
        nombreCompleto: nombreCompleto.trim(),
        dni: dni.trim(),
        empresaId: Number(empresaId),
      },
    });
    res.status(201).json(trabajador);
  } catch (error) {
    console.error('Error create trabajador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function bulkCreate(req, res) {
  try {
    const { empresaId } = req.params;
    const { trabajadores } = req.body;

    if (!Array.isArray(trabajadores) || trabajadores.length === 0) {
      return res.status(400).json({ error: 'Lista de trabajadores requerida' });
    }

    let creados = 0;
    for (const t of trabajadores) {
      if (!t.nombreCompleto || !t.dni) continue;
      const existe = await prisma.trabajador.findUnique({ where: { dni: t.dni.trim() } });
      if (existe) continue;
      await prisma.trabajador.create({
        data: {
          nombreCompleto: t.nombreCompleto.trim(),
          dni: t.dni.trim(),
          empresaId: Number(empresaId),
        },
      });
      creados++;
    }

    res.status(201).json({ count: creados });
  } catch (error) {
    console.error('Error bulk create:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.trabajador.delete({ where: { id: Number(id) } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error delete trabajador:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
