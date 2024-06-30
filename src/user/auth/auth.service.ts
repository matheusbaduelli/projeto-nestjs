import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { AuthRegisterDTO } from './dto/auth-register.dto';
import { userService } from '../user.service';
import * as bcrypt from 'bcrypt';
import { Console } from 'console';
import { MailerService } from '@nestjs-modules/mailer';
import { link } from 'fs';

@Injectable()
export class Authservice {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userservice: userService,
    private readonly mailer: MailerService,
  ) {}
  createToken(user: User) {
    return {
      acessToken: this.jwtService.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        {
          expiresIn: '7 days',
          subject: String(user.id),
          issuer: 'login',
          audience: 'users',
          //notBefore: Math.ceil((Date.now() + 1000 * 60 * 60) /1000)
        },
      ),
    };
  }

  checkToken(token: string) {
    try {
      const data = this.jwtService.verify(token, {
        audience: 'users',
        issuer: 'login',
      });

      return data;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  isValidToken(token: string) {
    try {
      this.checkToken(token);
      return true;
    } catch (e) {
      return false;
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou senha incorreto');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Email ou senha incorreto');
    }

    return this.createToken(user);
  }

  async forget(email: string) {
    const user = this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email incorreto');
    }

    const token = this.jwtService.sign(
      {
        id: (await user).id,
      },
      {
        expiresIn: '30 minutes',
        subject: String((await user)),
        issuer: 'forget',
        audience: 'users',
      },
    );

    await this.mailer.sendMail({
      subject: 'Recuperação de senha',
      to: 'matheus@gmail.com',
      template: 'forget',
      context: {
        name: (await user).name,
        token,
      },
    });

    return true;
  }

  async reset(password: string, token: string) {
    try {
      const data:any = this.jwtService.verify(token, {
        issuer: 'forget',
        audience: 'users',
      });

      

      if(isNaN(Number(data.id))){
        throw new BadRequestException("Token é invalido")
      }

      const salt = await bcrypt.genSalt();
      password = await bcrypt.hash(password,salt);

      const user = await this.prisma.user.update({
        where: {
          id: Number(data.id),
        },
        data: {
          password,
        },
      });
      return this.createToken(user);

    } catch (e) {
      throw new BadRequestException(e);
    }

   
  }

  async register(data: AuthRegisterDTO) {
    const user = await this.userservice.create(data);
    return this.createToken(user);
  }
}
