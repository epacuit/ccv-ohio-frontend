import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, Typography } from '@mui/material';

/**
 * Markdown renderer using react-markdown library
 * Requires: npm install react-markdown remark-gfm
 * 
 * Features:
 * - Full GitHub Flavored Markdown support
 * - Secure by default (sanitizes HTML)
 * - Automatic URL linking
 * - Tables, lists, code blocks, etc.
 */
const MarkdownRenderer = ({ 
  content, 
  variant = 'body1',
  color = 'text.primary',
  sx = {},
  ...props 
}) => {
  if (!content) return null;

  // Custom components for Material-UI integration
  const components = {
    // Use MUI Typography for paragraphs
    p: ({ children }) => (
      <Typography 
        variant={variant} 
        color={color} 
        component="p" 
        sx={{ mb: 1, ...sx }}
        {...props}
      >
        {children}
      </Typography>
    ),
    
    // Use MUI Link component for links - FIXED: no linkTarget prop
    a: ({ href, children }) => (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        sx={{ 
          color: 'primary.main',
          textDecoration: 'underline',
          '&:hover': {
            textDecoration: 'underline',
            opacity: 0.8
          }
        }}
      >
        {children}
      </Link>
    ),
    
    // Style headers appropriately
    h1: ({ children }) => (
      <Typography variant="h5" sx={{ mb: 1, mt: 2 }}>{children}</Typography>
    ),
    h2: ({ children }) => (
      <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>{children}</Typography>
    ),
    h3: ({ children }) => (
      <Typography variant="subtitle1" sx={{ mb: 1, mt: 1.5, fontWeight: 600 }}>{children}</Typography>
    ),
    h4: ({ children }) => (
      <Typography variant="subtitle2" sx={{ mb: 0.5, mt: 1, fontWeight: 600 }}>{children}</Typography>
    ),
    
    // Style lists
    ul: ({ children }) => (
      <Typography 
        component="ul" 
        variant={variant}
        color={color}
        sx={{ 
          mb: 1, 
          pl: 3,
          '& li': {
            mb: 0.5
          },
          ...sx 
        }}
      >
        {children}
      </Typography>
    ),
    ol: ({ children }) => (
      <Typography 
        component="ol" 
        variant={variant}
        color={color}
        sx={{ 
          mb: 1, 
          pl: 3,
          '& li': {
            mb: 0.5
          },
          ...sx 
        }}
      >
        {children}
      </Typography>
    ),
    
    // Style code blocks
    code: ({ inline, children, className }) => {
      if (inline) {
        return (
          <Typography
            component="code"
            sx={{
              backgroundColor: 'action.hover',
              px: 0.5,
              py: 0.25,
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.875em'
            }}
          >
            {children}
          </Typography>
        );
      }
      return (
        <Typography
          component="pre"
          sx={{
            backgroundColor: 'action.hover',
            p: 2,
            borderRadius: 1,
            overflowX: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            mb: 1
          }}
        >
          <code className={className}>{children}</code>
        </Typography>
      );
    },
    
    // Style blockquotes
    blockquote: ({ children }) => (
      <Typography
        component="blockquote"
        variant={variant}
        sx={{
          borderLeft: '4px solid',
          borderColor: 'primary.light',
          pl: 2,
          ml: 0,
          mb: 1,
          fontStyle: 'italic',
          color: 'text.secondary',
          ...sx
        }}
      >
        {children}
      </Typography>
    ),
    
    // Style horizontal rules
    hr: () => (
      <Typography
        component="hr"
        sx={{
          border: 'none',
          borderTop: '1px solid',
          borderColor: 'divider',
          my: 2
        }}
      />
    ),
    
    // Style tables (GFM)
    table: ({ children }) => (
      <Typography
        component="table"
        sx={{
          width: '100%',
          mb: 2,
          borderCollapse: 'collapse',
          '& th, & td': {
            border: '1px solid',
            borderColor: 'divider',
            p: 1,
            textAlign: 'left'
          },
          '& th': {
            backgroundColor: 'action.hover',
            fontWeight: 600
          }
        }}
      >
        {children}
      </Typography>
    ),
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;