import React from 'react';
import dayjs from 'dayjs';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
} from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const LoanCard = ({ loan, onRenew }) => {
  const isOverdue = !loan.isDigital && dayjs(loan.dueDate).isBefore(dayjs());
  const dueText = loan.isDigital
    ? `Expires: ${dayjs(loan.expiresAt).format('MMM D, YYYY')}`
    : `Due: ${dayjs(loan.dueDate).format('MMM D, YYYY')}`;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          pb: 3,
        }}
      >
        <Stack spacing={1}>
          <Stack spacing={0.3}>
            <Typography variant="h6">{loan.title}</Typography>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              {loan.author}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Chip label={loan.type} />
            <Chip color={isOverdue ? 'error' : 'default'} label={loan.status} />
            {loan.holdsCount > 0 && (
              <Chip color="warning" label={`Holds: ${loan.holdsCount}`} />
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {dueText}
          </Typography>
        </Stack>

        {!loan.isDigital && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AutorenewIcon />}
            disabled={!loan.renewable || loan.holdsCount > 0}
            onClick={() => onRenew(loan.id)}
            sx={{ mt: 2, mb: 4, alignSelf: 'flex-start' }}
          >
            Renew 2 weeks
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default LoanCard;
