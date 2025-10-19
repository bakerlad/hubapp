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

let currentAnalysis = null

// ============================================================================
// Initialize Map
// ============================================================================

function initMap() {
  // Center on UK (Midlands)
  map = L.map('map').setView([52.5, -1.5], 7)

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)

  // Add layer groups
  Object.values(markers).forEach(layer => layer.addTo(map))

  // Click handler for map - analyze location
  map.on('click', (e) => {
    document.getElementById('searchInput').value = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`
    analyzeLocation(e.latlng.lat, e.latlng.lng)
  })

  // Load initial data
  loadLogisticsHubs()
  loadSubstations()
  loadTrafficSites()
  loadSavedAnalyses()

  console.log('✅ Map initialized - Click anywhere to analyze a location')
}

// ============================================================================
// Data Loading Functions
// ============================================================================

async function loadLogisticsHubs() {
  try {
    const response = await fetch('/api/logistics-hubs')
    const result = await response.json()
    const hubs = result.data

    markers.hubs.clearLayers()

    hubs.forEach(hub => {
      const marker = L.circleMarker([hub.latitude, hub.longitude], {
        radius: 8,
        fillColor: '#9333ea',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).bindPopup(`
        <div class="p-2">
          <h4 class="font-bold text-purple-600">🏭 ${hub.name}</h4>
          <p class="text-sm">${hub.type.replace(/_/g, ' ').toUpperCase()}</p>
          <p class="text-sm">Score: ${hub.importance_score}/100</p>
          ${hub.size_sqft ? `<p class="text-xs">Size: ${(hub.size_sqft/1000000).toFixed(1)}M sqft</p>` : ''}
          ${hub.throughput_teu ? `<p class="text-xs">Throughput: ${(hub.throughput_teu/1000000).toFixed(1)}M TEU/yr</p>` : ''}
          <p class="text-xs text-gray-600">${hub.description}</p>
        </div>
      `)

      markers.hubs.addLayer(marker)
    })

    console.log(`✅ Loaded ${hubs.length} logistics hubs`)
  } catch (error) {
    console.error('❌ Failed to load logistics hubs:', error)
  }
}

async function loadSubstations() {
  try {
    const response = await fetch('/api/substations')
    const result = await response.json()
    const substations = result.data

    markers.substations.clearLayers()

    substations.forEach(sub => {
      const marker = L.circleMarker([sub.latitude, sub.longitude], {
        radius: 6,
        fillColor: '#eab308',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).bindPopup(`
        <div class="p-2">
          <h4 class="font-bold text-yellow-600">⚡ ${sub.substation_name}</h4>
          <p class="text-sm">${sub.dno_name}</p>
          <p class="text-sm"><strong>Voltage:</strong> ${sub.voltage_level}</p>
          <p class="text-sm"><strong>Capacity:</strong> ${sub.capacity_mw} MW</p>
          <p class="text-sm"><strong>Available:</strong> ${sub.demand_headroom_mw} MW</p>
        </div>
      `)

      markers.substations.addLayer(marker)
    })

    console.log(`✅ Loaded ${substations.length} substations`)
  } catch (error) {
    console.error('❌ Failed to load substations:', error)
  }
}

async function loadTrafficSites() {
  try {
    const response = await fetch('/api/traffic-sites')
    const result = await response.json()
    const sites = result.data

    markers.traffic.clearLayers()

    sites.forEach(site => {
      const marker = L.circleMarker([site.latitude, site.longitude], {
        radius: 5,
        fillColor: '#3b82f6',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).bindPopup(`
        <div class="p-2">
          <h4 class="font-bold text-blue-600">🚛 ${site.site_name}</h4>
          <p class="text-sm"><strong>Road:</strong> ${site.road_name}</p>
          <p class="text-sm"><strong>HGV AADF:</strong> ${site.hgv_aadf.toLocaleString()}/day</p>
          <p class="text-sm"><strong>Total AADF:</strong> ${site.total_aadf.toLocaleString()}/day</p>
          <p class="text-xs text-gray-600">Data: ${site.data_year}</p>
        </div>
      `)

      markers.traffic.addLayer(marker)
    })

    console.log(`✅ Loaded ${sites.length} traffic sites`)
  } catch (error) {
    console.error('❌ Failed to load traffic sites:', error)
  }
}

async function loadSavedAnalyses() {
  try {
    const response = await fetch('/api/saved-analyses')
    const result = await response.json()
    const analyses = result.data

    const listEl = document.getElementById('savedList')
    listEl.innerHTML = ''

    if (analyses.length === 0) {
      listEl.innerHTML = '<p class="text-sm text-gray-500">No saved analyses yet</p>'
      return
    }

    analyses.slice(0, 10).forEach(analysis => {
      const div = document.createElement('div')
      div.className = 'p-2 bg-gray-100 rounded text-sm cursor-pointer hover:bg-gray-200'
      div.innerHTML = `
        <div class="font-bold">${analysis.search_name || 'Unnamed'}</div>
        <div class="text-xs text-gray-600">Score: ${analysis.overall_score}/100</div>
        <div class="text-xs text-gray-600">${new Date(analysis.created_at).toLocaleString()}</div>
      `
      div.onclick = () => {
        map.setView([analysis.center_latitude, analysis.center_longitude], 12)
        analyzeLocation(analysis.center_latitude, analysis.center_longitude)
      }
      listEl.appendChild(div)
    })

    console.log(`✅ Loaded ${analyses.length} saved analyses`)
  } catch (error) {
    console.error('❌ Failed to load saved analyses:', error)
  }
}

// ============================================================================
// Site Analysis with Turf.js
// ============================================================================

async function analyzeLocation(lat, lng) {
  console.log(`🔍 Analyzing location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)

  // Clear previous search marker
  markers.search.clearLayers()

  // Add search marker
  L.marker([lat, lng], {
    icon: L.divIcon({
      html: '<div style="font-size: 24px;">📍</div>',
      className: 'custom-marker',
      iconSize: [30, 40],
      iconAnchor: [15, 40]
    })
  }).bindPopup('<b>Analysis Point</b>').addTo(markers.search)

  // Fetch nearby data from API
  try {
    const response = await fetch('/api/analyze-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng, radius: 10 })
    })

    const result = await response.json()
    const nearby = result.nearby

    // Calculate scores using Turf.js
    const scores = calculateSiteScores(
      { lat, lng },
      nearby.substations,
      nearby.logistics_hubs,
      nearby.traffic_sites
    )

    // Store current analysis
    currentAnalysis = {
      ...scores,
      center_latitude: lat,
      center_longitude: lng,
      search_radius_km: 10
    }

    // Display results
    displayResults(scores)

    // Draw analysis circles
    drawAnalysisCircles(lat, lng)

    console.log('✅ Analysis complete:', scores)
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    alert('Failed to analyze location. Please try again.')
  }
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
    // Distance score: <1km=100, 1-2km=75, 2-5km=50, >5km=0
    let distanceScore = 0
    if (minSubDistance < 1) distanceScore = 100
    else if (minSubDistance < 2) distanceScore = 75
    else if (minSubDistance < 5) distanceScore = 50

    // Capacity score
    let capacityScore = 0
    if (nearestSubstation.capacity_mw > 50) capacityScore = 100
    else if (nearestSubstation.capacity_mw > 20) capacityScore = 75
    else if (nearestSubstation.capacity_mw > 10) capacityScore = 50
    else capacityScore = 25

    // Voltage score
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
    let distanceScore = 0
    if (minHubDistance < 2) distanceScore = 100
    else if (minHubDistance < 5) distanceScore = 75
    else if (minHubDistance < 10) distanceScore = 50
    else distanceScore = 25

    let importanceScore = nearestHub.importance_score || 50

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

  let volumeScore = 0
  if (maxHGV > 5000) volumeScore = 100
  else if (maxHGV > 2000) volumeScore = 75
  else if (maxHGV > 1000) volumeScore = 50
  else volumeScore = 25

  let proximityScore = 0
  if (nearestTrafficDistance < 0.5) proximityScore = 100
  else if (nearestTrafficDistance < 1) proximityScore = 75
  else if (nearestTrafficDistance < 2) proximityScore = 50
  else proximityScore = 25

  trafficScore = (volumeScore + proximityScore) / 2

  // ===== PLANNING SCORE (0-100) =====
  let planningScore = 75 // Default moderate feasibility

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
  
  const overallEl = document.getElementById('overallScore')
  overallEl.textContent = scores.overall
  
  // Color-code overall score
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
  const center = [lng, lat]
  
  // Draw 5km and 10km radius circles
  const circle5km = turf.circle(center, 5, { units: 'kilometers' })
  const circle10km = turf.circle(center, 10, { units: 'kilometers' })

  L.geoJSON(circle5km, {
    style: { color: '#3b82f6', weight: 2, fillOpacity: 0.1 }
  }).addTo(markers.search)

  L.geoJSON(circle10km, {
    style: { color: '#9333ea', weight: 2, fillOpacity: 0.05 }
  }).addTo(markers.search)
}

// ============================================================================
// Event Handlers
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initMap()

  // Layer toggles
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

  // Save analysis
  document.getElementById('btnSaveAnalysis').addEventListener('click', async () => {
    if (!currentAnalysis) {
      alert('No analysis to save')
      return
    }

    const name = prompt('Enter a name for this analysis:', `Site at ${currentAnalysis.center_latitude.toFixed(4)}, ${currentAnalysis.center_longitude.toFixed(4)}`)
    if (!name) return

    try {
      await fetch('/api/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentAnalysis,
          search_name: name
        })
      })

      alert('Analysis saved successfully!')
      loadSavedAnalyses()
    } catch (error) {
      console.error('Failed to save analysis:', error)
      alert('Failed to save analysis')
    }
  })

  // About button
  document.getElementById('btnAbout').addEventListener('click', () => {
    alert('HGV Charging Infrastructure Site Selector\\n\\nClick anywhere on the map to analyze a location for HGV charging infrastructure suitability.\\n\\nScoring factors:\\n• Grid Capacity (30%)\\n• Traffic Flows (25%)\\n• Logistics Proximity (25%)\\n• Planning Feasibility (20%)')
  })

  console.log('🚀 Application ready!')
})
