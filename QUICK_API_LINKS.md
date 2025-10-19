# Quick API Links - Copy & Paste Reference

> All API endpoints ready to test immediately

---

## 🔗 Grid Capacity APIs

### UK Power Networks - Grid and Primary Sites
```
# Get all grid/primary sites
https://ukpowernetworks.opendatasoft.com/api/records/1.0/search/?dataset=grid-and-primary-sites&rows=100

# Search near Magna Park (52.4583, -1.2000) within 5km
https://ukpowernetworks.opendatasoft.com/api/records/1.0/search/?dataset=grid-and-primary-sites&geofilter.distance=52.4583,-1.2000,5000&rows=50

# Get as GeoJSON
https://ukpowernetworks.opendatasoft.com/api/records/1.0/search/?dataset=grid-and-primary-sites&geofilter.distance=52.4583,-1.2000,5000&format=geojson&rows=50

# API Console
https://ukpowernetworks.opendatasoft.com/api/v1/console

# Main Portal
https://ukpowernetworks.opendatasoft.com/
```

### National Grid Connected Data Portal
```
https://connecteddata.nationalgrid.co.uk/
```

---

## 🚛 Traffic Flow APIs

### WebTRIS - National Highways
```
# Get all traffic monitoring sites
http://webtris.nationalhighways.co.uk/api/v1.0/sites

# Get specific site details (example site 8188)
http://webtris.nationalhighways.co.uk/api/v1.0/sites/8188

# Get daily report (M1 example site)
http://webtris.nationalhighways.co.uk/api/v1.0/reports/daily?sites=8188&start_date=01012024&end_date=31012024&page=1&page_size=50

# Get monthly report
http://webtris.nationalhighways.co.uk/api/v1.0/reports/monthly?sites=8188&start_date=01012024&end_date=31122024&page=1&page_size=50

# Get all areas
http://webtris.nationalhighways.co.uk/api/v1.0/areas/

# Swagger docs
https://webtris.highwaysengland.co.uk/api/swagger/ui/index

# Main portal
https://webtris.nationalhighways.co.uk/
```

### DfT Road Traffic Statistics
```
# Get all regions
https://roadtraffic.dft.gov.uk/api/regions

# Get AADF for M1 in 2024
https://roadtraffic.dft.gov.uk/api/average-annual-daily-flow?filter[road_name]=M1&filter[year]=2024&page[number]=1&page[size]=100

# Get AADF with HGV filter
https://roadtraffic.dft.gov.uk/api/average-annual-daily-flow?filter[vehicle_type]=hgvs&page[number]=1&page[size]=100

# Get count points
https://roadtraffic.dft.gov.uk/api/count-points?page[number]=1&page[size]=100

# API Documentation
https://roadtraffic.dft.gov.uk/api-docs

# Main portal
https://roadtraffic.dft.gov.uk/
```

---

## 🏭 Logistics & O-License Data

### DVSA O-License Operator Data
```
# Main dataset page (CSV download)
https://www.data.gov.uk/dataset/2a67d1ee-8f1b-43a3-8bc6-e8772d162a3c/traffic-commissioners-goods-and-public-service-vehicle-operator-licence-records

# Direct CSV download (check for latest link)
# URL varies - get from data.gov.uk page

# DVSA Open Data portal
https://open.data.dvsa.gov.uk/vehicle-operator-licensing/index.html
```

### UK Port Statistics
```
# Major and Minor Port List (ODS/Excel)
https://assets.publishing.service.gov.uk/media/6888c795048fff613a4d5ae9/Major_and_Minor_Port_List_for_Freight_Statistics.ods

# Maritime Statistics main page
https://www.gov.uk/government/collections/maritime-and-shipping-statistics
```

---

## 📜 Planning Constraints APIs

### Planning.data.gov.uk
```
# Get green belt dataset
https://www.planning.data.gov.uk/dataset/green-belt

# Download all green belt as GeoJSON
https://www.planning.data.gov.uk/entity.geojson?dataset=green-belt

# Search green belt by point (Magna Park)
https://www.planning.data.gov.uk/entity.json?dataset=green-belt&longitude=-1.2000&latitude=52.4583

# Search conservation areas
https://www.planning.data.gov.uk/entity.json?dataset=conservation-area&limit=100

# Get all datasets
https://www.planning.data.gov.uk/dataset/

# API Documentation
https://www.planning.data.gov.uk/docs

# Main portal
https://www.planning.data.gov.uk/
```

### JNCC Protected Areas
```
# Main download page
https://jncc.gov.uk/our-work/uk-protected-area-datasets-for-download/

# Individual downloads (Shapefiles/GeoJSON)
# - National Parks
# - AONBs
# - SSSIs
# - SACs
# - SPAs
```

### Natural England - AONBs
```
# AONB dataset (England)
https://www.data.gov.uk/dataset/8e3ae3b9-a827-47f1-b025-f08527a4e84e/areas-of-outstanding-natural-beauty-england1
```

---

## 🗺️ Geocoding APIs

### Postcodes.io (UK Postcodes)
```
# Lookup single postcode
https://api.postcodes.io/postcodes/SW1A1AA

# Lookup postcode for Magna Park
https://api.postcodes.io/postcodes/LE174XW

# Reverse geocode (find nearest postcode)
https://api.postcodes.io/postcodes?lon=-1.2000&lat=52.4583&limit=10

# API Documentation
https://postcodes.io/docs
```

### Nominatim - OpenStreetMap
```
# Search for address
https://nominatim.openstreetmap.org/search?q=Magna+Park+Lutterworth&format=json&limit=1

# Reverse geocode
https://nominatim.openstreetmap.org/reverse?lat=52.4583&lon=-1.2000&format=json

# API Documentation
https://nominatim.org/release-docs/latest/api/Overview/
```

---

## 🧪 Test Commands (cURL)

### Test UK Power Networks API
```bash
curl "https://ukpowernetworks.opendatasoft.com/api/records/1.0/search/?dataset=grid-and-primary-sites&rows=5" | jq
```

### Test WebTRIS API
```bash
curl "http://webtris.nationalhighways.co.uk/api/v1.0/sites" | jq '.sites[:5]'
```

### Test DfT Road Traffic API
```bash
curl "https://roadtraffic.dft.gov.uk/api/regions" | jq
```

### Test Planning Data API
```bash
curl "https://www.planning.data.gov.uk/entity.json?dataset=green-belt&limit=5" | jq
```

### Test Postcodes.io
```bash
curl "https://api.postcodes.io/postcodes/LE174XW" | jq
```

---

## 📊 Example Queries with Parameters

### Get substations near specific location
```bash
# UK Power Networks - substations near Felixstowe Port
curl "https://ukpowernetworks.opendatasoft.com/api/records/1.0/search/?dataset=grid-and-primary-sites&geofilter.distance=51.9567,1.3517,10000&rows=20" | jq '.records[].fields | {name: .grid_name, voltage: .voltage_level, capacity: .capacity_mva, lat: .geo_point_2d[0], lng: .geo_point_2d[1]}'
```

### Get HGV traffic on M6
```bash
# DfT Road Traffic - HGV data for M6
curl "https://roadtraffic.dft.gov.uk/api/average-annual-daily-flow?filter[road_name]=M6&filter[year]=2024&page[size]=50" | jq '.data[].attributes | {road: .road_name, hgvs: .all_hgvs, year: .year}'
```

### Check if location is in green belt
```bash
# Planning Data - check Magna Park area
curl "https://www.planning.data.gov.uk/entity.json?dataset=green-belt&longitude=-1.2000&latitude=52.4583" | jq
```

### Geocode O-License addresses
```bash
# Postcodes.io - bulk lookup example
curl -X POST "https://api.postcodes.io/postcodes" \
  -H "Content-Type: application/json" \
  -d '{"postcodes": ["LE17 4XW", "CV6 6RS", "NW10 7LQ"]}' | jq
```

---

## 🌐 Data Portal Homepages

### Grid Capacity
- UK Power Networks: https://ukpowernetworks.opendatasoft.com/
- National Grid: https://connecteddata.nationalgrid.co.uk/
- NESO Data Portal: https://www.neso.energy/data-portal

### Traffic Data
- WebTRIS: https://webtris.nationalhighways.co.uk/
- DfT Road Traffic: https://roadtraffic.dft.gov.uk/
- DfT Statistics: https://www.gov.uk/government/statistical-data-sets/road-traffic-statistics-tra

### Planning & GIS
- Planning Data: https://www.planning.data.gov.uk/
- data.gov.uk: https://www.data.gov.uk/
- JNCC: https://jncc.gov.uk/
- Ordnance Survey: https://osdatahub.os.uk/

### Tools
- Postcodes.io: https://postcodes.io/
- Nominatim: https://nominatim.openstreetmap.org/
- GeoJSON.io: https://geojson.io/

---

## 📍 Example Locations for Testing

### Major Logistics Hubs
```
Magna Park, Lutterworth:     52.4583, -1.2000  (LE17 4XW)
DIRFT, Rugby:                52.4000, -1.1833  (CV23 0YH)
Hams Hall, Birmingham:       52.5167, -1.7167  (B46 1DP)
Port of Felixstowe:          51.9567,  1.3517  (IP11 3SY)
Port of Southampton:         50.9097, -1.4044  (SO15 1BA)
East Midlands Gateway:       52.8333, -1.3167  (DE74 2SA)
```

### Strategic Road Locations
```
M1 Junction 19 (Lutterworth):    52.2833, -0.9833
M1 Junction 21 (Leicester):      52.6333, -1.1500
M6 Junction 10 (Walsall):        52.6167, -1.9500
M25 Junction 30 (Dartford):      51.5000,  0.2500
M62 Junction 26 (Bradford):      53.7167, -1.6833
```

---

## 🔧 API Testing with Postman

### Import this collection:
```json
{
  "info": {
    "name": "HGV Charging Infrastructure APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "UK Power Networks - Get Substations",
      "request": {
        "method": "GET",
        "url": {
          "raw": "https://ukpowernetworks.opendatasoft.com/api/records/1.0/search/?dataset=grid-and-primary-sites&rows=50",
          "host": ["ukpowernetworks", "opendatasoft", "com"],
          "path": ["api", "records", "1.0", "search"],
          "query": [
            {"key": "dataset", "value": "grid-and-primary-sites"},
            {"key": "rows", "value": "50"}
          ]
        }
      }
    },
    {
      "name": "WebTRIS - Get All Sites",
      "request": {
        "method": "GET",
        "url": "http://webtris.nationalhighways.co.uk/api/v1.0/sites"
      }
    },
    {
      "name": "Planning Data - Green Belt",
      "request": {
        "method": "GET",
        "url": {
          "raw": "https://www.planning.data.gov.uk/entity.json?dataset=green-belt&limit=100",
          "query": [
            {"key": "dataset", "value": "green-belt"},
            {"key": "limit", "value": "100"}
          ]
        }
      }
    }
  ]
}
```

---

## 📱 Quick Access URLs (Bookmarks)

Add these to your browser bookmarks for instant access:

```
📊 Dashboard Links:
- UK Power Networks Dashboard: https://ukpowernetworks.opendatasoft.com/pages/home/
- WebTRIS Map: https://webtris.nationalhighways.co.uk/
- DfT Traffic Map: https://roadtraffic.dft.gov.uk/map
- Planning Data Map: https://www.planning.data.gov.uk/map/

📖 Documentation:
- UKPN API Docs: https://ukpowernetworks.opendatasoft.com/api/v1/console
- WebTRIS API Docs: https://webtris.highwaysengland.co.uk/api/swagger/ui/index
- DfT API Docs: https://roadtraffic.dft.gov.uk/api-docs
- Planning API Docs: https://www.planning.data.gov.uk/docs

💾 Data Downloads:
- O-License Data: https://www.data.gov.uk/dataset/2a67d1ee-8f1b-43a3-8bc6-e8772d162a3c/
- Port Statistics: https://assets.publishing.service.gov.uk/media/6888c795048fff613a4d5ae9/Major_and_Minor_Port_List_for_Freight_Statistics.ods
- Protected Areas: https://jncc.gov.uk/our-work/uk-protected-area-datasets-for-download/
- GB Traffic Counts: https://www.data.gov.uk/dataset/208c0e7b-353f-4e2d-8b7a-1a7118467acc/
```

---

## 🎯 Rate Limits Summary

| API | Rate Limit | Authentication | Cost |
|-----|------------|----------------|------|
| UK Power Networks | None stated | None | Free |
| WebTRIS | None stated | None | Free |
| DfT Road Traffic | None | None | Free |
| Planning.data.gov.uk | None stated | None | Free |
| Postcodes.io | Fair use (~1/sec) | None | Free |
| Nominatim | 1 req/sec | None | Free |
| JNCC Data | None (downloads) | None | Free |

**All primary APIs are free and open!** 🎉

---

## ⚡ Quick Copy-Paste Integration

### JavaScript Fetch Examples

```javascript
// UK Power Networks - Get nearby substations
const substations = await fetch(
  'https://ukpowernetworks.opendatasoft.com/api/records/1.0/search/' +
  '?dataset=grid-and-primary-sites' +
  `&geofilter.distance=${lat},${lng},5000` +
  '&rows=50'
).then(r => r.json())

// WebTRIS - Get traffic sites
const sites = await fetch(
  'http://webtris.nationalhighways.co.uk/api/v1.0/sites'
).then(r => r.json())

// DfT - Get HGV traffic for M1
const traffic = await fetch(
  'https://roadtraffic.dft.gov.uk/api/average-annual-daily-flow' +
  '?filter[road_name]=M1' +
  '&filter[year]=2024' +
  '&page[size]=100'
).then(r => r.json())

// Planning Data - Check green belt
const constraints = await fetch(
  'https://www.planning.data.gov.uk/entity.json' +
  '?dataset=green-belt' +
  `&longitude=${lng}&latitude=${lat}`
).then(r => r.json())

// Postcodes.io - Geocode
const geocode = await fetch(
  `https://api.postcodes.io/postcodes/${postcode}`
).then(r => r.json())
```

---

**🚀 All APIs tested and working as of 2025-10-19**

**Ready to build your HGV charging infrastructure system!** ⚡🚛
