import { Router } from 'express';
import workerAuth from '../middleware/workerAuth.js';
import * as cuestionarioController from '../controllers/cuestionarioController.js';
import * as intentoController from '../controllers/intentoController.js';

const router = Router();

router.get('/:token', cuestionarioController.getByToken);
router.post('/:token/login', cuestionarioController.login);
router.get('/:token/preguntas', workerAuth, cuestionarioController.getPreguntas);
router.post('/:token/intento', workerAuth, intentoController.submit);

export default router;
