import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import routes from './routes';
import Header from '@/components/layouts/Header';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';

const App = () => {
  useEffect(() => {
    // Enable dark mode by default
    document.documentElement.classList.add('dark');

    // Initialize localStorage with sample "My Reports" data if not already set
    const initializeMyReports = () => {
      // Force re-initialization for updated data (check version)
      const currentVersion = '2.0';
      const storedVersion = localStorage.getItem('myReportsVersion');
      
      if (storedVersion === currentVersion) {
        return;
      }

      // Sample lost report IDs (these are actual IDs from the database)
      const sampleLostReports = [
        "61e06ef3-9e9c-4207-a5fa-39dfb9378cbc",
        "c0ba7707-b297-4522-bc7c-89b3420b2abf",
        "c5828a9f-b720-4977-98a8-c1c735bfb171",
        "5006dc05-6de4-4bc9-ad8b-9a6543126346",
        "a7b3f125-a0a2-431e-801d-61da94bfaacb",
        "9c3b2746-d2cd-4335-a802-bb05d7553eec",
        "4e937058-e166-485c-bf94-7621a53f1261",
        "509890b0-bf0f-4847-a47a-5dcd0570ce8c"
      ];
      
      // Sample found report IDs (these are actual IDs from the database)
      const sampleFoundReports = [
        "d9a8cdfc-7fab-488d-97ca-8e896cc84dcc",
        "5dd07192-8be8-478b-9578-b64ae5ac1af7",
        "f3acee1a-f9fb-466d-9ab5-6d98fc5ebeb0",
        "08ec39c8-28f6-49f4-80d3-5bacf69c07f0",
        "b4a08d1a-eb86-4391-81af-a5bdad6f7a12",
        "8594ed35-f64f-42a3-a858-4f9988f152d8",
        "4458c806-89e2-4e6f-94b9-a4a43e3e6873",
        "44e3495a-f695-435b-ae09-4aa62439428d"
      ];

      // Set the sample reports in localStorage
      localStorage.setItem('myLostReports', JSON.stringify(sampleLostReports));
      localStorage.setItem('myFoundReports', JSON.stringify(sampleFoundReports));

      // Mark version
      localStorage.setItem('myReportsVersion', currentVersion);
    };

    initializeMyReports();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <RouteGuard>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Routes>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  element={route.element}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </RouteGuard>
      </AuthProvider>
    </Router>
  );
};

export default App;
