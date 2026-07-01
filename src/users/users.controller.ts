import { Controller, Delete, Get, Param, Patch } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  getUsers() {
    return '/users';
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return `/users/${id}`;
  }

  @Patch(':id')
  updateUserById(@Param('id') id: string) {
    return `/users/${id}`;
  }

  @Delete(':id')
  deleteUserById(@Param('id') id: string) {
    return `/users/${id}`;
  }
}
