# EV HGV Charging Infrastructure System
## Technical Implementation Guide

---

## Quick Start Implementation Plan

### Step 1: Project Initialization

```bash
# Navigate to project directory
cd /home/user/webapp

# Create new Hono project with Cloudflare Pages template
npm create -y hono@latest . -- --template cloudflare-pages --install --pm npm

# Initialize git repository
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Install Additional Dependencies

```bash
# Install spatial analysis and mapping libraries
npm install --save-dev @types/geojson

# Note: Turf.js and Leaflet.js will be loaded via CDN in frontend
```

### Step 3: Database Schema Setup

Create Cloudflare D1 database and schema:

```bash
# Create production D1 database
npx wrangler d1 create hgv-charging-sites-production

# Copy the database_id to wrangler.jsonc
```

**migrations/0001_initial_schema.sql:**
```sql
-- Logistics Hubs (distribution centers, ports, rail freight terminals)
CREATE TABLE IF NOT EXISTS logistics_hubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'distribution_center', 'port', 'rail_freight', 'golden_triangle'
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  size_sqft INTEGER, -- warehouse size in square feet
  throughput_teu INTEGER, -- for ports: TEUs per year
  description TEXT,
  importance_score INTEGER DEFAULT 50, -- 0-100
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for spatial queries (simulated with lat/long)
CREATE INDEX IF NOT EXISTS idx_logistics_lat_long ON logistics_hubs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_logistics_type ON logistics_hubs(type);

-- O-License Operators (from DVSA data)
CREATE TABLE IF NOT EXISTS o_license_operators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operator_name TEXT NOT NULL,
  license_number TEXT UNIQUE,
  operating_center_address TEXT,
  latitude REAL,
  longitude REAL,
  vehicle_count INTEGER DEFAULT 0,
  license_type TEXT, -- 'standard_national', 'standard_international', 'restricted'
  postcode TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_operators_lat_long ON o_license_operators(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_operators_postcode ON o_license_operators(postcode);

-- Substations (cached from DNO APIs)
CREATE TABLE IF NOT EXISTS substations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dno_name TEXT, -- Distribution Network Operator
  substation_name TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  voltage_level TEXT, -- '132kV', '33kV', '11kV'
  capacity_mw REAL, -- Available capacity in MW
  generation_headroom_mw REAL,
  demand_headroom_mw REAL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dno_name, substation_name)
);

CREATE INDEX IF NOT EXISTS idx_substations_lat_long ON substations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_substations_capacity ON substations(capacity_mw);

-- Traffic Sites (cached from WebTRIS/DfT)
CREATE TABLE IF NOT EXISTS traffic_sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT UNIQUE NOT NULL, -- WebTRIS site ID
  site_name TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  road_name TEXT, -- 'M1', 'A1(M)', etc.
  hgv_aadf INTEGER, -- Annual Average Daily Flow for HGVs
  total_aadf INTEGER,
  data_year INTEGER,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_traffic_lat_long ON traffic_sites(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_traffic_road ON traffic_sites(road_name);

-- Planning Constraints (cached from planning.data.gov.uk, JNCC)
CREATE TABLE IF NOT EXISTS planning_constraints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  constraint_type TEXT NOT NULL, -- 'green_belt', 'national_park', 'aonb', 'sssi', 'conservation_area'
  name TEXT NOT NULL,
  geometry_wkt TEXT, -- Well-Known Text for polygon boundaries (simplified)
  centroid_lat REAL,
  centroid_lng REAL,
  severity TEXT DEFAULT 'high', -- 'high' (exclusion), 'medium' (penalty), 'low' (warning)
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_constraints_type ON planning_constraints(constraint_type);
CREATE INDEX IF NOT EXISTS idx_constraints_centroid ON planning_constraints(centroid_lat, centroid_lng);

-- User Analysis Results (saved searches)
CREATE TABLE IF NOT EXISTS analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_name TEXT,
  center_latitude REAL NOT NULL,
  center_longitude REAL NOT NULL,
  search_radius_km REAL DEFAULT 10,
  overall_score REAL, -- 0-100
  grid_score REAL,
  traffic_score REAL,
  logistics_score REAL,
  planning_score REAL,
  nearest_substation_id INTEGER,
  nearest_substation_distance_km REAL,
  nearest_hub_id INTEGER,
  nearest_hub_distance_km REAL,
  hgv_aadf_nearby INTEGER,
  planning_issues TEXT, -- JSON array of constraint types
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nearest_substation_id) REFERENCES substations(id),
  FOREIGN KEY (nearest_hub_id) REFERENCES logistics_hubs(id)
);

CREATE INDEX IF NOT EXISTS idx_results_score ON analysis_results(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_results_location ON analysis_results(center_latitude, center_longitude);

-- API Cache (for external API responses)
CREATE TABLE IF NOT EXISTS api_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,
  api_source TEXT NOT NULL, -- 'ukpn', 'webtris', 'dft_traffic', 'planning_data'
  response_data TEXT, -- JSON string
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON api_cache(expires_at);
```

**Seed data for major logistics hubs:**

**seed.sql:**
```sql
-- Major Logistics Hubs in UK
INSERT INTO logistics_hubs (name, type, latitude, longitude, size_sqft, importance_score, description) VALUES
  -- Golden Triangle
  ('Magna Park Lutterworth', 'golden_triangle', 52.4583, -1.2000, 13100000, 100, 'Europe''s largest logistics park'),
  ('DIRFT Rugby', 'golden_triangle', 52.4000, -1.1833, 8000000, 95, 'Daventry International Rail Freight Terminal'),
  ('Hams Hall Birmingham', 'golden_triangle', 52.5167, -1.7167, 5000000, 90, 'Major distribution hub near Birmingham'),
  ('East Midlands Gateway', 'rail_freight', 52.8333, -1.3167, 6000000, 85, 'Rail freight terminal'),
  ('Burton-upon-Trent Hub', 'distribution_center', 52.8071, -1.6368, 3000000, 80, 'Distribution hub cluster'),
  
  -- Major UK Ports
  ('Port of Felixstowe', 'port', 51.9567, 1.3517, NULL, 100, 'UK''s largest container port - 4M TEU/year'),
  ('Port of Southampton', 'port', 50.9097, -1.4044, NULL, 95, '1.5M TEU/year, major container and cruise port'),
  ('London Gateway', 'port', 51.5000, 0.5167, NULL, 90, 'Major container port on Thames'),
  ('Port of Immingham', 'port', 53.6333, -0.2167, NULL, 95, 'UK''s largest by tonnage - 46M tonnes/year'),
  ('Port of Liverpool', 'port', 53.4500, -3.0167, NULL, 85, 'Container and ro-ro traffic'),
  ('Port of Dover', 'port', 51.1167, 1.3167, NULL, 90, 'Major ro-ro and ferry port'),
  ('Port of Tilbury', 'port', 51.4625, 0.3711, NULL, 80, 'Container and bulk freight'),
  
  -- Other Strategic Locations
  ('Northampton Gateway', 'distribution_center', 52.2667, -0.9333, 2500000, 75, 'Strategic rail freight interchange'),
  ('East Midlands Airport Cargo', 'distribution_center', 52.8311, -1.3281, 1500000, 70, 'Air freight and distribution'),
  ('Doncaster iPort', 'rail_freight', 53.4833, -1.0167, 4000000, 75, 'Inland rail freight terminal');

-- Example traffic sites (these would be populated from WebTRIS API)
INSERT INTO traffic_sites (site_id, site_name, latitude, longitude, road_name, hgv_aadf, total_aadf, data_year) VALUES
  ('M1-001', 'M1 J19 Northbound', 52.2833, -0.9833, 'M1', 8500, 85000, 2024),
  ('M1-002', 'M1 J21 Southbound', 52.6333, -1.1500, 'M1', 9200, 92000, 2024),
  ('M6-001', 'M6 J10 Northbound', 52.6167, -1.9500, 'M6', 7800, 78000, 2024),
  ('A1M-001', 'A1(M) J40', 53.7833, -1.2333, 'A1(M)', 6500, 65000, 2024);

-- Example substations (these would be populated from DNO APIs)
INSERT INTO substations (dno_name, substation_name, latitude, longitude, voltage_level, capacity_mw, generation_headroom_mw, demand_headroom_mw) VALUES
  ('UK Power Networks', 'Lutterworth Primary', 52.4583, -1.2000, '33kV', 45.0, 15.0, 25.0),
  ('National Grid', 'Rugby Grid', 52.4000, -1.1833, '132kV', 120.0, 40.0, 60.0),
  ('UK Power Networks', 'Felixstowe Grid', 51.9567, 1.3517, '132kV', 150.0, 50.0, 70.0);

-- Planning constraints (simplified - actual data would be more complex)
INSERT INTO planning_constraints (constraint_type, name, centroid_lat, centroid_lng, severity) VALUES
  ('national_park', 'Peak District', 53.3500, -1.8333, 'high'),
  ('national_park', 'Lake District', 54.4667, -3.0833, 'high'),
  ('aonb', 'Cotswolds AONB', 51.9000, -1.9000, 'high'),
  ('green_belt', 'London Green Belt', 51.5074, -0.1278, 'high');
```

---

## Step 4: Hono Backend API Routes

**src/index.tsx:**
```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * GET /api/logistics-hubs
 * Get all logistics hubs or filter by type and radius
 */
app.get('/api/logistics-hubs', async (c) => {
  const { type, lat, lng, radius } = c.req.query()
  const db = c.env.DB

  let query = 'SELECT * FROM logistics_hubs'
  const params: any[] = []

  if (type) {
    query += ' WHERE type = ?'
    params.push(type)
  }

  query += ' ORDER BY importance_score DESC'

  const result = await db.prepare(query).bind(...params).all()

  // If lat/lng/radius provided, filter by distance (using Haversine in client)
  // For now, return all and let client filter with Turf.js
  
  return c.json({
    success: true,
    data: result.results,
    count: result.results?.length || 0
  })
})

/**
 * GET /api/substations
 * Get substations by location and capacity
 */
app.get('/api/substations', async (c) => {
  const { minCapacity, voltage } = c.req.query()
  const db = c.env.DB

  let query = 'SELECT * FROM substations WHERE 1=1'
  const params: any[] = []

  if (minCapacity) {
    query += ' AND capacity_mw >= ?'
    params.push(parseFloat(minCapacity))
  }

  if (voltage) {
    query += ' AND voltage_level = ?'
    params.push(voltage)
  }

  query += ' ORDER BY capacity_mw DESC'

  const result = await db.prepare(query).bind(...params).all()

  return c.json({
    success: true,
    data: result.results,
    count: result.results?.length || 0
  })
})

/**
 * GET /api/traffic-sites
 * Get traffic monitoring sites with HGV data
 */
app.get('/api/traffic-sites', async (c) => {
  const { road, minHGV } = c.req.query()
  const db = c.env.DB

  let query = 'SELECT * FROM traffic_sites WHERE 1=1'
  const params: any[] = []

  if (road) {
    query += ' AND road_name LIKE ?'
    params.push(`${road}%`)
  }

  if (minHGV) {
    query += ' AND hgv_aadf >= ?'
    params.push(parseInt(minHGV))
  }

  query += ' ORDER BY hgv_aadf DESC'

  const result = await db.prepare(query).bind(...params).all()

  return c.json({
    success: true,
    data: result.results,
    count: result.results?.length || 0
  })
})

/**
 * GET /api/planning-constraints
 * Get planning constraints by type
 */
app.get('/api/planning-constraints', async (c) => {
  const { type, severity } = c.req.query()
  const db = c.env.DB

  let query = 'SELECT * FROM planning_constraints WHERE 1=1'
  const params: any[] = []

  if (type) {
    query += ' AND constraint_type = ?'
    params.push(type)
  }

  if (severity) {
    query += ' AND severity = ?'
    params.push(severity)
  }

  const result = await db.prepare(query).bind(...params).all()

  return c.json({
    success: true,
    data: result.results,
    count: result.results?.length || 0
  })
})

/**
 * POST /api/analyze-site
 * Analyze a specific location for suitability
 * Client sends lat/lng, server aggregates nearby data
 */
app.post('/api/analyze-site', async (c) => {
  const { latitude, longitude, radius = 10 } = await c.req.json()
  const db = c.env.DB

  // This is a simplified version - actual implementation would use
  // Turf.js on client-side for precise distance calculations
  
  // Get nearby substations (within approx radius)
  const substations = await db.prepare(`
    SELECT *, 
           (ABS(latitude - ?) + ABS(longitude - ?)) as approx_distance
    FROM substations
    ORDER BY approx_distance
    LIMIT 10
  `).bind(latitude, longitude).all()

  // Get nearby logistics hubs
  const hubs = await db.prepare(`
    SELECT *,
           (ABS(latitude - ?) + ABS(longitude - ?)) as approx_distance
    FROM logistics_hubs
    ORDER BY approx_distance
    LIMIT 10
  `).bind(latitude, longitude).all()

  // Get nearby traffic sites
  const trafficSites = await db.prepare(`
    SELECT *,
           (ABS(latitude - ?) + ABS(longitude - ?)) as approx_distance
    FROM traffic_sites
    ORDER BY approx_distance
    LIMIT 10
  `).bind(latitude, longitude).all()

  return c.json({
    success: true,
    location: { latitude, longitude, radius },
    nearby: {
      substations: substations.results,
      logistics_hubs: hubs.results,
      traffic_sites: trafficSites.results
    },
    note: 'Use Turf.js on client for precise distance calculations and scoring'
  })
})

/**
 * POST /api/save-analysis
 * Save analysis result
 */
app.post('/api/save-analysis', async (c) => {
  const data = await c.req.json()
  const db = c.env.DB

  const result = await db.prepare(`
    INSERT INTO analysis_results (
      search_name, center_latitude, center_longitude,
      search_radius_km, overall_score, grid_score,
      traffic_score, logistics_score, planning_score,
      nearest_substation_distance_km, nearest_hub_distance_km,
      hgv_aadf_nearby, planning_issues
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.search_name,
    data.center_latitude,
    data.center_longitude,
    data.search_radius_km,
    data.overall_score,
    data.grid_score,
    data.traffic_score,
    data.logistics_score,
    data.planning_score,
    data.nearest_substation_distance_km,
    data.nearest_hub_distance_km,
    data.hgv_aadf_nearby,
    JSON.stringify(data.planning_issues)
  ).run()

  return c.json({
    success: true,
    id: result.meta.last_row_id
  })
})

/**
 * GET /api/saved-analyses
 * Get all saved analyses
 */
app.get('/api/saved-analyses', async (c) => {
  const db = c.env.DB

  const result = await db.prepare(`
    SELECT * FROM analysis_results
    ORDER BY overall_score DESC, created_at DESC
    LIMIT 100
  `).all()

  return c.json({
    success: true,
    data: result.results,
    count: result.results?.length || 0
  })
})

// ============================================================================
// EXTERNAL API PROXY ROUTES (with caching)
// ============================================================================

/**
 * GET /api/external/ukpn/substations
 * Proxy to UK Power Networks API with caching
 */
app.get('/api/external/ukpn/substations', async (c) => {
  const { lat, lng, radius = 5000 } = c.req.query()
  const db = c.env.DB

  const cacheKey = `ukpn_substations_${lat}_${lng}_${radius}`

  // Check cache first
  const cached = await db.prepare(`
    SELECT response_data FROM api_cache
    WHERE cache_key = ? AND expires_at > datetime('now')
  `).bind(cacheKey).first()

  if (cached) {
    return c.json(JSON.parse(cached.response_data as string))
  }

  // Fetch from UK Power Networks API
  const ukpnUrl = `https://ukpowernetworks.opendatasoft.com/api/records/1.0/search/`
    + `?dataset=grid-and-primary-sites`
    + `&geofilter.distance=${lat},${lng},${radius}`
    + `&rows=100`

  try {
    const response = await fetch(ukpnUrl)
    const data = await response.json()

    // Cache for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await db.prepare(`
      INSERT OR REPLACE INTO api_cache (cache_key, api_source, response_data, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(cacheKey, 'ukpn', JSON.stringify(data), expiresAt).run()

    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Failed to fetch from UK Power Networks API' }, 500)
  }
})

/**
 * GET /api/external/webtris/sites
 * Proxy to WebTRIS API
 */
app.get('/api/external/webtris/sites', async (c) => {
  const cacheKey = 'webtris_all_sites'

  // Check cache
  const cached = await c.env.DB.prepare(`
    SELECT response_data FROM api_cache
    WHERE cache_key = ? AND expires_at > datetime('now')
  `).bind(cacheKey).first()

  if (cached) {
    return c.json(JSON.parse(cached.response_data as string))
  }

  // Fetch from WebTRIS
  const webtrisUrl = 'http://webtris.nationalhighways.co.uk/api/v1.0/sites'

  try {
    const response = await fetch(webtrisUrl)
    const data = await response.json()

    // Cache for 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO api_cache (cache_key, api_source, response_data, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(cacheKey, 'webtris', JSON.stringify(data), expiresAt).run()

    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Failed to fetch from WebTRIS API' }, 500)
  }
})

// ============================================================================
// FRONTEND ROUTES
// ============================================================================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HGV Charging Infrastructure Site Selector</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@turf/turf@7/turf.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          #map { height: calc(100vh - 64px); }
          .sidebar { max-height: calc(100vh - 64px); overflow-y: auto; }
        </style>
    </head>
    <body class="bg-gray-100">
        <!-- Header -->
        <nav class="bg-blue-600 text-white p-4 shadow-lg">
            <div class="container mx-auto flex items-center justify-between">
                <h1 class="text-2xl font-bold">
                    <i class="fas fa-charging-station mr-2"></i>
                    HGV Charging Infrastructure Site Selector
                </h1>
                <div class="flex gap-4">
                    <button id="btnAbout" class="hover:bg-blue-700 px-4 py-2 rounded">
                        <i class="fas fa-info-circle mr-1"></i> About
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="flex">
            <!-- Sidebar -->
            <div class="w-96 bg-white shadow-lg sidebar p-4">
                <h2 class="text-xl font-bold mb-4">
                    <i class="fas fa-search mr-2"></i>
                    Site Analysis
                </h2>

                <!-- Search Form -->
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-2">
                        Search Location
                    </label>
                    <input 
                        type="text" 
                        id="searchInput" 
                        placeholder="Enter postcode or click map..."
                        class="w-full p-2 border rounded"
                    />
                    <button id="btnSearch" class="w-full mt-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                        <i class="fas fa-search mr-1"></i> Analyze Location
                    </button>
                </div>

                <!-- Layers Control -->
                <div class="mb-6">
                    <h3 class="font-bold mb-2">Map Layers</h3>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="checkbox" id="layerSubstations" checked class="mr-2">
                            <i class="fas fa-bolt text-yellow-500 mr-1"></i>
                            Substations
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="layerHubs" checked class="mr-2">
                            <i class="fas fa-warehouse text-purple-500 mr-1"></i>
                            Logistics Hubs
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="layerTraffic" checked class="mr-2">
                            <i class="fas fa-truck text-blue-500 mr-1"></i>
                            Traffic Sites
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="layerConstraints" class="mr-2">
                            <i class="fas fa-exclamation-triangle text-red-500 mr-1"></i>
                            Planning Constraints
                        </label>
                    </div>
                </div>

                <!-- Results Panel -->
                <div id="resultsPanel" class="hidden">
                    <h3 class="font-bold mb-2">Analysis Results</h3>
                    <div class="bg-gray-50 p-4 rounded">
                        <div class="mb-4">
                            <div class="text-center">
                                <div id="overallScore" class="text-4xl font-bold text-blue-600">--</div>
                                <div class="text-sm text-gray-600">Overall Score</div>
                            </div>
                        </div>
                        
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span><i class="fas fa-bolt text-yellow-500"></i> Grid Capacity:</span>
                                <span id="gridScore" class="font-bold">--</span>
                            </div>
                            <div class="flex justify-between">
                                <span><i class="fas fa-truck text-blue-500"></i> Traffic Flow:</span>
                                <span id="trafficScore" class="font-bold">--</span>
                            </div>
                            <div class="flex justify-between">
                                <span><i class="fas fa-warehouse text-purple-500"></i> Logistics:</span>
                                <span id="logisticsScore" class="font-bold">--</span>
                            </div>
                            <div class="flex justify-between">
                                <span><i class="fas fa-file-alt text-green-500"></i> Planning:</span>
                                <span id="planningScore" class="font-bold">--</span>
                            </div>
                        </div>

                        <button id="btnSaveAnalysis" class="w-full mt-4 bg-green-600 text-white p-2 rounded hover:bg-green-700">
                            <i class="fas fa-save mr-1"></i> Save Analysis
                        </button>
                    </div>
                </div>

                <!-- Saved Analyses -->
                <div class="mt-6">
                    <h3 class="font-bold mb-2">Saved Analyses</h3>
                    <div id="savedList" class="space-y-2">
                        <!-- Populated dynamically -->
                    </div>
                </div>
            </div>

            <!-- Map -->
            <div class="flex-1">
                <div id="map"></div>
            </div>
        </div>

        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
```

---

## Step 5: Frontend JavaScript (Turf.js Spatial Analysis)

**public/static/app.js:**
```javascript
// ============================================================================
// HGV Charging Infrastructure Site Selector - Frontend Application
// ============================================================================

let map
let markers = {
  substations: L.layerGroup(),
  hubs: L.layerGroup(),
  traffic: L.layerGroup(),
  constraints: L.layerGroup(),
  search: L.layerGroup()
}

// ============================================================================
// Initialize Map
// ============================================================================

function initMap() {
  // Center on UK
  map = L.map('map').setView([52.5, -1.5], 7)

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  // Add layer groups
  Object.values(markers).forEach(layer => layer.addTo(map))

  // Click handler for map
  map.on('click', (e) => {
    analyzeLocation(e.latlng.lat, e.latlng.lng)
  })

  // Load initial data
  loadLogisticsHubs()
  loadSubstations()
  loadTrafficSites()
}

// ============================================================================
// Data Loading Functions
// ============================================================================

async function loadLogisticsHubs() {
  try {
    const response = await axios.get('/api/logistics-hubs')
    const hubs = response.data.data

    markers.hubs.clearLayers()

    hubs.forEach(hub => {
      const icon = L.divIcon({
        html: '<i class="fas fa-warehouse text-purple-600 text-2xl"></i>',
        className: 'custom-marker',
        iconSize: [30, 30]
      })

      const marker = L.marker([hub.latitude, hub.longitude], { icon })
        .bindPopup(`
          <div class="p-2">
            <h4 class="font-bold">${hub.name}</h4>
            <p class="text-sm">${hub.type.replace('_', ' ')}</p>
            <p class="text-sm">Score: ${hub.importance_score}/100</p>
            ${hub.size_sqft ? `<p class="text-xs">Size: ${(hub.size_sqft/1000000).toFixed(1)}M sqft</p>` : ''}
          </div>
        `)

      markers.hubs.addLayer(marker)
    })
  } catch (error) {
    console.error('Failed to load logistics hubs:', error)
  }
}

async function loadSubstations() {
  try {
    const response = await axios.get('/api/substations')
    const substations = response.data.data

    markers.substations.clearLayers()

    substations.forEach(sub => {
      const icon = L.divIcon({
        html: '<i class="fas fa-bolt text-yellow-500 text-2xl"></i>',
        className: 'custom-marker',
        iconSize: [30, 30]
      })

      const marker = L.marker([sub.latitude, sub.longitude], { icon })
        .bindPopup(`
          <div class="p-2">
            <h4 class="font-bold">${sub.substation_name}</h4>
            <p class="text-sm">${sub.dno_name}</p>
            <p class="text-sm">Voltage: ${sub.voltage_level}</p>
            <p class="text-sm">Capacity: ${sub.capacity_mw} MW</p>
            <p class="text-sm">Headroom: ${sub.demand_headroom_mw} MW</p>
          </div>
        `)

      markers.substations.addLayer(marker)
    })
  } catch (error) {
    console.error('Failed to load substations:', error)
  }
}

async function loadTrafficSites() {
  try {
    const response = await axios.get('/api/traffic-sites')
    const sites = response.data.data

    markers.traffic.clearLayers()

    sites.forEach(site => {
      const icon = L.divIcon({
        html: '<i class="fas fa-truck text-blue-500 text-xl"></i>',
        className: 'custom-marker',
        iconSize: [30, 30]
      })

      const marker = L.marker([site.latitude, site.longitude], { icon })
        .bindPopup(`
          <div class="p-2">
            <h4 class="font-bold">${site.site_name}</h4>
            <p class="text-sm">${site.road_name}</p>
            <p class="text-sm">HGV AADF: ${site.hgv_aadf.toLocaleString()}</p>
            <p class="text-sm">Total AADF: ${site.total_aadf.toLocaleString()}</p>
            <p class="text-xs">Data: ${site.data_year}</p>
          </div>
        `)

      markers.traffic.addLayer(marker)
    })
  } catch (error) {
    console.error('Failed to load traffic sites:', error)
  }
}

// ============================================================================
// Site Analysis with Turf.js
// ============================================================================

async function analyzeLocation(lat, lng) {
  // Clear previous search marker
  markers.search.clearLayers()

  // Add search marker
  const searchIcon = L.divIcon({
    html: '<i class="fas fa-map-marker-alt text-red-500 text-3xl"></i>',
    className: 'custom-marker',
    iconSize: [30, 40]
  })

  L.marker([lat, lng], { icon: searchIcon })
    .bindPopup('<b>Analysis Point</b>')
    .addTo(markers.search)

  // Fetch nearby data
  const response = await axios.post('/api/analyze-site', {
    latitude: lat,
    longitude: lng,
    radius: 10
  })

  const nearby = response.data.nearby

  // Calculate scores using Turf.js
  const scores = calculateSiteScores(
    { lat, lng },
    nearby.substations,
    nearby.logistics_hubs,
    nearby.traffic_sites
  )

  // Display results
  displayResults(scores)

  // Draw analysis circles
  drawAnalysisCircles(lat, lng)
}

function calculateSiteScores(point, substations, hubs, trafficSites) {
  const searchPoint = turf.point([point.lng, point.lat])

  // ===== GRID CAPACITY SCORE (0-100) =====
  let gridScore = 0
  let nearestSubstation = null
  let minSubDistance = Infinity

  substations.forEach(sub => {
    const subPoint = turf.point([sub.longitude, sub.latitude])
    const distance = turf.distance(searchPoint, subPoint, { units: 'kilometers' })

    if (distance < minSubDistance) {
      minSubDistance = distance
      nearestSubstation = sub
    }
  })

  if (nearestSubstation) {
    // Distance score (0-100): <1km=100, 1-2km=75, 2-5km=50, >5km=0
    let distanceScore = 0
    if (minSubDistance < 1) distanceScore = 100
    else if (minSubDistance < 2) distanceScore = 75
    else if (minSubDistance < 5) distanceScore = 50

    // Capacity score (0-100)
    let capacityScore = 0
    if (nearestSubstation.capacity_mw > 50) capacityScore = 100
    else if (nearestSubstation.capacity_mw > 20) capacityScore = 75
    else if (nearestSubstation.capacity_mw > 10) capacityScore = 50
    else capacityScore = 25

    // Voltage score (0-100)
    let voltageScore = 50
    if (nearestSubstation.voltage_level === '132kV') voltageScore = 100
    else if (nearestSubstation.voltage_level === '33kV') voltageScore = 75

    gridScore = (distanceScore + capacityScore + voltageScore) / 3
  }

  // ===== LOGISTICS SCORE (0-100) =====
  let logisticsScore = 0
  let nearestHub = null
  let minHubDistance = Infinity

  hubs.forEach(hub => {
    const hubPoint = turf.point([hub.longitude, hub.latitude])
    const distance = turf.distance(searchPoint, hubPoint, { units: 'kilometers' })

    if (distance < minHubDistance) {
      minHubDistance = distance
      nearestHub = hub
    }
  })

  if (nearestHub) {
    // Distance score
    let distanceScore = 0
    if (minHubDistance < 2) distanceScore = 100
    else if (minHubDistance < 5) distanceScore = 75
    else if (minHubDistance < 10) distanceScore = 50
    else distanceScore = 25

    // Importance score
    let importanceScore = nearestHub.importance_score || 50

    // Hub type bonus
    let typeBonus = 0
    if (nearestHub.type === 'port' && minHubDistance < 10) typeBonus = 15
    if (nearestHub.type === 'golden_triangle') typeBonus = 10

    logisticsScore = Math.min(100, (distanceScore + importanceScore) / 2 + typeBonus)
  }

  // ===== TRAFFIC SCORE (0-100) =====
  let trafficScore = 0
  let maxHGV = 0
  let nearestTrafficDistance = Infinity

  trafficSites.forEach(site => {
    const sitePoint = turf.point([site.longitude, site.latitude])
    const distance = turf.distance(searchPoint, sitePoint, { units: 'kilometers' })

    if (site.hgv_aadf > maxHGV || distance < nearestTrafficDistance) {
      maxHGV = Math.max(maxHGV, site.hgv_aadf)
      nearestTrafficDistance = Math.min(nearestTrafficDistance, distance)
    }
  })

  // HGV volume score
  let volumeScore = 0
  if (maxHGV > 5000) volumeScore = 100
  else if (maxHGV > 2000) volumeScore = 75
  else if (maxHGV > 1000) volumeScore = 50
  else volumeScore = 25

  // Distance to traffic score
  let proximityScore = 0
  if (nearestTrafficDistance < 0.5) proximityScore = 100
  else if (nearestTrafficDistance < 1) proximityScore = 75
  else if (nearestTrafficDistance < 2) proximityScore = 50
  else proximityScore = 25

  trafficScore = (volumeScore + proximityScore) / 2

  // ===== PLANNING SCORE (0-100) =====
  // Simplified - would need actual constraint checking with Turf.js point-in-polygon
  let planningScore = 75 // Assume moderate feasibility for demo

  // ===== OVERALL SCORE =====
  const overallScore = (
    gridScore * 0.30 +
    trafficScore * 0.25 +
    logisticsScore * 0.25 +
    planningScore * 0.20
  )

  return {
    overall: Math.round(overallScore),
    grid: Math.round(gridScore),
    traffic: Math.round(trafficScore),
    logistics: Math.round(logisticsScore),
    planning: Math.round(planningScore),
    details: {
      nearestSubstation: nearestSubstation ? {
        name: nearestSubstation.substation_name,
        distance: minSubDistance.toFixed(2)
      } : null,
      nearestHub: nearestHub ? {
        name: nearestHub.name,
        distance: minHubDistance.toFixed(2)
      } : null,
      maxHGV: maxHGV
    }
  }
}

function displayResults(scores) {
  document.getElementById('resultsPanel').classList.remove('hidden')
  
  // Color-code overall score
  const overallEl = document.getElementById('overallScore')
  overallEl.textContent = scores.overall
  
  if (scores.overall >= 90) overallEl.className = 'text-4xl font-bold text-green-600'
  else if (scores.overall >= 75) overallEl.className = 'text-4xl font-bold text-blue-600'
  else if (scores.overall >= 60) overallEl.className = 'text-4xl font-bold text-yellow-600'
  else overallEl.className = 'text-4xl font-bold text-red-600'

  document.getElementById('gridScore').textContent = scores.grid
  document.getElementById('trafficScore').textContent = scores.traffic
  document.getElementById('logisticsScore').textContent = scores.logistics
  document.getElementById('planningScore').textContent = scores.planning
}

function drawAnalysisCircles(lat, lng) {
  // Draw 5km and 10km radius circles
  const center = [lng, lat]
  
  const circle5km = turf.circle(center, 5, { units: 'kilometers' })
  const circle10km = turf.circle(center, 10, { units: 'kilometers' })

  L.geoJSON(circle5km, {
    style: { color: 'blue', weight: 2, fillOpacity: 0.1 }
  }).addTo(markers.search)

  L.geoJSON(circle10km, {
    style: { color: 'purple', weight: 2, fillOpacity: 0.05 }
  }).addTo(markers.search)
}

// ============================================================================
// Event Handlers
// ============================================================================

document.getElementById('btnSearch').addEventListener('click', () => {
  const input = document.getElementById('searchInput').value
  // Would implement postcode lookup here
  alert('Postcode search not yet implemented. Click on the map to analyze a location.')
})

document.getElementById('layerSubstations').addEventListener('change', (e) => {
  if (e.target.checked) map.addLayer(markers.substations)
  else map.removeLayer(markers.substations)
})

document.getElementById('layerHubs').addEventListener('change', (e) => {
  if (e.target.checked) map.addLayer(markers.hubs)
  else map.removeLayer(markers.hubs)
})

document.getElementById('layerTraffic').addEventListener('change', (e) => {
  if (e.target.checked) map.addLayer(markers.traffic)
  else map.removeLayer(markers.traffic)
})

// ============================================================================
// Initialize
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initMap()
})
```

---

## Step 6: Deployment Commands

```bash
# Local development
cd /home/user/webapp
npm run build
pm2 start ecosystem.config.cjs

# Apply D1 migrations locally
npm run db:migrate:local

# Seed local database
npm run db:seed

# Production deployment to Cloudflare
npx wrangler pages deploy dist --project-name hgv-charging-sites

# Deploy D1 database migrations to production
npx wrangler d1 migrations apply hgv-charging-sites-production
```

---

## Step 7: Next Steps

1. **Import O-License Data:** Create a script to import your O-license CSV data
2. **Enhance Planning Constraints:** Add point-in-polygon checks with actual constraint geometries
3. **API Integration:** Complete WebTRIS and DfT API integration
4. **Advanced Scoring:** Refine the scoring algorithm based on real-world data
5. **Export Features:** Add PDF report generation and CSV export
6. **User Accounts:** Implement authentication for saved analyses
7. **Mobile Optimization:** Responsive design for field use

---

This implementation provides a solid foundation for your HGV charging infrastructure site selector. The system uses Turf.js for all spatial calculations, avoiding the need for server-side spatial databases while maintaining excellent performance on Cloudflare Pages.
