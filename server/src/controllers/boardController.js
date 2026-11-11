/**
 * ============================================================================
 * BOARD CONTROLLER (CRUD & PERMISSIONS)
 * ============================================================================
 */

import { BoardModel } from '../models/Board.js';
import { UserModel } from '../models/User.js';

export async function createBoard(req, res, next) {
  try {
    const { title, settings } = req.body;
    const userId = req.user.id;

    const board = await BoardModel.create({
      title: title || 'Untitled Workspace',
      ownerId: userId,
      settings: settings || {}
    });

    res.status(201).json({ success: true, board });
  } catch (err) {
    next(err);
  }
}

export async function listBoards(req, res, next) {
  try {
    const userId = req.user.id;
    const boards = await BoardModel.findByUser(userId);
    res.json({ success: true, boards });
  } catch (err) {
    next(err);
  }
}

export async function getBoard(req, res, next) {
  try {
    // req.board is pre-attached by requireBoardRole middleware
    res.json({
      success: true,
      board: req.board,
      userRole: req.boardRole
    });
  } catch (err) {
    next(err);
  }
}

export async function updateBoard(req, res, next) {
  try {
    const boardId = req.params.id;
    const { title, settings, isPublic } = req.body;

    const updated = await BoardModel.update(boardId, {
      ...(title && { title }),
      ...(settings && { settings }),
      ...(isPublic !== undefined && { isPublic })
    });

    res.json({ success: true, board: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteBoard(req, res, next) {
  try {
    const boardId = req.params.id;
    await BoardModel.delete(boardId);
    res.json({ success: true, message: 'Board deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function addMember(req, res, next) {
  try {
    const boardId = req.params.id;
    const { email, role = 'editor' } = req.body;

    const targetUser = await UserModel.findByEmail(email);
    if (!targetUser) {
      return res.status(404).json({ error: 'NotFound', message: `User with email ${email} not found` });
    }

    const updated = await BoardModel.addMember(boardId, {
      userId: targetUser._id || targetUser.id,
      role
    });

    res.json({ success: true, board: updated });
  } catch (err) {
    next(err);
  }
}

