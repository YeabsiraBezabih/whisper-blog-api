import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

@Controller()
export class CommentsController {
  @Post('/posts/:postId/comments')
  findAll(@Param('postId') postId: string) {
    return `all comment of post ${postId}`;
  }

  @Get('/posts/:postId/comments')
  findOne(@Param('postId') postId: string) {
    return `one comment of post ${postId}`;
  }

  @Patch('/comments/:id')
  updateOne(@Param('id') id: string) {
    return `one comment updated of post ${id}`;
  }

  @Delete('/comments/:id')
  removeOne(@Param('id') id: string) {
    return `one comment deleted of post ${id}`;
  }
}
