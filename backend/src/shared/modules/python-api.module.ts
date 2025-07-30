import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PythonApiClient } from '../clients/python-api.client';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [PythonApiClient],
  exports: [PythonApiClient],
})
export class PythonApiModule {} 