import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class ActualizarVehiculoDto {
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9-]{5,10}$/i, { message: 'Placa inválida (ej: ABC-1234).' })
  placa?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacidadCajas?: number;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  anio?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  kilometrajeActual?: number;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  conductorAsignado?: string;

  @IsOptional()
  @IsString()
  conductorAsignadoNombre?: string;
}