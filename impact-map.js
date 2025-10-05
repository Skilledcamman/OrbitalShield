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
        </div>
        <div id="impactStats" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 6px; color: white; font-size: 12px; min-width: 200px;">
          <div style="color: #ffcc00; font-weight: bold; margin-bottom: 8px;">Impact Statistics</div>
          <div id="statsContent">Select impact location</div>
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
    svg.style.pointerEvents = 'all';
    svg.style.background = 'transparent';

    mapElement.appendChild(svg);
    this.mapSvg = svg;

    // Add click handler for setting impact points
    svg.addEventListener('click', (e) => {
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 1000;
      const y = ((e.clientY - rect.top) / rect.height) * 500;
      
      // Convert to lat/lng (simplified projection)
      const lng = (x / 1000) * 360 - 180;
      const lat = 90 - (y / 500) * 180;
      
      this.setImpactPoint(lat, lng);
    });
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

    // Calculate effect radii (simplified)
    const craterRadius = Math.max(5, diameterKm * 10); // km
    const damageRadius = Math.max(20, Math.sqrt(energyMt) * 2); // km
    const shakingRadius = Math.max(50, Math.sqrt(energyMt) * 5); // km

    // Convert radii to SVG scale (very approximate)
    const kmToSvg = 1000 / 40075; // Rough conversion
    const craterSvg = craterRadius * kmToSvg;
    const damageSvg = damageRadius * kmToSvg;
    const shakingSvg = shakingRadius * kmToSvg;

    // Add impact effect circles
    if (shakingRadius > 0) {
      this.addEffectCircle(x, y, shakingSvg, '#ffcc44', 0.2, 'Strong Shaking Zone');
    }
    if (damageRadius > 0) {
      this.addEffectCircle(x, y, damageSvg, '#ff8844', 0.3, 'Severe Damage Zone');
    }
    if (craterRadius > 0) {
      this.addEffectCircle(x, y, craterSvg, '#ff4444', 0.5, 'Crater Zone');
    }

    // Update statistics display
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

  addEffectCircle(x, y, radius, color, opacity, title) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', color);
    circle.setAttribute('fill-opacity', opacity);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', 2);
    circle.setAttribute('stroke-opacity', 1.0);
    circle.setAttribute('stroke-dasharray', '5,3');
    
    // Enhanced styling for visibility over Earth texture
    circle.style.filter = `drop-shadow(0 0 3px ${color})`;
    
    // Add title for tooltip
    const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    titleElement.textContent = title;
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
    // Very simplified population estimation
    const majorCities = [
      { name: 'New York', lat: 40.7, lng: -74.0, pop: 8500000 },
      { name: 'Los Angeles', lat: 34.1, lng: -118.2, pop: 4000000 },
      { name: 'London', lat: 51.5, lng: -0.1, pop: 9000000 },
      { name: 'Tokyo', lat: 35.7, lng: 139.7, pop: 14000000 },
      { name: 'Mumbai', lat: 19.1, lng: 72.9, pop: 12500000 },
      { name: 'São Paulo', lat: -23.6, lng: -46.6, pop: 12300000 }
    ];

    let totalAtRisk = 0;
    majorCities.forEach(city => {
      const distance = this.calculateDistance(lat, lng, city.lat, city.lng);
      if (distance <= radiusKm) {
        const impactFactor = Math.max(0.1, 1 - (distance / radiusKm));
        totalAtRisk += Math.round(city.pop * impactFactor);
      }
    });

    return totalAtRisk;
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  updateImpactStats(stats) {
    const statsContent = document.getElementById('statsContent');
    if (statsContent) {
      statsContent.innerHTML = `
        <div><strong>Location:</strong> ${stats.location}</div>
        <div><strong>Asteroid:</strong> ${stats.diameter} km diameter</div>
        <div><strong>Velocity:</strong> ${stats.velocity} km/s</div>
        <div><strong>Energy:</strong> ${stats.energy} Mt TNT</div>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #444;">
        <div><strong>Crater:</strong> ${stats.craterRadius} km radius</div>
        <div><strong>Severe Damage:</strong> ${stats.damageRadius} km radius</div>
        <div><strong>Strong Shaking:</strong> ${stats.shakingRadius} km radius</div>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #444;">
        <div style="color: #ff6b6b;"><strong>Population at Risk:</strong> ${stats.populationAtRisk.toLocaleString()}</div>
      `;
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
window.impactZoneMap = new ImpactZoneMap();

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