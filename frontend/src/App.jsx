import React, { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Grid, Card, CardContent, Button,
  Chip, Stack, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Box, LinearProgress
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import dayjs from 'dayjs';
import ReactDOM from 'react-dom/client';
import LoanCard from './components/LoanCard';
import ReservationCard from './components/ReservationCard';

// Services
import { getUser } from './services/userService';
import { getLoans, renewLoan } from './services/loanService';
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
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [newHoldOpen, setNewHoldOpen] = useState(false);
  const [holdTitle, setHoldTitle] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
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
      setSnack({ severity: 'error', msg: err.message });
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
    if (!holdTitle.trim()) return setSnack({ severity: 'error', msg: 'Enter a title' });
    try {
      const data = await createReservation(holdTitle);
      setSnack({ severity: 'success', msg: `Hold placed for “${data.itemTitle}”` });
      setNewHoldOpen(false);
      setHoldTitle('');
      fetchAll();
    } catch (err) {
      setSnack({ severity: 'error', msg: err.message });
    }
  };

  const header = (
    <AppBar position="sticky" elevation={3} sx={{ borderRadius: 0 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>LibraLite – User Dashboard</Typography>
        <Button color="inherit" onClick={fetchAll}>Refresh</Button>
      </Toolbar>
    </AppBar>
  );

  return (
    <Box sx={{ bgcolor: '#f6f7fb', minHeight: '100vh' }}>
      {header}
      <Container sx={{ py: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

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
        <Typography variant="h6" sx={{ mb: 1 }}>My Loans</Typography>
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
