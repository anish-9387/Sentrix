import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { testConnection } from './database/connection';
import { checkBlockedIP, rateLimitByIP } from './middlewares/security.middleware';
import { auditLogger } from './middlewares/audit.middleware';

// Load environment variables
dotenv.config();

class App {
  public app: Application;
  private readonly port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middlewares
   */
  private initializeMiddlewares(): void {
    // Security headers
    this.app.use(helmet());

    // CORS configuration
    const corsOptions = {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      optionsSuccessStatus: 200
    };
    this.app.use(cors(corsOptions));

    // Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }

    // IP blocking middleware
    this.app.use(checkBlockedIP);

    // Rate limiting
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000');
    this.app.use(rateLimitByIP(maxRequests, windowMs));

    // Audit logging middleware
    if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
      this.app.use(auditLogger);
    }
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    const apiPrefix = process.env.API_PREFIX || '/api/v1';

    // Welcome route
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Welcome to Sentrix Security API',
        version: '1.0.0',
        endpoints: {
          auth: `${apiPrefix}/auth`,
          users: `${apiPrefix}/users`,
          roles: `${apiPrefix}/roles`,
          security: `${apiPrefix}/security`,
          health: `${apiPrefix}/health`
        }
      });
    });

    // API routes
    this.app.use(apiPrefix, routes);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
      });
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);

      // Check if headers already sent
      if (res.headersSent) {
        return next(err);
      }

      res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' 
          ? err.message 
          : 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Test database connection
      await testConnection();

      // Start server
      this.app.listen(this.port, () => {
        console.log('='.repeat(50));
        console.log('🚀 SENTRIX SECURITY API');
        console.log('='.repeat(50));
        console.log(`✅ Server running on port ${this.port}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📡 API Base URL: http://localhost:${this.port}${process.env.API_PREFIX || '/api/v1'}`);
        console.log(`🔒 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
        console.log('='.repeat(50));
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

export default App;
