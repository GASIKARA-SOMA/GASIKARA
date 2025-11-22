// =============================================
// MODÈLE GAME - Gestion des jeux vidéo
// =============================================

import { pool } from '../config/database.js';

class Game {
  // Créer un nouveau jeu
  static async create(gameData) {
    const {
      title,
      description,
      short_description,
      image_url,
      trailer_url,
      download_link,
      platform,
      category,
      tags,
      is_free = true,
      price = 0,
      release_date
    } = gameData;

    const query = `
      INSERT INTO games (
        title, description, short_description, image_url, 
        trailer_url, download_link, platform, category, 
        tags, is_free, price, release_date
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      title,
      description,
      short_description,
      image_url,
      trailer_url,
      download_link,
      platform,
      category,
      tags || [],
      is_free,
      price,
      release_date
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur création jeu:', error);
      throw error;
    }
  }

  // Récupérer tous les jeux
  static async findAll(filters = {}) {
    let query = `
      SELECT 
        id, title, short_description, image_url, 
        platform, category, tags, is_free, price,
        download_count, view_count, rating,
        release_date, is_featured, created_at
      FROM games 
      WHERE is_active = true
    `;
    
    const values = [];
    let paramCount = 0;

    // Filtres dynamiques
    if (filters.platform) {
      paramCount++;
      query += ` AND platform = $${paramCount}`;
      values.push(filters.platform);
    }

    if (filters.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      values.push(filters.category);
    }

    if (filters.is_free !== undefined) {
      paramCount++;
      query += ` AND is_free = $${paramCount}`;
      values.push(filters.is_free);
    }

    if (filters.is_featured) {
      paramCount++;
      query += ` AND is_featured = $${paramCount}`;
      values.push(filters.is_featured);
    }

    // Tri et limite
    query += ` ORDER BY 
      ${filters.sortBy === 'downloads' ? 'download_count DESC' : 
        filters.sortBy === 'views' ? 'view_count DESC' : 
        filters.sortBy === 'newest' ? 'created_at DESC' : 
        'created_at DESC'}
    `;

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Erreur récupération jeux:', error);
      throw error;
    }
  }

  // Récupérer un jeu par ID
  static async findById(id) {
    // Incrémenter le compteur de vues
    await pool.query(
      'UPDATE games SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    const query = 'SELECT * FROM games WHERE id = $1 AND is_active = true';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur récupération jeu:', error);
      throw error;
    }
  }

  // Mettre à jour un jeu
  static async update(id, gameData) {
    const allowedFields = [
      'title', 'description', 'short_description', 'image_url',
      'trailer_url', 'download_link', 'platform', 'category',
      'tags', 'is_free', 'price', 'is_featured', 'release_date'
    ];

    const updates = [];
    const values = [];
    let paramCount = 0;

    // Construire dynamiquement la requête
    for (const [field, value] of Object.entries(gameData)) {
      if (allowedFields.includes(field) && value !== undefined) {
        paramCount++;
        updates.push(`${field} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('Aucun champ valide à mettre à jour');
    }

    paramCount++;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE games 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur mise à jour jeu:', error);
      throw error;
    }
  }

  // Supprimer un jeu (soft delete)
  static async delete(id) {
    const query = `
      UPDATE games 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur suppression jeu:', error);
      throw error;
    }
  }

  // Incrémenter le compteur de téléchargements
  static async incrementDownload(id) {
    const query = `
      UPDATE games 
      SET download_count = download_count + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING download_count
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur incrément téléchargement:', error);
      throw error;
    }
  }

  // Récupérer les jeux populaires
  static async getPopular(limit = 10) {
    const query = `
      SELECT 
        id, title, short_description, image_url, 
        platform, category, download_count, rating
      FROM games 
      WHERE is_active = true 
      ORDER BY download_count DESC, rating DESC 
      LIMIT $1
    `;

    try {
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Erreur récupération jeux populaires:', error);
      throw error;
    }
  }

  // Récupérer les jeux par plateforme
  static async getByPlatform(platform, limit = 20) {
    const query = `
      SELECT 
        id, title, short_description, image_url, 
        platform, category, is_free, rating
      FROM games 
      WHERE platform = $1 AND is_active = true 
      ORDER BY created_at DESC 
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [platform, limit]);
      return result.rows;
    } catch (error) {
      console.error('Erreur récupération par plateforme:', error);
      throw error;
    }
  }

  // Statistiques des jeux
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_games,
        COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_games,
        COUNT(CASE WHEN is_free = true THEN 1 END) as free_games,
        SUM(download_count) as total_downloads,
        SUM(view_count) as total_views,
        ROUND(AVG(rating), 2) as average_rating
      FROM games 
      WHERE is_active = true
    `;

    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur statistiques jeux:', error);
      throw error;
    }
  }
}

export default Game;
