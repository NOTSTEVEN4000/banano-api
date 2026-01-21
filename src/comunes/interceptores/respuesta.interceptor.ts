import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class RespuestaInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        return next.handle().pipe(
            map((data) => ({
                ok: true,
                ruta: req.originalUrl,
                timestamp: new Date().toISOString(),
                data,
            })),
        );
    }
}
