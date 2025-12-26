import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useSocket } from '../contexts/SocketContext';

const Container = styled.div`
  display: flex;
  height: 100vh;
  background: ${props => props.theme.colors.background};
  overflow: hidden;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
  }
`;

const Sidebar = styled.nav`
  width: 200px;
  min-width: 200px;
  background: ${props => props.theme.colors.surface};
  box-shadow: ${props => props.theme.shadows.sm};
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${props => props.theme.colors.border};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: none;
  }
`;

const Logo = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  text-align: center;
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const NavItem = styled.li``;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.isActive
    ? props.theme.colors.primary
    : props.theme.colors.textSecondary};
  background: ${props => props.isActive
    ? `${props.theme.colors.primary}15`
    : 'transparent'};
  transition: ${props => props.theme.transitions.fast};
  text-decoration: none;
  font-weight: 500;
  font-size: 0.85rem;

  &:hover {
    background: ${props => props.isActive
      ? `${props.theme.colors.primary}25`
      : props.theme.colors.surfaceHover};
    color: ${props => props.isActive
      ? props.theme.colors.primary
      : props.theme.colors.text};
  }
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding-bottom: 60px; /* Space for bottom nav */
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  min-height: 50px;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    min-height: 48px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.xs};
  font-size: 1.25rem;
  color: ${props => props.theme.colors.text};
  cursor: pointer;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const MobileLogo = styled.span`
  display: none;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: inline;
  }
`;

const Title = styled.h1`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 0.95rem;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: ${props => props.theme.spacing.lg};
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md};
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.sm};
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    gap: ${props => props.theme.spacing.xs};
  }
`;

const StatusDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.connected
    ? props.theme.colors.success
    : props.theme.colors.danger};
  box-shadow: 0 0 0 2px ${props => props.connected
    ? `${props.theme.colors.success}30`
    : `${props.theme.colors.danger}30`};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    width: 8px;
    height: 8px;
  }
`;

const StatusText = styled.span`
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fontWeights.medium};
  color: ${props => props.connected
    ? props.theme.colors.success
    : props.theme.colors.danger};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    display: none;
  }
`;

// Bottom Navigation for Mobile
const BottomNav = styled.nav`
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.surface};
  border-top: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: ${props => props.theme.spacing.xs} 0;
  padding-bottom: env(safe-area-inset-bottom, ${props => props.theme.spacing.xs});

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
`;

const BottomNavLink = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  color: ${props => props.isActive
    ? props.theme.colors.primary
    : props.theme.colors.textMuted};
  text-decoration: none;
  font-size: 0.65rem;
  font-weight: 500;
  min-width: 50px;
  transition: ${props => props.theme.transitions.fast};

  &:active {
    transform: scale(0.95);
  }
`;

const BottomNavIcon = styled.span`
  font-size: 1.25rem;
  margin-bottom: 2px;
`;

const BottomNavLabel = styled.span`
  white-space: nowrap;
`;

// Mobile Drawer Menu
const DrawerOverlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.2s ease, visibility 0.2s ease;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: block;
  }
`;

const Drawer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  max-width: 80vw;
  height: 100%;
  background: ${props => props.theme.colors.surface};
  z-index: 1002;
  transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
  box-shadow: ${props => props.theme.shadows.lg};
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const DrawerLogo = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
`;

const DrawerCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${props => props.theme.colors.textMuted};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  line-height: 1;
`;

const DrawerNav = styled.ul`
  list-style: none;
  margin: 0;
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  flex: 1;
  overflow-y: auto;
`;

const DrawerNavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.isActive
    ? props.theme.colors.primary
    : props.theme.colors.text};
  background: ${props => props.isActive
    ? `${props.theme.colors.primary}15`
    : 'transparent'};
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  transition: ${props => props.theme.transitions.fast};

  &:active {
    background: ${props => props.theme.colors.surfaceHover};
  }
`;

const navItems = [
  { path: '/', label: 'Dashboard', icon: '🏠', exact: true },
  { path: '/hydro-units', label: 'Hydro Units', icon: '🌱' },
  { path: '/cameras', label: 'Cameras', icon: '📷' },
  { path: '/export', label: 'Data Export', icon: '📊' },
  { path: '/room-front', label: 'Front Room', icon: '🏠' },
  { path: '/room-back', label: 'Back Room', icon: '🏢' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

// Bottom nav only shows 5 most important items
const bottomNavItems = [
  { path: '/', label: 'Home', icon: '🏠', exact: true },
  { path: '/hydro-units', label: 'Units', icon: '🌱' },
  { path: '/cameras', label: 'Cameras', icon: '📷' },
  { path: '/export', label: 'Export', icon: '📊' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

function getPageTitle(pathname) {
  if (pathname === '/') return 'Dashboard';
  if (pathname === '/hydro-units') return 'Hydro Units';
  if (pathname === '/settings') return 'Settings';
  if (pathname.startsWith('/hydro-units/')) {
    const unitId = pathname.split('/')[2];
    return `Unit ${unitId.toUpperCase()}`;
  }
  if (pathname === '/cameras') return 'Camera Monitoring';
  if (pathname === '/export') return 'Data Export';
  if (pathname === '/room-front') return 'Front Room';
  if (pathname === '/room-back') return 'Back Room';
  return 'Hydroponics System';
}

const Layout = ({ children }) => {
  const location = useLocation();
  const { connected } = useSocket();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <Container>
      {/* Desktop Sidebar */}
      <Sidebar>
        <Logo>🌿 NeuralKissan</Logo>
        <NavList>
          {navItems.map((item) => (
            <NavItem key={item.path}>
              <NavLink
                to={item.path}
                isActive={
                  item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path)
                }
              >
                {item.icon} {item.label}
              </NavLink>
            </NavItem>
          ))}
        </NavList>
      </Sidebar>

      {/* Mobile Drawer */}
      <DrawerOverlay isOpen={drawerOpen} onClick={closeDrawer} />
      <Drawer isOpen={drawerOpen}>
        <DrawerHeader>
          <DrawerLogo>🌿 NeuralKissan</DrawerLogo>
          <DrawerCloseButton onClick={closeDrawer}>&times;</DrawerCloseButton>
        </DrawerHeader>
        <DrawerNav>
          {navItems.map((item) => (
            <li key={item.path}>
              <DrawerNavLink
                to={item.path}
                isActive={
                  item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path)
                }
                onClick={closeDrawer}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                {item.label}
              </DrawerNavLink>
            </li>
          ))}
        </DrawerNav>
      </Drawer>

      <Main>
        <Header>
          <HeaderLeft>
            <MobileMenuButton onClick={() => setDrawerOpen(true)}>
              ☰
            </MobileMenuButton>
            <MobileLogo>🌿 NeuralKissan</MobileLogo>
            <Title>{getPageTitle(location.pathname)}</Title>
          </HeaderLeft>
          <StatusIndicator>
            <StatusDot connected={connected} />
            <StatusText connected={connected}>
              {connected ? 'Connected' : 'Disconnected'}
            </StatusText>
          </StatusIndicator>
        </Header>
        <Content>
          {children}
        </Content>
      </Main>

      {/* Mobile Bottom Navigation */}
      <BottomNav>
        {bottomNavItems.map((item) => (
          <BottomNavLink
            key={item.path}
            to={item.path}
            isActive={
              item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path)
            }
          >
            <BottomNavIcon>{item.icon}</BottomNavIcon>
            <BottomNavLabel>{item.label}</BottomNavLabel>
          </BottomNavLink>
        ))}
      </BottomNav>
    </Container>
  );
};

export default Layout;
