import { type User, Prisma } from '../../../prisma/generated/client.js';
import { prisma } from '../../config/prisma.js';

export const create = async (data: Prisma.UserCreateInput): Promise<User> => {
  return await prisma.user.create({ data });
};

export const update = async (id: string, data: Prisma.UserUpdateInput): Promise<User> => {
  return await prisma.user.update({
    where: { id },
    data,
  });
};

export const findById = async (id: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

export const findByEmail = async (email: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: { email },
  });
};
