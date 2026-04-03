import { useEffect, useState } from 'react';
import {
  Box, Typography, Chip, CircularProgress, Alert,
  Container, Button, Divider, Pagination, Stack, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import BranchIcon from '@mui/icons-material/AccountTree';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PAGE_SIZE = 10;

function Onboarding() {
  useDocumentTitle('Repositories');
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [currWebhookUrl, setCurrWebhookUrl] = useState('');
  const [webhookSubmitting, setWebhookSubmitting] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);
  const [webhookUpdating, setWebhookUpdating] = useState(false);
  const [onboardingAll, setOnboardingAll] = useState(false);
  const [onboardingRepo, setOnboardingRepo] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || ' https://repo-onboard-full.onrender.com';
    fetch(`${base}/config/webhook-url`)
      .then(res => res.json())
      .then(data => setCurrWebhookUrl(data.CURR_WEBHOOK_URL))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const pat = import.meta.env.VITE_GITHUB_PAT || '';
    const base = import.meta.env.VITE_API_BASE_URL || ' https://repo-onboard-full.onrender.com';
    fetch(`${base}/repos?pat=${pat}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const ct = res.headers.get('content-type');
        if (!ct || !ct.includes('application/json'))
          throw new Error(`Expected JSON but got: ${ct}`);
        return res.json();
      })
      .then(data => setRepos(data.repos))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleOnboard = async (repo) => {
    setOnboardingRepo(repo.id);
    const pat = import.meta.env.VITE_GITHUB_PAT || '';
    const base = import.meta.env.VITE_API_BASE_URL || ' https://repo-onboard-full.onrender.com';
    try {
      await fetch(`${base}/webhook/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_username: repo.owner.login,
          repo_name: repo.name,
          pat,
          webhook_url: currWebhookUrl,
        }),
      });
      setSnackbar({ open: true, message: `"${repo.name}" onboarded successfully!` });
    } catch (e) {
      console.error(e);
    } finally {
      setOnboardingRepo(null);
    }
  };

  const handleOnboardAll = async () => {
    setOnboardingAll(true);
    const pat = import.meta.env.VITE_GITHUB_PAT || '';
    const base = import.meta.env.VITE_API_BASE_URL || ' https://repo-onboard-full.onrender.com';
    try {
      await Promise.all(
        repos.map(repo =>
          fetch(`${base}/webhook/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              github_username: repo.owner.login,
              repo_name: repo.name,
              pat,
              webhook_url: currWebhookUrl,
            }),
          })
        )
      );
      setSnackbar({ open: true, message: `All ${repos.length} repositories onboarded successfully!` });
    } catch (e) {
      console.error(e);
    } finally {
      setOnboardingAll(false);
    }
  };

  const handleWebhookClose = () => { setWebhookOpen(false); setWebhookUrl(''); setWebhookSuccess(false); };

  const handleUpdate = async () => {
    setWebhookUpdating(true);
    const pat = import.meta.env.VITE_GITHUB_PAT || '';
    const base = import.meta.env.VITE_API_BASE_URL || ' https://repo-onboard-full.onrender.com';
    try {
      // Step 1: Get PREV_WEBHOOK_URL and CURR_WEBHOOK_URL
      const configRes = await fetch(`${base}/config/webhook-url`);
      const config = await configRes.json();
      const prevUrl = config.PREV_WEBHOOK_URL;
      const newUrl = config.CURR_WEBHOOK_URL;

      // Step 2: For each repo call /webhook/update with prev and curr urls
      await Promise.all(
        repos.map((repo) =>
          fetch(`${base}/webhook/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              github_username: repo.owner.login,
              repo_name: repo.name,
              pat,
              prev_webhook_url: prevUrl,
              curr_webhook_url: newUrl,
            }),
          })
        )
      );

      setSnackbar({ open: true, message: `All repo webhooks updated successfully!` });
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Failed to update some webhooks.' });
    } finally {
      setWebhookUpdating(false);
      handleWebhookClose();
    }
  };

  const handleWebhookSave = async () => {
    setWebhookSubmitting(true);
    const pat = import.meta.env.VITE_GITHUB_PAT || '';
    const base = import.meta.env.VITE_API_BASE_URL || ' https://repo-onboard-full.onrender.com';
    try {
      await fetch(`${base}/config/webhook-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_url: webhookUrl, pat }),
      });
      setCurrWebhookUrl(webhookUrl);
      setWebhookSuccess(true);
      setWebhookUrl('');
    } catch (e) {
      console.error(e);
    } finally {
      setWebhookSubmitting(false);
    }
  };

  const totalPages = Math.ceil(repos.length / PAGE_SIZE);
  const paginated = repos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 2 }}>
      <Container maxWidth="xl">

        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="primary.dark">
              Your Repositories
            </Typography>
            {!loading && !error && (
              <Typography variant="body2" color="text.secondary" mt={0.25}>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, repos.length)}–{Math.min(page * PAGE_SIZE, repos.length)} of {repos.length} repositories
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1.5}>
            <Button variant="outlined" color="primary" startIcon={<LinkIcon />} onClick={() => setWebhookOpen(true)} size="small">
              Update Webhook URL
            </Button>
            <Button
              variant="contained" color="primary" size="small"
              startIcon={onboardingAll ? <CircularProgress size={14} color="inherit" /> : <DoneAllIcon />}
              onClick={handleOnboardAll}
              disabled={onboardingAll || repos.length === 0}
              sx={{ color: '#ffffff !important' }}
            >
              {onboardingAll ? 'Onboarding...' : 'Onboard All Repos'}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading && <Box display="flex" justifyContent="center" mt={8}><CircularProgress color="primary" /></Box>}
        {error && <Alert severity="error">{error}</Alert>}

        {/* Repo List */}
        {onboardingAll && (
          <Box display="flex" alignItems="center" gap={1.5} mb={2} px={2} py={1.5}
            sx={{ bgcolor: 'rgba(0,150,136,0.06)', border: '1px solid rgba(0,150,136,0.2)', borderRadius: 2 }}>
            <CircularProgress size={16} sx={{ color: '#009688' }} />
            <Typography variant="body2" color="#009688" fontWeight={600}>
              Onboarding all {repos.length} repositories, please wait...
            </Typography>
          </Box>
        )}
        <Stack spacing={1.5}>
          {paginated.map(repo => (
            <Box key={repo.id} display="flex" alignItems="center" gap={2}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 3,
                  px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 2,
                  bgcolor: 'background.paper', transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
                }}
              >
                <FolderOpenIcon color="primary" sx={{ fontSize: 22, flexShrink: 0 }} />
                <Box flex={1} minWidth={0}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>{repo.name}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                    {repo.description || 'No description'}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
                  <Chip
                    icon={repo.private ? <LockIcon /> : <PublicIcon />}
                    label={repo.private ? 'Private' : 'Public'}
                    size="small" color={repo.private ? 'secondary' : 'success'}
                  />
                  {repo.language && <Chip label={repo.language} size="small" variant="outlined" color="primary" />}
                  <Chip
                    icon={<BranchIcon />} label={repo.default_branch || 'main'}
                    size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'divider' }}
                  />
                </Box>
              </Paper>
              <Button
                variant="contained" color="primary" size="small"
                onClick={() => handleOnboard(repo)}
                disabled={onboardingRepo === repo.id}
                sx={{ flexShrink: 0, px: 2, py: 1, whiteSpace: 'nowrap', color: '#ffffff !important' }}
              >
                {onboardingRepo === repo.id ? 'Onboarding...' : 'Onboard'}
              </Button>
            </Box>
          ))}
        </Stack>

        {/* Pagination */}
        {totalPages > 1 && (
          <Stack alignItems="center" mt={3}>
            <Pagination
              count={totalPages} page={page} color="primary" shape="rounded"
              showFirstButton showLastButton
              onChange={(_, val) => { setPage(val); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </Stack>
        )}

      </Container>

      {/* Webhook Dialog */}
      <Dialog open={webhookOpen} onClose={handleWebhookClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, fontSize: '0.95rem', pb: 1 }}>Update Webhook URL</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter a new webhook URL. Submit updates the config only. Update patches all existing repo webhooks.
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>Current URL:</Typography>
          <Box sx={{ bgcolor: '#eff6ff', borderRadius: 1.5, px: 1.5, py: 0.75, mb: 2, wordBreak: 'break-all' }}>
            <Typography component="a" href={currWebhookUrl} target="_blank" rel="noreferrer"
              sx={{ color: '#2563eb', fontSize: '0.78rem', textDecoration: 'none' }}>
              {currWebhookUrl || 'Loading...'}
            </Typography>
          </Box>

          {!webhookSuccess ? (
            <>
              <Typography variant="body2" color="text.secondary" mb={0.75}>New Webhook URL</Typography>
              <TextField
                fullWidth
                placeholder="https://your-endpoint.vercel.app/webhook"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                size="small"
              />
            </>
          ) : (
            <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, px: 2, py: 1.5, mt: 1 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <CheckCircleIcon fontSize="small" sx={{ color: '#16a34a' }} />
                <Typography variant="body2" fontWeight={700} color="#16a34a">
                  Webhook URL updated successfully!
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Config has been saved. Click <strong>Update</strong> to patch all existing repo webhooks.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          {!webhookSuccess ? (
            <>
              <Button variant="outlined" color="inherit" onClick={handleWebhookClose} fullWidth>Cancel</Button>
              <Button
                variant="contained" color="primary" onClick={handleWebhookSave}
                disabled={!webhookUrl.trim() || webhookSubmitting} fullWidth
                startIcon={webhookSubmitting ? <CircularProgress size={14} color="inherit" /> : null}
              >
                {webhookSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outlined" color="inherit" onClick={handleWebhookClose} fullWidth disabled={webhookUpdating}>Cancel</Button>
              <Button variant="contained" color="primary" onClick={handleUpdate} fullWidth
                disabled={webhookUpdating}
                startIcon={webhookUpdating ? <CircularProgress size={14} color="inherit" /> : null}>
                {webhookUpdating ? 'Updating...' : 'Update'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        message={
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircleIcon fontSize="small" sx={{ color: '#22c55e' }} />
            <Typography variant="body2" sx={{ color: '#ffffff' }}>{snackbar.message}</Typography>
          </Box>
        }
        ContentProps={{ sx: { bgcolor: '#ffffff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } }}
      />
    </Box>
  );
}

export default Onboarding;
