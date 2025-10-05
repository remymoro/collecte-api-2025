import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { MagasinsService } from '../services/magasins.service';
import { UpdateMagasinDto } from '../dto/update-magasin.dto';
import { CreateMagasinDto } from '../dto/create-magasin.dto';
import type { Express } from 'express';
import type { PaginationQuery } from 'src/shared/interfaces/pagination-query.interface';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('magasins')
export class MagasinsController {
  constructor(private readonly service: MagasinsService) {}

  @Get('centre/:centreId')
  listByCentrePaginated(
    @Param('centreId', ParseIntPipe) centreId: number,
    @Query() query: PaginationQuery,
  ) {
    return this.service.findByCentrePaginated(centreId, query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  // Mettre à jour un magasin
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMagasinDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch('collecte/:collecteId/bulk-toggle')
  async bulkToggleCollecte(
    @Param('collecteId', ParseIntPipe) collecteId: number,
    @Body() body: { magasinIds: number[], enabled: boolean }
  ) {
    return await this.service.bulkToggleCollecte(body.magasinIds, collecteId, body.enabled);
  }

  @Post()
  create(@Body() dto: CreateMagasinDto) {
    return this.service.create(dto);
  }

    @Post(':id/image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } })) // 5 Mo
  uploadImage(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadMagasinImage(id, file);
  }
}