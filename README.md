# Atlanta FloodXPlain

**CS 8803 / 4803 SDG: Computing and Sustainability — Georgia Tech**

Team: Aarushi Wagh · Ella Neumann · Tiger Peng · John Schmidt

---

## Overview

Atlanta FloodXPlain is an interactive web dashboard that maps flood risk across all 248 official Atlanta neighborhoods. It integrates stormwater infrastructure data, satellite-derived land cover, elevation, and environmental justice metrics to produce a neighborhood-level flood vulnerability index — then surfaces actionable recommendations for residents and policymakers.

The tool is designed for two audiences:
- **Residents** — understand their flood risk, sewer zone status, and concrete steps to take
- **Policymakers / researchers** — explore spatial patterns, environmental justice disparities, and infrastructure gaps across the city

---

## Relevance to SDGs

| SDG | Connection |
|-----|-----------|
| **SDG 11** — Sustainable Cities and Communities | Identifies flood-vulnerable neighborhoods and supports climate resilience planning |
| **SDG 13** — Climate Action | Quantifies urban flood risk as climate change intensifies storm frequency and intensity |
| **SDG 10** — Reduced Inequalities | Environmental Justice layer surfaces disproportionate flood burden on low-income and majority-Black neighborhoods |
| **SDG 6** — Clean Water and Sanitation | Combined sewer overflow (CSO) layer maps where raw sewage enters waterways during rain events |

---

## Flood Risk Methodology

The flood risk score is computed using Principal Component Analysis (PCA) on three independent data sources:

```
Flood Risk = 0.363·I + 0.359·D_risk + 0.279·E

D_risk = 1 − (0.493·D_d + 0.492·D_i + 0.015·D_o) + 0.2·1_no_outlet
```

| Variable | Meaning | Weight |
|----------|---------|--------|
| I | Impervious surface % | 0.363 |
| D_d | Storm pipe length density | 0.493 |
| D_i | Inlet density | 0.492 |
| D_o | Outlet density | 0.015 |
| E | Elevation risk | 0.279 |

**CSO Elevation Rule:** Neighborhoods adjacent to the combined sewer area *and* at lower elevation than the CSO zone median (305.9 ft) receive elevated warning — CSO overflow sewage flows downhill into them.

**Environmental Justice Score:** `0.4 × flood_risk + 0.35 × (pct_Black / 100) + 0.25 × (1 − income / $100k)`

**Risk tiers:** High ≥ 0.66 · Moderate 0.38–0.66 · Low < 0.38

### Academic Sources

- Li et al. (2021) — Urbanization impacts on flood risks — *Natural Hazards* [doi:10.1007/s11069-020-04480-0](https://link.springer.com/article/10.1007/s11069-020-04480-0)
- Sohn et al. (2020) — Impervious surfaces and urban flooding — *Science of the Total Environment* [doi:10.1016/j.ecolind.2020.106929](https://www.sciencedirect.com/science/article/abs/pii/S1470160X20307123)
- Blanc et al. (2024) — Urban pluvial flood modelling — *Urban Water Journal* [doi:10.1080/1573062X.2024.2446528](https://www.tandfonline.com/doi/full/10.1080/1573062X.2024.2446528)
- American Rivers (2020) — Intrenchment Creek One Water Management Plan [americanrivers.org](https://www.americanrivers.org/intrenchment-creek/)
- Zhang et al. (2023) — FAHP-EWM Urban Flood Risk — *Geomatics, Natural Hazards and Risk* [doi:10.1080/19475705.2023.2240943](https://www.tandfonline.com/doi/full/10.1080/19475705.2023.2240943)

---

## Data Sources

| Layer | Source | Format |
|-------|--------|--------|
| Neighborhood boundaries | City of Atlanta (COA) official boundaries | GeoJSON polygon |
| Storm pipes, inlets, outlets | COA stormwater infrastructure shapefiles | GeoJSON line/point |
| Impervious surface % | USGS NLCD 2024 | Raster → neighborhood aggregate |
| Elevation (min / mean / max) | USGS 3DEP 1/3 arc-second DEM | Raster → neighborhood aggregate |
| CSO / SSO zone boundaries | Atlanta Department of Watershed Management | Polygon |
| Custer Watershed boundary | `RedOutline_Project.shp` — COA consent decree | GeoJSON LineString |
| Demographics (race, income, poverty) | ACS 2020 5-year estimates | Tabular join |

All data is pre-processed and embedded as static GeoJSON in `data.js`. Every layer can be downloaded directly from the **Layers** tab using the `↓ GeoJSON` buttons.

---

## Dashboard Features

### Tabs

| Tab | Contents |
|-----|----------|
| **Layers** | Toggle 10 map layers on/off; download each as GeoJSON |
| **Flood Index** | Risk methodology, neighborhood list with filters (EJ Priority, CSO Zone, High/Moderate/Low), detail panel with per-neighborhood actions |
| **Sewers** | CSO/SSO explainer cards with consent decree links; named facility markers |
| **News** | Recent Atlanta flood and sewer news |
| **Evaluation** | 5-question feedback form submitted to project team |

### Map Layers

| Layer | Default | Description |
|-------|---------|-------------|
| Flood risk polygons | ✓ | 248 neighborhoods colored by risk tier |
| Demographics overlay | — | Environmental justice neighborhoods (purple) |
| CSO zones | ✓ | Combined sewer areas — sewage + stormwater share one pipe |
| SSO zones | ✓ | Sanitary sewer areas |
| Custer Watershed Boundary | ✓ | Intrenchment Creek / Custer Ave drainage area |
| Storm pipes | ✓ | COA shapefile — colored by material (RCP/VCP/CMP/PVC) |
| Storm outlets | ✓ | Discharge points into waterways (amber dots) |
| Storm inlets | — | Street-level entry points (blue dots) |
| Rivers and streams | ✓ | 10 named waterways |
| Waterway labels | ✓ | Named text overlays on waterways |

### Export / Download

- **↓ GeoJSON** button on each layer row downloads that layer's data as a `.geojson` file compatible with QGIS, ArcGIS, and GeoPandas
- **↓ Save as PDF** button on each tab opens the browser print dialog — choose "Save as PDF" to export the current tab

---

## Technology Stack

| Technology | Use |
|------------|-----|
| [Leaflet](https://leafletjs.com/) v1.9.4 | Interactive map |
| CartoDB Voyager / Esri World Imagery | Basemap tiles |
| Vanilla JavaScript (ES5+) | All application logic — no build step required |
| CSS3 with Okabe-Ito palette | Colorblind-accessible styling (verified for Deuteranopia, Protanopia, Tritanopia) |
| IBM Plex Sans / IBM Plex Mono | Typography |
| [Formspree](https://formspree.io/) | Evaluation form submission |

No framework, no bundler. The entire app runs from a single `index.html` served as a static file.

---

## Running Locally

```bash
git clone https://github.com/ellaneumann/FloodXPlain-Prototype.git
cd FloodXPlain-Prototype
python3 -m http.server 8080
# open http://localhost:8080
```

Or open `index.html` directly in a browser — all map layers and downloads work without a server. The News tab requires a local server to load `news-panel.html`.

---

## Repository Structure

```
FloodXPlain-Prototype/
├── index.html          # App shell, tab panels, layer controls
├── app.js              # Map logic, layer rendering, flood risk actions
├── data.js             # All GeoJSON data (248 neighborhoods + infrastructure)
├── styles.css          # Design system, colorblind-safe palette, print CSS
└── news-panel.html     # News tab markup (loaded at runtime)
```

---

## Color Encoding (Colorblind-Accessible)

| Color | Meaning |
|-------|---------|
| Rose `#D81B60` | EJ Priority neighborhood |
| Dark teal `#004D40` | Inside CSO zone |
| Teal-blue `#005F73` | Downhill from CSO (overflow path) |
| Deep orange `#E65100` | High flood risk (≥ 0.66) |
| Amber `#F9A825` | Moderate flood risk |
| Navy `#1565C0` | Low flood risk |

Palette verified for Deuteranopia, Protanopia, and Tritanopia using Okabe-Ito conventions.

---

## License

Data from City of Atlanta and USGS is public domain. Application code is available for educational and non-commercial use.
