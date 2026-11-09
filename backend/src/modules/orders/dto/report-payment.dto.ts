import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches, MinLength } from 'class-validator';

const NO_XSS_REGEX = /^[^<>]*$/;

export class ReportPaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'El número de comprobante o referencia de pago es obligatorio.' })
  @MinLength(4, { message: 'La referencia de transferencia debe tener al menos 4 caracteres.' })
  @MaxLength(120)
  @Matches(NO_XSS_REGEX, { message: 'La referencia contiene caracteres no permitidos.' })
  paymentReference: string;

  @IsString()
  @IsOptional()
  @MaxLength(1500)
  @Matches(NO_XSS_REGEX, { message: 'URL de comprobante inválida.' })
  paymentProofUrl?: string;
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
