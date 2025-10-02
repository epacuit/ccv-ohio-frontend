import React from 'react';
import { 
  Typography, 
  Box, 
  Alert,
  Paper,
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

/**
 * Help text component that explains markdown formatting
 * For use with react-markdown library
 */
const MarkdownHelp = ({ variant = 'caption', sx = {}, expanded = false }) => {
  if (expanded) {
    // Full help with examples
    return (
      <Alert 
        severity="info" 
        icon={<InfoIcon fontSize="small" />}
        sx={{ 
          mt: 1,
          py: 1,
          '& .MuiAlert-message': {
            width: '100%'
          },
          ...sx 
        }}
      >
        <Typography variant="subtitle2" gutterBottom fontWeight="600">
          Formatting Guide
        </Typography>
        <Table size="small" sx={{ mt: 1 }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}>**bold text**</TableCell>
              <TableCell>→</TableCell>
              <TableCell><strong>bold text</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}>*italic text*</TableCell>
              <TableCell>→</TableCell>
              <TableCell><em>italic text</em></TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}>[link text](https://example.com)</TableCell>
              <TableCell>→</TableCell>
              <TableCell><a href="#" onClick={e => e.preventDefault()}>link text</a></TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}>- bullet point</TableCell>
              <TableCell>→</TableCell>
              <TableCell>• bullet point</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}>`code`</TableCell>
              <TableCell>→</TableCell>
              <TableCell><code style={{ backgroundColor: '#f0f0f0', padding: '2px 4px' }}>code</code></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          URLs and email addresses are automatically converted to links
        </Typography>
      </Alert>
    );
  }

  // Compact version
  return (
    <Alert 
      severity="info" 
      icon={<InfoIcon fontSize="small" />}
      sx={{ 
        mt: 1,
        py: 0.5,
        ...sx 
      }}
    >
      <Typography variant={variant}>
        <strong>Formatting:</strong> **bold**, *italic*, [link](url), `code`, lists with - or 1.
        <br />
        URLs and emails are automatically linked.
      </Typography>
    </Alert>
  );
};

/**
 * Inline version for use next to field labels
 */
export const MarkdownHelpInline = () => (
  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', ml: 1 }}>
    (markdown supported)
  </Typography>
);

/**
 * Tooltip content for markdown fields
 */
export const MarkdownTooltipContent = () => (
  <Box sx={{ p: 1 }}>
    <Typography variant="body2" sx={{ mb: 1 }}>
      <strong>Formatting options:</strong>
    </Typography>
    <Typography variant="caption" component="div">
      • **bold** or __bold__<br />
      • *italic* or _italic_<br />
      • [link text](https://url.com)<br />
      • `inline code`<br />
      • Lists with - or 1. 2. 3.<br />
      • &gt; for quotes<br />
      • --- for dividers<br />
      • Auto-linking URLs & emails
    </Typography>
  </Box>
);

export default MarkdownHelp;