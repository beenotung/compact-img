import { HttpException, Param, Controller, Get, Body, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { File } from './type';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Controller()
export class AppController {
  @Post()
  postFile(
    @Body('file')file: File,
    @Body('dir')dir: string,
  ) {
    let filename = file.originalname;
    console.log('POST:', filename);
    try {
      if (!existsSync(dir)) {
        mkdirSync(dir);
      }
      let filepath = join(dir, filename);
      let buffer = Buffer.alloc(file.size, file.content, file.encoding);
      writeFileSync(filepath, buffer);
      return 'saved';
    } catch (e) {
      throw new HttpException('FAILED TO WRITE FILE', 500);
    }
  }

  @Get()
  getRoot() {
    return this.getFile('index.html');
  }

  @Get('/:file')
  getFile(
    @Param('file')file: string,
  ) {
    let requestFile = file;
    for (; ;) {
      if (file[0] === '/') {
        file = file.substr(1);
        continue;
      }
      if (file[0] === '.') {
        file = file.substr(1);
        continue;
      }
      break;
    }
    if (file === requestFile) {
      console.log('GET:', file);
    } else {
      console.log('GET:', requestFile, '~~>', file);
    }
    let filepath = join(__dirname, '..', 'public', file);
    if (!existsSync(filepath)) {
      console.log('NOT FOUND:', filepath);
      throw new HttpException('FILE NOT FOUND', 404);
    }
    try {
      let text = readFileSync(filepath).toString();
      console.log('READ:', filepath);
      return text;
    } catch (e) {
      console.log('FAILED TO READ:', filepath);
      throw new HttpException('FAILED TO READ FILE', 500);
    }
  }

  @Post('close')
  close() {
    console.log('CLOSE');
    setTimeout(() => {
      process.exit(0);
    }, 1000);
    return 'ok';
  }
}
