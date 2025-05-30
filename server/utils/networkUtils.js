import { networkInterfaces } from 'os';
import geoip from 'geoip-lite';
import requestIp from 'request-ip';
import { UAParser } from 'ua-parser-js';

// Get local network information
export const getLocalNetworkInfo = () => {
  const nets = networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          name,
          address: net.address,
          netmask: net.netmask,
          mac: net.mac,
        });
      }
    }
  }

  return results;
};

// Check if IP is within allowed range
export const isIpInAllowedRange = (ip, allowedRanges) => {
  if (!ip || !allowedRanges?.length) return false;

  const ipParts = ip.split('.').map(Number);
  
  return allowedRanges.some(range => {
    const [start, end] = range.split('-');
    const startParts = start.split('.').map(Number);
    const endParts = end.split('.').map(Number);
    
    let isInRange = true;
    for (let i = 0; i < 4; i++) {
      if (ipParts[i] < startParts[i] || ipParts[i] > endParts[i]) {
        isInRange = false;
        break;
      }
    }
    return isInRange;
  });
};

// Detect potential proxy/VPN usage
export const detectProxy = async (req) => {
  const clientIp = requestIp.getClientIp(req);
  const userAgent = req.headers['user-agent'];
  const parser = new UAParser(userAgent);
  const browserInfo = parser.getBrowser();
  const osInfo = parser.getOS();
  const deviceInfo = parser.getDevice();
  
  // Get geolocation info
  const geo = geoip.lookup(clientIp);
  
  const suspiciousFactors = [];
  
  // Check for known proxy/VPN ports
  const commonProxyPorts = [80, 443, 1080, 3128, 8080, 8888, 9999];
  if (commonProxyPorts.includes(req.socket.remotePort)) {
    suspiciousFactors.push('Common proxy port detected');
  }
  
  // Check for mismatched timezone
  const clientTimezone = req.headers['x-timezone'];
  if (geo && clientTimezone) {
    const expectedTimezone = getExpectedTimezone(geo.ll[0], geo.ll[1]);
    if (expectedTimezone && expectedTimezone !== clientTimezone) {
      suspiciousFactors.push('Timezone mismatch');
    }
  }
  
  // Check for suspicious headers
  const proxyHeaders = [
    'via',
    'x-forwarded-for',
    'forwarded',
    'x-real-ip',
    'proxy-connection',
  ];
  
  for (const header of proxyHeaders) {
    if (req.headers[header]) {
      suspiciousFactors.push(`Proxy header detected: ${header}`);
    }
  }
  
  // Check for VPN fingerprints
  const vpnProviders = [
    'nordvpn',
    'expressvpn',
    'privatevpn',
    'protonvpn',
    'cyberghost',
  ];
  
  const hostname = req.hostname?.toLowerCase();
  if (hostname && vpnProviders.some(vpn => hostname.includes(vpn))) {
    suspiciousFactors.push('VPN hostname detected');
  }
  
  return {
    isProxy: suspiciousFactors.length > 0,
    factors: suspiciousFactors,
    clientInfo: {
      ip: clientIp,
      geo,
      browser: browserInfo,
      os: osInfo,
      device: deviceInfo,
    },
  };
};

// Helper function to get expected timezone from coordinates
const getExpectedTimezone = (lat, lon) => {
  // Simple implementation - in production you'd want to use a proper timezone database
  const offset = Math.round(lon / 15);
  return `UTC${offset >= 0 ? '+' : ''}${offset}:00`;
};

// Calculate distance between two points in meters using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}; 