import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import { UserRole } from '../../auth/enums/user-roles.enum';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userModel.find({ role }).select('-password').exec();
  }

  async updateStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findActiveByRole(role: UserRole): Promise<User[]> {
    return this.userModel
      .find({ role, isActive: true })
      .select('-password')
      .exec();
  }
}
