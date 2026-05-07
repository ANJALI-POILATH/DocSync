import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../store/useProjectStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { ArrowLeft, CheckCircle2, FileText, Briefcase } from 'lucide-react';

export default function CreateProject() {
  const navigate = useNavigate();
  const addProject = useProjectStore((state) => state.addProject);
  
  const [formData, setFormData] = useState({ name: '', description: '', scope: '', type: 'SRS' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: 'Project name is required' });
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await addProject({
        name: formData.name,
        description: formData.description,
        scope: formData.scope,
        documentType: formData.type
      });

      setShowSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      initial="initial" 
      animate="animate" 
      exit="exit" 
      variants={pageVariants}
      className="max-w-2xl mx-auto py-8"
    >
      <Button variant="ghost" className="mb-6 gap-2 text-slate-500" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </Button>

      <Card className="relative overflow-hidden">
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900">Project Created!</h2>
              <p className="text-slate-500 mt-2">Redirecting to dashboard...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Project</CardTitle>
            <CardDescription>Setup a new documentation workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Document Type</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setFormData({ ...formData, type: 'BRD' })}
                  className={cn(
                    "cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-4",
                    formData.type === 'BRD' ? "border-indigo-600 bg-indigo-50/50 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  <div className={cn("p-2 rounded-lg", formData.type === 'BRD' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500")}>
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">BRD</h3>
                    <p className="text-xs text-slate-500 mt-1">Business Requirements Document</p>
                  </div>
                </div>
                
                <div 
                  onClick={() => setFormData({ ...formData, type: 'SRS' })}
                  className={cn(
                    "cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-4",
                    formData.type === 'SRS' ? "border-indigo-600 bg-indigo-50/50 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  <div className={cn("p-2 rounded-lg", formData.type === 'SRS' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500")}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">SRS</h3>
                    <p className="text-xs text-slate-500 mt-1">Software Requirements Specification</p>
                  </div>
                </div>
              </div>
            </div>

            <Input
              label="Project Name *"
              placeholder="e.g. E-Commerce Platform"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: null });
              }}
              error={errors.name}
            />
            
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Short Description</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white/50 px-3 py-2 text-sm backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 resize-none"
                placeholder="Briefly describe what this project is about..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="w-full flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Project Scope (Optional)</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-slate-300 bg-white/50 px-3 py-2 text-sm backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 resize-none"
                placeholder="Define the boundaries and deliverables..."
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-slate-100 pt-6">
            <Button type="button" variant="ghost" className="mr-2" onClick={() => navigate(-1)}>Cancel</Button>
            {submitError && <p className="text-sm text-red-500 mr-auto">{submitError}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
              ) : null}
              {isSubmitting ? 'Creating...' : `Create ${formData.type} Project`}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
