import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0d7c8f',
      light: '#3f9baa',
      dark: '#095664',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2e5e86',
      light: '#5a83a5',
      dark: '#1d3f5c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
});

export default theme;
