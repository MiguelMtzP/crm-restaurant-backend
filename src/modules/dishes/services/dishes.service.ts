import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dish, DishDocument } from '../schemas/dish.schema';
import { DishLog, DishLogDocument } from '../schemas/dish-log.schema';
import { CreateDishDto } from '../dto/create-dish.dto';
import { UpdateDishStatusDto } from '../dto/update-dish-status.dto';
import { DishStatus } from '../enums/dish-status.enum';
import { DishLogAction } from '../enums/dish-log-action.enum';
import { AddDishesToOrderDto } from '../dto/add-dishes-to-order.dto';
import { Order, OrderDocument } from 'src/modules/orders/schemas/order.schema';
import { Menu, MenuDocument } from 'src/modules/menu/schemas/menu.schema';
import { DishesIncluded } from '../types/dishes-included.type';
import { DishType } from '../enums/dish-type.enum';
import { decode } from 'js-base64';

@Injectable()
export class DishesService {
  constructor(
    @InjectModel(Dish.name) private dishModel: Model<DishDocument>,
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(DishLog.name) private dishLogModel: Model<DishLogDocument>,
  ) {}

  async create(createDishDto: CreateDishDto): Promise<Dish> {
    const createdDish = new this.dishModel(createDishDto);

    //TODO: Assign index to dish

    return createdDish.save();
  }

  async findAll(): Promise<Dish[]> {
    return this.dishModel
      .find()
      .populate('orderId')
      .populate('chefId', '-password')
      .exec();
  }

  async findAllByToday(): Promise<any[]> {
    const dishes = await this.dishModel
      .find({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      })
      .populate('orderId')
      .populate('chefId', '-password')
      .sort({ kitchenIndex: 1 })
      .exec();

    const menuMap = (await this.menuModel.find()).reduce(
      (acc, menu) => {
        acc[menu._id as string] = menu;
        return acc;
      },
      {} as Record<string, Menu>,
    );

    return await Promise.all(
      dishes.map(async (dish) => {
        const dishObject = dish.toObject();
        return {
          ...dishObject,
          dishMenuIds: dishObject.dishMenuIds.map((dishMenuId) => ({
            ...dishMenuId,
            dishMenuId: menuMap[dishMenuId.dishMenuId as string],
          })),
        };
      }),
    );
  }

  async findOne(id: string): Promise<DishDocument> {
    const dish = await this.dishModel
      .findById(id)
      .populate('orderId')
      .populate('chefId', '-password')
      .exec();

    if (!dish) {
      throw new NotFoundException(`Dish with ID ${id} not found`);
    }
    return dish;
  }

  async findByOrderForClient(orderIdEncoded: string): Promise<Dish[]> {
    const orderId = decode(orderIdEncoded);
    if (!orderId) {
      throw new NotFoundException(`Order with ID ${orderIdEncoded} not found`);
    }
    const dishes = await this.dishModel
      .find({ orderId })
      .populate('orderId')
      .populate('chefId', '-password')
      .exec();
    return this.populateDishMenuIds(dishes);
  }

  async findByOrder(orderId: string): Promise<Dish[]> {
    const dishes = await this.dishModel
      .find({ orderId })
      .populate('orderId')
      .populate('chefId', '-password')
      .exec();
    return this.populateDishMenuIds(dishes);
  }

  async findByChef(chefId: string): Promise<Dish[]> {
    return this.dishModel
      .find({ chefId })
      .populate('orderId')
      .populate('chefId', '-password')
      .exec();
  }

  async findByStatus(status: DishStatus): Promise<Dish[]> {
    return this.dishModel
      .find({ status })
      .populate('orderId')
      .populate('chefId', '-password')
      .exec();
  }

  async updateStatus(
    id: string,
    updateDishStatusDto: UpdateDishStatusDto,
    userId: string,
  ): Promise<Dish> {
    const dish = await this.findOne(id);
    const oldStatus = dish.status;

    // Validate status transition
    if (dish.status === DishStatus.DELIVERED) {
      throw new BadRequestException('Cannot modify a delivered dish');
    }

    // Validate conflict reason
    if (
      updateDishStatusDto.status === DishStatus.CONFLICT &&
      !updateDishStatusDto.conflictReason
    ) {
      throw new BadRequestException(
        'Conflict reason is required when setting status to conflict',
      );
    }

    //TODO: if status is working on, assign chef to dish

    // Update dish status
    dish.status = updateDishStatusDto.status;
    if (updateDishStatusDto.conflictReason) {
      dish.conflictReason = updateDishStatusDto.conflictReason;
    }

    // Create log entry
    await this.createLog(
      id,
      DishLogAction.CHANGE_STATUS,
      `Status changed from ${oldStatus} to ${updateDishStatusDto.status}`,
      userId,
    );

    return dish.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    const dish = await this.findOne(id);

    if (dish.status !== DishStatus.IN_ROW && !dish.isAutoDelivered) {
      throw new BadRequestException(
        'Can only delete dishes that are in row status',
      );
    }

    // Create log entry before deletion
    await this.createLog(id, DishLogAction.DELETE_DISH, 'Dish deleted', userId);

    await this.dishModel.findByIdAndDelete(id).exec();

    await this.dishModel.deleteMany({ complementOfDishId: id }).exec();

    await this.updateOrderAccount(dish.orderId as unknown as string);
  }

  private async createLog(
    dishId: string,
    actionType: DishLogAction,
    value: string,
    userId: string,
  ): Promise<DishLog> {
    const log = new this.dishLogModel({
      dishId,
      actionType,
      value,
      userId,
    });
    return log.save();
  }

  async getDishLogs(dishId: string): Promise<DishLog[]> {
    return this.dishLogModel
      .find({ dishId })
      .populate('userId', '-password')
      .exec();
  }

  async addDishesToOrder(
    addDishesToOrderDto: AddDishesToOrderDto,
  ): Promise<Dish[]> {
    const today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);

    const [lastDish] = await this.dishModel
      .find({
        createdAt: { $gte: today },
      })
      .sort({ kitchenIndex: -1 })
      .exec();

    const lastIndex = lastDish?.kitchenIndex || 0;
    let dishCounter = 0;
    const dishesToAdd = addDishesToOrderDto.dishes.map((dish, idxDish) => {
      if (!dish.isAutoDelivered) {
        dishCounter++;
      }
      if (dishCounter % 2 === 0 && !dish.isAutoDelivered) {
        dish.dishMenuIds[0].notes += ', \nIncluye Tortillas!';
      }
      return {
        ...dish,
        kitchenIndex: lastIndex + idxDish + 1,
        status: dish.isAutoDelivered
          ? DishStatus.TO_PICKUP
          : (dish.status ?? DishStatus.IN_ROW),
      };
    });

    const dishes = await this.dishModel.insertMany(dishesToAdd);

    const compoundsDishes = dishes.filter(
      (dish) => dish.type === DishType.COMPOUND,
    );
    if (compoundsDishes.length) {
      const complements: CreateDishDto[] = [];
      const [coffe, tea, fruit] = await Promise.all([
        this.menuModel.findOne({ name: 'Cafe de paquete' }),
        this.menuModel.findOne({ name: 'Te de paquete' }),
        this.menuModel.findOne({ name: 'Fruta de paquete' }),
      ]);
      if (coffe && tea && fruit) {
        compoundsDishes.forEach((dish) => {
          complements.push({
            dishMenuIds: [
              { dishMenuId: fruit?._id as string, attributesSelected: [] },
            ],
            orderId: dish.orderId,
            type: DishType.SINGLE,
            status: DishStatus.TO_PICKUP,
            isAutoDelivered: true,
            cost: 0,
            kitchenIndex: dish.kitchenIndex,
            complementOfDishId: dish._id as Types.ObjectId,
          });
          complements.push({
            dishMenuIds: [
              {
                dishMenuId: dish.isComplementCoffe
                  ? (coffe?._id as string)
                  : (tea?._id as string),
                attributesSelected: [],
              },
            ],
            orderId: dish.orderId,
            type: DishType.SINGLE,
            isAutoDelivered: true,
            status: DishStatus.TO_PICKUP,
            cost: 0,
            kitchenIndex: dish.kitchenIndex,
            complementOfDishId: dish._id as Types.ObjectId,
          });
        });
        await this.dishModel.insertMany(complements);
      }
    }

    if (dishes.length) {
      await this.updateOrderAccount(dishes[0].orderId as unknown as string);
    }

    return dishes as Dish[];
  }

  async assignChefToDish(dishId: string, chefId: string): Promise<Dish> {
    const dish = await this.dishModel.findByIdAndUpdate(
      dishId,
      { chefId, status: DishStatus.WORKING_ON },
      { new: true },
    );
    if (!dish) {
      throw new NotFoundException(`Dish with ID ${dishId} not found`);
    }
    return dish;
  }
  async updateDishStatus(dishId: string, status: DishStatus): Promise<Dish> {
    const dish = await this.dishModel.findByIdAndUpdate(
      dishId,
      { status },
      { new: true },
    );
    if (!dish) {
      throw new NotFoundException(`Dish with ID ${dishId} not found`);
    }
    return dish;
  }
  async updateOrderAccount(orderId: string): Promise<Order> {
    const dishes = await this.dishModel.find({ orderId });
    const order = await this.orderModel.findById(orderId);
    const customCharges =
      order?.customCharges?.reduce(
        (acc, customCharge) => acc + customCharge.amount,
        0,
      ) ?? 0;
    const account =
      dishes.reduce((acc, dish) => acc + dish.cost, 0) + customCharges;
    const orderUpdated = await this.orderModel.findByIdAndUpdate(
      orderId,
      { account: account },
      { new: true },
    );

    if (!orderUpdated) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return orderUpdated;
  }

  private async populateDishMenuIds(dishes: DishDocument[]): Promise<Dish[]> {
    const menuMap = (await this.menuModel.find()).reduce(
      (acc, menu) => {
        acc[menu._id as string] = menu;
        return acc;
      },
      {} as Record<string, Menu>,
    );

    return await Promise.all(
      dishes.map(async (dish) => {
        const dishObject = dish.toObject();
        return {
          ...dishObject,
          dishMenuIds: dishObject.dishMenuIds.map(
            (dishMenuId: DishesIncluded) => ({
              ...dishMenuId,
              dishMenuId: menuMap[dishMenuId.dishMenuId as string],
            }),
          ),
        };
      }),
    );
  }

  async getMetrics(from: string, to: string): Promise<any[]> {
    // Convertir strings a objetos Date
    const fromDate = new Date(from);
    const toDate = new Date(to);
    // Ajustar toDate para incluir todo el día final (hasta las 23:59:59.999)
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    const ordersInPeriod = (
      await this.orderModel.find(
        {
          createdAt: {
            $gte: fromDate,
            $lte: toDate,
          },
          status: {
            $ne: 'cancelled',
          },
        },
        { _id: 1 },
      )
    ).map((order) => order._id);

    const pipeline: any[] = [
      { $match: { orderId: { $in: ordersInPeriod } } },
      {
        $group: {
          _id: 'metrics',
          packages: {
            $sum: {
              $cond: [{ $eq: ['$type', 'compound'] }, 1, 0],
            },
          },
          single: {
            $sum: {
              $cond: [{ $eq: ['$type', 'single'] }, 1, 0],
            },
          },
        },
      },
    ];
    const [metrics] = await this.dishModel.aggregate(pipeline).exec();
    return metrics ?? {};
  }
}
