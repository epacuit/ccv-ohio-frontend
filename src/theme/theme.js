import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7A8896', // The muted blue-gray accent
      light: '#A5B3BF',
      dark: '#556069',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#A29B83', // The warm gray/beige
      light: '#C5BFAA',
      dark: '#7A7460',
      contrastText: '#142039',
    },
    error: {
      main: '#B14A26', // The reddish brown for errors/alerts
      light: '#D67654',
      dark: '#7D3319',
    },
    background: {
        default: '#FEFEFE', // Almost white
        paper: '#FFFFFF',
      },
    text: {
      primary: '#142039', // Main text color
      secondary: '#556069', // Lighter text
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Arial", sans-serif', 
    h1: {
      fontFamily: '"Gloock", serif',
      fontWeight: 400,
      color: '#142039',
    },
    h2: {
      fontFamily: '"Gloock", serif',
      fontWeight: 400,
      color: '#142039',
    },
    h3: {
      fontFamily: '"Gloock", serif',
      fontWeight: 400,
      color: '#142039',
    },
    h4: {
      fontFamily: '"Gloock", serif',
      fontWeight: 400,
      color: '#142039',
    },
    h5: {
      fontFamily: '"Gloock", serif',
      fontWeight: 400,
      color: '#142039',
    },
    h6: {
      fontFamily: '"Gloock", serif',
      fontWeight: 400,
      color: '#142039',
    },
    body1: {
      color: '#142039',
    },
    body2: {
      color: '#142039',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevent uppercase transformation
          borderRadius: 4,
        },
      },
    },
  },
});

export default theme;
