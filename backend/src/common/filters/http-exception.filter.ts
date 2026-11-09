import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Error interno del servidor. Operación protegida.' };

    // Nunca exponer trazas de pila (stack traces) ni errores crudos de SQL al cliente
    const safeError =
      status === HttpStatus.INTERNAL_SERVER_ERROR
        ? { message: 'Error interno del servidor. Intenta de nuevo más tarde.' }
        : typeof rawResponse === 'object'
          ? rawResponse
          : { message: rawResponse };

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(rawResponse)}`
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: safeError,
    });
  }
}
