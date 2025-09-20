import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DishesController } from './controllers/dishes.controller';
import { DishesService } from './services/dishes.service';
import { Dish, DishSchema } from './schemas/dish.schema';
import { DishLog, DishLogSchema } from './schemas/dish-log.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Menu, MenuSchema } from '../menu/schemas/menu.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Dish.name, schema: DishSchema },
      { name: DishLog.name, schema: DishLogSchema },
      { name: Menu.name, schema: MenuSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [DishesController],
  providers: [DishesService],
  exports: [DishesService],
})
export class DishesModule {}
