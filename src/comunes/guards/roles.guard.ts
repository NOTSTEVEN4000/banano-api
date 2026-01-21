import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decoradores/roles.decorator';
import { RolUsuario } from '../tipos/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesRequeridos || rolesRequeridos.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario?.roles || !Array.isArray(usuario.roles)) {
      throw new ForbiddenException('No tienes roles asignados.');
    }

    const tienePermiso = rolesRequeridos.some((rol) => usuario.roles.includes(rol));
    if (!tienePermiso) {
      throw new ForbiddenException('No tienes permisos para esta acción.');
    }
    return true;
  }
}
