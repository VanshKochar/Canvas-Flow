/**
 * ============================================================================
 * CANVAS ELEMENT PERSISTENCE CONTROLLER
 * ============================================================================
 */

import { ElementModel } from '../models/Element.js';

export async function getElements(req, res, next) {
  try {
    const boardId = req.params.id;
    const elements = await ElementModel.findByBoardId(boardId);
    res.json({ success: true, elements });
  } catch (err) {
    next(err);
  }
}

export async function batchSaveElements(req, res, next) {
  try {
    const boardId = req.params.id;
    const { elements } = req.body;

    if (!Array.isArray(elements)) {
      return res.status(400).json({ error: 'BadRequest', message: 'Elements must be an array' });
    }

    const saved = await ElementModel.batchUpsert(boardId, elements);
    res.json({ success: true, count: saved.length, elements: saved });
  } catch (err) {
    next(err);
  }
}

