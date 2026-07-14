// API service layer: thin wrappers around Supabase calls.
//
// TODO: Implement resource-specific service functions (e.g., fetchDevices,
// fetchSessions). Keep this layer free of UI/business logic — it should
// only be responsible for data access.

import { supabase } from '../lib/supabaseClient';

// Example placeholder export to illustrate the intended shape of the
// service layer. Replace with real service functions.
export const apiService = {
  supabase,
  // TODO: e.g. getCurrentUser: () => supabase.auth.getUser(),
};
