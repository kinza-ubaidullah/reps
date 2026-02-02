
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import session from 'express-session';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import api1688 from './backend/services/api1688Service.js';
import passport from './backend/config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'anyreps_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request Logger
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root Route
app.get('/', (req, res) => {
  res.send('AnyReps Backend API is running. Access endpoints via /api/...');
});

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET || 'anyreps_secret_key_2024_secure';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
    req.user = user;
    next();
  });
};

// Middleware for Admin check
const isAdmin = (req, res, next) => {
  if (req.user && req.user.rank === 'Admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// --- AUTH ROUTES ---

// Google OAuth Routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, rank: req.user.rank, username: req.user.username },
      JWT_SECRET
    );
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}&auth=success`);
  }
);

// Discord OAuth Routes
app.get('/api/auth/discord',
  passport.authenticate('discord')
);

app.get('/api/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, rank: req.user.rank, username: req.user.username },
      JWT_SECRET
    );
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}&auth=success`);
  }
);

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO profiles (email, password, username, rank, reputation) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, username, rank',
      [email, hashedPassword, username, 'Bronze', 0]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, rank: user.rank, username: user.username }, JWT_SECRET);
    res.json({ user, token });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, rank: user.rank, username: user.username }, JWT_SECRET);
      delete user.password;
      res.json({ user, token });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CUSTOM SOCIAL AUTH APIs ---

// Google Auth API
app.post('/api/auth/google', async (req, res) => {
  const { email, username, avatar_url, google_id } = req.body;
  try {
    // 1. Check if user already exists with this Google ID
    let result = await pool.query('SELECT * FROM profiles WHERE google_id = $1', [google_id]);
    let user = result.rows[0];

    // 2. If not, check if email already exists (to link accounts)
    if (!user) {
      result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
      user = result.rows[0];

      if (user) {
        // Link Google ID to existing email account
        await pool.query('UPDATE profiles SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3', [google_id, avatar_url, user.id]);
      } else {
        // Create brand new profile
        const insertRes = await pool.query(
          'INSERT INTO profiles (email, password, username, avatar_url, google_id, rank, reputation) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [email, 'GOOGLE_AUTH_SECURE', username, avatar_url, google_id, 'Bronze', 0]
        );
        user = insertRes.rows[0];
      }
    }

    const token = jwt.sign({ id: user.id, email: user.email, rank: user.rank, username: user.username }, JWT_SECRET);
    delete user.password;
    res.json({ user, token, platform: 'Google' });
  } catch (err) {
    console.error('❌ Google Auth Error:', err.message);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Discord Auth API
app.post('/api/auth/discord', async (req, res) => {
  const { email, username, avatar_url, discord_id } = req.body;
  try {
    // 1. Check if user already exists with this Discord ID
    let result = await pool.query('SELECT * FROM profiles WHERE discord_id = $1', [discord_id]);
    let user = result.rows[0];

    // 2. If not, check email
    if (!user) {
      result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
      user = result.rows[0];

      if (user) {
        await pool.query('UPDATE profiles SET discord_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3', [discord_id, avatar_url, user.id]);
      } else {
        const insertRes = await pool.query(
          'INSERT INTO profiles (email, password, username, avatar_url, discord_id, rank, reputation) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [email, 'DISCORD_AUTH_SECURE', username, avatar_url, discord_id, 'Bronze', 0]
        );
        user = insertRes.rows[0];
      }
    }

    const token = jwt.sign({ id: user.id, email: user.email, rank: user.rank, username: user.username }, JWT_SECRET);
    delete user.password;
    res.json({ user, token, platform: 'Discord' });
  } catch (err) {
    console.error('❌ Discord Auth Error:', err.message);
    res.status(500).json({ error: 'Discord authentication failed' });
  }
});

// Generic Social (Legacy Support)
app.post('/api/auth/social', async (req, res) => {
  const { email, username, avatar_url, platform } = req.body;
  try {
    let result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    let user = result.rows[0];

    if (!user) {
      result = await pool.query(
        'INSERT INTO profiles (email, password, username, avatar_url, rank, reputation) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, username, rank',
        [email, 'SOCIAL_PROXY_AUTH', username, avatar_url, 'Bronze', 0]
      );
      user = result.rows[0];
    }

    const token = jwt.sign({ id: user.id, email: user.email, rank: user.rank, username: user.username }, JWT_SECRET);
    res.json({ user, token, platform });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, username, avatar_url as avatar, banner_url as banner, rank, reputation, created_at as joinDate, description FROM profiles WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CHAT ROUTES ---

app.get('/api/chat', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cm.*, p.username, p.rank as user_rank 
      FROM chat_messages cm 
      JOIN profiles p ON cm.user_id = p.id 
      ORDER BY cm.created_at DESC LIMIT 50
    `);
    res.json(result.rows.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat', authenticateToken, async (req, res) => {
  const { text } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO chat_messages (user_id, message_text) VALUES ($1, $2) RETURNING *',
      [req.user.id, text]
    );
    // Return with user info for immediate UI update
    const newMsg = result.rows[0];
    res.json({
      ...newMsg,
      username: req.user.username,
      user_rank: req.user.rank
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CONTENT ROUTES ---

app.get('/api/spreadsheets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM spreadsheets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sellers', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM trusted_sellers WHERE status = 'Trusted' ORDER BY rating DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROFILE UPDATE ---

app.put('/api/profile', authenticateToken, async (req, res) => {
  const { username, description, avatar_url, banner_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE profiles SET username = $1, description = $2, avatar_url = $3, banner_url = $4 WHERE id = $5 RETURNING *',
      [username, description, avatar_url, banner_url, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN ROUTES ---

// Get all users
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, rank, reputation, created_at FROM profiles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user rank
app.put('/api/admin/users/:userId/rank', authenticateToken, isAdmin, async (req, res) => {
  const { userId } = req.params;
  const { rank } = req.body;
  try {
    const result = await pool.query(
      'UPDATE profiles SET rank = $1 WHERE id = $2 RETURNING *',
      [rank, userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
app.delete('/api/admin/users/:userId', authenticateToken, isAdmin, async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query('DELETE FROM profiles WHERE id = $1', [userId]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SETTINGS ROUTES ---

// Get all settings
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settingsObj = {};
    result.rows.forEach(row => {
      settingsObj[row.key] = row.value;
    });
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save settings (Array of {key, value})
app.post('/api/admin/settings', authenticateToken, isAdmin, async (req, res) => {
  const settings = req.body; // Expecting [{key, value}, ...]
  try {
    for (const setting of settings) {
      await pool.query(
        'INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
        [setting.key, setting.value]
      );
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SPREADSHEETS ROUTES ---

// Get all spreadsheets
app.get('/api/spreadsheets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM spreadsheets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a spreadsheet
app.post('/api/spreadsheets', authenticateToken, isAdmin, async (req, res) => {
  const { title, description, url, category, author, items } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO spreadsheets (title, description, url, category, author, items) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, url, category, author, items]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a spreadsheet
app.delete('/api/spreadsheets/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM spreadsheets WHERE id = $1', [id]);
    res.json({ success: true, message: 'Spreadsheet deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 1688 API ROUTES ---



// Search products on 1688
app.get('/api/1688/search', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    console.log(`🔍 [1688 Search] Keyword: ${q}, Page: ${page}`);
    const result = await api1688.searchProducts(q, parseInt(page));

    if (result.success) {
      console.log(`✅ [1688 Search] Success, found ${result.data?.result?.resultList?.length || 0} items`);
      res.json(result.data);
    } else {
      console.error(`❌ [1688 Search] API Error:`, result.error);
      const statusCode = result.error?.status || 500;
      const errorMsg = typeof result.error === 'string' ? result.error : (result.error?.message || '1688 API is temporarily unavailable');
      res.status(statusCode).json({
        error: errorMsg,
        details: 'This usually happens due to API key limits or platform restrictions on 1688 servers.'
      });
    }
  } catch (err) {
    console.error(`❌ [1688 Search] Unexpected Error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Diagnostic route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    api1688: process.env.RAPIDAPI_KEY ? 'Configured' : 'Missing Key'
  });
});

// Get product details
app.get('/api/1688/product/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    const result = await api1688.getProductDetails(itemId);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get company/store contact
app.get('/api/1688/company-contact', async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    const result = await api1688.getCompanyContact(storeId);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get store information
app.get('/api/1688/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    const result = await api1688.getStoreInfo(storeId);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// Get item reviews
app.get('/api/1688/reviews/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { page = 1 } = req.query;
    console.log(`🔍 [Backend] Fetching reviews for item: ${itemId}, page: ${page}`);

    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    const result = await api1688.getItemReviews(itemId, parseInt(page));

    if (result.success) {
      console.log(`✅ [Backend] Reviews fetched successfully. Count: ${result.data.result?.items?.length || 0}`);
      res.json(result.data);
    } else {
      console.error(`❌ [Backend] Error fetching reviews:`, result.error);
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    console.error(`❌ [Backend] Unexpected error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});


// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 [ANYREPS V2] Server running on port ${PORT}`);
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🔐 Social Login Auth: ENABLED`);
});
