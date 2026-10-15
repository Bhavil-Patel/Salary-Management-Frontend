import apiConfig from './ApiConfig';
import {
  getJobs,
  getJobById,
  addJob,
  updateJob,
  deleteJob,
} from './JobApis';

jest.mock('./ApiConfig');

describe('api/JobApis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getJobs', () => {
    test('fetches jobs with pagination and search query', async () => {
      apiConfig.get.mockResolvedValueOnce({
        data: {
          data: [{ id: 1, job_title: 'Software Engineer' }],
          totalRecords: 1,
        },
      });

      const result = await getJobs({ page: 1, limit: 10, search: ' Software ' });

      expect(apiConfig.get).toHaveBeenCalledWith('/job', {
        params: { page: 1, limit: 10, search: 'Software' },
      });
      expect(result.data).toHaveLength(1);
    });

    test('supports all=true query parameter', async () => {
      apiConfig.get.mockResolvedValueOnce({ data: { data: [] } });

      await getJobs({ all: true });

      expect(apiConfig.get).toHaveBeenCalledWith('/job', {
        params: { all: true },
      });
    });
  });

  describe('getJobById', () => {
    test('throws error if ID is missing', async () => {
      await expect(getJobById()).rejects.toThrow('Job ID is required.');
    });

    test('fetches job by ID', async () => {
      apiConfig.get.mockResolvedValueOnce({ data: { id: 2, job_title: 'Product Manager' } });

      const result = await getJobById(2);
      expect(apiConfig.get).toHaveBeenCalledWith('/job/2');
      expect(result.job_title).toBe('Product Manager');
    });
  });

  describe('addJob', () => {
    test('throws error if job_title is missing', async () => {
      await expect(addJob({ job_title: '   ' })).rejects.toThrow('Job title is required.');
    });

    test('adds job with trimmed title', async () => {
      apiConfig.post.mockResolvedValueOnce({ data: { id: 3, job_title: 'QA Engineer' } });

      const result = await addJob({ job_title: '  QA Engineer  ' });
      expect(apiConfig.post).toHaveBeenCalledWith('/job/add', {
        job_title: 'QA Engineer',
      });
      expect(result.id).toBe(3);
    });
  });

  describe('updateJob', () => {
    test('throws error if ID or job_title is missing', async () => {
      await expect(updateJob(null, { job_title: 'DevOps' })).rejects.toThrow(
        'Job ID is required.'
      );
      await expect(updateJob(1, { job_title: '' })).rejects.toThrow('Job title is required.');
    });

    test('updates job title correctly', async () => {
      apiConfig.put.mockResolvedValueOnce({ data: { success: true } });

      const result = await updateJob(4, { job_title: '  Senior DevOps  ' });
      expect(apiConfig.put).toHaveBeenCalledWith('/job/update', {
        id: 4,
        job_title: 'Senior DevOps',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('deleteJob', () => {
    test('throws error if ID is missing', async () => {
      await expect(deleteJob()).rejects.toThrow('Job ID is required.');
    });

    test('deletes job by ID', async () => {
      apiConfig.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteJob(7);
      expect(apiConfig.delete).toHaveBeenCalledWith('/job/7');
      expect(result.success).toBe(true);
    });
  });
});
