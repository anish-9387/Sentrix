import geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';

interface GeoLocation {
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface DeviceInfo {
  device_type?: string;
  browser?: string;
  os?: string;
  full_agent?: string;
}

class GeoIPService {
  /**
   * Get geolocation from IP address
   */
  getLocation(ipAddress: string): GeoLocation {
    try {
      // Skip localhost/private IPs
      if (this.isPrivateIP(ipAddress)) {
        return {
          country: 'Local',
          city: 'localhost',
          latitude: 0,
          longitude: 0
        };
      }

      const geo = geoip.lookup(ipAddress);
      
      if (!geo) {
        return {};
      }

      return {
        country: geo.country || undefined,
        city: geo.city || undefined,
        latitude: geo.ll?.[0],
        longitude: geo.ll?.[1]
      };
    } catch (error) {
      console.error('GeoIP lookup error:', error);
      return {};
    }
  }

  /**
   * Parse user agent string
   */
  parseUserAgent(userAgent: string): DeviceInfo {
    try {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();

      return {
        device_type: result.device.type || 'desktop',
        browser: result.browser.name || 'Unknown',
        os: result.os.name || 'Unknown',
        full_agent: userAgent
      };
    } catch (error) {
      console.error('User agent parsing error:', error);
      return {
        full_agent: userAgent
      };
    }
  }

  /**
   * Check if IP is private/local
   */
  isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Calculate distance between two coordinates (in km)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export default new GeoIPService();
