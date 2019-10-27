export interface File {
  originalname: string;
  encoding: 'base64';
  mimetype: 'image/jpeg' | string;
  content: string;
  size: number;
}
