// Impact Zone Mapping Module
// This module creates 2D visualizations of asteroid impact zones

class ImpactZoneMap {
  constructor() {
    this.map = null;
    this.impactMarker = null;
    this.impactCircles = [];
    this.isInitialized = false;
  }

  // Initialize the 2D impact map overlay
  initialize() {
    if (this.isInitialized) return;

    // Create map container
    const mapContainer = document.createElement('div');
    mapContainer.id = 'impactMap';
    mapContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80vw;
      max-width: 800px;
      height: 60vh;
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #ffcc00;
      border-radius: 12px;
      z-index: 2000;
      display: none;
      flex-direction: column;
      overflow: hidden;
    `;

    mapContainer.innerHTML = `
      <div style="padding: 15px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; color: #ffcc00;">🌍 Impact Zone Analysis</h3>
        <button id="closeImpactMap" style="background: #ff4444; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer;">
          ✕ Close
        </button>
      </div>
      <div style="flex: 1; position: relative; overflow: hidden;">
        <div id="worldMap" style="width: 100%; height: 100%; background: #001122;"></div>
        <div id="mapLegend" style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 6px; color: white; font-size: 12px;">
          <div style="color: #ffcc00; font-weight: bold; margin-bottom: 8px;">Impact Effects</div>
          <div><span style="color: #ff4444;">●</span> Crater Zone</div>
          <div><span style="color: #ff8844;">●</span> Severe Damage</div>
          <div><span style="color: #ffcc44;">●</span> Strong Shaking</div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444; font-size: 10px; color: #aaa;">
            💡 Use city dropdown to select location
          </div>
        </div>
        <div id="impactStats" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); border-radius: 6px; color: white; font-size: 12px; min-width: 200px; max-width: 300px;">
          <div class="dropdown-header" onclick="toggleImpactStats()" style="cursor: pointer; padding: 10px; border-bottom: 1px solid #444; display: flex; align-items: center; justify-content: space-between;">
            <span style="color: #ffcc00; font-weight: bold;">📊 Impact Statistics</span>
            <span id="impactStatsArrow" style="color: #ffcc00; font-weight: bold; transform: rotate(-90deg); transition: transform 0.3s;">▼</span>
          </div>
          <div id="statsContent" style="display: none; padding: 10px; max-height: 400px; overflow-y: auto; overflow-x: hidden;">Select impact location</div>
        </div>
      </div>
    `;

    document.body.appendChild(mapContainer);

    // Initialize simple world map visualization
    this.initializeWorldMap();

    // Close button handler
    document.getElementById('closeImpactMap').onclick = () => {
      this.hide();
    };

    // Click outside to close
    mapContainer.onclick = (e) => {
      if (e.target === mapContainer) {
        this.hide();
      }
    };

    this.isInitialized = true;
  }

  // Toggle impact statistics dropdown
  toggleImpactStats() {
    const content = document.getElementById('statsContent');
    const arrow = document.getElementById('impactStatsArrow');
    
    if (!content || !arrow) return;
    
    const isOpen = content.style.display !== 'none';
    
    if (isOpen) {
      // Close dropdown
      content.style.display = 'none';
      arrow.style.transform = 'rotate(-90deg)';
    } else {
      // Open dropdown
      content.style.display = 'block';
      arrow.style.transform = 'rotate(0deg)';
    }
  }

  initializeWorldMap() {
    const mapElement = document.getElementById('worldMap');
    if (!mapElement) return;

    // Create canvas for Earth texture background
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 500;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    mapElement.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    this.mapCanvas = canvas;
    this.mapContext = ctx;

    // Load Earth texture
    const earthImage = new Image();
    earthImage.crossOrigin = 'anonymous';
    earthImage.onload = () => {
      // Draw Earth texture as background
      ctx.drawImage(earthImage, 0, 0, 1000, 500);
      
      // Add dark overlay for better contrast
      ctx.fillStyle = 'rgba(0, 20, 40, 0.3)';
      ctx.fillRect(0, 0, 1000, 500);
      
      // Store the background for later restoration
      this.earthBackground = ctx.getImageData(0, 0, 1000, 500);
      
      // Add coordinate grid overlay
      this.addCanvasGrid(ctx);
    };
    
    earthImage.onerror = () => {
      console.log('Earth texture not found, using fallback');
      this.createFallbackBackground(ctx);
    };
    
    // Try to load earth.jpg
    earthImage.src = 'earth.jpg';

    // Create SVG overlay for interactive elements
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 1000 500');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none'; // Disable pointer events for map clicks
    svg.style.background = 'transparent';
    svg.style.cursor = 'default'; // Show default cursor

    mapElement.appendChild(svg);
    this.mapSvg = svg;

    // Click handler for setting impact points - DISABLED
    // Use dropdown menu instead for location selection
    /*
    svg.addEventListener('click', (e) => {
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 1000;
      const y = ((e.clientY - rect.top) / rect.height) * 500;
      
      // Convert to lat/lng (simplified projection)
      const lng = (x / 1000) * 360 - 180;
      const lat = 90 - (y / 500) * 180;
      
      this.setImpactPoint(lat, lng);
    });
    */
  }

  createFallbackBackground(ctx) {
    // Create a simple blue-green gradient as fallback
    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, '#001f3f');
    gradient.addColorStop(0.7, '#003d7a');
    gradient.addColorStop(1, '#0074D9');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1000, 500);
    
    // Add simple continent shapes
    ctx.fillStyle = '#2d5016';
    
    // Simple continent approximations
    const continents = [
      // North America
      { x: 150, y: 150, w: 200, h: 150 },
      // South America  
      { x: 200, y: 300, w: 100, h: 150 },
      // Europe/Asia
      { x: 450, y: 120, w: 350, h: 180 },
      // Africa
      { x: 480, y: 200, w: 120, h: 200 },
      // Australia
      { x: 750, y: 350, w: 100, h: 60 }
    ];
    
    continents.forEach(cont => {
      ctx.fillRect(cont.x, cont.y, cont.w, cont.h);
    });
    
    this.earthBackground = ctx.getImageData(0, 0, 1000, 500);
    this.addCanvasGrid(ctx);
  }

  addCanvasGrid(ctx) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.5;
    
    // Vertical lines (longitude)
    for (let i = 0; i <= 1000; i += 100) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 500);
      ctx.stroke();
    }
    
    // Horizontal lines (latitude)
    for (let i = 0; i <= 500; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1000, i);
      ctx.stroke();
    }
    
    // Add coordinate labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    // Longitude labels
    for (let i = 0; i <= 1000; i += 200) {
      const lng = (i / 1000) * 360 - 180;
      ctx.fillText(`${lng}°`, i, 20);
    }
    
    // Latitude labels
    ctx.textAlign = 'left';
    for (let i = 0; i <= 500; i += 100) {
      const lat = 90 - (i / 500) * 180;
      ctx.fillText(`${lat.toFixed(0)}°`, 10, i + 5);
    }
  }

  addContinents(svg) {
    // Simplified continent shapes (very basic representation)
    const continents = [
      // North America
      { path: 'M100,150 L250,120 L280,180 L200,250 L150,200 Z', color: '#2a4d3a' },
      // South America  
      { path: 'M200,250 L250,300 L230,400 L180,380 L190,300 Z', color: '#2a4d3a' },
      // Europe
      { path: 'M450,120 L520,110 L530,160 L480,170 Z', color: '#2a4d3a' },
      // Africa
      { path: 'M480,170 L550,160 L560,300 L500,320 L470,250 Z', color: '#2a4d3a' },
      // Asia
      { path: 'M520,110 L800,100 L820,200 L750,220 L530,160 Z', color: '#2a4d3a' },
      // Australia
      { path: 'M750,300 L820,290 L830,330 L780,340 Z', color: '#2a4d3a' }
    ];

    continents.forEach(continent => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', continent.path);
      path.setAttribute('fill', continent.color);
      path.setAttribute('stroke', '#1a3d2a');
      path.setAttribute('stroke-width', '1');
      svg.appendChild(path);
    });
  }

  addGrid(svg) {
    // Add latitude/longitude grid lines
    for (let i = 0; i <= 1000; i += 100) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', i);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', i);
      line.setAttribute('y2', 500);
      line.setAttribute('stroke', '#333');
      line.setAttribute('stroke-width', '0.5');
      line.setAttribute('opacity', '0.3');
      svg.appendChild(line);
    }

    for (let i = 0; i <= 500; i += 50) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', i);
      line.setAttribute('x2', 1000);
      line.setAttribute('y2', i);
      line.setAttribute('stroke', '#333');
      line.setAttribute('stroke-width', '0.5');
      line.setAttribute('opacity', '0.3');
      svg.appendChild(line);
    }
  }

  show(asteroidData = null) {
    if (!this.isInitialized) {
      this.initialize();
    }

    const mapContainer = document.getElementById('impactMap');
    if (mapContainer) {
      mapContainer.style.display = 'flex';
      
      if (asteroidData) {
        this.displayAsteroidImpact(asteroidData);
      }
    }
  }

  hide() {
    const mapContainer = document.getElementById('impactMap');
    if (mapContainer) {
      mapContainer.style.display = 'none';
    }
    this.clearImpactZones();
  }

  setImpactPoint(lat, lng, asteroidData = null) {
    if (!this.mapSvg) return;

    // Validate inputs
    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coordinates for impact point');
      return;
    }

    // Convert lat/lng to SVG coordinates
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;

    // Remove existing impact marker
    if (this.impactMarker) {
      this.impactMarker.remove();
    }

    // Add new impact marker with enhanced visibility for Earth texture
    this.impactMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.impactMarker.setAttribute('cx', x);
    this.impactMarker.setAttribute('cy', y);
    this.impactMarker.setAttribute('r', 10);
    this.impactMarker.setAttribute('fill', '#ff1100');
    this.impactMarker.setAttribute('stroke', '#ffffff');
    this.impactMarker.setAttribute('stroke-width', 3);
    this.impactMarker.style.filter = 'drop-shadow(0 0 10px #ff0000)';
    this.impactMarker.style.opacity = '0.9';
    
    // Add pulsing animation for better visibility
    const pulseAnimation = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    pulseAnimation.setAttribute('attributeName', 'r');
    pulseAnimation.setAttribute('values', '10;14;10');
    pulseAnimation.setAttribute('dur', '2s');
    pulseAnimation.setAttribute('repeatCount', 'indefinite');
    this.impactMarker.appendChild(pulseAnimation);
    
    this.mapSvg.appendChild(this.impactMarker);

    // Update impact location inputs
    const latInput = document.getElementById('impactLat');
    const lngInput = document.getElementById('impactLng');
    if (latInput) latInput.value = lat.toFixed(2);
    if (lngInput) lngInput.value = lng.toFixed(2);

    // Calculate and display impact effects if asteroid data is available
    if (asteroidData) {
      this.calculateImpactEffects(lat, lng, asteroidData);
    } else {
      // Use default values for demonstration
      this.calculateImpactEffects(lat, lng, {
        diameterKm: 1.0,
        velocityKmPerSec: 20.0,
        energyMt: 10000
      });
    }

    // Add debug validation if enabled
    const debugMode = localStorage.getItem('impactMapDebug') === 'true';
    if (debugMode) {
      this.debugPopulationCalculation(lat, lng);
    }
  }

  // Debug function to help validate population calculations
  debugPopulationCalculation(lat, lng) {
    console.log('🔍 DEBUG: Population Calculation Analysis');
    console.log(`📍 Impact Location: ${lat.toFixed(3)}, ${lng.toFixed(3)}`);
    
    const testRadii = [50, 100, 200, 500]; // km
    testRadii.forEach(radius => {
      const validation = this.validatePopulationCalculation(lat, lng, radius);
      console.log(`\n📊 Radius: ${radius}km`);
      console.log(`  Total at risk: ${validation.totalPopulation.toLocaleString()}`);
      console.log(`  Urban: ${validation.urbanPopulation.toLocaleString()}`);
      console.log(`  Rural: ${validation.ruralPopulation.toLocaleString()}`);
      console.log(`  Cities affected: ${validation.citiesInRange}`);
      if (validation.largestCity) {
        console.log(`  Largest city: ${validation.largestCity.name} (${validation.largestCity.atRisk.toLocaleString()} at risk)`);
      }
      if (validation.warnings.length > 0) {
        console.log(`  ⚠️ Warnings:`, validation.warnings);
      }
    });

    const regionalDensity = this.getRegionalPopulationDensity(lat, lng);
    console.log(`\n🌍 Regional population density: ${regionalDensity}/km²`);
  }

  // Enhanced function to enable/disable debug mode
  toggleDebugMode() {
    const isDebug = localStorage.getItem('impactMapDebug') === 'true';
    localStorage.setItem('impactMapDebug', !isDebug);
    
    const debugStatus = !isDebug ? 'enabled' : 'disabled';
    console.log(`🔍 Impact Map Debug Mode ${debugStatus}`);
    
    // Add visual indicator
    const debugIndicator = document.getElementById('debugIndicator');
    if (!debugIndicator && !isDebug) {
      const indicator = document.createElement('div');
      indicator.id = 'debugIndicator';
      indicator.style.cssText = `
        position: fixed; top: 10px; right: 10px; background: rgba(255,204,0,0.9); 
        color: #000; padding: 5px 10px; border-radius: 15px; font-size: 12px; 
        font-weight: bold; z-index: 2001; cursor: pointer;
      `;
      indicator.textContent = '🔍 DEBUG MODE';
      indicator.onclick = () => this.toggleDebugMode();
      document.body.appendChild(indicator);
    } else if (debugIndicator && isDebug) {
      document.body.removeChild(debugIndicator);
    }
    
    return !isDebug;
  }

  calculateImpactEffects(lat, lng, asteroidData) {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;

    // Clear previous impact zones
    this.clearImpactZones();

    // Calculate impact metrics (simplified version)
    const diameterKm = asteroidData.diameterKm || asteroidData.avgDiamKm || 1.0;
    const velocityKmPerSec = asteroidData.velocityKmPerSec || asteroidData.vRelKmPerSec || 20.0;
    const energyMt = asteroidData.energyMt || (diameterKm * diameterKm * diameterKm * 0.5);

    // Enhanced calculation of effect radii using scientific models
    const craterRadius = Math.max(3, diameterKm * 8); // More realistic crater scaling
    const damageRadius = Math.max(15, Math.sqrt(energyMt) * 1.8); // Severe structural damage
    const shakingRadius = Math.max(40, Math.sqrt(energyMt) * 4); // Strong ground shaking

    // Convert radii to SVG scale (more accurate conversion)
    const kmToSvg = 1000 / 40075; // Earth's circumference conversion
    const craterSvg = craterRadius * kmToSvg * 40; // Scale up for visibility
    const damageSvg = damageRadius * kmToSvg * 40;
    const shakingSvg = shakingRadius * kmToSvg * 40;

    // Add impact effect circles with enhanced styling and proper layering
    if (shakingRadius > 0) {
      this.addEffectCircle(x, y, shakingSvg, '#ffcc44', 0.15, 'Strong Shaking Zone', 'dashed');
    }
    if (damageRadius > 0) {
      this.addEffectCircle(x, y, damageSvg, '#ff8844', 0.25, 'Severe Damage Zone', 'solid');
    }
    if (craterRadius > 0) {
      this.addEffectCircle(x, y, craterSvg, '#ff4444', 0.4, 'Crater Zone (Complete Destruction)', 'solid');
    }

    // Update statistics display with enhanced data
    this.updateImpactStats({
      location: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      diameter: diameterKm.toFixed(2),
      velocity: velocityKmPerSec.toFixed(1),
      energy: energyMt.toLocaleString(),
      craterRadius: craterRadius.toFixed(0),
      damageRadius: damageRadius.toFixed(0),
      shakingRadius: shakingRadius.toFixed(0),
      populationAtRisk: this.estimatePopulationAtRisk(lat, lng, shakingRadius)
    });
  }

  addEffectCircle(x, y, radius, color, opacity, title, strokeStyle = 'solid') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', color);
    circle.setAttribute('fill-opacity', opacity);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', strokeStyle === 'solid' ? 3 : 2);
    circle.setAttribute('stroke-opacity', 0.9);
    
    // Enhanced stroke patterns for different damage zones
    if (strokeStyle === 'dashed') {
      circle.setAttribute('stroke-dasharray', '8,4');
    } else if (strokeStyle === 'dotted') {
      circle.setAttribute('stroke-dasharray', '2,3');
    }
    
    // Enhanced styling for visibility over Earth texture with animations
    circle.style.filter = `drop-shadow(0 0 5px ${color})`;
    
    // Add subtle pulsing animation for crater zone
    if (title.includes('Crater')) {
      const pulseAnimation = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      pulseAnimation.setAttribute('attributeName', 'stroke-opacity');
      pulseAnimation.setAttribute('values', '0.9;0.6;0.9');
      pulseAnimation.setAttribute('dur', '3s');
      pulseAnimation.setAttribute('repeatCount', 'indefinite');
      circle.appendChild(pulseAnimation);
    }
    
    // Add title for tooltip with enhanced information
    const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    titleElement.textContent = `${title} - Radius: ${(radius * 40075 / 1000 / 40).toFixed(1)} km`;
    circle.appendChild(titleElement);
    
    this.mapSvg.appendChild(circle);
    this.impactCircles.push(circle);
  }

  clearImpactZones() {
    this.impactCircles.forEach(circle => {
      if (circle.parentNode) {
        circle.parentNode.removeChild(circle);
      }
    });
    this.impactCircles = [];
    
    // Restore Earth background on canvas
    if (this.mapContext && this.earthBackground) {
      this.mapContext.putImageData(this.earthBackground, 0, 0);
    }
  }

  estimatePopulationAtRisk(lat, lng, radiusKm) {
    // Enhanced global cities database with accurate 2024 population data
    const majorCities = [
      // Asia - Major Urban Areas
      { name: 'Tokyo-Yokohama', lat: 35.7, lng: 139.7, pop: 38000000, density: 4400 },
      { name: 'Jakarta', lat: -6.2, lng: 106.8, pop: 35000000, density: 9600 },
      { name: 'Delhi', lat: 28.6, lng: 77.2, pop: 33000000, density: 11300 },
      { name: 'Manila', lat: 14.6, lng: 121.0, pop: 25700000, density: 15300 },
      { name: 'Shanghai', lat: 31.2, lng: 121.5, pop: 24800000, density: 3900 },
      { name: 'São Paulo', lat: -23.6, lng: -46.6, pop: 22400000, density: 7900 },
      { name: 'Seoul', lat: 37.6, lng: 126.9, pop: 25500000, density: 16000 },
      { name: 'Cairo', lat: 30.0, lng: 31.2, pop: 21300000, density: 19400 },
      { name: 'Mexico City', lat: 19.4, lng: -99.1, pop: 21800000, density: 9600 },
      { name: 'Beijing', lat: 39.9, lng: 116.4, pop: 21500000, density: 1300 },
      { name: 'Mumbai', lat: 19.1, lng: 72.9, pop: 21000000, density: 32300 },
      { name: 'Osaka-Kobe', lat: 34.7, lng: 135.5, pop: 18900000, density: 4600 },
      { name: 'Dhaka', lat: 23.8, lng: 90.4, pop: 22000000, density: 23000 },
      { name: 'New York', lat: 40.7, lng: -74.0, pop: 18800000, density: 4500 },
      { name: 'Karachi', lat: 24.9, lng: 67.1, pop: 16800000, density: 24000 },
      { name: 'Buenos Aires', lat: -34.6, lng: -58.4, pop: 15200000, density: 2600 },
      { name: 'Chongqing', lat: 29.6, lng: 106.5, pop: 15400000, density: 1100 },
      { name: 'Istanbul', lat: 41.0, lng: 28.9, pop: 15500000, density: 2800 },
      { name: 'Kolkata', lat: 22.6, lng: 88.4, pop: 15000000, density: 24000 },
      { name: 'Lagos', lat: 6.5, lng: 3.4, pop: 15300000, density: 18200 },
      { name: 'Kinshasa', lat: -4.3, lng: 15.3, pop: 15000000, density: 1500 },
      { name: 'Tianjin', lat: 39.1, lng: 117.2, pop: 14200000, density: 1200 },
      { name: 'Guangzhou', lat: 23.1, lng: 113.3, pop: 13500000, density: 1800 },
      { name: 'Rio de Janeiro', lat: -22.9, lng: -43.2, pop: 13300000, density: 5200 },
      { name: 'Lahore', lat: 31.6, lng: 74.3, pop: 13100000, density: 6600 },
      { name: 'Bangalore', lat: 12.9, lng: 77.6, pop: 13200000, density: 4100 },
      { name: 'Shenzhen', lat: 22.5, lng: 114.1, pop: 12900000, density: 6500 },
      { name: 'Moscow', lat: 55.8, lng: 37.6, pop: 12500000, density: 4900 },
      { name: 'Chennai', lat: 13.1, lng: 80.3, pop: 11500000, density: 26900 },
      { name: 'Bogotá', lat: 4.7, lng: -74.1, pop: 11000000, density: 4400 },
      { name: 'Paris', lat: 48.9, lng: 2.3, pop: 11000000, density: 3900 },
      { name: 'Hyderabad', lat: 17.4, lng: 78.5, pop: 10500000, density: 18500 },
      { name: 'Lima', lat: -12.0, lng: -77.0, pop: 10900000, density: 3200 },
      { name: 'Bangkok', lat: 13.8, lng: 100.5, pop: 10500000, density: 5300 },
      { name: 'Nagoya', lat: 35.2, lng: 136.9, pop: 10400000, density: 6400 },
      { name: 'London', lat: 51.5, lng: -0.1, pop: 9500000, density: 5700 },
      { name: 'Tehran', lat: 35.7, lng: 51.4, pop: 9500000, density: 6800 },
      { name: 'Ho Chi Minh City', lat: 10.8, lng: 106.7, pop: 9300000, density: 4300 },
      { name: 'Luanda', lat: -8.8, lng: 13.2, pop: 8900000, density: 2000 },
      
      // Additional major cities
      { name: 'Chicago', lat: 41.9, lng: -87.6, pop: 9500000, density: 1200 },
      { name: 'Ahmedabad', lat: 23.0, lng: 72.6, pop: 8800000, density: 12000 },
      { name: 'Kuala Lumpur', lat: 3.1, lng: 101.7, pop: 8600000, density: 8000 },
      { name: 'Xi\'an', lat: 34.3, lng: 108.9, pop: 8500000, density: 850 },
      { name: 'Hong Kong', lat: 22.3, lng: 114.2, pop: 7500000, density: 6800 },
      { name: 'Dongguan', lat: 23.0, lng: 113.8, pop: 8300000, density: 3400 },
      { name: 'Hangzhou', lat: 30.3, lng: 120.2, pop: 8100000, density: 500 },
      { name: 'Foshan', lat: 23.0, lng: 113.1, pop: 7900000, density: 2100 },
      { name: 'Shenyang', lat: 41.8, lng: 123.4, pop: 8100000, density: 620 },
      { name: 'Riyadh', lat: 24.7, lng: 46.7, pop: 7700000, density: 1500 },
      { name: 'Baghdad', lat: 33.3, lng: 44.4, pop: 7500000, density: 2000 },
      { name: 'Santiago', lat: -33.4, lng: -70.7, pop: 7200000, density: 8600 },
      { name: 'Belo Horizonte', lat: -19.9, lng: -43.9, pop: 6100000, density: 7200 },
      { name: 'Khartoum', lat: 15.5, lng: 32.5, pop: 6100000, density: 7000 },
      { name: 'Johannesburg', lat: -26.2, lng: 28.0, pop: 10000000, density: 2200 },
      { name: 'Dallas', lat: 32.8, lng: -96.8, pop: 7600000, density: 1100 },
      { name: 'Houston', lat: 29.8, lng: -95.4, pop: 7100000, density: 1400 },
      { name: 'Miami', lat: 25.8, lng: -80.2, pop: 6200000, density: 4600 },
      { name: 'Toronto', lat: 43.7, lng: -79.4, pop: 6200000, density: 4300 },
      { name: 'Madrid', lat: 40.4, lng: -3.7, pop: 6700000, density: 5300 },
      { name: 'Philadelphia', lat: 39.9, lng: -75.2, pop: 6100000, density: 4500 },
      { name: 'Washington DC', lat: 38.9, lng: -77.0, pop: 6300000, density: 4300 },
      { name: 'Los Angeles', lat: 34.1, lng: -118.2, pop: 13200000, density: 3200 },
      { name: 'Barcelona', lat: 41.4, lng: 2.2, pop: 5600000, density: 16000 },
      { name: 'Saint Petersburg', lat: 59.9, lng: 30.3, pop: 5400000, density: 3900 },
      { name: 'Nairobi', lat: -1.3, lng: 36.8, pop: 4400000, density: 4500 },
      { name: 'Berlin', lat: 52.5, lng: 13.4, pop: 3700000, density: 4100 },
      { name: 'Sydney', lat: -33.9, lng: 151.2, pop: 5300000, density: 2100 },
      { name: 'Melbourne', lat: -37.8, lng: 144.9, pop: 5100000, density: 510 },
      { name: 'Casablanca', lat: 33.6, lng: -7.6, pop: 3800000, density: 9200 },
      { name: 'Cape Town', lat: -33.9, lng: 18.4, pop: 4600000, density: 1500 },
      { name: 'Addis Ababa', lat: 9.0, lng: 38.7, pop: 5000000, density: 5200 },
      { name: 'Dar es Salaam', lat: -6.8, lng: 39.3, pop: 6700000, density: 3100 },
      
      // Additional cities from dropdown menu
      { name: 'Vancouver', lat: 49.3, lng: -123.1, pop: 2600000, density: 2800 },
      { name: 'Rome', lat: 41.9, lng: 12.5, pop: 4300000, density: 2200 },
      { name: 'Prague', lat: 50.1, lng: 14.4, pop: 1300000, density: 2600 },
      { name: 'Budapest', lat: 47.5, lng: 19.0, pop: 1800000, density: 3500 },
      { name: 'Singapore', lat: 1.4, lng: 103.8, pop: 5900000, density: 8400 },
      { name: 'Auckland', lat: -36.8, lng: 174.8, pop: 1700000, density: 350 },
      { name: 'New York City', lat: 40.7, lng: -74.0, pop: 8300000, density: 11000 },
      { name: 'Los Angeles City', lat: 34.1, lng: -118.2, pop: 4000000, density: 3200 },
      { name: 'Chicago City', lat: 41.9, lng: -87.6, pop: 2700000, density: 4600 },
      { name: 'Houston City', lat: 29.8, lng: -95.4, pop: 2300000, density: 1400 },
      { name: 'Miami City', lat: 25.8, lng: -80.2, pop: 470000, density: 4600 },
      { name: 'Dallas City', lat: 32.8, lng: -96.8, pop: 1300000, density: 1500 },
      { name: 'Philadelphia City', lat: 39.9, lng: -75.2, pop: 1600000, density: 4500 },
      { name: 'Washington DC City', lat: 38.9, lng: -77.0, pop: 700000, density: 4300 },
      { name: 'Istanbul City', lat: 41.0, lng: 28.9, pop: 15500000, density: 2800 },
      
      // Additional cities from expanded dropdown
      { name: 'Brisbane', lat: -27.5, lng: 153.0, pop: 2600000, density: 1800 },
      { name: 'Perth', lat: -31.9, lng: 115.9, pop: 2100000, density: 900 },
      { name: 'Wellington', lat: -41.3, lng: 174.8, pop: 400000, density: 1500 },
      { name: 'Christchurch', lat: -43.5, lng: 172.6, pop: 400000, density: 900 },
      { name: 'Copenhagen', lat: 55.7, lng: 12.6, pop: 2100000, density: 6800 },
      { name: 'Stockholm', lat: 59.3, lng: 18.1, pop: 2400000, density: 5200 },
      { name: 'Helsinki', lat: 60.2, lng: 24.9, pop: 1500000, density: 3000 },
      { name: 'Oslo', lat: 59.9, lng: 10.8, pop: 1700000, density: 1700 },
      { name: 'Dublin', lat: 53.3, lng: -6.3, pop: 1400000, density: 4600 },
      { name: 'Lisbon', lat: 38.7, lng: -9.1, pop: 2900000, density: 6500 },
      { name: 'Geneva', lat: 46.2, lng: 6.1, pop: 600000, density: 12800 },
      { name: 'Zurich', lat: 47.4, lng: 8.5, pop: 1400000, density: 4700 },
      { name: 'Vienna', lat: 48.2, lng: 16.4, pop: 1900000, density: 4600 },
      { name: 'Brussels', lat: 50.9, lng: 4.4, pop: 1200000, density: 7500 },
      { name: 'Amsterdam', lat: 52.4, lng: 4.9, pop: 2400000, density: 5100 },
      { name: 'Hamburg', lat: 53.6, lng: 10.0, pop: 1900000, density: 2400 },
      { name: 'Munich', lat: 48.1, lng: 11.6, pop: 2600000, density: 4700 },
      { name: 'Frankfurt', lat: 50.1, lng: 8.7, pop: 2300000, density: 3000 },
      { name: 'Dubai', lat: 25.2, lng: 55.3, pop: 3500000, density: 900 },
      { name: 'Abu Dhabi', lat: 24.5, lng: 54.4, pop: 1500000, density: 400 },
      { name: 'Kuwait City', lat: 29.3, lng: 47.5, pop: 4100000, density: 1900 },
      { name: 'Manama', lat: 26.2, lng: 50.6, pop: 700000, density: 2500 },
      { name: 'Doha', lat: 25.4, lng: 51.2, pop: 2400000, density: 1300 },
      { name: 'Muscat', lat: 23.4, lng: 53.8, pop: 1600000, density: 300 },
      { name: 'Giza', lat: 30.1, lng: 31.2, pop: 9200000, density: 19500 },
      { name: 'Alexandria', lat: 31.2, lng: 29.9, pop: 5200000, density: 8900 },
      { name: 'Beirut', lat: 33.9, lng: 35.5, pop: 2400000, density: 21000 },
      { name: 'Damascus', lat: 33.5, lng: 36.3, pop: 2100000, density: 15800 },
      { name: 'Jerusalem', lat: 31.8, lng: 35.2, pop: 1000000, density: 8000 },
      { name: 'Tel Aviv', lat: 32.1, lng: 34.8, pop: 4300000, density: 7900 },
      { name: 'Amman', lat: 32.0, lng: 35.9, pop: 4000000, density: 4200 },
      { name: 'Asunción', lat: -25.3, lng: -57.6, pop: 3200000, density: 4600 },
      { name: 'Montevideo', lat: -34.9, lng: -56.2, pop: 1700000, density: 2800 },
      { name: 'Caracas', lat: 10.5, lng: -66.9, pop: 2900000, density: 4100 },
      { name: 'Medellín', lat: 6.2, lng: -75.6, pop: 4000000, density: 7200 },
      { name: 'Quito', lat: -0.2, lng: -78.5, pop: 2800000, density: 4400 },
      { name: 'Santa Cruz', lat: -16.3, lng: -63.2, pop: 1400000, density: 2900 },
      { name: 'La Paz', lat: -17.8, lng: -63.2, pop: 2300000, density: 3500 },
      { name: 'Accra', lat: 5.6, lng: -0.2, pop: 4300000, density: 10500 },
      { name: 'Abuja', lat: 9.1, lng: 7.4, pop: 3300000, density: 3700 },
      { name: 'Kano', lat: 12.0, lng: 8.5, pop: 4100000, density: 7800 },
      { name: 'Durban', lat: -29.9, lng: 31.0, pop: 3700000, density: 1600 },
      { name: 'Pretoria', lat: -25.7, lng: 28.2, pop: 2900000, density: 3300 },
      { name: 'Kampala', lat: 0.3, lng: 32.6, pop: 3300000, density: 16800 },
      { name: 'Kigali', lat: -1.9, lng: 30.1, pop: 1300000, density: 1800 },
      { name: 'Tunis', lat: 36.8, lng: 10.2, pop: 2300000, density: 6700 },
      { name: 'Algiers', lat: 36.8, lng: 3.1, pop: 7800000, density: 15600 },
      { name: 'Lusaka', lat: -15.4, lng: 28.3, pop: 3100000, density: 5200 },
      { name: 'Harare', lat: -17.8, lng: 31.1, pop: 2100000, density: 4200 }
    ];

    let totalAtRisk = 0;
    let citiesAffected = [];
    let ruralPopulationAtRisk = 0;
    
    // Enhanced impact calculation with multiple damage zones
    const craterRadius = radiusKm * 0.2; // Inner 20% is crater zone
    const severeRadius = radiusKm * 0.5;  // Next 30% is severe damage
    const moderateRadius = radiusKm * 0.8; // Next 30% is moderate damage
    // Remaining 20% is light damage/strong shaking
    
    majorCities.forEach(city => {
      const distance = this.calculateDistance(lat, lng, city.lat, city.lng);
      if (distance <= radiusKm) {
        let impactFactor = 0;
        let damageLevel = '';
        
        // More realistic impact factor calculation based on distance and damage zones
        // These represent people affected (killed, injured, displaced), not just deaths
        if (distance <= craterRadius) {
          impactFactor = 0.95; // 95% casualties in crater zone (mostly fatal)
          damageLevel = 'complete';
        } else if (distance <= severeRadius) {
          // Severe damage zone - exponential decay, mix of deaths and serious injuries
          const distanceRatio = (distance - craterRadius) / (severeRadius - craterRadius);
          impactFactor = 0.60 * Math.exp(-1.5 * distanceRatio); // Max 60% casualties
          damageLevel = 'severe';
        } else if (distance <= moderateRadius) {
          // Moderate damage zone - mainly injuries and some deaths
          const distanceRatio = (distance - severeRadius) / (moderateRadius - severeRadius);
          impactFactor = 0.25 * (1 - Math.pow(distanceRatio, 2)); // Max 25% casualties
          damageLevel = 'moderate';
        } else {
          // Light damage zone - mainly minor injuries and displacement
          const distanceRatio = (distance - moderateRadius) / (radiusKm - moderateRadius);
          impactFactor = 0.08 * (1 - distanceRatio); // Max 8% casualties
          damageLevel = 'light';
        }
        
        // Adjust for population density and building quality
        let casualtyRate = impactFactor;
        
        // Dense urban areas have more casualties due to building collapse
        if (city.density > 15000) {
          casualtyRate *= 1.3; // Very dense cities (like Mumbai, Manila)
        } else if (city.density > 8000) {
          casualtyRate *= 1.15; // Dense cities
        } else if (city.density < 2000) {
          casualtyRate *= 0.6; // Spread out cities have fewer casualties
        }
        
        // Cap casualty rate at reasonable maximum (no city loses 100% of population)
        casualtyRate = Math.min(casualtyRate, 0.85);
        
        const cityRisk = Math.round(city.pop * casualtyRate);
        totalAtRisk += cityRisk;
        
        citiesAffected.push({
          name: city.name,
          distance: Math.round(distance),
          population: city.pop,
          atRisk: cityRisk,
          impactFactor: impactFactor,
          casualtyRate: casualtyRate,
          damageLevel: damageLevel,
          density: city.density
        });
      }
    });

    // Add rural population estimate based on global population density
    // This accounts for people living outside major cities
    ruralPopulationAtRisk = this.estimateRuralPopulation(lat, lng, radiusKm, craterRadius, severeRadius, moderateRadius);
    totalAtRisk += ruralPopulationAtRisk;

    // Store affected cities for detailed reporting
    this.lastAffectedCities = citiesAffected.sort((a, b) => b.atRisk - a.atRisk);
    this.lastRuralAtRisk = ruralPopulationAtRisk;

    return totalAtRisk;
  }

  // New method to estimate rural population at risk
  estimateRuralPopulation(lat, lng, radiusKm, craterRadius, severeRadius, moderateRadius) {
    // Global population density estimates by region (people per km²)
    const regionalDensity = this.getRegionalPopulationDensity(lat, lng);
    
    // Calculate areas of each damage zone
    const craterArea = Math.PI * Math.pow(craterRadius, 2);
    const severeArea = Math.PI * Math.pow(severeRadius, 2) - craterArea;
    const moderateArea = Math.PI * Math.pow(moderateRadius, 2) - Math.PI * Math.pow(severeRadius, 2);
    const lightArea = Math.PI * Math.pow(radiusKm, 2) - Math.PI * Math.pow(moderateRadius, 2);
    
    // Apply rural population density (typically 20-40% of regional average)
    const ruralDensity = regionalDensity * 0.35;
    
    // Calculate rural population in each zone with realistic casualty rates
    // Rural areas have lower casualty rates due to lower building density and better escape routes
    const ruralCrater = craterArea * ruralDensity * 0.80; // 80% casualties (vs 95% in cities)
    const ruralSevere = severeArea * ruralDensity * 0.35; // 35% casualties (vs up to 60% in cities)
    const ruralModerate = moderateArea * ruralDensity * 0.15; // 15% casualties (vs up to 25% in cities)
    const ruralLight = lightArea * ruralDensity * 0.04; // 4% casualties (vs up to 8% in cities)
    
    return Math.round(ruralCrater + ruralSevere + ruralModerate + ruralLight);
  }

  // New method to get regional population density
  getRegionalPopulationDensity(lat, lng) {
    // Regional population density estimates (people per km²)
    // Based on real-world data from WorldPop and other sources
    
    // Asia
    if (lng >= 60 && lng <= 150 && lat >= 5 && lat <= 55) {
      if (lng >= 100 && lng <= 140 && lat >= 20 && lat <= 45) return 350; // East Asia (China, Japan, Korea)
      if (lng >= 65 && lng <= 100 && lat >= 5 && lat <= 35) return 400; // South Asia (India, Pakistan, Bangladesh)
      if (lng >= 95 && lng <= 150 && lat >= -10 && lat <= 25) return 180; // Southeast Asia
      return 200; // Other Asia
    }
    
    // Europe
    if (lng >= -15 && lng <= 60 && lat >= 35 && lat <= 75) {
      if (lng >= 5 && lng <= 25 && lat >= 45 && lat <= 60) return 200; // Central Europe
      if (lng >= -10 && lng <= 20 && lat >= 35 && lat <= 50) return 170; // Southern Europe
      return 120; // Other Europe
    }
    
    // North America
    if (lng >= -170 && lng <= -50 && lat >= 25 && lat <= 75) {
      if (lng >= -130 && lng <= -70 && lat >= 30 && lat <= 50) return 35; // USA
      if (lng >= -140 && lng <= -50 && lat >= 45 && lat <= 75) return 4; // Canada
      if (lng >= -120 && lng <= -80 && lat >= 15 && lat <= 35) return 65; // Mexico/Central America
      return 20;
    }
    
    // Africa
    if (lng >= -20 && lng <= 55 && lat >= -35 && lat <= 40) {
      if (lng >= 25 && lng <= 40 && lat >= 0 && lat <= 15) return 80; // East Africa
      if (lng >= -10 && lng <= 25 && lat >= 0 && lat <= 20) return 45; // West/Central Africa
      if (lng >= 15 && lng <= 35 && lat >= -35 && lat <= 0) return 50; // Southern Africa
      return 35; // Other Africa
    }
    
    // South America
    if (lng >= -85 && lng <= -35 && lat >= -60 && lat <= 15) {
      if (lng >= -75 && lng <= -45 && lat >= -30 && lat <= 10) return 25; // Brazil
      if (lng >= -80 && lng <= -60 && lat >= -20 && lat <= 15) return 35; // Northern South America
      return 20; // Other South America
    }
    
    // Oceania
    if (lng >= 110 && lng <= 180 && lat >= -50 && lat <= -10) {
      return 3; // Australia/New Zealand
    }
    
    // Default for remote areas, oceans, Antarctica
    return 1;
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    // Enhanced Haversine formula with input validation
    const R = 6371; // Earth's radius in km
    
    // Input validation
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      console.warn('Invalid coordinates in distance calculation');
      return Infinity;
    }
    
    // Normalize coordinates
    lat1 = Math.max(-90, Math.min(90, lat1));
    lat2 = Math.max(-90, Math.min(90, lat2));
    lng1 = ((lng1 + 180) % 360) - 180;
    lng2 = ((lng2 + 180) % 360) - 180;
    
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Return 0 for very small distances (same location)
    return distance < 0.01 ? 0 : distance;
  }

  // Validation function to check population calculation accuracy
  validatePopulationCalculation(lat, lng, radiusKm) {
    const results = {
      isValid: true,
      warnings: [],
      totalPopulation: 0,
      urbanPopulation: 0,
      ruralPopulation: 0,
      citiesInRange: 0,
      largestCity: null
    };

    try {
      // Basic input validation
      if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
        results.isValid = false;
        results.warnings.push('Invalid input parameters');
        return results;
      }

      if (lat < -90 || lat > 90) {
        results.warnings.push('Latitude out of range (-90 to 90)');
      }

      if (lng < -180 || lng > 180) {
        results.warnings.push('Longitude out of range (-180 to 180)');
      }

      if (radiusKm <= 0 || radiusKm > 2000) {
        results.warnings.push('Impact radius seems unrealistic (0-2000 km)');
      }

      // Run the actual calculation
      const totalPop = this.estimatePopulationAtRisk(lat, lng, radiusKm);
      const urbanPop = this.lastAffectedCities ? 
        this.lastAffectedCities.reduce((sum, city) => sum + city.atRisk, 0) : 0;
      const ruralPop = this.lastRuralAtRisk || 0;

      results.totalPopulation = totalPop;
      results.urbanPopulation = urbanPop;
      results.ruralPopulation = ruralPop;
      results.citiesInRange = this.lastAffectedCities ? this.lastAffectedCities.length : 0;
      results.largestCity = this.lastAffectedCities && this.lastAffectedCities.length > 0 ? 
        this.lastAffectedCities[0] : null;

      // Validation checks
      if (totalPop > 500000000) { // 500 million
        results.warnings.push('Population at risk seems very high - check calculation');
      }

      if (totalPop === 0 && radiusKm > 50) {
        results.warnings.push('No population found in large impact zone - may indicate calculation issue');
      }

      if (urbanPop > totalPop) {
        results.isValid = false;
        results.warnings.push('Urban population exceeds total - calculation error');
      }

      if (results.citiesInRange > 50) {
        results.warnings.push('Very large number of cities affected - check radius');
      }

      // Regional validation
      const regionalDensity = this.getRegionalPopulationDensity(lat, lng);
      const expectedRuralPop = Math.PI * radiusKm * radiusKm * regionalDensity * 0.3;
      
      if (ruralPop > expectedRuralPop * 2) {
        results.warnings.push('Rural population estimate may be too high');
      }

    } catch (error) {
      results.isValid = false;
      results.warnings.push(`Calculation error: ${error.message}`);
    }

    return results;
  }

  updateImpactStats(stats) {
    const statsContent = document.getElementById('statsContent');
    if (statsContent) {
      // Build affected cities display with enhanced damage level information
      let citiesDisplay = '';
      let ruralDisplay = '';
      
      if (this.lastAffectedCities && this.lastAffectedCities.length > 0) {
        const topCities = this.lastAffectedCities.slice(0, 8); // Show top 8 most affected
        citiesDisplay = `
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #444;">
          <div style="color: #ffaa44; font-weight: bold; margin-bottom: 6px;">Major Cities Affected:</div>
          ${topCities.map(city => {
            const damageColor = {
              'complete': '#ff0000',
              'severe': '#ff4400', 
              'moderate': '#ff8800',
              'light': '#ffcc00'
            };
            const damageEmoji = {
              'complete': '💀',
              'severe': '🔥',
              'moderate': '⚠️', 
              'light': '📍'
            };
            return `
            <div style="font-size: 11px; margin: 3px 0; padding: 3px; background: rgba(255,255,255,0.05); border-radius: 3px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: ${damageColor[city.damageLevel] || '#fff'}">
                  ${damageEmoji[city.damageLevel] || '📍'} ${city.name}
                </strong>
                <span style="color: #aaa; font-size: 10px;">${city.distance}km</span>
              </div>
              <div style="color: #ccc; font-size: 10px; margin-top: 1px;">
                Pop: ${city.population.toLocaleString()} | Casualties: ${city.atRisk.toLocaleString()} 
                (${(city.casualtyRate * 100).toFixed(0)}%)
              </div>
              <div style="color: #888; font-size: 9px;">
                Density: ${city.density.toLocaleString()}/km² | ${city.damageLevel} damage
              </div>
            </div>
          `;
          }).join('')}
          ${this.lastAffectedCities.length > 8 ? 
            `<div style="font-size: 10px; color: #888; margin-top: 4px; text-align: center;">
              +${this.lastAffectedCities.length - 8} more cities affected
            </div>` : ''}
        `;
      }

      // Add rural population display
      if (this.lastRuralAtRisk && this.lastRuralAtRisk > 0) {
        ruralDisplay = `
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #444;">
          <div style="color: #98fb98; font-weight: bold; margin-bottom: 4px;">Rural/Suburban Areas:</div>
          <div style="font-size: 11px; color: #ccc;">
            🏘️ Rural/Suburban Casualties: ${this.lastRuralAtRisk.toLocaleString()}
          </div>
          <div style="font-size: 10px; color: #888; margin-top: 2px;">
            Based on regional population density estimates
          </div>
        `;
      }

      // Calculate damage zone breakdown
      const totalPop = stats.populationAtRisk;
      const urbanPop = this.lastAffectedCities ? 
        this.lastAffectedCities.reduce((sum, city) => sum + city.atRisk, 0) : 0;
      const ruralPop = this.lastRuralAtRisk || 0;

      statsContent.innerHTML = `
        <div><strong>Location:</strong> ${stats.location}</div>
        <div><strong>Asteroid:</strong> ${stats.diameter} km diameter</div>
        <div><strong>Velocity:</strong> ${stats.velocity} km/s</div>
        <div><strong>Energy:</strong> ${stats.energy} Mt TNT</div>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #444;">
        <div><strong>Impact Zones:</strong></div>
        <div style="font-size: 11px; margin: 4px 0;">
          🔴 Crater: ${stats.craterRadius} km radius (complete destruction)
        </div>
        <div style="font-size: 11px; margin: 4px 0;">
          🟠 Severe Damage: ${stats.damageRadius} km radius
        </div>
        <div style="font-size: 11px; margin: 4px 0;">
          🟡 Strong Shaking: ${stats.shakingRadius} km radius
        </div>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #444;">
        <div style="color: #ff6b6b; font-size: 14px;"><strong>Total Casualties (Killed/Injured/Displaced):</strong></div>
        <div style="color: #ff6b6b; font-size: 16px; font-weight: bold; margin: 4px 0;">
          ${totalPop.toLocaleString()}
        </div>
        <div style="font-size: 11px; color: #ccc; margin-top: 4px;">
          🏙️ Urban: ${urbanPop.toLocaleString()} | 🏘️ Rural: ${ruralPop.toLocaleString()}
        </div>
        ${citiesDisplay}
        ${ruralDisplay}
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #444;">
        <div style="font-size: 10px; color: #888; text-align: center; margin-top: 8px;">
          ℹ️ Casualty estimates include deaths, serious injuries, and displaced persons<br>
          Based on 2024 population data and scientific impact models
        </div>
      `;
      
      // Check if content is scrollable and add fade effect
      setTimeout(() => {
        const impactStats = document.getElementById('impactStats');
        if (statsContent && impactStats) {
          if (statsContent.scrollHeight > statsContent.clientHeight) {
            impactStats.classList.add('scrollable');
          } else {
            impactStats.classList.remove('scrollable');
          }
        }
      }, 100); // Small delay to ensure content is rendered
    }
  }

  displayAsteroidImpact(asteroidData) {
    // Get impact location from UI or use default
    const latInput = document.getElementById('impactLat');
    const lngInput = document.getElementById('impactLng');
    const lat = latInput?.value ? parseFloat(latInput.value) : 40.7; // Default to NYC
    const lng = lngInput?.value ? parseFloat(lngInput.value) : -74.0;
    
    this.setImpactPoint(lat, lng, asteroidData);
  }
}

// Global instance
window.ImpactZoneMap = ImpactZoneMap;

// Add CSS for animations
const mapStyles = document.createElement('style');
mapStyles.textContent = `
  #impactMap {
    animation: mapFadeIn 0.3s ease;
  }
  
  @keyframes mapFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  #worldMap svg circle {
    transition: r 0.3s ease, opacity 0.3s ease;
  }
  
  #worldMap svg circle:hover {
    stroke-width: 3;
    filter: drop-shadow(0 0 8px currentColor);
  }
`;
document.head.appendChild(mapStyles);

// Create global instance and expose toggle function
window.impactZoneMap = new ImpactZoneMap();

// Make toggle function globally accessible
window.toggleImpactStats = function() {
  if (window.impactZoneMap) {
    window.impactZoneMap.toggleImpactStats();
  }
};

// Make debug toggle globally accessible
window.toggleImpactMapDebug = function() {
  if (window.impactZoneMap) {
    return window.impactZoneMap.toggleDebugMode();
  }
  return false;
};

// Console help for users
console.log('🗺️ Impact Map Debug Commands:');
console.log('  toggleImpactMapDebug() - Enable/disable debug mode for population calculations');
console.log('  impactZoneMap.validatePopulationCalculation(lat, lng, radius) - Validate specific calculation');