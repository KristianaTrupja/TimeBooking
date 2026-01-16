"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Company } from "@/types/project";
import { Building2, FilePenLine, Delete, LoaderCircle, Save, X, Plus } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/app/context/LanguageContext";

export default function Companies() {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/companies?includeInactive=true");
      const data = await res.json();
      setCompanies(data);
    } catch (err) {
      console.error("Failed to fetch companies", err);
      toast.error("Failed to load companies");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleAdd = async () => {
    if (!newCompanyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    // Check for duplicates
    const duplicate = companies.some(
      c => c.name.toLowerCase() === newCompanyName.trim().toLowerCase()
    );
    if (duplicate) {
      toast.error("A company with this name already exists");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create company");
      }

      toast.success("Company created successfully");
      setNewCompanyName("");
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message || "Failed to create company");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingId(company.id);
    setEditValue(company.name);
  };

  const handleSave = async (id: number) => {
    if (!editValue.trim()) {
      setEditingId(null);
      return;
    }

    // Check for duplicates (excluding current company)
    const duplicate = companies.some(
      c => c.id !== id && c.name.toLowerCase() === editValue.trim().toLowerCase()
    );
    if (duplicate) {
      toast.error("A company with this name already exists");
      return;
    }

    setPendingId(id);
    try {
      const response = await fetch(`/api/companies?companyId=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editValue.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update company");
      }

      toast.success("Company updated successfully");
      setEditingId(null);
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message || "Failed to update company");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (company: Company) => {
    if (!window.confirm(`Are you sure you want to delete "${company.name}"?\n\nIf this company has projects, it will be deactivated. Otherwise, it will be permanently deleted.`)) {
      return;
    }

    setPendingId(company.id);
    try {
      const response = await fetch(`/api/companies?companyId=${company.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete company");
      }

      const data = await response.json();
      toast.success(data.message);
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete company");
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="p-6 h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="animate-spin text-blue-600" size={32} />
          <p className="text-slate-600">Loading companies...</p>
        </div>
      </section>
    );
  }

  const activeCompanies = companies.filter(c => c.isActive);
  const inactiveCompanies = companies.filter(c => !c.isActive);

  return (
    <section className="p-6 h-full flex flex-col overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Building2 className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Company Management</h1>
            <p className="text-sm text-slate-600">Manage all companies in your organization</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-white rounded-lg border border-slate-200 px-4 py-2 shadow-sm">
            <span className="text-2xl font-bold text-slate-800">{activeCompanies.length}</span>
            <span className="text-sm text-slate-600 ml-2">Active</span>
          </div>
          {inactiveCompanies.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 px-4 py-2 shadow-sm">
              <span className="text-2xl font-bold text-slate-500">{inactiveCompanies.length}</span>
              <span className="text-sm text-slate-600 ml-2">Inactive</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-auto pb-4">
        {/* Companies List */}
        <div className="w-full lg:w-2/3 space-y-6">
          {/* Active Companies */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">
                Active Companies ({activeCompanies.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {activeCompanies.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No active companies
                </div>
              ) : (
                activeCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="p-4 hover:bg-slate-50 transition-colors group"
                  >
                    {editingId === company.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          disabled={pendingId === company.id}
                          className="flex-1 px-3 py-1.5 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && pendingId === null) handleSave(company.id);
                            if (e.key === "Escape" && pendingId === null) setEditingId(null);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSave(company.id)}
                          disabled={pendingId === company.id}
                          className="hover:bg-blue-100 hover:text-blue-600"
                        >
                          {pendingId === company.id ? (
                            <LoaderCircle size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          disabled={pendingId === company.id}
                          className="hover:bg-slate-100"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building2 size={18} className="text-blue-600" />
                          <span className="font-medium text-slate-800">{company.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(company)}
                            disabled={pendingId === company.id}
                            className="hover:bg-blue-100 hover:text-blue-600"
                          >
                            <FilePenLine size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(company)}
                            disabled={pendingId === company.id}
                            className="hover:bg-rose-100 hover:text-rose-600"
                          >
                            {pendingId === company.id ? (
                              <LoaderCircle size={14} className="animate-spin" />
                            ) : (
                              <Delete size={14} />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inactive Companies */}
          {inactiveCompanies.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm opacity-60">
              <div className="p-4 border-b border-slate-200 bg-slate-100">
                <h3 className="text-sm font-semibold text-slate-600">
                  Inactive Companies ({inactiveCompanies.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {inactiveCompanies.map((company) => (
                  <div key={company.id} className="p-4 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className="text-slate-400" />
                      <span className="font-medium text-slate-600">{company.name}</span>
                      <span className="text-xs italic text-slate-500">(Inactive)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Company Form */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Plus className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Company</h3>
                <p className="text-sm text-slate-600">Add a new company</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="space-y-5">
              <div>
                <label htmlFor="companyName" className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                  <Building2 size={14} className="text-slate-600" />
                  Company Name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  type="text"
                  autoComplete="off"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Omegaventus"
                  required
                />
              </div>

              <Button 
                type="submit"
                loading={isAdding}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 py-2.5"
              >
                <Plus size={18} className="mr-2" />
                {isAdding ? "Adding..." : "Add Company"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Toaster position="top-right" richColors />
    </section>
  );
}
