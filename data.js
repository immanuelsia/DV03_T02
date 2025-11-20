// Sample data for all research questions
// Replace with actual data from your dataset

const DATA = {
    // RQ1: Detection Method vs Outcomes
    rq1: {
        years: ['2019', '2020', '2021', '2022', '2023', '2024'],
        outcomes: ['Warning', 'Fine', 'Court Summons'],
        
        camera: {
            warning: [1200, 1350, 1500, 1600, 1450, 1550],
            fine: [15000, 18500, 22000, 26500, 31000, 36500],
            court: [450, 520, 580, 650, 720, 800]
        },
        police: {
            warning: [8500, 8200, 7900, 7600, 7400, 7200],
            fine: [12000, 11500, 11200, 10800, 10500, 10200],
            court: [3500, 3400, 3300, 3250, 3200, 3150]
        }
    },
    
    // RQ2: Seasonal Patterns
    rq2: {
        years: [2019, 2020, 2021, 2022, 2023, 2024],
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        
        // Heatmap data: [year][month] = infraction count
        heatmapData: [
            [4200, 3800, 3500, 3200, 2900, 2700, 2600, 2800, 3100, 3400, 3700, 4500], // 2019
            [4300, 3900, 3600, 3100, 2800, 2650, 2550, 2750, 3050, 3350, 3650, 4400], // 2020
            [4400, 4000, 3700, 3300, 3000, 2800, 2700, 2900, 3200, 3500, 3800, 4600], // 2021
            [4500, 4100, 3800, 3400, 3100, 2850, 2750, 2950, 3250, 3550, 3850, 4700], // 2022
            [4600, 4200, 3900, 3500, 3200, 2900, 2800, 3000, 3300, 3600, 3900, 4800], // 2023
            [4700, 4300, 4000, 3600, 3300, 3000, 2900, 3100, 3400, 3700, 4000, 4900]  // 2024
        ]
    },
    
    // RQ3: Method Effectiveness by Jurisdiction
    rq3: {
        jurisdictions: [
            { name: 'NSW', fullName: 'New South Wales', population: 8166000, lat: -33.8688, lng: 151.2093 },
            { name: 'VIC', fullName: 'Victoria', population: 6681000, lat: -37.8136, lng: 144.9631 },
            { name: 'QLD', fullName: 'Queensland', population: 5206000, lat: -27.4698, lng: 153.0251 },
            { name: 'WA', fullName: 'Western Australia', population: 2667000, lat: -31.9505, lng: 115.8605 },
            { name: 'SA', fullName: 'South Australia', population: 1771000, lat: -34.9285, lng: 138.6007 },
            { name: 'TAS', fullName: 'Tasmania', population: 541000, lat: -42.8821, lng: 147.3272 },
            { name: 'ACT', fullName: 'Australian Capital Territory', population: 431000, lat: -35.2809, lng: 149.1300 },
            { name: 'NT', fullName: 'Northern Territory', population: 246000, lat: -12.4634, lng: 130.8456 }
        ],
        
        cameraDetections: {
            NSW: 65000,
            VIC: 58000,
            QLD: 42000,
            WA: 28000,
            SA: 19000,
            TAS: 5200,
            ACT: 7800,
            NT: 3100
        },
        
        policeDetections: {
            NSW: 12000,
            VIC: 11500,
            QLD: 9800,
            WA: 7200,
            SA: 5100,
            TAS: 2800,
            ACT: 1500,
            NT: 1800
        }
    },
    
    // RQ4: Location of Infractions
    rq4: {
        // Hotspot locations with coordinates
        hotspots: [
            // NSW
            { jurisdiction: 'NSW', lat: -33.8688, lng: 151.2093, name: 'Sydney CBD', infractions: 8500, category: 'Metropolitan' },
            { jurisdiction: 'NSW', lat: -33.9173, lng: 151.2313, name: 'Eastern Distributor', infractions: 6200, category: 'Metropolitan' },
            { jurisdiction: 'NSW', lat: -33.7969, lng: 151.2880, name: 'Parramatta Rd', infractions: 5800, category: 'Metropolitan' },
            { jurisdiction: 'NSW', lat: -34.4250, lng: 150.8931, name: 'Wollongong', infractions: 3200, category: 'Regional' },
            { jurisdiction: 'NSW', lat: -32.9283, lng: 151.7817, name: 'Newcastle', infractions: 2900, category: 'Regional' },
            
            // VIC
            { jurisdiction: 'VIC', lat: -37.8136, lng: 144.9631, name: 'Melbourne CBD', infractions: 7800, category: 'Metropolitan' },
            { jurisdiction: 'VIC', lat: -37.8784, lng: 145.0767, name: 'Monash Fwy', infractions: 6500, category: 'Metropolitan' },
            { jurisdiction: 'VIC', lat: -38.1499, lng: 144.3617, name: 'Geelong', infractions: 2800, category: 'Regional' },
            
            // QLD
            { jurisdiction: 'QLD', lat: -27.4698, lng: 153.0251, name: 'Brisbane CBD', infractions: 5500, category: 'Metropolitan' },
            { jurisdiction: 'QLD', lat: -28.0167, lng: 153.4000, name: 'Gold Coast', infractions: 4200, category: 'Regional' },
            { jurisdiction: 'QLD', lat: -16.9186, lng: 145.7781, name: 'Cairns', infractions: 1800, category: 'Regional' },
            
            // WA
            { jurisdiction: 'WA', lat: -31.9505, lng: 115.8605, name: 'Perth CBD', infractions: 4500, category: 'Metropolitan' },
            { jurisdiction: 'WA', lat: -32.0569, lng: 115.7439, name: 'Kwinana Fwy', infractions: 3800, category: 'Metropolitan' },
            
            // SA
            { jurisdiction: 'SA', lat: -34.9285, lng: 138.6007, name: 'Adelaide CBD', infractions: 3200, category: 'Metropolitan' },
            { jurisdiction: 'SA', lat: -35.1233, lng: 138.6089, name: 'South Rd', infractions: 2900, category: 'Metropolitan' },
            
            // TAS
            { jurisdiction: 'TAS', lat: -42.8821, lng: 147.3272, name: 'Hobart', infractions: 1200, category: 'Metropolitan' },
            
            // ACT
            { jurisdiction: 'ACT', lat: -35.2809, lng: 149.1300, name: 'Canberra', infractions: 1800, category: 'Metropolitan' },
            
            // NT
            { jurisdiction: 'NT', lat: -12.4634, lng: 130.8456, name: 'Darwin', infractions: 950, category: 'Metropolitan' },
            { jurisdiction: 'NT', lat: -23.6980, lng: 133.8807, name: 'Alice Springs', infractions: 420, category: 'Remote' }
        ],
        
        // Location category breakdown by jurisdiction
        locationCategories: {
            labels: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'],
            metropolitan: [52000, 46000, 33000, 22000, 15500, 4200, 6800, 2200],
            regional: [18000, 9500, 8000, 5000, 3000, 800, 800, 600],
            remote: [7000, 2500, 1000, 1000, 500, 200, 200, 300]
        }
    },
    
    // RQ5: Age Groups Analysis
    rq5: {
        ageGroups: [
            { label: '17-24', licenseHolders: 1250000, infractions: 35500 },
            { label: '25-34', licenseHolders: 2100000, infractions: 48300 },
            { label: '35-44', licenseHolders: 2350000, infractions: 42200 },
            { label: '45-54', licenseHolders: 2280000, infractions: 32400 },
            { label: '55-64', licenseHolders: 2150000, infractions: 14400 },
            { label: '65-74', licenseHolders: 1680000, infractions: 11760 },
            { label: '75+', licenseHolders: 980000, infractions: 8820 }
        ]
    }
};

// Utility functions
const utils = {
    // Calculate per capita rate per 10,000 people
    perCapitaRate: (infractions, population) => {
        return Math.round((infractions / population) * 10000);
    },
    
    // Calculate per license holder rate per 10,000
    perLicenseRate: (infractions, licenseHolders) => {
        return Math.round((infractions / licenseHolders) * 10000);
    },
    
    // Format number with commas
    formatNumber: (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // Get color scale for heatmap
    getHeatmapColor: (value, min, max) => {
        const ratio = (value - min) / (max - min);
        const hue = (1 - ratio) * 240; // Blue (240) to Red (0)
        return `hsl(${hue}, 70%, 50%)`;
    },
    
    // Get color for choropleth map (Beige color scale)
    getChoroplethColor: (value) => {
        return value > 120 ? '#44403c' :  // beige-700
               value > 100 ? '#57534e' :  // beige-600
               value > 80  ? '#78716c' :  // beige-500
               value > 60  ? '#a8a29e' :  // beige-400
               value > 40  ? '#d6d3d1' :  // beige-300
               value > 20  ? '#e7e5e4' :  // beige-200
               value > 10  ? '#f5f5f4' :  // beige-100
                             '#fafaf9';   // beige-50
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DATA, utils };
}

