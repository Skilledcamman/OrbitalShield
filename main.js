import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'CSS2DRenderer';

// Initialize dropdown functionality
function initializeDropdownPanels() {
  // Initialize all dropdown panels
  const dropdowns = ['impactLocationContent', 'defenseContent'];
  
  dropdowns.forEach(id => {
    const content = document.getElementById(id);
    const arrow = document.getElementById(id.replace('Content', 'Arrow'));
    
    if (content && arrow) {
      // Set initial state to collapsed
      content.style.display = 'none';
      arrow.style.transform = 'rotate(-90deg)';
    }
  });
}

// Toggle dropdown panel function
function toggleDropdown(contentId) {
  const content = document.getElementById(contentId);
  const arrow = document.getElementById(contentId.replace('Content', 'Arrow'));
  
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

// Make toggleDropdown globally accessible
window.toggleDropdown = toggleDropdown;

// Update impact display
function updateImpactDisplay() {
  const lat = parseFloat(document.getElementById('impactLat').value);
  const lon = parseFloat(document.getElementById('impactLng').value);
  
  if (!isNaN(lat) && !isNaN(lon)) {
    const impactDisplay = document.getElementById('impactDisplay');
    if (impactDisplay) {
      impactDisplay.innerHTML = `
        <strong>Impact Location:</strong><br>
        Latitude: ${lat.toFixed(3)}°<br>
        Longitude: ${lon.toFixed(3)}°<br>
        <small style="color: #888;">Visual markers updated on Earth</small>
      `;
    }
    
    // Update impact map statistics if map is open and asteroid is selected
    updateImpactMapStats(lat, lon);
  }
}

// Update impact map statistics when coordinates change
function updateImpactMapStats(lat, lng) {
  // Check if impact map is open and there's an asteroid selected
  if (window.impactZoneMap && window.currentSelectedAsteroid) {
    const impactMap = document.getElementById('impactMap');
    if (impactMap && impactMap.style.display !== 'none') {
      // Re-calculate and update the impact statistics with new coordinates
      window.impactZoneMap.setImpactPoint(lat, lng, window.currentSelectedAsteroid);
    }
  }
}

const API_BASE = 'https://api.nasa.gov/neo/rest/v1/neo/browse';
const USGS_EARTHQUAKE_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';
const USGS_ELEVATION_API = 'https://nationalmap.gov/epqs/pqs.php';

// USGS Data Cache
let usgsDataCache = {
  earthquakes: [],
  timestamp: 0,
  maxAge: 30 * 60 * 1000 // 30 minutes cache
};

// Global variable to track current selected asteroid for impact map updates
window.currentSelectedAsteroid = null;

// Loading progress functions
function updateLoadingProgress(percent, message) {
  const progressBar = document.getElementById('progressBar');
  const loadingProgress = document.getElementById('loadingProgress');
  const loadingDetails = document.getElementById('loadingDetails');
  
  if (progressBar) progressBar.style.width = percent + '%';
  if (loadingProgress) loadingProgress.textContent = `Loading... ${percent}%`;
  if (loadingDetails) loadingDetails.textContent = message;
}

function checkLoadingComplete(loadingComplete) {
  if (loadingComplete.starMap && loadingComplete.earthTexture) {
    updateLoadingProgress(90, "Finalizing scene...");
    setTimeout(() => {
      updateLoadingProgress(100, "Complete!");
      setTimeout(() => {
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
          loadingScreen.style.opacity = '0';
          loadingScreen.style.transition = 'opacity 0.5s ease';
          setTimeout(() => {
            loadingScreen.style.display = 'none';
            // Show enter screen
            showEnterScreen();
          }, 500);
        }
      }, 300);
    }, 200);
  }
}

function showEnterScreen() {
  const enterScreen = document.getElementById('enterScreen');
  if (enterScreen) {
    enterScreen.style.display = 'flex';
    enterScreen.style.opacity = '0';
    setTimeout(() => {
      enterScreen.style.transition = 'opacity 0.8s ease';
      enterScreen.style.opacity = '1';
    }, 100);
    
    // Set up scroll listener to enter the main application
    setupScrollToEnter();
  }
}

function setupScrollToEnter() {
  let scrollTimeout;
  
  function handleScroll() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      enterMainApplication();
    }, 100);
  }
  
  function handleKeyDown(event) {
    // Enter on space, enter, or arrow keys
    if (event.code === 'Space' || event.code === 'Enter' || 
        event.code === 'ArrowDown' || event.code === 'ArrowUp') {
      event.preventDefault();
      enterMainApplication();
    }
  }
  
  // Add scroll and keyboard listeners
  window.addEventListener('wheel', handleScroll, { passive: true });
  window.addEventListener('touchmove', handleScroll, { passive: true });
  window.addEventListener('keydown', handleKeyDown);
  
  // Click to enter as well
  const enterScreen = document.getElementById('enterScreen');
  if (enterScreen) {
    enterScreen.addEventListener('click', enterMainApplication);
  }
  
  function enterMainApplication() {
    // Remove listeners
    window.removeEventListener('wheel', handleScroll);
    window.removeEventListener('touchmove', handleScroll);
    window.removeEventListener('keydown', handleKeyDown);
    
    // Hide enter screen and show main UI
    const enterScreen = document.getElementById('enterScreen');
    const uiOverlay = document.getElementById('ui-overlay');
    const canvas = document.getElementById('canvas');
    
    if (enterScreen) {
      enterScreen.style.transition = 'opacity 0.8s ease';
      enterScreen.style.opacity = '0';
      setTimeout(() => {
        enterScreen.style.display = 'none';
      }, 800);
    }
    
    if (canvas) {
      canvas.style.transition = 'opacity 0.8s ease';
      canvas.style.opacity = '1';
    }
    
    if (uiOverlay) {
      uiOverlay.style.transition = 'opacity 0.8s ease';
      uiOverlay.style.opacity = '1';
    }
    
    // Ensure OrbitControls are enabled
    if (window.orbitControls) {
      window.orbitControls.enabled = true;
    }
  }
}

// --- USGS Data Integration Functions ---
async function fetchUSGSEarthquakeData() {
  try {
    const now = Date.now();
    if (usgsDataCache.earthquakes.length > 0 && (now - usgsDataCache.timestamp) < usgsDataCache.maxAge) {
      console.log('Using cached USGS earthquake data');
      return usgsDataCache.earthquakes;
    }

    console.log('Fetching USGS earthquake data...');
    const response = await fetch(USGS_EARTHQUAKE_API);
    if (!response.ok) throw new Error(`USGS API failed: ${response.status}`);
    
    const data = await response.json();
    const earthquakes = data.features?.slice(0, 50) || []; // Limit to recent 50 earthquakes
    
    usgsDataCache = {
      earthquakes,
      timestamp: now,
      maxAge: usgsDataCache.maxAge
    };
    
    console.log(`Fetched ${earthquakes.length} recent earthquakes from USGS`);
    return earthquakes;
  } catch (error) {
    console.warn('Failed to fetch USGS earthquake data:', error);
    return [];
  }
}

async function getElevationData(latitude, longitude) {
  try {
    const url = `${USGS_ELEVATION_API}?x=${longitude}&y=${latitude}&units=Meters&output=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Elevation API failed: ${response.status}`);
    
    const data = await response.json();
    return data.USGS_Elevation_Point_Query_Service?.Elevation_Query?.Elevation || 0;
  } catch (error) {
    console.warn('Failed to fetch elevation data:', error);
    return 0;
  }
}

function calculateSeismicEffects(energyMt, impactLat, impactLng) {
  // Enhanced seismic calculation with geographic considerations
  const baseM = (Math.log10(Math.max(1, energyMt * MT_TO_JOULES)) - 4.8) / 1.5;
  const magnitude = Math.min(12, Math.max(-1, baseM));
  
  // Calculate affected zones (simplified)
  const strongShakingRadius = Math.min(500, magnitude * 25); // km
  const damageRadius = Math.min(200, magnitude * 10); // km
  const feltRadius = Math.min(1000, magnitude * 50); // km
  
  return {
    magnitude: magnitude.toFixed(1),
    strongShakingRadius: Math.round(strongShakingRadius),
    damageRadius: Math.round(damageRadius),
    feltRadius: Math.round(feltRadius)
  };
}



// Cache for asteroid data to avoid re-fetching
let asteroidCache = {
  data: [],
  timestamp: 0,
  maxAge: 5 * 60 * 1000 // 5 minutes cache
};

async function fetchAsteroids(apiKey, maxCount = 20) {
  try {
    // Check cache first
    const now = Date.now();
    if (asteroidCache.data.length > 0 && (now - asteroidCache.timestamp) < asteroidCache.maxAge) {
      console.log('Using cached asteroid data');
      return asteroidCache.data.slice(0, maxCount);
    }

    const infoPanel = document.getElementById('infoPanel');
    if (infoPanel) {
      infoPanel.innerHTML = '<div style="color:#ffcc00;">🔄 Fetching asteroids from NeoWS API...</div>';
    }

    const size = 20; // NASA API returns max 20 per page
    const maxPages = Math.min(10, Math.ceil(maxCount / size));
    const fetchPromises = [];

    for (let page = 0; page < maxPages; page++) {
      const url = `${API_BASE}?api_key=${encodeURIComponent(apiKey)}&page=${page}&size=${size}`;
      fetchPromises.push(
        fetch(url)
          .then(async res => {
            if (!res.ok) throw new Error(`Page ${page} failed: ${res.status}`);
            const data = await res.json();
            return { page, asteroids: data.near_earth_objects || [] };
          })
          .catch(err => {
            console.warn(`Failed to fetch page ${page}:`, err);
            return { page, asteroids: [] };
          })
      );
    }

    console.log(`Fetching ${maxPages} pages in parallel...`);
    const results = await Promise.all(fetchPromises);
    let allAsteroids = [];
    results
      .sort((a, b) => a.page - b.page)
      .forEach(result => {
        if (result.asteroids.length > 0) {
          allAsteroids = allAsteroids.concat(result.asteroids);
        }
      });

    asteroidCache = {
      data: allAsteroids,
      timestamp: now,
      maxAge: asteroidCache.maxAge
    };

    console.log('Fetched', allAsteroids.length, 'asteroids total');
    return allAsteroids.slice(0, maxCount);
  } catch (err) {
    console.error('Fetch error:', err);
    const infoPanel = document.getElementById('infoPanel');
    if (infoPanel) {
      infoPanel.innerHTML = '<div style="color:#ff4444;">❌ Failed to fetch asteroid data. Check console for details.</div>';
    }
    return [];
  }
}

// --- Impact physics & mitigation helpers ---
const M_PER_KM = 1000;
const DENSITY_ROCK = 3000; // kg/m^3
const MT_TO_JOULES = 4.184e15; // 1 Megaton TNT to Joules
const EARTH_ORBITAL_VELOCITY = 29.78; // km/s
const EARTH_DIAMETER_KM = 12742;

function calculateImpactMetrics(diameterKm, vRelKmPerSec, impactLat = 0, impactLng = 0) {
  const radiusM = (diameterKm / 2) * M_PER_KM;
  const massKg = DENSITY_ROCK * (4/3) * Math.PI * Math.pow(radiusM, 3);
  const vMPerSec = vRelKmPerSec * M_PER_KM;
  const kineticEnergyJ = 0.5 * massKg * Math.pow(vMPerSec, 2);
  const energyMt = kineticEnergyJ / MT_TO_JOULES;
  const craterCoef = 0.6;
  let D_crater_km = craterCoef * Math.pow(Math.max(1e-6, energyMt), 1/3);
  D_crater_km = Math.min(D_crater_km, EARTH_DIAMETER_KM);
  const Mw_raw = (Math.log10(Math.max(1, kineticEnergyJ)) - 4.8) / 1.5;
  const Mw = Math.min(12, Math.max(-1, Mw_raw));
  
  // Enhanced environmental effects
  const seismicEffects = calculateSeismicEffects(energyMt, impactLat, impactLng);
  
  // Atmospheric effects
  let atmosphericEffects = 'None';
  if (energyMt > 1000000) atmosphericEffects = 'Global climate change, nuclear winter';
  else if (energyMt > 100000) atmosphericEffects = 'Regional climate effects, dust clouds';
  else if (energyMt > 1000) atmosphericEffects = 'Local atmospheric disturbance';
  else if (energyMt > 1) atmosphericEffects = 'Airburst effects, shock waves';
  
  return { 
    kineticEnergyJ, 
    energyMt, 
    D_crater_km, 
    Mw,
    seismicEffects,
    atmosphericEffects
  };
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateTorinoProxy(energyMt, impactProbability = 0) {
  if (!impactProbability || impactProbability < 1e-6) return 0;
  let torinoEnergy = Math.round(Math.log10(energyMt + 1));
  torinoEnergy = Math.min(10, Math.max(0, torinoEnergy));
  let probScore = 0;
  if (impactProbability >= 0.01) probScore = 3;
  else if (impactProbability >= 0.001) probScore = 2;
  else if (impactProbability >= 0.0001) probScore = 1;
  let torino = probScore === 3 ? torinoEnergy : probScore === 2 ? Math.max(0, torinoEnergy - 2) : probScore === 1 ? Math.max(0, torinoEnergy - 4) : 0;
  return Math.min(10, Math.max(0, torino));
}

function calculateDeflection(deltaVMmPerSec, yearsToImpact, vRelKmPerSec, asteroidMass = null, method = 'kinetic', customSpacecraftMass = null) {
  if (!deltaVMmPerSec || deltaVMmPerSec <= 0) return { 
    missDistanceKm: 0, 
    missDistanceLD: 0, 
    deflectionAngle: 0, 
    energyEfficiency: 0, 
    successProbability: 0,
    orbitalVelocityChange: 0,
    momentumTransfer: 0,
    massEfficiency: 0,
    usedSpacecraftMass: 0,
    usedMassRatio: 0
  };

  // Enhanced orbital mechanics calculation
  const timeSec = yearsToImpact * 365.25 * 24 * 60 * 60;
  const deltaVKmPerSec = deltaVMmPerSec * 1e-6;
  
  // Determine spacecraft mass: custom value or method-optimal default
  const spacecraftMass = Math.max(500, customSpacecraftMass || getDefaultSpacecraftMass(method)); // Minimum 500kg (scientifically accurate)
  
  // Always use real asteroid mass (from API data or sensible default)
  const actualAsteroidMass = Math.max(1e5, asteroidMass || 1e12); // Minimum 100,000 kg (house-sized), default 1 billion kg
  const massRatio = Math.min(1e8, actualAsteroidMass / spacecraftMass); // Cap at 100 million:1 ratio
  
  // Method-specific efficiency factors with mass scaling
  const methodData = getMethodPhysics(method, spacecraftMass, actualAsteroidMass, vRelKmPerSec, timeSec);
  const efficiency = methodData.efficiency;
  const momentumTransfer = methodData.momentumTransfer;
  
  const effectiveDeltaV = deltaVKmPerSec * efficiency;
  
  // Orbital mechanics: deflection depends on velocity change and time
  // Using Gauss's equations for orbital perturbations
  const orbitalRadius = 1.0; // AU (simplified for NEO)
  const orbitalVelocity = 30; // km/s (Earth's orbital velocity)
  
  // Deflection angle in radians (small angle approximation)
  const deflectionAngleRad = effectiveDeltaV / vRelKmPerSec;
  const deflectionAngleDeg = deflectionAngleRad * (180 / Math.PI);
  
  // Miss distance calculation using proper orbital mechanics
  // Distance = velocity_change × time × geometric_factor
  const geometricFactor = Math.sqrt(orbitalRadius); // Accounts for orbital curvature
  const rawMissDistanceKm = effectiveDeltaV * timeSec * geometricFactor;
  
  // Cap miss distance at reasonable astronomical scale (10 million km ~ 26 LD)
  const missDistanceKm = Math.min(rawMissDistanceKm, 1e7);
  
  // Success probability based on method-specific timing requirements
  let successProbability = 1.0;
  const methodInfo = DEFLECTION_METHODS[method] || DEFLECTION_METHODS['kinetic'];
  
  // Method-specific timing penalties
  if (yearsToImpact < methodInfo.optimal_warning.min) {
    const shortfall = (methodInfo.optimal_warning.min - yearsToImpact) / methodInfo.optimal_warning.min;
    successProbability *= Math.max(0.1, 1.0 - shortfall); // Penalty proportional to shortfall
  } else if (yearsToImpact > methodInfo.optimal_warning.max) {
    // Less severe penalty for excess time (just inefficiency)
    successProbability *= 0.9;
  }
  
  // Mass ratio affects success probability based on method capabilities
  const massRatioMultiplier = getMethodMassRatioMultiplier(method, massRatio);
  successProbability *= massRatioMultiplier;
  
  // Method-specific success factors
  const methodReliability = {
    'kinetic': 0.85,
    'gravity': 0.95,
    'nuclear': 0.70,
    'laser': 0.60,
    'ion': 0.90,
    'mass_driver': 0.75
  };
  
  successProbability *= (methodReliability[method] || 0.7);
  
  // Energy efficiency calculation with mass considerations
  const asteroidKineticEnergy = 0.5 * actualAsteroidMass * Math.pow(effectiveDeltaV * 1000, 2);
  const inputEnergy = calculateMissionEnergy(method, deltaVMmPerSec, yearsToImpact, spacecraftMass);
  const energyEfficiency = Math.min(100, (asteroidKineticEnergy / inputEnergy) * 100);
  
  // Method-specific mass efficiency calculation
  const optimalRange = getMethodOptimalMassRatio(method);
  const optimalCenter = Math.sqrt(optimalRange.min * optimalRange.max); // Geometric mean
  const massEfficiency = Math.min(100, 100 / Math.sqrt(Math.abs(massRatio - optimalCenter) / optimalCenter + 1));
  
  const LD_TO_KM = 384400;
  return { 
    missDistanceKm: Math.abs(missDistanceKm), 
    missDistanceLD: Math.abs(missDistanceKm) / LD_TO_KM,
    deflectionAngle: deflectionAngleDeg,
    energyEfficiency: energyEfficiency || 0,
    successProbability: Math.min(100, successProbability * 100),
    orbitalVelocityChange: effectiveDeltaV * 1000, // m/s
    momentumTransfer: momentumTransfer,
    massEfficiency: massEfficiency,
    usedSpacecraftMass: spacecraftMass,
    usedMassRatio: massRatio
  };
}

// Helper function to get default spacecraft mass for each method - Scientifically accurate
function getDefaultSpacecraftMass(method) {
  const defaultMasses = {
    'kinetic': 850,       // Mid-range for 500-1200kg (DART was ~570kg)
    'gravity': 2000,      // Mid-range for 1000-3000kg 
    'nuclear': 5000,      // Increased for massive nuclear missions (was 3000)
    'laser': 1750,        // Mid-range for 1000-2500kg
    'ion': 1400,          // Mid-range for 800-2000kg
    'mass_driver': 3500   // Increased for heavy surface operations (was 1800)
  };
  return defaultMasses[method] || 1600; // Updated average default
}

// Method-specific mass ratio effectiveness - Based on scientifically accurate ranges
function getMethodMassRatioMultiplier(method, massRatio) {
  switch(method) {
    case 'kinetic':
      // Effective range: 100 to 1,000,000:1
      if (massRatio > 1000000) return 0.3;    // Beyond capability
      if (massRatio > 100000) return 0.7;     // Reduced effectiveness for very large
      if (massRatio < 100) return 0.8;        // Overkill for very small asteroids
      return 1.0;                             // Optimal range
      
    case 'nuclear':
      // Effective range: 100,000 to 10,000,000:1 - handles massive asteroids
      if (massRatio > 10000000) return 0.4;   // Even nuclear has limits
      if (massRatio > 1000000) return 0.8;    // Good for very massive asteroids
      if (massRatio < 100000) return 0.7;     // Overkill (but still effective)
      return 1.0;                             // Optimal for large asteroids
      
    case 'gravity':
      // Effective range: 1,000 to 500,000:1
      if (massRatio > 500000) return 0.5;     // Too slow for massive objects
      if (massRatio > 50000) return 0.8;      // Reduced but viable
      if (massRatio < 1000) return 0.9;       // Some inefficiency for small
      return 1.0;                             // Good across medium-large range
      
    case 'laser':
      // Effective range: 100 to 50,000:1
      if (massRatio > 50000) return 0.3;      // Power limitations
      if (massRatio > 10000) return 0.7;      // Reduced effectiveness
      if (massRatio < 100) return 0.8;        // Some overkill
      return 1.0;                             // Good for small-medium asteroids
      
    case 'ion':
      // Effective range: 500 to 50,000:1
      if (massRatio > 50000) return 0.4;      // Too slow for large masses
      if (massRatio > 10000) return 0.8;      // Reduced but viable
      if (massRatio < 500) return 0.9;        // Some overkill
      return 1.0;                             // Good for medium asteroids
      
    case 'mass_driver':
      // Effective range: 500 to 50,000:1
      if (massRatio > 50000) return 0.6;      // Complex operations at scale
      if (massRatio > 10000) return 0.9;      // Still quite effective
      if (massRatio < 500) return 0.8;        // Complex for very small
      return 1.0;                             // Good across range
      
    default:
      return 1.0;
  }
}

// Get method-specific spacecraft mass tolerance - Based on scientifically accurate ranges
function getMethodMassTolerance(method) {
  switch(method) {
    case 'kinetic':
      return { min: 0.59, max: 1.41 };  // 500-1200kg from 850kg default
    case 'nuclear':
      return { min: 0.33, max: 1.67 };  // 1000-5000kg from 3000kg default
    case 'gravity':
      return { min: 0.50, max: 1.50 };  // 1000-3000kg from 2000kg default
    case 'laser':
      return { min: 0.57, max: 1.43 };  // 1000-2500kg from 1750kg default
    case 'ion':
      return { min: 0.57, max: 1.43 };  // 800-2000kg from 1400kg default
    case 'mass_driver':
      return { min: 1.0, max: 1.0 };    // Fixed at 1800kg as specified
    default:
      return { min: 0.5, max: 1.5 };
  }
}

// Get method-specific optimal mass ratio range - Scientifically accurate based on research
function getMethodOptimalMassRatio(method) {
  switch(method) {
    case 'kinetic': return { min: 100, max: 1000000 };      // 100 to 1,000,000:1
    case 'nuclear': return { min: 100000, max: 10000000 };  // 100,000 to 10,000,000:1 
    case 'gravity': return { min: 1000, max: 500000 };      // 1,000 to 500,000:1
    case 'laser': return { min: 100, max: 50000 };          // 100 to 50,000:1
    case 'ion': return { min: 500, max: 50000 };            // 500 to 50,000:1
    case 'mass_driver': return { min: 500, max: 50000 };    // 500 to 50,000:1
    default: return { min: 500, max: 100000 };
  }
}

// Helper function to calculate method-specific physics
function getMethodPhysics(method, spacecraftMass, asteroidMass, vRelKmPerSec, timeSec) {
  const massRatio = asteroidMass / spacecraftMass;
  
  // Use method-specific mass ratio effectiveness instead of generic formula
  const massRatioMultiplier = getMethodMassRatioMultiplier(method, massRatio);
  const massEfficiencyFactor = massRatioMultiplier;
  
  let baseEfficiency, momentumTransfer;
  
  switch(method) {
    case 'kinetic':
      // Kinetic impactor: momentum = mass × velocity, enhanced by ejecta
      // Use asteroid's orbital velocity for more realistic impact velocity
      const asteroidOrbitalVel = 20; // km/s typical NEO orbital velocity
      const relativeImpactVel = Math.sqrt(vRelKmPerSec*vRelKmPerSec + asteroidOrbitalVel*asteroidOrbitalVel);
      const impactVelocity = relativeImpactVel * 1000; // m/s
      momentumTransfer = spacecraftMass * impactVelocity * 2.5; // 2.5x enhancement from ejecta
      baseEfficiency = 0.15 * Math.min(2.0, spacecraftMass / 500); // Better with heavier impactors
      break;
      
    case 'gravity':
      // Gravity tractor: Force ∝ spacecraft mass, continuous over time
      const gravitationalConstant = 6.674e-11;
      const operatingDistance = 100; // meters
      const gravitationalForce = gravitationalConstant * spacecraftMass * asteroidMass / (operatingDistance * operatingDistance);
      momentumTransfer = gravitationalForce * timeSec;
      baseEfficiency = 0.95 * Math.min(3.0, spacecraftMass / 1000);
      break;
      
    case 'nuclear':
      // Nuclear: Yield scales with spacecraft mass (larger platform = bigger warhead)
      // Momentum transfer based on explosive yield, not direct spacecraft mass
      const maxYieldKt = spacecraftMass / 100; // 1 kt per 100 kg spacecraft mass (reasonable scaling)
      const explosiveImpulse = Math.sqrt(maxYieldKt) * 1e6; // Impulse scales with sqrt of yield
      momentumTransfer = explosiveImpulse * 10; // 10x enhancement from explosive coupling
      baseEfficiency = 0.85 * Math.min(1.5, spacecraftMass / 2000);
      break;
      
    case 'laser':
      // Laser: Power scales with spacecraft mass, momentum from ablation
      const laserPowerMW = spacecraftMass / 100; // 1 MW per 100 kg spacecraft mass
      const ablationEfficiency = 0.001; // 0.1% momentum coupling efficiency
      const laserImpulse = laserPowerMW * 1e6 * timeSec * ablationEfficiency; // Power × time × efficiency
      momentumTransfer = laserImpulse * 3; // 3x enhancement from ablation plume
      baseEfficiency = 0.25 * Math.min(2.0, spacecraftMass / 1500);
      break;
      
    case 'ion':
      // Ion beam: Thrust scales with power and specific impulse
      const ionPowerKW = spacecraftMass / 10; // 1 kW per 10 kg spacecraft mass
      const specificImpulse = 3000; // seconds (typical for ion drives)
      const thrustN = ionPowerKW * 1000 / (specificImpulse * 9.81); // Thrust = Power / (Isp × g)
      momentumTransfer = thrustN * timeSec * 1.2; // 1.2x for beam momentum coupling
      baseEfficiency = 0.90 * Math.min(1.8, spacecraftMass / 800);
      break;
      
    case 'mass_driver':
      // Mass driver: Ejects asteroid material for thrust
      const ejectionRate = spacecraftMass / 1000; // kg/s material ejection (scales with equipment)
      const ejectionVelocity = 1000; // m/s typical ejection velocity
      momentumTransfer = ejectionRate * ejectionVelocity * timeSec * 4; // 4x for reaction efficiency
      baseEfficiency = 0.60 * Math.min(2.5, spacecraftMass / 1200);
      break;
      
    default:
      momentumTransfer = spacecraftMass * 100;
      baseEfficiency = 0.5;
  }
  
  return {
    efficiency: baseEfficiency * massEfficiencyFactor,
    momentumTransfer: momentumTransfer
  };
}

// Function to show detailed method information
function showMethodDetails(methodKey) {
  const method = DEFLECTION_METHODS[methodKey];
  if (!method) return;
  
  const detailsHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: rgba(0,0,0,0.95); border: 2px solid #ffcc00; border-radius: 12px;
                padding: 20px; color: #fff; z-index: 1000; max-width: 500px; max-height: 80vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #ffcc00;">${method.name}</h3>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: #ff4444; color: #fff; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">✕</button>
      </div>
      
      <div style="margin-bottom: 12px;">
        <strong>Description:</strong><br>
        <span style="color: #ccc;">${method.description}</span>
      </div>
      
      <div style="margin-bottom: 12px;">
        <strong>Examples:</strong> <span style="color: #98fb98;">${method.examples}</span>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div>
          <strong style="color: #44ff88;">Advantages:</strong>
          <ul style="margin: 5px 0; padding-left: 15px; color: #ccc;">
            ${method.advantages.map(adv => `<li>${adv}</li>`).join('')}
          </ul>
        </div>
        <div>
          <strong style="color: #ff8844;">Disadvantages:</strong>
          <ul style="margin: 5px 0; padding-left: 15px; color: #ccc;">
            ${method.disadvantages.map(dis => `<li>${dis}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 6px;">
        <strong>Technical Specifications:</strong><br>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; font-size: 12px;">
          <div>Optimal ΔV: ${method.optimalDeltaV.min}-${method.optimalDeltaV.max} ${method.optimalDeltaV.units}</div>
          <div>Cost Range: $${method.costRange.min}-${method.costRange.max}${method.costRange.currency}</div>
          <div>Development: ${method.developmentTime.min}-${method.developmentTime.max} ${method.developmentTime.units}</div>
          <div>Mission Duration: ${method.missionDuration.min}-${method.missionDuration.max} ${method.missionDuration.units}</div>
          <div>Reliability: ${(method.reliability * 100).toFixed(0)}%</div>
          <div>Momentum Enhancement: ${method.momentum_enhancement}x</div>
        </div>
        <div style="margin-top: 8px; font-size: 12px;">
          <strong>Optimal Warning Time:</strong> ${method.optimal_warning.min}-${method.optimal_warning.max} ${method.optimal_warning.units}
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', detailsHTML);
}

// Enhanced visualization functions
function updateMethodVisualization() {
  const method = document.getElementById('mitigationMethod')?.value || 'kinetic';
  const methodInfo = DEFLECTION_METHODS[method] || DEFLECTION_METHODS['kinetic'];
  
  // Add method-specific styling to the panel
  const methodPanel = document.getElementById('simulationControls');
  if (methodPanel) {
    const methodColors = {
      'kinetic': '#ff6b6b',
      'gravity': '#4ecdc4', 
      'nuclear': '#ffe66d',
      'laser': '#a8e6cf',
      'ion': '#dda0dd',
      'mass_driver': '#ffb347'
    };
    
    const color = methodColors[method] || '#ffcc00';
    const header = methodPanel.querySelector('h3');
    if (header) {
      header.style.borderLeft = `4px solid ${color}`;
      header.style.paddingLeft = '8px';
    }
  }
}

// Add method comparison button
function addMethodComparisonButton() {
  const methodSelect = document.getElementById('mitigationMethod');
  if (methodSelect && !document.getElementById('methodCompareBtn')) {
    const compareBtn = document.createElement('button');
    compareBtn.id = 'methodCompareBtn';
    compareBtn.innerHTML = '📊 Compare Methods';
    compareBtn.style.cssText = `
      margin-left: 8px; padding: 4px 8px; font-size: 11px; 
      background: rgba(255,204,0,0.2); border: 1px solid #ffcc00; 
      color: #ffcc00; border-radius: 4px; cursor: pointer;
    `;
    compareBtn.onclick = showMethodComparison;
    methodSelect.parentElement.appendChild(compareBtn);
  }
}

function showMethodComparison() {
  const comparisonHTML = `
    <div style="position: fixed; top: 5%; left: 5%; width: 90%; height: 90%; 
                background: rgba(0,0,0,0.95); border: 2px solid #ffcc00; border-radius: 12px;
                padding: 20px; color: #fff; z-index: 1000; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #ffcc00;">🛡️ Deflection Method Comparison</h2>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: #ff4444; color: #fff; border: none; border-radius: 4px; padding: 8px 15px; cursor: pointer;">✕ Close</button>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
        ${Object.entries(DEFLECTION_METHODS).map(([key, method]) => `
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; border: 1px solid #444;">
            <h3 style="margin: 0 0 10px 0; color: #ffcc00;">${method.name}</h3>
            <div style="font-size: 12px; line-height: 1.4;">
              <div style="margin-bottom: 8px;"><strong>Cost:</strong> $${method.costRange.min}-${method.costRange.max}M</div>
              <div style="margin-bottom: 8px;"><strong>Reliability:</strong> ${(method.reliability * 100).toFixed(0)}%</div>
              <div style="margin-bottom: 8px;"><strong>Development:</strong> ${method.developmentTime.min}-${method.developmentTime.max} years</div>
              <div style="margin-bottom: 8px;"><strong>Optimal Warning:</strong> ${method.optimal_warning.min}-${method.optimal_warning.max} years</div>
              <div style="margin-bottom: 8px;"><strong>ΔV Range:</strong> ${method.optimalDeltaV.min}-${method.optimalDeltaV.max} mm/s</div>
              <button onclick="document.getElementById('mitigationMethod').value='${key}'; 
                             document.getElementById('mitigationMethod').dispatchEvent(new Event('change')); 
                             this.parentElement.parentElement.parentElement.parentElement.remove();"
                      style="margin-top: 10px; padding: 6px 12px; background: #ffcc00; color: #000; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
                Select This Method
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', comparisonHTML);
}

// Enhanced deflection method database - Scientifically accurate values
const DEFLECTION_METHODS = {
  'kinetic': {
    name: 'Kinetic Impactor',
    description: 'High-velocity spacecraft impacts asteroid to transfer momentum',
    examples: 'DART (2022), Deep Impact (2005)',
    advantages: ['Proven technology', 'Fast deployment', 'High momentum transfer'],
    disadvantages: ['Single-use', 'Requires precise targeting', 'Limited to smaller asteroids'],
    optimalDeltaV: { min: 5, max: 30, units: 'mm/s' },           // Based on DART mission analysis
    costRange: { min: 400, max: 1200, currency: 'M USD' },       // Updated for realistic mission costs
    developmentTime: { min: 3, max: 6, units: 'years' },        // Proven technology, faster development
    missionDuration: { min: 1, max: 3, units: 'years' },        // Short duration missions
    reliability: 0.85,                                          // High reliability (proven concept)
    momentum_enhancement: 2.5, // Beta factor from ejecta
    optimal_warning: { min: 10, max: 30, units: 'years' }       // Need time for precise targeting
  },
  
  'gravity': {
    name: 'Gravity Tractor',
    description: 'Spacecraft uses gravitational pull to slowly alter asteroid trajectory',
    examples: 'Proposed ESA missions, NASA studies',
    advantages: ['Very precise control', 'No surface contact needed', 'Can work on any composition'],
    disadvantages: ['Very slow', 'Requires long mission duration', 'High fuel requirements'],
    optimalDeltaV: { min: 0.1, max: 5, units: 'mm/s' },         // Low thrust over long time
    costRange: { min: 800, max: 2500, currency: 'M USD' },      // Long mission = higher cost
    developmentTime: { min: 6, max: 10, units: 'years' },       // Complex precise control systems
    missionDuration: { min: 10, max: 20, units: 'years' },      // Very long missions required
    reliability: 0.925,                                         // High reliability (simple physics)
    momentum_enhancement: 1.0,
    optimal_warning: { min: 20, max: 50, units: 'years' }       // Needs very long lead time
  },
  
  'nuclear': {
    name: 'Nuclear Deflection',
    description: 'Nuclear explosion near or on asteroid surface provides massive impulse',
    examples: 'Theoretical studies, Cold War concepts',
    advantages: ['Extremely high energy', 'Can handle large asteroids', 'Fast execution'],
    disadvantages: ['Political/regulatory issues', 'Complex technology', 'Risk of fragmentation'],
    optimalDeltaV: { min: 10, max: 200, units: 'mm/s' },        // High energy capability
    costRange: { min: 1500, max: 6000, currency: 'M USD' },     // Complex nuclear systems
    developmentTime: { min: 5, max: 12, units: 'years' },       // Regulatory + technical complexity
    missionDuration: { min: 1, max: 4, units: 'years' },        // Relatively quick execution
    reliability: 0.675,                                         // Lower due to complexity/politics
    momentum_enhancement: 10.0, // Very high due to vaporization
    optimal_warning: { min: 2, max: 20, units: 'years' }        // Can work with shorter notice
  },
  
  'laser': {
    name: 'Laser Ablation',
    description: 'High-power laser heats asteroid surface causing material ejection',
    examples: 'DE-STAR concept, ground-based proposals',
    advantages: ['Precise control', 'Can operate from distance', 'Continuous thrust'],
    disadvantages: ['Requires enormous power', 'Limited range', 'Atmospheric interference'],
    optimalDeltaV: { min: 0.5, max: 10, units: 'mm/s' },        // Power limited
    costRange: { min: 600, max: 1800, currency: 'M USD' },      // High-power systems expensive
    developmentTime: { min: 8, max: 12, units: 'years' },       // Advanced power technology needed
    missionDuration: { min: 5, max: 15, units: 'years' },       // Long continuous operation
    reliability: 0.60,                                          // Unproven technology
    momentum_enhancement: 3.0, // Enhanced by ejected material
    optimal_warning: { min: 10, max: 25, units: 'years' }       // Moderate lead time needed
  },
  
  'ion': {
    name: 'Ion Beam Shepherd',
    description: 'Ion beam impinges on asteroid surface creating continuous low thrust',
    examples: 'NASA JPL concepts, theoretical studies',
    advantages: ['Very efficient', 'Precise control', 'Long duration capability'],
    disadvantages: ['Very low thrust', 'Complex technology', 'Requires close proximity'],
    optimalDeltaV: { min: 0.1, max: 5, units: 'mm/s' },         // Low thrust technology
    costRange: { min: 700, max: 1500, currency: 'M USD' },      // Advanced ion systems
    developmentTime: { min: 6, max: 10, units: 'years' },       // Complex proximity operations
    missionDuration: { min: 5, max: 15, units: 'years' },       // Long duration needed
    reliability: 0.90,                                          // High reliability (proven ion tech)
    momentum_enhancement: 1.2,
    optimal_warning: { min: 15, max: 30, units: 'years' }       // Long lead time for low thrust
  },
  
  'mass_driver': {
    name: 'Mass Driver',
    description: 'Surface-mounted system ejects asteroid material to create thrust',
    examples: 'Mining industry concepts, space tug proposals',
    advantages: ['Uses asteroid material', 'High thrust potential', 'Can reduce mass'],
    disadvantages: ['Complex surface operations', 'Requires landing capability', 'Compositional limitations'],
    optimalDeltaV: { min: 5, max: 50, units: 'mm/s' },          // Good thrust capability
    costRange: { min: 900, max: 2800, currency: 'M USD' },      // Complex surface operations
    developmentTime: { min: 8, max: 12, units: 'years' },       // Surface landing + operations
    missionDuration: { min: 3, max: 10, units: 'years' },       // Moderate duration
    reliability: 0.775,                                         // Moderate (surface ops risk)
    momentum_enhancement: 4.0, // Efficient reaction mass usage
    optimal_warning: { min: 10, max: 25, units: 'years' }       // Moderate lead time
  }
};

function calculateMissionEnergy(method, deltaVMmPerSec, yearsToImpact, spacecraftMass = 1500) {
  // Estimate mission energy requirements in Joules with mass scaling
  const baseEnergy = {
    'kinetic': 1e13,      // High-velocity impactor
    'gravity': 1e11,      // Low-thrust, long duration
    'nuclear': 1e15,      // Nuclear explosive device
    'laser': 1e12,        // High-power laser array
    'ion': 1e10,          // Ion propulsion system
    'mass_driver': 1e12   // Mass ejection system
  };
  
  const energyScale = Math.pow(deltaVMmPerSec / 10, 1.5); // Scales with required deltaV
  const timeScale = Math.max(0.1, yearsToImpact / 10);    // Inverse time scaling
  const massScale = Math.pow(spacecraftMass / 1500, 0.8); // Spacecraft mass scaling (normalized to 1500kg)
  
  return (baseEnergy[method] || 1e12) * energyScale * massScale / timeScale;
}

function findNextApproach(closeApproachData) {
  if (!closeApproachData || !closeApproachData.length) return null;
  const now = new Date();
  const futureApproaches = closeApproachData.filter(approach => new Date(approach.close_approach_date) > now);
  if (futureApproaches.length > 0) {
    return futureApproaches.reduce((earliest, current) => {
      const earliestDate = new Date(earliest.close_approach_date);
      const currentDate = new Date(current.close_approach_date);
      return currentDate < earliestDate ? current : earliest;
    });
  }
  return closeApproachData.reduce((latest, current) => {
    const latestDate = new Date(latest.close_approach_date);
    const currentDate = new Date(current.close_approach_date);
    return currentDate > latestDate ? current : latest;
  });
}

function calculateOrbitalPosition(orbitalData, currentEpoch) {
  if (!orbitalData) return { x: 0, y: 0, z: 0, distance: 1 };
  const a = parseFloat(orbitalData.semi_major_axis) || 1.0;
  const e = parseFloat(orbitalData.eccentricity) || 0.0;
  const i = (parseFloat(orbitalData.inclination) || 0.0) * Math.PI / 180;
  const omega = (parseFloat(orbitalData.ascending_node_longitude) || 0.0) * Math.PI / 180;
  const w = (parseFloat(orbitalData.perihelion_argument) || 0.0) * Math.PI / 180;
  const M0 = (parseFloat(orbitalData.mean_anomaly) || 0.0) * Math.PI / 180;
  const n = (parseFloat(orbitalData.mean_motion) || 0.01) * Math.PI / 180;
  const epochJD = parseFloat(orbitalData.epoch_osculation) || 2461000.5;
  const deltaT = currentEpoch - epochJD;
  let M = M0 + n * deltaT;
  M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); // Normalize to [0, 2π]
  let E = M;
  for (let iter = 0; iter < 10; iter++) {
    const deltaE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= deltaE;
    if (Math.abs(deltaE) < 1e-6) break;
  }
  const cosV = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  const sinV = Math.sqrt(1 - e * e) * Math.sin(E) / (1 - e * Math.cos(E));
  const v = Math.atan2(sinV, cosV);
  const r = a * (1 - e * Math.cos(E));
  const xOrb = r * Math.cos(v);
  const yOrb = r * Math.sin(v);
  const zOrb = 0;
  const cosOmega = Math.cos(omega);
  const sinOmega = Math.sin(omega);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const x = (cosOmega * cosW - sinOmega * sinW * cosI) * xOrb + (-cosOmega * sinW - sinOmega * cosW * cosI) * yOrb;
  const y = (sinOmega * cosW + cosOmega * sinW * cosI) * xOrb + (-sinOmega * sinW + cosOmega * cosW * cosI) * yOrb;
  const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;
  return { x, y, z, distance: r };
}

function getAsteroidLabelText(asteroid) {
  // Use designation + name_limited if both are available
  if (asteroid.designation && asteroid.name_limited) {
    return `${asteroid.designation} ${asteroid.name_limited}`;
  }
  
  // Fallback to name in all other cases
  return asteroid.name || 'Unknown';
}

async function autoFetchAsteroids() {
  // TODO: Replace hardcoded API key with secure handling (e.g., environment variable or user input)
  const key = 'vtR582RLfHiFz1EPNfMLdXr3auzMoaSMlj47tSTb';
  const countInput = document.getElementById('asteroidCount');
  const maxCount = countInput ? Math.min(200, parseInt(countInput.value) || 20) : 20;
  const asteroids = await fetchAsteroids(key, maxCount);
  if (!asteroids.length) {
    const infoPanel = document.getElementById('infoPanel');
    if (infoPanel) {
      infoPanel.innerHTML = '<div style="color:#ff4444;">❌ No asteroids returned (check API key / rate limits).</div>';
    }
    return;
  }
  initThreeScene(asteroids, asteroidCache.data.length);
}

async function refreshAsteroids() {
  const key = 'vtR582RLfHiFz1EPNfMLdXr3auzMoaSMlj47tSTb';
  const countInput = document.getElementById('asteroidCount');
  const maxCount = countInput ? Math.min(200, parseInt(countInput.value) || 20) : 20;
  const now = Date.now();
  const cacheValid = asteroidCache.data.length > 0 && (now - asteroidCache.timestamp) < asteroidCache.maxAge;
  if (cacheValid && maxCount <= asteroidCache.data.length) {
    console.log('Using cached data for instant refresh');
    const limitedAsteroids = asteroidCache.data.slice(0, maxCount);
    const container = document.getElementById('canvas');
    container.innerHTML = '';
    initThreeScene(limitedAsteroids, asteroidCache.data.length);
    return;
  } else if (cacheValid && maxCount > asteroidCache.data.length) {
    asteroidCache = { data: [], timestamp: 0, maxAge: asteroidCache.maxAge };
  }

  const infoPanel = document.getElementById('infoPanel');
  if (infoPanel) {
    infoPanel.innerHTML = '<div style="color:#ffcc00;">🔄 Refreshing asteroid visualization...</div>';
  }

  try {
    const asteroids = await fetchAsteroids(key, maxCount);
    if (!asteroids.length) {
      if (infoPanel) {
        infoPanel.innerHTML = '<div style="color:#ff4444;">❌ No asteroids returned (check API key / rate limits).</div>';
      }
      return;
    }
    const container = document.getElementById('canvas');
    container.innerHTML = '';
    initThreeScene(asteroids, asteroidCache.data.length);
  } catch (error) {
    console.error('Refresh failed:', error);
    if (infoPanel) {
      infoPanel.innerHTML = '<div style="color:#ff4444;">❌ Refresh failed. Check console for details.</div>';
    }
  }
}

function initThreeScene(asteroids, totalAvailable = null) {
  try {
    // Update loading progress
    updateLoadingProgress(20, "Setting up 3D scene...");
    
    const container = document.getElementById('canvas');
    container.innerHTML = '';
    const width = window.innerWidth;
    const height = window.innerHeight;
    let globalSizeMultiplier = 1;

    const scene = new THREE.Scene();
    
    // Loading progress tracking
    let loadingComplete = { starMap: false, earthTexture: false };
    
    // Create star map background
    const textureLoader = new THREE.TextureLoader();
    
    updateLoadingProgress(30, "Loading star map...");
    
    // Try to load star map, fallback to black background if not found
    const starMapPath = 'starmap.jpg'; // You can replace this with your star map file
    textureLoader.load(
      starMapPath,
      function(texture) {
        // Create a large sphere to serve as the star background
        const starGeometry = new THREE.SphereGeometry(5000, 32, 32);
        const starMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide // Render inside the sphere
        });
        const starSphere = new THREE.Mesh(starGeometry, starMaterial);
        scene.add(starSphere);
        loadingComplete.starMap = true;
        updateLoadingProgress(50, "Star map loaded successfully");
        checkLoadingComplete(loadingComplete);
      },
      function(progress) {
        const percent = Math.round((progress.loaded / progress.total) * 30) + 30;
        updateLoadingProgress(percent, "Loading star map...");
      },
      function(error) {
        console.log('Star map not found, using black background:', error);
        scene.background = new THREE.Color(0x000000);
        loadingComplete.starMap = true;
        updateLoadingProgress(50, "Using default background");
        checkLoadingComplete(loadingComplete);
      }
    );

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 10000);
    camera.position.set(0, 15, 25);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" // Use dedicated GPU if available
    });
    renderer.setSize(width, height);
    
    // Adjust pixel ratio for performance optimization
    const isLowEndDevice = navigator.hardwareConcurrency <= 2 || /Android|iPhone|iPad/.test(navigator.userAgent);
    const pixelRatio = isLowEndDevice ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
    renderer.setPixelRatio(pixelRatio);
    
    // Performance monitoring
    const performanceMonitor = {
      frameCount: 0,
      lastTime: performance.now(),
      fps: 60,
      isLowPerformance: false
    };
    
    function checkPerformance() {
      performanceMonitor.frameCount++;
      const currentTime = performance.now();
      if (currentTime - performanceMonitor.lastTime >= 1000) {
        performanceMonitor.fps = performanceMonitor.frameCount;
        performanceMonitor.frameCount = 0;
        performanceMonitor.lastTime = currentTime;
        
        // Automatically reduce quality if performance is poor
        if (performanceMonitor.fps < 30 && !performanceMonitor.isLowPerformance) {
          performanceMonitor.isLowPerformance = true;
          console.log('Low performance detected, reducing visual quality');
          renderer.setPixelRatio(1);
          controls.enableDamping = false; // Disable damping for better performance
          // Reduce asteroid detail for smaller asteroids
          instancedSafe.forEach(item => {
            if (item.radiusUnits < 0.1) item.radiusUnits *= 0.8;
          });
          instancedHazard.forEach(item => {
            if (item.radiusUnits < 0.1) item.radiusUnits *= 0.8;
          });
        }
      }
    }
    
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    container.style.position = 'relative';
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    renderer.domElement.style.zIndex = '1';
    labelRenderer.domElement.style.zIndex = '2';

    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '3';
    tooltip.style.color = '#fff';
    tooltip.style.background = 'rgba(0,0,0,0.7)';
    tooltip.style.padding = '6px 8px';
    tooltip.style.borderRadius = '6px';
    tooltip.style.fontSize = '12px';
    tooltip.style.maxWidth = '240px';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 140ms ease, transform 160ms ease';
    container.appendChild(tooltip);

    const toggleBtn = document.getElementById('toggleMaxBtn');
    if (toggleBtn) {
      toggleBtn.textContent = 'Hide UI';
      toggleBtn.onclick = () => {
        const overlay = document.getElementById('ui-overlay');
        const isHidden = overlay.style.opacity === '0';
        overlay.style.opacity = isHidden ? '1' : '0';
        // UI overlay should always have pointer-events: none to allow OrbitControls to work
        overlay.style.pointerEvents = 'none';
        toggleBtn.textContent = isHidden ? 'Hide UI' : 'Show UI';
      };
    }

    const clock = new THREE.Clock();

    function seededRandom(seed) {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
      }
      return function() {
        h += 0x6D2B79F5;
        let t = Math.imul(h ^ (h >>> 15), 1 | h);
        t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function createAsteroidMesh(idOrName, radiusUnits, detail = 2, color = 0x888888) {
      const seed = String(idOrName || Math.random().toString(36).slice(2));
      const rnd = seededRandom(seed);
      const geom = new THREE.IcosahedronGeometry(radiusUnits, detail);
      const pos = geom.attributes.position;
      const tmp = new THREE.Vector3();
      const amp = Math.max(0.03 * radiusUnits, 0.02 * radiusUnits);
      for (let i = 0; i < pos.count; i++) {
        tmp.fromBufferAttribute(pos, i);
        const n = tmp.length() || 1;
        const jitter = (rnd() - 0.5) * amp * 1.0 + (rnd() - 0.5) * amp * 0.45;
        tmp.setLength(n + jitter);
        pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
      }
      geom.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: false });
      return new THREE.Mesh(geom, mat);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1; // Balanced damping for GitHub Pages performance
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.autoRotate = false; // Disable auto-rotate for better performance
    controls.update();

    // Make controls globally accessible for debugging/fixing focus issues
    window.orbitControls = controls;

    scene.add(new THREE.AmbientLight(0x888888, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 5, 5);
    scene.add(dir);

    const earthRadiusUnits = 3;
    const earthGeo = new THREE.SphereGeometry(earthRadiusUnits, 32, 32);
    
    // Create Earth with texture map
    let earthMat;
    updateLoadingProgress(60, "Loading Earth texture...");
    textureLoader.load(
      'earth.jpg', // You can replace this with your Earth texture file
      function(earthTexture) {
        // Successfully loaded Earth texture
        earthMat = new THREE.MeshStandardMaterial({ 
          map: earthTexture,
          roughness: 0.95, 
          metalness: 0.05 
        });
        const earth = new THREE.Mesh(earthGeo, earthMat);
        scene.add(earth);
        loadingComplete.earthTexture = true;
        updateLoadingProgress(80, "Earth texture loaded successfully");
        checkLoadingComplete(loadingComplete);
      },
      function(progress) {
        const percent = Math.round((progress.loaded / progress.total) * 20) + 60;
        updateLoadingProgress(percent, "Loading Earth texture...");
      },
      function(error) {
        // Fallback to blue color if Earth texture not found
        console.log('Earth texture not found, using blue color:', error);
        earthMat = new THREE.MeshStandardMaterial({ 
          color: 0x2266dd, 
          roughness: 0.95, 
          metalness: 0.05 
        });
        const earth = new THREE.Mesh(earthGeo, earthMat);
        scene.add(earth);
        loadingComplete.earthTexture = true;
        updateLoadingProgress(80, "Using default Earth appearance");
        checkLoadingComplete(loadingComplete);
      }
    );

    const KM_PER_EARTH_RADIUS = 6371;
    const missDistances = asteroids.map(a => {
      const nextApproach = findNextApproach(a.close_approach_data);
      return nextApproach ? parseFloat(nextApproach.miss_distance.kilometers) : 0;
    }).filter(v => v > 0);
    const maxMissKm = missDistances.length ? Math.max(...missDistances) : KM_PER_EARTH_RADIUS * 10;
    const maxRangeUnits = 18;
    const logBase = (v) => Math.log10((v || 0) + 1);
    const maxLog = logBase(maxMissKm);

    const astGroup = new THREE.Group();
    scene.add(astGroup);

    const instancedSafe = [];
    const instancedHazard = [];
    const instancedMetaSafe = [];
    const instancedMetaHazard = [];

    let countPlotted = 0;
    const now = new Date();
    const currentJD = 2440587.5 + now.getTime() / 86400000;

    asteroids.forEach((a, i) => {
      const est = a.estimated_diameter?.kilometers;
      if (!est) return;
      const avgDiamKm = (est.estimated_diameter_min + est.estimated_diameter_max) / 2;
      const radiusKm = avgDiamKm / 2;
      const baseRadiusUnits = Math.max(0.02, (radiusKm / KM_PER_EARTH_RADIUS));
      const radiusUnits = Math.min(8.0, baseRadiusUnits * globalSizeMultiplier);
      const approach = findNextApproach(a.close_approach_data);
      const missKm = approach ? parseFloat(approach.miss_distance.kilometers) : null;
      const vRelKmPerSec = approach?.relative_velocity?.kilometers_per_second ? parseFloat(approach.relative_velocity.kilometers_per_second) : 0.0;
      const metrics = calculateImpactMetrics(avgDiamKm, vRelKmPerSec);
      const torinoScore = calculateTorinoProxy(metrics.energyMt);

      const orbitalPos = calculateOrbitalPosition(a.orbital_data, currentJD);
      const auToVisualScale = 10;
      let ax = orbitalPos.x * auToVisualScale;
      let ay = orbitalPos.z * auToVisualScale;
      let az = orbitalPos.y * auToVisualScale;

      if (Math.abs(ax) < 0.01 && Math.abs(ay) < 0.01 && Math.abs(az) < 0.01) {
        console.warn(`Fallback positioning for ${a.name}`);
        const angle = (i / Math.max(1, asteroids.length)) * Math.PI * 2;
        const normLog = missKm ? (logBase(missKm) / Math.max(0.0001, maxLog)) : 0.2;
        const distUnits = Math.max(1.2, normLog * maxRangeUnits);
        const eccentricity = 0.8 + ((i % 5) * 0.05);
        ax = Math.cos(angle) * distUnits;
        az = Math.sin(angle) * distUnits * eccentricity;
        ay = Math.sin(angle * 3 + i) * 0.12;
      }

      const color = a.is_potentially_hazardous_asteroid ? 0xff4444 : 0x44ff88;
      const segs = radiusUnits < 0.05 ? 8 : 16;

      if (radiusUnits < 0.5) {
        const instObj = {
          pos: new THREE.Vector3(ax, ay, az),
          radiusUnits,
          baseRadiusUnits,
          name: a.name,
          designation: a.designation,
          name_limited: a.name_limited,
          id: a.id,
          avgDiamKm,
          hazardous: !!a.is_potentially_hazardous_asteroid,
          nextApproach: approach ? (approach.close_approach_date_full || approach.close_approach_date) : 'Unknown',
          missKm,
          vRelKmPerSec,
          firstObservation: a.orbital_data?.first_observation_date || 'Unknown',
          lastObservation: a.orbital_data?.last_observation_date || 'Unknown',
          semiMajorAxis: a.orbital_data?.semi_major_axis || 'Unknown',
          eccentricity: a.orbital_data?.eccentricity || 'Unknown',
          inclination: a.orbital_data?.inclination || 'Unknown',
          perihelion_distance: a.orbital_data?.perihelion_distance || 'Unknown',
          aphelion_distance: a.orbital_data?.aphelion_distance || 'Unknown',
          energyMt: metrics.energyMt,
          Mw: metrics.Mw,
          D_crater_km: metrics.D_crater_km,
          torinoScore
        };
        if (a.is_potentially_hazardous_asteroid) {
          instancedHazard.push(instObj);
          instancedMetaHazard.push(instObj);
        } else {
          instancedSafe.push(instObj);
          instancedMetaSafe.push(instObj);
        }
      } else {
        const mesh = createAsteroidMesh(a.id || a.name || String(i), radiusUnits, Math.max(1, Math.floor(segs/8)), color);
        mesh.position.set(ax, ay, az);
        astGroup.add(mesh);

        const labelDiv = document.createElement('div');
        labelDiv.className = 'label';
        labelDiv.textContent = getAsteroidLabelText(a);
        labelDiv.style.pointerEvents = 'auto';
        labelDiv.style.whiteSpace = 'nowrap';
        labelDiv.style.fontSize = '12px';
        labelDiv.addEventListener('click', (ev) => {
          ev.stopPropagation();
          
          // Expand controls panel if minimized (same logic as canvas click)
          const controlsDiv = document.getElementById('controls');
          const toggleControlsBtn = document.getElementById('toggleControls');
          if (controlsDiv && controlsDiv.classList.contains('minimized')) {
            controlsDiv.classList.remove('minimized');
            if (toggleControlsBtn) {
              toggleControlsBtn.textContent = '<';
              toggleControlsBtn.title = 'Minimize Controls';
            }
          }
          
          window.showMetaAndReport && window.showMetaAndReport(mesh.userData);
        });
        const label = new CSS2DObject(labelDiv);
        label.position.set(0, radiusUnits + 0.02, 0);
        mesh.add(label);

        const baseSpeed = 0.6 + Math.random() * 1.6;
        const distUnits = Math.sqrt(ax * ax + ay * ay + az * az);
        const speed = baseSpeed * (1.5 / Math.max(0.5, distUnits));

        mesh.userData = {
          id: a.id,
          name: a.name,
          designation: a.designation,
          name_limited: a.name_limited,
          avgDiamKm,
          baseRadiusUnits,
          hazardous: !!a.is_potentially_hazardous_asteroid,
          nextApproach: approach ? (approach.close_approach_date_full || approach.close_approach_date) : 'Unknown',
          missKm,
          vRelKmPerSec,
          firstObservation: a.orbital_data?.first_observation_date || 'Unknown',
          lastObservation: a.orbital_data?.last_observation_date || 'Unknown',
          semiMajorAxis: a.orbital_data?.semi_major_axis || 'Unknown',
          eccentricity: a.orbital_data?.eccentricity || 'Unknown',
          inclination: a.orbital_data?.inclination || 'Unknown',
          perihelion_distance: a.orbital_data?.perihelion_distance || 'Unknown',
          aphelion_distance: a.orbital_data?.aphelion_distance || 'Unknown',
          energyMt: metrics.energyMt,
          Mw: metrics.Mw,
          D_crater_km: metrics.D_crater_km,
          torinoScore,
          rotationSpeed: speed
        };
      }

      countPlotted++;
    });

    function makeInstanced(list, color) {
      if (!list.length) return null;
      const geom = new THREE.SphereGeometry(1, 8, 8);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 1 });
      const inst = new THREE.InstancedMesh(geom, mat, list.length);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        dummy.position.copy(it.pos);
        dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
        dummy.scale.set(it.radiusUnits, it.radiusUnits, it.radiusUnits);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
      astGroup.add(inst);
      return inst;
    }

    let currentInstSafeMesh = makeInstanced(instancedSafe, 0x44ff88);
    let currentInstHazardMesh = makeInstanced(instancedHazard, 0xff4444);

    (function addInstancedLabels(list) {
      if (!list || !list.length) return;
      list.forEach(it => {
        const d = document.createElement('div');
        d.className = 'label';
        d.textContent = getAsteroidLabelText(it);
        d.style.pointerEvents = 'auto';
        d.style.whiteSpace = 'nowrap';
        d.style.fontSize = '11px';
        d.addEventListener('click', (ev) => {
          ev.stopPropagation();
          
          // Expand controls panel if minimized (same logic as canvas click)
          const controlsDiv = document.getElementById('controls');
          const toggleControlsBtn = document.getElementById('toggleControls');
          if (controlsDiv && controlsDiv.classList.contains('minimized')) {
            controlsDiv.classList.remove('minimized');
            if (toggleControlsBtn) {
              toggleControlsBtn.textContent = '<';
              toggleControlsBtn.title = 'Minimize Controls';
            }
          }
          
          window.showMetaAndReport && window.showMetaAndReport(it);
        });
        const lbl = new CSS2DObject(d);
        lbl.position.copy(it.pos.clone().add(new THREE.Vector3(0, it.radiusUnits + 0.02, 0)));
        astGroup.add(lbl);
      });
    })([...instancedSafe, ...instancedHazard]);

    document.getElementById('infoPanel').innerHTML = `
      <b>Plotted asteroids:</b> ${countPlotted} of ${totalAvailable || asteroids.length} available &nbsp; | &nbsp;
      <b>Earth radius (visual):</b> ${earthRadiusUnits} unit &nbsp; | &nbsp;
      <small style="color:#ccc">Distances auto-scaled</small>
    `;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const deltaVSlider = document.getElementById('deltaV');
    const deltaVValueEl = document.getElementById('deltaVValue');
    const yearsOutInput = document.getElementById('yearsOut');
    const mitigationResultEl = document.getElementById('mitigationResult');

    // Automatic method selection and configuration based on asteroid characteristics
    function selectOptimalMethod(asteroidMass, yearsToImpact, isHazardous) {
      const methods = ['kinetic', 'gravity', 'nuclear', 'laser', 'ion', 'mass_driver'];
      let bestMethod = 'kinetic';
      let bestScore = 0;
      let optimalConfig = {};
      
      console.log(`\n=== Calculating optimal method for asteroid with mass ${asteroidMass} kg (${(asteroidMass/1e9).toFixed(1)}B kg), ${yearsToImpact} years to impact ===`);
      
      for (const method of methods) {
        const methodInfo = DEFLECTION_METHODS[method];
        const defaultMass = getDefaultSpacecraftMass(method);
        const massRatio = asteroidMass / defaultMass;
        const massRatioRange = getMethodOptimalMassRatio(method);
        const massTolerance = getMethodMassTolerance(method);
        
        let score = 0;
        
        // Enhanced mass ratio scoring with better differentiation (40% of total score)
        let massScore = 0;
        if (massRatio >= massRatioRange.min && massRatio <= massRatioRange.max) {
          // Perfect mass ratio zone - use bell curve for optimal zone
          const optimalCenter = (massRatioRange.min + massRatioRange.max) / 2;
          const optimalRange = massRatioRange.max - massRatioRange.min;
          const deviation = Math.abs(massRatio - optimalCenter) / (optimalRange / 2);
          massScore = 40 * Math.exp(-Math.pow(deviation, 2));
        } else if (massRatio < massRatioRange.min) {
          // Asteroid too small - penalty depends on how far below optimal
          const underRatio = massRatioRange.min / massRatio;
          if (massRatio >= defaultMass * massTolerance.min) {
            massScore = Math.max(8, 32 - underRatio * 6);
          } else {
            massScore = Math.max(2, 16 - underRatio * 4);
          }
        } else {
          // Asteroid too large - penalty depends on how far above optimal and method capability
          const overRatio = massRatio / massRatioRange.max;
          if (massRatio <= defaultMass * massTolerance.max) {
            // Still within tolerance
            massScore = Math.max(16, 36 - overRatio * 3);
          } else {
            // Beyond tolerance - steep penalty
            massScore = Math.max(4, 20 - overRatio * 5);
          }
        }
        score += massScore;
        
        // Enhanced timing score with method-specific preferences (30% of total score)
        let timingScore = 0;
        if (yearsToImpact >= methodInfo.optimal_warning.min && yearsToImpact <= methodInfo.optimal_warning.max) {
          timingScore = 30; // Perfect timing
        } else if (yearsToImpact < methodInfo.optimal_warning.min) {
          // Too urgent - penalty varies by method capability for fast deployment
          const urgencyRatio = methodInfo.optimal_warning.min / yearsToImpact;
          if (method === 'kinetic' || method === 'nuclear') {
            // Fast deployment methods handle urgency better
            timingScore = Math.max(9, 27 - urgencyRatio * 3);
          } else {
            // Slow methods struggle with urgency
            timingScore = Math.max(3, 21 - urgencyRatio * 6);
          }
        } else {
          // Plenty of time - some methods benefit more than others
          const excessTime = yearsToImpact / methodInfo.optimal_warning.max;
          if (method === 'gravity' || method === 'ion' || method === 'laser') {
            // Long-duration methods benefit from extra time
            timingScore = Math.min(30, 18 + Math.log(excessTime) * 4.5);
          } else {
            // Fast methods don't need extra time as much
            timingScore = Math.max(15, 27 - (excessTime - 1) * 2.4);
          }
        }
        score += timingScore;
        
        // Mass-dependent reliability adjustments (20% of total score)
        let adjustedReliability = methodInfo.reliability;
        if (massRatio > massRatioRange.max * 2) {
          // Very large asteroids reduce reliability for some methods
          if (method === 'kinetic' || method === 'laser') {
            adjustedReliability *= 0.7; // Less reliable for huge asteroids
          } else if (method === 'nuclear') {
            adjustedReliability *= 0.9; // Slightly less reliable but still good
          }
        } else if (massRatio < massRatioRange.min / 2) {
          // Very small asteroids might be overkill for some methods
          if (method === 'nuclear') {
            adjustedReliability *= 0.8; // Overkill penalty
          }
        }
        score += adjustedReliability * 20;
        
        // Score based on hazard level (10% of total score)
        if (isHazardous) {
          // For hazardous asteroids, prefer proven methods
          const reliabilityBonus = {
            'kinetic': 10,    // Proven with DART
            'gravity': 8,     // Well understood physics
            'ion': 7,         // Proven ion technology
            'nuclear': 5,     // High power but complex
            'mass_driver': 4, // Complex operations
            'laser': 2        // Unproven technology
          };
          score += reliabilityBonus[method] || 0;
        } else {
          // For non-hazardous, can try newer methods
          score += 5;
        }
        
        console.log(`${method}: mass ratio ${massRatio.toFixed(3)} (score: ${massScore.toFixed(1)}), timing ${yearsToImpact}y (score: ${timingScore.toFixed(1)}), reliability ${adjustedReliability.toFixed(1)}, total score: ${score.toFixed(1)}`);
        
        if (score > bestScore) {
          bestScore = score;
          bestMethod = method;
          
          // Calculate optimal configuration for this method
          optimalConfig = calculateOptimalConfig(method, asteroidMass, yearsToImpact, methodInfo);
        }
      }
      
      console.log(`\nBest method: ${bestMethod} (score: ${bestScore.toFixed(1)})`);
      return { method: bestMethod, score: bestScore, config: optimalConfig };
    }

    // Calculate optimal parameters for the selected method
    function calculateOptimalConfig(method, asteroidMass, yearsToImpact, methodInfo) {
      const defaultMass = getDefaultSpacecraftMass(method);
      const massRatio = asteroidMass / defaultMass;
      const massRatioRange = getMethodOptimalMassRatio(method);
      
      // Calculate asteroid scale factor for dramatic parameter scaling
      const asteroidMassInBillions = asteroidMass / 1e9;
      const logMassScale = Math.log10(asteroidMassInBillions + 1); // +1 to avoid log(0)
      
      console.log(`📊 Asteroid mass: ${asteroidMassInBillions.toFixed(1)}B kg, Log scale: ${logMassScale.toFixed(2)}, Mass ratio: ${massRatio.toFixed(1)}`);
      
      // Base parameters from method info
      let optimalSpacecraftMass = defaultMass;
      let optimalDeltaV = (methodInfo.optimalDeltaV.min + methodInfo.optimalDeltaV.max) / 2;
      let optimalMissionDuration = (methodInfo.missionDuration.min + methodInfo.missionDuration.max) / 2;
      
      // DRAMATIC spacecraft mass scaling based on asteroid mass
      if (asteroidMassInBillions > 10000) {
        // Ultra-massive asteroids (>10T kg) - need massive spacecraft
        const massScale = Math.min(15.0, Math.pow(asteroidMassInBillions / 10000, 0.3));
        optimalSpacecraftMass = defaultMass * massScale;
        console.log(`🚀 Ultra-massive asteroid detected! Scale factor: ${massScale.toFixed(2)}x`);
      } else if (asteroidMassInBillions > 1000) {
        // Very large asteroids (1T-10T kg) - significant scaling
        const massScale = Math.min(10.0, Math.pow(asteroidMassInBillions / 1000, 0.4));
        optimalSpacecraftMass = defaultMass * massScale;
        console.log(`🔥 Very large asteroid! Scale factor: ${massScale.toFixed(2)}x`);
      } else if (asteroidMassInBillions > 100) {
        // Large asteroids (100B-1T kg) - substantial scaling
        const massScale = Math.min(6.0, Math.pow(asteroidMassInBillions / 100, 0.5));
        optimalSpacecraftMass = defaultMass * massScale;
        console.log(`⚡ Large asteroid! Scale factor: ${massScale.toFixed(2)}x`);
      } else if (asteroidMassInBillions > 10) {
        // Medium asteroids (10B-100B kg) - moderate scaling
        const massScale = Math.min(4.0, Math.pow(asteroidMassInBillions / 10, 0.6));
        optimalSpacecraftMass = defaultMass * massScale;
        console.log(`📈 Medium asteroid! Scale factor: ${massScale.toFixed(2)}x`);
      } else if (asteroidMassInBillions > 1) {
        // Small-medium asteroids (1B-10B kg) - light scaling
        const massScale = Math.min(2.5, Math.pow(asteroidMassInBillions, 0.3));
        optimalSpacecraftMass = defaultMass * massScale;
        console.log(`📊 Small-medium asteroid! Scale factor: ${massScale.toFixed(2)}x`);
      }
      
      // DRAMATIC deltaV scaling based on asteroid mass and method
      let deltaVScale = 1.0;
      if (method === 'nuclear') {
        // Nuclear methods need much higher deltaV for massive asteroids
        if (asteroidMassInBillions > 50000) {
          deltaVScale = 15.0; // Maximum nuclear capability
        } else if (asteroidMassInBillions > 10000) {
          deltaVScale = 8.0 + (asteroidMassInBillions / 10000) * 3.0;
        } else if (asteroidMassInBillions > 1000) {
          deltaVScale = 4.0 + (asteroidMassInBillions / 1000) * 2.0;
        } else if (asteroidMassInBillions > 100) {
          deltaVScale = 2.0 + (asteroidMassInBillions / 100) * 1.0;
        } else {
          deltaVScale = 1.0 + (asteroidMassInBillions / 100) * 0.5;
        }
      } else if (method === 'kinetic') {
        // Kinetic impactors have limited scalability
        if (asteroidMassInBillions > 1000) {
          deltaVScale = 2.5; // Maximum practical for kinetic
        } else if (asteroidMassInBillions > 100) {
          deltaVScale = 1.5 + (asteroidMassInBillions / 1000) * 1.0;
        } else {
          deltaVScale = 1.0 + (asteroidMassInBillions / 100) * 0.5;
        }
      } else if (method === 'mass_driver') {
        // Mass drivers scale well with large asteroids
        if (asteroidMassInBillions > 5000) {
          deltaVScale = 8.0;
        } else if (asteroidMassInBillions > 500) {
          deltaVScale = 3.0 + (asteroidMassInBillions / 1000) * 2.0;
        } else {
          deltaVScale = 1.0 + (asteroidMassInBillions / 100) * 1.0;
        }
      } else {
        // Other methods (gravity, ion, laser) have moderate scaling
        deltaVScale = 1.0 + Math.log10(asteroidMassInBillions + 1) * 0.3;
      }
      
      optimalDeltaV = Math.min(
        methodInfo.optimalDeltaV.max,
        Math.max(methodInfo.optimalDeltaV.min, optimalDeltaV * deltaVScale)
      );
      
      // Adjust for urgency
      if (yearsToImpact < methodInfo.optimal_warning.min) {
        // Urgent situations need more aggressive parameters
        if (method === 'nuclear' || method === 'kinetic') {
          optimalDeltaV = Math.min(methodInfo.optimalDeltaV.max, optimalDeltaV * 1.5);
          optimalMissionDuration = methodInfo.missionDuration.min;
        } else {
          optimalDeltaV = Math.min(methodInfo.optimalDeltaV.max, optimalDeltaV * 1.2);
          optimalMissionDuration = Math.max(methodInfo.missionDuration.min, optimalMissionDuration * 0.7);
        }
      } else if (yearsToImpact > methodInfo.optimal_warning.max) {
        // Plenty of time allows for optimization
        if (method === 'gravity' || method === 'ion') {
          optimalMissionDuration = Math.min(methodInfo.missionDuration.max, yearsToImpact * 0.4);
          optimalDeltaV = Math.max(methodInfo.optimalDeltaV.min, optimalDeltaV * 0.8);
        }
      }
      
      // Method-specific duration adjustments for large asteroids
      if (asteroidMassInBillions > 1000) {
        if (method === 'gravity' || method === 'ion' || method === 'laser') {
          // These methods need more time for very large asteroids
          const durationScale = Math.min(2.0, 1.0 + Math.log10(asteroidMassInBillions / 1000) * 0.5);
          optimalMissionDuration = Math.min(methodInfo.missionDuration.max, optimalMissionDuration * durationScale);
        }
      }
      
      const finalConfig = {
        spacecraftMass: Math.round(optimalSpacecraftMass),
        deltaV: Math.round(optimalDeltaV * 10) / 10, // Round to 1 decimal
        missionDuration: Math.round(optimalMissionDuration * 10) / 10,
        yearsToImpact: Math.max(1, Math.min(50, yearsToImpact))
      };
      
      console.log(`🚀 Final config: ${finalConfig.spacecraftMass}kg spacecraft, ${finalConfig.deltaV}mm/s deltaV, ${finalConfig.missionDuration}y duration`);
      
      return finalConfig;
    }

    let lastSelectedAsteroidKey = null;

    function clamp(val, min, max) {
      const n = parseFloat(val);
      if (!Number.isFinite(n)) return min;
      return Math.max(min, Math.min(max, n));
    }

    function showMetaAndReport(meta) {
      if (!meta) {
        console.warn('[showMetaAndReport] Missing meta');
        return;
      }
      
      // Store current asteroid data for impact map updates
      window.currentSelectedAsteroid = meta;
      
      const avgDiamKm = Number.isFinite(meta.avgDiamKm) ? meta.avgDiamKm : parseFloat(meta.avgDiamKm);
      if (!Number.isFinite(avgDiamKm)) {
        console.warn('[showMetaAndReport] Invalid avgDiamKm in meta:', meta);
        return;
      }
      const meters = avgDiamKm * 1000;
      const vRel = Number.isFinite(meta.vRelKmPerSec) ? meta.vRelKmPerSec : parseFloat(meta.vRelKmPerSec) || 0.0;
      
      // Get impact location from UI or use default
      const impactLatInput = document.getElementById('impactLat');
      const impactLngInput = document.getElementById('impactLng');
      const impactLat = impactLatInput?.value ? parseFloat(impactLatInput.value) : 40.7; // Default to NYC
      const impactLng = impactLngInput?.value ? parseFloat(impactLngInput.value) : -74.0;
      
      const enhancedMetrics = calculateImpactMetrics(avgDiamKm, vRel, impactLat, impactLng);
      const energyMt = enhancedMetrics.energyMt;
      const Mw = enhancedMetrics.Mw;
      const D_crater = enhancedMetrics.D_crater_km;
      const torino = meta.torinoScore ?? calculateTorinoProxy(energyMt);

      // Calculate asteroid mass for defense system analysis
      const radiusM = (avgDiamKm / 2) * 1000;
      const asteroidMass = DENSITY_ROCK * (4/3) * Math.PI * Math.pow(radiusM, 3);
      
      // Years to impact (simulated for now)
      const yearsToImpact = 5; // Could be calculated from orbital data
      const isHazardous = meta.hazardous || torino > 0;
      
      console.log(`🎯 [ASTEROID SELECTED] ${meta.new ? 'NEW' : 'EXISTING'} | ${meta.full_name || meta.name}`);
      console.log(`📊 Mass: ${(asteroidMass/1e9).toFixed(2)}B kg | Years: ${yearsToImpact} | Hazardous: ${isHazardous}`);
      
      // Use new defense system for analysis
      let defenseAnalysis = null;
      if (window.defenseSystem) {
        try {
          defenseAnalysis = window.defenseSystem.analyzeAsteroidDefense(
            asteroidMass, 
            yearsToImpact, 
            isHazardous
          );
          
          console.log(`🚀 Selected Method: ${defenseAnalysis.method} (score: ${defenseAnalysis.score.toFixed(1)})`);
          console.log(`⚙️ Optimal Config: ${defenseAnalysis.parameters.spacecraftMass}kg, ${defenseAnalysis.parameters.deltaV}mm/s, ${defenseAnalysis.parameters.missionDuration}y`);
          
          // Update defense mission controls with new parameters
          updateDefenseMissionControls(defenseAnalysis);
          
        } catch (error) {
          console.error('❌ Defense system analysis failed:', error);
          // Fallback to simple calculation
          defenseAnalysis = createFallbackDefenseAnalysis(asteroidMass, yearsToImpact);
        }
      } else {
        console.warn('⚠️ Defense system not loaded, using fallback');
        defenseAnalysis = createFallbackDefenseAnalysis(asteroidMass, yearsToImpact);
      }
      
      // Get years to impact from UI or use default
      const yearsToImpactInput = document.getElementById('yearsOut');
      const yearsToImpactFromUI = yearsToImpactInput?.value ? parseFloat(yearsToImpactInput.value) : yearsToImpact;
      
      // Determine if asteroid is hazardous (Torino ≥ 1 or energy ≥ 1 Mt)
      const isHazardousFromMetrics = torino >= 1 || energyMt >= 1;
      
      // Use the more comprehensive hazardous determination
      const finalIsHazardous = isHazardous || isHazardousFromMetrics;
      
      // Legacy defense system integration (keep for compatibility)
      const optimalSelection = defenseAnalysis ? {
        method: defenseAnalysis.method,
        score: defenseAnalysis.score,
        config: {
          spacecraftMass: defenseAnalysis.parameters.spacecraftMass,
          deltaV: defenseAnalysis.parameters.deltaV,
          missionDuration: defenseAnalysis.parameters.missionDuration,
          yearsToImpact: defenseAnalysis.parameters.yearsToImpact
        }
      } : selectOptimalMethod(asteroidMass, yearsToImpactFromUI, finalIsHazardous);
      
      // Determine if auto-optimization is enabled
      const autoToggle = document.getElementById('autoOptimize');
      const isAuto = autoToggle ? !!autoToggle.checked : true;

      // Debug logging and selection change marker
      const key = `${meta.id || meta.name || 'unknown'}|${avgDiamKm}`;
      const isNewSelection = key !== lastSelectedAsteroidKey;
      lastSelectedAsteroidKey = key;

      // Legacy debug logging (will be replaced by new system logs above)
      console.log(`🚀 Selected Method: ${optimalSelection.method} (score: ${optimalSelection.score.toFixed(1)})`);
      console.log(`⚙️ Optimal Config: ${optimalSelection.config.spacecraftMass}kg, ${optimalSelection.config.deltaV}mm/s, ${optimalSelection.config.missionDuration}y`);
  console.log(`🚀 Selected Method: ${optimalSelection.method} (score: ${optimalSelection.score.toFixed(1)})`);
  console.log(`⚙️ Optimal Config: ${optimalSelection.config.spacecraftMass}kg, ${optimalSelection.config.deltaV}mm/s, ${optimalSelection.config.missionDuration}y`);

      const autoMethodSelect = document.getElementById('mitigationMethod');
      const autoSpacecraftMassInput = document.getElementById('spacecraftMass');
      const autoDeltaVSlider = document.getElementById('deltaV');
      const autoDeltaVValueEl = document.getElementById('deltaVValue');
      const autoMissionDurationInput = document.getElementById('missionDuration');
      const autoYearsOutInput = document.getElementById('yearsOut');

      function resetDefenseControls(method, cfg) {
        // Save and suppress handlers
        const saved = {
          method: autoMethodSelect ? autoMethodSelect.onchange : null,
          dv: autoDeltaVSlider ? autoDeltaVSlider.oninput : null,
          dur: autoMissionDurationInput ? autoMissionDurationInput.oninput : null,
          yrs: autoYearsOutInput ? autoYearsOutInput.oninput : null,
          mass: autoSpacecraftMassInput ? autoSpacecraftMassInput.oninput : null
        };
        if (autoMethodSelect) autoMethodSelect.onchange = null;
        if (autoDeltaVSlider) autoDeltaVSlider.oninput = null;
        if (autoMissionDurationInput) autoMissionDurationInput.oninput = null;
        if (autoYearsOutInput) autoYearsOutInput.oninput = null;
        if (autoSpacecraftMassInput) autoSpacecraftMassInput.oninput = null;

        // Temporarily enable controls so values repaint even if auto mode disables them
        const savedDisabled = {
          method: autoMethodSelect ? autoMethodSelect.disabled : false,
          dv: autoDeltaVSlider ? autoDeltaVSlider.disabled : false,
          dur: autoMissionDurationInput ? autoMissionDurationInput.disabled : false,
          yrs: autoYearsOutInput ? autoYearsOutInput.disabled : false,
          mass: autoSpacecraftMassInput ? autoSpacecraftMassInput.disabled : false
        };
        if (autoMethodSelect) autoMethodSelect.disabled = false;
        if (autoDeltaVSlider) autoDeltaVSlider.disabled = false;
        if (autoMissionDurationInput) autoMissionDurationInput.disabled = false;
        if (autoYearsOutInput) autoYearsOutInput.disabled = false;
        if (autoSpacecraftMassInput) autoSpacecraftMassInput.disabled = false;

        // Apply values robustly with forced updates
        if (autoMethodSelect) {
          autoMethodSelect.value = method;
          if (autoMethodSelect.value !== method) {
            const idx = Array.from(autoMethodSelect.options).findIndex(o => o.value === method);
            if (idx >= 0) autoMethodSelect.selectedIndex = idx;
          }
          // Force change event to ensure UI updates
          autoMethodSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (autoDeltaVSlider) {
          autoDeltaVSlider.value = String(cfg.deltaV);
          if ('valueAsNumber' in autoDeltaVSlider) autoDeltaVSlider.valueAsNumber = parseFloat(cfg.deltaV);
          if (autoDeltaVValueEl) autoDeltaVValueEl.textContent = `${parseFloat(cfg.deltaV).toFixed(1)} mm/s`;
          // Force input event to ensure UI updates
          autoDeltaVSlider.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (autoMissionDurationInput) {
          autoMissionDurationInput.value = String(cfg.missionDuration);
          if ('valueAsNumber' in autoMissionDurationInput) autoMissionDurationInput.valueAsNumber = parseFloat(cfg.missionDuration);
          // Force input event to ensure UI updates
          autoMissionDurationInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (autoYearsOutInput) {
          autoYearsOutInput.value = String(cfg.yearsToImpact);
          if ('valueAsNumber' in autoYearsOutInput) autoYearsOutInput.valueAsNumber = parseFloat(cfg.yearsToImpact);
          // Force input event to ensure UI updates
          autoYearsOutInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (autoSpacecraftMassInput) {
          const mass = Math.round(cfg.spacecraftMass);
          autoSpacecraftMassInput.value = String(mass);
          autoSpacecraftMassInput.placeholder = `${mass}kg (${method} optimal)`;
          if ('valueAsNumber' in autoSpacecraftMassInput) autoSpacecraftMassInput.valueAsNumber = mass;
          // Force input event to ensure UI updates
          autoSpacecraftMassInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Restore handlers first
        if (autoMethodSelect) autoMethodSelect.onchange = saved.method;
        if (autoDeltaVSlider) autoDeltaVSlider.oninput = saved.dv;
        if (autoMissionDurationInput) autoMissionDurationInput.oninput = saved.dur;
        if (autoYearsOutInput) autoYearsOutInput.oninput = saved.yrs;
        if (autoSpacecraftMassInput) autoSpacecraftMassInput.oninput = saved.mass;

        // Restore disabled states
        if (autoMethodSelect) autoMethodSelect.disabled = savedDisabled.method;
        if (autoDeltaVSlider) autoDeltaVSlider.disabled = savedDisabled.dv;
        if (autoMissionDurationInput) autoMissionDurationInput.disabled = savedDisabled.dur;
        if (autoYearsOutInput) autoYearsOutInput.disabled = savedDisabled.yrs;
        if (autoSpacecraftMassInput) autoSpacecraftMassInput.disabled = savedDisabled.mass;

        // Ensure visuals sync (method-specific UI cues)
        if (typeof updateMethodVisualization === 'function') {
          try { updateMethodVisualization(); } catch (e) {}
        }
        
        // Log the successful control reset
        console.log(`🔄 [CONTROLS RESET] Method: ${method} | ΔV: ${cfg.deltaV}mm/s | Duration: ${cfg.missionDuration}y | Mass: ${cfg.spacecraftMass}kg`);
      }

      // Always apply optimal values when a new asteroid is selected.
      // Auto-Optimize controls only whether fields are disabled, not whether they reset on selection.
      // Clamp to UI ranges before applying
      const clampedDeltaV = clamp(optimalSelection.config.deltaV, 0, 500);
      const clampedYears = clamp(optimalSelection.config.yearsToImpact, 0.5, 50);
      const clampedDuration = clamp(optimalSelection.config.missionDuration, 0.1, 10);
      const methodForPlaceholder = optimalSelection.method;

      resetDefenseControls(optimalSelection.method, {
        deltaV: clampedDeltaV,
        missionDuration: clampedDuration,
        yearsToImpact: clampedYears,
        spacecraftMass: optimalSelection.config.spacecraftMass
      });

  // Trigger mitigation update with current values deterministically
  updateMitigation();

      // 7 groups: [Summary, Optimal Defense, Impact, Environmental, Approach, Observation, Orbit]
      const groups = [
        {
          title: 'Summary',
          html: `
            <div style="display:flex; justify-content:flex-start; align-items:center;">
              <div><strong>${meta.name || 'Unknown'}</strong></div>
            </div>
            <div style="color:#aaa; font-size:12px; margin-top:6px">ID: ${meta.id ?? 'Unknown'}</div>
            <div style="margin-top:6px;">Size: ${avgDiamKm.toFixed(3)} km (${meters.toFixed(0)} m)</div>
            <div>Velocity: ${vRel.toFixed(2)} km/s &nbsp; | &nbsp; Torino: ${torino}/10</div>
            <div style="margin-top:6px; padding:4px; background:rgba(255,255,255,0.1); border-radius:4px;">
              📍 Impact Location: ${impactLat.toFixed(1)}°, ${impactLng.toFixed(1)}°
            </div>
          `
        },
        {
          title: 'Optimal Defense Configuration',
          html: `
            <div style="margin-top:8px; color:#00ff88;"><strong>🎯 AUTO-SELECTED METHOD:</strong></div>
            <div style="color:#ffcc00; font-weight:bold; margin:4px 0;">${DEFLECTION_METHODS[optimalSelection.method].name}</div>
            <div style="font-size:11px; color:#ccc;">Score: ${optimalSelection.score.toFixed(1)}/100 (optimal for this scenario)</div>
            
            <div style="margin-top:12px; color:#88ddff;"><strong>⚙️ OPTIMAL PARAMETERS:</strong></div>
            <div style="margin:4px 0; padding:6px; background:rgba(0,255,136,0.1); border-radius:4px;">
              <div>🚀 Spacecraft: ${optimalSelection.config.spacecraftMass.toLocaleString()} kg</div>
              <div>💨 ΔV Required: ${optimalSelection.config.deltaV} mm/s</div>
              <div>⏱️ Mission Duration: ${optimalSelection.config.missionDuration} years</div>
              <div>⚠️ Warning Time: ${optimalSelection.config.yearsToImpact} years</div>
            </div>
            
            <div style="margin-top:8px; font-size:10px; color:#888;">
              Hazard Level: ${isHazardous ? '🔴 HIGH (Torino ≥1 or Energy ≥1Mt)' : '🟡 LOW'}
            </div>
            <div style="font-size:10px; color:#888;">
              Mass Ratio: ${(asteroidMass / optimalSelection.config.spacecraftMass).toLocaleString()}:1
            </div>
          `
        },
        {
          title: 'Impact Physics',
          html: `
            <div style="margin-top:8px; color:#ffbbbb;"><strong>DIRECT IMPACT:</strong></div>
            <div>Energy: ${Number(energyMt).toLocaleString(undefined, { maximumFractionDigits: 0 })} Mt TNT</div>
            <div>Crater: ${D_crater.toFixed(2)} km diameter</div>
            <div>Seismic: Mw ≈ ${Mw.toFixed(1)} magnitude</div>
            <div style="margin-top:8px; color:#ffd700;"><strong>SEISMIC EFFECTS:</strong></div>
            <div>Strong shaking: ${enhancedMetrics.seismicEffects.strongShakingRadius} km radius</div>
            <div>Damage zone: ${enhancedMetrics.seismicEffects.damageRadius} km radius</div>
            <div>Felt radius: ${enhancedMetrics.seismicEffects.feltRadius} km radius</div>
          `
        },
        {
          title: 'Environmental',
          html: `
            <div style="margin-top:8px; color:#dda0dd;"><strong>ATMOSPHERIC:</strong></div>
            <div style="font-size:12px;">${enhancedMetrics.atmosphericEffects}</div>
            <div style="margin-top:8px;">
              <button onclick="window.impactZoneMap && window.impactZoneMap.show({avgDiamKm: ${meta.avgDiamKm}, vRelKmPerSec: ${vRel}, energyMt: ${energyMt}})" 
                      style="font-size:11px; padding:4px 8px; background:#ffcc00; color:#000; border:none; border-radius:4px; cursor:pointer;">
                🗺️ View Impact Map
              </button>
            </div>
          `
        },
        {
          title: 'Approach',
          html: `
            <div>Hazardous: ${meta.hazardous ? '⚠️ Yes' : '✅ No'}</div>
            <div>Next approach Date: ${meta.nextApproach}</div>
            <div>Miss Distance: ${meta.missKm ? Number(meta.missKm).toLocaleString() + ' km' : 'Unknown'}</div>
            <div style="margin-top:8px; color:#98fb98;"><strong>MITIGATION WINDOW:</strong></div>
            <div style="font-size:12px;">Optimal deflection: ${Math.round(enhancedMetrics.energyMt * 0.1)} years before impact</div>
            <div style="font-size:12px;">Min. ΔV needed: ${(enhancedMetrics.energyMt * 0.001).toFixed(2)} mm/s</div>
          `
        },
        {
          title: 'Observation',
          html: `
            <div style="margin-top:8px; color:#ccc;"><strong>Observation Period:</strong></div>
            <div>First Observation: ${meta.firstObservation || 'Unknown'}</div>
            <div>Last Observation: ${meta.lastObservation || 'Unknown'}</div>
            <div style="margin-top:8px; color:#ffcc00;"><strong>Confidence Level:</strong></div>
            <div style="font-size:12px;">Based on orbital tracking accuracy and observation span</div>
            <div>${meta.firstObservation !== 'Unknown' && meta.lastObservation !== 'Unknown' ? 
              (new Date(meta.lastObservation) - new Date(meta.firstObservation)) / (1000*60*60*24*365) > 1 ? 'High' : 'Medium' : 'Low'}</div>
          `
        },
        {
          title: 'Orbit',
          html: `
            <div style="margin-top:8px; color:#ccc;"><strong>Orbital Path:</strong></div>
            <div>Semi-major Axis: ${meta.semiMajorAxis !== 'Unknown' ? parseFloat(meta.semiMajorAxis).toFixed(3) + ' AU' : 'Unknown'}</div>
            <div>Eccentricity: ${meta.eccentricity !== 'Unknown' ? parseFloat(meta.eccentricity).toFixed(4) : 'Unknown'}</div>
            <div>Perihelion: ${meta.perihelion_distance !== 'Unknown' ? parseFloat(meta.perihelion_distance).toFixed(3) + ' AU' : 'Unknown'}</div>
            <div>Aphelion: ${meta.aphelion_distance !== 'Unknown' ? parseFloat(meta.aphelion_distance).toFixed(3) + ' AU' : 'Unknown'}</div>
            <div>Inclination: ${meta.inclination !== 'Unknown' ? parseFloat(meta.inclination).toFixed(2) + '°' : 'Unknown'}</div>
            <div style="margin-top:6px; font-size:11px; color:#888;">
              Orbital classification: ${classifyOrbit(meta.semiMajorAxis, meta.eccentricity)}
            </div>
          `
        }
      ];

      // InfoPanel horizontal scrollable pages with arrows and dots aligned
      const infoPanel = document.getElementById('infoPanel');
      infoPanel.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
          <div style="display:flex; align-items:center; justify-content:center; width:100%; gap:8px;">
            <button id="infoPanelLeft">&lt;</button>
            <div id="infoPanelScroller">
              ${groups.map((g, i) => `
                <div class="info-group-wrapper" style="display:flex; align-items:center; justify-content:center; min-width:340px; max-width:340px; height:100%;">
                  <div class="info-group" data-group="${i}">
                    <div>${g.title}</div>
                    <div>${g.html}</div>
                  </div>
                </div>
              `).join('')}
            </div>
            <button id="infoPanelRight">&gt;</button>
          </div>
          <div id="infoPanelDots" style="display:flex; justify-content:center; align-items:center; margin-top:8px; gap:8px;">
            ${groups.map((_, i) => `<span class="infoPanelDot" data-dot="${i}"></span>`).join('')}
          </div>
        </div>
      `;

      // Navigation logic
      let currentPage = 0;
      const scroller = document.getElementById('infoPanelScroller');
      const dots = Array.from(document.querySelectorAll('.infoPanelDot'));
      function updatePage(newPage) {
        currentPage = Math.max(0, Math.min(groups.length - 1, newPage));
        scroller.scrollTo({ left: 340 * currentPage, behavior: 'smooth' });
        dots.forEach((d, i) => {
          d.style.background = i === currentPage ? '#fff' : '#fff';
          d.style.opacity = i === currentPage ? '1' : '0.4';
          d.classList.toggle('active', i === currentPage);
        });
      }
      document.getElementById('infoPanelLeft').onclick = () => updatePage(currentPage - 1);
      document.getElementById('infoPanelRight').onclick = () => updatePage(currentPage + 1);
      dots.forEach((d, i) => {
        d.onclick = () => updatePage(i);
      });
      updatePage(0);

      function updateMitigation() {
        console.log(`🔧 [UPDATE MITIGATION] Starting calculation...`);
        const deltaVMm = parseFloat(deltaVSlider.value);
        const years = parseFloat(yearsOutInput.value) || 1;
        const method = document.getElementById('mitigationMethod')?.value || 'kinetic';
        const missionDuration = parseFloat(document.getElementById('missionDuration')?.value) || 1.0;
        
        console.log(`🔧 Current values: Method=${method}, ΔV=${deltaVMm}mm/s, Years=${years}, Duration=${missionDuration}y`);
        
        // Get custom spacecraft mass if provided, otherwise use method-optimal default
        const customSpacecraftMassInput = document.getElementById('spacecraftMass')?.value;
        const customSpacecraftMass = customSpacecraftMassInput ? parseFloat(customSpacecraftMassInput) : null;
        
        // Update display values
        deltaVValueEl.innerText = `${deltaVMm.toFixed(1)} mm/s`;
        
        // Get asteroid mass estimate from real data
        const asteroidMass = meta.avgDiamKm ? 
          (4/3) * Math.PI * Math.pow((meta.avgDiamKm * 500), 3) * 3000 : // kg, assuming 3000 kg/m³ density
          1e12; // Default 1 billion kg
        
        // Calculate deflection using real asteroid mass and spacecraft mass
        const res = calculateDeflection(deltaVMm, years, vRel, asteroidMass, method, customSpacecraftMass);
        
        // Update placeholder to show what default spacecraft mass is being used
        updateSpacecraftMassPlaceholder(method, res.usedSpacecraftMass);
        
        // Get method information from database
        const methodInfo = DEFLECTION_METHODS[method] || DEFLECTION_METHODS['kinetic'];
        
        // Enhanced mission feasibility analysis - considers ALL input variables
        const isOptimalTiming = years >= methodInfo.optimal_warning.min && years <= methodInfo.optimal_warning.max;
        const isOptimalDeltaV = deltaVMm >= methodInfo.optimalDeltaV.min && deltaVMm <= methodInfo.optimalDeltaV.max;
        const isOptimalDuration = missionDuration >= methodInfo.missionDuration.min && missionDuration <= methodInfo.missionDuration.max;
        
        // NEW: Spacecraft mass feasibility - method-specific tolerances
        const optimalSpacecraftMass = getDefaultSpacecraftMass(method);
        const massTolerance = getMethodMassTolerance(method);
        const massRatio = res.usedMassRatio;
        const isOptimalSpacecraftMass = res.usedSpacecraftMass >= (optimalSpacecraftMass * massTolerance.min) && 
                                       res.usedSpacecraftMass <= (optimalSpacecraftMass * massTolerance.max);
        
        // NEW: Mass ratio feasibility - method-specific optimal ranges
        const optimalMassRatioRange = getMethodOptimalMassRatio(method);
        const isOptimalMassRatio = massRatio >= optimalMassRatioRange.min && massRatio <= optimalMassRatioRange.max;
        
        // NEW: Mission effectiveness feasibility - must achieve meaningful deflection
        const isEffectiveDeflection = res.missDistanceKm > 6378; // At least 1 Earth radius miss distance
        
        // Enhanced feasibility scoring with 6 factors (adjusted weights)
        let feasibilityScore = 0;
        if (isOptimalTiming) feasibilityScore += 25;           // Reduced from 40
        if (isOptimalDeltaV) feasibilityScore += 25;           // Reduced from 35  
        if (isOptimalDuration) feasibilityScore += 20;         // Reduced from 25
        if (isOptimalSpacecraftMass) feasibilityScore += 15;   // NEW: Spacecraft mass factor
        if (isOptimalMassRatio) feasibilityScore += 10;        // NEW: Mass ratio factor
        if (isEffectiveDeflection) feasibilityScore += 5;      // NEW: Effectiveness factor
        // Total: 100 points
        
        // Enhanced cost calculation with method-specific spacecraft mass considerations
        const baseCost = (methodInfo.costRange.min + methodInfo.costRange.max) / 2;
        const complexityMultiplier = deltaVMm > methodInfo.optimalDeltaV.max ? 1.5 : 1.0;
        const urgencyMultiplier = years < 2 ? 2.0 : years < 5 ? 1.3 : 1.0;
        const massMultiplier = Math.pow(res.usedSpacecraftMass / 1500, 0.6); // Normalized to average mass
        const estimatedCost = baseCost * complexityMultiplier * urgencyMultiplier * massMultiplier;
        
        // Update main result display
        const missDistanceColor = res.missDistanceKm > 50000 ? '#44ff88' : res.missDistanceKm > 10000 ? '#ffcc00' : '#ff6666';
        mitigationResultEl.innerHTML = `
          Miss Distance: <span style="color:${missDistanceColor}; font-weight: bold;">
            ${Math.round(res.missDistanceKm).toLocaleString()} km
          </span> (${res.missDistanceLD.toFixed(2)} LD)
        `;
        
        // Update efficiency display
        const efficiencyEl = document.getElementById('mitigationEfficiency');
        if (efficiencyEl) {
          const reliabilityPercent = (methodInfo.reliability * 100).toFixed(0);
          efficiencyEl.innerHTML = `
            <strong>${methodInfo.name}</strong> | 
            Reliability: ${reliabilityPercent}% | 
            Est. Cost: $${estimatedCost.toFixed(0)}M
          `;
        }
        
        // Update mission feasibility
        const feasibilityEl = document.getElementById('missionFeasibility');
        if (feasibilityEl) {
          const feasibilityText = feasibilityScore >= 80 ? 'Highly Feasible' :
                                 feasibilityScore >= 60 ? 'Feasible' :
                                 feasibilityScore >= 40 ? 'Challenging' : 'Very Difficult';
          const feasibilityColor = feasibilityScore >= 80 ? '#44ff88' :
                                   feasibilityScore >= 60 ? '#ffcc00' :
                                   feasibilityScore >= 40 ? '#ff8844' : '#ff4444';
          
          feasibilityEl.innerHTML = `
            Mission feasibility: <span style="color:${feasibilityColor}; font-weight: bold;">
              ${feasibilityText}
            </span> (${feasibilityScore}%)
          `;
        }
        
        // Update physics details
        const physicsEl = document.getElementById('orbitalMechanics');
        if (physicsEl) {
          const isCustomMass = customSpacecraftMass !== null;
          const asteroidMassDisplay = (asteroidMass / 1e9).toFixed(1); // Display in billions of kg
          physicsEl.innerHTML = `
            • Orbital velocity change: ${res.orbitalVelocityChange.toFixed(2)} m/s<br>
            • Deflection angle: ${res.deflectionAngle.toFixed(6)}°<br>
            • Energy efficiency: ${res.energyEfficiency.toFixed(1)}%<br>
            • Success probability: ${res.successProbability.toFixed(1)}%<br>
            • Momentum transfer: ${(res.momentumTransfer/1e6).toFixed(2)} MN⋅s<br>
            • Mass efficiency: ${res.massEfficiency.toFixed(1)}%<br>
            • Spacecraft mass: ${res.usedSpacecraftMass.toLocaleString()} kg ${isCustomMass ? '(custom)' : '(optimal)'}<br>
            • Asteroid mass: ${asteroidMassDisplay}B kg (from data)<br>
            • Mass ratio: ${res.usedMassRatio.toFixed(1)}:1 (calculated)<br>
            • Mission duration: ${missionDuration} years
          `;
        }
        
        // Warning messages for suboptimal parameters
        let warnings = [];
        if (!isOptimalTiming) {
          if (years < methodInfo.optimal_warning.min) {
            warnings.push(`⚠️ Warning time too short for ${methodInfo.name} (needs ${methodInfo.optimal_warning.min}-${methodInfo.optimal_warning.max} years)`);
          } else {
            warnings.push(`⚠️ Warning time excessive for ${methodInfo.name} (optimal: ${methodInfo.optimal_warning.min}-${methodInfo.optimal_warning.max} years)`);
          }
        }
        if (!isOptimalDeltaV) {
          if (deltaVMm < methodInfo.optimalDeltaV.min) {
            warnings.push(`⚠️ ΔV too low for effective ${methodInfo.name} (needs ≥${methodInfo.optimalDeltaV.min} mm/s)`);
          } else {
            warnings.push(`⚠️ ΔV excessive for ${methodInfo.name} (optimal: ≤${methodInfo.optimalDeltaV.max} mm/s)`);
          }
        }
        if (!isOptimalDuration) {
          if (missionDuration < methodInfo.missionDuration.min) {
            warnings.push(`⚠️ Mission duration too short for ${methodInfo.name} (needs ${methodInfo.missionDuration.min}-${methodInfo.missionDuration.max} years)`);
          } else {
            warnings.push(`⚠️ Mission duration too long for ${methodInfo.name} (optimal: ${methodInfo.missionDuration.min}-${methodInfo.missionDuration.max} years)`);
          }
        }
        if (!isOptimalSpacecraftMass) {
          const tolerance = getMethodMassTolerance(method);
          const optimalRangeMin = Math.round(optimalSpacecraftMass * tolerance.min);
          const optimalRangeMax = Math.round(optimalSpacecraftMass * tolerance.max);
          const optimalRange = `${optimalRangeMin}-${optimalRangeMax}kg`;
          if (res.usedSpacecraftMass < optimalSpacecraftMass * tolerance.min) {
            warnings.push(`⚠️ Spacecraft too light for ${methodInfo.name} (optimal: ${optimalRange})`);
          } else {
            warnings.push(`⚠️ Spacecraft too massive for ${methodInfo.name} (optimal: ${optimalRange})`);
          }
        }
        if (!isOptimalMassRatio) {
          const optimalRange = getMethodOptimalMassRatio(method);
          if (massRatio < optimalRange.min) {
            warnings.push(`⚠️ Mass ratio too low (${massRatio.toFixed(1)}:1) for ${methodInfo.name} - spacecraft oversized (optimal: ${optimalRange.min}-${optimalRange.max}:1)`);
          } else {
            warnings.push(`⚠️ Mass ratio too high (${massRatio.toFixed(1)}:1) for ${methodInfo.name} - consider different method or larger spacecraft (optimal: ${optimalRange.min}-${optimalRange.max}:1)`);
          }
        }
        if (!isEffectiveDeflection) {
          warnings.push(`⚠️ Deflection insufficient - increase spacecraft mass or ΔV for safety margin`);
        }
      }
      
      // Function to update placeholder value to show current spacecraft mass default
      function updateSpacecraftMassPlaceholder(method, usedSpacecraftMass) {
        const spacecraftMassInput = document.getElementById('spacecraftMass');
        
        if (spacecraftMassInput && !spacecraftMassInput.value) {
          spacecraftMassInput.placeholder = `${usedSpacecraftMass}kg (${method} optimal)`;
        }
      }
      
      // Function to auto-adjust mission duration based on method
      function updateMissionDurationForMethod(method) {
        const missionDurationInput = document.getElementById('missionDuration');
        const methodInfo = DEFLECTION_METHODS[method];
        
        if (missionDurationInput && methodInfo && !missionDurationInput.value) {
          // Set to minimum optimal duration for the method
          const optimalDuration = methodInfo.missionDuration.min;
          missionDurationInput.value = optimalDuration;
        }
      }
      
      // Enhanced method change handler
      function handleMethodChange() {
        const method = document.getElementById('mitigationMethod')?.value || 'kinetic';
        updateMissionDurationForMethod(method);
        updateMitigation();
      }
      
      // Helper to enable/disable manual controls based on Auto-Optimize
      function syncAutoOptimizeState() {
        const autoToggle = document.getElementById('autoOptimize');
        const methodSelect = document.getElementById('mitigationMethod');
        const missionDurationInput = document.getElementById('missionDuration');
        const spacecraftMassInput = document.getElementById('spacecraftMass');
        const deltaVSlider = document.getElementById('deltaV');
        const yearsOutInput = document.getElementById('yearsOut');
        const disabled = autoToggle ? !!autoToggle.checked : true;
        // Manual tuning disabled in auto mode (yearsOut remains editable)
        if (methodSelect) methodSelect.disabled = disabled;
        if (missionDurationInput) missionDurationInput.disabled = disabled;
        if (spacecraftMassInput) spacecraftMassInput.disabled = disabled;
        if (deltaVSlider) deltaVSlider.disabled = disabled;
      }

      // Event listeners for all deflection controls
      const methodSelect = document.getElementById('mitigationMethod');
      if (methodSelect) methodSelect.onchange = handleMethodChange;

      deltaVSlider.oninput = function() {
        const autoToggle = document.getElementById('autoOptimize');
        if (autoToggle && autoToggle.checked) return; // ignore in auto mode
        updateMitigation();
      };

      yearsOutInput.oninput = function() {
        const autoToggle = document.getElementById('autoOptimize');
        if (autoToggle && autoToggle.checked) {
          // In auto mode, changing years should recompute optimal config
          // Re-run showMetaAndReport with current meta to update recommendations
          showMetaAndReport(meta);
        } else {
          updateMitigation();
        }
      };

      const missionDurationInput = document.getElementById('missionDuration');
      if (missionDurationInput) missionDurationInput.oninput = function() {
        const autoToggle = document.getElementById('autoOptimize');
        if (autoToggle && autoToggle.checked) return; // ignore in auto mode
        updateMitigation();
      };
      
      const spacecraftMassInput = document.getElementById('spacecraftMass');
      if (spacecraftMassInput) spacecraftMassInput.oninput = function() {
        const autoToggle = document.getElementById('autoOptimize');
        if (autoToggle && autoToggle.checked) return; // ignore in auto mode
        updateMitigation();
      };

      // Auto-Optimize toggle listener
      const autoToggleEl = document.getElementById('autoOptimize');
      if (autoToggleEl) {
        autoToggleEl.onchange = function() {
          syncAutoOptimizeState();
          // Recompute recommendation or respect manual values
          showMetaAndReport(meta);
        };
      }

      // Always reset all mission controls to the new asteroid's optimal values on label click
      // (regardless of auto-optimize toggle, so user always sees the new asteroid's best config)
      resetDefenseControls(optimalSelection.method, {
        deltaV: clampedDeltaV,
        missionDuration: clampedDuration,
        yearsToImpact: clampedYears,
        spacecraftMass: optimalSelection.config.spacecraftMass
      });

      // Initialize visual enhancements
      addMethodComparisonButton();
      updateMethodVisualization();
      
      // Add method change handler for visual updates without duplicating updateMitigation
      if (methodSelect) {
        const original = methodSelect.onchange;
        methodSelect.onchange = (e) => {
          updateMethodVisualization();
          if (original) original.call(methodSelect, e);
        };
      }

      // Sync auto-optimize state and trigger final mitigation calculation
      syncAutoOptimizeState();
      updateMitigation();
    }

    function classifyOrbit(semiMajorAxis, eccentricity) {
      if (semiMajorAxis === 'Unknown' || eccentricity === 'Unknown') return 'Unknown';
      
      const a = parseFloat(semiMajorAxis);
      const e = parseFloat(eccentricity);
      
      if (a < 1.3) return 'Aten (Earth-crossing)';
      if (a < 1.665) return 'Apollo (Earth-crossing)';
      if (a < 4.2) return 'Amor (Mars-crossing)';
      return 'Main Belt';
    }

    window.showMetaAndReport = showMetaAndReport;

    let lastPointer = { x: null, y: null };
    let lastHover = { objectId: null, instanceId: null };

    function onPointerMove(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      if (lastPointer.x !== null) {
        const dx = Math.abs(px - lastPointer.x);
        const dy = Math.abs(py - lastPointer.y);
        if (dx < 4 && dy < 4) return;
      }
      lastPointer.x = px;
      lastPointer.y = py;

      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(astGroup.children, true);
      if (hits.length) {
        const hit = hits[0];
        let meta = null;
        if (hit.object.isInstancedMesh) {
          const inst = hit.object;
          const iid = hit.instanceId;
          if (inst === currentInstSafeMesh) meta = instancedMetaSafe[iid];
          else if (inst === currentInstHazardMesh) meta = instancedMetaHazard[iid];
          if (lastHover.objectId === inst.id && lastHover.instanceId === iid) return;
          lastHover.objectId = inst.id;
          lastHover.instanceId = iid;
        } else {
          const obj = hit.object;
          meta = obj.userData;
          if (!meta) {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(-6px)';
            return;
          }
          if (lastHover.objectId === obj.id && lastHover.instanceId === null) return;
          lastHover.objectId = obj.id;
          lastHover.instanceId = null;
        }
        if (meta) {
          tooltip.innerHTML = `
            <strong style="display:block;margin-bottom:4px">${getAsteroidLabelText(meta)}</strong>
            <div style="color:#aaa; font-size:12px; margin-bottom:6px">ID: ${meta.id ?? 'Unknown'}</div>
            <div style="margin-bottom:4px">Torino: <span style="color:#ffcc00">${meta.torinoScore ?? calculateTorinoProxy(meta.energyMt ?? 0)} / 10</span></div>
            ${meta.avgDiamKm.toFixed(1)} km &nbsp; • &nbsp; ${meta.hazardous ? '<span style="color:#ff8888">Hazard</span>' : 'Safe'}<br>
            Approach Date: ${meta.nextApproach}<br>
            ${meta.missKm ? Number(meta.missKm).toLocaleString() + ' km' : 'Miss: Unknown'}
          `;
          const pad = 12;
          let left = e.clientX - rect.left + pad;
          let top = e.clientY - rect.top + pad;
          if (left + 240 > rect.width) left = rect.width - 240 - pad;
          if (top + 120 > rect.height) top = rect.height - 120 - pad;
          tooltip.style.left = left + 'px';
          tooltip.style.top = top + 'px';
          tooltip.style.opacity = '1';
          tooltip.style.transform = 'translateY(0)';
          return;
        }
      }
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateY(-6px)';
      lastHover.objectId = null;
      lastHover.instanceId = null;
    }
    renderer.domElement.addEventListener('mousemove', onPointerMove, { passive: true });

    function onClick(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(astGroup.children, true);
      if (hits.length) {
        const hit = hits[0];
        let meta = null;
        if (hit.object.isInstancedMesh) {
          const inst = hit.object;
          const iid = hit.instanceId;
          if (inst === currentInstSafeMesh) meta = instancedMetaSafe[iid];
          else if (inst === currentInstHazardMesh) meta = instancedMetaHazard[iid];
        } else {
          meta = hit.object.userData;
        }
        if (meta) {
          const controlsDiv = document.getElementById('controls');
          const toggleControlsBtn = document.getElementById('toggleControls');
          if (controlsDiv && controlsDiv.classList.contains('minimized')) {
            controlsDiv.classList.remove('minimized');
            if (toggleControlsBtn) {
              toggleControlsBtn.textContent = '−';
              toggleControlsBtn.title = 'Minimize Controls';
            }
          }
          showMetaAndReport(meta);
        }
      }
    }
    renderer.domElement.onclick = onClick;

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
    });

    function animate() {
      requestAnimationFrame(animate);
      
      // Performance monitoring
      checkPerformance();
      
      const dt = clock.getDelta();
      
      // Smooth but performance-friendly rotation animation
      astGroup.rotation.y += 0.001 * (dt * 60); // Reduced from 0.0015 for smoother performance
      
      // Optimized asteroid animations with adaptive quality
      const time = performance.now() * 0.0002; // Reduced frequency
      let updateCount = 0;
      const maxUpdatesPerFrame = performanceMonitor.isLowPerformance ? 3 : Math.max(5, Math.floor(astGroup.children.length / 10)); // Adaptive update limit
      
      astGroup.children.forEach((m, index) => {
        if (updateCount >= maxUpdatesPerFrame) return; // Skip if we've updated enough this frame
        
        if (m.userData && m.userData.rotationSpeed) {
          const s = m.userData.rotationSpeed * (performanceMonitor.isLowPerformance ? 0.5 : 0.7); // Slower for low performance
          m.rotation.y += s * dt;
          
          // Only update expensive sin calculations for a subset each frame
          if (index % (performanceMonitor.isLowPerformance ? 8 : 5) === Math.floor(time) % (performanceMonitor.isLowPerformance ? 8 : 5)) {
            m.rotation.x = Math.sin(time + index * 0.1) * 0.04; // Reduced amplitude
            updateCount++;
          }
        }
      });
      
      // Always update controls and render for smooth interaction
      controls.update();
      renderer.render(scene, camera);
      
      // Labels must render every frame to stay synchronized with asteroids
      labelRenderer.render(scene, camera);
    }
    animate();

    function updateAsteroidSizes(newMultiplier) {
      globalSizeMultiplier = newMultiplier;
      astGroup.children.forEach(child => {
        if (child.isMesh && child.userData && child.userData.baseRadiusUnits) {
          const newRadius = Math.min(8.0, child.userData.baseRadiusUnits * globalSizeMultiplier);
          child.scale.setScalar(newRadius / child.userData.baseRadiusUnits);
        }
      });
      [instancedMetaSafe, instancedMetaHazard].forEach(metaArray => {
        metaArray.forEach(meta => {
          if (meta.baseRadiusUnits) {
            meta.radiusUnits = Math.min(8.0, meta.baseRadiusUnits * globalSizeMultiplier);
          }
        });
      });
      if (currentInstSafeMesh) astGroup.remove(currentInstSafeMesh);
      if (currentInstHazardMesh) astGroup.remove(currentInstHazardMesh);
      currentInstSafeMesh = makeInstanced(instancedSafe.map((item, i) => ({
        ...item,
        radiusUnits: instancedMetaSafe[i].radiusUnits
      })), 0x44ff88);
      currentInstHazardMesh = makeInstanced(instancedHazard.map((item, i) => ({
        ...item,
        radiusUnits: instancedMetaHazard[i].radiusUnits
      })), 0xff4444);
    }

    const sizeRatioSlider = document.getElementById('sizeRatio');
    const sizeRatioValue = document.getElementById('sizeRatioValue');
    if (sizeRatioSlider && sizeRatioValue) {
      sizeRatioSlider.value = 1;
      sizeRatioValue.textContent = '1x';
      updateAsteroidSizes(1);
      sizeRatioSlider.oninput = function() {
        const multiplier = parseFloat(this.value);
        sizeRatioValue.textContent = multiplier + 'x';
        updateAsteroidSizes(multiplier);
      };
    }

    const toggleControlsBtn = document.getElementById('toggleControls');
    const controlsDiv = document.getElementById('controls');
    if (toggleControlsBtn && controlsDiv) {
      toggleControlsBtn.textContent = '<';
      toggleControlsBtn.title = 'Minimize Controls';
      toggleControlsBtn.onclick = function() {
        const isMinimized = controlsDiv.classList.contains('minimized');
        if (isMinimized) {
          controlsDiv.classList.remove('minimized');
          this.textContent = '<';
          this.title = 'Minimize Controls';
        } else {
          controlsDiv.classList.add('minimized');
          this.textContent = '>';
          this.title = 'Expand Controls';
        }
      };
    }
  } catch (e) {
    console.error('Three.js init failed:', e);
    document.getElementById('infoPanel').innerText = 'Visualization failed (see console).';
  }
}

window.addEventListener('load', () => {
  // Initialize loading screen
  updateLoadingProgress(0, "Starting OrbitalShield...");
  
  // Initialize dropdown panels
  initializeDropdownPanels();
  
  // Add event listeners for manual input changes
  const latInput = document.getElementById('impactLat');
  const lonInput = document.getElementById('impactLng');
  
  if (latInput && lonInput) {
    latInput.addEventListener('input', updateImpactDisplay);
    lonInput.addEventListener('input', updateImpactDisplay);
  }
  
  // Add delta-V slider update
  const deltaVSlider = document.getElementById('deltaV');
  const deltaVValue = document.getElementById('deltaVValue');
  
  if (deltaVSlider && deltaVValue) {
    deltaVSlider.addEventListener('input', (e) => {
      deltaVValue.textContent = `${parseFloat(e.target.value).toFixed(1)} mm/s`;
    });
  }
  
  // Add city dropdown functionality
  const citySelect = document.getElementById('citySelect');
  if (citySelect) {
    citySelect.addEventListener('change', (e) => {
      const coordinates = e.target.value;
      if (coordinates) {
        const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
        
        if (!isNaN(lat) && !isNaN(lng)) {
          // Update input fields
          document.getElementById('impactLat').value = lat;
          document.getElementById('impactLng').value = lng;
          
          // Update display
          updateImpactDisplay();
          
          // Visual feedback
          const cityName = e.target.options[e.target.selectedIndex].text;
          console.log(`📍 Selected impact location: ${cityName} (${lat}, ${lng})`);
          
          // Optional: Show notification
          showNotification(`🎯 Impact location set to ${cityName.split(' ')[1]}`);
        }
      }
    });
  }
  
  // Keep location preset buttons functionality for any remaining buttons
  const locationPresets = document.querySelectorAll('.location-preset');
  locationPresets.forEach(button => {
    button.addEventListener('click', (e) => {
      const lat = parseFloat(e.target.dataset.lat);
      const lng = parseFloat(e.target.dataset.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Update input fields
        document.getElementById('impactLat').value = lat;
        document.getElementById('impactLng').value = lng;
        
        // Update display
        updateImpactDisplay();
        
        // Visual feedback
        const cityName = e.target.textContent.trim();
        console.log(`Applied location preset: ${cityName} (${lat}, ${lng})`);
      }
    });
  });
  
  setTimeout(() => {
    updateLoadingProgress(10, "Fetching asteroid data...");
    autoFetchAsteroids();
  }, 100);



  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshAsteroids);
  }

  // Impact location simulation
  const simulateImpactBtn = document.getElementById('simulateImpact');
  const showImpactMapBtn = document.getElementById('showImpactMap');
  
  if (simulateImpactBtn) {
    simulateImpactBtn.addEventListener('click', function() {
      const latInput = document.getElementById('impactLat');
      const lngInput = document.getElementById('impactLng');
      
      if (latInput.value && lngInput.value) {
        const lat = parseFloat(latInput.value);
        const lng = parseFloat(lngInput.value);
        
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const infoPanel = document.getElementById('infoPanel');
          if (infoPanel) {
            infoPanel.innerHTML = `
              <div style="color:#ffcc00;">🎯 Impact Location Set: ${lat.toFixed(1)}°, ${lng.toFixed(1)}°</div>
              <div style="font-size:12px; margin-top:4px;">Select an asteroid to see environmental impact analysis for this location.</div>
            `;
          }
        } else {
          alert('⚠️ Invalid coordinates: Latitude must be -90 to 90, Longitude must be -180 to 180');
        }
      } else {
        alert('⚠️ Please enter both latitude and longitude values for impact simulation');
      }
    });
  }

  if (showImpactMapBtn) {
    showImpactMapBtn.addEventListener('click', function() {
      if (window.impactZoneMap) {
        window.impactZoneMap.show();
      }
    });
  }

  // Educational and Gamification mode buttons
  const educationalModeBtn = document.getElementById('educationalMode');
  const gamificationModeBtn = document.getElementById('gamificationMode');
  const scenarioModeBtn = document.getElementById('scenarioMode');
  
  if (educationalModeBtn) {
    educationalModeBtn.addEventListener('click', function() {
      showEducationalOverlay();
    });
  }
  
  if (gamificationModeBtn) {
    gamificationModeBtn.addEventListener('click', function() {
      startDefendEarthMode();
    });
  }
  
  if (scenarioModeBtn) {
    scenarioModeBtn.addEventListener('click', function() {
      if (window.scenarioSystem) {
        window.scenarioSystem.show();
      }
    });
  }

  const searchInput = document.getElementById('asteroidSearch');
  const searchResults = document.getElementById('searchResults');
  const searchIcon = document.getElementById('searchIcon');
  let lastSearchAsteroids = [];

  if (searchInput) searchInput.style.display = 'none';
  if (searchResults) searchResults.style.display = 'none';

  if (searchIcon && searchInput) {
    searchIcon.addEventListener('click', function() {
      searchInput.style.display = 'block';
      searchInput.focus();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('blur', function() {
      // Use a longer timeout to allow search result clicks to process first
      setTimeout(() => {
        if (document.activeElement !== searchInput) {
          searchInput.style.display = 'none';
          if (searchResults) searchResults.style.display = 'none';
        }
      }, 300);
    });
  }

  function getPlottedAsteroids() {
    const countInput = document.getElementById('asteroidCount');
    const maxCount = countInput ? Math.min(200, parseInt(countInput.value) || 20) : 20;
    return asteroidCache.data.slice(0, maxCount);
  }

  function showSearchResults(matches) {
    if (!searchResults) return;
    if (!matches.length) {
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
      return;
    }
    searchResults.innerHTML = matches.map(a => `
      <div class="search-result-item" data-id="${a.id}" style="padding:6px 12px; cursor:pointer; border-bottom:1px solid #333;">
        ${getAsteroidLabelText(a)} (${a.id})
      </div>
    `).join('');
    searchResults.style.display = 'block';
  }

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', function() {
      const val = this.value.trim().toLowerCase();
      const asteroids = getPlottedAsteroids();
      lastSearchAsteroids = asteroids;
      if (!val) {
        showSearchResults(asteroids);
        return;
      }
      const matches = asteroids.filter(a =>
        (a.name && a.name.toLowerCase().includes(val)) ||
        (a.designation && a.designation.toLowerCase().includes(val)) ||
        (a.name_limited && a.name_limited.toLowerCase().includes(val)) ||
        (a.id && String(a.id).toLowerCase().includes(val))
      );
      showSearchResults(matches);
    });

    searchInput.addEventListener('focus', function() {
      if (!this.value.trim()) {
        const asteroids = getPlottedAsteroids();
        lastSearchAsteroids = asteroids;
        showSearchResults(asteroids);
      }
    });

    searchResults.addEventListener('mousedown', function(e) {
      // Prevent the search blur event from interfering
      e.preventDefault();
      e.stopPropagation();
      
      const item = e.target.closest('.search-result-item');
      if (item) {
        const id = item.getAttribute('data-id');
        const asteroids = lastSearchAsteroids.length ? lastSearchAsteroids : getPlottedAsteroids();
        const found = asteroids.find(a => String(a.id) === id);
        
        // Hide search UI immediately
        if (searchInput) {
          searchInput.style.display = 'none';
          searchInput.blur();
        }
        if (searchResults) {
          searchResults.style.display = 'none';
        }
        
        if (found && window.showMetaAndReport) {
          const est = found.estimated_diameter?.kilometers;
          const avgDiamKm = est ? (est.estimated_diameter_min + est.estimated_diameter_max) / 2 : undefined;
          const approach = findNextApproach(found.close_approach_data);
          const missKm = approach ? parseFloat(approach.miss_distance.kilometers) : null;
          const vRelKmPerSec = approach?.relative_velocity?.kilometers_per_second ? parseFloat(approach.relative_velocity.kilometers_per_second) : 0.0;
          const metrics = avgDiamKm ? calculateImpactMetrics(avgDiamKm, vRelKmPerSec) : {};
          const torinoScore = metrics.energyMt ? calculateTorinoProxy(metrics.energyMt) : 0;
          const meta = {
            id: found.id,
            name: found.name,
            designation: found.designation,
            name_limited: found.name_limited,
            avgDiamKm,
            baseRadiusUnits: undefined,
            hazardous: !!found.is_potentially_hazardous_asteroid,
            nextApproach: approach ? (approach.close_approach_date_full || approach.close_approach_date) : 'Unknown',
            missKm,
            vRelKmPerSec,
            firstObservation: found.orbital_data?.first_observation_date || 'Unknown',
            lastObservation: found.orbital_data?.last_observation_date || 'Unknown',
            semiMajorAxis: found.orbital_data?.semi_major_axis || 'Unknown',
            eccentricity: found.orbital_data?.eccentricity || 'Unknown',
            inclination: found.orbital_data?.inclination || 'Unknown',
            perihelion_distance: found.orbital_data?.perihelion_distance || 'Unknown',
            aphelion_distance: found.orbital_data?.aphelion_distance || 'Unknown',
            energyMt: metrics.energyMt,
            Mw: metrics.Mw,
            D_crater_km: metrics.D_crater_km,
            torinoScore
          };
          
          // Ensure UI is properly restored
          const controlsDiv = document.getElementById('controls');
          const toggleControlsBtn = document.getElementById('toggleControls');
          const uiOverlay = document.getElementById('ui-overlay');
          
          if (controlsDiv) {
            controlsDiv.classList.remove('minimized');
            controlsDiv.style.opacity = '1';
            controlsDiv.style.pointerEvents = 'auto';
          }
          if (uiOverlay) {
            uiOverlay.style.opacity = '1';
            // DO NOT set pointer-events to auto - this blocks OrbitControls!
            // uiOverlay.style.pointerEvents = 'auto';
          }
          if (toggleControlsBtn) {
            toggleControlsBtn.textContent = '<';
            toggleControlsBtn.title = 'Minimize Controls';
          }
          
          const infoPanel = document.getElementById('infoPanel');
          if (infoPanel) {
            infoPanel.style.display = 'block';
            infoPanel.style.opacity = '1';
            setTimeout(() => infoPanel.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
          }
          
          // Ensure OrbitControls maintain their functionality
          setTimeout(() => {
            showMetaAndReport(meta);
            // Force focus back to the canvas/renderer to ensure OrbitControls work
            const canvas = document.querySelector('#canvas canvas');
            if (canvas) {
              canvas.focus();
            }
            // Re-enable orbit controls if they were disabled
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
              window.orbitControls.enableRotate = true;
              window.orbitControls.enableZoom = true;
              window.orbitControls.enablePan = true;
            }
            // Ensure UI overlay never blocks mouse events
            const uiOverlay = document.getElementById('ui-overlay');
            if (uiOverlay) {
              uiOverlay.style.pointerEvents = 'none';
            }
          }, 50);
        }
      }
    });
  }

  const countInput = document.getElementById('asteroidCount');
  if (countInput) {
    countInput.addEventListener('input', function() {
      if (parseInt(this.value) > 200) {
        this.value = 200;
      }
    });
    countInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        if (parseInt(this.value) > 200) {
          this.value = 200;
        }
        refreshAsteroids();
      }
    });
  }

  setTimeout(() => {
    const logText = document.getElementById('infoPanel').innerText || '';
    const canvas = document.getElementById('canvas');
    const canvasEmpty = !canvas || canvas.children.length === 0;
    if (logText.includes('Select an asteroid') || logText.includes('No asteroids returned') || canvasEmpty) {
      console.warn('Using fallback sample asteroids for local debug (remove before deploy)');
      const countInput = document.getElementById('asteroidCount');
      const maxCount = countInput ? Math.min(200, parseInt(countInput.value) || 20) : 20;
      const sample = [];
      for (let i = 0; i < Math.min(maxCount, 12); i++) {
        sample.push({
          name: 'AST-' + (1000 + i),
          id: String(1000 + i),
          estimated_diameter: { kilometers: { estimated_diameter_min: 0.01 + i * 0.01, estimated_diameter_max: 0.02 + i * 0.02 } },
          is_potentially_hazardous_asteroid: (i % 5 === 0),
          close_approach_data: [{
            close_approach_date: '2025-10-' + String(5 + i).padStart(2, '0'),
            miss_distance: { kilometers: String(1e3 * (i + 1)) },
            relative_velocity: { kilometers_per_second: '0' }
          }],
          orbital_data: {
            semi_major_axis: (1 + i * 0.1).toString(),
            eccentricity: (0.1 + i * 0.01).toString(),
            inclination: (10 + i).toString(),
            perihelion_distance: (0.8 + i * 0.05).toString(),
            aphelion_distance: (1.2 + i * 0.1).toString(),
            first_observation_date: '2020-01-01',
            last_observation_date: '2025-01-01'
          }
        });
      }
      initThreeScene(sample);
    }
  }, 800);
});

// Educational overlay function
function showEducationalOverlay() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.9); z-index: 1000; display: flex; 
    align-items: center; justify-content: center; color: #fff;
    font-family: Arial, sans-serif;
  `;
  
  overlay.innerHTML = `
    <div style="max-width: 800px; padding: 40px; background: rgba(20,20,40,0.95); border-radius: 12px; margin: 20px;">
      <h2 style="text-align: center; color: #ffcc00; margin-bottom: 30px;">🌍 Understanding Asteroid Threats</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          <h3 style="color: #ff6b6b;">🔥 Impact Physics</h3>
          <p><strong>Kinetic Energy:</strong> KE = ½mv² - Even small asteroids carry enormous energy</p>
          <p><strong>TNT Equivalent:</strong> 1 km asteroid ≈ 10,000 Mt (500x all nuclear weapons)</p>
          <p><strong>Crater Size:</strong> Usually 10-20x asteroid diameter</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          <h3 style="color: #87ceeb;">🌊 Environmental Effects</h3>
          <p><strong>Seismic Activity:</strong> Ground shaking felt thousands of km away</p>
          <p><strong>Atmospheric Effects:</strong> Dust clouds can affect global climate</p>
          <p><strong>Crater Formation:</strong> Impact craters can be tens of kilometers wide</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          <h3 style="color: #98fb98;">🛡️ Deflection Methods</h3>
          <p><strong>Kinetic Impactor:</strong> Spacecraft crashes into asteroid</p>
          <p><strong>Gravity Tractor:</strong> Spacecraft pulls asteroid with gravity</p>
          <p><strong>Nuclear:</strong> Explosion changes asteroid's trajectory</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          <h3 style="color: #dda0dd;">⚡ Key Concepts</h3>
          <p><strong>ΔV (Delta-V):</strong> Change in velocity needed for deflection</p>
          <p><strong>Torino Scale:</strong> 0-10 scale measuring impact risk</p>
          <p><strong>PHAs:</strong> Potentially Hazardous Asteroids (>140m, <7.5M km)</p>
        </div>
      </div>
      
      <div style="text-align: center;">
        <button id="closeEducational" style="padding: 12px 24px; background: #ffcc00; color: #000; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
          Got it! Continue Exploring
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  document.getElementById('closeEducational').onclick = () => {
    document.body.removeChild(overlay);
  };
  
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };
}

// Gamification mode
let gameMode = {
  active: false,
  score: 0,
  asteroidsDeflected: 0,
  missionTime: 0
};

function startDefendEarthMode() {
  if (gameMode.active) return;
  
  gameMode = { active: true, score: 0, asteroidsDeflected: 0, missionTime: 0 };
  
  const gameOverlay = document.createElement('div');
  gameOverlay.id = 'gameOverlay';
  gameOverlay.style.cssText = `
    position: fixed; top: 20px; right: 20px; width: 300px; 
    background: rgba(0,0,0,0.9); border: 2px solid #ffcc00; 
    border-radius: 8px; padding: 15px; color: #fff; z-index: 100;
    font-family: Arial, sans-serif;
  `;
  
  gameOverlay.innerHTML = `
    <h3 style="margin: 0 0 10px 0; color: #ffcc00;">🎮 DEFEND EARTH MODE</h3>
    <div id="gameStats">
      <div>Score: <span id="gameScore">0</span></div>
      <div>Deflected: <span id="gameDeflected">0</span></div>
      <div>Time: <span id="gameTime">0</span>s</div>
    </div>
    <div style="margin-top: 10px; font-size: 12px; color: #aaa;">
      Select asteroids and use deflection controls to save Earth!<br>
      Points = Energy (Mt) × Deflection Success
    </div>
    <button id="endGame" style="margin-top: 10px; padding: 5px 10px; background: #ff4444; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
      End Mission
    </button>
  `;
  
  document.body.appendChild(gameOverlay);
  
  // Start game timer
  const gameTimer = setInterval(() => {
    gameMode.missionTime++;
    document.getElementById('gameTime').textContent = gameMode.missionTime;
  }, 1000);
  
  document.getElementById('endGame').onclick = () => {
    clearInterval(gameTimer);
    gameMode.active = false;
    
    // Show final score
    const finalScore = document.createElement('div');
    finalScore.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.95); border: 2px solid #ffcc00; border-radius: 12px;
      padding: 30px; color: #fff; text-align: center; z-index: 1001;
    `;
    
    finalScore.innerHTML = `
      <h2 style="color: #ffcc00;">🎯 Mission Complete!</h2>
      <div style="font-size: 18px; margin: 20px 0;">
        <div>Final Score: <strong>${gameMode.score}</strong></div>
        <div>Asteroids Deflected: <strong>${gameMode.asteroidsDeflected}</strong></div>
        <div>Mission Time: <strong>${gameMode.missionTime}s</strong></div>
      </div>
      <div style="margin: 20px 0; color: #aaa;">
        ${gameMode.asteroidsDeflected === 0 ? 'Earth needs better defenders! Try deflecting some asteroids next time.' :
          gameMode.asteroidsDeflected < 3 ? 'Good start! Practice makes perfect in planetary defense.' :
          gameMode.asteroidsDeflected < 5 ? 'Excellent work! You\'re becoming a skilled planetary defender.' :
          'Outstanding! You\'re a true Earth defender! 🌍'}
      </div>
      <button onclick="this.parentElement.remove()" style="padding: 10px 20px; background: #ffcc00; color: #000; border: none; border-radius: 6px; cursor: pointer;">
        Continue Exploring
      </button>
    `;
    
    document.body.appendChild(finalScore);
    document.body.removeChild(gameOverlay);
  };
  
  // Enhanced deflection tracking
  const originalShowMetaAndReport = window.showMetaAndReport;
  window.showMetaAndReport = function(meta) {
    originalShowMetaAndReport(meta);
    
    if (gameMode.active) {
      // Monitor deflection slider changes
      const deltaVSlider = document.getElementById('deltaV');
      if (deltaVSlider) {
        const originalHandler = deltaVSlider.oninput;
        deltaVSlider.oninput = function() {
          if (originalHandler) originalHandler.call(this);
          
          if (parseFloat(this.value) > 0 && meta.energyMt) {
            const points = Math.round(meta.energyMt * 10);
            gameMode.score += points;
            gameMode.asteroidsDeflected++;
            
            document.getElementById('gameScore').textContent = gameMode.score;
            document.getElementById('gameDeflected').textContent = gameMode.asteroidsDeflected;
            
            // Visual feedback
            const feedback = document.createElement('div');
            feedback.style.cssText = `
              position: fixed; top: 100px; right: 20px; background: #44ff88; 
              color: #000; padding: 10px; border-radius: 6px; z-index: 102;
              font-weight: bold; animation: slideIn 0.5s ease;
            `;
            feedback.textContent = `+${points} points! Asteroid deflected!`;
            document.body.appendChild(feedback);
            
            setTimeout(() => {
              if (feedback.parentElement) {
                document.body.removeChild(feedback);
              }
            }, 2000);
          }
        };
      }
    }
  };
}

// =======================================================================================
// NEW DEFENSE SYSTEM INTEGRATION HELPERS
// =======================================================================================

/**
 * Update defense mission controls with new defense system parameters
 */
function updateDefenseMissionControls(defenseAnalysis) {
  const methodSelect = document.getElementById('mitigationMethod');
  const spacecraftMassInput = document.getElementById('spacecraftMass');
  const deltaVSlider = document.getElementById('deltaV');
  const deltaVValueEl = document.getElementById('deltaVValue');
  const missionDurationInput = document.getElementById('missionDuration');
  const yearsOutInput = document.getElementById('yearsOut');

  if (!defenseAnalysis || !defenseAnalysis.parameters) {
    console.warn('⚠️ Invalid defense analysis for control update');
    return;
  }

  const params = defenseAnalysis.parameters;
  
  console.log(`🔄 [CONTROLS RESET] Method: ${defenseAnalysis.method} | ΔV: ${params.deltaV}mm/s | Duration: ${params.missionDuration}y | Mass: ${params.spacecraftMass}kg`);

  // Temporarily disable event handlers to prevent circular updates
  const handlers = {
    method: methodSelect?.onchange,
    mass: spacecraftMassInput?.oninput,
    deltaV: deltaVSlider?.oninput,
    duration: missionDurationInput?.oninput,
    years: yearsOutInput?.oninput
  };

  // Clear handlers
  if (methodSelect) methodSelect.onchange = null;
  if (spacecraftMassInput) spacecraftMassInput.oninput = null;
  if (deltaVSlider) deltaVSlider.oninput = null;
  if (missionDurationInput) missionDurationInput.oninput = null;
  if (yearsOutInput) yearsOutInput.oninput = null;

  // Update values
  try {
    if (methodSelect) methodSelect.value = defenseAnalysis.method;
    if (spacecraftMassInput) spacecraftMassInput.value = params.spacecraftMass;
    if (deltaVSlider) deltaVSlider.value = params.deltaV;
    if (deltaVValueEl) deltaVValueEl.textContent = `${params.deltaV}mm/s`;
    if (missionDurationInput) missionDurationInput.value = params.missionDuration;
    if (yearsOutInput) yearsOutInput.value = params.yearsToImpact;

    // Trigger updates
    if (methodSelect) {
      const event = new Event('change', { bubbles: true });
      methodSelect.dispatchEvent(event);
    }
  } catch (error) {
    console.error('❌ Error updating defense controls:', error);
  }

  // Restore handlers after a short delay
  setTimeout(() => {
    if (methodSelect && handlers.method) methodSelect.onchange = handlers.method;
    if (spacecraftMassInput && handlers.mass) spacecraftMassInput.oninput = handlers.mass;
    if (deltaVSlider && handlers.deltaV) deltaVSlider.oninput = handlers.deltaV;
    if (missionDurationInput && handlers.duration) missionDurationInput.oninput = handlers.duration;
    if (yearsOutInput && handlers.years) yearsOutInput.oninput = handlers.years;
  }, 100);
}

/**
 * Create fallback defense analysis when new system is unavailable
 */
function createFallbackDefenseAnalysis(asteroidMass, yearsToImpact) {
  const massInBillions = asteroidMass / 1e9;
  
  // Simple fallback logic
  let method = 'kinetic';
  let spacecraftMass = 850;
  let deltaV = 15;
  let missionDuration = 2;
  
  if (massInBillions > 10000) {
    method = 'nuclear';
    spacecraftMass = 8000;
    deltaV = 200;
    missionDuration = 3;
  } else if (massInBillions > 1000) {
    method = 'nuclear';
    spacecraftMass = 6000;
    deltaV = 150;
    missionDuration = 2.5;
  } else if (massInBillions > 100) {
    method = 'mass_driver';
    spacecraftMass = 3500;
    deltaV = 80;
    missionDuration = 4;
  } else if (massInBillions > 10) {
    method = 'kinetic';
    spacecraftMass = 1500;
    deltaV = 25;
    missionDuration = 2;
  }
  
  return {
    method,
    score: 75,
    parameters: {
      spacecraftMass,
      deltaV,
      missionDuration,
      yearsToImpact,
      estimatedCost: 1000,
      developmentTime: 5,
      reliability: 0.8,
      complexity: 'medium'
    },
    classification: {
      category: massInBillions > 10000 ? 'ultra_massive' : 
                massInBillions > 1000 ? 'massive' : 
                massInBillions > 100 ? 'large' : 
                massInBillions > 10 ? 'medium' : 'small'
    }
  };
}

// Simple notification function for user feedback
function showNotification(message, duration = 3000) {
  // Remove any existing notification
  const existingNotification = document.getElementById('notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: #ffcc00;
    padding: 12px 20px;
    border-radius: 6px;
    border: 1px solid #ffcc00;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(255, 204, 0, 0.3);
  `;
  
  // Add slide-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (notification && notification.parentNode) {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}