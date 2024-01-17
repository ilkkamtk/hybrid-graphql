import {fetchAllTags} from '../models/tagModel';

export default {
  Query: {
    tags: async () => {
      return await fetchAllTags();
    },
  },
};
