import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  root(): string {
    return `<html>
      <head>
        <title>Whisper Blog API</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          h1 {
            color: #333;
          } 
          p {
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>Welcome to Whisper Blog API</h1>
        <p>This is a simple API for managing blog posts and tags.</p>
      </body>
    </html>`;
  }
}
