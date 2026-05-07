import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { useProjectStore } from './store/useProjectStore';
import { useAuthStore } from './store/useAuthStore';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import Requirements from './pages/Requirements';
import Preview from './pages/Preview';
import Login from './pages/Login';
import Signup from './pages/Signup';

const TITLES_TO_REMOVE = [
  "Bulk QR Code Generation Engine", "Admin Dashboard", "QR Code Generation",
  "Batch-Based QR Generation", "Admin Authentication", "Dashboard Module",
  "Batch View & Management", "Export Module", "Logs & History Module",
  "Batch", "QR Code", "Admin User", "Export Record"
];

const ProtectedRoute = () => {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
};

const PublicRoute = () => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  return user ? <Navigate to="/" replace /> : <Outlet />;
};

function App() {
  const { init, user } = useAuthStore();
  const fetchProjects = useProjectStore(state => state.fetchProjects);
  const projects = useProjectStore(state => state.projects);

  // Initialize Supabase auth session on mount
  useEffect(() => {
    init();
  }, [init]);

  // Fetch projects once user is authenticated
  useEffect(() => {
    if (user) fetchProjects();
    else useProjectStore.setState({ projects: [] });
  }, [user, fetchProjects]);

  // Filter out stale/legacy section titles
  useEffect(() => {
    const store = useProjectStore.getState();
    let hasChanges = false;

    const filterNodes = (nodes) => {
      let changed = false;
      const filtered = nodes.filter(node => {
        if (TITLES_TO_REMOVE.includes(node.title)) { changed = true; return false; }
        return true;
      }).map(node => {
        if (node.children?.length > 0) {
          const { changed: childChanged, filtered: childFiltered } = filterNodes(node.children);
          if (childChanged) changed = true;
          return { ...node, children: childFiltered };
        }
        return node;
      });
      return { changed, filtered };
    };

    const newProjects = store.projects.map(p => {
      if (!p.sections?.length) return p;
      const { changed, filtered } = filterNodes(p.sections);
      if (changed) { hasChanges = true; return { ...p, sections: filtered }; }
      return p;
    });

    if (hasChanges) useProjectStore.setState({ projects: newProjects });
  }, [projects]);

  return (
    <Router>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects/new" element={<CreateProject />} />
            <Route path="projects/:id/requirements" element={<Requirements />} />
            <Route path="projects/:id/preview" element={<Preview />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
