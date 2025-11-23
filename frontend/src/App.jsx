import React, { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Grid, Card, CardContent, Button,
  Chip, Stack, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Box, LinearProgress, MenuItem
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import dayjs from 'dayjs';
import ReactDOM from 'react-dom/client';
import LoanCard from './components/LoanCard';
import ReservationCard from './components/ReservationCard';

// Services
import { getUser } from './services/userService';
import { getLoans, renewLoan, createLoan } from './services/loanService';
import { getReservations, createReservation, cancelReservation } from './services/reservationService';
import { getFines, payFine } from './services/fineService';

const Stat = ({ label, value }) => (
  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
    <CardContent>
      <Typography variant="overline" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ mt: 0.5 }}>{value}</Typography>
    </CardContent>
  </Card>
);

export default function App() {
  const [me, setMe] = useState(null);
  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [fines, setFines] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [newHoldOpen, setNewHoldOpen] = useState(false);
  const [holdTitle, setHoldTitle] = useState('');
  const [newLoanOpen, setNewLoanOpen] = useState(false);
  const [loanTitle, setLoanTitle] = useState('');
  const [loanAuthor, setLoanAuthor] = useState('');
  const [loanType, setLoanType] = useState('book'); // 'book' or 'ebook'
  const [loanDueDate, setLoanDueDate] = useState(dayjs().add(14, 'day').format('YYYY-MM-DD') );

  const fetchAll = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const [meR, loansR, resR, finesR] = await Promise.all([
        getUser(),
        getLoans(),
        getReservations(),
        getFines(),
      ]);

      setMe(meR);
      setLoans(loansR);
      setReservations(resR);
      setFines(finesR);
    } catch (err) {
      setLoadError(err.message || 'Failed to contact server');
      setSnack({ severity: 'error', msg: err.message || 'Failed to contact server' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const totalCheckedOut = loans.filter(l => !l.isDigital).length;
  const totalDigital = loans.filter(l => l.isDigital).length;
  const overdueCount = loans.filter(l => !l.isDigital && dayjs(l.dueDate).isBefore(dayjs())).length;

  // Use service functions here
  const handleRenew = async (id) => {
    try {
      await renewLoan(id);
      setSnack({ severity: 'success', msg: 'Renewed for 2 weeks!' });
      fetchAll();
    } catch (err) {
      setSnack({ severity: 'error', msg: err.message });
    }
  };

  const handlePay = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return setSnack({ severity: 'error', msg: 'Enter a valid amount.' });
    try {
      const data = await payFine(amt);
      setSnack({ severity: 'success', msg: `Payment successful. Remaining: $${data.remaining.toFixed?.(2) ?? data.remaining}` });
      setPayOpen(false);
      setPayAmount('');
      fetchAll();
    } catch (err) {
      setSnack({ severity: 'error', msg: err.message });
    }
  };

  const handleCancelReservation = async (id) => {
    try {
      await cancelReservation(id);
      setSnack({ severity: 'success', msg: 'Reservation cancelled' });
      fetchAll();
    } catch (err) {
      setSnack({ severity: 'error', msg: err.message });
    }
  };

    const handleNewHold = async () => {
    if (!holdTitle.trim()) {
      return setSnack({ severity: 'error', msg: 'Enter a title' });
    }
    try {
      const data = await createReservation(holdTitle);

      // keep existing loans; only append the new reservation locally
      setReservations(prev => [...prev, data]);

      setSnack({ severity: 'success', msg: `Hold placed for “${data.itemTitle}”` });
      setNewHoldOpen(false);
      setHoldTitle('');
    } catch (err) {
      setSnack({ severity: 'error', msg: err.message });
    }
  };

      const handleAddLoan = async () => {
    if (!loanTitle.trim()) {
      return setSnack({ severity: 'error', msg: 'Enter a title' });
    }

    const isDigital = loanType === 'ebook';
    const baseDateIso = loanDueDate
      ? dayjs(loanDueDate).toISOString()
      : dayjs().add(14, 'day').toISOString();

    const payload = {
      title: loanTitle,
      author: loanAuthor,
      type: isDigital ? 'eBook' : 'Book',
      isDigital,
      dueDate: !isDigital ? baseDateIso : undefined,
      expiresAt: isDigital ? baseDateIso : undefined,
    };

    try {
      const created = await createLoan(payload);

      setSnack({
        severity: 'success',
        msg: `Loan added for “${created.title}”`,
      });

      setNewLoanOpen(false);
      setLoanTitle('');
      setLoanAuthor('');
      setLoanType('book');
      setLoanDueDate(dayjs().add(14, 'day').format('YYYY-MM-DD'));

      // reload from backend so status/tags are consistent and persisted
      fetchAll();
    } catch (err) {
      setSnack({ severity: 'error', msg: err.message });
    }
  };


  const header = (
  <AppBar position="sticky" elevation={3} sx={{ borderRadius: 0 }}>
    <Toolbar>

      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        LibraLite – User Dashboard
      </Typography>

      <Button color="inherit" onClick={fetchAll}>
        Refresh
      </Button>

      <Button color="inherit" onClick={() => {
          window.location.href = "/logout"; // temporary for logout team
        }}
        sx={{ marginLeft: 2 }}>
        Logout
      </Button>

    </Toolbar>
  </AppBar>
);


  return (
    <Box sx={{ bgcolor: '#f6f7fb', minHeight: '100vh' }}>
      {header}
      <Container sx={{ py: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {loadError && (
          <Box sx={{ mb: 2 }}>
            <Alert
              severity="Error Loading Your Data, please try again!"
              action={
                <Button color="inherit" size="small" onClick={fetchAll}>
                  Retry
                </Button>
              }
            >
              {loadError}
            </Alert>
          </Box>
        )}

        {me && <Typography variant="h5" sx={{ mb: 2 }}>Welcome back, {me.name}</Typography>}

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}><Stat label="Checked-out" value={totalCheckedOut} /></Grid>
          <Grid item xs={12} sm={6} md={3}><Stat label="Digital loans" value={totalDigital} /></Grid>
          <Grid item xs={12} sm={6} md={3}><Stat label="Overdue" value={overdueCount} /></Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="overline" color="text.secondary">Fines</Typography>
                    <Typography variant="h5">${fines.total.toFixed ? fines.total.toFixed(2) : fines.total}</Typography>
                  </Box>
                  <Button startIcon={<PaymentIcon />} variant="contained" onClick={() => setPayOpen(true)} disabled={fines.total <= 0}>Pay</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

                {/* Loans */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}>
          <Typography variant="h6">My Loans</Typography>
          <Button 
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setNewLoanOpen(true)}
          >
            Add Loan
          </Button>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {loans.map((loan) => (
            <Grid key={loan.id} item xs={12} sm={6} md={4}>
              <LoanCard loan={loan} onRenew={handleRenew} />
            </Grid>
          ))}
        </Grid>

        {/* Reservations */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6">My Reservations</Typography>
          <Button startIcon={<AddCircleOutlineIcon />} onClick={() => setNewHoldOpen(true)}>Place Hold</Button>
        </Stack>
        <Grid container spacing={2}>
          {reservations.map((r) => (
            <Grid key={r.id} item xs={12} md={6}>
              <ReservationCard reservation={r} onCancel={handleCancelReservation} />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Pay Dialog */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)}>
        <DialogTitle>Pay Fines</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth type="number" label="Amount" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          <Typography variant="caption" color="text.secondary">You can pay a partial amount.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePay}>Pay</Button>
        </DialogActions>
      </Dialog>

      {/* New Hold Dialog */}
      <Dialog open={newHoldOpen} onClose={() => setNewHoldOpen(false)}>
        <DialogTitle>Place a Hold</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Item title" value={holdTitle} onChange={(e) => setHoldTitle(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewHoldOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleNewHold}>Submit</Button>
        </DialogActions>
      </Dialog>

            {/* New Loan Dialog */}
      <Dialog open={newLoanOpen} onClose={() => setNewLoanOpen(false)}>
        <DialogTitle>Add a Loan</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Title"
              value={loanTitle}
              onChange={(e) => setLoanTitle(e.target.value)}
            />
            <TextField
              fullWidth
              label="Author"
              value={loanAuthor}
              onChange={(e) => setLoanAuthor(e.target.value)}
            />
            <TextField
              select
              fullWidth
              label="Type"
              value={loanType}
              onChange={(e) => setLoanType(e.target.value)}
            >
              <MenuItem value="book">Book</MenuItem>
              <MenuItem value="ebook">eBook</MenuItem>
            </TextField>
            <TextField
              fullWidth
              type="date"
              label="Due date"
              value={loanDueDate}
              onChange={(e) => setLoanDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewLoanOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleAddLoan}>Submit</Button>
        </DialogActions>
      </Dialog>


      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
        <Alert onClose={() => setSnack(null)} severity={snack?.severity || 'info'} variant="filled">
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
