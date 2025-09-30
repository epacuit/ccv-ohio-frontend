import React from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

/**
 * AdminAuditLogTab Component
 * 
 * Displays admin activity audit logs
 */
const AdminAuditLogTab = ({
  auditLogs,
  loading,
  onRefresh,
}) => {
  const getActionColor = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'success';
      case 'LOGOUT':
        return 'warning';
      case 'DELETE_POLL':
      case 'DELETE_ALL_BALLOTS':
        return 'error';
      case 'UPDATE_POLL':
      case 'BULK_IMPORT':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Admin Activity Log</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          size="small"
        >
          Refresh
        </Button>
      </Box>
      
      {loading ? (
        <Box textAlign="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                  Timestamp
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                  Action
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                  Details
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                  Additional Info
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No admin actions recorded yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      {dayjs(log.timestamp).format('MMM D, YYYY h:mm A')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={getActionColor(log.action)}
                      />
                    </TableCell>
                    <TableCell>{log.details}</TableCell>
                    <TableCell>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <Tooltip 
                          title={
                            <pre style={{ margin: 0 }}>
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          }
                        >
                          <Chip
                            label="View Details"
                            size="small"
                            variant="outlined"
                            sx={{ cursor: 'pointer' }}
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Box mt={3}>
        <Alert severity="info">
          <Typography variant="body2">
            This audit log tracks all administrative actions performed on this poll. 
            In a production environment, these logs would be stored securely on the backend 
            and could include IP addresses, user agents, and other security information.
          </Typography>
        </Alert>
      </Box>
    </>
  );
};

export default AdminAuditLogTab;