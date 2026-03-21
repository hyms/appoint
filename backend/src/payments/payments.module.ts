import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './services/payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadModule } from '../upload/upload.module';
import { NotificationSettingsModule } from '../notification-settings/notification-settings.module';

@Module({
  imports: [UploadModule, NotificationSettingsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
