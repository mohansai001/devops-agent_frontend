import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Chip, CircularProgress,
  Grid, IconButton, Link, Tab, Table, TableBody, TableCell,
  TableHead, TableRow, Tabs, Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { httpClient } from '../services/httpClient';

interface PipelineRecord {
  id: string;
  repo: string;
  branch: string;
  status: string;
  pipeline_stage: number;
  detected_tech?: { language?: string; framework?: string; buildTool?: string };
  config?: { APP_NAME?: string; DEPLOY_TARGET?: string; LOCATION?: string; RESOURCE_GROUP?: string; [key: string]: unknown };
  deployed_url?: string | null;
  committed_at?: string;
  created_at?: number;
  [key: string]: unknown;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending:  { color: '#d97706', bg: 'rgba(245,158,11,0.1)'  },
  running:  { color: '#009688', bg: 'rgba(0,150,136,0.1)'   },
  done:     { color: '#16a34a', bg: 'rgba(34,197,94,0.1)'   },
  failed:   { color: '#dc2626', bg: 'rgba(239,68,68,0.08)'  },
  rejected: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

const STAGE_LABEL: Record<number, string> = {
  0: '—', 1: 'Tech Detection', 2: 'Terraform',
  3: 'CI/CD Pipeline', 4: 'GitHub Actions', 5: 'Complete',
};

function timeAgo(ts: string | number | undefined): string {
  if (!ts) return '—';
  const ms = typeof ts === 'number' ? ts * 1000 : new Date(ts).getTime();
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface StatCardProps { label: string; value: number; color: string; bg: string; }
const StatCard: React.FC<StatCardProps> = ({ label, value, color, bg }) => (
  <Card sx={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
    <CardContent sx={{ p: '10px 14px !important' }}>
      <Typography fontSize={28} fontWeight={700} color={color} lineHeight={1}>{value}</Typography>
      <Typography fontSize={11} color="#6b7280" mt={0.5}>{label}</Typography>
      <Box sx={{ height: 3, borderRadius: 2, background: bg, mt: 1 }} />
    </CardContent>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const [records, setRecords] = useState<PipelineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpClient.get<unknown>('/sql/all_details');
      const raw = res.data;
      const data: PipelineRecord[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : [];
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = {
    total:   records.length,
    pending: records.filter((r) => r.status === 'pending').length,
    running: records.filter((r) => r.status === 'running').length,
    done:    records.filter((r) => r.status === 'done').length,
    failed:  records.filter((r) => r.status === 'failed').length,
  };

  const statusData = [
    { name: 'Pending',    value: counts.pending, color: '#d97706' },
    { name: 'Running',   value: counts.running, color: '#009688' },
    { name: 'Done',      value: counts.done,    color: '#16a34a' },
    { name: 'Failed',    value: counts.failed,  color: '#dc2626' },
  ].filter((d) => d.value > 0);

  const techData = Object.entries(
    records.reduce<Record<string, number>>((acc, r) => {
      const lang = r.detected_tech?.language ?? 'Unknown';
      acc[lang] = (acc[lang] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const targetData = Object.entries(
    records.reduce<Record<string, number>>((acc, r) => {
      const t = r.config?.DEPLOY_TARGET ?? 'Unknown';
      acc[String(t)] = (acc[String(t)] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#009688', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981'];

  return (
    <Box sx={{
      height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #eef2ff 100%)',
      p: '10px 20px',
    }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexShrink={0}>
        <Box>
          <Typography fontWeight={700} fontSize="0.95rem" color="#000000">Dashboard</Typography>
          <Typography fontSize="0.72rem" color="#6b7280">Pipeline overview across all repositories</Typography>
        </Box>
        <IconButton size="small" onClick={() => void load()} disabled={loading} sx={{ color: '#009688' }}>
          {loading
            ? <CircularProgress size={16} sx={{ color: '#009688' }} />
            : <RefreshIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1, flexShrink: 0, minHeight: 32,
        '& .MuiTab-root': { minHeight: 32, fontSize: 12, textTransform: 'none', color: '#6b7280' },
        '& .Mui-selected': { color: '#009688 !important', fontWeight: 700 },
        '& .MuiTabs-indicator': { background: '#009688' },
      }}>
        <Tab label="Pipelines" />
        <Tab label="Reports" />
      </Tabs>

      {/* Stat cards — only on Pipelines tab */}
      {tab === 0 && (
        <Grid container spacing={1.5} mb={1.5} flexShrink={0}>
          <Grid item xs={6} sm={2.4}><StatCard label="Total"      value={counts.total}   color="#000000" bg="#e5e7eb" /></Grid>
          <Grid item xs={6} sm={2.4}><StatCard label="Pending"    value={counts.pending} color="#d97706" bg="rgba(245,158,11,0.2)" /></Grid>
          <Grid item xs={6} sm={2.4}><StatCard label="Running"    value={counts.running} color="#009688" bg="rgba(0,150,136,0.2)" /></Grid>
          <Grid item xs={6} sm={2.4}><StatCard label="Successful" value={counts.done}    color="#16a34a" bg="rgba(34,197,94,0.2)" /></Grid>
          <Grid item xs={6} sm={2.4}><StatCard label="Failed"     value={counts.failed}  color="#dc2626" bg="rgba(239,68,68,0.15)" /></Grid>
        </Grid>
      )}

      {/* Pipelines Tab */}
      {tab === 0 && (
        <Card sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ p: '8px 12px !important', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography fontWeight={600} fontSize="0.8rem" color="#000000" mb={0.75}>Recent Pipelines</Typography>
            {loading && records.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                <CircularProgress size={24} sx={{ color: '#009688' }} />
              </Box>
            ) : (
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Repository', 'Branch', 'Tech', 'Stage', 'Status', 'App Name', 'Deploy Target', 'Deployed URL', 'When'].map((h) => (
                        <TableCell key={h} sx={{
                          fontSize: 10, fontWeight: 600, color: '#6b7280', background: '#f9fafb',
                          borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase',
                          letterSpacing: '0.5px', py: '4px', px: '8px',
                        }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, py: 3 }}>
                          No pipeline data found
                        </TableCell>
                      </TableRow>
                    ) : records.map((r) => {
                      const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
                      return (
                        <TableRow key={r.id} sx={{ '&:hover td': { background: 'rgba(0,150,136,0.03)' } }}>
                          <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#000', py: '4px', px: '8px', borderBottom: '1px solid #f3f4f6' }}>{r.repo}</TableCell>
                          <TableCell sx={{ py: '4px', px: '8px', borderBottom: '1px solid #f3f4f6' }}>
                            <Chip label={r.branch} size="small" sx={{ fontSize: 9, height: 18, color: '#009688', bgcolor: 'rgba(0,150,136,0.08)', border: '1px solid rgba(0,150,136,0.2)' }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 11, color: '#374151', py: '4px', px: '8px', borderBottom: '1px solid #f3f4f6' }}>
                            {r.detected_tech?.language ? `${r.detected_tech.language}${r.detected_tech.framework ? ` / ${r.detected_tech.framework}` : ''}` : '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: 11, color: '#374151', py: '4px', px: '8px', borderBottom: '1px solid #f3f4f6' }}>
                            {STAGE_LABEL[r.pipeline_stage] ?? '—'}
                          </TableCell>
                          <TableCell sx={{ py: '4px', px: '8px', borderBottom: '1px solid #f3f4f6' }}>
                            <Chip label={r.status} size="small" sx={{ fontSize: 9, height: 18, fontWeight: 700, color: st.color, bgcolor: st.bg, border: `1px solid ${st.color}40` }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 11, color: '#374151', py: '4px', px: '8px', borderBottom: '1px solid #f3f4f6' }}>{r.config?.APP_NAME ?? '—'}</TableCell>
                          <TableCell sx={{ fontSize: 11, color: '#374151', py: '4px', px: '8px', borderBottom: '1px solid #f3f4f6' }}>{r.config?.DEPLOY_TARGET ?? '—'}</TableCell>
                          <TableCell sx={{ fontSize: 11, py: '4px', px: '8px', borderBottom: '1px solid #f3f4f6' }}>
                            {r.deployed_url
                              ? <Link href={r.deployed_url} target="_blank" rel="noopener noreferrer" sx={{ color: '#009688', display: 'flex', alignItems: 'center', gap: 0.3, fontSize: 11 }}>Open <OpenInNewIcon sx={{ fontSize: 11 }} /></Link>
                              : '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: 11, color: '#6b7280', py: '4px', px: '8px', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap' }}>
                            {timeAgo(r.committed_at ?? r.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reports Tab */}
      {tab === 1 && (
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <Grid container spacing={2}>
            {/* Pipeline Status Distribution */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', p: 2 }}>
                <Typography fontWeight={600} fontSize="0.82rem" color="#000" mb={2}>Pipeline Status Distribution</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Tech Stack Usage */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', p: 2 }}>
                <Typography fontWeight={600} fontSize="0.82rem" color="#000" mb={2}>Tech Stack Usage</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={techData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {techData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Deploy Target Breakdown */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', p: 2 }}>
                <Typography fontWeight={600} fontSize="0.82rem" color="#000" mb={2}>Deploy Target Breakdown</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={targetData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {targetData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Success vs Failure */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', p: 2 }}>
                <Typography fontWeight={600} fontSize="0.82rem" color="#000" mb={2}>Success vs Failure Rate</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Success', value: counts.done,   color: '#16a34a' },
                      { name: 'Failed',  value: counts.failed, color: '#dc2626' },
                    ].filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {[{ color: '#16a34a' }, { color: '#dc2626' }].map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};
