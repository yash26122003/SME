/**
 * Validation Middleware
 * Validates request payloads using Zod schemas
 */
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const validateRequest: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateQueryRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateFeedbackRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateAnalyticsRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateQueryParams: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateContentType: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validation.d.ts.map