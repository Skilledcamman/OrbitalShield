import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'CSS2DRenderer';

const API_BASE = 'https://api.nasa.gov/neo/rest/v1/neo/browse';

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

function calculateImpactMetrics(diameterKm, vRelKmPerSec) {
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
  return { kineticEnergyJ, energyMt, D_crater_km, Mw };
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

function calculateDeflection(deltaVMmPerSec, yearsToImpact, vRelKmPerSec) {
  if (!deltaVMmPerSec || deltaVMmPerSec <= 0) return { missDistanceKm: 0, missDistanceLD: 0 };
  const timeSec = yearsToImpact * 365.25 * 24 * 60 * 60;
  const deltaVKmPerSec = deltaVMmPerSec * 1e-6;
  const missDistanceKm = deltaVKmPerSec * timeSec * (vRelKmPerSec / EARTH_ORBITAL_VELOCITY);
  const LD_TO_KM = 384400;
  return { missDistanceKm, missDistanceLD: missDistanceKm / LD_TO_KM };
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
    const container = document.getElementById('canvas');
    container.innerHTML = '';
    const width = window.innerWidth;
    const height = window.innerHeight;
    let globalSizeMultiplier = 1;

    const scene = new THREE.Scene();
    
    // Create star map background
    const textureLoader = new THREE.TextureLoader();
    
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
      },
      undefined,
      function(error) {
        console.log('Star map not found, using black background:', error);
        scene.background = new THREE.Color(0x000000);
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
    
    // Adjust pixel ratio for GitHub Pages performance
    const isGitHubPages = window.location.hostname.includes('github.io');
    const pixelRatio = isGitHubPages ? Math.min(1.5, window.devicePixelRatio || 1) : (window.devicePixelRatio || 1);
    renderer.setPixelRatio(pixelRatio);
    
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
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x2266dd, roughness: 0.95, metalness: 0.05 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

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
              toggleControlsBtn.textContent = '−';
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
              toggleControlsBtn.textContent = '−';
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

    function showMetaAndReport(meta) {
      if (!meta || typeof meta.avgDiamKm !== 'number') {
        console.warn('[showMetaAndReport] Invalid meta:', meta);
        return;
      }
      const meters = (meta.avgDiamKm || 0) * 1000;
      const vRel = Number.isFinite(meta.vRelKmPerSec) ? meta.vRelKmPerSec : 0.0;
      const energyMt = meta.energyMt ?? calculateImpactMetrics(meta.avgDiamKm, vRel).energyMt;
      const Mw = meta.Mw ?? calculateImpactMetrics(meta.avgDiamKm, vRel).Mw;
      const D_crater = meta.D_crater_km ?? calculateImpactMetrics(meta.avgDiamKm, vRel).D_crater_km;
      const torino = meta.torinoScore ?? calculateTorinoProxy(energyMt);


      // 5 groups: [Summary, Impact, Approach, Observation, Orbit]
      const groups = [
        {
          title: 'Summary',
          html: `
            <div style="display:flex; justify-content:flex-start; align-items:center;">
              <div><strong>${meta.name || 'Unknown'}</strong></div>
            </div>
            <div style="color:#aaa; font-size:12px; margin-top:6px">ID: ${meta.id ?? 'Unknown'}</div>
            <div style="margin-top:6px;">Size: ${meta.avgDiamKm.toFixed(3)} km (${meters.toFixed(0)} m) &nbsp; | &nbsp; Velocity: ${vRel.toFixed(2)} km/s</div>
          `
        },
        {
          title: 'Impact',
          html: `
            <div style="margin-top:8px; color:#ffbbbb;"><strong>IMPACT (No mitigation):</strong></div>
            <div>Energy: ${Number(energyMt).toLocaleString(undefined, { maximumFractionDigits: 0 })} Mt TNT</div>
            <div>Seismic (est): Mw ≈ ${Mw.toFixed(1)}</div>
            <div>Crater (est): ${D_crater.toFixed(2)} km</div>
          `
        },
        {
          title: 'Approach',
          html: `
            <div>Hazardous: ${meta.hazardous ? 'Yes' : 'No'}</div>
            <div>Next approach Date: ${meta.nextApproach}</div>
            <div>Miss Distance: ${meta.missKm ? Number(meta.missKm).toLocaleString() + ' km' : 'Unknown'}</div>
          `
        },
        {
          title: 'Observation',
          html: `
            <div style="margin-top:8px; color:#ccc;"><strong>Observation Period:</strong></div>
            <div>First Observation: ${meta.firstObservation || 'Unknown'}</div>
            <div>Last Observation: ${meta.lastObservation || 'Unknown'}</div>
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
        const deltaVMm = parseFloat(deltaVSlider.value);
        const years = parseFloat(yearsOutInput.value) || 1;
        deltaVValueEl.innerText = `${deltaVMm.toFixed(1)} mm/s`;
        const res = calculateDeflection(deltaVMm, years, vRel);
        mitigationResultEl.innerHTML = `Resulting Miss Distance: <span style="color:#44ff88">${Math.round(res.missDistanceKm).toLocaleString()} km</span> (${res.missDistanceLD.toFixed(2)} LD)`;
      }
      deltaVSlider.oninput = updateMitigation;
      yearsOutInput.oninput = updateMitigation;
      updateMitigation();
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
      
      const dt = clock.getDelta();
      
      // Smooth but performance-friendly rotation animation
      astGroup.rotation.y += 0.001 * (dt * 60); // Reduced from 0.0015 for smoother performance
      
      // Optimized asteroid animations for GitHub Pages performance
      const time = performance.now() * 0.0002; // Reduced frequency
      let updateCount = 0;
      const maxUpdatesPerFrame = Math.max(5, Math.floor(astGroup.children.length / 10)); // Limit updates per frame
      
      astGroup.children.forEach((m, index) => {
        if (updateCount >= maxUpdatesPerFrame) return; // Skip if we've updated enough this frame
        
        if (m.userData && m.userData.rotationSpeed) {
          const s = m.userData.rotationSpeed * 0.7; // Slightly slower for smoother performance
          m.rotation.y += s * dt;
          
          // Only update expensive sin calculations for a subset each frame
          if (index % 5 === Math.floor(time) % 5) { // Cycle through different asteroids
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
  autoFetchAsteroids();

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
            toggleControlsBtn.textContent = '−';
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