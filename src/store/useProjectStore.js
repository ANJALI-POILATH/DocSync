import { create } from 'zustand';
import { temporal } from 'zundo';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

const BRD_TEMPLATE = [
  { title: "Executive Summary" },
  { title: "Business Objectives" },
  { title: "Project Scope" },
  {
    title: "Stakeholders",
    tableData: {
      headers: ['Stakeholder', 'Role', 'Responsibility'],
      rows: [
        ['Project Owner', 'Decision Maker', 'Final approval of deliverables.'],
        ['Business Analyst', 'Requirements Lead', 'Define and validate requirements.'],
        ['Development Team', 'Engineering', 'Build and implement the system.'],
        ['QA Team', 'Testing', 'Ensure quality and validation.'],
        ['End Users', 'Users', 'Create and manage documents.']
      ]
    }
  },
  { title: "Business Requirements" },
  { title: "User Personas" },
  { title: "Functional Requirements" },
  { title: "Non-Functional Requirements" },
  { title: "Document Generation Workflow" },
  { title: "Assumptions" },
  { title: "Constraints" },
  { title: "Risks" },
  { title: "Success Criteria" },
  { title: "Future Enhancements" }
];

const SRS_TEMPLATE = [
  {
    title: "INTRODUCTION",
    children: [
      { title: "PURPOSE" },
      { title: "SCOPE OF THE SYSTEM" },
      {
        title: "DEFINITIONS & ACRONYMS",
        children: [
          { title: "Definitions" },
          { title: "Acronyms & Abbreviations" }
        ]
      },
      { title: "REFERENCES" },
      { title: "DOCUMENT OVERVIEW" }
    ]
  },
  {
    title: "OVERALL DESCRIPTION",
    children: [
      { title: "PRODUCT PERSPECTIVE" },
      { title: "PRODUCT FEATURES" },
      { title: "USER CLASSES & CHARACTERISTICS" },
      { title: "OPERATING ENVIRONMENT" },
      { title: "DESIGN & IMPLEMENTATION CONSTRAINTS" },
      { title: "ASSUMPTIONS & DEPENDENCIES" },
      { title: "FUTURE ENHANCEMENTS" }
    ]
  },
  {
    title: "SYSTEM FEATURES & FUNCTIONAL REQUIREMENTS",
    children: [
      { title: "FUNCTIONAL REQUIREMENTS" },
      {
        title: "NON-FUNCTIONAL REQUIREMENTS",
        children: [
          { title: "Performance" },
          { title: "Availability & Reliability" },
          { title: "Scalability" },
          { title: "Usability & Accessibility" },
          { title: "Security Requirements" }
        ]
      },
      {
        title: "INTERFACE REQUIREMENTS",
        children: [
          { title: "User Interface (UI/UX)" },
          { title: "Hardware Interface" },
          { title: "Software Interface" },
          { title: "Communication Interface" }
        ]
      }
    ]
  },
  {
    title: "SYSTEM MODELS / DESIGN AIDS",
    children: [
      { title: "USE CASE DIAGRAMS" },
      { title: "USE CASE DESCRIPTIONS" },
      { title: "ER DIAGRAM (DATABASE STRUCTURE)" },
      { title: "DATA FLOW DIAGRAMS (DFD) / FLOWCHARTS" },
      { title: "SEQUENCE DIAGRAM" },
      { title: "ARCHITECTURE DIAGRAM (HIGH-LEVEL SYSTEM ARCHITECTURE)" }
    ]
  },
  {
    title: "DATA REQUIREMENTS",
    children: [
      { title: "DATABASE SCHEMA" },
      { title: "DATABASE SCHEMA NOTES" }
    ]
  },
  {
    title: "SYSTEM CONSTRAINTS & STANDARDS",
    children: [
      { title: "REGULATORY COMPLIANCE" },
      { title: "TECHNOLOGY STACK CONSTRAINTS" },
      { title: "CODING STANDARDS" }
    ]
  },
  {
    title: "ACCEPTANCE CRITERIA",
    children: [
      { title: "FUNCTIONAL ACCEPTANCE CRITERIA" },
      { title: "UAT PROCESS & CHECKLIST" },
      { title: "PERFORMANCE BENCHMARKS" }
    ]
  },
  {
    title: "PROJECT SCOPE BOUNDARY",
    children: [
      { title: "In Scope" },
      { title: "Out of Scope" }
    ]
  },
  {
    title: "APPENDICES",
    children: [
      {
        title: "ASSUMPTIONS AND CONSTRAINTS",
        children: [
          { title: "Assumptions" },
          { title: "Constraints" }
        ]
      }
    ]
  },
  { title: "SUMMARY" }
];

const buildTemplate = (template) => {
  return template.map(item => ({
    ...item,
    id: uuidv4(),
    content: item.content || '',
    children: item.children ? buildTemplate(item.children) : []
  }));
};

const updateNode = (nodes, targetId, updateFn) => {
  return nodes.map(node => {
    if (node.id === targetId) return updateFn(node);
    if (node.children && node.children.length > 0) {
      return { ...node, children: updateNode(node.children, targetId, updateFn) };
    }
    return node;
  });
};

const deleteNode = (nodes, targetId) => {
  return nodes.filter(n => n.id !== targetId).map(node => {
    if (node.children && node.children.length > 0) {
      return { ...node, children: deleteNode(node.children, targetId) };
    }
    return node;
  });
};

const syncProject = async (project) => {
  try {
    const { error } = await supabase
      .from('projects')
      .update(project)
      .eq('id', project.id);
    
    if (error) throw error;
  } catch (err) {
    console.error("Failed to sync project", err);
  }
};

export const useProjectStore = create(
  temporal(
    (set, get) => ({
      projects: [],
      isLoading: false,
      error: null,
      
      fetchProjects: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { set({ projects: [], isLoading: false }); return; }

          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('createdAt', { ascending: false });
            
          if (error) throw error;
          set({ projects: data || [], isLoading: false });
        } catch (error) {
          console.error("Error fetching projects:", error);
          set({ error: error.message, isLoading: false });
        }
      },

      addProject: async (projectData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const newProject = {
          id: uuidv4(),
          user_id: user.id,
          name: projectData.name,
          description: projectData.description || '',
          scope: projectData.scope || '',
          documentType: projectData.documentType,
          createdAt: new Date().toISOString(),
          requirements: [],
          sections: projectData.documentType === 'BRD'
            ? buildTemplate(BRD_TEMPLATE)
            : projectData.documentType === 'SRS'
              ? buildTemplate(SRS_TEMPLATE)
              : []
        };

        const { data, error } = await supabase
          .from('projects')
          .insert([newProject])
          .select();

        if (error) throw error;
        const createdProject = data[0];
        set((state) => ({ projects: [createdProject, ...state.projects] }));
        return createdProject;
      },
      updateProject: async (id, projectData) => {
        set((state) => ({
          projects: state.projects.map(p => p.id === id ? { ...p, ...projectData } : p)
        }));
        const updatedProject = get().projects.find(p => p.id === id);
        if (updatedProject) await syncProject(updatedProject);
      },
      deleteProject: async (id) => {
        try {
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);
            
          if (error) throw error;
          
          set((state) => ({
            projects: state.projects.filter(p => p.id !== id)
          }));
        } catch (error) {
          console.error("Error deleting project:", error);
        }
      },
      
      initializeTemplate: async (projectId, documentType) => {
        set((state) => ({
          projects: state.projects.map(p => {
            if (p.id !== projectId) return p;
            const sections = documentType === 'BRD' 
              ? buildTemplate(BRD_TEMPLATE) 
              : documentType === 'SRS' ? buildTemplate(SRS_TEMPLATE) : [];
            return { ...p, sections };
          })
        }));
        const updatedProject = get().projects.find(p => p.id === projectId);
        if (updatedProject) await syncProject(updatedProject);
      },
      
      // SRS Requirements Methods
      addRequirement: async (projectId, requirement) => {
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? {
            ...p,
            requirements: [...p.requirements, { ...requirement, id: uuidv4() }]
          } : p)
        }));
        const updatedProject = get().projects.find(p => p.id === projectId);
        if (updatedProject) await syncProject(updatedProject);
      },
      updateRequirement: async (projectId, reqId, reqData) => {
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? {
            ...p,
            requirements: p.requirements.map(r => r.id === reqId ? { ...r, ...reqData } : r)
          } : p)
        }));
        const updatedProject = get().projects.find(p => p.id === projectId);
        if (updatedProject) await syncProject(updatedProject);
      },
      deleteRequirement: async (projectId, reqId) => {
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? {
            ...p,
            requirements: p.requirements.filter(r => r.id !== reqId)
          } : p)
        }));
        const updatedProject = get().projects.find(p => p.id === projectId);
        if (updatedProject) await syncProject(updatedProject);
      },
      reorderRequirements: async (projectId, newOrder) => {
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? {
            ...p,
            requirements: newOrder
          } : p)
        }));
        const updatedProject = get().projects.find(p => p.id === projectId);
        if (updatedProject) await syncProject(updatedProject);
      },

      // BRD Recursive Section Architecture
      addSectionNode: async (projectId, parentId, newNode) => {
        set((state) => ({
          projects: state.projects.map(p => {
            if (p.id !== projectId) return p;
            if (!parentId) {
               return { ...p, sections: [...(p.sections || []), { ...newNode, id: uuidv4(), content: '', children: [] }] };
            }
            return {
              ...p,
              sections: updateNode(p.sections, parentId, (node) => ({
                ...node,
                children: [...(node.children || []), { ...newNode, id: uuidv4(), content: '', children: [] }]
              }))
            };
          })
        }));
        const updatedProject = get().projects.find(p => p.id === projectId);
        if (updatedProject) await syncProject(updatedProject);
      },
      updateSectionNode: async (projectId, targetId, data) => {
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? {
            ...p,
            sections: updateNode(p.sections, targetId, (node) => ({ ...node, ...data }))
          } : p)
        }));
        const updatedProject = get().projects.find(p => p.id === projectId);
        if (updatedProject) await syncProject(updatedProject);
      },
      deleteSectionNode: async (projectId, targetId) => {
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? {
            ...p,
            sections: deleteNode(p.sections, targetId)
          } : p)
        }));
        const updatedProject = get().projects.find(p => p.id === projectId);
        if (updatedProject) await syncProject(updatedProject);
      },
      reorderSections: async (projectId, newOrder) => {
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? {
            ...p,
            sections: newOrder // Applies only to top level
          } : p)
        }));
        const updatedProject = get().projects.find(p => p.id === projectId);
        if (updatedProject) await syncProject(updatedProject);
      }
    }),
    { limit: 50 } // Keep up to 50 undo operations in memory
  )
);
