import { Controller, Delete, Get, Post, Param } from '@nestjs/common';

@Controller('tags')
export class TagsController {
  @Post()
  createTag() {
    return 'tag created';
  }
  @Get()
  findAll() {
    return 'all tags';
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string) {
    return `tag ${id} deleted`;
  }
}
