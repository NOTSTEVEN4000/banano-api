import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class FiltroExcepcionesHttp implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const response =
      exception instanceof HttpException ? exception.getResponse() : null;

    // Mensaje “amigable”
    const mensaje =
      typeof response === 'object' && response !== null
        ? (response as any).message ?? 'Error'
        : exception?.message ?? 'Error interno';

    res.status(status).json({
      ok: false,
      ruta: req.originalUrl,
      timestamp: new Date().toISOString(),
      statusCode: status,
      mensaje: Array.isArray(mensaje) ? mensaje.join(' | ') : String(mensaje),
    });
  }
}
