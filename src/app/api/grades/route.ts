import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '../../../../database.types';

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient<Database>(supabaseUrl, supabaseKey);

        const body = await request.json();
        const { evaluationId, studentId, score, feedback } = body;

        // 1. Validation Logic
        if (!evaluationId || !studentId || score === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const numericScore = Number(score);
        if (isNaN(numericScore) || numericScore < 1 || numericScore > 10) {
            return NextResponse.json(
                { error: 'Score must be a number between 1 and 10' },
                { status: 400 }
            );
        }

        // 2. Insert Logic
        const { data, error } = await supabase
            .from('grades')
            .insert({
                evaluation_id: evaluationId,
                student_id: studentId,
                score: numericScore,
                feedback: feedback || null
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
