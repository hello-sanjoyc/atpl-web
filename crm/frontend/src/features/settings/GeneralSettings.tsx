import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@aranax/contracts';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Field, TextInput } from '../../components/form/fields';
import { useToast } from '../../components/Toast';

interface OptionRow {
  id: string;
  category: string;
  value: string;
  label: string;
  position: number;
  isActive: boolean;
}

interface ForecastSettings {
  refreshCooldownMs: number;
  defaultRefreshCooldownMs: number;
}

const FORECAST_SETTINGS_QUERY_KEY = ['settings', 'forecast'] as const;

function msToHours(ms: number): number {
  return Math.round((ms / (60 * 60 * 1000)) * 100) / 100;
}

function hoursToMs(hours: number): number {
  return Math.round(hours * 60 * 60 * 1000);
}

function ForecastSettingsSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery<ForecastSettings>({
    queryKey: FORECAST_SETTINGS_QUERY_KEY,
    queryFn: () => http.get<ForecastSettings>(endpoints.settings.forecastSettings),
  });
  const [hours, setHours] = useState('');
  const [saving, setSaving] = useState(false);

  const currentHours = data ? msToHours(data.refreshCooldownMs) : null;
  const displayHours = hours !== '' ? hours : (currentHours?.toString() ?? '');

  async function save() {
    const parsed = Number(displayHours);
    if (!Number.isFinite(parsed) || parsed < 5 / 60 || parsed > 7 * 24) {
      toast('Cooldown must be between 5 minutes and 7 days.', 'error');
      return;
    }
    setSaving(true);
    try {
      const updated = await http.patch<ForecastSettings>(endpoints.settings.forecastSettings, { refreshCooldownMs: hoursToMs(parsed) });
      qc.setQueryData(FORECAST_SETTINGS_QUERY_KEY, updated);
      setHours('');
      toast('Forecast refresh cooldown updated', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
      <h3 className="font-serif font-medium text-[#0f1117] text-[17px] mb-1">AI Revenue Forecast</h3>
      <p className="text-xs text-[#9ca3af] mb-4">
        Minimum time between forecast regenerations. The Refresh button on the Dashboard only calls the AI
        model again once this much time has passed since the last snapshot — otherwise it just shows the
        existing forecast, keeping LLM usage to a minimum.
      </p>
      {isLoading ? (
        <p className="text-xs text-[#9ca3af] py-2">Loading…</p>
      ) : (
        <div className="flex items-end gap-3 flex-wrap">
          <Field label="Refresh cooldown (hours)" htmlFor="forecast-cooldown-hours">
            <TextInput
              id="forecast-cooldown-hours"
              type="number"
              min={5 / 60}
              max={7 * 24}
              step={0.5}
              value={displayHours}
              onChange={(e) => setHours(e.target.value)}
            />
          </Field>
          <button
            onClick={() => void save()}
            disabled={saving || displayHours === ''}
            className="px-5 py-2 rounded-full bg-[#f86223] text-white text-xs font-bold hover:bg-[#d94f15] disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {data && (
            <span className="text-xs text-[#9ca3af]">
              Default: {msToHours(data.defaultRefreshCooldownMs)}h
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const EMPTY_ENTRY_FORM = { value: '', label: '', position: 0 };

function useAdminOptions() {
  return useQuery({
    queryKey: QUERY_KEYS.optionsAdmin,
    queryFn: () => http.get<OptionRow[]>(endpoints.settings.optionsAdmin),
  });
}

/** Turns a snake_case category slug into a readable label, e.g. "budget_range" -> "Budget Range". */
function categoryLabel(category: string): string {
  return category
    .split('_')
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(' ');
}

function ConfirmDialog({ row, saving, onCancel, onConfirm }: {
  row: OptionRow;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <p className="text-[14px] font-semibold text-[#0f1117]">Delete option?</p>
        <p className="text-[13px] text-[#6b7280] mt-2 leading-snug">
          Delete <strong>{row.label}</strong> <code className="font-mono text-[12px] bg-[#f7f9fd] border border-[#e2e6f0] rounded px-1.5 py-0.5">{row.value}</code>?
        </p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-full text-[13px] font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="px-4 py-2 rounded-full text-[13px] font-bold text-white bg-[#c62828] hover:bg-[#a81f1f] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function groupByCategory(rows: OptionRow[]): [string, OptionRow[]][] {
  const grouped = new Map<string, OptionRow[]>();
  for (const row of rows) {
    (grouped.get(row.category) ?? grouped.set(row.category, []).get(row.category)!).push(row);
  }
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function EntryForm({ idPrefix, form, setForm, saving, submitLabel, onSave, onCancel }: {
  idPrefix: string;
  form: typeof EMPTY_ENTRY_FORM;
  setForm: (updater: (f: typeof EMPTY_ENTRY_FORM) => typeof EMPTY_ENTRY_FORM) => void;
  saving: boolean;
  submitLabel: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-2 p-4 rounded-2xl bg-[#f7f9fd] border border-[#e2e6f0]">
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Value" htmlFor={`val-${idPrefix}`} required>
          <TextInput id={`val-${idPrefix}`} value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="e.g. Asia/Kolkata" />
        </Field>
        <Field label="Label" htmlFor={`lbl-${idPrefix}`} required>
          <TextInput id={`lbl-${idPrefix}`} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. India Standard Time" />
        </Field>
        <Field label="Position" htmlFor={`pos-${idPrefix}`}>
          <TextInput id={`pos-${idPrefix}`} type="number" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) }))} min={0} />
        </Field>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={onSave}
          disabled={saving || !form.value || !form.label}
          className="px-5 py-2 rounded-full bg-[#f86223] text-white text-xs font-bold hover:bg-[#d94f15] disabled:opacity-50 transition-all"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button onClick={onCancel} className="px-5 py-2 rounded-full text-xs font-semibold text-[#6b7280] hover:text-[#0f1117] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

function CategorySection({ category, rows, onChanged }: { category: string; rows: OptionRow[]; onChanged: () => Promise<void> }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_ENTRY_FORM });
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<OptionRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  function startCreate() {
    setEditId(null);
    setForm({ ...EMPTY_ENTRY_FORM, position: rows.length });
    setShowForm(true);
  }

  function startEdit(row: OptionRow) {
    setEditId(row.id);
    setForm({ value: row.value, label: row.label, position: row.position });
    setShowForm(true);
  }

  async function save() {
    if (!form.value || !form.label) return;
    setSaving(true);
    try {
      if (editId) {
        await http.patch(endpoints.settings.optionByIdAdmin(editId), form);
        toast('Option updated', 'success');
      } else {
        await http.post(endpoints.settings.optionsAdmin, { category, ...form });
        toast('Option added', 'success');
      }
      await onChanged();
      setShowForm(false);
      setEditId(null);
      setForm({ ...EMPTY_ENTRY_FORM });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: OptionRow) {
    try {
      await http.patch(endpoints.settings.optionByIdAdmin(row.id), { isActive: !row.isActive });
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Update failed', 'error');
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await http.delete(endpoints.settings.optionByIdAdmin(pendingDelete.id));
      toast('Option deleted', 'success');
      await onChanged();
      setPendingDelete(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-serif font-medium text-[#0f1117] text-[17px]">
          {categoryLabel(category)}
          <span className="ml-2 text-xs font-mono font-normal text-[#9ca3af]">{category}</span>
        </h3>
        <button
          onClick={startCreate}
          className="text-xs px-3 py-1.5 rounded-full border border-[#f86223] text-[#f86223] font-semibold hover:bg-[#fff3ec] transition-all"
        >
          + Add entry
        </button>
      </div>

      {showForm && editId === null && (
        <EntryForm
          idPrefix={`${category}-new`}
          form={form}
          setForm={setForm}
          saving={saving}
          submitLabel="Add entry"
          onSave={() => void save()}
          onCancel={() => { setShowForm(false); setEditId(null); }}
        />
      )}

      <div className="flex flex-col gap-1.5 mt-3">
        {rows.length === 0 && <p className="text-xs text-[#9ca3af] py-2">No entries yet.</p>}
        {rows.map((row) => (
          <div key={row.id}>
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#f7f9fd] hover:bg-[#eef2fb] transition-colors">
              <div className="min-w-0">
                <span className="text-sm font-medium text-[#0f1117]">{row.label}</span>
                <span className="text-xs text-[#9ca3af] ml-2 font-mono">{row.value}</span>
                {!row.isActive && <span className="text-[10px] font-bold text-[#9ca3af] ml-2 px-1.5 py-0.5 rounded bg-[#e2e6f0]">INACTIVE</span>}
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => toggleActive(row)} className="text-xs px-2.5 py-1 rounded-full border border-[#e2e6f0] text-[#6b7280] hover:border-[#0f1117] hover:text-[#0f1117] transition-all">
                  {row.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => startEdit(row)} className="text-xs px-2.5 py-1 rounded-full border border-[#e2e6f0] text-[#6b7280] hover:border-[#0f1117] hover:text-[#0f1117] transition-all">Edit</button>
                <button onClick={() => setPendingDelete(row)} className="text-xs px-2.5 py-1 rounded-full border border-red-100 text-red-400 hover:border-red-400 hover:text-red-600 transition-all">Delete</button>
              </div>
            </div>

            {showForm && editId === row.id && (
              <EntryForm
                idPrefix={`${category}-${row.id}`}
                form={form}
                setForm={setForm}
                saving={saving}
                submitLabel="Save changes"
                onSave={() => void save()}
                onCancel={() => { setShowForm(false); setEditId(null); }}
              />
            )}
          </div>
        ))}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          row={pendingDelete}
          saving={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  );
}

function NewCategoryForm({ onChanged, onClose }: { onChanged: () => Promise<void>; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ category: '', value: '', label: '' });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.category || !form.value || !form.label) return;
    setSaving(true);
    try {
      await http.post(endpoints.settings.optionsAdmin, { ...form, position: 0 });
      toast(`Category "${form.category}" created`, 'success');
      await onChanged();
      setForm({ category: '', value: '', label: '' });
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Create failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)] border-2 border-[#f86223]">
      <h3 className="font-serif font-medium text-[#0f1117] text-[17px] mb-3">New category</h3>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Category name" htmlFor="new-cat" required hint="e.g. timezone, language">
          <TextInput id="new-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value.trim() }))} placeholder="timezone" />
        </Field>
        <Field label="First value" htmlFor="new-cat-val" required>
          <TextInput id="new-cat-val" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="e.g. Asia/Kolkata" />
        </Field>
        <Field label="First label" htmlFor="new-cat-lbl" required>
          <TextInput id="new-cat-lbl" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. India Standard Time" />
        </Field>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => void save()}
          disabled={saving || !form.category || !form.value || !form.label}
          className="px-5 py-2 rounded-full bg-[#f86223] text-white text-xs font-bold hover:bg-[#d94f15] disabled:opacity-50 transition-all"
        >
          {saving ? 'Creating…' : 'Create category'}
        </button>
        <button onClick={onClose} className="px-5 py-2 rounded-full text-xs font-semibold text-[#6b7280] hover:text-[#0f1117] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function GeneralSettings() {
  const queryClient = useQueryClient();
  const { data: rows = [], isLoading } = useAdminOptions();
  const groups = useMemo(() => groupByCategory(rows), [rows]);
  const [showNewCategory, setShowNewCategory] = useState(false);

  const onChanged = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.optionsAdmin });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.options });
  };

  return (
    <AppShell>
      <PageHeader
        title="General Settings"
        subtitle="Manage dropdown options shown across the app — service interests, budget ranges, currencies, timezones, and more."
        action={
          <button
            onClick={() => setShowNewCategory(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#f86223] text-white rounded-full text-[13px] font-bold hover:bg-[#d94f15] transition-all"
          >
            + New Category
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[#6b7280] text-sm">Loading…</div>
      ) : (
        <div className="flex flex-col gap-4">
          <ForecastSettingsSection />
          {showNewCategory && (
            <NewCategoryForm onChanged={onChanged} onClose={() => setShowNewCategory(false)} />
          )}
          {groups.map(([category, categoryRows]) => (
            <CategorySection key={category} category={category} rows={categoryRows} onChanged={onChanged} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
