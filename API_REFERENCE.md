# HGV Charging Infrastructure - API Reference & Data Sources

## Quick Reference: All API Endpoints & Data Sources

---

## 1. Grid Capacity & Substation Data

### UK Power Networks Open Data Portal ⭐ RECOMMENDED
- **Portal:** https://ukpowernetworks.opendatasoft.com/
- **API Console:** https://ukpowernetworks.opendatasoft.com/api/v1/console
- **API v2:** https://ukpowernetworks.opendatasoft.com/api/explore/v2.1/console
- **Authentication:** None (open data)
- **Rate Limits:** None stated
- **Coverage:** London, South East, East of England

**Key Datasets:**
- Grid and Primary Sites: https://ukpowernetworks.opendatasoft.com/explore/dataset/grid-and-primary-sites/
- Network Operational Data Dashboard: https://ukpowernetworks.opendatasoft.com/pages/nodd/
- Large Demand Dashboard: https://ukpowernetworks.opendatasoft.com/pages/large-demand-dashboard/

**Example API Call:**
```bash
# Search for substations near a location (geofilter by distance)
curl "https://ukpowernetworks.opendatasoft.com/api/records/1.0/search/?dataset=grid-and-primary-sites&geofilter.distance=52.4583,-1.2000,5000&rows=100"

# Parameters:
# - dataset: grid-and-primary-sites
# - geofilter.distance: lat,lng,radius_in_meters
# - rows: number of results (default 10, max 100)
# - format: json (default), geojson, csv
```

**Response Fields:**
- `fields.grid_name` - Substation name
- `fields.primary_name` - Primary substation name
- `fields.voltage_level` - Voltage (kV)
- `fields.geo_point_2d` - [lat, lng]
- `fields.capacity_mva` - Capacity in MVA
- `fields.demand_headroom_mw` - Available demand capacity
- `fields.generation_headroom_mw` - Available generation capacity

### National Grid Connected Data Portal
- **URL:** https://connecteddata.nationalgrid.co.uk/
- **Authentication:** Registration required for some datasets
- **Coverage:** Midlands, South West England, South Wales
- **Note:** Requires account for full access

### SearchLand DNO & Substation API (Commercial)
- **URL:** https://searchland.co.uk/our-apis/dno
- **Coverage:** All 6 major DNOs, 400,000+ substations
- **Features:** Voltage, capacity, headroom, distance filtering
- **Pricing:** Commercial subscription required
- **Documentation:** https://searchland.co.uk/our-apis/dno

---

## 2. Traffic Flow Data

### WebTRIS API - National Highways ⭐ RECOMMENDED
- **Portal:** https://webtris.nationalhighways.co.uk/
- **API Base URL:** http://webtris.nationalhighways.co.uk/api/v1.0/
- **Swagger Docs:** https://webtris.highwaysengland.co.uk/api/swagger/ui/index
- **Authentication:** None
- **Rate Limits:** None stated
- **Coverage:** Strategic Road Network (motorways and major A-roads)
- **Data Format:** JSON

**Endpoints:**

```bash
# Get all traffic monitoring sites
curl "http://webtris.nationalhighways.co.uk/api/v1.0/sites"

# Get specific site details
curl "http://webtris.nationalhighways.co.uk/api/v1.0/sites/{site_id}"

# Get daily traffic report
curl "http://webtris.nationalhighways.co.uk/api/v1.0/reports/daily?sites=8188&start_date=01012024&end_date=31012024&page=1&page_size=50"

# Get monthly traffic report
curl "http://webtris.nationalhighways.co.uk/api/v1.0/reports/monthly?sites=8188&start_date=01012024&end_date=31122024&page=1&page_size=50"

# Get all areas
curl "http://webtris.nationalhighways.co.uk/api/v1.0/areas/"

# Get data quality metrics
curl "http://webtris.nationalhighways.co.uk/api/v1.0/quality/daily?siteid=8188&start_date=01012024&end_date=31012024"
```

**Response Fields:**
- `Id` - Site ID
- `Name` - Site name
- `Description` - Site description
- `Latitude` / `Longitude` - Location
- `Status` - Active/Inactive
- Vehicle classes: `Pedal Cycles`, `Motorcycles`, `Cars`, `Buses`, `LGVs`, `HGVs`, etc.

### Department for Transport Road Traffic Statistics API
- **Portal:** https://roadtraffic.dft.gov.uk/
- **API Base URL:** https://roadtraffic.dft.gov.uk/api/
- **API Documentation:** https://roadtraffic.dft.gov.uk/api-docs
- **Authentication:** None
- **Rate Limits:** None currently
- **Coverage:** All roads in Great Britain
- **Data Format:** JSON (paginated)

**Endpoints:**

```bash
# Get all regions
curl "https://roadtraffic.dft.gov.uk/api/regions"

# Get local authorities in a region
curl "https://roadtraffic.dft.gov.uk/api/regions/{region_id}/local-authorities"

# Get average annual daily flow (AADF)
curl "https://roadtraffic.dft.gov.uk/api/average-annual-daily-flow?filter[road_name]=M1&filter[year]=2024&page[number]=1&page[size]=100"

# Filter by vehicle type
# Vehicle types: all_motor_vehicles, cars_and_taxis, lgvs, hgvs, rigid_hgvs, articulated_hgvs

# Get count points
curl "https://roadtraffic.dft.gov.uk/api/count-points?filter[local_authority_id]=1&page[number]=1&page[size]=100"

# Get raw counts
curl "https://roadtraffic.dft.gov.uk/api/raw-counts?filter[count_point_id]=123&page[number]=1&page[size]=100"
```

**Filter Parameters:**
- `filter[road_name]` - e.g., M1, A1(M), A14
- `filter[year]` - e.g., 2024, 2023
- `filter[vehicle_type]` - hgvs, rigid_hgvs, articulated_hgvs
- `filter[local_authority_id]` - Local authority ID
- `page[number]` - Page number (starts at 1)
- `page[size]` - Results per page (max 100)

### GB Road Traffic Counts - data.gov.uk (Bulk Download)
- **URL:** https://www.data.gov.uk/dataset/208c0e7b-353f-4e2d-8b7a-1a7118467acc/gb-road-traffic-counts
- **Format:** CSV bulk downloads
- **Updated:** June 15, 2025
- **Coverage:** Manual and automatic count points across GB

---

## 3. Logistics Hubs & O-License Data

### DVSA O-License Operator Data ⭐ RECOMMENDED
- **Portal:** https://www.data.gov.uk/dataset/2a67d1ee-8f1b-43a3-8bc6-e8772d162a3c/traffic-commissioners-goods-and-public-service-vehicle-operator-licence-records
- **Direct Download:** CSV file updated monthly
- **Updated:** February 19, 2025
- **Format:** CSV
- **Authentication:** None (public data)

**CSV Columns:**
- Operator Name
- Licence Number
- Operating Centre Address
- Number of Vehicles Authorized
- Licence Type (Standard National, Standard International, Restricted)
- Trading Name
- Postcode

**Processing Notes:**
- Use geocoding service to convert addresses/postcodes to lat/long
- Aggregate by operating center location
- Weight by vehicle count

### UK Port Statistics - Department for Transport
- **Main Portal:** https://www.gov.uk/government/collections/maritime-and-shipping-statistics
- **Port List (ODS format):** https://assets.publishing.service.gov.uk/media/6888c795048fff613a4d5ae9/Major_and_Minor_Port_List_for_Freight_Statistics.ods
- **Format:** Excel/ODS spreadsheet
- **Content:** Major and minor ports with location data, throughput statistics

**Major Ports (Container Traffic):**
1. Felixstowe - 51.9567, 1.3517 - 4M TEU/year
2. Southampton - 50.9097, -1.4044 - 1.5M TEU/year
3. London Gateway - 51.5000, 0.5167 - Major container port
4. Immingham - 53.6333, -0.2167 - 46M tonnes/year (largest by tonnage)
5. Liverpool - 53.4500, -3.0167
6. Dover - 51.1167, 1.3167 - Major ro-ro/ferry
7. Tilbury - 51.4625, 0.3711

### Logistics Dataset Research Paper
- **Title:** "A dataset of logistics sites in England and Wales: Location, size and activity"
- **URL:** https://pmc.ncbi.nlm.nih.gov/articles/PMC11058711/
- **Coverage:** Warehouses, retail sites, factories
- **Format:** Research dataset (may require contact with authors)

### Known Major Logistics Hubs (Manual Database)

**Golden Triangle Logistics Parks:**
- Magna Park, Lutterworth: 52.4583, -1.2000 (13.1M sq ft)
- DIRFT, Rugby: 52.4000, -1.1833 (8M sq ft, rail-connected)
- Hams Hall, Birmingham: 52.5167, -1.7167 (5M sq ft)
- East Midlands Gateway: 52.8333, -1.3167 (6M sq ft, rail)
- Burton-upon-Trent: 52.8071, -1.6368 (3M sq ft cluster)
- Northampton Gateway: 52.2667, -0.9333 (2.5M sq ft)
- East Midlands Airport Cargo: 52.8311, -1.3281 (1.5M sq ft)
- Doncaster iPort: 53.4833, -1.0167 (4M sq ft)

**Research Sources:**
- ONS Report: "The rise of the UK warehouse and the golden logistics triangle"
  - https://www.ons.gov.uk/businessindustryandtrade/business/activitysizeandlocation/articles/theriseoftheukwarehouseandthegoldenlogisticstriangle/2022-04-11

---

## 4. Planning Constraints & Protected Areas

### Planning.data.gov.uk ⭐ RECOMMENDED
- **Portal:** https://www.planning.data.gov.uk/
- **API Documentation:** https://www.planning.data.gov.uk/docs
- **API Base:** https://www.planning.data.gov.uk/entity.{extension}
- **Authentication:** None
- **Rate Limits:** None stated
- **Formats:** JSON, GeoJSON, CSV, HTML

**Key Datasets:**

```bash
# Green Belt
curl "https://www.planning.data.gov.uk/dataset/green-belt"

# Download green belt data
curl "https://www.planning.data.gov.uk/entity.geojson?dataset=green-belt"

# Search entities by location (point)
curl "https://www.planning.data.gov.uk/entity.json?dataset=green-belt&longitude=-1.2000&latitude=52.4583"

# Search by geometry intersection
curl "https://www.planning.data.gov.uk/entity.json?dataset=green-belt&geometry_relation=intersects&geometry=POINT(-1.2000%2052.4583)"

# Search by entity number
curl "https://www.planning.data.gov.uk/entity.json?entity=1234567"

# Filter by typology
curl "https://www.planning.data.gov.uk/entity.json?typology=geography"
```

**Available Datasets:**
- green-belt
- conservation-area
- article-4-direction
- tree-preservation-order
- listed-building
- ancient-woodland
- local-plan
- local-plan-document

**Query Parameters:**
- `longitude` / `latitude` - Point intersection
- `geometry` - WKT format (POINT, POLYGON, LINESTRING)
- `geometry_relation` - within, intersects, contains (default: within)
- `dataset` - Dataset name
- `typology` - Filter by typology
- `limit` - Max results (default 100)
- `offset` - Pagination offset

### JNCC UK Protected Area Datasets
- **URL:** https://jncc.gov.uk/our-work/uk-protected-area-datasets-for-download/
- **Updated:** May 20, 2025
- **Format:** Shapefile, GeoJSON, GML
- **Authentication:** None (public data)

**Protected Area Types:**
- National Parks
- Areas of Outstanding Natural Beauty (AONB)
- Sites of Special Scientific Interest (SSSI)
- Special Areas of Conservation (SAC)
- Special Protection Areas (SPA)
- Ramsar sites (wetlands)
- Marine Protected Areas

**Download Links:**
- All UK Protected Areas: https://jncc.gov.uk/our-work/uk-protected-area-datasets-for-download/
- Individual datasets available as zipped shapefiles

### Natural England - AONBs (England)
- **URL:** https://www.data.gov.uk/dataset/8e3ae3b9-a827-47f1-b025-f08527a4e84e/areas-of-outstanding-natural-beauty-england1
- **Format:** Shapefile, GeoJSON
- **Coverage:** England only

### SearchLand Planning Constraints API (Commercial)
- **URL:** https://searchland.co.uk/our-apis/planning-constraints
- **Coverage:** England, Scotland, Wales
- **Format:** REST API
- **Authentication:** API key (subscription required)
- **Features:**
  - Heritage constraints
  - Natural and protected areas
  - Flood zones
  - Green belt
  - Article 4 directions
  - Environmental restrictions

---

## 5. Geospatial Tools & Libraries

### Turf.js - Client-Side Spatial Analysis ⭐ RECOMMENDED
- **URL:** https://turfjs.org/
- **CDN:** https://cdn.jsdelivr.net/npm/@turf/turf@7/turf.min.js
- **GitHub:** https://github.com/Turfjs/turf
- **License:** MIT (open source)

**Key Functions:**
```javascript
// Distance calculation (Haversine formula)
const distance = turf.distance(point1, point2, {units: 'kilometers'})

// Create buffer zone
const buffered = turf.buffer(point, 5, {units: 'kilometers'})

// Create circle
const circle = turf.circle(centerPoint, 10, {units: 'kilometers'})

// Point in polygon
const isInside = turf.booleanPointInPolygon(point, polygon)

// Nearest point
const nearest = turf.nearestPoint(targetPoint, pointCollection)

// Centroid
const centroid = turf.centroid(polygon)

// Bbox (bounding box)
const bbox = turf.bbox(featureCollection)

// Intersection
const intersection = turf.intersect(polygon1, polygon2)

// Union
const union = turf.union(polygon1, polygon2)
```

### Leaflet.js - Interactive Mapping
- **URL:** https://leafletjs.com/
- **CDN CSS:** https://unpkg.com/leaflet@1.9.4/dist/leaflet.css
- **CDN JS:** https://unpkg.com/leaflet@1.9.4/dist/leaflet.js
- **License:** BSD 2-Clause

### Mapbox GL JS (Alternative)
- **URL:** https://www.mapbox.com/mapbox-gljs
- **CDN:** https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js
- **Note:** Requires API key (free tier available)

---

## 6. Alternative Spatial Database Options

### Supabase + PostGIS (for complex spatial queries)
- **URL:** https://supabase.com/
- **Features:** PostgreSQL with PostGIS extension
- **Pricing:** Free tier available (500MB database)
- **Documentation:** https://supabase.com/docs/guides/database/extensions/postgis

**PostGIS Functions:**
```sql
-- Distance calculation
SELECT ST_Distance(
  ST_SetSRID(ST_MakePoint(-1.2000, 52.4583), 4326)::geography,
  ST_SetSRID(ST_MakePoint(-1.1833, 52.4000), 4326)::geography
) / 1000 AS distance_km;

-- Points within radius
SELECT * FROM substations
WHERE ST_DWithin(
  location::geography,
  ST_SetSRID(ST_MakePoint(-1.2000, 52.4583), 4326)::geography,
  5000 -- 5km in meters
);

-- Point in polygon
SELECT * FROM planning_constraints
WHERE ST_Contains(
  geometry,
  ST_SetSRID(ST_MakePoint(-1.2000, 52.4583), 4326)
);

-- Nearest neighbor
SELECT *, ST_Distance(
  location::geography,
  ST_SetSRID(ST_MakePoint(-1.2000, 52.4583), 4326)::geography
) AS distance
FROM substations
ORDER BY distance
LIMIT 10;
```

**Supabase REST API:**
```bash
# Query with PostGIS via REST API
curl "https://your-project.supabase.co/rest/v1/substations?select=*,distance:location->ST_Distance(ST_SetSRID(ST_MakePoint(-1.2000,52.4583),4326)::geography)&order=distance.asc&limit=10" \
  -H "apikey: YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_JWT"
```

### Neon.tech (PostgreSQL with PostGIS)
- **URL:** https://neon.tech/
- **Features:** Serverless PostgreSQL
- **Pricing:** Free tier available
- **PostGIS:** Supported via extension

---

## 7. Geocoding Services (for O-License data)

### Postcodes.io (UK Postcodes) ⭐ FREE
- **URL:** https://postcodes.io/
- **API:** https://api.postcodes.io/postcodes/{postcode}
- **Authentication:** None
- **Rate Limits:** None (fair use)
- **Coverage:** UK postcodes only

```bash
# Lookup single postcode
curl "https://api.postcodes.io/postcodes/SW1A1AA"

# Bulk lookup
curl -X POST "https://api.postcodes.io/postcodes" \
  -H "Content-Type: application/json" \
  -d '{"postcodes": ["SW1A1AA", "M1 1AA"]}'

# Reverse geocoding (nearest postcode)
curl "https://api.postcodes.io/postcodes?lon=-1.2000&lat=52.4583&limit=10"
```

**Response:**
```json
{
  "status": 200,
  "result": {
    "postcode": "SW1A 1AA",
    "longitude": -0.127647,
    "latitude": 51.501009,
    "country": "England",
    "region": "London",
    ...
  }
}
```

### Nominatim (OpenStreetMap) ⭐ FREE
- **URL:** https://nominatim.openstreetmap.org/
- **Docs:** https://nominatim.org/release-docs/latest/api/Overview/
- **Authentication:** None
- **Rate Limits:** 1 request/second (fair use)
- **Coverage:** Worldwide

```bash
# Forward geocoding (address to coordinates)
curl "https://nominatim.openstreetmap.org/search?q=Magna+Park+Lutterworth&format=json&limit=1"

# Reverse geocoding (coordinates to address)
curl "https://nominatim.openstreetmap.org/reverse?lat=52.4583&lon=-1.2000&format=json"
```

### Google Maps Geocoding API (Commercial)
- **URL:** https://developers.google.com/maps/documentation/geocoding
- **Authentication:** API key required
- **Pricing:** $5 per 1000 requests (free $200 credit/month)

---

## 8. Additional Data Sources

### Ordnance Survey APIs
- **Data Hub:** https://osdatahub.os.uk/
- **OS Features API:** https://www.ordnancesurvey.co.uk/products/os-features-api
- **Authentication:** API key (free tier available)
- **Coverage:** Great Britain
- **Features:** Buildings, roads, land use, infrastructure

### National Energy System Operator (NESO) Data Portal
- **URL:** https://www.neso.energy/data-portal
- **Content:** Electricity network data, generation, demand
- **Format:** Various (CSV, API)

---

## 9. Rate Limiting & Caching Strategy

### Recommended Caching Durations

**Static Data (rarely changes):**
- Logistics hubs: 1 year
- Major ports: 1 year
- Planning constraint boundaries: 3 months

**Semi-static Data:**
- Substation locations: 1 month
- Traffic site locations: 1 month
- O-license operators: 1 month

**Dynamic Data:**
- Substation capacity: 1 day
- Traffic flow data (historical): 7 days
- Traffic flow data (recent): 1 day

**Real-time Data:**
- Live traffic (if available): 15 minutes

### API Call Budget per Analysis
For a single site analysis (10km radius):
- Substations: 1-2 API calls (cached)
- Traffic sites: 1-2 API calls (cached)
- Planning constraints: 1-5 API calls (cached)
- **Total: ~5-10 API calls, mostly served from cache**

---

## 10. Development & Testing Tools

### API Testing
- **Postman:** https://www.postman.com/
- **Insomnia:** https://insomnia.rest/
- **curl:** Built into Linux/Mac

### GIS Tools
- **QGIS:** https://qgis.org/ (open source GIS desktop)
- **geojson.io:** https://geojson.io/ (online GeoJSON viewer/editor)
- **GeoJSON Lint:** https://geojsonlint.com/ (validate GeoJSON)

### JSON Tools
- **jq:** https://jqlang.github.io/jq/ (command-line JSON processor)
- **JSON Formatter:** https://jsonformatter.org/

---

## 11. Error Handling & Fallbacks

### API Unavailability Strategy

**Priority 1 APIs (Critical):**
- UK Power Networks API → Fallback to cached data
- WebTRIS API → Fallback to DfT statistics

**Priority 2 APIs (Important):**
- DfT Traffic Stats → Use WebTRIS data only
- Planning.data.gov.uk → Use cached constraint data

**Priority 3 APIs (Nice to have):**
- Geocoding → Use manual coordinate entry

### Retry Strategy
```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
      if (response.status === 429) {
        // Rate limited - exponential backoff
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
        continue
      }
      throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}
```

---

## 12. Contact & Support

### API Support Contacts

**UK Power Networks:**
- Email: dso@ukpowernetworks.co.uk
- Portal Support: Via website contact form

**WebTRIS / National Highways:**
- Email: webtris@nationalhighways.co.uk
- Forums: Coming soon (per API docs)

**DfT Road Traffic Statistics:**
- Email: roadtraff.stats@dft.gov.uk

**Planning.data.gov.uk:**
- Email: DigitalLand@communities.gov.uk

**JNCC Protected Areas:**
- Email: data@jncc.gov.uk

---

## 13. Legal & Terms of Service

### Data Licensing

**Open Government Licence (OGL):**
- UK Power Networks data
- DfT traffic statistics
- Planning.data.gov.uk
- JNCC protected areas
- **License:** http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/

**Attribution Requirements:**
- "Contains public sector information licensed under the Open Government Licence v3.0"
- "Contains Ordnance Survey data © Crown copyright and database right [year]"

### API Terms of Service
- Fair use policies apply to free APIs
- Commercial use may require licensing
- Rate limits must be respected
- Caching reduces API load

---

## 14. Quick Start Commands

```bash
# Test UK Power Networks API
curl "https://ukpowernetworks.opendatasoft.com/api/records/1.0/search/?dataset=grid-and-primary-sites&rows=5" | jq

# Test WebTRIS API
curl "http://webtris.nationalhighways.co.uk/api/v1.0/sites" | jq '.sites[:5]'

# Test DfT Road Traffic API
curl "https://roadtraffic.dft.gov.uk/api/regions" | jq

# Test Planning Data API
curl "https://www.planning.data.gov.uk/entity.json?dataset=green-belt&limit=5" | jq

# Test Postcodes.io
curl "https://api.postcodes.io/postcodes/LE17 4XW" | jq

# Download O-License data
wget "https://www.data.gov.uk/dataset/[guid]/traffic-commissioners-operator-licence-records.csv"
```

---

## Appendix: Complete Example API Workflow

```javascript
// Complete workflow for analyzing a location

async function analyzeLocationComplete(lat, lng) {
  // 1. Get nearby substations
  const substationsUrl = `https://ukpowernetworks.opendatasoft.com/api/records/1.0/search/?dataset=grid-and-primary-sites&geofilter.distance=${lat},${lng},10000&rows=50`
  const substations = await fetch(substationsUrl).then(r => r.json())

  // 2. Get nearby traffic sites (via your API proxy)
  const trafficUrl = `/api/traffic-sites?lat=${lat}&lng=${lng}&radius=10`
  const traffic = await fetch(trafficUrl).then(r => r.json())

  // 3. Get nearby logistics hubs (from D1)
  const hubsUrl = `/api/logistics-hubs?lat=${lat}&lng=${lng}&radius=10`
  const hubs = await fetch(hubsUrl).then(r => r.json())

  // 4. Check planning constraints (point-in-polygon)
  const constraintsUrl = `https://www.planning.data.gov.uk/entity.json?longitude=${lng}&latitude=${lat}&dataset=green-belt`
  const constraints = await fetch(constraintsUrl).then(r => r.json())

  // 5. Calculate scores with Turf.js
  const scores = calculateScores(lat, lng, substations, traffic, hubs, constraints)

  // 6. Save results
  await fetch('/api/save-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scores)
  })

  return scores
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-19  
**Maintained By:** Development Team
