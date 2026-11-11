/**
 * ============================================================================
 * BOARD MANAGEMENT & RBAC ROUTES
 * ============================================================================
 */

import { Router } from 'express';
import {
  createBoard,
  listBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  addMember
} from '../controllers/boardController.js';
import { getElements, batchSaveElements } from '../controllers/elementController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireBoardRole } from '../middleware/rbac.js';

const router = Router();

// Protect all board routes with JWT Authentication
router.use(authenticateJWT);

router.post('/', createBoard);
router.get('/', listBoards);

router.get('/:id', requireBoardRole('viewer'), getBoard);
router.put('/:id', requireBoardRole('admin'), updateBoard);
router.delete('/:id', requireBoardRole('owner'), deleteBoard);
router.post('/:id/members', requireBoardRole('admin'), addMember);

// Whiteboard Elements Endpoints
router.get('/:id/elements', requireBoardRole('viewer'), getElements);
router.put('/:id/elements/batch', requireBoardRole('editor'), batchSaveElements);

export default router;

