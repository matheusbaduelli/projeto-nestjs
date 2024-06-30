import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { UserModule } from '../user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { Authservice } from './auth.service';
import { fileModule } from 'src/file/file.module';

@Module({
  imports: [
    fileModule,
    JwtModule.register({ secret: process.env.JWT_SECRET}),
    forwardRef(() => UserModule),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [Authservice],
  exports: [Authservice],
})
export class AuthModule {}
