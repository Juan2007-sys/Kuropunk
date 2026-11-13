import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches, MinLength } from 'class-validator';

const NO_XSS_REGEX = /^[^<>]*$/;
const VALID_PROOF_URL_REGEX =
  /^(data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+|https:\/\/[^\s<>"]+)$/;

export class ReportPaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'El número de comprobante o referencia de pago es obligatorio.' })
  @MinLength(4, { message: 'La referencia de transferencia debe tener al menos 4 caracteres.' })
  @MaxLength(120)
  @Matches(NO_XSS_REGEX, { message: 'La referencia contiene caracteres no permitidos.' })
  paymentReference: string;

  @IsString()
  @IsNotEmpty({ message: 'Debes adjuntar la foto o captura del comprobante de transferencia.' })
  @MaxLength(60000)
  @Matches(VALID_PROOF_URL_REGEX, {
    message: 'La captura del comprobante debe ser una imagen válida (JPEG, PNG o WebP).',
  })
  paymentProofUrl: string;
}

export class VerifyDepositDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(CONFIRM|REJECT)$/i, { message: 'La acción debe ser CONFIRM o REJECT.' })
  action: 'CONFIRM' | 'REJECT';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Matches(NO_XSS_REGEX)
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'El estado de la orden es obligatorio.' })
  @MaxLength(40)
  @Matches(NO_XSS_REGEX)
  status: string;
}
