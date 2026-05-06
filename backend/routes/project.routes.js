import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { builderOnly } from '../middleware/role.middleware.js';
import {
  createProject,
  updateProject,
  deleteProject,
  listProjects,
  getProjectById,
} from '../controllers/project.controller.js';

const router = Router();

// Public: list active projects, get by ID (for investors browsing)
router.get('/', listProjects);
router.get('/:id', getProjectById);

// Builder only: CRUD own projects
router.post('/', authenticate, builderOnly, createProject);
router.patch('/:id', authenticate, builderOnly, updateProject);
router.delete('/:id', authenticate, builderOnly, deleteProject);

export default router;
