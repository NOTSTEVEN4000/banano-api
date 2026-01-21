import { Controller, Get, Patch, Post, Query, Param, Body, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ViajesService } from './viajes.service';
import { JwtGuard } from '../../comunes/guards/jwt.guard';
import { RolesGuard } from '../../comunes/guards/roles.guard';
import { Roles } from '../../comunes/decoradores/roles.decorator';
import { RolUsuario } from '../../comunes/tipos/roles.enum';
import { CrearViajeDto } from './dto/crear-viaje.dto';
import { RegistrarInsumosViajeDto } from './dto/insumos-viaje.dto';
import { AgregarCargaCajasDto } from './dto/carga-cajas.dto';
import { AgregarCombustibleDto } from './dto/combustible.dto';
import { EntregarViajeDto } from './dto/entregar-viaje.dto';

@Controller('viajes')
@UseGuards(JwtGuard, RolesGuard)
export class ViajesController {
    constructor(private readonly service: ViajesService) { }

    @Post()
    @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR)
    crear(@Body() dto: CrearViajeDto, @Req() req: Request) {
        return this.service.crear(dto, (req as any).user);
    }

    @Get('resumen')
    @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR, RolUsuario.CONTADOR, RolUsuario.LECTOR)
    resumen(@Query('fecha') fecha: string, @Req() req: Request) {
        return this.service.resumenPorFecha(fecha, (req as any).user);
    }

    @Get()
    @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR, RolUsuario.CONTADOR, RolUsuario.LECTOR)
    listar(@Query('fecha') fecha: string, @Req() req: Request) {
        return this.service.listarPorFecha(fecha, (req as any).user);
    }

    @Patch(':idExterno/iniciar')
    @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR)
    iniciar(@Param('idExterno') idExterno: string, @Req() req: Request) {
        return this.service.iniciar(idExterno, (req as any).user);
    }

    @Post(':idExterno/insumos')
    @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR)
    insumos(@Param('idExterno') idExterno: string, @Body() dto: RegistrarInsumosViajeDto, @Req() req: Request) {
        return this.service.registrarInsumos(idExterno, dto, (req as any).user);
    }

    @Post(':idExterno/cargas-cajas')
    @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR)
    cargas(@Param('idExterno') idExterno: string, @Body() dto: AgregarCargaCajasDto, @Req() req: Request) {
        return this.service.agregarCargaCajas(idExterno, dto, (req as any).user);
    }

    @Post(':idExterno/combustible')
    @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR)
    combustible(@Param('idExterno') idExterno: string, @Body() dto: AgregarCombustibleDto, @Req() req: Request) {
        return this.service.agregarCombustible(idExterno, dto, (req as any).user);
    }

    @Patch(':idExterno/entregar')
    @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERADOR)
    entregar(@Param('idExterno') idExterno: string, @Body() dto: EntregarViajeDto, @Req() req: Request) {
        return this.service.entregar(idExterno, dto, (req as any).user);
    }
}
