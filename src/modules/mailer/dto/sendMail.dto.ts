import { IsEmail, IsString, IsOptional } from 'class-validator';

export class SendEmailDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  to: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;
}

export class SendWelcomeEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsString()
  fullname: string;
}

export class SendPasswordResetDto {
  @IsEmail()
  email: string;

  @IsString()
  resetToken: string;

  @IsString()
  username: string;
}

export class SendFriendRequestDto {
  @IsEmail()
  to: string;

  @IsString()
  senderName: string;

  @IsString()
  senderUsername: string;

  @IsString()
  receiverName: string;
}
