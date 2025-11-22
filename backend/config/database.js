// =============================================
// CONFIGURATION BASE DE DONNÉES POSTGRESQL
// =============================================

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configuration de la connexion PostgreSQL
const databaseConfig = {
  user: process.env.DB_USER || 'gasikara_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gasikara_gaming',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  // Configuration pour Render (SSL requis)
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  
  // Options de performance
  max: 20, // maximum de clients dans le pool
  idleTimeoutMillis: 30000, // fermer les clients inactifs après 30s
  connectionTimeoutMillis: 2000, // timeout de connexion de 2s
};

// Création du pool de connexions
const pool = new Pool(databaseConfig);

// Test de connexion au démarrage
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connexion PostgreSQL réussie!');
    
    // Créer les tables si elles n'existent pas
    await createTables(client);
    
    client.release();
  } catch (error) {
    console.error('❌ Erreur connexion PostgreSQL:', error.message);
    console.log('💡 Astuce: Vérifiez vos variables d\'environnement DB_*');
  }
};

// Fonction pour créer les tables
const createTables = async (client) => {
  try {
    // Table des jeux
    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        image_url VARCHAR(500),
        trailer_url VARCHAR(500),
        download_link VARCHAR(500),
        
        -- Métadonnées
        platform VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        tags TEXT[],
        
        -- Informations de prix
        is_free BOOLEAN DEFAULT true,
        price DECIMAL(10,2) DEFAULT 0,
        
        -- Statistiques
        download_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        
        -- Dates
        release_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Statut
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        
        -- Index pour les performances
        CONSTRAINT unique_title_platform UNIQUE(title, platform)
      )
    `);

    // Table des catégories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50),
        color VARCHAR(7),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des administrateurs
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des statistiques
    await client.query(`
      CREATE TABLE IF NOT EXISTS statistics (
        id SERIAL PRIMARY KEY,
        stat_date DATE UNIQUE NOT NULL,
        total_visitors INTEGER DEFAULT 0,
        total_downloads INTEGER DEFAULT 0,
        total_games INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables créées avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur création tables:', error.message);
  }
};

// Événements du pool
pool.on('connect', () => {
  console.log('🔄 Nouvelle connexion à la base de données');
});

pool.on('error', (err, client) => {
  console.error('💥 Erreur de pool PostgreSQL:', err);
});

// Tester la connexion au démarrage
testConnection();

export { pool, testConnection };
