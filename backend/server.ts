import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize, DataTypes, Model } from 'sequelize';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'audio');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database setup
const dbDialect = (process.env.DB_DIALECT as any) || 'mysql';
const isSqlite = dbDialect === 'sqlite';

const sequelize = isSqlite 
  ? new Sequelize({
      dialect: 'sqlite',
      storage: path.join(process.cwd(), 'database.sqlite'),
      logging: false,
    })
  : new Sequelize(
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
class Setting extends Model {
  public key!: string;
  public value!: string;
}
Setting.init(
  {
    key: { type: DataTypes.STRING, primaryKey: true },
    value: { type: DataTypes.TEXT },
  },
  { sequelize, modelName: 'Setting' }
);

class Category extends Model {
  public db_id!: number;
  public name!: string;
}
Category.init(
  {
    db_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
  },
  { sequelize, modelName: 'Category' }
);

class Bell extends Model {
  public db_id!: number;
  public id!: string;
  public category!: string;
  public day!: string;
  public name!: string;
  public time!: string;
  public sound!: string;
  public soundName!: string;
}
Bell.init(
  {
    db_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id: { type: DataTypes.STRING },
    category: { type: DataTypes.STRING },
    day: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING },
    time: { type: DataTypes.STRING },
    sound: { type: DataTypes.TEXT('long') }, // Use LONGTEXT for large audio files
    soundName: { type: DataTypes.STRING },
  },
  { sequelize, modelName: 'Bell' }
);

// Initial Data
const DEFAULT_SCHEDULES_DATA: any = {
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
    
    // Use alter: true to keep data while updating schema
    // We used force: true once to fix the primary key issue
    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');

    // Check if data exists, if not populate
    const categoryCount = await Category.count();
    if (categoryCount === 0) {
      await Setting.create({ key: 'schoolName', value: 'MA NU 01 Banyuputih' });
      await Setting.create({ key: 'activeScheduleCategory', value: 'Jadwal Normal' });

      for (const categoryName in DEFAULT_SCHEDULES_DATA) {
        await Category.create({ name: categoryName });
        for (const day in DEFAULT_SCHEDULES_DATA[categoryName]) {
          for (const bell of DEFAULT_SCHEDULES_DATA[categoryName][day]) {
            await Bell.create({
              ...bell,
              category: categoryName,
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
app.post('/api/upload-audio', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/audio/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.originalname });
});

app.get('/api/data', async (req, res) => {
  try {
    const settings = await Setting.findAll();
    const categories = await Category.findAll();
    const bells = await Bell.findAll();

    const schoolName = settings.find(s => s.key === 'schoolName')?.value || 'MA NU 01 Banyuputih';
    const activeScheduleCategory = settings.find(s => s.key === 'activeScheduleCategory')?.value || '';

    const schedules: any = {};
    // Initialize all categories with empty days
    categories.forEach(cat => {
      if (!cat.name || cat.name === 'undefined' || cat.name === 'null') return;
      schedules[cat.name] = {};
      const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      DAYS.forEach(day => {
        schedules[cat.name][day] = [];
      });
    });

    // Fill in the bells
    bells.forEach(bell => {
      if (schedules[bell.category]) {
        schedules[bell.category][bell.day].push({
          id: bell.id,
          name: bell.name,
          time: bell.time,
          sound: bell.sound,
          soundName: bell.soundName,
        });
      }
    });

    res.json({ schoolName, activeScheduleCategory, schedules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/save', async (req, res) => {
  const { schoolName, activeScheduleCategory, schedules } = req.body;
  console.log('Received save request for:', schoolName);
  
  const transaction = await sequelize.transaction();
  
  try {
    if (schoolName !== undefined) {
      await Setting.upsert({ key: 'schoolName', value: schoolName }, { transaction });
    }
    if (activeScheduleCategory !== undefined) {
      await Setting.upsert({ key: 'activeScheduleCategory', value: activeScheduleCategory }, { transaction });
    }

    if (schedules !== undefined) {
      // Update categories
      await Category.destroy({ where: {}, transaction });
      for (const categoryName in schedules) {
        if (!categoryName || categoryName === 'undefined' || categoryName === 'null' || categoryName === '') continue;
        await Category.create({ name: categoryName }, { transaction });
      }

      // Update bells
      await Bell.destroy({ where: {}, transaction });
      let bellCount = 0;
      for (const category in schedules) {
        if (!category || category === 'undefined' || category === 'null' || category === '') continue;
        for (const day in schedules[category]) {
          if (!schedules[category][day]) continue;
          for (const bell of schedules[category][day]) {
            if (!bell || !bell.id) continue;
            
            // LOG EACH BELL BEING SAVED WITH FULL DATA
            console.log('DB SAVE FULL BELL DATA:', JSON.stringify(bell));
            
            await Bell.create({
              id: bell.id,
              name: bell.name || 'Bel Tanpa Nama',
              time: bell.time || '00:00',
              sound: bell.sound || '',
              soundName: bell.soundName || 'Tidak ada suara',
              category,
              day,
            }, { transaction });
            bellCount++;
          }
        }
      }
      console.log(`Saved ${bellCount} bells to database`);
    }
    
    await transaction.commit();
    res.json({ success: true });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Failed to save data. Full error:', error);
    
    let details = error.message;
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      details = error.errors.map((e: any) => e.message).join(', ');
    }
    
    res.status(500).json({ 
      error: 'Failed to save data', 
      details: details
    });
  }
});

// --- SERVE FRONTEND ---
async function setupFrontend(app: express.Application) {
  const isProd = process.env.NODE_ENV === 'production';
  const rootDir = process.cwd(); // Use process.cwd() for more reliable pathing
  
  console.log(`Frontend Setup: isProd=${isProd}, rootDir=${rootDir}`);
  
  if (!isProd) {
    try {
      console.log('Attempting to initialize Vite middleware...');
      // Dynamic import to avoid crash in production if vite is not installed
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
        root: rootDir
      });
      app.use(vite.middlewares);
      console.log('Vite middleware enabled successfully');
    } catch (err) {
      console.error('CRITICAL: Failed to initialize Vite middleware:', err);
      app.get('/', (req, res) => {
        res.status(500).send('Vite development server failed to start. Check server logs.');
      });
    }
  } else {
    const distPath = path.join(rootDir, 'dist');
    console.log('Production Mode: Looking for dist at', distPath);
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log('Static production serving enabled');
    } else {
      console.error('CRITICAL: Production dist folder NOT FOUND at', distPath);
      app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
          res.status(404).send(`
            <h1>Frontend Build Not Found</h1>
            <p>Please run <code>npm run build</code> on your server to generate the production files.</p>
            <p>Current Directory: ${rootDir}</p>
            <p>Expected Dist Path: ${distPath}</p>
          `);
        }
      });
    }
  }
  
  // Final fallback to prevent "Cannot GET /"
  app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
      res.status(404).send('Resource not found. If this is the homepage, the frontend failed to load.');
    }
  });
}

console.log('Starting server initialization...');
setupFrontend(app).finally(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
});
