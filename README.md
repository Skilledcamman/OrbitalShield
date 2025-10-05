# 🛡️ OrbitalShield

**Real-time Near-Earth Asteroid Tracking and Impact Assessment System**

OrbitalShield is an advanced web-based application that provides real-time visualization and analysis of Near-Earth Asteroids (NEAs) using NASA's NeoWS API. The system combines cutting-edge 3D visualization with comprehensive impact assessment tools and planetary defense strategies.

![OrbitalShield Interface](https://img.shields.io/badge/Status-Active-brightgreen) ![Three.js](https://img.shields.io/badge/Three.js-0.150.1-blue) ![NASA API](https://img.shields.io/badge/NASA-NeoWS_API-orange)

## 🌟 Features

### 🌍 3D Visualization
- **Interactive Earth Model**: High-resolution 3D Earth with realistic textures
- **Real-time Asteroid Tracking**: Live visualization of Near-Earth Asteroids from NASA data
- **Orbital Mechanics**: Accurate asteroid trajectory visualization with orbital parameters
- **Dynamic Camera Controls**: Free-roam camera with zoom, pan, and rotation capabilities

### 📊 Impact Assessment
- **Impact Zone Analysis**: Detailed analysis of potential impact zones with geographical data
- **Risk Assessment**: Comprehensive threat evaluation based on asteroid characteristics
- **Damage Modeling**: Kinetic energy calculations and impact crater predictions
- **Population Impact**: Assessment of affected populations and infrastructure

### 🛡️ Defense Systems
- **Kinetic Impactor Analysis**: DART-style mission planning and effectiveness calculations
- **Gravity Tractor Modeling**: Long-term deflection strategy analysis
- **Nuclear Option Evaluation**: Last-resort deflection method assessment
- **Mission Optimization**: Cost-benefit analysis for different defense strategies

### 🎯 Scenario Simulation
- **Historical Events**: Recreation of past close approaches (e.g., Apophis 2029)
- **Custom Scenarios**: User-defined impact scenarios with adjustable parameters
- **What-if Analysis**: Explore different deflection timing and methods
- **Educational Simulations**: Interactive learning experiences about planetary defense

### 📡 Data Integration
- **NASA NeoWS API**: Real-time asteroid data from NASA's Near-Earth Object Web Service
- **USGS Integration**: Earthquake data and elevation models for impact analysis
- **Astronomical Data**: Comprehensive orbital mechanics and asteroid characteristics

## 🚀 Getting Started

### Prerequisites
- Modern web browser with WebGL support
- NASA API key (free registration required)
- Internet connection for real-time data

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd OrbitalShield
   ```

2. **Configure API Access**
   - Get your free NASA API key from [NASA Open Data Portal](https://api.nasa.gov/)
   - Open the `.env` file and add your API key:
   ```
   NASA_API_KEY=your_api_key_here
   ```

3. **Launch the Application**
   - Open `index.html` in a modern web browser
   - Or serve through a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

4. **Access the Application**
   - Navigate to `http://localhost:8000` (if using local server)
   - Or open `index.html` directly in your browser

## 🎮 How to Use

### Basic Navigation
1. **Loading**: The application loads asteroid data and initializes the 3D environment
2. **Entry Screen**: Scroll down from the welcome screen to enter the main interface
3. **3D Controls**: 
   - **Left Mouse**: Rotate camera around Earth
   - **Mouse Wheel**: Zoom in/out
   - **Right Mouse**: Pan view

### Asteroid Analysis
1. **Select Asteroid Count**: Use the slider to choose how many asteroids to display (1-200)
2. **Asteroid Selection**: Click on any asteroid to view detailed information
3. **Data Panel**: View asteroid characteristics, orbital parameters, and threat assessment
4. **Impact Assessment**: Set custom impact coordinates to analyze potential damage

### Defense System Analysis
1. **Open Defense Panel**: Click to expand the planetary defense section
2. **Method Selection**: Choose from kinetic impactor, gravity tractor, or nuclear options
3. **Mission Parameters**: Adjust warning time, spacecraft mass, and mission duration
4. **Optimization**: View cost-effectiveness and success probability calculations

### Scenario Exploration
1. **Scenario Menu**: Access pre-defined scenarios or create custom ones
2. **Historical Events**: Explore past close approaches like Apophis 2029
3. **Custom Scenarios**: Set your own asteroid parameters and impact locations
4. **Impact Simulation**: Run detailed simulations with geological and population data

## 📁 File Structure

```
OrbitalShield/
├── index.html              # Main application HTML
├── main.js                 # Core application logic and NASA API integration
├── style.css               # Application styling and responsive design
├── defense-system.js       # Planetary defense analysis system
├── impact-map.js          # Impact zone visualization and analysis
├── scenarios.js           # Scenario simulation system
├── earth.jpg              # Earth texture for 3D model
├── starmap.jpg            # Background starfield texture
├── .env                   # Environment variables (API keys)
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🔧 Technical Details

### Technologies Used
- **Three.js 0.150.1**: 3D graphics engine for WebGL rendering
- **JavaScript ES6+**: Modern JavaScript with modules and async/await
- **NASA NeoWS API**: Real-time asteroid data
- **USGS APIs**: Geological and earthquake data
- **WebGL**: Hardware-accelerated 3D graphics
- **CSS3**: Advanced styling with animations and responsive design

### Performance Considerations
- **Asteroid Caching**: Intelligent caching system to minimize API calls
- **LOD (Level of Detail)**: Optimized rendering for different zoom levels
- **Async Loading**: Progressive loading for better user experience
- **Memory Management**: Efficient cleanup of 3D objects and textures

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🛠️ Development

### Adding New Features
1. **Defense Methods**: Extend `ASTEROID_DEFENSE_METHODS` in `defense-system.js`
2. **Scenarios**: Add new scenarios to the `scenarios` object in `scenarios.js`
3. **Visualizations**: Implement new Three.js components in `main.js`

### API Integration
- The system uses NASA's NeoWS API for real-time asteroid data
- USGS APIs provide geological context for impact analysis
- All API calls are cached to improve performance and respect rate limits

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📖 Educational Use

OrbitalShield is designed for:
- **STEM Education**: Interactive learning about space science and planetary defense
- **Research**: Asteroid impact analysis and mission planning
- **Public Outreach**: Engaging visualization of space hazards and protection strategies
- **Academic Projects**: Real-world application of orbital mechanics and data visualization

## 🔐 Security Notes

- Keep your NASA API key secure and never commit it to version control
- The `.env` file is included in `.gitignore` to protect sensitive data
- Use environment variables or secure configuration management in production

## 📊 Data Sources

- **NASA JPL**: Near-Earth Asteroid data via NeoWS API
- **USGS**: Earthquake and geological data
- **NASA Planetary Defense Office**: Defense strategy methodologies
- **ESA Space Situational Awareness**: Additional orbital mechanics data

## 🤝 Acknowledgments

- NASA's Planetary Defense Coordination Office
- The DART mission team for kinetic impactor validation
- ESA's Space Situational Awareness program
- The Three.js community for 3D visualization tools
- USGS for geological and seismic data services

## 📄 License

This project is open source and available under the MIT License.

---

**⚠️ Disclaimer**: This application is for educational and research purposes. While based on real NASA data and scientific principles, it should not be used for actual planetary defense planning or emergency response decisions.

For questions, suggestions, or contributions, please open an issue or submit a pull request.