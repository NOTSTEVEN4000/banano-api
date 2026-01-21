import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AgregarCargaCajasDto {
  @IsString() @IsNotEmpty()
  idExterno: string; // id del documento vcc-xxx

  @IsString() @IsNotEmpty()
  proveedorIdExterno: string;

  @IsString() @IsNotEmpty()
  haciendaIdExterno: string;

  @IsNumber() @Min(0)
  cantidadCajas: number;

  @IsNumber() @Min(0)
  costoCompraUnitario: number;

  // opcional si ya vendes directo
  @IsOptional() @IsString()
  clienteIdExterno?: string;

  @IsOptional() @IsNumber() @Min(0)
  precioVentaUnitario?: number;
}
