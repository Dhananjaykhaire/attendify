import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssessmentIcon from '@mui/icons-material/Assessment';

{user?.role === 'faculty' && (
  <ListItem disablePadding>
    <ListItemButton
      component={Link}
      to="/proxy-attendance"
      selected={location.pathname === '/proxy-attendance'}
    >
      <ListItemIcon>
        <PersonAddIcon />
      </ListItemIcon>
      <ListItemText primary="Mark Proxy Attendance" />
    </ListItemButton>
  </ListItem>
)}

{user?.role === 'admin' && (
  <ListItem disablePadding>
    <ListItemButton
      component={Link}
      to="/proxy-stats"
      selected={location.pathname === '/proxy-stats'}
    >
      <ListItemIcon>
        <AssessmentIcon />
      </ListItemIcon>
      <ListItemText primary="Proxy Statistics" />
    </ListItemButton>
  </ListItem>
)} 