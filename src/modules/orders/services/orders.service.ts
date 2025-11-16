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
import { CustomChargeDto } from '../dto/custom-charge.dto';
import { decode } from 'js-base64';
import { UpdateOrderDto } from '../dto/update-order.dto';

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

  async findOneForClient(encodedOrderId: string): Promise<OrderDocument> {
    const orderId = decode(encodedOrderId);
    if (!orderId) {
      throw new NotFoundException(
        `Order with the encoded ID ${encodedOrderId} not found`,
      );
    }
    const order = await this.orderModel
      .findById(orderId)
      .populate('waiterId', '-password')
      .exec();

    if (!order) {
      throw new NotFoundException(
        `Order with the encoded ID ${encodedOrderId} not found`,
      );
    }
    return order;
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

  async updateStatusFromTicket(
    encodedOrderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const orderId = decode(encodedOrderId);
    if (!orderId) {
      throw new NotFoundException(
        `Order with the encoded ID ${encodedOrderId} not found`,
      );
    }
    return this.updateStatus(orderId, updateOrderStatusDto);
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
    order.paymentType = updateOrderStatusDto.paymentType || order.paymentType;
    return order.save();
  }

  //despues de que solicito la cuenta de la orden, se puede procesar el pago
  async processPayment(
    id: string,
    processPaymentDto: ProcessPaymentDto,
  ): Promise<Order> {
    if (processPaymentDto.customCharges) {
      await this.orderModel.updateOne(
        { _id: id },
        {
          $set: { customCharges: processPaymentDto.customCharges },
        },
      );
    }

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
    order.tip = processPaymentDto.tip || 0;
    return order.save();
  }

  async cancelOrder(id: string, cancelReason: string): Promise<Order> {
    const order = await this.findOne(id);
    order.status = OrderStatus.CANCELLED;
    order.cancelReason = cancelReason;
    await this.dishModel.deleteMany({ orderId: id });
    return order.save();
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    order.table = updateOrderDto.table || order.table;
    order.people = updateOrderDto.people || order.people;
    return order.save();
  }

  async addCustomCharge(
    id: string,
    customChargeDto: CustomChargeDto,
  ): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.CLOSED) {
      throw new BadRequestException('Cannot add charges to a closed order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot add charges to a cancelled order');
    }

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        id,
        { $push: { customCharges: customChargeDto } },
        { new: true },
      )
      .populate('waiterId', '-password')
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return updatedOrder;
  }

  async removeCustomCharge(id: string, chargeId: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.CLOSED) {
      throw new BadRequestException(
        'Cannot remove charges from a closed order',
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot remove charges from a cancelled order',
      );
    }

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        id,
        { $pull: { customCharges: { _id: chargeId } } },
        { new: true },
      )
      .populate('waiterId', '-password')
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return updatedOrder;
  }

  async getAvailableTables(): Promise<number[]> {
    // Obtener todas las órdenes con status OPEN o PAYING
    const occupiedOrders = await this.orderModel.find({
      status: { $in: [OrderStatus.OPEN, OrderStatus.PAYING] },
    });

    // Extraer los números de mesa ocupados
    const occupiedTables = occupiedOrders.map((order) => order.table);

    // Generar universo de 21 mesas (1-21)
    const allTables = Array.from({ length: 21 }, (_, i) => i + 1);

    // Filtrar las mesas disponibles
    const availableTables = allTables.filter(
      (table) => !occupiedTables.includes(table),
    );

    return availableTables;
  }

  async getMetrics(from: string, to: string): Promise<any[]> {
    // Convertir strings a objetos Date
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const pipeline: any[] = [
      {
        $match: {
          createdAt: {
            $gte: fromDate,
            $lte: toDate,
          },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: 'metrics',
          tables: { $sum: 1 },
          people: { $sum: '$people' },
          accounts: { $sum: '$account' },
          tips: { $sum: '$tip' },
        },
      },
    ];
    const pipelineAmountOrders: any[] = [
      {
        $match: {
          createdAt: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
      {
        $group: {
          _id: 'amountOrders',
          openOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.OPEN] }, 1, 0] },
          },
          closedOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.CLOSED] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 1, 0],
            },
          },
          payingOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.PAYING] }, 1, 0] },
          },
        },
      },
    ];
    const [metrics] = await this.orderModel.aggregate(pipeline).exec();
    const [byStatus] = await this.orderModel
      .aggregate(pipelineAmountOrders)
      .exec();

    return { ...(metrics ?? {}), ...(byStatus ?? {}) };
  }
}
