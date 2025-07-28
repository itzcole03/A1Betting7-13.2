// Minimal dataProvider for REST endpoints (to be implemented)
import axios from 'axios';
import { DataProvider } from 'react-admin';

const apiUrl = '/api/v1/admin';

const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    // Map resource to endpoint
    let url = '';
    if (resource === 'rules') url = `${apiUrl}/business-rules`;
    else if (resource === 'audit-log') url = `${apiUrl}/rules-audit-log`;
    else if (resource === 'violations') url = `${apiUrl}/violations`;
    else throw new Error('Unknown resource');
    const { data } = await axios.get(url);
    return { data, total: data.length };
  },
  // ...other methods (getOne, create, update, delete) can be added as needed
  getOne: async () => {
    throw new Error('Not implemented');
  },
  getMany: async () => {
    throw new Error('Not implemented');
  },
  getManyReference: async () => {
    throw new Error('Not implemented');
  },
  update: async () => {
    throw new Error('Not implemented');
  },
  updateMany: async () => {
    throw new Error('Not implemented');
  },
  create: async () => {
    throw new Error('Not implemented');
  },
  delete: async () => {
    throw new Error('Not implemented');
  },
  deleteMany: async () => {
    throw new Error('Not implemented');
  },
};

export default dataProvider;
