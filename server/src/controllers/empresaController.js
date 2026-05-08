import prisma from '../utils/prisma.js';

export async function list(req, res) {
  try {
    const { search } = req.query;
    const where = {};
    if (search) where.nombre = { contains: search };

    const empresas = await prisma.empresa.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { trabajadores: true, cuestionarios: true } } },
    });
    res.json(empresas);
  } catch (error) {
    console.error('Error list empresas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function create(req, res) {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const empresa = await prisma.empresa.create({ data: { nombre: nombre.trim() } });
    res.status(201).json(empresa);
  } catch (error) {
    console.error('Error create empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const empresa = await prisma.empresa.update({
      where: { id: Number(id) },
      data: { nombre: nombre.trim() },
    });
    res.json(empresa);
  } catch (error) {
    console.error('Error update empresa:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.empresa.delete({ where: { id: Number(id) } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error delete empresa:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
