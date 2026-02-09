import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@/database/prisma.service';

/**
 * Health Check Controller
 *
 * Provides endpoints for monitoring system health:
 * - /health - General health status
 * - /health/db - Database connectivity
 * - /health/live - Liveness probe
 * - /health/ready - Readiness probe
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'General health status' })
  async check() {
    const dbStatus = await this.checkDatabase();

    const status = {
      status: dbStatus.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbStatus,
        api: { healthy: true, message: 'OK' },
      },
    };

    return status;
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe - Is the application running?' })
  live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe - Is the application ready to receive traffic?' })
  async ready() {
    const dbStatus = await this.checkDatabase();

    if (!dbStatus.healthy) {
      return {
        status: 'not_ready',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Database health check' })
  async checkDb() {
    return this.checkDatabase();
  }

  private async checkDatabase() {
    try {
      // Simple query to verify database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        healthy: true,
        message: 'Connected',
        latency: 'unknown', // Could be measured if needed
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'Connection failed',
        error: error.message,
      };
    }
  }
}
