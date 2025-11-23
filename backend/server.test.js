import request from 'supertest';
import dayjs from 'dayjs';
import { app } from './server.js';

describe('LibraLite API', () => {
  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('GET /api/me returns member data', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 'm001',
      name: 'Tom Jerry',
      email: 'username@example.com',
    });
  });

  test('GET /api/loans returns enriched loans with status', async () => {
    const res = await request(app).get('/api/loans');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    const l1 = res.body.find((l) => l.id === 'l1');
    const l2 = res.body.find((l) => l.id === 'l2');
    const l3 = res.body.find((l) => l.id === 'l3');

    expect(l1).toHaveProperty('status');
    expect(l1.status).toMatch(/Due in \d+d/);

    expect(l2).toHaveProperty('status');
    expect(l2.status).toBe('Overdue');

    expect(l3).toHaveProperty('status');
    expect(l3.status).toMatch(/Expires in \d+d/);
  });

    describe('POST /api/loans', () => {
    test('creates a physical loan with no holds and renewable=true', async () => {
      const res = await request(app)
        .post('/api/loans')
        .send({
          title: 'New Physical Book',
          author: 'Test Author',
          type: 'Book',
          isDigital: false,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        title: 'New Physical Book',
        author: 'Test Author',
        type: 'Book',
        isDigital: false,
        renewable: true,
        holdsCount: 0,
      });
      expect(res.body.dueDate).toBeDefined();
      expect(res.body.expiresAt).toBeUndefined();
      expect(res.body.id).toBeDefined();
    });

    test('creates a digital loan with renewable=false', async () => {
      const res = await request(app)
        .post('/api/loans')
        .send({
          title: 'New eBook',
          author: 'Digital Author',
          type: 'eBook',
          isDigital: true,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        title: 'New eBook',
        author: 'Digital Author',
        type: 'eBook',
        isDigital: true,
        renewable: false,
        holdsCount: 0,
      });
      expect(res.body.expiresAt).toBeDefined();
      expect(res.body.dueDate).toBeUndefined();
      expect(res.body.id).toBeDefined();
    });

    test('returns 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/loans')
        .send({}); // no title

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('title required');
    });
  });

  describe('POST /api/loans/:id/renew', () => {
    test('renews an eligible physical loan', async () => {
      const before = await request(app).get('/api/loans');
      const loanBefore = before.body.find((l) => l.id === 'l1');
      const oldDue = dayjs(loanBefore.dueDate);

      const res = await request(app).post('/api/loans/l1/renew').send();
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const newDue = dayjs(res.body.loan.dueDate);
      expect(newDue.diff(oldDue, 'day')).toBe(14);
    });

    test('returns 404 for unknown loan id', async () => {
      const res = await request(app).post('/api/loans/unknown/renew').send();
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Loan not found');
    });

    test('rejects renewal for digital loan', async () => {
      const res = await request(app).post('/api/loans/l3/renew').send();
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Digital items cannot be renewed');
    });

    test('rejects renewal when not renewable / holds present', async () => {
      const res = await request(app).post('/api/loans/l2/renew').send();
      expect(res.status).toBe(400);
      expect([
        'This item is not renewable (holds present or limit reached)',
        'Cannot renew: holds present',
      ]).toContain(res.body.error);
    });
  });

  describe('Reservations', () => {
    test('GET /api/reservations returns list', async () => {
      const res = await request(app).get('/api/reservations');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    test('POST /api/reservations creates reservation with position', async () => {
      const before = await request(app).get('/api/reservations');
      const prevLen = before.body.length;

      const res = await request(app)
        .post('/api/reservations')
        .send({ itemTitle: 'New Book' });

      expect(res.status).toBe(200);
      expect(res.body.itemTitle).toBe('New Book');
      expect(res.body.position).toBe(prevLen + 1);
      expect(res.body.id).toBeDefined();
    });

    test('POST /api/reservations without itemTitle returns 400', async () => {
      const res = await request(app).post('/api/reservations').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('itemTitle required');
    });

    test('DELETE /api/reservations/:id deletes reservation', async () => {
      const create = await request(app)
        .post('/api/reservations')
        .send({ itemTitle: 'To Delete' });

      const id = create.body.id;

      const del = await request(app).delete(`/api/reservations/${id}`);
      expect(del.status).toBe(200);
      expect(del.body.ok).toBe(true);

      const after = await request(app).get('/api/reservations');
      const exists = after.body.some((r) => r.id === id);
      expect(exists).toBe(false);
    });
  });

  describe('Fines & payments', () => {
    test('GET /api/fines returns total and items', async () => {
      const res = await request(app).get('/api/fines');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBeGreaterThan(0);
    });

    test('POST /api/pay reduces fines by amount (partial pay)', async () => {
      const before = await request(app).get('/api/fines');
      const startTotal = before.body.total;

      const res = await request(app)
        .post('/api/pay')
        .send({ amount: 5 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.remaining).toBeCloseTo(startTotal - 5, 2);
    });

    test('POST /api/pay caps payment at total', async () => {
      const res = await request(app)
        .post('/api/pay')
        .send({ amount: 9999 });

      expect(res.status).toBe(200);
      expect(res.body.remaining).toBeGreaterThanOrEqual(0);
    });

    test('POST /api/pay with invalid amount returns 400', async () => {
      const res = await request(app)
        .post('/api/pay')
        .send({ amount: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid amount');
    });
  });
});
