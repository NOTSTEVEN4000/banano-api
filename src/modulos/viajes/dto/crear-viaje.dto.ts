import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoDestino, TipoViaje } from '../tipos/viaje.enums';

class DestinoDto {
  @IsEnum(TipoDestino) tipoDestino: TipoDestino;

  @IsOptional() @IsString() haciendaIdExterno?: string;
  @IsOptional() @IsString() clienteIdExterno?: string;
  @IsOptional() @IsString() descripcion?: string;
}

export class CrearViajeDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha: string;

  @IsEnum(TipoViaje)
  tipo: TipoViaje;

  @IsString() @IsNotEmpty()
  vehiculoIdExterno: string;

  @ValidateNested()
  @Type(() => DestinoDto)
  destino: DestinoDto;

  @IsOptional() @IsString()
  notas?: string;
}
