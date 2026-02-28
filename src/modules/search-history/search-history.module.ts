import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UsersModule } from '../users/users.module';

// Constants
import { SEARCH_HISTORY_REPOSITORY_TOKEN } from './search-history.constants';

// Application layer
import {
  GetSearchHistoryUseCase,
  AddSearchEntryUseCase,
  RemoveSearchEntryUseCase,
  ClearSearchHistoryUseCase,
  SearchHistoryApplicationService,
} from './application';

// Infrastructure layer
import { PrismaSearchHistoryRepository } from './infrastructure/persistence/repositories/prisma-search-history.repository';
import { SearchHistoryMapper } from './infrastructure/persistence/mappers/search-history.mapper';

// Presentation layer
import { SearchHistoryController } from './presentation';

@Module({
  imports: [PrismaModule, forwardRef(() => UsersModule)],
  controllers: [SearchHistoryController],
  providers: [
    // Application layer
    SearchHistoryApplicationService,
    GetSearchHistoryUseCase,
    AddSearchEntryUseCase,
    RemoveSearchEntryUseCase,
    ClearSearchHistoryUseCase,

    // Infrastructure layer
    SearchHistoryMapper,
    {
      provide: SEARCH_HISTORY_REPOSITORY_TOKEN,
      useClass: PrismaSearchHistoryRepository,
    },
  ],
  exports: [SearchHistoryApplicationService],
})
export class SearchHistoryModule {}
