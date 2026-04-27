import { api } from './adminApi';

export const userService = {
  getAll:  ()        => api.users.getAll(),
  create:  (data)    => api.users.create(data),
  update:  (id, data)=> api.users.update(id, data),
  remove:  (id)      => api.users.delete(id),
};
