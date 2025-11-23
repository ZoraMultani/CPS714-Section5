// Minimal Node/Express API with in-memory data to support User Dashboard (Sub‑project 4)
// Integrates with: Loan Management (5), Reservations (3), Digital Lending (9)
import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);
export const app = express();
app.use(cors());
app.use(express.json());

// ===== Mock Data =====
const member = {
  id: 'm001',
  name: 'Tom Jerry',
  email: 'username@example.com',
  finesTotal: 76.50,
};

// Loan items include both physical and digital items
let loans = [
  {
    id: 'l1',
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    type: 'Book',
    isDigital: false,
    dueDate: dayjs().add(5, 'day').toISOString(),
    renewable: true,
    holdsCount: 0,
  },
  {
    id: 'l2',
    title: 'Computer Vision: A Modern Approach',
    author: 'Lobren James',
    type: 'Book',
    isDigital: false,
    dueDate: dayjs().subtract(2, 'day').toISOString(), // overdue
    renewable: false, // pretend there is a hold
    holdsCount: 3,
  },
  {
    id: 'l3',
    title: 'Deep Learning with PyTorch (eBook)',
    author: 'Dunn Smith',
    type: 'eBook',
    isDigital: true,
    expiresAt: dayjs().add(4, 'day').toISOString(), // digital expiry instead of due date
    renewable: false,
    holdsCount: 0,
  },
];

let reservations = [
  { id: 'r1', itemTitle: 'Design Patterns', author: 'DJ Khaled', position: 2 },
  { id: 'r2', itemTitle: 'The Pragmatic Programmer', author: 'Peter Johnson', position: 5 },
];

let fines = [
  { id: 'f1', reason: 'Overdue: Data Structures (2 days)', amount: 2.50, createdAt: dayjs().subtract(1, 'day').toISOString() },
  { id: 'f2', reason: 'Overdue: Comp. Vision (1 day)', amount: 4.00, createdAt: dayjs().subtract(2, 'day').toISOString() },
];

// ===== Helpers =====
const calcIsOverdue = (loan) => !loan.isDigital && dayjs(loan.dueDate).isBefore(dayjs(), 'day');
const extendDueDate = (date, days = 14) => dayjs(date).add(days, 'day').toISOString();

// ===== Routes =====
app.get('/api/me', (req, res) => {
  res.json(member);
});

app.get('/api/loans', (req, res) => {
  const enriched = loans.map((x) => ({
    ...x,
    status: x.isDigital
      ? `Expires in ${dayjs(x.expiresAt).diff(dayjs(), 'day')}d`
      : calcIsOverdue(x)
        ? 'Overdue'
        : `Due in ${dayjs(x.dueDate).diff(dayjs(), 'day')}d`,
  }));
  res.json(enriched);
});

app.post('/api/loans', (req, res) => {
  const { title, author, type, isDigital, dueDate, expiresAt } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });

  const digital = isDigital || (type && type.toLowerCase() === 'ebook');

  const loan = {
    id: nanoid(),
    title,
    author: author || 'Unknown',
    type: digital ? 'eBook' : 'Book',
    isDigital: digital,
    renewable: !digital,     // physical: true, digital: false
    holdsCount: 0,           // no holds by default
  };

  if (digital) {
    loan.expiresAt = expiresAt
      ? dayjs(expiresAt).toISOString()
      : extendDueDate(dayjs(), 14);
  } else {
    loan.dueDate = dueDate
      ? dayjs(dueDate).toISOString()
      : extendDueDate(dayjs(), 14);
  }

  loans.push(loan);
  res.json(loan);
});


app.post('/api/loans/:id/renew', (req, res) => {
  const loan = loans.find((l) => l.id === req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  if (loan.isDigital) return res.status(400).json({ error: 'Digital items cannot be renewed' });
  if (!loan.renewable) return res.status(400).json({ error: 'This item is not renewable (holds present or limit reached)' });

  // Business rule: cannot renew if any active holds exist
  if (loan.holdsCount > 0) return res.status(400).json({ error: 'Cannot renew: holds present' });

  loan.dueDate = extendDueDate(loan.dueDate, 14);
  res.json({ ok: true, loan });
});

app.get('/api/reservations', (req, res) => {
  res.json(reservations);
});

app.post('/api/reservations', (req, res) => {
  const { itemTitle } = req.body || {};
  if (!itemTitle) return res.status(400).json({ error: 'itemTitle required' });
  const newRes = { id: nanoid(), itemTitle, position: Math.max(1, reservations.length + 1) };
  reservations.push(newRes);
  res.json(newRes);
});

app.delete('/api/reservations/:id', (req, res) => {
  reservations = reservations.filter((r) => r.id !== req.params.id);
  res.json({ ok: true });
});

app.get('/api/fines', (req, res) => {
  res.json({ total: member.finesTotal, items: fines });
});

app.post('/api/pay', (req, res) => {
  const { amount } = req.body || {};
  const amt = Number(amount);
  if (Number.isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
  const toPay = Math.min(amt, member.finesTotal);
  member.finesTotal = Number((member.finesTotal - toPay).toFixed(2));
  res.json({ ok: true, remaining: member.finesTotal });
});

// Health
app.get('/api/health', (_, res) => res.json({ ok: true }));

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () =>
    console.log(`LibraLite API listening on http://localhost:${PORT}`)
  );
}
