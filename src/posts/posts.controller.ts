import { Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

@Controller('posts')
export class PostsController {
  @Post()
  createPost() {
    return 'post created';
  }

  @Get()
  findall() {
    return 'all posts';
  }

  @Get(':id')
  findOne(@Param(':id') id: string) {
    return `post ${id}`;
  }

  @Put(':id')
  updateOne(@Param(':id') id: string) {
    return `post ${id}`;
  }

  @Delete(':id')
  deleteOne(@Param(':id') id: string) {
    return `post ${id}`;
  }

  @Post(':id/tumbnail')
  createTumbnail(@Param(':id') id: string) {
    return `post ${id}/tumbnail`;
  }
}
