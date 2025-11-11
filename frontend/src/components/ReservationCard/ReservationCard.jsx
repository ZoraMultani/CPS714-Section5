import React from 'react';
import {
  Card,
  CardContent,
  Stack,
  Box,
  Typography,
  Button,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const ReservationCard = ({ reservation, onCancel }) => (
  <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
    <CardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="subtitle1">
            {reservation.itemTitle}{' '}
            <Typography
              component="span"
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              – {reservation.author}
            </Typography>
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Position: {reservation.position}
          </Typography>
        </Box>

        <Button
          color="error"
          variant="text"
          startIcon={<DeleteOutlineIcon />}
          onClick={() => onCancel(reservation.id)}
        >
          Cancel
        </Button>
      </Stack>
    </CardContent>
  </Card>
);

export default ReservationCard;
