import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box
} from '@mui/material';
import { format } from 'date-fns';
import FaceIcon from '@mui/icons-material/Face';
import PersonIcon from '@mui/icons-material/Person';

const AttendanceList = ({ attendances, showUser = true }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'late':
        return 'warning';
      case 'absent':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'face-recognition' ? (
      <FaceIcon fontSize="small" />
    ) : (
      <PersonIcon fontSize="small" />
    );
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Time</TableCell>
            {showUser && <TableCell>User</TableCell>}
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Details</TableCell>
            {showUser && <TableCell>Marked By</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {attendances.map((attendance) => (
            <TableRow key={attendance._id}>
              <TableCell>
                {format(new Date(attendance.date), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell>
                {format(new Date(attendance.timestamp), 'HH:mm:ss')}
              </TableCell>
              {showUser && (
                <TableCell>
                  <Typography variant="body2">
                    {attendance.user?.name}
                    <br />
                    <small>{attendance.user?.registrationId}</small>
                  </Typography>
                </TableCell>
              )}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getTypeIcon(attendance.type)}
                  {attendance.type === 'face-recognition' ? 'Face Recognition' : 'Proxy'}
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={attendance.status}
                  color={getStatusColor(attendance.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {attendance.type === 'face-recognition' ? (
                  `Confidence: ${attendance.faceConfidence?.toFixed(2)}%`
                ) : (
                  attendance.notes || 'No notes'
                )}
              </TableCell>
              {showUser && (
                <TableCell>
                  {attendance.type === 'proxy' && attendance.markedBy ? (
                    <Typography variant="body2">
                      {attendance.markedBy.name}
                      <br />
                      <small>{attendance.markedBy.email}</small>
                    </Typography>
                  ) : (
                    'System'
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AttendanceList; 