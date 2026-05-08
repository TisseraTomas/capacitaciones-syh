import prisma from '../utils/prisma.js';

export async function submit(req, res) {
  try {
    const { token } = req.params;
    const { respuestas } = req.body;

    const trabajadorId = req.worker.trabajadorId;
    const cuestionarioId = req.worker.cuestionarioId;

    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      return res.status(400).json({ error: 'Respuestas requeridas' });
    }

    const cuestionario = await prisma.cuestionario.findUnique({
      where: { urlToken: token },
    });

    if (!cuestionario || cuestionario.id !== cuestionarioId) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    const intentosPrevios = await prisma.intento.count({
      where: { trabajadorId, cuestionarioId },
    });

    const esIlimitado = cuestionario.intentosPermitidos === 0;

    if (!esIlimitado && intentosPrevios >= cuestionario.intentosPermitidos) {
      return res.status(403).json({
        error: 'LIMITE_ALCANZADO',
        mensaje: `Has alcanzado el límite de ${cuestionario.intentosPermitidos} intento(s).`,
      });
    }

    const intentoPerfecto = await prisma.intento.findFirst({
      where: { trabajadorId, cuestionarioId, puntaje: 100 },
    });

    if (intentoPerfecto) {
      return res.status(403).json({
        error: 'YA_APROBADO_PERFECTO',
        mensaje: 'Ya aprobaste esta capacitación con el 100%.',
      });
    }

    const preguntas = await prisma.pregunta.findMany({
      where: { cuestionarioId },
      include: { opciones: true },
    });

    const totalPreguntas = preguntas.length;
    let correctas = 0;

    const intento = await prisma.intento.create({
      data: {
        trabajadorId,
        cuestionarioId,
        respuestas: {
          create: respuestas.map((r) => {
            const pregunta = preguntas.find((p) => p.id === r.preguntaId);
            const opcion = pregunta?.opciones.find((o) => o.id === r.opcionId);
            const esCorrecta = opcion?.esCorrecta ?? false;
            if (esCorrecta) correctas++;
            return {
              preguntaId: r.preguntaId,
              opcionId: r.opcionId,
            };
          }),
        },
      },
    });

    const puntaje = (correctas / totalPreguntas) * 100;
    const aprobado = puntaje >= cuestionario.porcentajeAprobacion;

    await prisma.intento.update({
      where: { id: intento.id },
      data: { puntaje, aprobado },
    });

    const totalIntentos = await prisma.intento.count({
      where: { trabajadorId, cuestionarioId },
    });
    const intentosRestantes = esIlimitado ? -1 : cuestionario.intentosPermitidos - totalIntentos;

    res.json({
      puntaje: Math.round(puntaje * 100) / 100,
      aprobado,
      totalCorrectas: correctas,
      totalPreguntas,
      porcentajeAprobacion: cuestionario.porcentajeAprobacion,
      intentosRestantes: Math.max(-1, intentosRestantes),
      esIlimitado,
    });
  } catch (error) {
    console.error('Error submit intento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
