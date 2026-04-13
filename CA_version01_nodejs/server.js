const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');

// Load env vars in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_PASSCODE = "astra2026";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialize database table
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS news_items (
                id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                date VARCHAR(255)
            );
        `);

        // Check if empty to add seed data
        const { rows } = await pool.query('SELECT COUNT(*) FROM news_items');
        if (parseInt(rows[0].count) === 0) {
            const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            await pool.query(
                'INSERT INTO news_items (id, title, content, date) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)',
                [
                    uuidv4(), 'Tax Deadline Approaching', 'The deadline for filing personal income tax returns is coming up soon. Ensure all your documents are ready.', dateStr,
                    uuidv4(), 'New GST Rates Announced', 'The government has announced revised GST rates for selected goods and services effective next month.', dateStr
                ]
            );
            console.log("Database seeded with initial news");
        }
        console.log("Database initialized successfully");
    } catch (err) {
        console.error("Database initialization failed:", err);
    }
}
initDatabase();

// --- API Endpoints ---

// Verify Admin Passcode
app.post('/api/news/verify', (req, res) => {
    const passcode = req.header('X-Admin-Passcode');
    if (passcode === ADMIN_PASSCODE) {
        return res.status(200).send();
    }
    return res.status(401).send('Invalid passcode');
});

// Middleware for admin routes
const requireAdmin = (req, res, next) => {
    const passcode = req.header('X-Admin-Passcode');
    if (passcode === ADMIN_PASSCODE) {
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
};

// Get All News
app.get('/api/news', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM news_items ORDER BY date DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add News
app.post('/api/news', requireAdmin, async (req, res) => {
    try {
        const { title, content } = req.body;
        const id = uuidv4();
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        
        const result = await pool.query(
            'INSERT INTO news_items (id, title, content, date) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, title, content, dateStr]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update News
app.put('/api/news/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, date } = req.body;
        
        let query = 'UPDATE news_items SET title = $1, content = $2 WHERE id = $3 RETURNING *';
        let values = [title, content, id];
        
        if (date) {
            query = 'UPDATE news_items SET title = $1, content = $2, date = $3 WHERE id = $4 RETURNING *';
            values = [title, content, date, id];
        }

        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).send();
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete News
app.delete('/api/news/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM news_items WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).send();
        }
        res.status(200).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
