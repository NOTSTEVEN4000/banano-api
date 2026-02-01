import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';
import { RolUsuario } from '../../../comunes/tipos/roles.enum';

export class ActualizarUsuarioDto {
  @IsString()
  @IsOptional()
  nombreCompleto?: string;

  @IsEmail()
  @IsOptional()
  correo?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  clave?: string;

  // Solo el admin usará estos campos
  @IsArray()
  @IsOptional()
  @IsEnum(RolUsuario, { each: true })
  roles?: RolUsuario[];

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}