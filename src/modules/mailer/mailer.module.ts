// src/modules/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from './mailer.service';
import { MailerController } from './mailer.controller';
import mailerConfig from 'src/config/mailer.config';


@Module({
  imports: [
    ConfigModule.forFeature(mailerConfig),
  ],
  controllers: [MailerController],
  providers: [MailerService],
  exports: [MailerService], // Export for use in other modules
})
export class MailerModule {}