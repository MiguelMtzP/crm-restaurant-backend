import {
  Controller,
  Get,
  Post,
  Param,
  Put,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-roles.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.GERENTE)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.GERENTE)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('role')
  findByRole(@Query('role') role: UserRole) {
    return this.usersService.findByRole(role);
  }

  @Get('active/role')
  @Roles(UserRole.GERENTE, UserRole.COCINERO)
  findActiveByRole(@Query('role') role: UserRole) {
    return this.usersService.findActiveByRole(role);
  }

  @Get(':id')
  @Roles(UserRole.GERENTE)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.GERENTE)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/status')
  @Roles(UserRole.GERENTE)
  updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.usersService.updateStatus(id, isActive);
  }
}
