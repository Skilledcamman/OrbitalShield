// Scenario Simulation Module
// This module provides pre-defined and custom asteroid impact scenarios

class ScenarioSystem {
  constructor() {
    this.currentScenario = null;
    this.scenarios = this.initializeScenarios();
    this.isActive = false;
  }

  initializeScenarios() {
    return {
      'apophis-2029': {
        name: '99942 Apophis - 2029 Flyby',
        description: 'Historical close approach of Apophis asteroid in April 2029',
        type: 'historical',
        asteroid: {
          name: '99942 Apophis',
          diameter: 0.37, // km
          velocity: 7.42, // km/s relative velocity during flyby
          missDistance: 31000, // km from Earth's surface
          date: '2029-04-13',
          energy: 1151, // Mt TNT if it hit
          classification: 'Aten'
        },
        story: `
          <h3>🌍 The Great Apophis Encounter of 2029</h3>
          <p>On April 13, 2029, asteroid 99942 Apophis will make one of the closest approaches of a large asteroid in recorded history. This 370-meter space rock will pass just 31,000 km from Earth's surface - closer than our geostationary satellites!</p>
          <p><strong>What if it hit?</strong> With 1,151 Mt of kinetic energy, Apophis would create a crater 6 km wide and cause magnitude 7+ earthquakes felt across continents.</p>
          <p>Fortunately, precise orbital calculations confirm it will safely pass by, giving us an unprecedented opportunity to study a large asteroid up close.</p>
        `,
        impactLocation: { lat: 35.7, lng: 139.7 }, // Near Tokyo for demonstration
        mitigationOptions: true
      },
      
      'tunguska-modern': {
        name: 'Modern Tunguska Event',
        description: 'What if the 1908 Tunguska event happened today over a major city?',
        type: 'what-if',
        asteroid: {
          name: 'Tunguska-2025',
          diameter: 0.06, // 60 meters
          velocity: 27.0, // km/s
          missDistance: 0, // Impact
          date: '2025-10-15',
          energy: 10, // Mt TNT
          classification: 'Apollo'
        },
        story: `
          <h3>💥 Tunguska 2025: Urban Impact Scenario</h3>
          <p>In 1908, a 60-meter asteroid exploded over the remote Siberian forest, flattening 2,000 square kilometers of trees. But what if a similar object struck a modern metropolitan area?</p>
          <p><strong>The Scenario:</strong> A Tunguska-class asteroid approaches Earth undetected until the final hours. With only 10 Mt of energy, it's "small" by cosmic standards, but devastating for any urban area.</p>
          <p><strong>Impact Effects:</strong> Complete destruction within 15 km, severe damage to 50 km, broken windows and minor injuries to 100 km radius.</p>
          <p>This scenario demonstrates why even "small" asteroids require serious attention from planetary defense systems.</p>
        `,
        impactLocation: { lat: 40.7, lng: -74.0 }, // NYC
        mitigationOptions: true
      },

      'extinction-event': {
        name: 'Extinction-Level Asteroid',
        description: 'A massive asteroid similar to the one that ended the age of dinosaurs',
        type: 'catastrophic',
        asteroid: {
          name: 'Chicxulub-2025',
          diameter: 10.0, // 10 km
          velocity: 20.0, // km/s
          missDistance: 0, // Impact
          date: '2025-12-25',
          energy: 100000000, // 100 million Mt TNT
          classification: 'Apollo'
        },
        story: `
          <h3>🦕 The Ultimate Planetary Defense Challenge</h3>
          <p>66 million years ago, a 10-km asteroid struck Earth near what is now Mexico's Yucatan Peninsula, ending the reign of the dinosaurs. What if humanity faced such a threat today?</p>
          <p><strong>Global Catastrophe:</strong> Impact energy equivalent to 100 million nuclear bombs. Immediate destruction across thousands of kilometers, global fires, acid rain, and a "nuclear winter" lasting years.</p>
          <p><strong>Civilization at Stake:</strong> This is the ultimate test of planetary defense technology. Only the most advanced deflection missions, launched decades in advance, could prevent human extinction.</p>
          <p>Can you save civilization? Explore the extreme deflection strategies needed for humanity's survival.</p>
        `,
        impactLocation: { lat: 21.0, lng: -89.0 }, // Yucatan Peninsula
        mitigationOptions: true
      },

      'city-killer': {
        name: 'City-Killer Asteroid',
        description: 'A 300-meter asteroid threatening a major metropolitan area',
        type: 'regional-threat',
        asteroid: {
          name: 'Urban-Threat-1',
          diameter: 0.3, // 300 meters
          velocity: 18.0, // km/s
          missDistance: 0, // Impact
          date: '2026-03-15',
          energy: 2000, // Mt TNT
          classification: 'Apollo'
        },
        story: `
          <h3>🏙️ The City-Killer Scenario</h3>
          <p>A 300-meter asteroid - about the size of the Eiffel Tower - is on a collision course with Earth. This is the type of object that planetary defense systems are specifically designed to handle.</p>
          <p><strong>Regional Devastation:</strong> With 2,000 Mt of kinetic energy, this asteroid would obliterate any city and cause severe damage across an entire metropolitan region.</p>
          <p><strong>Detection Window:</strong> Unlike smaller objects, this asteroid would be detected years in advance, providing time for deflection missions.</p>
          <p>This scenario tests your ability to coordinate international efforts and deploy kinetic impactors or gravity tractors to save millions of lives.</p>
        `,
        impactLocation: { lat: 51.5, lng: -0.1 }, // London
        mitigationOptions: true
      },

      'asteroid-shower': {
        name: 'Fragmented Asteroid Shower',
        description: 'A large asteroid breaks apart, creating multiple impact threats',
        type: 'complex',
        asteroid: {
          name: 'Fragment-Alpha',
          diameter: 0.15, // Main fragment: 150 meters
          velocity: 22.0, // km/s
          missDistance: 0, // Impact
          date: '2027-08-08',
          energy: 400, // Mt TNT for main fragment
          classification: 'Apollo'
        },
        story: `
          <h3>🌠 The Fragmentation Crisis</h3>
          <p>A 500-meter asteroid breaks apart in space, creating multiple fragments on impact trajectories. The largest fragment alone carries 400 Mt of destructive energy.</p>
          <p><strong>Multiple Threats:</strong> Instead of one impact, Earth faces several smaller but still dangerous impacts scattered across different regions and timeframes.</p>
          <p><strong>Coordination Challenge:</strong> This scenario requires coordinating multiple deflection missions simultaneously while managing global evacuation efforts.</p>
          <p>Can you handle the complexity of defending against multiple threats with limited resources?</p>
        `,
        impactLocation: { lat: 35.7, lng: 139.7 }, // Tokyo for main fragment
        fragments: [
          { lat: 40.7, lng: -74.0, energy: 100 }, // NYC
          { lat: 51.5, lng: -0.1, energy: 50 },   // London
          { lat: -23.6, lng: -46.6, energy: 25 }  // São Paulo
        ],
        mitigationOptions: true
      }
    };
  }

  show() {
    const overlay = document.createElement('div');
    overlay.id = 'scenarioOverlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.95); z-index: 3000; display: flex; 
      align-items: center; justify-content: center; color: #fff;
      font-family: Arial, sans-serif; overflow-y: auto;
    `;
    
    overlay.innerHTML = `
      <div style="max-width: 900px; width: 90%; max-height: 90%; padding: 30px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 15px; margin: 20px; overflow-y: auto; position: relative;">
        <button id="closeScenarios" style="position: absolute; top: 15px; right: 15px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 18px;">✕</button>
        
        <h2 style="text-align: center; color: #ffcc00; margin-bottom: 30px; font-size: 2.2em;">🎭 Asteroid Impact Scenarios</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 30px;">
          ${Object.entries(this.scenarios).map(([key, scenario]) => `
            <div class="scenario-card" data-scenario="${key}" style="
              background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
              border: 2px solid ${this.getScenarioColor(scenario.type)};
              border-radius: 12px; padding: 20px; cursor: pointer;
              transition: all 0.3s ease; position: relative; overflow: hidden;
            ">
              <div style="position: absolute; top: 10px; right: 10px; background: ${this.getScenarioColor(scenario.type)}; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                ${scenario.type.toUpperCase()}
              </div>
              
              <h3 style="color: ${this.getScenarioColor(scenario.type)}; margin: 0 0 10px 0; font-size: 1.3em;">
                ${this.getScenarioIcon(scenario.type)} ${scenario.name}
              </h3>
              
              <p style="color: #ccc; margin: 0 0 15px 0; font-size: 14px; line-height: 1.4;">
                ${scenario.description}
              </p>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; color: #aaa;">
                <div><strong>Diameter:</strong> ${scenario.asteroid.diameter} km</div>
                <div><strong>Velocity:</strong> ${scenario.asteroid.velocity} km/s</div>
                <div><strong>Energy:</strong> ${scenario.asteroid.energy.toLocaleString()} Mt</div>
                <div><strong>Date:</strong> ${scenario.asteroid.date}</div>
              </div>
              
              <div style="margin-top: 15px; text-align: center;">
                <button class="run-scenario" data-scenario="${key}" style="
                  background: linear-gradient(45deg, ${this.getScenarioColor(scenario.type)}, ${this.darkenColor(this.getScenarioColor(scenario.type))});
                  color: #000; border: none; border-radius: 6px; padding: 10px 20px;
                  font-weight: bold; cursor: pointer; transition: transform 0.2s ease;
                ">
                  🚀 Run Scenario
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="text-align: center; padding: 20px; border-top: 1px solid #444;">
          <h3 style="color: #ffcc00; margin-bottom: 15px;">🛠️ Custom Scenario Builder</h3>
          <p style="color: #aaa; margin-bottom: 20px;">Create your own asteroid impact scenario with custom parameters</p>
          <button id="customScenario" style="
            background: linear-gradient(45deg, #ffcc00, #ff8800);
            color: #000; border: none; border-radius: 8px; padding: 12px 25px;
            font-weight: bold; cursor: pointer; font-size: 16px;
          ">
            ⚡ Build Custom Scenario
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add event listeners
    document.getElementById('closeScenarios').onclick = () => this.hide();
    
    overlay.onclick = (e) => {
      if (e.target === overlay) this.hide();
    };
    
    // Scenario card hover effects
    const cards = overlay.querySelectorAll('.scenario-card');
    cards.forEach(card => {
      card.onmouseenter = () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = `0 10px 25px rgba(${this.hexToRgb(this.getScenarioColor(card.querySelector('h3').textContent.includes('Apophis') ? 'historical' : 'what-if'))}, 0.3)`;
      };
      card.onmouseleave = () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      };
    });
    
    // Run scenario buttons
    const runButtons = overlay.querySelectorAll('.run-scenario');
    runButtons.forEach(button => {
      button.onclick = (e) => {
        e.stopPropagation();
        const scenarioKey = button.getAttribute('data-scenario');
        this.runScenario(scenarioKey);
      };
      
      button.onmouseenter = () => {
        button.style.transform = 'scale(1.05)';
      };
      button.onmouseleave = () => {
        button.style.transform = 'scale(1)';
      };
    });
    
    // Custom scenario builder
    document.getElementById('customScenario').onclick = () => {
      this.showCustomScenarioBuilder();
    };
  }

  hide() {
    const overlay = document.getElementById('scenarioOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(0.95)';
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    }
  }

  getScenarioColor(type) {
    const colors = {
      'historical': '#4CAF50',
      'what-if': '#FF9800',
      'catastrophic': '#F44336',
      'regional-threat': '#FF5722',
      'complex': '#9C27B0'
    };
    return colors[type] || '#2196F3';
  }

  getScenarioIcon(type) {
    const icons = {
      'historical': '📚',
      'what-if': '🤔',
      'catastrophic': '💀',
      'regional-threat': '🏙️',
      'complex': '🌠'
    };
    return icons[type] || '🌍';
  }

  darkenColor(color) {
    // Simple color darkening function
    const amount = 40;
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, (num >> 8 & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return "#" + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '255, 255, 255';
  }

  runScenario(scenarioKey) {
    const scenario = this.scenarios[scenarioKey];
    if (!scenario) return;

    this.currentScenario = scenario;
    this.isActive = true;
    this.hide();

    // Show scenario story overlay
    this.showScenarioStory(scenario);
  }

  showScenarioStory(scenario) {
    const storyOverlay = document.createElement('div');
    storyOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.95); z-index: 3500; display: flex; 
      align-items: center; justify-content: center; color: #fff;
      font-family: Arial, sans-serif;
    `;
    
    storyOverlay.innerHTML = `
      <div style="max-width: 800px; width: 90%; padding: 40px; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%); border-radius: 15px; margin: 20px; position: relative; border: 2px solid ${this.getScenarioColor(scenario.type)};">
        ${scenario.story}
        
        <div style="margin: 30px 0; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 8px; border-left: 4px solid ${this.getScenarioColor(scenario.type)};">
          <h4 style="margin: 0 0 10px 0; color: ${this.getScenarioColor(scenario.type)};">📊 Scenario Parameters</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 14px;">
            <div><strong>Asteroid:</strong> ${scenario.asteroid.name}</div>
            <div><strong>Diameter:</strong> ${scenario.asteroid.diameter} km</div>
            <div><strong>Velocity:</strong> ${scenario.asteroid.velocity} km/s</div>
            <div><strong>Impact Energy:</strong> ${scenario.asteroid.energy.toLocaleString()} Mt TNT</div>
            <div><strong>Date:</strong> ${scenario.asteroid.date}</div>
            <div><strong>Classification:</strong> ${scenario.asteroid.classification}</div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <button id="startScenario" style="
            background: linear-gradient(45deg, ${this.getScenarioColor(scenario.type)}, ${this.darkenColor(this.getScenarioColor(scenario.type))});
            color: #000; border: none; border-radius: 8px; padding: 15px 30px;
            font-weight: bold; cursor: pointer; font-size: 18px; margin: 0 10px;
          ">
            🎯 Start Simulation
          </button>
          <button id="backToScenarios" style="
            background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.3);
            border-radius: 8px; padding: 15px 30px; cursor: pointer; font-size: 18px; margin: 0 10px;
          ">
            ← Back to Scenarios
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(storyOverlay);
    
    document.getElementById('startScenario').onclick = () => {
      this.activateScenario(scenario);
      document.body.removeChild(storyOverlay);
    };
    
    document.getElementById('backToScenarios').onclick = () => {
      document.body.removeChild(storyOverlay);
      this.show();
    };
  }

  activateScenario(scenario) {
    // Set the impact location
    const latInput = document.getElementById('impactLat');
    const lngInput = document.getElementById('impactLng');
    if (latInput && lngInput) {
      latInput.value = scenario.impactLocation.lat;
      lngInput.value = scenario.impactLocation.lng;
    }

    // Create a virtual asteroid with scenario parameters
    const virtualAsteroid = {
      id: `scenario-${Date.now()}`,
      name: scenario.asteroid.name,
      designation: scenario.asteroid.name,
      avgDiamKm: scenario.asteroid.diameter,
      vRelKmPerSec: scenario.asteroid.velocity,
      energyMt: scenario.asteroid.energy,
      hazardous: scenario.asteroid.energy > 100,
      nextApproach: scenario.asteroid.date,
      missKm: scenario.asteroid.missDistance,
      // Add orbital data for completeness
      firstObservation: '2025-01-01',
      lastObservation: '2025-10-01',
      semiMajorAxis: '1.5',
      eccentricity: '0.2',
      inclination: '15',
      perihelion_distance: '1.0',
      aphelion_distance: '2.0'
    };

    // Show scenario status
    const scenarioStatus = document.createElement('div');
    scenarioStatus.id = 'scenarioStatus';
    scenarioStatus.style.cssText = `
      position: fixed; top: 80px; right: 20px; width: 300px; 
      background: rgba(0,0,0,0.9); border: 2px solid ${this.getScenarioColor(scenario.type)}; 
      border-radius: 8px; padding: 15px; color: #fff; z-index: 100;
      font-family: Arial, sans-serif;
    `;
    
    scenarioStatus.innerHTML = `
      <h4 style="margin: 0 0 10px 0; color: ${this.getScenarioColor(scenario.type)};">
        🎭 SCENARIO MODE: ${scenario.name}
      </h4>
      <div style="font-size: 12px; color: #aaa; margin-bottom: 10px;">
        ${scenario.description}
      </div>
      <div style="margin-top: 10px;">
        <button id="endScenario" style="padding: 5px 10px; background: #ff4444; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">
          End Scenario
        </button>
        <button id="showImpactMapScenario" style="padding: 5px 10px; background: #ffcc00; color: #000; border: none; border-radius: 4px; cursor: pointer;">
          Impact Map
        </button>
      </div>
    `;
    
    document.body.appendChild(scenarioStatus);
    
    // Event handlers for scenario controls
    document.getElementById('endScenario').onclick = () => {
      this.endScenario();
    };
    
    document.getElementById('showImpactMapScenario').onclick = () => {
      if (window.impactZoneMap) {
        window.impactZoneMap.show(virtualAsteroid);
      }
    };

    // Automatically show the asteroid report
    if (window.showMetaAndReport) {
      window.showMetaAndReport(virtualAsteroid);
    }

    // Handle fragments if this is a fragmented asteroid scenario
    if (scenario.fragments) {
      setTimeout(() => {
        this.showFragmentDialog(scenario);
      }, 2000);
    }
  }

  showFragmentDialog(scenario) {
    const fragmentDialog = document.createElement('div');
    fragmentDialog.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.95); border: 2px solid #ff4444; border-radius: 12px;
      padding: 20px; color: #fff; z-index: 4000; max-width: 500px; text-align: center;
    `;
    
    fragmentDialog.innerHTML = `
      <h3 style="color: #ffcc00;">🚨 ALERT: ASTEROID FRAGMENTATION DETECTED</h3>
      <p>The asteroid has broken apart! Multiple fragments are now on impact trajectories:</p>
      <div style="text-align: left; margin: 15px 0;">
        ${scenario.fragments.map((frag, i) => `
          <div style="margin: 5px 0; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px;">
            Fragment ${i + 1}: ${frag.energy} Mt impact near ${frag.lat.toFixed(1)}°, ${frag.lng.toFixed(1)}°
          </div>
        `).join('')}
      </div>
      <p style="color: #ffcc00;"><strong>This complicates your deflection mission significantly!</strong></p>
      <button onclick="this.parentElement.remove()" style="
        background: #ffcc00; color: #000; border: none; border-radius: 6px; padding: 10px 20px;
        font-weight: bold; cursor: pointer; margin-top: 10px;
      ">
        Acknowledge
      </button>
    `;
    
    document.body.appendChild(fragmentDialog);
    
    setTimeout(() => {
      if (fragmentDialog.parentElement) {
        fragmentDialog.remove();
      }
    }, 10000);
  }

  endScenario() {
    this.currentScenario = null;
    this.isActive = false;
    
    const scenarioStatus = document.getElementById('scenarioStatus');
    if (scenarioStatus) {
      scenarioStatus.remove();
    }
    
    // Reset impact location inputs
    const latInput = document.getElementById('impactLat');
    const lngInput = document.getElementById('impactLng');
    if (latInput) latInput.value = '';
    if (lngInput) lngInput.value = '';
    
    // Show completion message
    const completionMsg = document.createElement('div');
    completionMsg.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(0, 100, 0, 0.95); border: 2px solid #44ff88; border-radius: 12px;
      padding: 30px; color: #fff; z-index: 4000; text-align: center; max-width: 400px;
    `;
    
    completionMsg.innerHTML = `
      <h3 style="color: #44ff88;">✅ Scenario Complete</h3>
      <p>You've finished exploring this asteroid impact scenario. The simulation has been reset.</p>
      <button onclick="this.parentElement.remove()" style="
        background: #44ff88; color: #000; border: none; border-radius: 6px; padding: 10px 20px;
        font-weight: bold; cursor: pointer; margin-top: 15px;
      ">
        Continue Exploring
      </button>
    `;
    
    document.body.appendChild(completionMsg);
    
    setTimeout(() => {
      if (completionMsg.parentElement) {
        completionMsg.remove();
      }
    }, 5000);
  }

  showCustomScenarioBuilder() {
    // Implementation for custom scenario builder
    const builderOverlay = document.createElement('div');
    builderOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.95); z-index: 3500; display: flex; 
      align-items: center; justify-content: center; color: #fff;
      font-family: Arial, sans-serif;
    `;
    
    builderOverlay.innerHTML = `
      <div style="max-width: 600px; width: 90%; padding: 30px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 15px; margin: 20px;">
        <h3 style="color: #ffcc00; text-align: center; margin-bottom: 20px;">🛠️ Custom Scenario Builder</h3>
        <p style="text-align: center; color: #aaa; margin-bottom: 30px;">Create your own asteroid impact scenario</p>
        
        <div style="display: grid; gap: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; color: #ccc;">Asteroid Name:</label>
            <input id="customName" type="text" value="Custom Asteroid" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: #fff;">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label style="display: block; margin-bottom: 5px; color: #ccc;">Diameter (km):</label>
              <input id="customDiameter" type="number" value="1.0" step="0.1" min="0.01" max="50" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: #fff;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; color: #ccc;">Velocity (km/s):</label>
              <input id="customVelocity" type="number" value="20" step="1" min="5" max="70" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: #fff;">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label style="display: block; margin-bottom: 5px; color: #ccc;">Impact Latitude:</label>
              <input id="customLat" type="number" value="40.7" step="0.1" min="-90" max="90" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: #fff;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; color: #ccc;">Impact Longitude:</label>
              <input id="customLng" type="number" value="-74.0" step="0.1" min="-180" max="180" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: #fff;">
            </div>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 5px; color: #ccc;">Description:</label>
            <textarea id="customDescription" style="width: 100%; height: 80px; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: #fff; resize: vertical;">A custom asteroid impact scenario</textarea>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <button id="createCustomScenario" style="
            background: linear-gradient(45deg, #ffcc00, #ff8800);
            color: #000; border: none; border-radius: 8px; padding: 12px 25px;
            font-weight: bold; cursor: pointer; font-size: 16px; margin: 0 10px;
          ">
            🚀 Create & Run Scenario
          </button>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.3);
            border-radius: 8px; padding: 12px 25px; cursor: pointer; font-size: 16px; margin: 0 10px;
          ">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(builderOverlay);
    
    document.getElementById('createCustomScenario').onclick = () => {
      const name = document.getElementById('customName').value;
      const diameter = parseFloat(document.getElementById('customDiameter').value);
      const velocity = parseFloat(document.getElementById('customVelocity').value);
      const lat = parseFloat(document.getElementById('customLat').value);
      const lng = parseFloat(document.getElementById('customLng').value);
      const description = document.getElementById('customDescription').value;
      
      // Calculate energy based on diameter and velocity
      const massKg = 3000 * (4/3) * Math.PI * Math.pow((diameter * 500), 3); // Simplified
      const energy = 0.5 * massKg * Math.pow(velocity * 1000, 2) / 4.184e15; // Mt TNT
      
      const customScenario = {
        name: name,
        description: description,
        type: 'custom',
        asteroid: {
          name: name,
          diameter: diameter,
          velocity: velocity,
          missDistance: 0,
          date: '2025-12-01',
          energy: energy,
          classification: 'Custom'
        },
        story: `
          <h3>🎯 Custom Impact Scenario: ${name}</h3>
          <p>${description}</p>
          <p><strong>Custom Parameters:</strong> You've created a scenario with a ${diameter} km asteroid traveling at ${velocity} km/s, carrying approximately ${Math.round(energy).toLocaleString()} Mt of kinetic energy.</p>
          <p>This scenario will help you understand the relationship between asteroid size, velocity, and impact effects.</p>
        `,
        impactLocation: { lat: lat, lng: lng },
        mitigationOptions: true
      };
      
      document.body.removeChild(builderOverlay);
      this.runCustomScenario(customScenario);
    };
  }

  runCustomScenario(scenario) {
    this.currentScenario = scenario;
    this.isActive = true;
    this.showScenarioStory(scenario);
  }
}

// Global instance
window.ScenarioSystem = ScenarioSystem;
window.scenarioSystem = new ScenarioSystem();

// Add CSS for scenario animations
const scenarioStyles = document.createElement('style');
scenarioStyles.textContent = `
  #scenarioOverlay {
    animation: scenarioFadeIn 0.4s ease;
  }
  
  @keyframes scenarioFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .scenario-card:hover {
    transform: translateY(-5px) !important;
    transition: all 0.3s ease;
  }
  
  .run-scenario:hover {
    transform: scale(1.05) !important;
    transition: transform 0.2s ease;
  }
`;
document.head.appendChild(scenarioStyles);