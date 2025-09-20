import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from '../schemas/settings.schema';
import { UpdateSettingsDto } from '../dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
  ) {}

  async getSettings(): Promise<Settings> {
    const settings = await this.settingsModel.findOne().exec();
    if (!settings) {
      // If no settings exist, create default settings
      return this.settingsModel.create({ packagePrice: 169 });
    }
    return settings;
  }

  async updateSettings(
    updateSettingsDto: UpdateSettingsDto,
  ): Promise<Settings> {
    const settings = await this.settingsModel.findOne().exec();
    if (!settings) {
      return this.settingsModel.create(updateSettingsDto);
    }

    Object.assign(settings, updateSettingsDto);
    return settings.save();
  }
}
