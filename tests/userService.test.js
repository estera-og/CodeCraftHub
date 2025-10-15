import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { userService } from '../src/services/userService.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('creates and finds a user', async () => {
  const created = await userService.create({
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hash'
  });
  expect(created.email).toBe('test@example.com');

  const found = await userService.getByEmail('test@example.com');
  expect(found.email).toBe('test@example.com');
});
