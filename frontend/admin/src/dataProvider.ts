// Minimal dataProvider for REST endpoints (to be implemented)
import axios from 'axios';
import { DataProvider } from 'react-admin';

const apiUrl = '/api/v1/admin';

const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    let url = '';
    let config = {};
    if (resource === 'rules') {
      url = `${apiUrl}/business-rules`;
    } else if (resource === 'audit-log') {
      url = `${apiUrl}/rules-audit-log`;
      // Map react-admin filters and pagination to API query params
      const { page, perPage } = params.pagination || { page: 1, perPage: 50 };
      const { user_id, action, rule_id, start_time, end_time } = params.filter || {};
      const query: Record<string, any> = {
        page,
        page_size: perPage,
      };
      if (user_id) query.user = user_id;
      if (action) query.action = action;
      if (rule_id) query.rule_id = rule_id;
      if (start_time) query.start_time = start_time;
      if (end_time) query.end_time = end_time;
      config = { params: query };
    } else if (resource === 'violations') {
      url = `${apiUrl}/violations`;
    } else throw new Error('Unknown resource');
    const { data } = await axios.get(url, config);
    if (resource === 'audit-log') {
      return {
        data: data.results,
        total: data.total,
      };
    }
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
