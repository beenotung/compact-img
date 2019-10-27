import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createServer } from 'net';
import * as open from 'open';
import * as bodyParser from 'body-parser';

async function getPort(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    let server = createServer();
    server.on('error', reject);
    let returnPort = (port: number) => server.close(() => resolve(port));
    server.listen(() => {
      let address = server.address();
      if (typeof address === 'string') {
        let port = +address.split(':').pop();
        returnPort(port);
      } else if (address) {
        let port = address.port;
        returnPort(port);
      } else {
        server.close(() => reject('failed to get port number'));
      }
    });
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '100mb' }));
  let port = await getPort();
  await app.listen(port);
  let url = 'http://127.0.0.1:' + port;
  console.log('listening on', url);
  await open(url);
}

bootstrap();
