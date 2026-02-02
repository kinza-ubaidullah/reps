import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as DiscordStrategy } from 'passport-discord';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const getBackendUrl = () => {
    if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
    // If we are on Railway, use the production domain
    if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PUBLIC_DOMAIN) {
        return 'https://reps-production.up.railway.app';
    }
    return `http://localhost:${process.env.PORT || 3001}`;
};

const BACKEND_URL = getBackendUrl();
console.log(`[Passport] Callback Base URL: ${BACKEND_URL}`);

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const username = profile.displayName;
                const avatar_url = profile.photos[0]?.value;
                const google_id = profile.id;

                // Check if user exists with this Google ID
                let result = await pool.query('SELECT * FROM profiles WHERE google_id = $1', [google_id]);
                let user = result.rows[0];

                if (!user) {
                    // Check if email exists
                    result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
                    user = result.rows[0];

                    if (user) {
                        // Link Google ID to existing account
                        await pool.query(
                            'UPDATE profiles SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3',
                            [google_id, avatar_url, user.id]
                        );
                    } else {
                        // Create new user
                        const insertRes = await pool.query(
                            'INSERT INTO profiles (email, password, username, avatar_url, google_id, rank, reputation) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                            [email, 'GOOGLE_AUTH', username, avatar_url, google_id, 'Bronze', 0]
                        );
                        user = insertRes.rows[0];
                    }
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Discord OAuth Strategy
passport.use(
    new DiscordStrategy(
        {
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: `${BACKEND_URL}/api/auth/discord/callback`,
            scope: ['identify', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.email;
                const username = profile.username;
                const avatar_url = profile.avatar
                    ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                    : 'https://assets-global.website-files.com/6257adef93867e3ed14ed604/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png';
                const discord_id = profile.id;

                // Check if user exists with this Discord ID
                let result = await pool.query('SELECT * FROM profiles WHERE discord_id = $1', [discord_id]);
                let user = result.rows[0];

                if (!user) {
                    // Check if email exists
                    result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
                    user = result.rows[0];

                    if (user) {
                        // Link Discord ID to existing account
                        await pool.query(
                            'UPDATE profiles SET discord_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3',
                            [discord_id, avatar_url, user.id]
                        );
                    } else {
                        // Create new user
                        const insertRes = await pool.query(
                            'INSERT INTO profiles (email, password, username, avatar_url, discord_id, rank, reputation) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                            [email, 'DISCORD_AUTH', username, avatar_url, discord_id, 'Bronze', 0]
                        );
                        user = insertRes.rows[0];
                    }
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
