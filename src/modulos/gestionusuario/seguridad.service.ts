import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AdminUpdateDto,
  CambiarClaveInternaDto,
  RestablecerConCodigoDto,
} from './dto/seguridad.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Usuario } from '../usuarios/schemas/usuario.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class SeguridadService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,
    private readonly mailerService: MailerService,
  ) {}

  // --- LÓGICA DE ADMINISTRADOR: Permite editar cualquier usuario ---
  async gestionAdminUpdate(id: string, dto: AdminUpdateDto) {
    const updateData: any = { ...dto };

    // Si el admin envía una nueva clave, la encriptamos antes de guardar
    if (dto.clave) {
      updateData.claveHash = await bcrypt.hash(dto.clave, 10);
      delete updateData.clave; // Borramos la clave en texto plano
    }

    // Actualizamos al usuario y pedimos que devuelva el nuevo objeto sin la claveHash
    const user = await this.usuarioModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .select('-claveHash');

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // --- LÓGICA DE USUARIO LOGUEADO: Cambiar clave propia ---
  async actualizarMiPropiaClave(usuarioId: string, dto: CambiarClaveInternaDto) {
    // 1. Buscamos al usuario incluyendo el campo oculto claveHash
    const user = await this.usuarioModel
      .findById(usuarioId)
      .select('+claveHash');

    if (!user) {
      throw new NotFoundException('El usuario no existe en la base de datos');
    }

    // 2. Comparamos la clave actual enviada con la guardada en BD
    const esValida = await bcrypt.compare(dto.claveAnterior, user.claveHash);

    if (!esValida) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    // 3. Encriptamos la nueva clave y actualizamos
    const claveHash = await bcrypt.hash(dto.nuevaClave, 10);
    await this.usuarioModel.updateOne({ _id: usuarioId }, { claveHash });

    return { exito: true, mensaje: 'Contraseña actualizada' };
  }

  // --- RECUPERACIÓN PASO 1: Generar código y enviar mail ---
  async generarCodigoRecuperacion(correo: string) {
    // Verificamos que el usuario exista y esté activo
    const user = await this.usuarioModel.findOne({ correo, activo: true });
    if (!user) throw new NotFoundException('Usuario no registrado');

    // Generamos un código de 6 dígitos y fecha de expiración (15 min)
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date();
    expiracion.setMinutes(expiracion.getMinutes() + 15);

    // Guardamos el código en la BD. Usamos strict:false porque estos campos no están en el Schema original
    await this.usuarioModel.findByIdAndUpdate(
      user._id,
      { $set: { codigoRecuperacion: codigo, codigoExpiracion: expiracion, intentosRecuperacion: 0 } },
      { strict: false },
    );

    // Proceso de envío de correo con diseño profesional
    try {
      await this.mailerService.sendMail({
        to: correo,
        subject: `🔑 ${codigo} es tu código de recuperación`, // Asunto con el código para facilitar la lectura rápida
        html: `
          <div style="background-color: #f9f9f9; padding: 50px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              
              <tr>
                <td style="padding: 40px 0; text-align: center; background-color: #3f51b5;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">BANANO APP</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin-top: 0;">Restablecer contraseña</h2>
                  <p style="font-size: 16px; line-height: 1.6; color: #666;">
                    Hola, ${user.nombreCompleto} <br><br>
                    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. No te preocupes, puedes usar el siguiente código de verificación para completar el proceso:
                  </p>
                  
                  <div style="margin: 30px 0; text-align: center;">
                    <div style="display: inline-block; padding: 15px 40px; background-color: #f4f7ff; border: 2px dashed #3f51b5; border-radius: 10px;">
                      <span style="font-size: 32px; font-weight: bold; color: #3f51b5; letter-spacing: 8px;">
                        ${codigo}
                      </span>
                    </div>
                  </div>

                  <p style="font-size: 14px; color: #888; text-align: center;">
                    Este código es válido por <strong>15 minutos</strong>.<br>
                    Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 20px; background-color: #f1f1f1; text-align: center; font-size: 12px; color: #999;">
                  <p style="margin: 5px 0;">&copy; 2025 Banano App. Todos los derechos reservados.</p>
                  <p style="margin: 5px 0;">Este es un correo automático, por favor no lo respondas.</p>
                </td>
              </tr>
            </table>
          </div>
        `,
      });
    } catch (error) {
      console.error('ERROR REAL DE MAIL:', error);
      throw new InternalServerErrorException('No se pudo enviar el correo');
    }

    return { mensaje: 'Código enviado al correo' };
  }

  // --- RECUPERACIÓN PASO 2: Validar código y cambiar clave ---
async validarYResetear(dto: RestablecerConCodigoDto) {
  const user = await this.usuarioModel.findOne({ 
    correo: dto.correo.trim().toLowerCase() 
  }).lean().exec();

  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }

  const codigoBD = user['codigoRecuperacion'];
  const expiracionBD = user['codigoExpiracion'];
  const intentosBD = user['intentosRecuperacion'] || 0;

  // 1. Verificar si el código existe (Si ya se usó o se borró por intentos)
  if (!codigoBD) {
    throw new BadRequestException('El código no es válido o ya fue utilizado. Solicite uno nuevo.');
  }

  const ahora = new Date();
  const noExpirado = expiracionBD && ahora < new Date(expiracionBD);

  // 2. Si el tiempo expiró, lo borramos de la BD de una vez
  if (!noExpirado) {
    await this.usuarioModel.updateOne(
      { _id: user._id },
      { $unset: { codigoRecuperacion: 1, codigoExpiracion: 1, intentosRecuperacion: 1 } },
      { strict: false }
    );
    throw new BadRequestException('El código ha expirado. Por seguridad, debe solicitar uno nuevo.');
  }

  // 3. Validar el código de 6 dígitos
  const codigoValido = String(codigoBD) === String(dto.codigo);

  if (!codigoValido) {
    const nuevosIntentos = intentosBD + 1;
    const MAX_INTENTOS = 3;

    if (nuevosIntentos >= MAX_INTENTOS) {
      await this.usuarioModel.updateOne(
        { _id: user._id },
        { $unset: { codigoRecuperacion: 1, codigoExpiracion: 1, intentosRecuperacion: 1 } },
        { strict: false }
      );
      throw new BadRequestException('Has agotado los intentos permitidos. Solicite un nuevo código.');
    }

    await this.usuarioModel.updateOne(
      { _id: user._id },
      { $set: { intentosRecuperacion: nuevosIntentos } },
      { strict: false }
    );

    throw new BadRequestException(`Código incorrecto. Te quedan ${MAX_INTENTOS - nuevosIntentos} intentos.`);
  }

  // 4. ÉXITO: Cambio de clave y borrado de campos (Único uso)
  const claveHash = await bcrypt.hash(dto.nuevaClave, 10);
  
  await this.usuarioModel.updateOne(
    { _id: user._id },
    { 
      $set: { claveHash: claveHash },
      $unset: { codigoRecuperacion: 1, codigoExpiracion: 1, intentosRecuperacion: 1 }
    },
    { strict: false }
  );

  return { exito: true };
}
}