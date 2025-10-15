import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { buildApp } from '../src/app.js';

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  app = buildApp();
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('register and login', async () => {
  const email = 'user1@example.com';
  const password = 'StrongPass123';

  const reg = await request(app).post('/users/register').send({ email, password, name: 'User One' });
  expect(reg.status).toBe(201);

  const login = await request(app).post('/users/login').send({ email, password });
  expect(login.status).toBe(200);
  expect(login.body.accessToken).toBeDefined();
  expect(login.body.refreshToken).toBeDefined();
});
