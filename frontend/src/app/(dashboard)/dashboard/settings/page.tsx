'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Settings,
  Layers,
  Lock,
  Copy,
  Check,
  Save,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  KeyRound,
  Shield,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

function ProjectSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProject = async () => {
    setLoading(true);
    try {
      const paramProjectId = searchParams.get('project') || searchParams.get('projectId');
      const storedProject = authStorage.getActiveProject();
      const targetId = paramProjectId || storedProject?._id;

      if (!targetId) {
        router.push('/dashboard/projects');
        return;
      }

      const res = await fetchApi(`/api/v1/projects/${targetId}`);
      if (res.success && res.data?.project) {
        const p = res.data.project;
        setProject(p);
        setProjectName(p.name || '');
        setProjectDescription(p.description || '');
        authStorage.setActiveProject(p);
      } else {
        // Fallback to stored active project if available
        if (storedProject) {
          setProject(storedProject);
          setProjectName(storedProject.name || '');
          setProjectDescription(storedProject.description || '');
        }
      }
    } catch (err) {
      console.error('Failed to load project settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();

    const handleProjectChanged = (e: any) => {
      const p = e.detail;
      if (p) {
        setProject(p);
        setProjectName(p.name || '');
        setProjectDescription(p.description || '');
      }
    };
    window.addEventListener('oneapi_project_changed', handleProjectChanged);

    return () => {
      window.removeEventListener('oneapi_project_changed', handleProjectChanged);
    };
  }, [searchParams]);

  const handleCopyId = () => {
    const idToCopy = project?._id || project?.id || '';
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?._id && !project?.id) return;

    setSaving(true);
    setSaveMsg(null);

    const projectId = project._id || project.id;
    try {
      const res = await fetchApi(`/api/v1/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim(),
        }),
      });

      if (res.success && res.data?.project) {
        const updated = { ...project, ...res.data.project };
        setProject(updated);
        authStorage.setActiveProject(updated);
        window.dispatchEvent(new CustomEvent('oneapi_project_changed', { detail: updated }));
        setSaveMsg({ type: 'success', text: 'Project name updated successfully!' });
      } else {
        setSaveMsg({ type: 'error', text: res.error?.message || 'Failed to update project.' });
      }
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message || 'Error updating project.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    const projectId = project?._id || project?.id;
    if (!projectId || deleteConfirmationName !== project.name) return;

    setIsDeleting(true);
    try {
      const res = await fetchApi(`/api/v1/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (res.success) {
        authStorage.setActiveProject(null);
        window.dispatchEvent(new CustomEvent('oneapi_project_changed', { detail: null }));
        router.push('/dashboard/projects');
      } else {
        alert(res.error?.message || 'Failed to delete project.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting project.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        <span>Loading project settings...</span>
      </div>
    );
  }

  const projectId = project?._id || project?.id || '';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link
              href="/dashboard/projects"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Projects</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-semibold">{project?.name || 'Project'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-sky-400 font-mono">Settings</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            Project Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage configuration, name, identifiers, and scoped resources for this project.
          </p>
        </div>
      </div>

      {/* 1. General Project Information Form */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Project Identity
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            You can modify the project display name and description. The Project ID and Slug remain immutable to guarantee API key routing consistency.
          </p>
        </div>

        {saveMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              saveMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {saveMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{saveMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProject} className="space-y-4">
          {/* Project Name (Editable) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Project Name <span className="text-sky-400">*</span>
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Production AI Gateway"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60 transition-colors"
            />
          </div>

          {/* Project ID (READ-ONLY) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Project ID <span className="text-slate-500 font-normal">(Permanent Identifier)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-500" /> Immutable
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                disabled
                value={projectId}
                className="flex-1 px-3.5 py-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs font-mono text-slate-400 cursor-not-allowed select-all"
              />
              <button
                type="button"
                onClick={handleCopyId}
                className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy Project ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{copiedId ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Project ID cannot be changed. It is the permanent reference used in client SDKs and <span className="text-slate-400 font-mono">x-project-id</span> headers.
            </p>
          </div>

          {/* Project Slug (READ-ONLY) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Project Slug
              </label>
              <span className="text-[10px] text-slate-500 font-mono">slug scope</span>
            </div>
            <input
              type="text"
              disabled
              value={project?.slug || 'default'}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs font-mono text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Project Description (Editable) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Project description, purpose, or environment notes..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60 transition-colors"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Project Name</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Danger Zone: Delete Project */}
      <div className="p-6 md:p-8 rounded-2xl bg-rose-950/20 border border-rose-900/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Project
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Permanently delete <span className="text-white font-semibold">{project?.name}</span>. This cascades and permanently removes all API tokens, provider vault credentials, failover rules, and telemetry logs for this project.
            </p>
          </div>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs border border-rose-600/40 transition-all self-start sm:self-center shrink-0 cursor-pointer"
          >
            Delete Project
          </button>
        </div>
      </div>

      {/* Delete Project Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-rose-900/60 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3>Delete Project</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="text-white font-semibold font-mono">{project?.name}</span>? All API keys and vault secrets bound to this project will be destroyed immediately.
            </p>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Type <span className="font-mono font-bold text-rose-400">{project?.name}</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationName}
                onChange={(e) => setDeleteConfirmationName(e.target.value)}
                placeholder={project?.name}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationName('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleteConfirmationName !== project?.name || isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Project</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <span>Loading project settings...</span>
        </div>
      }
    >
      <ProjectSettingsContent />
    </Suspense>
  );
}
