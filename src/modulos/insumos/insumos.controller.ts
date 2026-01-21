import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from '../../comunes/guards/jwt.guard';
import { RolesGuard } from '../../comunes/guards/roles.guard';
import { Roles } from '../../comunes/decoradores/roles.decorator';
import { RolUsuario } from '../../comunes/tipos/roles.enum';
import { InsumosService } from './insumos.service';
import { CrearInsumoDto } from './dto/crear-insumo.dto';
import { ActualizarInsumoDto } from './dto/actualizar-insumo.dto';
import { RegistrarEntradaDto } from './dto/registrar-entrada.dto';
import { RegistrarAjusteDto } from './dto/registrar-ajuste.dto';


@Controller('insumos')
@UseGuards(JwtGuard, RolesGuard)
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  // ── Catálogo de insumos ───────────────────────────────────────────────

  @Post()
  @Roles(RolUsuario.ADMINISTRADOR)
  async crear(@Body() dto: CrearInsumoDto, @Req() req: Request) {
    return this.insumosService.crearInsumo(dto, (req as any).user);
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR, RolUsuario.CONTADOR, RolUsuario.LECTOR)
  async listar(
    @Query('tipo') tipo?: string,
    @Query('conStockBajo') conStockBajo?: string,
  ) {
    return this.insumosService.listarInsumos({
      tipo,
      conStockBajo: conStockBajo === 'true',
    });
  }

  @Get(':idExterno')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR, RolUsuario.CONTADOR, RolUsuario.LECTOR)
  async obtener(@Param('idExterno') idExterno: string, @Req() req: Request) {
    return this.insumosService.obtenerInsumo(idExterno, (req as any).user);
  }

  @Patch(':idExterno')
  @Roles(RolUsuario.ADMINISTRADOR)
  async actualizar(
    @Param('idExterno') idExterno: string,
    @Body() dto: ActualizarInsumoDto,
    @Req() req: Request,
  ) {
    return this.insumosService.actualizarInsumo(idExterno, dto, (req as any).user);
  }

  // ── Entradas (compras / entregas de proveedores) ───────────────────────

  @Post('entradas')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR)
  async registrarEntrada(@Body() dto: RegistrarEntradaDto, @Req() req: Request) {
    return this.insumosService.registrarEntrada(dto, (req as any).user);
  }

  // ── Ajustes manuales (conteo físico, pérdidas, etc) ────────────────────

  @Post('ajustes')
  @Roles(RolUsuario.ADMINISTRADOR)
  async registrarAjuste(@Body() dto: RegistrarAjusteDto, @Req() req: Request) {
    return this.insumosService.registrarAjuste(dto, (req as any).user);
  }

  // ── Kardex / Movimientos ───────────────────────────────────────────────

  @Get(':idExterno/movimientos')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.CONTADOR, RolUsuario.LECTOR)
  async obtenerMovimientos(
    @Param('idExterno') idExterno: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.insumosService.obtenerMovimientosPorInsumo(idExterno, {
      desde,
      hasta,
    });
  }

  // ── Stock actual resumido (útil para dashboard) ────────────────────────

  @Get('resumen-stock')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR, RolUsuario.CONTADOR, RolUsuario.LECTOR)
  async resumenStock() {
    return this.insumosService.obtenerResumenStock();
  }
}