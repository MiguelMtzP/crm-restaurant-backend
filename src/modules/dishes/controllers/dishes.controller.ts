import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DishesService } from '../services/dishes.service';
import { CreateDishDto } from '../dto/create-dish.dto';
import { UpdateDishStatusDto } from '../dto/update-dish-status.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/enums/user-roles.enum';
import { DishStatus } from '../enums/dish-status.enum';
import { UserDocument } from '../../auth/schemas/user.schema';
import { AddDishesToOrderDto } from '../dto/add-dishes-to-order.dto';
import { AddChefToDishDto } from '../dto/add-chef-to-dish.dto';
import { Public } from 'src/modules/auth/decorators/public.decorator';

@Controller('dishes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Post()
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  create(@Body() createDishDto: CreateDishDto) {
    return this.dishesService.create(createDishDto);
  }

  @Get()
  @Roles(UserRole.MESERO, UserRole.COCINERO, UserRole.GERENTE)
  findAll() {
    return this.dishesService.findAll();
  }

  @Get('metrics')
  @Roles(UserRole.GERENTE)
  getMetrics(@Query('from') from: string, @Query('to') to: string) {
    return this.dishesService.getMetrics(from, to);
  }

  @Get('today')
  @Roles(UserRole.MESERO, UserRole.COCINERO, UserRole.GERENTE)
  findAllByToday() {
    return this.dishesService.findAllByToday();
  }

  @Get('client/order/:encodedOrderId')
  @Public()
  findAllByOrder(@Param('encodedOrderId') encodedOrderId: string) {
    return this.dishesService.findByOrderForClient(encodedOrderId);
  }

  @Get('order/:orderId')
  @Roles(UserRole.MESERO, UserRole.COCINERO, UserRole.GERENTE)
  findByOrder(@Param('orderId') orderId: string) {
    return this.dishesService.findByOrder(orderId);
  }

  @Get('chef/:chefId')
  @Roles(UserRole.COCINERO, UserRole.GERENTE)
  findByChef(@Param('chefId') chefId: string) {
    return this.dishesService.findByChef(chefId);
  }

  @Get('status')
  @Roles(UserRole.MESERO, UserRole.COCINERO, UserRole.GERENTE)
  findByStatus(@Query('status') status: DishStatus) {
    return this.dishesService.findByStatus(status);
  }

  @Get(':id')
  @Roles(UserRole.MESERO, UserRole.COCINERO, UserRole.GERENTE)
  findOne(@Param('id') id: string) {
    return this.dishesService.findOne(id);
  }

  @Get(':id/logs')
  @Roles(UserRole.GERENTE)
  getDishLogs(@Param('id') id: string) {
    return this.dishesService.getDishLogs(id);
  }

  @Put(':id/status')
  @Roles(UserRole.MESERO, UserRole.COCINERO, UserRole.GERENTE)
  updateStatus(
    @Param('id') id: string,
    @Body() updateDishStatusDto: UpdateDishStatusDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.dishesService.updateStatus(
      id,
      updateDishStatusDto,
      user._id as string,
    );
  }

  @Delete(':id')
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.dishesService.remove(id, user._id as string);
  }

  @Post('dishes-to-order')
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  addDishesToOrder(@Body() addDishesToOrderDto: AddDishesToOrderDto) {
    return this.dishesService.addDishesToOrder(addDishesToOrderDto);
  }

  @Put(':id/chef')
  @Roles(UserRole.COCINERO, UserRole.GERENTE)
  assignChefToDish(
    @Param('id') id: string,
    @Body() addChefToDishDto: AddChefToDishDto,
  ) {
    return this.dishesService.assignChefToDish(id, addChefToDishDto.chefId);
  }
}
