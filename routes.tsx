import HomePage from './pages/HomePage';
import LostItemsPage from './pages/LostItemsPage';
import FoundItemsPage from './pages/FoundItemsPage';
import ReportLostPage from './pages/ReportLostPage';
import ReportFoundPage from './pages/ReportFoundPage';
import HistoryPage from './pages/HistoryPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import ItemHistoryPage from './pages/ItemHistoryPage';
import MainHistoryPage from './pages/MainHistoryPage';
import ItemDetailPage from './pages/ItemDetailPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import ImageSearchPage from './pages/ImageSearchPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <HomePage />
  },
  {
    name: 'Lost Items',
    path: '/lost-items',
    element: <LostItemsPage />
  },
  {
    name: 'Found Items',
    path: '/found-items',
    element: <FoundItemsPage />
  },
  {
    name: 'Report Lost',
    path: '/report-lost',
    element: <ReportLostPage />
  },
  {
    name: 'Report Found',
    path: '/report-found',
    element: <ReportFoundPage />
  },
  {
    name: 'Smart Search',
    path: '/image-search',
    element: <ImageSearchPage />
  },
  {
    name: 'Success Stories',
    path: '/success-stories',
    element: <MainHistoryPage />
  },
  {
    name: 'Chats',
    path: '/chats',
    element: <ChatHistoryPage />
  },
  {
    name: 'Item History',
    path: '/item-history',
    element: <ItemHistoryPage />
  },
  {
    name: 'History',
    path: '/history',
    element: <HistoryPage />
  },
  {
    name: 'Item Detail',
    path: '/:type/:id',
    element: <ItemDetailPage />,
    visible: false
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    visible: false
  },
  {
    name: 'Signup',
    path: '/signup',
    element: <SignupPage />,
    visible: false
  },
  {
    name: 'Forgot Password',
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
    visible: false
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: <ResetPasswordPage />,
    visible: false
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <ProfilePage />,
    visible: false
  }
];

export default routes;
