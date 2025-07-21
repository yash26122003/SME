"use strict";
/**
 * Logger Configuration
 * Comprehensive logging setup using Winston for production-ready logging
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiLogger = exports.apiLogger = exports.authLogger = exports.queryLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const logLevel = process.env.LOG_LEVEL || 'info';
const logFile = process.env.LOG_FILE_PATH || './logs/app.log';
// Ensure logs directory exists
const fs_1 = __importDefault(require("fs"));
const logDir = path_1.default.dirname(logFile);
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
// Custom format for structured logging
const customFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.prettyPrint());
// Console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss'
}), winston_1.default.format.printf(({ level, message, timestamp, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
    }
    return log;
}));
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: logLevel,
    format: customFormat,
    defaultMeta: {
        service: 'business-ai-platform',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // File transport for all logs
        new winston_1.default.transports.File({
            filename: logFile,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),
        // Error-specific file
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        })
    ],
    // Handle uncaught exceptions and rejections
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'exceptions.log')
        })
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'rejections.log')
        })
    ]
});
// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: consoleFormat
    }));
}
// Create specialized loggers for different components
exports.queryLogger = exports.logger.child({ component: 'query-processor' });
exports.authLogger = exports.logger.child({ component: 'authentication' });
exports.apiLogger = exports.logger.child({ component: 'api' });
exports.aiLogger = exports.logger.child({ component: 'ai-services' });
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map