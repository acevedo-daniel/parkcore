import { NotFoundError } from '../../errors/index.js';
import * as userRepository from './user.repository.js';
import { type UserResponse, type UpdateProfile, toUserResponse } from './user.schema.js';

export const getById = async (id: string): Promise<UserResponse> => {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return toUserResponse(user);
};

export const updateProfile = async (id: string, data: UpdateProfile): Promise<UserResponse> => {
  const user = await userRepository.update(id, data);
  return toUserResponse(user);
};
