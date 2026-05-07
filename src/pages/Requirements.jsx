import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../store/useProjectStore';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, GripVertical, Trash2, ArrowRight, Eye, ArrowLeft, ChevronDown, ChevronRight, FilePlus, Undo2, Redo2, Image as ImageIcon, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

const TableEditor = ({ tableData, onChange }) => {
  if (!tableData) return null;
  const { headers, rows } = tableData;

  const updateHeader = (cIndex, val) => {
    const newHeaders = [...headers];
    newHeaders[cIndex] = val;
    onChange({ ...tableData, headers: newHeaders });
  };

  const updateCell = (rIndex, cIndex, val) => {
    const newRows = [...rows];
    newRows[rIndex] = [...newRows[rIndex]];
    newRows[rIndex][cIndex] = val;
    onChange({ ...tableData, rows: newRows });
  };

  const addRow = () => {
    const newRow = new Array(headers.length).fill('');
    onChange({ ...tableData, rows: [...rows, newRow] });
  };

  const addColumn = () => {
    onChange({
      ...tableData,
      headers: [...headers, 'New Column'],
      rows: rows.map(r => [...r, ''])
    });
  };

  const addColAt = (idx) => {
    const newHeaders = [...headers];
    newHeaders.splice(idx + 1, 0, 'New Column');
    const newRows = rows.map(r => {
      const nr = [...r];
      nr.splice(idx + 1, 0, '');
      return nr;
    });
    onChange({ ...tableData, headers: newHeaders, rows: newRows });
  };

  const addRowAt = (idx) => {
    const newRow = new Array(headers.length).fill('');
    const newRows = [...rows];
    newRows.splice(idx + 1, 0, newRow);
    onChange({ ...tableData, rows: newRows });
  };

  const delColumn = (idx) => {
    if (headers.length <= 1) return;
    onChange({
      ...tableData,
      headers: headers.filter((_, i) => i !== idx),
      rows: rows.map(r => r.filter((_, j) => j !== idx))
    });
  };

  const handlePaste = (e, startType, startRowIdx, startColIdx) => {
    let pastedGrid = [];
    const html = e.clipboardData.getData('text/html');
    const plain = e.clipboardData.getData('text/plain');

    if (html && html.includes('<table')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const table = doc.querySelector('table');
      if (table) {
        const trs = Array.from(table.querySelectorAll('tr'));
        pastedGrid = trs.map(tr => {
          const cells = Array.from(tr.querySelectorAll('th, td'));
          return cells.map(c => c.innerText.trim());
        });
      }
    }

    if (pastedGrid.length === 0 && plain) {
      if (!plain.includes('\t') && !plain.includes('\n')) return;
      pastedGrid = plain.replace(/\r/g, '').trimEnd().split('\n').map(row => {
        if (row.includes('\t')) return row.split('\t');
        return row.split(/\s{2,}/); 
      });
    }

    if (pastedGrid.length === 0 || pastedGrid.every(r => r.length === 0)) return;
    
    e.preventDefault();
    
    let newHeaders = [...headers];
    let newRows = rows.map(r => [...r]);

    const ensureCols = (cIdx) => {
      while (newHeaders.length <= cIdx) {
        newHeaders.push(`Column ${newHeaders.length + 1}`);
        newRows.forEach(nr => nr.push(''));
      }
    };

    if (startType === 'header') {
      const headerData = pastedGrid[0] || [];
      const bodyData = pastedGrid.slice(1);
      
      headerData.forEach((val, ch) => {
        const c = startColIdx + ch;
        ensureCols(c);
        newHeaders[c] = val;
      });
      
      bodyData.forEach((row, rh) => {
        const r = rh;
        while (newRows.length <= r) newRows.push(new Array(newHeaders.length).fill(''));
        row.forEach((val, ch) => {
          const c = startColIdx + ch;
          ensureCols(c);
          newRows[r][c] = val;
        });
      });
    } else {
      pastedGrid.forEach((row, rh) => {
        const r = startRowIdx + rh;
        while (newRows.length <= r) newRows.push(new Array(newHeaders.length).fill(''));
        row.forEach((val, ch) => {
          const c = startColIdx + ch;
          ensureCols(c);
          newRows[r][c] = val;
        });
      });
    }
    
    onChange({ headers: newHeaders, rows: newRows });
  };

  return (
    <div className="mt-4 mb-2 overflow-x-auto border border-slate-200 rounded-lg bg-white p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
         <span className="text-sm font-semibold text-slate-500">Data Table</span>
         <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={addColumn} className="h-7 text-xs bg-slate-50">+ Column</Button>
           <Button variant="outline" size="sm" onClick={addRow} className="h-7 text-xs bg-slate-50">+ Row</Button>
           <Button variant="ghost" size="sm" onClick={() => onChange(null)} className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={12} className="mr-1" /> Remove</Button>
         </div>
      </div>
      <table className="w-full text-sm text-left border-collapse table-fixed">
        <thead className="bg-slate-100/80">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-slate-200 p-0 relative group">
                <input 
                  value={h} 
                  onChange={e => updateHeader(i, e.target.value)} 
                  onPaste={e => handlePaste(e, 'header', 0, i)}
                  className="w-full bg-transparent p-2 font-semibold text-slate-800 focus:outline-none focus:bg-white" 
                />
                <button onClick={() => addColAt(i)} title="Insert column right" className="absolute -right-3 top-1/2 -translate-y-1/2 bg-indigo-100 text-indigo-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"><Plus size={12} /></button>
                <button onClick={() => delColumn(i)} title="Delete column" className="absolute -top-3 -right-2 bg-red-100 text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 size={12} /></button>
              </th>
            ))}
            <th className="w-16 border-none bg-transparent"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="group/row">
              {row.map((cell, j) => (
                <td key={j} className="border border-slate-200 p-0">
                  <input 
                    value={cell} 
                    onChange={e => updateCell(i, j, e.target.value)} 
                    onPaste={e => handlePaste(e, 'body', i, j)}
                    className="w-full bg-transparent p-2 text-slate-700 focus:outline-none focus:bg-indigo-50/50 hover:bg-slate-50 transition-colors" 
                  />
                </td>
              ))}
              <td className="w-16 border-none px-2 opacity-0 group-hover/row:opacity-100 whitespace-nowrap text-right">
                <button title="Insert row below" onClick={() => addRowAt(i)} className="text-indigo-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50 mr-1"><Plus size={14} /></button>
                <button title="Delete row" onClick={() => onChange({...tableData, rows: rows.filter((_, idx) => idx !== i)})} className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Recursive Node Component for BRD Hierarchy ---
const RecursiveSectionNode = ({ node, projectId, depth = 0, address }) => {
  const { updateSectionNode, deleteSectionNode, addSectionNode } = useProjectStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const fileInputRef = React.useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateSectionNode(projectId, node.id, { imageUrl: event.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset
  };

  const handleAddTable = () => {
    let defaultTable = { headers: ['Column 1', 'Column 2'], rows: [['', '']] };
    if (node.title === 'Stakeholders') {
      defaultTable = {
        headers: ['Stakeholder', 'Role', 'Responsibility'],
        rows: [
          ['Project Owner', 'Decision Maker', 'Final approval of deliverables.'],
          ['Business Analyst', 'Requirements Lead', 'Define and validate requirements.'],
          ['Development Team', 'Engineering', 'Build and implement the system.'],
          ['QA Team', 'Testing', 'Ensure quality and validation.'],
          ['End Users', 'Users', 'Create and manage documents.']
        ]
      };
    }
    updateSectionNode(projectId, node.id, { tableData: defaultTable });
  };

  // Depth-based typography and styling
  const indentClass = depth > 0 ? "ml-6 border-l-2 border-slate-200 pl-4 py-2 mt-3" : "p-4 bg-white border border-slate-200 rounded-xl shadow-sm mt-4";
  const titleSize = depth === 0 ? "text-lg font-bold" : depth === 1 ? "text-md font-semibold" : "text-sm font-semibold";
  
  return (
    <div className={indentClass}>
      <div className="flex items-start gap-2 group">
        <button onClick={() => setIsExpanded(!isExpanded)} className="mt-2 text-slate-400 hover:text-indigo-600 transition-colors">
           {node.children?.length > 0 ? (isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />) : <div className="w-[18px]" />}
        </button>
        
        <div className="flex-1 space-y-2">
           <div className="flex items-center gap-2">
             <span className="font-mono text-xs text-slate-400 font-semibold select-none w-8">{address}</span>
             <input 
               value={node.title}
               onChange={(e) => updateSectionNode(projectId, node.id, { title: e.target.value })}
               className={cn("w-full bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-slate-300 text-slate-900 group-hover:bg-slate-50 transition-colors rounded p-1", titleSize)}
               placeholder={`Section ${address} Title...`}
             />
           </div>
           
           <AnimatePresence>
             {isExpanded && (
               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                 <div className="rounded-md border border-slate-200 bg-white overflow-hidden transition-colors focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                   <ReactQuill
                     theme="snow"
                     value={node.content || ''}
                     onChange={(val) => updateSectionNode(projectId, node.id, { content: val })}
                     placeholder="Enter section content analysis here..."
                   />
                 </div>
                 
                 {node.tableData && (
                   <TableEditor 
                     tableData={node.tableData} 
                     onChange={(data) => updateSectionNode(projectId, node.id, { tableData: data })} 
                   />
                 )}

                 {node.imageUrl !== undefined && (
                   <div className="mt-3 relative group/image border border-slate-200 rounded-lg p-3 bg-slate-50">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-semibold text-slate-500 flex items-center gap-1.5"><ImageIcon size={14} /> Diagram / Image</span>
                       <button onClick={() => updateSectionNode(projectId, node.id, { imageUrl: undefined })} className="text-red-500 hover:text-red-700 transition-colors">
                         <Trash2 size={14} />
                       </button>
                     </div>
                     {node.imageUrl ? (
                       <div className="bg-white rounded border border-slate-200 p-2 flex justify-center">
                         <img src={node.imageUrl} alt="Section Attachment" className="max-w-full max-h-[400px] object-contain rounded" />
                       </div>
                     ) : (
                       <div className="text-sm text-slate-500 italic p-4 text-center border-2 border-dashed border-slate-200 bg-white rounded-lg">
                         Image placeholder. Click "Upload Image" below.
                       </div>
                     )}
                   </div>
                 )}
                 
                 <div className="flex gap-2">
                   <Button variant="secondary" size="sm" className="h-7 text-xs gap-1.5" onClick={() => addSectionNode(projectId, node.id, { title: '' })}>
                     <Plus size={12} /> Add Subsection
                   </Button>
                   {!node.tableData && (
                     <Button variant="secondary" size="sm" className="h-7 text-xs gap-1.5" onClick={handleAddTable}>
                       <FilePlus size={12} /> Add Table
                     </Button>
                   )}
                   {node.imageUrl === undefined && (
                     <>
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         style={{ display: 'none' }} 
                         accept="image/png, image/jpeg, image/svg+xml"
                         onChange={handleImageUpload}
                       />
                       <Button variant="secondary" size="sm" className="h-7 text-xs gap-1.5" onClick={() => fileInputRef.current?.click()}>
                         <ImageIcon size={12} /> Upload Image
                       </Button>
                     </>
                   )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteSectionNode(projectId, node.id)}>
                      <Trash2 size={12} /> Delete
                    </Button>
                 </div>

                 {node.children?.length > 0 && (
                   <div className="mt-2">
                     {node.children.map((child, index) => (
                       <RecursiveSectionNode key={child.id} node={child} projectId={projectId} depth={depth + 1} address={`${address}.${index + 1}`} />
                     ))}
                   </div>
                 )}
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};


// --- Sortable Top-Level Node ---
const SortableRootSection = ({ node, projectId, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="relative group/root">
      <div {...attributes} {...listeners} className="absolute left-[-24px] top-6 p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 select-none">
        <GripVertical size={20} />
      </div>
      <RecursiveSectionNode node={node} projectId={projectId} depth={0} address={(index + 1).toString()} />
    </div>
  );
};

export default function Requirements() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, updateProject, addRequirement, updateRequirement, deleteRequirement, reorderRequirements, reorderSections, initializeTemplate, addSectionNode } = useProjectStore();
  
  const undo = useStore(useProjectStore.temporal, state => state.undo);
  const redo = useStore(useProjectStore.temporal, state => state.redo);
  const pastStates = useStore(useProjectStore.temporal, state => state.pastStates);
  const futureStates = useStore(useProjectStore.temporal, state => state.futureStates);

  const project = projects.find(p => p.id === id);
  const [activeId, setActiveId] = useState(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const coverInputRef = React.useRef(null);
  const headerInputRef = React.useRef(null);

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      useProjectStore.getState().updateProject(project.id, { coverImage: event.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleHeaderUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      useProjectStore.getState().updateProject(project.id, { headerImage: event.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!project) return <div className="p-8">Project not found</div>;

  const isLegacySRS = project.documentType === 'SRS' && (!project.sections || project.sections.length === 0) && project.requirements && project.requirements.length > 0;
  const useTreeMode = project.documentType === 'BRD' || (project.documentType === 'SRS' && !isLegacySRS);

  useEffect(() => {
    if (useTreeMode && project && (!project.sections || project.sections.length === 0)) {
      initializeTemplate(project.id, project.documentType);
    }
  }, [useTreeMode, project?.id, project?.documentType, project?.sections?.length, initializeTemplate]);

  const handleDragStart = (event) => setActiveId(event.active.id);
  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    if (useTreeMode) {
      const oldIndex = project.sections.findIndex(s => s.id === active.id);
      const newIndex = project.sections.findIndex(s => s.id === over.id);
      reorderSections(project.id, arrayMove(project.sections, oldIndex, newIndex));
    } else {
      const oldIndex = project.requirements.findIndex(r => r.id === active.id);
      const newIndex = project.requirements.findIndex(r => r.id === over.id);
      reorderRequirements(project.id, arrayMove(project.requirements, oldIndex, newIndex));
    }
  };

  const currentList = useTreeMode ? (project.sections || []) : (project.requirements || []);
  const draggedItemTitle = activeId ? currentList.find(x => x.id === activeId)?.title : '';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6 pb-32">
      <div className="flex justify-between items-center bg-white/70 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">{project.name}</h1>
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none", project.documentType === 'BRD' ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-sky-50 text-sky-600 border-sky-200")}>
                {project.documentType || 'SRS'}
              </span>
            </div>
            <p className="text-sm text-slate-500">Document Builder Canvas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 mr-2 shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => undo()} disabled={pastStates.length === 0} className="w-8 h-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent" title="Undo">
              <Undo2 size={16} />
            </Button>
            <div className="w-[1px] h-4 bg-slate-200 mx-0.5"></div>
            <Button variant="ghost" size="icon" onClick={() => redo()} disabled={futureStates.length === 0} className="w-8 h-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent" title="Redo">
              <Redo2 size={16} />
            </Button>
          </div>
          <Button className="gap-2 bg-slate-900 border-0 shadow-md" onClick={() => navigate(`/projects/${project.id}/preview`)}>
            <Eye size={16} /> Preview Render
            <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>

      <div className="pl-6 pr-2">
        <div className="mb-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div 
            className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => setSettingsExpanded(!settingsExpanded)}
          >
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-slate-500" />
              <h3 className="font-semibold text-slate-800">Cover Page Settings</h3>
            </div>
            {settingsExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
          </div>
          <AnimatePresence>
            {settingsExpanded && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Client / Hospital Name" 
                      placeholder="e.g. DAYA GENERAL HOSPITAL" 
                      value={project.clientName || ''} 
                      onChange={(e) => useProjectStore.getState().updateProject(project.id, { clientName: e.target.value })} 
                    />
                    <Input 
                      label="Cover Project Title" 
                      placeholder="e.g. SMART HOSPITAL MANAGEMENT SYSTEM" 
                      value={project.coverTitle || ''} 
                      onChange={(e) => useProjectStore.getState().updateProject(project.id, { coverTitle: e.target.value })} 
                    />
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Cover Background Image</label>
                      <div className="flex items-center gap-3">
                        <input type="file" ref={coverInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg" onChange={handleCoverUpload} />
                        <Button variant="outline" className="flex-1" onClick={() => coverInputRef.current?.click()}>
                          <ImageIcon size={16} className="mr-2" /> {project.coverImage ? 'Change Image' : 'Upload Image'}
                        </Button>
                        {project.coverImage && (
                          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => useProjectStore.getState().updateProject(project.id, { coverImage: null })}>
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Document Header/Footer Template</label>
                      <div className="flex items-center gap-3">
                        <input type="file" ref={headerInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg" onChange={handleHeaderUpload} />
                        <Button variant="outline" className="flex-1" onClick={() => headerInputRef.current?.click()}>
                          <ImageIcon size={16} className="mr-2" /> {project.headerImage ? 'Change Template' : 'Upload Template'}
                        </Button>
                        {project.headerImage && (
                          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => useProjectStore.getState().updateProject(project.id, { headerImage: null })}>
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Input 
                      label="Prepared By" 
                      placeholder="Name" 
                      value={project.preparedBy || ''} 
                      onChange={(e) => useProjectStore.getState().updateProject(project.id, { preparedBy: e.target.value })} 
                    />
                    <Input 
                      label="Approved By" 
                      placeholder="Name" 
                      value={project.approvedBy || ''} 
                      onChange={(e) => useProjectStore.getState().updateProject(project.id, { approvedBy: e.target.value })} 
                    />
                  </div>
                  
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-medium text-slate-700">Document Version History</label>
                      <Button variant="outline" size="sm" onClick={() => {
                        const history = project.versionHistory || [{ version: '1.0', date: new Date().toLocaleDateString('en-GB'), amendment: 'Initial Release', author: project.preparedBy || '' }];
                        useProjectStore.getState().updateProject(project.id, {
                          versionHistory: [...history, { version: '', date: new Date().toLocaleDateString('en-GB'), amendment: '', author: '' }]
                        });
                      }}>
                        <Plus size={14} className="mr-1" /> Add Version
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(project.versionHistory || [{ version: '1.0', date: new Date().toLocaleDateString('en-GB'), amendment: 'Initial Release', author: project.preparedBy || 'Author' }]).map((vh, i) => (
                        <div key={i} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <Input placeholder="Version" value={vh.version || ''} onChange={(e) => {
                            const newHistory = [...(project.versionHistory || [{ version: '1.0', date: new Date().toLocaleDateString('en-GB'), amendment: 'Initial Release', author: project.preparedBy || 'Author' }])];
                            newHistory[i].version = e.target.value;
                            useProjectStore.getState().updateProject(project.id, { versionHistory: newHistory });
                          }} className="w-24" />
                          <Input placeholder="Date" value={vh.date || ''} onChange={(e) => {
                            const newHistory = [...(project.versionHistory || [{ version: '1.0', date: new Date().toLocaleDateString('en-GB'), amendment: 'Initial Release', author: project.preparedBy || 'Author' }])];
                            newHistory[i].date = e.target.value;
                            useProjectStore.getState().updateProject(project.id, { versionHistory: newHistory });
                          }} className="w-32" />
                          <Input placeholder="Amendment" value={vh.amendment || ''} onChange={(e) => {
                            const newHistory = [...(project.versionHistory || [{ version: '1.0', date: new Date().toLocaleDateString('en-GB'), amendment: 'Initial Release', author: project.preparedBy || 'Author' }])];
                            newHistory[i].amendment = e.target.value;
                            useProjectStore.getState().updateProject(project.id, { versionHistory: newHistory });
                          }} className="flex-1" />
                          <Input placeholder="Author" value={vh.author || ''} onChange={(e) => {
                            const newHistory = [...(project.versionHistory || [{ version: '1.0', date: new Date().toLocaleDateString('en-GB'), amendment: 'Initial Release', author: project.preparedBy || 'Author' }])];
                            newHistory[i].author = e.target.value;
                            useProjectStore.getState().updateProject(project.id, { versionHistory: newHistory });
                          }} className="w-48" />
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 mt-0.5" onClick={() => {
                            const newHistory = [...(project.versionHistory || [{ version: '1.0', date: new Date().toLocaleDateString('en-GB'), amendment: 'Initial Release', author: project.preparedBy || 'Author' }])];
                            newHistory.splice(i, 1);
                            useProjectStore.getState().updateProject(project.id, { versionHistory: newHistory });
                          }}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={currentList.map(x => x.id)} strategy={verticalListSortingStrategy}>
            
            {/* HIERARCHY TREE RENDER */}
            {useTreeMode && (
              <div className="space-y-4 relative">
                <div className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-slate-200 -z-10" />
                {(project.sections || []).length === 0 ? (
                  <div className="text-center py-20 bg-white/50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500 mb-4">No sections found. Start by adding your first section or initialize with a template.</p>
                    <div className="flex items-center justify-center gap-3">
                      <Button onClick={() => addSectionNode(project.id, null, { title: '' })}>
                        <Plus size={16} className="mr-2" /> Add Section
                      </Button>
                      <Button variant="secondary" onClick={() => initializeTemplate(project.id, project.documentType)}>
                        <FilePlus size={16} className="mr-2" /> Load {project.documentType || 'SRS'} Template
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {(project.sections || []).map((sec, index) => (
                      <SortableRootSection key={sec.id} node={sec} projectId={project.id} index={index} />
                    ))}
                    <Button variant="outline" className="w-full mt-4" onClick={() => addSectionNode(project.id, null, { title: '' })}>
                      <Plus size={16} className="mr-2" /> Add Root Section
                    </Button>
                  </>
                )}
              </div>
            )}
            
            {/* SRS FLAT RENDER (LEGACY) */}
            {!useTreeMode && (
              <div className="space-y-3">
                {project.requirements.length === 0 ? (
                  <div className="text-center py-20 bg-white/50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500 mb-4">Start by adding your first requirement.</p>
                    <Button onClick={() => addRequirement(project.id, { title: '', description: '', type: 'Functional' })}>
                      <Plus size={16} className="mr-2" /> Add Requirement
                    </Button>
                  </div>
                ) : (
                  project.requirements.map(req => {
                    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: req.id });
                    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
                    return (
                      <div ref={setNodeRef} style={style} key={req.id} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg shadow-sm group">
                        <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                          <GripVertical size={20} />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-3">
                            <Input value={req.title} onChange={(e) => updateRequirement(project.id, req.id, { title: e.target.value })} placeholder="Requirement Title" className="flex-1" />
                            <select value={req.type} onChange={(e) => updateRequirement(project.id, req.id, { type: e.target.value })} className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600">
                              <option value="Functional">Functional</option>
                              <option value="Non-Functional">Non-Functional</option>
                            </select>
                          </div>
                          <div className="rounded-md border border-slate-200 bg-slate-50 overflow-hidden focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500">
                            <ReactQuill 
                              theme="snow"
                              value={req.description || ''} 
                              onChange={(val) => updateRequirement(project.id, req.id, { description: val })} 
                              placeholder="Detailed description..."
                            />
                          </div>
                        </div>
                        <button onClick={() => deleteRequirement(project.id, req.id)} className="text-slate-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })
                )}
                {!useTreeMode && project.requirements.length > 0 && (
                   <Button variant="outline" className="w-full mt-4" onClick={() => addRequirement(project.id, { title: '', description: '', type: 'Functional' })}>
                     <Plus size={16} className="mr-2" /> Add Requirement
                   </Button>
                )}
              </div>
            )}

          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="p-4 bg-white border border-indigo-500 rounded-xl shadow-2xl opacity-90 scale-105 flex items-center gap-3">
                <GripVertical size={20} className="text-slate-400" />
                <span className="font-semibold text-slate-900">{draggedItemTitle}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </motion.div>
  );
}
