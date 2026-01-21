import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CrearVehiculoDto } from './dto/crear-vehiculo.dto';
import { ActualizarVehiculoDto } from './dto/actualizar-vehiculo.dto';
import { JwtGuard } from 'src/comunes/guards/jwt.guard';
import { Roles } from 'src/comunes/decoradores/roles.decorator';
import { RolUsuario } from '../../comunes/tipos/roles.enum';
import { RolesGuard } from 'src/comunes/guards/roles.guard';

@Controller('vehiculos')
@UseGuards(JwtGuard, RolesGuard) // Aplica a todos los endpoints
export class VehiculosController {
  constructor(private readonly service: VehiculosService) {}

  @Post()
  crear(@Body() dto: CrearVehiculoDto, @Req() req: any) {
    return this.service.crear(dto, req.user);
  }

  @Get()
  listar(@Req() req: any) {
    return this.service.listar(req.user);
  }

  // NUEVO: Listado completo (activos + inactivos) - SOLO ADMINISTRADOR
  @Get('todos')
  @Roles(RolUsuario.ADMINISTRADOR) // ← Solo admin
  listarTodos(@Req() req: any) {
    return this.service.listarTodos(req.user);
  }

  @Get(':idExterno')
  obtener(@Param('idExterno') idExterno: string, @Req() req: any) {
    return this.service.obtenerPorIdExterno(idExterno, req.user);
  }

  @Patch(':idExterno')
  actualizar(
    @Param('idExterno') idExterno: string,
    @Body() dto: ActualizarVehiculoDto,
    @Req() req: any,
  ) {
    return this.service.actualizar(idExterno, dto, req.user);
  }

  @Delete(':idExterno')
  eliminar(@Param('idExterno') idExterno: string, @Req() req: any) {
    return this.service.eliminarLogico(idExterno, req.user);
  }

  @Patch(':idExterno/reactivar')
  @Roles(RolUsuario.ADMINISTRADOR) // ← Solo admin
  reactivar(@Param('idExterno') idExterno: string, @Req() req: any) {
    return this.service.reactivar(idExterno, req.user);
  }
}