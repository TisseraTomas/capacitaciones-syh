import prisma from '../utils/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const DNI_REGEX = /^\d{7,8}$/;

export async function list(req, res) {
  try {
    const { limit, offset, search } = req.query;
    const take = limit ? parseInt(limit, 10) : undefined;
    const skip = offset ? parseInt(offset, 10) : undefined;

    const where = {};
    if (search) {
      where.OR = [
        { titulo: { contains: search } },
        { empresa: { nombre: { contains: search } } },
      ];
    }

    const [cuestionarios, total] = await Promise.all([
      prisma.cuestionario.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          empresa: { select: { id: true, nombre: true } },
          _count: { select: { preguntas: true } },
        },
      }),
      prisma.cuestionario.count({ where }),
    ]);

    const intentos = await prisma.intento.findMany({
      select: { cuestionarioId: true, trabajadorId: true },
    });

    const contestaronSet = new Set();
    const contestaronMap = {};
    for (const i of intentos) {
      const key = `${i.cuestionarioId}-${i.trabajadorId}`;
      if (!contestaronSet.has(key)) {
        contestaronSet.add(key);
        contestaronMap[i.cuestionarioId] = (contestaronMap[i.cuestionarioId] || 0) + 1;
      }
    }

    const trabajadoresPorEmpresa = await prisma.trabajador.groupBy({
      by: ['empresaId'],
      _count: { id: true },
    });
    const totalTrabMap = {};
    for (const t of trabajadoresPorEmpresa) {
      totalTrabMap[t.empresaId] = t._count.id;
    }

    const resultado = cuestionarios.map((c) => {
      const totalTrab = totalTrabMap[c.empresaId] || 0;
      const contestaron = contestaronMap[c.id] || 0;
      return {
        ...c,
        totalTrabajadores: totalTrab,
        contestaronCount: contestaron,
        faltanCount: totalTrab - contestaron,
      };
    });

    if (take || skip) {
      res.json({ data: resultado, total });
    } else {
      res.json(resultado);
    }
  } catch (error) {
    console.error('Error list cuestionarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function create(req, res) {
  try {
    const { titulo, descripcion, porcentajeAprobacion, intentosPermitidos, empresaId, preguntas } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: 'El título es requerido' });
    }
    if (porcentajeAprobacion == null || porcentajeAprobacion < 0 || porcentajeAprobacion > 100) {
      return res.status(400).json({ error: 'Porcentaje de aprobación inválido (0-100)' });
    }
    if (!empresaId) {
      return res.status(400).json({ error: 'Empresa requerida' });
    }
    if (!Array.isArray(preguntas) || preguntas.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos una pregunta' });
    }
    for (const p of preguntas) {
      if (!p.texto || !p.texto.trim()) {
        return res.status(400).json({ error: 'Todas las preguntas deben tener texto' });
      }
      if (!Array.isArray(p.opciones) || p.opciones.length < 2) {
        return res.status(400).json({ error: `La pregunta "${p.texto}" debe tener al menos 2 opciones` });
      }
      if (!p.opciones.some(o => o.esCorrecta)) {
        return res.status(400).json({ error: `La pregunta "${p.texto}" debe tener una respuesta correcta` });
      }
    }

    const cuestionario = await prisma.cuestionario.create({
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion?.trim(),
        porcentajeAprobacion: Number(porcentajeAprobacion),
        intentosPermitidos: intentosPermitidos != null ? Number(intentosPermitidos) : 1,
        empresaId: Number(empresaId),
        preguntas: {
          create: preguntas.map((p, idx) => ({
            texto: p.texto,
            tipo: p.tipo,
            orden: p.orden ?? idx,
            opciones: {
              create: p.opciones.map((o) => ({
                texto: o.texto,
                esCorrecta: o.esCorrecta,
              })),
            },
          })),
        },
      },
      include: {
        preguntas: { include: { opciones: true } },
        empresa: { select: { id: true, nombre: true } },
      },
    });

    res.status(201).json(cuestionario);
  } catch (error) {
    console.error('Error create cuestionario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const cuestionario = await prisma.cuestionario.findUnique({
      where: { id: Number(id) },
      include: {
        empresa: { select: { id: true, nombre: true } },
        preguntas: {
          orderBy: { orden: 'asc' },
          include: { opciones: true },
        },
      },
    });

    if (!cuestionario) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    res.json(cuestionario);
  } catch (error) {
    console.error('Error getById:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descripcion, porcentajeAprobacion, intentosPermitidos, activo } = req.body;

    const data = {};
    if (titulo?.trim()) data.titulo = titulo.trim();
    if (descripcion !== undefined) data.descripcion = descripcion?.trim();
    if (porcentajeAprobacion != null) data.porcentajeAprobacion = Number(porcentajeAprobacion);
    if (intentosPermitidos != null) data.intentosPermitidos = Number(intentosPermitidos);
    if (activo !== undefined) data.activo = activo;

    const cuestionario = await prisma.cuestionario.update({
      where: { id: Number(id) },
      data,
    });

    res.json(cuestionario);
  } catch (error) {
    console.error('Error update cuestionario:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.cuestionario.delete({ where: { id: Number(id) } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error delete cuestionario:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function resultados(req, res) {
  try {
    const { id } = req.params;
    const cuestionario = await prisma.cuestionario.findUnique({
      where: { id: Number(id) },
      include: {
        empresa: { select: { nombre: true } },
      },
    });

    if (!cuestionario) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    const intentos = await prisma.intento.findMany({
      where: { cuestionarioId: Number(id) },
      include: {
        trabajador: { select: { id: true, nombreCompleto: true, dni: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPreguntas = await prisma.pregunta.count({
      where: { cuestionarioId: Number(id) },
    });

    const trabajadorMap = new Map();
    for (const intento of intentos) {
      const tId = intento.trabajador.id;
      if (!trabajadorMap.has(tId)) {
        trabajadorMap.set(tId, {
          trabajador: intento.trabajador,
          intentos: [],
          ultimoEstado: null,
        });
      }
      trabajadorMap.get(tId).intentos.push({
        id: intento.id,
        puntaje: intento.puntaje,
        aprobado: intento.aprobado,
        createdAt: intento.createdAt,
      });

      const algunAprobado = trabajadorMap.get(tId).intentos.some(i => i.aprobado === true);
      trabajadorMap.get(tId).ultimoEstado = algunAprobado;
    }

    const resultadosArray = Array.from(trabajadorMap.values());

    res.json({
      cuestionario: {
        id: cuestionario.id,
        titulo: cuestionario.titulo,
        urlToken: cuestionario.urlToken,
        porcentajeAprobacion: cuestionario.porcentajeAprobacion,
        intentosPermitidos: cuestionario.intentosPermitidos,
        empresa: cuestionario.empresa.nombre,
        totalPreguntas,
      },
      resultados: resultadosArray,
    });
  } catch (error) {
    console.error('Error resultados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getByToken(req, res) {
  try {
    const { token } = req.params;
    const cuestionario = await prisma.cuestionario.findUnique({
      where: { urlToken: token },
      include: {
        empresa: { select: { nombre: true } },
      },
    });

    if (!cuestionario) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    if (!cuestionario.activo) {
      return res.status(410).json({ error: 'CUESTIONARIO_INACTIVO', activo: false, mensaje: 'Este cuestionario se encuentra inactivo o ha sido cerrado por el administrador.' });
    }

    res.json({
      id: cuestionario.id,
      titulo: cuestionario.titulo,
      descripcion: cuestionario.descripcion,
      empresa: cuestionario.empresa.nombre,
    });
  } catch (error) {
    console.error('Error getByToken:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function login(req, res) {
  try {
    const { token } = req.params;
    const { dni } = req.body;

    if (!dni || !dni.trim()) {
      return res.status(400).json({ error: 'DNI requerido' });
    }
    if (!DNI_REGEX.test(dni.trim())) {
      return res.status(400).json({ error: 'El DNI debe contener entre 7 y 8 dígitos numéricos' });
    }

    const cuestionario = await prisma.cuestionario.findUnique({
      where: { urlToken: token },
    });

    if (!cuestionario || !cuestionario.activo) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    const trabajador = await prisma.trabajador.findUnique({
      where: { dni: dni.trim() },
    });

    if (!trabajador || trabajador.empresaId !== cuestionario.empresaId) {
      return res.status(401).json({ error: 'DNI no registrado para esta capacitación' });
    }

    const intentoPerfecto = await prisma.intento.findFirst({
      where: { trabajadorId: trabajador.id, cuestionarioId: cuestionario.id, puntaje: 100 },
    });

    if (intentoPerfecto) {
      return res.status(403).json({
        error: 'YA_APROBADO_PERFECTO',
        mensaje: '¡Felicitaciones! Ya aprobaste esta capacitación con el 100% de los puntos. No es necesario que vuelvas a realizarla.',
      });
    }

    const intentosRealizados = await prisma.intento.count({
      where: {
        trabajadorId: trabajador.id,
        cuestionarioId: cuestionario.id,
      },
    });

    const esIlimitado = cuestionario.intentosPermitidos === 0;
    const restantes = esIlimitado ? -1 : cuestionario.intentosPermitidos - intentosRealizados;

    if (!esIlimitado && restantes <= 0) {
      return res.status(403).json({
        error: 'LIMITE_ALCANZADO',
        mensaje: `Has alcanzado el límite de ${cuestionario.intentosPermitidos} intento(s) para esta capacitación.`,
      });
    }

    const workerToken = jwt.sign(
      { role: 'worker', trabajadorId: trabajador.id, cuestionarioId: cuestionario.id },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      workerToken,
      nombre: trabajador.nombreCompleto,
      dni: trabajador.dni,
      titulo: cuestionario.titulo,
      intentosRestantes: restantes,
      esIlimitado,
    });
  } catch (error) {
    console.error('Error worker login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getPreguntas(req, res) {
  try {
    const { token } = req.params;
    const cuestionario = await prisma.cuestionario.findUnique({
      where: { urlToken: token },
    });

    if (!cuestionario) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    if (req.worker.cuestionarioId !== cuestionario.id) {
      return res.status(403).json({ error: 'Acceso denegado a este cuestionario' });
    }

    const preguntas = await prisma.pregunta.findMany({
      where: { cuestionarioId: cuestionario.id },
      orderBy: { orden: 'asc' },
      include: {
        opciones: {
          select: { id: true, texto: true },
          orderBy: { id: 'asc' },
        },
      },
    });

    res.json(preguntas);
  } catch (error) {
    console.error('Error getPreguntas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
