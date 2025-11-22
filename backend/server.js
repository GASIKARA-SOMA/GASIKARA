// =============================================
// GASIKARA SOMA GAMING PLATFORM - SERVEUR PRINCIPAL
// =============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration environment
dotenv.config();

// ES Modules fix pour __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARE DE SÉCURITÉ
// =============================================

// Protection basique avec Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting - Protection contre les attaques
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par windowMs
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});
app.use(limiter);

// Compression GZIP pour les performances
app.use(compression());

// CORS pour les requêtes cross-origin
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// =============================================
// MIDDLEWARE STANDARD
// =============================================

// Body parser pour JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// =============================================
// ROUTES DE BASE
// =============================================

// Route santé pour Render
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Gasikara Soma Gaming Platform - Serveur en ligne',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Route racine - Servir le frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API route de base
app.get('/api', (req, res) => {
    res.json({
        name: 'Gasikara Soma Gaming Platform API',
        version: '1.0.0',
        description: 'API pour la plateforme gaming Gasikara Soma',
        endpoints: {
            games: '/api/games',
            admin: '/api/admin',
            auth: '/api/auth'
        }
    });
});

// =============================================
// ROUTES TEMPORAIRES (pour tester)
// =============================================

// Route jeux temporaire
app.get('/api/games', (req, res) => {
    res.json({
        success: true,
        message: 'API Jeux - En développement',
        games: []
    });
});

// Route admin temporaire
app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    
    // Mot de passe temporaire
    if (password === process.env.ADMIN_PASSWORD || password === 'gasikara2024') {
        res.json({ 
            success: true, 
            message: 'Connexion admin réussie!',
            token: 'admin-token-temporaire'
        });
    } else {
        res.status(401).json({ 
            success: false, 
            error: 'Mot de passe incorrect' 
        });
    }
});

// Route admin dashboard temporaire
app.get('/admin/dashboard', (req, res) => {
    res.json({
        stats: {
            totalGames: 0,
            totalDownloads: 0,
            totalVisitors: 0,
            activeUsers: 0
        },
        recentActivity: []
    });
});

// =============================================
// GESTION DES ERREURS
// =============================================

// Route 404
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        res.status(404).json({ 
            error: 'Route API non trouvée',
            path: req.originalUrl 
        });
    } else {
        res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Page non trouvée - Gasikara Soma</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px; 
                        background: #0a0a23;
                        color: white;
                    }
                    h1 { color: #ff6b6b; }
                </style>
            </head>
            <body>
                <h1>🎮 Page non trouvée</h1>
                <p>La page que vous recherchez n'existe pas.</p>
                <a href="/" style="color: #00f0ff;">Retour à l'accueil</a>
            </body>
            </html>
        `);
    }
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Erreur interne du serveur' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// =============================================
// DÉMARRAGE DU SERVEUR
// =============================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🎮 ============================================ 🎮
    🚀 GASIKARA SOMA GAMING PLATFORM - SERVEUR DÉMARRÉ
    🌐 URL: http://localhost:${PORT}
    ⏰ Date: ${new Date().toLocaleString()}
    🔧 Environnement: ${process.env.NODE_ENV || 'development'}
    🗄️ Port: ${PORT}
    🎮 ============================================ 🎮
    `);
    
    // Messages selon l'environnement
    if (process.env.NODE_ENV === 'production') {
        console.log('✅ Mode PRODUCTION - Sécurité maximale activée');
    } else {
        console.log('🔧 Mode DÉVELOPPEMENT - Outils de debug activés');
        console.log('📋 Route santé: /health');
        console.log('🔗 Route API: /api');
        console.log('👤 Admin temporaire - Mot de passe: gasikara2024');
    }
});

export default app;
