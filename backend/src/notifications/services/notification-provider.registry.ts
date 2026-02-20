import { Injectable, Logger } from '@nestjs/common';
import { ProviderType } from '../dto/notification.dto';
import { INotificationProvider } from '../interfaces/notification-provider.interface';

@Injectable()
export class NotificationProviderRegistry {
  private readonly logger = new Logger(NotificationProviderRegistry.name);
  private providers = new Map<ProviderType, INotificationProvider>();

  register(provider: INotificationProvider): void {
    this.providers.set(provider.type, provider);
    this.logger.log(`Registered notification provider: ${provider.type}`);
  }

  get(type: ProviderType): INotificationProvider | undefined {
    return this.providers.get(type);
  }

  getDefault(): INotificationProvider | undefined {
    return this.providers.get(ProviderType.EMAIL);
  }

  isProviderAvailable(type: ProviderType): boolean {
    const provider = this.providers.get(type);
    return provider?.isConfigured() ?? false;
  }

  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isConfigured())
      .map(([type]) => type);
  }
}
