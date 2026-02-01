import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { JwtGuard } from '../../comunes/guards/jwt.guard';
import { RolesGuard } from '../../comunes/guards/roles.guard';
import { Roles } from '../../comunes/decoradores/roles.decorator';
import { RolUsuario } from '../../comunes/tipos/roles.enum';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';

@Controller('usuarios')
@UseGuards(JwtGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // Solo el ADMINISTRADOR puede crear usuarios
  @Post()
  @Roles(RolUsuario.ADMINISTRADOR)
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuariosService.crear(dto);
  }

  // Solo ADMINISTRADOR puede ver todos
  @Get()
  @Roles(RolUsuario.ADMINISTRADOR)
  listar() {
    return this.usuariosService.listar();
  }

  // 1. MODIFICAR MI PERFIL (Cualquier usuario logueado)
  @Patch('perfil')
  actualizarMiPerfil(@Req() req, @Body() dto: ActualizarUsuarioDto) {
    const usuarioId = req.user.id; // ID extraído del JWT por el Guard
    
    // Seguridad: Un usuario normal no puede cambiarse sus propios roles ni su estado activo
    delete dto.roles;
    delete dto.activo;
    
    return this.usuariosService.actualizar(usuarioId, dto);
  }

  // 2. MODIFICAR OTRO USUARIO (Solo ADMINISTRADOR)
  @Patch(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  actualizarPorAdmin(@Param('id') id: string, @Body() dto: ActualizarUsuarioDto) {
    return this.usuariosService.actualizar(id, dto);
  }

  // 3. OBTENER MI PERFIL
  @Get('perfil')
  obtenerMiPerfil(@Req() req) {
    return this.usuariosService.buscarPorId(req.user.id);
  }
}
