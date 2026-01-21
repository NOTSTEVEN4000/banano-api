import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class CrearVehiculoDto {
  @IsString()
  @IsNotEmpty()
  idExterno: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]{5,10}$/i, { message: 'Placa inválida (ej: ABC-1234).' })
  placa: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacidadCajas?: number;

  @IsString()
  @IsNotEmpty()
  tipo: string; // Camión, Furgoneta, etc.

  @IsString()
  @IsNotEmpty()
  marca: string;

  @IsString()
  @IsNotEmpty()
  modelo: string;

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
  estado?: string; // Operativo, Mantenimiento, etc.

  @IsOptional()
  @IsString()
  conductorAsignado?: string;

  @IsOptional()
  @IsString()
  conductorAsignadoNombre?: string;
}