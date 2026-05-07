import { createContext, useContext, useState } from 'react';

const ProjectContext = createContext();

const MOCK_PROJECTS = [
  { id: '1', name: 'DocEngine MVP', description: 'Document Generator Initial Build', scope: 'Frontend UI/UX', status: 'Draft', updatedAt: '2026-04-18', requirements: [
    { id: 'r1', type: 'Functional', title: 'User Login', description: 'Users must be able to log in' }
  ] },
  { id: '2', name: 'E-commerce Platform', description: 'B2B Wholesale platform', scope: 'Full stack development', status: 'Completed', updatedAt: '2026-04-10', requirements: [] },
  { id: '3', name: 'HR Portal', description: 'Internal tool for HR', scope: '', status: 'Draft', updatedAt: '2026-04-19', requirements: [] },
];

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState(MOCK_PROJECTS);

  const addProject = (project) => {
    const newProject = {
      ...project,
      id: Date.now().toString(),
      status: 'Draft',
      updatedAt: new Date().toISOString().split('T')[0],
      requirements: []
    };
    setProjects([newProject, ...projects]);
    return newProject.id;
  };

  const getProject = (id) => projects.find(p => p.id === id);

  return (
    <ProjectContext.Provider value={{ projects, addProject, getProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => useContext(ProjectContext);
