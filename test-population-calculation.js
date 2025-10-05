/**
 * Test script for validating the enhanced population at risk calculations
 * This script can be run in the browser console to verify accuracy
 */

function testPopulationCalculations() {
  console.log('🧪 Testing Enhanced Casualty Calculations (Killed/Injured/Displaced)');
  console.log('='.repeat(70));
  
  if (!window.impactZoneMap) {
    console.error('❌ Impact zone map not available');
    return;
  }

  const testScenarios = [
    {
      name: 'New York City Impact (Large Asteroid)',
      lat: 40.7,
      lng: -74.0,
      radius: 200,
      expectedRange: [2000000, 8000000], // 2-8 million casualties (more realistic)
      description: 'Major metropolitan area with high density'
    },
    {
      name: 'Tokyo Impact (Medium Asteroid)', 
      lat: 35.7,
      lng: 139.7,
      radius: 150,
      expectedRange: [3000000, 12000000], // 3-12 million casualties
      description: 'Highest density metropolitan area globally'
    },
    {
      name: 'Sahara Desert Impact',
      lat: 23.0,
      lng: 5.0,
      radius: 500,
      expectedRange: [0, 200000], // Very low casualties
      description: 'Remote desert area with minimal population'
    },
    {
      name: 'Mumbai Impact (Small Asteroid)',
      lat: 19.1,
      lng: 72.9,
      radius: 100,
      expectedRange: [1500000, 6000000], // 1.5-6 million casualties
      description: 'Extremely dense urban area'
    },
    {
      name: 'Pacific Ocean Impact',
      lat: 0.0,
      lng: -150.0,
      radius: 300,
      expectedRange: [0, 10000], // Minimal casualties
      description: 'Remote ocean location'
    },
    {
      name: 'Rural Australia Impact',
      lat: -25.0,
      lng: 135.0,
      radius: 400,
      expectedRange: [0, 100000], // Low rural casualties
      description: 'Remote continental interior'
    },
    {
      name: 'Small City Impact (Realistic Test)',
      lat: 51.5, // London
      lng: -0.1,
      radius: 50, // Small impact zone
      expectedRange: [200000, 1500000], // 200k-1.5M casualties for 50km radius
      description: 'Testing smaller impact zones for realism'
    }
  ];

  let passedTests = 0;
  let totalTests = testScenarios.length;

  testScenarios.forEach((scenario, index) => {
    console.log(`\n🎯 Test ${index + 1}: ${scenario.name}`);
    console.log(`📍 Location: ${scenario.lat}°, ${scenario.lng}°`);
    console.log(`📏 Radius: ${scenario.radius} km`);
    console.log(`📝 ${scenario.description}`);
    
    try {
      // Run the calculation
      const populationAtRisk = window.impactZoneMap.estimatePopulationAtRisk(
        scenario.lat, 
        scenario.lng, 
        scenario.radius
      );

      // Get validation data
      const validation = window.impactZoneMap.validatePopulationCalculation(
        scenario.lat,
        scenario.lng, 
        scenario.radius
      );

      console.log(`👥 Total casualties: ${populationAtRisk.toLocaleString()}`);
      console.log(`🏙️ Urban casualties: ${validation.urbanPopulation.toLocaleString()}`);
      console.log(`🏘️ Rural casualties: ${validation.ruralPopulation.toLocaleString()}`);
      console.log(`🏢 Cities affected: ${validation.citiesInRange}`);

      // Check if result is within expected range
      const isInRange = populationAtRisk >= scenario.expectedRange[0] && 
                       populationAtRisk <= scenario.expectedRange[1];
      
      if (isInRange) {
        console.log(`✅ PASS - Result within expected range [${scenario.expectedRange[0].toLocaleString()} - ${scenario.expectedRange[1].toLocaleString()}]`);
        passedTests++;
      } else {
        console.log(`❌ FAIL - Result outside expected range [${scenario.expectedRange[0].toLocaleString()} - ${scenario.expectedRange[1].toLocaleString()}]`);
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.log(`⚠️ Warnings:`, validation.warnings);
      }

      // Show largest affected city
      if (validation.largestCity) {
        console.log(`🌆 Largest affected city: ${validation.largestCity.name} (${validation.largestCity.atRisk.toLocaleString()} casualties)`);
      }

    } catch (error) {
      console.error(`❌ ERROR in test: ${error.message}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Casualty calculation is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Review calculations and expected ranges.');
  }

  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  };
}

// Additional helper function to test specific coordinates
function testSpecificLocation(lat, lng, radius = 200) {
  console.log(`🎯 Testing specific location: ${lat}°, ${lng}° (${radius}km radius)`);
  
  if (!window.impactZoneMap) {
    console.error('❌ Impact zone map not available');
    return;
  }

  const populationAtRisk = window.impactZoneMap.estimatePopulationAtRisk(lat, lng, radius);
  const validation = window.impactZoneMap.validatePopulationCalculation(lat, lng, radius);

  console.log(`👥 Total casualties: ${populationAtRisk.toLocaleString()}`);
  console.log(`🏙️ Urban: ${validation.urbanPopulation.toLocaleString()}`);
  console.log(`🏘️ Rural: ${validation.ruralPopulation.toLocaleString()}`);
  console.log(`🏢 Cities affected: ${validation.citiesInRange}`);
  
  if (validation.warnings.length > 0) {
    console.log(`⚠️ Warnings:`, validation.warnings);
  }

  return validation;
}

// Make functions globally available
window.testPopulationCalculations = testPopulationCalculations;
window.testSpecificLocation = testSpecificLocation;

console.log('🧪 Casualty calculation test functions loaded:');
console.log('  testPopulationCalculations() - Run full test suite');
console.log('  testSpecificLocation(lat, lng, radius) - Test specific coordinates');