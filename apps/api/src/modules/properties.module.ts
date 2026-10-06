import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Post, Query, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ArrayMaxSize, IsArray, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ListingStatus, PropertyPurpose, PropertyType } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PrismaService } from './prisma.service'
import { AuthGuard, AuthUser, CurrentUser, Roles, RolesGuard } from './access'
import { AuthModule } from './auth.module'

class PropertyQueryDto {
  @IsOptional() @IsString() city?: string
  @IsOptional() @IsEnum(PropertyType) type?: PropertyType
  @IsOptional() @IsEnum(PropertyPurpose) purpose?: PropertyPurpose
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minBedrooms?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minBathrooms?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minArea?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxArea?: number
  @IsOptional() @IsIn(['newest', 'price-asc', 'price-desc', 'area-desc']) sort?: string
  @IsOptional() @IsString() ids?: string
  @IsOptional() @IsString() @MaxLength(100) q?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) skip?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) take?: number
}

class CreatePropertyDto {
  @IsString() @MaxLength(100) title!: string
  @IsString() @MaxLength(3000) description!: string
  @IsString() city!: string
  @IsString() community!: string
  @IsEnum(PropertyPurpose) purpose!: PropertyPurpose
  @IsEnum(PropertyType) type!: PropertyType
  @Type(() => Number) @IsNumber() @Min(1) price!: number
  @Type(() => Number) @IsInt() @Min(0) bedrooms!: number
  @Type(() => Number) @IsInt() @Min(0) bathrooms!: number
  @Type(() => Number) @IsInt() @Min(1) areaSqft!: number
  @IsString() @MaxLength(500) imageUrl!: string
  @IsOptional() @IsString() @MaxLength(240) streetAddress?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) floors?: number
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) galleryUrls?: string[]
}

@Injectable()
class PropertiesService {
  constructor(private db: PrismaService) {}
  list(query: PropertyQueryDto) {
    const ids = query.ids?.split(',').filter(Boolean)
    return this.db.property.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
        ...(query.city || query.q ? { AND: [
          ...(query.city ? [{ OR: [{ city: { contains: query.city, mode: 'insensitive' as const } }, { community: { contains: query.city, mode: 'insensitive' as const } }] }] : []),
          ...(query.q ? [{ OR: [{ title: { contains: query.q, mode: 'insensitive' as const } }, { city: { contains: query.q, mode: 'insensitive' as const } }, { community: { contains: query.q, mode: 'insensitive' as const } }] }] : []),
        ] } : {}),
        ...(query.type ? { type: query.type as PropertyType } : {}),
        ...(query.purpose ? { purpose: query.purpose as PropertyPurpose } : {}),
        ...(query.minPrice || query.maxPrice ? { price: { ...(query.minPrice ? { gte: query.minPrice } : {}), ...(query.maxPrice ? { lte: query.maxPrice } : {}) } } : {}),
        ...(query.minBedrooms ? { bedrooms: { gte: query.minBedrooms } } : {}),
        ...(query.minBathrooms ? { bathrooms: { gte: query.minBathrooms } } : {}),
        ...(query.minArea || query.maxArea ? { areaSqft: { ...(query.minArea ? { gte: query.minArea } : {}), ...(query.maxArea ? { lte: query.maxArea } : {}) } } : {}),
        ...(ids ? { id: { in: ids } } : {}),
      },
      orderBy: query.sort === 'price-asc' ? { price: 'asc' } : query.sort === 'price-desc' ? { price: 'desc' } : query.sort === 'area-desc' ? { areaSqft: 'desc' } : { createdAt: 'desc' }, skip: query.skip || 0, take: Math.min(query.take || 200, 200),
    })
  }
  async bySlug(slug: string) { const property = await this.db.property.findFirst({ where: { slug, status: ListingStatus.PUBLISHED } }); if (!property) throw new NotFoundException('Property not found'); return property }
  review(organizationId: string) { return this.db.property.findMany({ where: { organizationId, status: ListingStatus.PENDING_REVIEW }, orderBy: { createdAt: 'asc' } }) }
  favorites(userId: string) { return this.db.savedProperty.findMany({ where: { userId, property: { status: ListingStatus.PUBLISHED } }, include: { property: true }, orderBy: { createdAt: 'desc' } }).then((items) => items.map((item) => item.property)) }
  async save(userId: string, id: string) {
    const property = await this.db.property.findFirst({ where: { id, status: ListingStatus.PUBLISHED } })
    if (!property) throw new NotFoundException('Published property not found')
    return this.db.savedProperty.upsert({ where: { userId_propertyId: { userId, propertyId: id } }, update: {}, create: { userId, propertyId: id } })
  }
  async unsave(userId: string, id: string) {
    await this.db.savedProperty.deleteMany({ where: { userId, propertyId: id } })
    return { saved: false }
  }
  async create(dto: CreatePropertyDto, user: AuthUser) {
    const mediaUrls = [dto.imageUrl, ...(dto.galleryUrls || [])]
    if (mediaUrls.some((url) => !url.startsWith('/api/properties/media/') && !url.startsWith('https://'))) throw new BadRequestException('Property media must be uploaded or use a secure HTTPS URL')
    const slugBase = dto.title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 65)
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`
    return this.db.property.create({ data: { ...dto, slug, organizationId: user.organizationId, createdById: user.sub, status: ListingStatus.PENDING_REVIEW } })
  }
  async decide(id: string, user: AuthUser, status: ListingStatus) {
    const found = await this.db.property.findFirst({ where: { id, organizationId: user.organizationId, status: ListingStatus.PENDING_REVIEW } })
    if (!found) throw new NotFoundException('Pending listing not found in your organization')
    const updated = await this.db.property.update({ where: { id }, data: { status, verified: status === ListingStatus.PUBLISHED } })
    await this.db.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.sub, action: `listing.${status.toLowerCase()}`, entity: 'Property', entityId: id } })
    return updated
  }
}

@ApiTags('properties')
@Controller('properties')
class PropertiesController {
  constructor(private properties: PropertiesService) {}
  @Get() list(@Query() query: PropertyQueryDto) { return this.properties.list(query) }
  @Post('media') @ApiBearerAuth() @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT', 'BUYER', 'TENANT', 'SALES_MANAGER', 'DEVELOPER', 'FINANCE', 'VENDOR') @UseInterceptors(FilesInterceptor('files', 8, { storage: memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 8 } }))
  async uploadMedia(@Body('kind') kind: string, @Body('totalBytes') totalBytes: string, @UploadedFiles() files: Array<{ buffer: Buffer; size: number; mimetype: string }>) {
    files ||= []
    const total = files.reduce((sum, file) => sum + file.size, 0)
    if (!files.length || total > 50 * 1024 * 1024 || Number(totalBytes) !== total) throw new BadRequestException('Choose up to 50 MB of media for this property')
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }
    if (files.some((file) => !extensions[file.mimetype])) throw new BadRequestException('Use JPG, PNG, WebP, AVIF, MP4, WebM, or MOV media')
    const directory = process.env.MEDIA_DIR || join(process.cwd(), 'uploads')
    await mkdir(directory, { recursive: true })
    const urls = await Promise.all(files.map(async (file) => {
      const filename = `${randomUUID()}.${extensions[file.mimetype]}`
      await writeFile(join(directory, filename), file.buffer, { flag: 'wx' })
      return `/api/properties/media/${filename}`
    }))
    return { urls, kind: kind === 'avatar' ? 'avatar' : 'property' }
  }
  @Get('media/:filename') media(@Param('filename') filename: string, @Res() response: any) {
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp|avif|mp4|webm|mov)$/i.test(filename)) throw new NotFoundException('Media not found')
    response.sendFile(filename, { root: process.env.MEDIA_DIR || join(process.cwd(), 'uploads') })
  }
  @Get('favorites') @ApiBearerAuth() @UseGuards(AuthGuard) favorites(@CurrentUser() user: AuthUser) { return this.properties.favorites(user.sub) }
  @Post(':id/favorite') @ApiBearerAuth() @UseGuards(AuthGuard) save(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.properties.save(user.sub, id) }
  @Delete(':id/favorite') @ApiBearerAuth() @UseGuards(AuthGuard) unsave(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.properties.unsave(user.sub, id) }
  @Get('review') @ApiBearerAuth() @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN') review(@CurrentUser() user: AuthUser) { return this.properties.review(user.organizationId) }
  @Get('slug/:slug') bySlug(@Param('slug') slug: string) { return this.properties.bySlug(slug) }
  @Post() @ApiBearerAuth() @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT') create(@Body() dto: CreatePropertyDto, @CurrentUser() user: AuthUser) { return this.properties.create(dto, user) }
  @Post(':id/approve') @ApiBearerAuth() @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN') approve(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.properties.decide(id, user, ListingStatus.PUBLISHED) }
  @Post(':id/reject') @ApiBearerAuth() @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN') reject(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.properties.decide(id, user, ListingStatus.REJECTED) }
}

@Module({ imports: [AuthModule], controllers: [PropertiesController], providers: [PropertiesService, AuthGuard, RolesGuard] })
export class PropertiesModule {}
