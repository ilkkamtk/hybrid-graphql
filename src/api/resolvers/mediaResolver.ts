import {
  fetchAllMedia,
  fetchMediaById,
  fetchMediaByTag,
} from '../models/mediaModel';

export default {
  Query: {
    mediaItems: async () => {
      return await fetchAllMedia();
    },
    mediaItem: async (_parent: undefined, args: {media_id: string}) => {
      return await fetchMediaById(Number(args.media_id));
    },
    mediaItemsByTag: async (_parent: undefined, args: {tag: string}) => {
      const result = await fetchMediaByTag(args.tag);
      console.log(result);
      return result;
    },
  },
};
