import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class GoogleUserDto {
  @IsString()
  googleId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  profilePicture?: string;

  @IsString()
  accessToken?: string;
}
