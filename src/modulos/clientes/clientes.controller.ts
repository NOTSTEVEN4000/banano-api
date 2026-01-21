// cliente.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { ActualizarClienteDto } from './dto/actualizar-cliente.dto';
import { JwtGuard } from 'src/comunes/guards/jwt.guard';
import { RolesGuard } from 'src/comunes/guards/roles.guard';
import { Roles } from 'src/comunes/decoradores/roles.decorator';
import { RolUsuario } from 'src/comunes/tipos/roles.enum';
import { ClientesService } from './clientes.service';

@Controller('clientes')
@UseGuards(JwtGuard, RolesGuard)
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Post()
  crear(@Body() dto: CrearClienteDto, @Req() req: any) {
    return this.service.crear(dto, req.user);
  }

  @Get()
  listar(@Req() req: any) {
    return this.service.listar(req.user);
  }

  @Get('todos')
  @Roles(RolUsuario.ADMINISTRADOR)
  listarTodos(@Req() req: any) {
    return this.service.listarTodos(req.user);
  }

  @Patch(':idExterno')
  actualizar(
    @Param('idExterno') idExterno: string,
    @Body() dto: ActualizarClienteDto,
    @Req() req: any,
  ) {
    return this.service.actualizar(idExterno, dto, req.user);
  }

  @Delete(':idExterno')
  eliminar(@Param('idExterno') idExterno: string, @Req() req: any) {
    return this.service.eliminarLogico(idExterno, req.user);
  }

  @Patch(':idExterno/reactivar')
  @Roles(RolUsuario.ADMINISTRADOR)
  reactivar(@Param('idExterno') idExterno: string, @Req() req: any) {
    return this.service.reactivar(idExterno, req.user);
  }
}