import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { PagosService } from './pagos.service';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('registrar')
  async registrar(@Body() data: any) {
    return this.pagosService.registrarPago(data);
  }

  @Get('saldo/:idExterno')
  async consultarSaldo(
    @Param('idExterno') id: string,
    @Query('tipo') tipo: 'PAGO_PROVEEDOR' | 'COBRO_CLIENTE'
  ) {
    return this.pagosService.getSaldoPendiente(id, tipo);
  }
}