import React from 'react';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import vidaLogo from '../assets/VIDA.png';
import vamLogo from '../assets/ValueMomentum_logo.png';
import '../styles/AppHeader.css';

interface NavTab {
  label: string;
  path: string;
}

const NAV_TABS: NavTab[] = [
  { label: 'Dashboard',       path: '/dashboard'        },
  { label: 'Approvals',        path: '/approvals'        },
  { label: 'Repositories',     path: '/repos'            },
  { label: 'Onboarding',       path: '/onboarding'       },
  { label: 'Deployments',      path: '/deployments'      },
  { label: 'Builds',           path: '/builds'           },
  { label: 'Failed Pipelines', path: '/failed-pipelines' },
];

export const AppHeader: React.FC = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  if (location.pathname === '/login') return null;

  const handleLogout = (): void => {
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <AppBar position="fixed" elevation={0} className="header-root">
      <Toolbar sx={{ minHeight: '64px !important' }}>
        <img src={vidaLogo} alt="VIDA Cortex" style={{ height: 40, width: 'auto', marginRight: 12, objectFit: 'contain' }} />

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
          {NAV_TABS.map((tab) => (
            <Button
              key={tab.path}
              component={RouterLink}
              to={tab.path}
              size="small"
              className={`header-nav-btn ${location.pathname === tab.path ? 'active' : 'inactive'}`}
            >
              {tab.label}
            </Button>
          ))}
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          className="header-logout-btn"
          sx={{ color: '#ffffff !important' }}
        >
          Logout
        </Button>

        <img src={vamLogo} alt="ValueMomentum" style={{ height: 36, width: 'auto', marginLeft: 'auto', objectFit: 'contain' }} />
      </Toolbar>
    </AppBar>
  );
};
