import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { UserRole } from '../../auth/enums/user-roles.enum';
import { OrderStatus } from '../enums/order-status.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserDocument } from '../../auth/schemas/user.schema';
import { ObjectId } from 'mongoose';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { CustomChargeDto } from '../dto/custom-charge.dto';
import { RemoveCustomChargeDto } from '../dto/remove-custom-charge.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: UserDocument,
  ) {
    createOrderDto.waiterId = user._id as ObjectId;
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('waiter/:waiterId')
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  findByWaiter(@Param('waiterId') waiterId: string) {
    return this.ordersService.findByWaiter(waiterId);
  }

  @Get('status')
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  findByStatus(@Query('status') status: OrderStatus) {
    return this.ordersService.findByStatus(status);
  }

  @Get('client/:encodedOrderId')
  @Public()
  findOnePublic(@Param('encodedOrderId') encodedOrderId: string) {
    return this.ordersService.findOneForClient(encodedOrderId);
  }

  @Get(':id')
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Put(':id/status')
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  @Put('client/:encodedOrderId/status')
  @Public()
  updateStatusFromTicket(
    @Param('encodedOrderId') encodedOrderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatusFromTicket(
      encodedOrderId,
      updateOrderStatusDto,
    );
  }

  @Put(':id/payment')
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  processPayment(
    @Param('id') id: string,
    @Body() processPaymentDto: ProcessPaymentDto,
  ) {
    return this.ordersService.processPayment(id, processPaymentDto);
  }

  @Delete(':id/cancel')
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  cancelOrder(@Param('id') id: string, @Body() cancelOrderDto: CancelOrderDto) {
    return this.ordersService.cancelOrder(id, cancelOrderDto.cancelReason);
  }

  @Post(':id/custom-charges')
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  addCustomCharge(
    @Param('id') id: string,
    @Body() customChargeDto: CustomChargeDto,
  ) {
    return this.ordersService.addCustomCharge(id, customChargeDto);
  }

  @Put(':id/custom-charges')
  @Roles(UserRole.MESERO, UserRole.GERENTE)
  removeCustomCharge(
    @Param('id') id: string,
    @Body() removeCustomChargeDto: RemoveCustomChargeDto,
  ) {
    return this.ordersService.removeCustomCharge(
      id,
      removeCustomChargeDto.chargeId,
    );
  }
}
