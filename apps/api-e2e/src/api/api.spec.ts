import axios from 'axios';

describe('GET /api/health/live', () => {
  it('should report that the API process is alive', async () => {
    const response = await axios.get('/api/health/live');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ status: 'ok' });
  });
});
