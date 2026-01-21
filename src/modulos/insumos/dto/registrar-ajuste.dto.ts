import { IsEnum, IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { InsumoTipo } from '../../viajes/tipos/viaje.enums';

export class RegistrarAjusteDto {
  @IsEnum(InsumoTipo)
  @IsNotEmpty()
  tipo: InsumoTipo;

  @IsNumber()
  diferencia: number; // + positivo = suma, - negativo = resta

  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsString()
  @IsOptional()
  notas?: string;
}