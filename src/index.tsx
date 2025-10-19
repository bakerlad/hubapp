import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files from public/static directory
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * GET /api/logistics-hubs
 * Get all logistics hubs or filter by type
 */
app.get('/api/logistics-hubs', async (c) => {
  const { type } = c.req.query()
  const db = c.env.DB

  let query = 'SELECT * FROM logistics_hubs'
  const params: any[] = []

  if (type) {
    query += ' WHERE type = ?'
    params.push(type)
  }

  query += ' ORDER BY importance_score DESC'

  const result = await db.prepare(query).bind(...params).all()

  return c.json({
    success: true,
    data: result.results,
    count: result.results?.length || 0
  })
})

/**
 * GET /api/substations
 * Get substations by capacity filter
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
 */
app.post('/api/analyze-site', async (c) => {
  const { latitude, longitude, radius = 10 } = await c.req.json()
  const db = c.env.DB

  // Get nearby substations (approximate - Turf.js on client handles precise distances)
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
    data.search_name || 'Unnamed Analysis',
    data.center_latitude,
    data.center_longitude,
    data.search_radius_km || 10,
    data.overall_score,
    data.grid_score,
    data.traffic_score,
    data.logistics_score,
    data.planning_score,
    data.nearest_substation_distance_km,
    data.nearest_hub_distance_km,
    data.hgv_aadf_nearby,
    JSON.stringify(data.planning_issues || [])
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
// LIVE DNO API INTEGRATION
// ============================================================================

/**
 * GET /api/external/ukpn/substations
 * Fetch live substation data from UK Power Networks Open Data Portal
 * Implements caching strategy to reduce API calls
 */
app.get('/api/external/ukpn/substations', async (c) => {
  const db = c.env.DB
  const { bounds, minCapacity, refresh } = c.req.query()
  
  // Cache key based on query parameters
  const cacheKey = `ukpn_substations_${bounds || 'all'}_${minCapacity || 'any'}`
  
  // Check cache first (unless refresh=true)
  if (refresh !== 'true') {
    const cached = await db.prepare(`
      SELECT response_data, created_at 
      FROM api_cache 
      WHERE cache_key = ? 
        AND datetime(created_at, '+24 hours') > datetime('now')
    `).bind(cacheKey).first()
    
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached.response_data),
        cached: true,
        cached_at: cached.created_at
      })
    }
  }
  
  try {
    // Build UK Power Networks API URL
    // API docs: https://ukpowernetworks.opendatasoft.com/api/v1/console
    let ukpnUrl = 'https://ukpowernetworks.opendatasoft.com/api/explore/v2.1/catalog/datasets/grid-and-primary-sites/records'
    
    // Add query parameters
    const params = new URLSearchParams({
      limit: '100',
      offset: '0'
    })
    
    // Add spatial filter if bounds provided (format: minLat,minLon,maxLat,maxLon)
    if (bounds) {
      const [minLat, minLon, maxLat, maxLon] = bounds.split(',').map(parseFloat)
      // OpenDataSoft uses geofilter.bbox parameter
      params.append('where', `within_bbox(geo_point_2d, ${maxLat}, ${minLon}, ${minLat}, ${maxLon})`)
    }
    
    const fullUrl = `${ukpnUrl}?${params.toString()}`
    
    // Fetch from UK Power Networks API
    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HGV-Charging-Site-Selector/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`UK Power Networks API error: ${response.status} ${response.statusText}`)
    }
    
    const apiData = await response.json()
    
    // Transform UKPN data structure to our schema
    const transformedData = apiData.records?.map((record: any) => {
      const fields = record.record.fields
      return {
        name: fields.site_name || fields.site_ref || 'Unknown',
        voltage_level: fields.voltage_level || fields.nominal_voltage || 'Unknown',
        capacity_mw: parseFloat(fields.generation_headroom_mva || fields.demand_headroom_mva || 0),
        latitude: fields.geo_point_2d?.lat || record.geometry?.coordinates[1],
        longitude: fields.geo_point_2d?.lon || record.geometry?.coordinates[0],
        dno_operator: 'UK Power Networks',
        available_capacity_mw: parseFloat(fields.generation_headroom_mva || 0),
        connection_type: fields.connection_type || 'Distribution',
        data_source: 'UKPN_Live_API',
        last_updated: new Date().toISOString()
      }
    }).filter((item: any) => 
      item.latitude && item.longitude && (!minCapacity || item.capacity_mw >= parseFloat(minCapacity))
    ) || []
    
    // Cache the transformed data
    await db.prepare(`
      INSERT OR REPLACE INTO api_cache (
        cache_key, api_source, endpoint, response_data, created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(
      cacheKey,
      'UK Power Networks',
      fullUrl,
      JSON.stringify(transformedData)
    ).run()
    
    return c.json({
      success: true,
      data: transformedData,
      cached: false,
      count: transformedData.length,
      source: 'UK Power Networks Open Data Portal',
      api_url: fullUrl
    })
    
  } catch (error: any) {
    console.error('Error fetching UKPN data:', error)
    return c.json({
      success: false,
      error: error.message,
      fallback: 'Using cached or seed data'
    }, 500)
  }
})

/**
 * GET /api/substations/live
 * Combined endpoint that fetches from multiple DNO sources
 * Falls back to database seed data if APIs fail
 */
app.get('/api/substations/live', async (c) => {
  const db = c.env.DB
  const { bounds, minCapacity } = c.req.query()
  
  try {
    // Fetch from UK Power Networks (primary source)
    const ukpnResponse = await fetch(`${c.req.url.replace('/api/substations/live', '/api/external/ukpn/substations')}?${new URLSearchParams(c.req.query() as any).toString()}`)
    const ukpnData = await ukpnResponse.json()
    
    // Combine with local database substations
    let query = 'SELECT * FROM substations WHERE 1=1'
    const params: any[] = []
    
    if (minCapacity) {
      query += ' AND capacity_mw >= ?'
      params.push(parseFloat(minCapacity))
    }
    
    const dbResult = await db.prepare(query).bind(...params).all()
    
    // Merge results
    const allSubstations = [
      ...(ukpnData.success ? ukpnData.data : []),
      ...(dbResult.results || [])
    ]
    
    return c.json({
      success: true,
      data: allSubstations,
      count: allSubstations.length,
      sources: {
        ukpn_live: ukpnData.success ? ukpnData.data.length : 0,
        database: dbResult.results?.length || 0
      }
    })
    
  } catch (error: any) {
    // Fallback to database only
    let query = 'SELECT * FROM substations WHERE 1=1'
    const params: any[] = []
    
    if (minCapacity) {
      query += ' AND capacity_mw >= ?'
      params.push(parseFloat(minCapacity))
    }
    
    const result = await db.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      data: result.results,
      count: result.results?.length || 0,
      fallback: true,
      error: error.message
    })
  }
})

// ============================================================================
// FRONTEND ROUTE
// ============================================================================

app.use(renderer)

app.get('/', (c) => {
  return c.render(
    <div>
      <style>{`
        #map { 
          height: calc(100vh - 64px); 
          width: 100%;
        }
        .sidebar { 
          max-height: calc(100vh - 64px); 
          overflow-y: auto; 
        }
        .custom-marker {
          background: transparent;
          border: none;
        }
      `}</style>

      <nav class="bg-blue-600 text-white p-4 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
          <h1 class="text-2xl font-bold">
            ⚡ HGV Charging Infrastructure Site Selector
          </h1>
          <div class="flex gap-4">
            <button id="btnAbout" class="hover:bg-blue-700 px-4 py-2 rounded">
              ℹ️ About
            </button>
          </div>
        </div>
      </nav>

      <div class="flex">
        {/* Sidebar */}
        <div class="w-96 bg-white shadow-lg sidebar p-4">
          <h2 class="text-xl font-bold mb-4">
            🔍 Site Analysis
          </h2>

          {/* Search Form */}
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">
              Search Location
            </label>
            <input 
              type="text" 
              id="searchInput" 
              placeholder="Click on map to analyze..."
              class="w-full p-2 border rounded"
            />
            <button id="btnSearch" class="w-full mt-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              🔍 Analyze Location
            </button>
          </div>

          {/* Layers Control */}
          <div class="mb-6">
            <h3 class="font-bold mb-2">Map Layers</h3>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="checkbox" id="layerSubstations" checked class="mr-2"/>
                ⚡ Substations
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="layerHubs" checked class="mr-2"/>
                🏭 Logistics Hubs
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="layerTraffic" checked class="mr-2"/>
                🚛 Traffic Sites
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="layerConstraints" class="mr-2"/>
                ⚠️ Planning Constraints
              </label>
            </div>
          </div>

          {/* Results Panel */}
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
                  <span>⚡ Grid Capacity:</span>
                  <span id="gridScore" class="font-bold">--</span>
                </div>
                <div class="flex justify-between">
                  <span>🚛 Traffic Flow:</span>
                  <span id="trafficScore" class="font-bold">--</span>
                </div>
                <div class="flex justify-between">
                  <span>🏭 Logistics:</span>
                  <span id="logisticsScore" class="font-bold">--</span>
                </div>
                <div class="flex justify-between">
                  <span>📜 Planning:</span>
                  <span id="planningScore" class="font-bold">--</span>
                </div>
              </div>

              <button id="btnSaveAnalysis" class="w-full mt-4 bg-green-600 text-white p-2 rounded hover:bg-green-700">
                💾 Save Analysis
              </button>
            </div>
          </div>

          {/* Saved Analyses */}
          <div class="mt-6">
            <h3 class="font-bold mb-2">Saved Analyses</h3>
            <div id="savedList" class="space-y-2">
              <p class="text-sm text-gray-500">No saved analyses yet</p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div class="flex-1">
          <div id="map"></div>
        </div>
      </div>

      {/* Load external libraries */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/@turf/turf@7/turf.min.js"></script>
      <script src="/static/app.js"></script>
    </div>
  )
})

export default app
