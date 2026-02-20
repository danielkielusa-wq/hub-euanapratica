/**
 * Health Check: Sistema de Agendamento (Bookings)
 *
 * O que valida (perspectiva do founder):
 * - Tabela bookings existe?
 * - Tabela mentor_availability existe?
 * - Tabela mentor_services existe?
 * - Tabela booking_policies existe?
 * - RPC get_student_booking_stats funciona?
 * - Edge functions de email (booking-confirmation, reminder) deployed?
 */

import { createClient } from '@supabase/supabase-js';
import type { HealthCheckResult } from './types';

export async function checkBookings(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Tabelas core do booking system
    const tables = [
      'bookings',
      'mentor_availability',
      'mentor_services',
      'booking_policies',
      'booking_history',
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);

      if (error && error.message.includes('Could not find')) {
        details[table] = 'MISSING';
        errors.push(`Tabela ${table} não existe`);
      } else if (error && error.message.includes('permission denied')) {
        details[table] = 'ok (RLS)';
      } else {
        details[table] = 'ok';
      }
    }

    // 2. RPC get_student_booking_stats
    const { error: statsError } = await supabase.rpc('get_student_booking_stats', {
      p_student_id: '00000000-0000-0000-0000-000000000000',
    });

    if (statsError && statsError.message.includes('Could not find the function')) {
      details.rpc_booking_stats = 'MISSING';
      errors.push('RPC get_student_booking_stats não existe');
    } else {
      details.rpc_booking_stats = 'ok';
    }

    // 3. Edge functions de email para bookings
    const emailFunctions = [
      'send-booking-confirmation',
      'send-booking-reminder',
      'send-booking-cancelled',
    ];

    for (const fn of emailFunctions) {
      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/${fn}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ healthcheck: true }),
        });
        details[`edge_fn_${fn}`] = resp.status === 404 ? 'not_deployed' : 'deployed';
      } catch {
        details[`edge_fn_${fn}`] = 'unreachable';
      }
    }

    return {
      name: 'Agendamentos (Bookings)',
      status: errors.length === 0 ? 'pass' : errors.some(e => e.includes('bookings não existe')) ? 'fail' : 'warn',
      duration: Date.now() - startTime,
      error: errors.length > 0 ? errors.join(' | ') : undefined,
      details,
    };
  } catch (error) {
    return {
      name: 'Agendamentos (Bookings)',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
