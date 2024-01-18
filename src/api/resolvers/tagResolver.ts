import {deleteTag, fetchAllTags, fetchTagsByMediaId} from '../models/tagModel';

export default {
  MediaItem: {
    tags: async (parent: {media_id: string}) => {
      return await fetchTagsByMediaId(Number(parent.media_id));
    },
  },
  Query: {
    tags: async () => {
      return await fetchAllTags();
    },
  },
  Mutation: {
    deleteTag: async (_parent: undefined, args: {input: string}) => {
      return await deleteTag(Number(args.input));
    },
  },
};
