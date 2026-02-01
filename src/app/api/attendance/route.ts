import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '../../../../database.types';

// NOTE: In a real Next.js app with Supabase Auth, you would use 
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// using cookies to perform the action as the authenticated user.
// For this generated code, we assume a standard client creation or standard pattern.
// We will use the generic createClient for demonstration of logic, relying on RLS.

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient<Database>(supabaseUrl, supabaseKey);

        const body = await request.json();
        const { courseId, date, records } = body;

        if (!courseId || !date || !Array.isArray(records)) {
            return NextResponse.json(
                { error: 'Missing required fields: courseId, date, records array' },
                { status: 400 }
            );
        }

        // Transform payload to database rows
        const attendanceRows = records.map((r: any) => ({
            course_id: courseId,
            student_id: r.studentId,
            date: date,
            status: r.status,
            // recorded_by would be set by RLS triggers or logic if we had the user session here easily.
            // If we used createRouteHandlerClient, RLS would know the user automatically.
        }));

        const { data, error } = await supabase
            .from('attendance')
            .upsert(attendanceRows, { onConflict: 'student_id, course_id, date' })
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: data?.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
