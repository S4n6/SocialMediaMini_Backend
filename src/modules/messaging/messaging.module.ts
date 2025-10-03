import { Module } from '@nestjs/common';
import { MessagingInfrastructureModule } from './infrastructure/messaging-infrastructure.module';
import { MessagingApplicationModule } from './application/messaging-application.module';
import { MessagingPresentationModule } from './presentation/messaging-presentation.module';

@Module({
  imports: [
    MessagingInfrastructureModule,
    MessagingApplicationModule,
    MessagingPresentationModule,
  ],
  exports: [MessagingInfrastructureModule, MessagingApplicationModule],
})
export class MessagingModule {}
