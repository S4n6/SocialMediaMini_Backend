import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UsersModule } from '../users/users.module';

// Domain layer
import { SearchHistoryDomainService } from './domain';

// Tokens
import { SEARCH_HISTORY_REPOSITORY } from './tokens';

// Application layer
import {
  GetSearchHistoryUseCase,
  AddSearchEntryUseCase,
  RemoveSearchEntryUseCase,
  ClearSearchHistoryUseCase,
  SearchHistoryApplicationService,
} from './application';

// Infrastructure layer
import { PrismaSearchHistoryRepository } from './infrastructure';

// Presentation layer
import { SearchHistoryController } from './presentation';

@Module({
  imports: [PrismaModule, forwardRef(() => UsersModule)],
  controllers: [SearchHistoryController],
  providers: [
    // Domain layer
    SearchHistoryDomainService,

    // Application layer
    GetSearchHistoryUseCase,
    AddSearchEntryUseCase,
    RemoveSearchEntryUseCase,
    ClearSearchHistoryUseCase,
    SearchHistoryApplicationService,

    // Infrastructure layer
    {
      provide: SEARCH_HISTORY_REPOSITORY,
      useClass: PrismaSearchHistoryRepository,
    },
  ],
  exports: [SearchHistoryApplicationService],
})
export class SearchHistoryModule {}
