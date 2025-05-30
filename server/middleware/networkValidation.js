import { detectProxy, isIpInAllowedRange } from '../utils/networkUtils.js';
import requestIp from 'request-ip';

// Load allowed IP ranges from environment variables or use defaults
const getAllowedRanges = () => {
  const ranges = process.env.ALLOWED_IP_RANGES;
  if (!ranges) {
    // Default to local network ranges
    return [
      '10.0.0.0-10.255.255.255',     // Class A private network
      '172.16.0.0-172.31.255.255',   // Class B private network
      '192.168.0.0-192.168.255.255', // Class C private network
      '127.0.0.0-127.255.255.255'    // Localhost
    ];
  }
  return ranges.split(',').map(range => range.trim());
};

export const validateNetwork = async (req, res, next) => {
  try {
    const clientIp = requestIp.getClientIp(req);
    const allowedRanges = getAllowedRanges();
    
    // Check if client IP is in allowed range
    if (!isIpInAllowedRange(clientIp, allowedRanges)) {
      console.warn('Access attempt from unauthorized network:', {
        ip: clientIp,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({
        message: 'Access denied',
        details: 'You must be on the authorized network to access this resource'
      });
    }
    
    // Detect proxy/VPN usage
    const proxyCheck = await detectProxy(req);
    if (proxyCheck.isProxy) {
      console.warn('Proxy/VPN detected:', {
        ip: clientIp,
        factors: proxyCheck.factors,
        clientInfo: proxyCheck.clientInfo,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({
        message: 'Access denied',
        details: 'Use of proxy or VPN is not allowed'
      });
    }
    
    // Add client info to request for logging/tracking
    req.clientInfo = {
      ip: clientIp,
      ...proxyCheck.clientInfo
    };
    
    next();
  } catch (error) {
    console.error('Network validation error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware specifically for attendance marking
export const validateAttendanceNetwork = async (req, res, next) => {
  try {
    const clientIp = requestIp.getClientIp(req);
    const allowedRanges = getAllowedRanges();
    
    // Stricter validation for attendance marking
    if (!isIpInAllowedRange(clientIp, allowedRanges)) {
      console.warn('Attendance marking attempt from unauthorized network:', {
        ip: clientIp,
        userId: req.user?.id,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({
        message: 'Access denied',
        details: 'Attendance can only be marked from authorized locations'
      });
    }
    
    // Enhanced proxy detection for attendance
    const proxyCheck = await detectProxy(req);
    if (proxyCheck.isProxy) {
      console.warn('Proxy/VPN detected during attendance marking:', {
        ip: clientIp,
        userId: req.user?.id,
        factors: proxyCheck.factors,
        clientInfo: proxyCheck.clientInfo,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({
        message: 'Access denied',
        details: 'Attendance cannot be marked while using a proxy or VPN'
      });
    }
    
    // Store location info with attendance
    req.locationInfo = {
      ip: clientIp,
      geo: proxyCheck.clientInfo.geo,
      timestamp: new Date().toISOString()
    };
    
    next();
  } catch (error) {
    console.error('Attendance network validation error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 