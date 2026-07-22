// import { Body, Controller, Post } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { LoginDto, RegisterDto } from './dto';
// import { Get, UseGuards, Req } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/jwt.guard'; 

// @Controller('auth')
// export class AuthController {
//   constructor(private auth: AuthService) {}

//   @Post('register')
//   register(@Body() dto: RegisterDto) {
//     return this.auth.register(dto);
//   }

//   @Post('login')
//   login(@Body() dto: LoginDto) {
//     return this.auth.login(dto);
//   }

//   @Get('me')
// @UseGuards(JwtAuthGuard)
// me(@Req() req: any) {
//   return this.auth.me(req.user.sub);
// }
// }








import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateMyAvatarDto } from './dto';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // ✅ NEW
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any, @Query('clubId') clubId?: string) {
    const clubIdFromHeader = req.headers['x-club-id'] as string | undefined;
    return this.auth.me(req.user.sub, clubIdFromHeader || clubId);
  }

  @Post('me/avatar/signature')
  @UseGuards(JwtAuthGuard)
  avatarSignature(@Req() req: any) {
    return this.auth.createAvatarUploadSignature(req.user.sub);
  }

  @Patch('me/avatar')
  @UseGuards(JwtAuthGuard)
  updateAvatar(@Req() req: any, @Body() dto: UpdateMyAvatarDto) {
    return this.auth.updateMyAvatar(req.user.sub, dto);
  }
}
