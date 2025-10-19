-- HGV Charging Infrastructure Site Selection System
-- Initial Database Schema

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
