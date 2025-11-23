import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Menu, MenuDocument } from '../schemas/menu.schema';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { UpdateMenuDto } from '../dto/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(@InjectModel(Menu.name) private menuModel: Model<MenuDocument>) {}

  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    const createdMenu = new this.menuModel(createMenuDto);
    return createdMenu.save();
  }

  async findAll(excludeHidden?: boolean): Promise<Menu[]> {
    const filter: any = {};
    if (excludeHidden) {
      filter.isHidden = { $ne: true };
    }
    console.log(filter);

    return this.menuModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Menu> {
    const menu = await this.menuModel.findById(id).exec();
    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }
    return menu;
  }

  async update(id: string, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const updatedMenu = await this.menuModel
      .findByIdAndUpdate(id, updateMenuDto, { new: true })
      .exec();

    if (!updatedMenu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }
    return updatedMenu;
  }

  async remove(id: string): Promise<void> {
    const result = await this.menuModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }
  }

  async findByCategory(category: string): Promise<Menu[]> {
    return this.menuModel.find({ category }).exec();
  }

  async findBySource(source: string): Promise<Menu[]> {
    return this.menuModel.find({ source }).exec();
  }
}
