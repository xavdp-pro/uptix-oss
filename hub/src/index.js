import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import pool from './database.js';
import { sendAlertEmail } from './alerts.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const lastAlertState = new Map();

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token });
    }
    res.status(401).json({ error: 'Invalid password' });
});

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

app.get('/api/servers', authMiddleware, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM servers ORDER BY last_ping DESC');
    res.json(rows);
});

app.post('/api/servers/:id/maintenance', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { is_maintenance } = req.body;
    await pool.query('UPDATE servers SET is_maintenance = ? WHERE id = ?', [is_maintenance ? 1 : 0, id]);
    res.json({ success: true, is_maintenance });
});

io.on('connection', (socket) => {
    socket.on('agent_metrics', async (data) => {
        const { server_name, cpu_usage, ram_usage, disk_usage, sites } = data;
        const [existingServer] = await pool.query('SELECT id, is_maintenance FROM servers WHERE name = ?', [server_name]);
        let serverId;
        let isMaintenance = false;
        if (existingServer.length > 0) {
            serverId = existingServer[0].id;
            isMaintenance = existingServer[0].is_maintenance === 1;
            await pool.query('UPDATE servers SET last_ping = NOW() WHERE id = ?', [serverId]);
        } else {
            const [result] = await pool.query('INSERT INTO servers (name, last_ping) VALUES (?, NOW())', [server_name]);
            serverId = result.insertId;
        }
        await pool.query('INSERT INTO metrics (server_id, cpu_usage, ram_usage, disk_usage) VALUES (?, ?, ?, ?)', [serverId, cpu_usage, ram_usage, disk_usage]);
        if (sites && Array.isArray(sites)) {
            for (const site of sites) {
                const [existingSite] = await pool.query('SELECT id, status FROM sites WHERE url = ? AND server_id = ?', [site.url, serverId]);
                let oldStatus = null;
                if (existingSite.length > 0) {
                    oldStatus = existingSite[0].status;
                    await pool.query('UPDATE sites SET status = ?, last_check = NOW() WHERE id = ?', [site.status, existingSite[0].id]);
                } else {
                    await pool.query('INSERT INTO sites (server_id, url, status, last_check) VALUES (?, ?, ?, NOW())', [serverId, site.url, site.status]);
                }
                if (!isMaintenance && oldStatus && oldStatus !== site.status) {
                    sendAlertEmail(`Site ${site.status}: ${site.url}`, `The status of ${site.url} monitored by ${server_name} has changed from ${oldStatus} to ${site.status}.`);
                }
            }
        }
        if (!isMaintenance && cpu_usage > 90) {
            const alertKey = `${server_name}_cpu`;
            const now = Date.now();
            if (!lastAlertState.has(alertKey) || now - lastAlertState.get(alertKey) > 3600000) {
                sendAlertEmail(`High CPU Usage on ${server_name}`, `Critical: CPU usage on ${server_name} is at ${cpu_usage.toFixed(1)}%.`);
                lastAlertState.set(alertKey, now);
            }
        }
        io.emit('metrics_update', { serverId, serverName: server_name, cpu_usage, ram_usage, disk_usage, sites, is_maintenance: isMaintenance, timestamp: new Date() });
    });
});

httpServer.listen(PORT, () => console.log(`OSS Hub running on port ${PORT}`));
