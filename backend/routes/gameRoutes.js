// =============================================
// ROUTES API POUR LES JEUX
// =============================================

import express from 'express';
import GameController from '../controllers/gameController.js';

const router = express.Router();

// 🎮 ROUTES PUBLIQUES
// ====================

// GET /api/games - Tous les jeux avec filtres
router.get('/', GameController.getAllGames);

// GET /api/games/popular - Jeux populaires
router.get('/popular', GameController.getPopularGames);

// GET /api/games/platform/:platform - Jeux par plateforme
router.get('/platform/:platform', GameController.getGamesByPlatform);

// GET /api/games/search - Recherche de jeux
router.get('/search', GameController.searchGames);

// GET /api/games/stats - Statistiques des jeux
router.get('/stats', GameController.getGamesStats);

// GET /api/games/:id - Détails d'un jeu
router.get('/:id', GameController.getGameById);

// POST /api/games/:id/download - Enregistrer un téléchargement
router.post('/:id/download', GameController.incrementDownload);

// 🎮 ROUTES ADMIN (À PROTÉGER PLUS TARD)
// =======================================

// POST /api/games - Créer un nouveau jeu
router.post('/', GameController.createGame);

// PUT /api/games/:id - Mettre à jour un jeu
router.put('/:id', GameController.updateGame);

// DELETE /api/games/:id - Supprimer un jeu
router.delete('/:id', GameController.deleteGame);

export default router;
