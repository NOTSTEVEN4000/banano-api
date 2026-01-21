import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { JwtGuard } from '../../comunes/guards/jwt.guard';
import { RolesGuard } from '../../comunes/guards/roles.guard';
import { Roles } from '../../comunes/decoradores/roles.decorator';
import { RolUsuario } from '../../comunes/tipos/roles.enum';

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
}
