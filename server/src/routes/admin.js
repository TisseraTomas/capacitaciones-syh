import { Router } from 'express';
import adminAuth from '../middleware/adminAuth.js';
import * as authController from '../controllers/authController.js';
import * as empresaController from '../controllers/empresaController.js';
import * as trabajadorController from '../controllers/trabajadorController.js';
import * as cuestionarioController from '../controllers/cuestionarioController.js';
import * as qrController from '../controllers/qrController.js';

const router = Router();

router.post('/auth/login', authController.login);
router.get('/auth/me', adminAuth, authController.me);

router.get('/empresas', adminAuth, empresaController.list);
router.post('/empresas', adminAuth, empresaController.create);
router.put('/empresas/:id', adminAuth, empresaController.update);
router.delete('/empresas/:id', adminAuth, empresaController.remove);

router.get('/empresas/:empresaId/trabajadores', adminAuth, trabajadorController.list);
router.post('/empresas/:empresaId/trabajadores', adminAuth, trabajadorController.create);
router.post('/empresas/:empresaId/trabajadores/bulk', adminAuth, trabajadorController.bulkCreate);
router.delete('/trabajadores/:id', adminAuth, trabajadorController.remove);

router.get('/cuestionarios', adminAuth, cuestionarioController.list);
router.post('/cuestionarios', adminAuth, cuestionarioController.create);
router.get('/cuestionarios/:id', adminAuth, cuestionarioController.getById);
router.put('/cuestionarios/:id', adminAuth, cuestionarioController.update);
router.delete('/cuestionarios/:id', adminAuth, cuestionarioController.remove);
router.get('/cuestionarios/:id/resultados', adminAuth, cuestionarioController.resultados);

router.get('/cuestionarios/:id/qr', adminAuth, qrController.generate);
router.get('/cuestionarios/:id/qr/download', adminAuth, qrController.download);

export default router;
