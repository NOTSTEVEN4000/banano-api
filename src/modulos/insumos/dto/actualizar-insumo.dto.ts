import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { InsumoTipo } from '../../viajes/tipos/viaje.enums';

export class ActualizarInsumoDto {
  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  unidad?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoPromedioUSD?: number;
}