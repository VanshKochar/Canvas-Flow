/**
 * ============================================================================
 * ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * ============================================================================
 * Enforces hierarchical permission checks on board-level operations.
 * Roles: viewer (1) < commenter (2) < editor (3) < admin (4) < owner (5)
 */

import { BoardModel } from '../models/Board.js';

const ROLE_RANKS = {
  viewer: 1,
  commenter: 2,
  editor: 3,
  admin: 4,
  owner: 5
};

export function requireBoardRole(minimumRole) {
  return async (req, res, next) => {
    const boardId = req.params.id || req.params.boardId;
    const userId = req.user?.id || req.user?._id;

    if (!boardId) {
      return res.status(400).json({ error: 'BadRequest', message: 'Board ID is required' });
    }

    const board = await BoardModel.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'NotFound', message: 'Board does not exist' });
    }

    // Board Owner always has maximum privileges
    if (board.ownerId === userId) {
      req.boardRole = 'owner';
      req.board = board;
      return next();
    }

    // Check member role
    const member = board.members?.find(m => m.userId === userId);
    const userRole = member ? member.role : (board.isPublic ? 'viewer' : null);

    if (!userRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this private board'
      });
    }

    if (ROLE_RANKS[userRole] < ROLE_RANKS[minimumRole]) {
      return res.status(403).json({
        error: 'InsufficientPermissions',
        message: `Action requires '${minimumRole}' role. Your role is '${userRole}'.`
      });
    }

    req.boardRole = userRole;
    req.board = board;
    next();
  };
}

