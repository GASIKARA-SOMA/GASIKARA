// =============================================
// CONTROLLER GAME - Logique métier des jeux
// =============================================

import Game from '../models/Game.js';

class GameController {
  // 🎮 GET /api/games - Récupérer tous les jeux
  static async getAllGames(req, res) {
    try {
      const filters = {
        platform: req.query.platform,
        category: req.query.category,
        is_free: req.query.free ? true : undefined,
        is_featured: req.query.featured ? true : undefined,
        sortBy: req.query.sort || 'newest',
        limit: parseInt(req.query.limit) || 50
      };

      const games = await Game.findAll(filters);
      
      res.json({
        success: true,
        count: games.length,
        filters: filters,
        games: games
      });
    } catch (error) {
      console.error('Erreur récupération jeux:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des jeux'
      });
    }
  }

  // 🎮 GET /api/games/popular - Jeux populaires
  static async getPopularGames(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const games = await Game.getPopular(limit);
      
      res.json({
        success: true,
        count: games.length,
        games: games
      });
    } catch (error) {
      console.error('Erreur récupération jeux populaires:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des jeux populaires'
      });
    }
  }

  // 🎮 GET /api/games/platform/:platform - Jeux par plateforme
  static async getGamesByPlatform(req, res) {
    try {
      const { platform } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      
      const validPlatforms = ['pc', 'playstation', 'xbox', 'mobile', 'nintendo'];
      if (!validPlatforms.includes(platform.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Plateforme non valide. Options: pc, playstation, xbox, mobile, nintendo'
        });
      }

      const games = await Game.getByPlatform(platform, limit);
      
      res.json({
        success: true,
        platform: platform,
        count: games.length,
        games: games
      });
    } catch (error) {
      console.error('Erreur récupération par plateforme:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des jeux par plateforme'
      });
    }
  }

  // 🎮 GET /api/games/:id - Récupérer un jeu spécifique
  static async getGameById(req, res) {
    try {
      const { id } = req.params;
      const game = await Game.findById(id);

      if (!game) {
        return res.status(404).json({
          success: false,
          error: 'Jeu non trouvé'
        });
      }

      res.json({
        success: true,
        game: game
      });
    } catch (error) {
      console.error('Erreur récupération jeu:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du jeu'
      });
    }
  }

  // 🎮 POST /api/games - Créer un nouveau jeu (ADMIN)
  static async createGame(req, res) {
    try {
      // Validation basique
      const requiredFields = ['title', 'platform', 'description', 'download_link'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            error: `Le champ ${field} est requis`
          });
        }
      }

      const gameData = {
        title: req.body.title,
        description: req.body.description,
        short_description: req.body.short_description || req.body.description.substring(0, 200) + '...',
        image_url: req.body.image_url || '/assets/images/default-game.jpg',
        trailer_url: req.body.trailer_url,
        download_link: req.body.download_link,
        platform: req.body.platform,
        category: req.body.category || 'action',
        tags: Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags].filter(Boolean),
        is_free: req.body.is_free !== undefined ? req.body.is_free : true,
        price: req.body.price || 0,
        release_date: req.body.release_date
      };

      const newGame = await Game.create(gameData);

      res.status(201).json({
        success: true,
        message: 'Jeu créé avec succès',
        game: newGame
      });
    } catch (error) {
      console.error('Erreur création jeu:', error);
      
      if (error.code === '23505') { // Violation contrainte unique PostgreSQL
        return res.status(400).json({
          success: false,
          error: 'Un jeu avec ce titre existe déjà sur cette plateforme'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création du jeu'
      });
    }
  }

  // 🎮 PUT /api/games/:id - Mettre à jour un jeu (ADMIN)
  static async updateGame(req, res) {
    try {
      const { id } = req.params;
      
      // Vérifier si le jeu existe
      const existingGame = await Game.findById(id);
      if (!existingGame) {
        return res.status(404).json({
          success: false,
          error: 'Jeu non trouvé'
        });
      }

      const updatedGame = await Game.update(id, req.body);

      res.json({
        success: true,
        message: 'Jeu mis à jour avec succès',
        game: updatedGame
      });
    } catch (error) {
      console.error('Erreur mise à jour jeu:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du jeu'
      });
    }
  }

  // 🎮 DELETE /api/games/:id - Supprimer un jeu (ADMIN)
  static async deleteGame(req, res) {
    try {
      const { id } = req.params;
      
      // Vérifier si le jeu existe
      const existingGame = await Game.findById(id);
      if (!existingGame) {
        return res.status(404).json({
          success: false,
          error: 'Jeu non trouvé'
        });
      }

      await Game.delete(id);

      res.json({
        success: true,
        message: 'Jeu supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur suppression jeu:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression du jeu'
      });
    }
  }

  // 🎮 POST /api/games/:id/download - Incrémenter les téléchargements
  static async incrementDownload(req, res) {
    try {
      const { id } = req.params;
      
      const result = await Game.incrementDownload(id);

      res.json({
        success: true,
        message: 'Téléchargement enregistré',
        download_count: result.download_count
      });
    } catch (error) {
      console.error('Erreur enregistrement téléchargement:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'enregistrement du téléchargement'
      });
    }
  }

  // 🎮 GET /api/games/stats/statistiques - Statistiques des jeux
  static async getGamesStats(req, res) {
    try {
      const stats = await Game.getStats();

      res.json({
        success: true,
        stats: stats
      });
    } catch (error) {
      console.error('Erreur statistiques jeux:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // 🎮 GET /api/games/search/recherche - Recherche de jeux
  static async searchGames(req, res) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Paramètre de recherche requis'
        });
      }

      // Recherche simple dans la base de données
      const query = `
        SELECT 
          id, title, short_description, image_url, 
          platform, category, is_free, rating
        FROM games 
        WHERE is_active = true 
          AND (title ILIKE $1 OR description ILIKE $1 OR category ILIKE $1)
        ORDER BY 
          CASE 
            WHEN title ILIKE $1 THEN 1
            WHEN description ILIKE $1 THEN 2
            ELSE 3
          END,
          download_count DESC
        LIMIT 20
      `;

      const result = await Game.pool.query(query, [`%${q}%`]);

      res.json({
        success: true,
        query: q,
        count: result.rows.length,
        games: result.rows
      });
    } catch (error) {
      console.error('Erreur recherche jeux:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche des jeux'
      });
    }
  }
}

export default GameController;
