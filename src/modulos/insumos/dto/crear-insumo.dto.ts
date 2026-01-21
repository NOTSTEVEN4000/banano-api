import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InsumoTipo } from '../../viajes/tipos/viaje.enums'; // Reutilizamos tu enum

export class CrearInsumoDto {
  @IsEnum(InsumoTipo)
  @IsNotEmpty()
  tipo: InsumoTipo;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  unidad?: string; // 'unidad', 'fardo', 'paquete', etc.

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockInicial?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costoPromedioUSD?: number;
}