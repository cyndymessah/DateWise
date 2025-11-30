import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Heart, Home, Users, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/matches', icon: Heart, label: 'Matches' },
    { to: '/mutual-matches', icon: Users, label: 'Connections' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <NavLink to="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
              <span className="text-2xl font-bold text-gradient">DateWise</span>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center space-x-2 px-4 py-2 rounded-lg transition-all',
                      isActive
                        ? 'bg-primary-50 text-primary-600 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    )
                  }
                >
                  <link.icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <span className="hidden sm:block text-sm text-gray-600">
                Hi, {user?.name}!
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center flex-1 h-full transition-all',
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500'
                )
              }
            >
              <link.icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{link.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Add padding at bottom for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
