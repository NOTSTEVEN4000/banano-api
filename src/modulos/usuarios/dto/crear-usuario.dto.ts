import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '../../../comunes/tipos/roles.enum';

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @IsEmail()
  correo: string;

  @IsString()
  @IsNotEmpty()
  nombreCompleto: string;

  @IsString()
  @MinLength(6)
  clave: string;

  @IsArray()
  @IsEnum(RolUsuario, { each: true })
  roles: RolUsuario[];
}
