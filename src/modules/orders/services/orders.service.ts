import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentType } from '../enums/payment-type.enum';
import { DishesService } from 'src/modules/dishes/services/dishes.service';
import { Dish, DishDocument } from 'src/modules/dishes/schemas/dish.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Dish.name) private dishModel: Model<DishDocument>,
    private dishesService: DishesService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Check if table is already in use
    const existingOrder = await this.orderModel.findOne({
      table: createOrderDto.table,
      status: { $in: [OrderStatus.OPEN, OrderStatus.PAYING] },
    });

    if (existingOrder) {
      throw new ConflictException(
        `Table ${createOrderDto.table} is already in use`,
      );
    }

    const createdOrder = new this.orderModel(createOrderDto);
    return createdOrder.save();
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().populate('waiterId', '-password').exec();
  }

  async findOne(id: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(id)
      .populate('waiterId', '-password')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async findByWaiter(waiterId: string): Promise<Order[]> {
    return this.orderModel
      .find({ waiterId })
      .populate('waiterId', '-password')
      .exec();
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderModel
      .find({ status })
      .populate('waiterId', '-password')
      .exec();
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOne(id);

    // Validate status transition
    if (
      order.status === OrderStatus.CLOSED &&
      updateOrderStatusDto.status !== OrderStatus.CLOSED
    ) {
      throw new BadRequestException('Cannot modify a closed order');
    }

    if (
      updateOrderStatusDto.status === OrderStatus.CLOSED &&
      !order.paymentType
    ) {
      throw new BadRequestException('Cannot close an order without payment');
    }

    // Additional validation for closing orders
    if (
      updateOrderStatusDto.status === OrderStatus.CLOSED &&
      order.account <= 0
    ) {
      throw new BadRequestException('Cannot close an order with no account');
    }

    order.status = updateOrderStatusDto.status;
    return order.save();
  }

  //despues de que solicito la cuenta de la orden, se puede procesar el pago
  async processPayment(
    id: string,
    processPaymentDto: ProcessPaymentDto,
  ): Promise<Order> {
    await this.dishesService.updateOrderAccount(id);

    const order = await this.findOne(id);

    if (order.status === OrderStatus.CLOSED) {
      throw new BadRequestException(
        'Cannot process payment for a closed order',
      );
    }
    if (order.status !== OrderStatus.PAYING) {
      throw new BadRequestException(
        'Cannot process payment for an order that is not paying',
      );
    }

    if (order.account <= 0) {
      throw new BadRequestException(
        'Cannot process payment for an empty order',
      );
    }

    // Validate payment type specific requirements
    switch (processPaymentDto.paymentType) {
      case PaymentType.CARD:
        if (!processPaymentDto.cardTxNumber) {
          throw new BadRequestException(
            'Card transaction number is required for card payments',
          );
        }
        break;
      case PaymentType.CASH:
        if (!processPaymentDto.cashReceived) {
          throw new BadRequestException(
            'Cash received amount is required for cash payments',
          );
        }
        if (processPaymentDto.cashReceived < order.account) {
          throw new BadRequestException('Insufficient cash received');
        }
        order.cashReturned = processPaymentDto.cashReceived - order.account;
        break;
      case PaymentType.TRANSFER:
        // No additional validation needed for transfers
        break;
    }

    order.paymentType = processPaymentDto.paymentType;
    order.cardTxNumber = processPaymentDto.cardTxNumber || 0;
    order.cashReceived = processPaymentDto.cashReceived || 0;
    order.status = OrderStatus.CLOSED;
    return order.save();
  }

  async cancelOrder(id: string, cancelReason: string): Promise<Order> {
    const order = await this.findOne(id);
    order.status = OrderStatus.CANCELLED;
    order.cancelReason = cancelReason;
    await this.dishModel.deleteMany({ orderId: id });
    return order.save();
  }
}
