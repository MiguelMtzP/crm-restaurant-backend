import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import { UserRole } from '../../auth/enums/user-roles.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...userData } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      ...userData,
      password: hashedPassword,
    });

    await user.save();

    // Convert to JSON and remove password
    const userObj = user.toJSON() as any;
    delete userObj.password;
    return userObj as User;
  }

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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updates = { ...updateUserDto };

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updates, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
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
