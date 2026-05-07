import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjectStore } from '../store/useProjectStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, FileText, Activity, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const [showAllProjects, setShowAllProjects] = useState(false);

  const totalProjects = projects.length;
  const sortedProjects = [...projects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const displayedProjects = showAllProjects ? sortedProjects : sortedProjects.slice(0, 4);
  
  // Calculate actual data for charts based on last 7 days
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // Use local date string to match day names correctly in the user's timezone
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      last7Days.push({
        dateStr: `${year}-${month}-${day}`,
        name: days[d.getDay()],
        creations: 0
      });
    }

    projects.forEach(p => {
      if (!p.createdAt) return;
      const pDate = new Date(p.createdAt);
      const year = pDate.getFullYear();
      const month = String(pDate.getMonth() + 1).padStart(2, '0');
      const day = String(pDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayData = last7Days.find(d => d.dateStr === dateStr);
      if (dayData) {
        dayData.creations += 1;
      }
    });

    return last7Days.map(({ name, creations }) => ({ name, creations }));
  }, [projects]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <motion.h1 variants={itemVariants} className="text-3xl font-bold text-slate-900 tracking-tight">Overview</motion.h1>
          <motion.p variants={itemVariants} className="text-slate-500 mt-1">Manage and monitor your documentation projects.</motion.p>
        </div>
        <motion.div variants={itemVariants}>
          <Button onClick={() => navigate('/projects/new')} className="gap-2">
            <Plus size={16} />
            New Project
          </Button>
        </motion.div>
      </div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card 
            className="hover:shadow-md transition-all cursor-pointer hover:bg-slate-50 active:scale-[0.98] border-indigo-100"
            onClick={() => {
              setShowAllProjects(true);
              setTimeout(() => {
                document.getElementById('projects-list')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }, 100);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Projects</CardTitle>
              <div className="p-2 bg-indigo-100 rounded-full">
                <FileText className="text-indigo-600" size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProjects}</div>
              <p className="text-xs text-slate-400 mt-1">Total documents managed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Avg. Generation Time</CardTitle>
              <div className="p-2 bg-emerald-100 rounded-full">
                <Clock className="text-emerald-600" size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2.4s</div>
              <p className="text-xs text-slate-400 mt-1">Faster than 5s threshold</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>Number of documents created over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line type="monotone" dataKey="creations" stroke="#4F46E5" strokeWidth={3} dot={{r: 4, fill: '#4F46E5', strokeWidth: 0}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full" id="projects-list">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{showAllProjects || totalProjects <= 4 ? 'All Projects' : 'Recent Projects'}</CardTitle>
                <CardDescription>{showAllProjects || totalProjects <= 4 ? 'Every document in your workspace' : 'Your latest automated documents'}</CardDescription>
              </div>
              {(showAllProjects || totalProjects <= 4) && (
                <div className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full border border-indigo-100">
                  Showing {totalProjects}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {displayedProjects.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No projects created yet.
                </div>
              ) : (
                displayedProjects.map(project => (
                  <div key={project.id} onClick={() => navigate(`/projects/${project.id}/requirements`)} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-slate-200 cursor-pointer transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-slate-900">{project.name}</p>
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none", project.documentType === 'BRD' ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-sky-50 text-sky-600 border-sky-200")}>
                          {project.documentType || 'SRS'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-[150px] mt-0.5">{project.description || 'No description'}</p>
                    </div>
                    <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      {project.requirements?.length || project.sections?.length || 0} Sections
                    </div>
                  </div>
                ))
              )}
              {totalProjects > 4 && (
                <Button variant="ghost" className="w-full text-indigo-600 mt-2" onClick={() => setShowAllProjects(!showAllProjects)}>
                  {showAllProjects ? 'Show Less' : 'View All'}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
