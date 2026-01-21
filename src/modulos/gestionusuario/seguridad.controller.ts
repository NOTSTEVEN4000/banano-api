import { Body, Controller, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { SeguridadService } from "./seguridad.service";
import { AdminUpdateDto, CambiarClaveInternaDto, RestablecerConCodigoDto, SolicitarCodigoDto } from "./dto/seguridad.dto";
import { JwtGuard } from "src/comunes/guards/jwt.guard";
import { RolesGuard } from "src/comunes/guards/roles.guard";
import { RolUsuario } from "src/comunes/tipos/roles.enum";
import { Roles } from "src/comunes/decoradores/roles.decorator";

@Controller('seguridad')
export class SeguridadController {
  constructor(private readonly seguridadService: SeguridadService) {}

  // 1. PÚBLICO: Recuperación desde el Login
  @Post('recuperar/solicitar')
  solicitar(@Body() dto: SolicitarCodigoDto) {
    return this.seguridadService.generarCodigoRecuperacion(dto.correo);
  }

  @Post('recuperar/resetear')
  resetear(@Body() dto: RestablecerConCodigoDto) {
    return this.seguridadService.validarYResetear(dto);
  }

  // 2. PRIVADO: Cualquier usuario logueado cambia su propia clave
  @UseGuards(JwtGuard)
  @Patch('perfil/cambiar-clave')
  cambiarClave(@Req() req, @Body() dto: CambiarClaveInternaDto) {
    return this.seguridadService.actualizarMiPropiaClave(req.user.id, dto);
  }

  // 3. ADMINISTRADOR: Control total de otros usuarios
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(RolUsuario.ADMINISTRADOR)
  @Patch('admin/usuarios/:id')
  adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateDto) {
    return this.seguridadService.gestionAdminUpdate(id, dto);
  }
}