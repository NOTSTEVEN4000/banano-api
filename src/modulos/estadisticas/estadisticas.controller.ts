import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';

@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

@Get('dashboard')
async getDashboard(
  @Query('empresaId') empresaId: string,
  @Query('rol') rol: string,
) {
  return {
    ok: true,
    data: await this.estadisticasService.getDashboardStats(empresaId, rol),
  };
}

  @Get('proveedor/:id')
  async getStatsProveedor(
    @Query('empresaId') empresaId: string,
    @Param('id') proveedorId: string,
  ) {
    return await this.estadisticasService.getSaldoPorProveedor(
      empresaId,
      proveedorId,
    );
  }

  @Get('cliente/:id')
  async getStatsCliente(
    @Query('empresaId') empresaId: string,
    @Param('id') clienteId: string,
  ) {
    return await this.estadisticasService.getSaldoPorCliente(
      empresaId,
      clienteId,
    );
  }
}
