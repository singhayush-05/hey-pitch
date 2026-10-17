import { getDbStatus } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { config } from '../config/env.js';

export class HealthController {
  /**
   * GET /api/v1/health
   * Liveness probe: reports application process status.
   */
  static getHealth(req, res) {
    const data = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.env,
      version: '1.0.0'
    };
    return successResponse(res, 200, data, 'API service is live and responsive');
  }

  /**
   * GET /api/v1/ready
   * Readiness probe: checks required database connectivity without exposing connection strings.
   */
  static getReady(req, res) {
    const dbStatus = getDbStatus();

    // If database is configured and connected, or in test environment
    if (dbStatus.connected) {
      return successResponse(
        res,
        200,
        {
          status: 'ready',
          database: dbStatus,
          timestamp: new Date().toISOString()
        },
        'Application and database are ready to accept traffic'
      );
    }

    // If database is not connected
    return errorResponse(
      res,
      503,
      'SERVICE_NOT_READY',
      'Database connection is unavailable. Application is not ready.',
      {
        status: 'not_ready',
        database: dbStatus,
        timestamp: new Date().toISOString()
      }
    );
  }
}
