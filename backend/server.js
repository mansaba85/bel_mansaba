import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize, DataTypes, Model } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Multer setup for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads/audio');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database setup
const sequelize = new Sequelize(
  process.env.DB_NAME || 'school_bell',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

// Models
class Setting extends Model {}
Setting.init(
  {
    key: { type: DataTypes.STRING, primaryKey: true },
    value: { type: DataTypes.TEXT },
  },
  { sequelize, modelName: 'Setting' }
);

class Bell extends Model {}
Bell.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    category: { type: DataTypes.STRING },
    day: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING },
    time: { type: DataTypes.STRING },
    sound: { type: DataTypes.TEXT('long') },
    soundName: { type: DataTypes.STRING },
  },
  { sequelize, modelName: 'Bell' }
);

// Initial Data
const DEFAULT_SCHEDULES_DATA = {
  "Jadwal Normal": {
    "Senin": [
      { id: "s1", name: "Upacara Bendera", time: "07:00", sound: "", soundName: "Tidak ada suara" },
      { id: "s2", name: "Jam Pelajaran 1", time: "07:30", sound: "", soundName: "Tidak ada suara" },
      { id: "s3", name: "Istirahat Pertama", time: "09:30", sound: "", soundName: "Tidak ada suara" },
      { id: "s4", name: "Jam Pelajaran 3", time: "10:00", sound: "", soundName: "Tidak ada suara" },
      { id: "s5", name: "Pulang Sekolah", time: "13:00", sound: "", soundName: "Tidak ada suara" },
    ],
    "Selasa": [
      { id: "t1", name: "Masuk", time: "07:00", sound: "", soundName: "Tidak ada suara" },
      { id: "t2", name: "Pembacaan Al Quran", time: "07:05", sound: "", soundName: "Tidak ada suara" },
      { id: "t17", name: "Pulang", time: "15:15", sound: "", soundName: "Tidak ada suara" },
    ],
    "Rabu": [], "Kamis": [], "Jumat": [], "Sabtu": [], "Minggu": [],
  }
};

// Sync and populate
const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    await sequelize.sync({ alter: true });

    // Check if data exists, if not populate
    const settingCount = await Setting.count();
    if (settingCount === 0) {
      await Setting.create({ key: 'schoolName', value: 'MA NU 01 Banyuputih' });
      await Setting.create({ key: 'activeScheduleCategory', value: 'Jadwal Normal' });

      for (const category in DEFAULT_SCHEDULES_DATA) {
        for (const day in DEFAULT_SCHEDULES_DATA[category]) {
          for (const bell of DEFAULT_SCHEDULES_DATA[category][day]) {
            await Bell.create({
              ...bell,
              category,
              day,
            });
          }
        }
      }
      console.log('Default data populated.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

initDb();

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    const settings = await Setting.findAll();
    const bells = await Bell.findAll();

    const schoolName = settings.find(s => s.key === 'schoolName')?.value || 'MA NU 01 Banyuputih';
    const activeScheduleCategory = settings.find(s => s.key === 'activeScheduleCategory')?.value || '';

    const schedules = {};
    bells.forEach(bell => {
      if (!schedules[bell.category]) schedules[bell.category] = {};
      if (!schedules[bell.category][bell.day]) schedules[bell.category][bell.day] = [];
      schedules[bell.category][bell.day].push({
        id: bell.id,
        name: bell.name,
        time: bell.time,
        sound: bell.sound,
        soundName: bell.soundName,
      });
    });

    res.json({ schoolName, activeScheduleCategory, schedules });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/save', async (req, res) => {
  const { schoolName, activeScheduleCategory, schedules } = req.body;
  try {
    if (schoolName !== undefined) {
      await Setting.upsert({ key: 'schoolName', value: schoolName });
    }
    if (activeScheduleCategory !== undefined) {
      await Setting.upsert({ key: 'activeScheduleCategory', value: activeScheduleCategory });
    }
    if (schedules !== undefined) {
      await Bell.destroy({ where: {} });
      for (const category in schedules) {
        for (const day in schedules[category]) {
          for (const bell of schedules[category][day]) {
            await Bell.create({
              ...bell,
              category,
              day,
            });
          }
        }
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Audio Upload Endpoint
app.post('/api/upload-audio', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/audio/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.originalname });
});

// --- SERVE FRONTEND ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
