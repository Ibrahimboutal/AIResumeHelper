import { useState, useEffect } from 'react';
import { Briefcase, Trash2, Edit2, ExternalLink, ChevronDown, ChevronUp, Filter, Calendar, Building2 } from 'lucide-react';
import { getJobApplications, deleteJobApplication, updateJobApplication, type JobApplication } from '../services/applicationService';
import { useAuth } from '../hooks/useAuth';

const statusColors = {
  applied: 'bg-blue-100 text-blue-700 border-blue-200',
  interview: 'bg-amber-100 text-amber-700 border-amber-200',
  offer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
};

const statusLabels = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export default function ApplicationTracker() {
  const { isAuthenticated } = useAuth();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'company'>('date');

  useEffect(() => {
    loadApplications();
  }, [isAuthenticated]);

  const loadApplications = async () => {
    if (!isAuthenticated) {
      setApps([]);
      setLoading(false);
      return;
    }

    try {
      const applications = await getJobApplications();
      setApps(applications);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeApp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      await deleteJobApplication(id);
      setApps(apps.filter(app => app.id !== id));
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application');
    }
  };

  const updateStatus = async (id: string, status: JobApplication['status']) => {
    try {
      await updateJobApplication(id, { status });
      setApps(apps.map(app => app.id === id ? { ...app, status } : app));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const filteredApps = apps
    .filter(app => filterStatus === 'all' || app.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime();
      }
      return a.company.localeCompare(b.company);
    });

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Tracked Applications
        </h2>
        <p className="text-sm text-slate-500 text-center py-4">
          Sign in to track your job applications
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Tracked Applications ({filteredApps.length})
        </h2>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            title="Filter by Status"
            className="text-xs border border-slate-300 rounded px-2 py-1"
          >
            <option value="all">All Status</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'company')}
            title="Sort Applications"
            className="text-xs border border-slate-300 rounded px-2 py-1"
          >
            <option value="date">Sort by Date</option>
            <option value="company">Sort by Company</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-4">Loading...</p>
        ) : filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <div key={app.id} className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="flex justify-between items-center bg-slate-50 p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{app.job_title}</p>
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {app.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(app.applied_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={app.status}
                    title="Update Status"
                    onChange={(e) => updateStatus(app.id, e.target.value as JobApplication['status'])}
                    className={`text-xs px-2 py-1 rounded border font-medium ${statusColors[app.status]}`}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    className="text-slate-600 hover:text-slate-800"
                  >
                    {expandedId === app.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => removeApp(app.id)}
                    className="text-rose-500 hover:text-rose-700"
                    title="Delete Application"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedId === app.id && (
                <div className="p-3 bg-white border-t border-slate-200">
                  {app.job_description && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Job Description:</p>
                      <p className="text-xs text-slate-600 max-h-32 overflow-y-auto bg-slate-50 p-2 rounded">
                        {app.job_description.slice(0, 500)}
                        {app.job_description.length > 500 && '...'}
                      </p>
                    </div>
                  )}

                  {app.notes && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">Notes:</p>
                      <p className="text-xs text-slate-600 bg-amber-50 p-2 rounded">{app.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">
            {filterStatus === 'all'
              ? 'No tracked applications yet. Start by tracking a job posting!'
              : `No ${statusLabels[filterStatus as keyof typeof statusLabels]} applications.`
            }
          </p>
        )}
      </div>
    </div>
  );
}
