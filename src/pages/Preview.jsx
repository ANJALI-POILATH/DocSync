import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../store/useProjectStore';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Download, CheckCircle2, FileCog } from 'lucide-react';

const RecursivePreviewNode = ({ node, depth, address }) => {
  const HeaderTag = depth === 0 ? 'h3' : depth === 1 ? 'h4' : 'h5';
  const headerClass = depth === 0 
    ? "text-2xl font-bold font-sans border-b border-slate-200 pb-2 mb-4" 
    : depth === 1 
      ? "text-xl font-semibold font-sans mt-6 mb-3 text-slate-800" 
      : "text-lg font-medium font-sans mt-4 mb-2 text-slate-700";

  const sectionId = `brd-sec-${node.id}`;

  return (
    <section className="mb-4 break-inside-avoid" data-section-id={sectionId}>
      <HeaderTag id={sectionId} className={headerClass}>
        {address}. {node.title || 'Untitled Section'}
      </HeaderTag>
      
      {node.content && (
        <div 
          className="text-slate-800 text-[15px] font-sans leading-relaxed pl-1 quill-content"
          dangerouslySetInnerHTML={{ __html: node.content }}
        />
      )}
      
      {node.tableData && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-[15px] font-sans mb-4 shadow-sm rounded-lg overflow-hidden border border-slate-300">
            <thead>
              <tr className="bg-slate-200/80">
                {node.tableData.headers.map((h, i) => (
                  <th key={i} className="border border-slate-300 px-4 py-2 font-bold text-slate-800">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {node.tableData.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  {row.map((cell, j) => (
                    <td key={j} className="border border-slate-300 px-4 py-2 text-slate-700">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {node.imageUrl && (
        <div className="mt-6 mb-4 flex justify-center">
          <img src={node.imageUrl} alt={node.title || 'Section Image'} className="max-w-full border border-slate-200 rounded-lg shadow-sm" style={{ maxHeight: '500px', objectFit: 'contain' }} />
        </div>
      )}

      {node.children && node.children.length > 0 && (
        <div className="mt-4 pl-2 md:pl-6">
          {node.children.map((child, i) => (
            <RecursivePreviewNode key={child.id} node={child} depth={depth + 1} address={`${address}.${i + 1}`} />
          ))}
        </div>
      )}
    </section>
  );
};

const RecursiveTOCNode = ({ node, depth, address, pageMap }) => {
  const sectionId = `brd-sec-${node.id}`;
  const pageNum = pageMap[sectionId] || '-';

  const handleClick = (e) => {
    e.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div 
        onClick={handleClick}
        className={`flex items-end text-slate-700 py-1 hover:text-indigo-600 cursor-pointer transition-colors ${depth === 0 ? 'font-semibold mt-2' : 'text-[15px]'}`} 
        style={{ paddingLeft: `${depth * 1.5}rem` }}
      >
        <span className="whitespace-nowrap">{address}. {node.title || 'Untitled Section'}</span>
        <div className="flex-1 mx-4 border-b-2 border-dotted border-slate-300 relative top-[-6px]" />
        <span className="text-sm font-medium w-4 text-right">{pageNum}</span>
      </div>
      {node.children && node.children.map((child, i) => (
        <RecursiveTOCNode key={child.id} node={child} depth={depth + 1} address={`${address}.${i + 1}`} pageMap={pageMap} />
      ))}
    </>
  );
};

const HeaderBlock = ({ project }) => {
  if (!project.headerImage) return <div className="pt-[120px]" />;
  return (
    <div 
      className="w-full shrink-0 relative z-10" 
      style={{ 
        height: '150px', 
        backgroundImage: `url(${project.headerImage})`, 
        backgroundPosition: 'top', 
        backgroundSize: '100% 1123px',
        backgroundRepeat: 'no-repeat' 
      }} 
    />
  );
};

const FooterBlock = ({ project }) => {
  if (!project.headerImage) return <div className="pb-[100px] mt-auto" />;
  return (
    <div 
      className="w-full shrink-0 mt-auto relative z-10" 
      style={{ 
        height: '120px', 
        backgroundImage: `url(${project.headerImage})`, 
        backgroundPosition: 'bottom', 
        backgroundSize: '100% 1123px',
        backgroundRepeat: 'no-repeat' 
      }} 
    />
  );
};

const WatermarkLayer = ({ project }) => {
  if (!project.headerImage) return null;
  return (
    <div 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{
        backgroundImage: `url(${project.headerImage})`,
        backgroundPosition: 'top center',
        backgroundSize: '100% 1123px',
        backgroundRepeat: 'repeat-y',
        WebkitMaskImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 150px, black 150px, black 1003px, transparent 1003px, transparent 1123px)',
        maskImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 150px, black 150px, black 1003px, transparent 1003px, transparent 1123px)'
      }}
    />
  );
};

const A4Page = ({ children, project, isCover = false }) => {
  if (isCover) {
    return (
      <div
        className="a4-page relative flex flex-col w-full bg-white border-b border-slate-200 overflow-hidden"
        style={{
          minHeight: '1123px',
          pageBreakAfter: 'always',
          backgroundImage: project.coverImage ? `url(${project.coverImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex-1 w-full relative z-10 flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className="a4-page relative flex flex-col w-full bg-white border-b border-slate-200 overflow-hidden"
      style={{
        minHeight: '1123px',
        pageBreakAfter: 'always',
      }}
    >
      <WatermarkLayer project={project} />
      <HeaderBlock project={project} />
      <div className="flex-1 w-full relative z-10 flex flex-col px-16 pb-4 pt-0">
        {children}
      </div>
      <FooterBlock project={project} />
    </div>
  );
};

export default function Preview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const project = projects.find(p => p.id === id);
  
  const [isGenerating, setIsGenerating] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState('');
  const [pageMap, setPageMap] = useState({});
  
  const docRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isGenerating && docRef.current) {
      const calculatePages = () => {
        const container = docRef.current;
        const containerTop = container.getBoundingClientRect().top;
        const newPageMap = {};
        
        // Estimated A4 pixel height minus margins
        const pageHeight = 1123; 
        
        const elements = container.querySelectorAll('[data-section-id]');
        elements.forEach(el => {
          const top = el.getBoundingClientRect().top - containerTop;
          const page = Math.floor(top / pageHeight) + 1;
          newPageMap[el.getAttribute('data-section-id')] = page;
        });
        setPageMap(newPageMap);
      };
      
      setTimeout(calculatePages, 300);
    }
  }, [isGenerating]);

  if (!project) return <div className="p-8">Project not found</div>;

  const isLegacySRS = project.documentType === 'SRS' && (!project.sections || project.sections.length === 0) && project.requirements && project.requirements.length > 0;
  const useTreeMode = project.documentType === 'BRD' || (project.documentType === 'SRS' && !isLegacySRS);
  
  const functional = !useTreeMode ? (project.requirements || []).filter(r => r.type === 'Functional') : [];
  const nonFunctional = !useTreeMode ? (project.requirements || []).filter(r => r.type === 'Non-Functional') : [];

  const handleExportPDF = () => {
    if (!docRef.current) return;
    setIsExporting(true);
    setExportError('');

    const date = new Date().toISOString().split('T')[0];
    const docType = project.documentType || 'SRS';
    const filename = `${project.name.replace(/\s+/g, '_').toUpperCase()}_${docType}_${date}`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      setExportError('Popup blocked — allow popups and try again.');
      setIsExporting(false);
      return;
    }

    // Grab all stylesheets from the current page
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => `<link rel="stylesheet" href="${l.href}">`)
      .join('\n');

    const styleBlocks = Array.from(document.querySelectorAll('style'))
      .map(s => `<style>${s.textContent}</style>`)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${filename}</title>
          ${styleLinks}
          ${styleBlocks}
          <style>
            @page { margin: 0; size: A4; }
            body { margin: 0; padding: 0; background: white; }
            .a4-page { page-break-after: always; break-after: page; }
          </style>
        </head>
        <body>
          ${docRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (isExporting) setIsExporting(false);
    }, 5000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 relative min-h-screen">
      <div className="flex justify-between items-center bg-white/70 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Generated Document</h1>
            <p className="text-sm text-slate-500">{project.name}</p>
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          <AnimatePresence>
            {exportSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-sm font-medium text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-md"
              >
                <CheckCircle2 size={16} /> Downloaded
              </motion.div>
            )}
            {exportError && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-sm font-medium text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-md"
              >
                {exportError}
              </motion.div>
            )}
          </AnimatePresence>
          <Button 
            className="gap-2 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 border-0" 
            onClick={handleExportPDF}
            disabled={isGenerating || isExporting}
          >
            {isExporting ? (
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full" />
            ) : <Download size={16} />}
            <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32 space-y-6"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner"
            >
              <FileCog size={40} />
            </motion.div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Generating Document...</h2>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                Our engine is analyzing unstructured input and mapping it into the strict {project.documentType || 'SRS'} template.
              </p>
            </div>
            
            <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-600"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="document"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center w-full origin-top relative overflow-visible"
          >
             <div 
               ref={docRef} 
               className="bg-slate-100 shadow-2xl border border-slate-200 relative"
               style={{
                 width: '794px',
               }}
             >
                <div className="font-sans text-slate-900 w-full h-full relative z-10">
                  {/* COVER PAGE */}
                  <A4Page project={project} isCover={true}>
                    <div className="flex-1 flex flex-col justify-center items-center w-full">
                      {/* Centered Text Container */}
                    <div className="text-center z-10 w-full px-16 -mt-32">
                      <h2 className="text-4xl font-bold text-slate-800 mb-12 tracking-wider leading-snug whitespace-pre-wrap" style={{ fontFamily: 'Times New Roman, serif' }}>
                        {project.documentType === 'BRD' ? 'BUSINESS REQUIREMENT\nDOCUMENT' : 'SOFTWARE REQUIREMENTS\nSPECIFICATION'}
                      </h2>
                      
                      {project.clientName && (
                        <h3 className="text-4xl font-bold text-[#e45a15] mb-6 tracking-wide" style={{ fontFamily: 'Times New Roman, serif' }}>
                          {project.clientName.toUpperCase()}
                        </h3>
                      )}
                      
                      <h1 className="text-4xl font-extrabold text-black tracking-wide" style={{ fontFamily: 'Times New Roman, serif' }}>
                        {(project.coverTitle || project.name).toUpperCase()}
                      </h1>
                    </div>

                    {/* Bottom Left Details */}
                    <div className="absolute bottom-32 left-24 z-10 text-left">
                      <p className="text-lg font-bold text-black mb-1" style={{ fontFamily: 'Times New Roman, serif' }}>
                        Prepared by: <span className="font-normal">{project.preparedBy || ''}</span>
                      </p>
                      <p className="text-lg font-bold text-black" style={{ fontFamily: 'Times New Roman, serif' }}>
                        Approved by: <span className="font-normal">{project.approvedBy || ''}</span>
                      </p>
                    </div>
                    </div>
                  </A4Page>

                  {/* DOCUMENT VERSION PAGE */}
                  <A4Page project={project}>
                    <h2 className="text-3xl font-bold mb-12 text-black text-center" style={{ fontFamily: 'Times New Roman, serif' }}>
                      DOCUMENT VERSION
                    </h2>
                    <div className="w-full px-16">
                      <table className="w-full text-center border-collapse text-[16px] mb-4 border border-slate-200" style={{ fontFamily: 'Times New Roman, serif' }}>
                        <thead>
                          <tr className="bg-[#e4e9f2]">
                            <th className="border border-slate-200 px-4 py-3 font-bold text-black w-1/5">VERSION</th>
                            <th className="border border-slate-200 px-4 py-3 font-bold text-black w-1/5">DATE</th>
                            <th className="border border-slate-200 px-4 py-3 font-bold text-black w-2/5">AMENDMENT</th>
                            <th className="border border-slate-200 px-4 py-3 font-bold text-black w-1/5">AUTHOR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(project.versionHistory || [{ version: '1.0', date: new Date().toLocaleDateString('en-GB'), amendment: 'Initial Release', author: project.preparedBy || 'Author' }]).map((vh, i) => (
                            <tr key={i} className="bg-white">
                              <td className="border border-slate-200 px-4 py-3 text-black">{vh.version}</td>
                              <td className="border border-slate-200 px-4 py-3 text-black">{vh.date}</td>
                              <td className="border border-slate-200 px-4 py-3 text-black">{vh.amendment}</td>
                              <td className="border border-slate-200 px-4 py-3 text-black">{vh.author}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </A4Page>

                  {/* Table of Contents */}
                  <A4Page project={project}>
                    <h3 className="text-2xl font-bold font-sans mb-6 text-slate-800 border-b border-slate-200 pb-2">Table of Contents</h3>
                    <div className="space-y-1 font-sans">
                      {useTreeMode ? (
                        (project.sections || []).map((sec, index) => (
                          <RecursiveTOCNode key={sec.id} node={sec} depth={0} address={(index + 1).toString()} pageMap={pageMap} />
                        ))
                      ) : (
                        <>
                          <div onClick={() => document.getElementById('srs-sec-1')?.scrollIntoView({behavior: 'smooth'})} className="cursor-pointer hover:text-indigo-600 transition-colors flex items-end text-slate-700 py-1 font-semibold mt-2">
                            <span className="whitespace-nowrap">1. Executive Summary</span><div className="flex-1 mx-4 border-b-2 border-dotted border-slate-300 relative top-[-6px]" />
                            <span className="text-sm font-medium w-4 text-right">{pageMap['srs-sec-1'] || '-'}</span>
                          </div>
                          <div onClick={() => document.getElementById('srs-sec-2')?.scrollIntoView({behavior: 'smooth'})} className="cursor-pointer hover:text-indigo-600 transition-colors flex items-end text-slate-700 py-1 font-semibold mt-2">
                            <span className="whitespace-nowrap">2. Scope & Objectives</span><div className="flex-1 mx-4 border-b-2 border-dotted border-slate-300 relative top-[-6px]" />
                            <span className="text-sm font-medium w-4 text-right">{pageMap['srs-sec-2'] || '-'}</span>
                          </div>
                          <div onClick={() => document.getElementById('srs-sec-3')?.scrollIntoView({behavior: 'smooth'})} className="cursor-pointer hover:text-indigo-600 transition-colors flex items-end text-slate-700 py-1 font-semibold mt-2">
                            <span className="whitespace-nowrap">3. Requirements</span><div className="flex-1 mx-4 border-b-2 border-dotted border-slate-300 relative top-[-6px]" />
                            <span className="text-sm font-medium w-4 text-right">{pageMap['srs-sec-3'] || '-'}</span>
                          </div>
                          <div onClick={() => document.getElementById('srs-sec-3-1')?.scrollIntoView({behavior: 'smooth'})} className="cursor-pointer hover:text-indigo-600 transition-colors flex items-end text-slate-700 py-1 text-[15px] pl-6 mt-1">
                            <span className="whitespace-nowrap">3.1. Functional Requirements</span><div className="flex-1 mx-4 border-b-2 border-dotted border-slate-300 relative top-[-6px]" />
                            <span className="text-sm font-medium w-4 text-right">{pageMap['srs-sec-3-1'] || '-'}</span>
                          </div>
                          <div onClick={() => document.getElementById('srs-sec-3-2')?.scrollIntoView({behavior: 'smooth'})} className="cursor-pointer hover:text-indigo-600 transition-colors flex items-end text-slate-700 py-1 text-[15px] pl-6 mt-1">
                            <span className="whitespace-nowrap">3.2. Non-Functional Requirements</span><div className="flex-1 mx-4 border-b-2 border-dotted border-slate-300 relative top-[-6px]" />
                            <span className="text-sm font-medium w-4 text-right">{pageMap['srs-sec-3-2'] || '-'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </A4Page>

                  {/* Dynamic Hierarchical Output */}
                  <div className="w-full pb-16 bg-slate-100">
                    {useTreeMode && project.sections && (
                      <div className="w-full">
                         {project.sections.map((sec, index) => (
                           <A4Page key={sec.id} project={project}>
                             <RecursivePreviewNode node={sec} depth={0} address={(index + 1).toString()} />
                           </A4Page>
                         ))}
                      </div>
                    )}

                    {/* SRS Legacy Flat Output */}
                    {!useTreeMode && (
                    <div className="w-full">
                      <A4Page project={project}>
                        <section id="srs-sec-1" data-section-id="srs-sec-1" className="space-y-4 mb-8">
                          <h3 className="text-2xl font-bold border-b border-slate-200 pb-2">1. Executive Summary</h3>
                          <p className="text-[15px]">{project.description || "No description provided."}</p>
                        </section>
                      </A4Page>

                      <A4Page project={project}>
                        <section id="srs-sec-2" data-section-id="srs-sec-2" className="space-y-4 mb-8">
                          <h3 className="text-2xl font-bold border-b border-slate-200 pb-2">2. Scope & Objectives</h3>
                          <p className="whitespace-pre-wrap text-[15px]">{project.scope || "No explicit scope defined."}</p>
                        </section>
                      </A4Page>

                      <A4Page project={project}>
                        <section id="srs-sec-3" data-section-id="srs-sec-3" className="space-y-6">
                          <h3 className="text-2xl font-bold border-b border-slate-200 pb-2">3. Requirements</h3>
                        
                        <div className="space-y-6">
                          <h4 id="srs-sec-3-1" data-section-id="srs-sec-3-1" className="text-xl font-semibold pt-4">3.1. Functional Requirements</h4>
                          {functional.length > 0 ? (
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 px-4 py-2 w-16">ID</th>
                                  <th className="border border-slate-300 px-4 py-2 w-1/3">Title</th>
                                  <th className="border border-slate-300 px-4 py-2">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {functional.map((f, i) => (
                                  <tr key={f.id}>
                                    <td className="border border-slate-300 px-4 py-2 text-center text-slate-500">FR-{i+1}</td>
                                    <td className="border border-slate-300 px-4 py-2 font-medium">{f.title || 'Untitled'}</td>
                                    <td className="border border-slate-300 px-4 py-2 quill-content" dangerouslySetInnerHTML={{ __html: f.description || '-' }}></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : <p className="italic text-slate-500 text-sm">No functional requirements declared.</p>}
                          
                          <h4 id="srs-sec-3-2" data-section-id="srs-sec-3-2" className="text-xl font-semibold mt-8 pt-4">3.2. Non-Functional Requirements</h4>
                          {nonFunctional.length > 0 ? (
                            <table className="w-full text-left flex-col border-collapse text-sm">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 px-4 py-2 w-16">ID</th>
                                  <th className="border border-slate-300 px-4 py-2 w-1/3">Title</th>
                                  <th className="border border-slate-300 px-4 py-2">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {nonFunctional.map((nf, i) => (
                                  <tr key={nf.id}>
                                    <td className="border border-slate-300 px-4 py-2 text-center text-slate-500">NFR-{i+1}</td>
                                    <td className="border border-slate-300 px-4 py-2 font-medium">{nf.title || 'Untitled'}</td>
                                    <td className="border border-slate-300 px-4 py-2 quill-content" dangerouslySetInnerHTML={{ __html: nf.description || '-' }}></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : <p className="italic text-slate-500 text-sm">No non-functional requirements declared.</p>}
                        </div>
                        </section>
                      </A4Page>
                    </div>
                  )}
                  </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
