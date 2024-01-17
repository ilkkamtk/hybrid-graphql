import {fetchAllMedia} from '../models/mediaModel';

export default {
  Query: {
    mediaItems: async () => {
      return await fetchAllMedia();
    },
  },
};
