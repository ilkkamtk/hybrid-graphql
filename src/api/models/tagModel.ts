import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {Tag, TagResult} from '@sharedTypes/DBTypes';
import promisePool from '../../lib/db';
import {MessageResponse} from '@sharedTypes/MessageTypes';

// Request a list of tags
const fetchAllTags = async (): Promise<Tag[] | null> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & Tag[]>(
      'SELECT * FROM Tags',
    );
    if (rows.length === 0) {
      return null;
    }
    return rows;
  } catch (e) {
    console.error('fetchAllTags error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Post a new tag
const postTag = async (
  tag: Omit<Tag, 'tag_id'>,
): Promise<MessageResponse | null> => {
  try {
    const [tagResult] = await promisePool.execute<ResultSetHeader>(
      'INSERT INTO Tags (tag_name) VALUES (?)',
      [tag.tag_name],
    );
    if (tagResult.affectedRows === 0) {
      return null;
    }

    return {message: 'Tag created'};
  } catch (e) {
    console.error('postTag error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Request a list of tags by media item id
const fetchTagsByMediaId = async (id: number): Promise<TagResult[] | null> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & TagResult[]>(
      `SELECT Tags.tag_id, Tags.tag_name, MediaItemTags.media_id
       FROM Tags
       JOIN MediaItemTags ON Tags.tag_id = MediaItemTags.tag_id
       WHERE MediaItemTags.media_id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows;
  } catch (e) {
    console.error('fetchTagsByMediaId error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Delete a tag
const deleteTag = async (id: number): Promise<MessageResponse | null> => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const [mediaItemTagResult] = await connection.execute<ResultSetHeader>(
      'DELETE FROM MediaItemTags WHERE tag_id = ?',
      [id],
    );

    if (mediaItemTagResult.affectedRows === 0) {
      return null;
    }

    const [tagResult] = await connection.execute<ResultSetHeader>(
      'DELETE FROM Tags WHERE tag_id = ?',
      [id],
    );

    if (tagResult.affectedRows === 0) {
      return null;
    }

    await connection.commit();

    if (mediaItemTagResult.affectedRows === 0) {
      return null;
    }

    return {message: 'Tag deleted'};
  } catch (e) {
    await connection.rollback();
    console.error('deleteTag error', (e as Error).message);
    throw new Error((e as Error).message);
  } finally {
    connection.release();
  }
};

export {fetchAllTags, postTag, fetchTagsByMediaId, deleteTag};
