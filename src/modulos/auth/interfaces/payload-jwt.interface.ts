import { RolUsuario } from '../../../comunes/tipos/roles.enum';

export interface PayloadJwt {
  sub: string;
  usuario: string;
  correo: string;
  empresaId: string;
  roles: RolUsuario[];
}
