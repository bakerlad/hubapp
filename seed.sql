-- Seed Data for HGV Charging Infrastructure System

-- Major Logistics Hubs in UK
INSERT INTO logistics_hubs (name, type, latitude, longitude, size_sqft, importance_score, description) VALUES
  -- Golden Triangle
  ('Magna Park Lutterworth', 'golden_triangle', 52.4583, -1.2000, 13100000, 100, 'Europe''s largest logistics park - 13.1M sqft'),
  ('DIRFT Rugby', 'golden_triangle', 52.4000, -1.1833, 8000000, 95, 'Daventry International Rail Freight Terminal - 8M sqft, rail-connected'),
  ('Hams Hall Birmingham', 'golden_triangle', 52.5167, -1.7167, 5000000, 90, 'Major distribution hub near Birmingham - 5M sqft'),
  ('East Midlands Gateway', 'rail_freight', 52.8333, -1.3167, 6000000, 85, 'Rail freight terminal with strategic road connections - 6M sqft'),
  ('Burton-upon-Trent Hub', 'distribution_center', 52.8071, -1.6368, 3000000, 80, 'Distribution hub cluster in Burton'),
  
  -- Major UK Ports
  ('Port of Felixstowe', 'port', 51.9567, 1.3517, NULL, 100, 'UK''s largest container port - 4M TEU/year, 48% of UK container trade'),
  ('Port of Southampton', 'port', 50.9097, -1.4044, NULL, 95, '1.5M TEU/year - Second largest container terminal'),
  ('London Gateway', 'port', 51.5000, 0.5167, NULL, 90, 'Major container port on Thames - Modern deep-sea facility'),
  ('Port of Immingham', 'port', 53.6333, -0.2167, NULL, 95, 'UK''s largest by tonnage - 46M tonnes/year'),
  ('Port of Liverpool', 'port', 53.4500, -3.0167, NULL, 85, 'Container and ro-ro traffic - Major North West port'),
  ('Port of Dover', 'port', 51.1167, 1.3167, NULL, 90, 'Major ro-ro and ferry port - Key Channel crossing'),
  ('Port of Tilbury', 'port', 51.4625, 0.3711, NULL, 80, 'Container and bulk freight on Thames'),
  
  -- Other Strategic Locations
  ('Northampton Gateway', 'distribution_center', 52.2667, -0.9333, 2500000, 75, 'Strategic rail freight interchange - 2.5M sqft'),
  ('East Midlands Airport Cargo', 'distribution_center', 52.8311, -1.3281, 1500000, 70, 'Air freight and distribution hub'),
  ('Doncaster iPort', 'rail_freight', 53.4833, -1.0167, 4000000, 75, 'Inland rail freight terminal - 4M sqft');

-- Example traffic sites (sample data - these would be populated from WebTRIS API)
INSERT INTO traffic_sites (site_id, site_name, latitude, longitude, road_name, hgv_aadf, total_aadf, data_year) VALUES
  ('M1-J19', 'M1 Junction 19 (Lutterworth)', 52.2833, -0.9833, 'M1', 8500, 85000, 2024),
  ('M1-J21', 'M1 Junction 21 (Leicester)', 52.6333, -1.1500, 'M1', 9200, 92000, 2024),
  ('M6-J10', 'M6 Junction 10 (Walsall)', 52.6167, -1.9500, 'M6', 7800, 78000, 2024),
  ('A1M-J40', 'A1(M) Junction 40', 53.7833, -1.2333, 'A1(M)', 6500, 65000, 2024),
  ('M25-J30', 'M25 Junction 30 (Dartford)', 51.5000, 0.2500, 'M25', 11000, 110000, 2024),
  ('M62-J26', 'M62 Junction 26 (Bradford)', 53.7167, -1.6833, 'M62', 7200, 72000, 2024);

-- Example substations (sample data - these would be populated from DNO APIs)
INSERT INTO substations (dno_name, substation_name, latitude, longitude, voltage_level, capacity_mw, generation_headroom_mw, demand_headroom_mw) VALUES
  ('UK Power Networks', 'Lutterworth Primary', 52.4583, -1.2000, '33kV', 45.0, 15.0, 25.0),
  ('National Grid', 'Rugby Grid', 52.4000, -1.1833, '132kV', 120.0, 40.0, 60.0),
  ('UK Power Networks', 'Felixstowe Grid', 51.9567, 1.3517, '132kV', 150.0, 50.0, 70.0),
  ('National Grid', 'Birmingham East', 52.5167, -1.7167, '132kV', 130.0, 45.0, 55.0),
  ('UK Power Networks', 'Southampton Docks', 50.9097, -1.4044, '132kV', 140.0, 48.0, 65.0),
  ('Northern Powergrid', 'Doncaster North', 53.4833, -1.0167, '33kV', 50.0, 18.0, 28.0);

-- Planning constraints (simplified examples - actual data would be more complex)
INSERT INTO planning_constraints (constraint_type, name, centroid_lat, centroid_lng, severity) VALUES
  ('national_park', 'Peak District National Park', 53.3500, -1.8333, 'high'),
  ('national_park', 'Lake District National Park', 54.4667, -3.0833, 'high'),
  ('national_park', 'Snowdonia National Park', 53.0000, -3.9000, 'high'),
  ('aonb', 'Cotswolds AONB', 51.9000, -1.9000, 'high'),
  ('aonb', 'Surrey Hills AONB', 51.2167, -0.4500, 'high'),
  ('green_belt', 'London Green Belt (Central)', 51.5074, -0.1278, 'high'),
  ('green_belt', 'Manchester Green Belt', 53.4808, -2.2426, 'high'),
  ('sssi', 'Example SSSI Site', 52.0000, -1.0000, 'high');

-- Example analysis result (demonstration)
INSERT INTO analysis_results (
  search_name, 
  center_latitude, 
  center_longitude,
  search_radius_km,
  overall_score,
  grid_score,
  traffic_score,
  logistics_score,
  planning_score,
  nearest_substation_distance_km,
  nearest_hub_distance_km,
  hgv_aadf_nearby,
  planning_issues
) VALUES (
  'Magna Park Area Test',
  52.4583,
  -1.2000,
  10.0,
  89.0,
  92.0,
  88.0,
  95.0,
  80.0,
  1.2,
  0.8,
  9200,
  '[]'
);
