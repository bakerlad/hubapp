# HGV EV Charging Infrastructure Site Selector

> A comprehensive web-based solution for identifying optimal locations for electric heavy goods vehicle (HGV) charging infrastructure in the UK.

---

## 📋 Project Overview

This system helps fleet operators and infrastructure developers identify the "Goldilocks zone" for HGV charging stations by analyzing four critical factors:

1. **⚡ Grid Capacity** - Access to substations with sufficient electrical capacity
2. **🚛 Traffic Flows** - High HGV traffic volumes on strategic roads
3. **🏭 Logistics Proximity** - Nearness to distribution hubs, ports, and freight terminals
4. **📜 Planning Feasibility** - Avoiding protected areas and planning constraints

---

## 🎯 Key Features

- **Interactive Map Interface** - Explore potential sites across the UK
- **Multi-Factor Scoring** - Objective 0-100 scoring based on real data
- **Real-Time Analysis** - Click any location to get instant suitability assessment
- **Data Visualization** - Heatmaps, layer toggles, and detailed dashboards
- **Save & Compare** - Save analyses and compare multiple locations
- **API Integration** - Live data from UK Power Networks, National Highways, DfT, and Planning.data.gov.uk

---

## 📚 Documentation

This repository contains comprehensive documentation:

### 1. **RESEARCH_REPORT.md** (27KB)
The complete research document covering:
- All UK data sources and APIs
- DNO grid capacity data
- Traffic flow statistics
- Logistics hub locations
- Planning constraints
- System architecture
- Implementation phases
- Technical considerations

**📖 [Read the Full Research Report](./RESEARCH_REPORT.md)**

### 2. **IMPLEMENTATION_GUIDE.md** (38KB)
Technical implementation guide with:
- Step-by-step setup instructions
- Complete database schema
- Hono backend API code
- Frontend JavaScript with Turf.js
- Deployment commands
- Example workflows

**📖 [Read the Implementation Guide](./IMPLEMENTATION_GUIDE.md)**

### 3. **API_REFERENCE.md** (21KB)
Quick reference for all APIs:
- UK Power Networks API endpoints
- WebTRIS traffic data API
- DfT Road Traffic Statistics
- Planning.data.gov.uk
- O-License data sources
- Geocoding services
- Example API calls
- Rate limiting strategies

**📖 [Read the API Reference](./API_REFERENCE.md)**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account (free tier)
- Wrangler CLI

### Installation

```bash
# 1. Navigate to project directory
cd /home/user/webapp

# 2. Create Hono + Cloudflare Pages project (if not already done)
npm create -y hono@latest . -- --template cloudflare-pages --install --pm npm

# 3. Initialize git repository
git init
git add .
git commit -m "Initial commit"

# 4. Create Cloudflare D1 database
npx wrangler d1 create hgv-charging-sites-production
# Copy the database_id to wrangler.jsonc

# 5. Apply database migrations
npx wrangler d1 migrations apply hgv-charging-sites-production --local

# 6. Seed database with initial data
npx wrangler d1 execute hgv-charging-sites-production --local --file=./seed.sql

# 7. Build and run locally
npm run build
pm2 start ecosystem.config.cjs

# 8. Open browser
# http://localhost:3000
```

---

## 🏗️ Technology Stack

### Frontend
- **Hono** - Lightweight TypeScript web framework
- **Leaflet.js** - Interactive mapping (via CDN)
- **Turf.js** - Client-side geospatial analysis (via CDN)
- **Tailwind CSS** - Styling (via CDN)
- **Chart.js** - Data visualization (via CDN)

### Backend
- **Cloudflare Workers** - Edge computing platform
- **Cloudflare D1** - SQLite database at the edge
- **Cloudflare Pages** - Static site hosting with edge functions

### Spatial Analysis
- **Turf.js** - All spatial calculations (distance, buffers, point-in-polygon)
- No server-side PostGIS needed - everything runs client-side or at the edge

### External APIs
- UK Power Networks Open Data Portal
- National Highways WebTRIS
- DfT Road Traffic Statistics
- Planning.data.gov.uk
- Postcodes.io (geocoding)

---

## 📊 Data Sources Summary

### Grid Capacity
- **Primary:** UK Power Networks Open Data Portal ✅ FREE
- **Coverage:** 400,000+ substations across 14 DNOs
- **Data:** Voltage levels, capacity (MW), generation/demand headroom

### Traffic Flows
- **Primary:** WebTRIS API (National Highways) ✅ FREE
- **Coverage:** Strategic Road Network (motorways, major A-roads)
- **Data:** Daily/monthly HGV traffic counts, AADF

### Logistics Hubs
- **Primary:** Manual database + O-License data ✅ PUBLIC DATA
- **Coverage:** Major logistics parks, ports, rail freight terminals
- **Notable:** Golden Triangle (Magna Park, DIRFT, Hams Hall), UK Ports

### Planning Constraints
- **Primary:** Planning.data.gov.uk + JNCC ✅ FREE
- **Coverage:** Green belt, national parks, AONBs, SSSIs, conservation areas
- **Data:** GeoJSON boundary data for exclusion zones

---

## 🎯 Scoring Algorithm

Each site receives a 0-100 score based on four weighted factors:

```
Overall Score = (GridCapacity × 0.30) + 
                (TrafficFlows × 0.25) + 
                (LogisticsProximity × 0.25) + 
                (PlanningFeasibility × 0.20)
```

### Grid Capacity Score (30% weight)
- Distance to nearest substation
- Available capacity (MW)
- Voltage level (132kV, 33kV, 11kV)

### Traffic Flows Score (25% weight)
- HGV Annual Average Daily Flow (AADF)
- Distance to major road
- Traffic growth trends

### Logistics Proximity Score (25% weight)
- Distance to major distribution hub
- Hub size and importance
- O-license operator density
- Proximity to ports (bonus)

### Planning Feasibility Score (20% weight)
- Exclusions: National parks, AONBs, greenbelt, SSSIs
- Penalties: Conservation areas, flood zones
- Bonuses: Industrial zones, brownfield sites

**Score Interpretation:**
- **90-100** 🟢 Excellent (high priority)
- **75-89** 🔵 Good (recommend)
- **60-74** 🟡 Moderate (possible)
- **40-59** 🟠 Poor (not recommended)
- **0-39** 🔴 Unsuitable (exclude)

---

## 🗄️ Database Schema

The system uses Cloudflare D1 (SQLite) with the following tables:

- **logistics_hubs** - Distribution centers, ports, rail freight terminals
- **o_license_operators** - HGV operator locations from DVSA data
- **substations** - Grid supply points with capacity data
- **traffic_sites** - Traffic monitoring sites with HGV counts
- **planning_constraints** - Protected areas and planning restrictions
- **analysis_results** - Saved site analyses
- **api_cache** - Cached external API responses

**See IMPLEMENTATION_GUIDE.md for complete schema**

---

## 🌐 API Endpoints

### Public API Routes

```
GET  /api/logistics-hubs        # Get all logistics hubs
GET  /api/substations           # Get substations by capacity/voltage
GET  /api/traffic-sites         # Get traffic monitoring sites
GET  /api/planning-constraints  # Get planning constraints
POST /api/analyze-site          # Analyze specific location
POST /api/save-analysis         # Save analysis result
GET  /api/saved-analyses        # Get all saved analyses
```

### External API Proxies (with caching)

```
GET /api/external/ukpn/substations     # UK Power Networks proxy
GET /api/external/webtris/sites        # WebTRIS traffic data proxy
```

---

## 📈 Development Roadmap

### ✅ Phase 1: Foundation (Completed)
- [x] Comprehensive research
- [x] API documentation
- [x] System architecture design
- [x] Database schema
- [x] Implementation guide

### 🚧 Phase 2: Core Development (Next)
- [ ] Set up Cloudflare Pages project
- [ ] Implement database migrations
- [ ] Build Hono backend API
- [ ] Create Leaflet.js map interface
- [ ] Integrate Turf.js spatial analysis

### 🔜 Phase 3: Data Integration
- [ ] UK Power Networks API integration
- [ ] WebTRIS API integration
- [ ] Import O-License data
- [ ] Planning constraints integration
- [ ] API caching layer

### 🔮 Phase 4: Advanced Features
- [ ] Heatmap visualization
- [ ] Multi-site comparison
- [ ] PDF report export
- [ ] User accounts & authentication
- [ ] Mobile-responsive design

---

## 🎓 Example Use Case

### Scenario: Fleet Operator Looking for Charging Sites

**Goal:** Find optimal location near Magna Park for 10 HGV charging points (5MW)

**Process:**
1. Open web app and navigate to Magna Park area
2. Click on potential site near M1 Junction 20
3. System analyzes location:
   - ⚡ **Grid Score: 92/100** - Rugby Grid substation 1.2km away, 120MW capacity, 132kV
   - 🚛 **Traffic Score: 88/100** - M1 J20 site shows 9,200 HGV/day AADF
   - 🏭 **Logistics Score: 95/100** - 800m from Magna Park (13.1M sqft), in Golden Triangle
   - 📜 **Planning Score: 80/100** - Not in protected area, industrial zoning
   - **Overall Score: 89/100** 🔵 **GOOD - RECOMMEND**
4. Review detailed breakdown and nearby infrastructure
5. Save analysis for comparison with other sites
6. Export PDF report for stakeholders

---

## 🔧 Technical Considerations

### Why Cloudflare Pages + Turf.js?

**Advantages:**
- ✅ No server-side spatial database needed (D1 lacks PostGIS)
- ✅ Fast client-side calculations with Turf.js
- ✅ Global edge deployment via Cloudflare
- ✅ Zero cold starts (Workers are instant)
- ✅ Cost-effective (generous free tier)
- ✅ Scalable to millions of requests

**Limitations:**
- ⚠️ Complex spatial queries better suited to PostGIS
- ⚠️ Large datasets may need pre-processing
- ⚠️ Client-side calculations require modern browsers

**Mitigation:**
- Use Cloudflare D1 for structured data storage
- Turf.js handles 95% of spatial operations
- Optional Supabase + PostGIS for advanced features
- Pre-calculate and cache heavy operations

---

## 🤝 Contributing

This is a comprehensive research and implementation guide. Key areas for contribution:

1. **Data Collection**
   - Expand logistics hub database
   - Process O-License CSV data
   - Collect additional DNO datasets

2. **API Integration**
   - Implement API proxy routes
   - Build caching layer
   - Add rate limit handling

3. **Frontend Development**
   - Enhance map interface
   - Add data visualization charts
   - Improve mobile responsiveness

4. **Algorithm Refinement**
   - Optimize scoring weights
   - Add machine learning predictions
   - Incorporate additional factors

---

## 📞 Support & Contact

### Data Source Support
- **UK Power Networks:** dso@ukpowernetworks.co.uk
- **WebTRIS:** webtris@nationalhighways.co.uk
- **DfT Road Traffic:** roadtraff.stats@dft.gov.uk
- **Planning Data:** DigitalLand@communities.gov.uk

### Development Resources
- **Hono Docs:** https://hono.dev/
- **Turf.js Docs:** https://turfjs.org/
- **Cloudflare D1:** https://developers.cloudflare.com/d1/
- **Leaflet.js:** https://leafletjs.com/

---

## 📝 License

This project uses public sector data licensed under the [Open Government Licence v3.0](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

**Attribution:**
- Contains public sector information licensed under the Open Government Licence v3.0
- Contains Ordnance Survey data © Crown copyright and database right 2025

---

## 📊 Project Status

**Current Status:** 🔬 Research & Planning Phase Completed  
**Next Milestone:** 🚧 Begin Phase 2 - Core Development  
**Estimated Completion:** 10 weeks from development start  

---

## 🎯 Key Deliverables

✅ **Completed:**
- Comprehensive research document (27KB)
- Technical implementation guide (38KB)
- API reference guide (21KB)
- Database schema design
- Scoring algorithm specification
- System architecture design

🚧 **In Progress:**
- None (awaiting development start)

📋 **Next Steps:**
1. Create Cloudflare Pages project
2. Set up D1 database
3. Implement backend API routes
4. Build frontend map interface
5. Integrate external APIs

---

## 💡 Pro Tips

1. **Start with UK Power Networks API** - It's free, well-documented, and has excellent data quality
2. **Cache aggressively** - Most data changes infrequently, cache for 24 hours+
3. **Use Turf.js for everything** - Avoid server-side spatial complexity
4. **Pre-process O-License data** - Geocode addresses to lat/long once, store in D1
5. **Implement progressive loading** - Load data layers on-demand as user zooms
6. **Mobile-first design** - Fleet operators may use this in the field

---

**Built for fleet operators, by developers who understand logistics** 🚛⚡

**Let's accelerate the EV transition for heavy goods vehicles!** 🌍💚
