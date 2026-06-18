import { createClient } from '@supabase/supabase-js'
import type { WorkerContext } from './types'

export default function getSupabaseClient(ctx: WorkerContext) {
    return createClient(
        ctx.env.SUPABASE_URL,
        ctx.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            global: {
                fetch: ctx.fetch
            },
            auth: {
                persistSession: false,
                detectSessionInUrl: false
            }
        }
    )
}