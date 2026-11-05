import { describe, it, expect } from 'vitest';
import { evaluateWritten, evaluateOral, criteriaToScore } from '../src/lib/exam';
import profile from '../content/exam-profiles/us-b1.json';
import type { ExamProfile } from '../src/lib/schema';

const p = profile as unknown as ExamProfile;

describe('written pass rule (us-b1)', () => {
  it('passes with ≥50% overall and ≥50% in every skill', () => {
    const r = evaluateWritten(p, { reading: 0.5, listening: 0.6, writing: 0.7 });
    expect(r.passed).toBe(true);
    expect(r.grade).toBe('APTO');
  });
  it('fails if one skill is below 50% even when the average is above 50%', () => {
    const r = evaluateWritten(p, { reading: 0.95, listening: 0.95, writing: 0.45 });
    expect(r.overall).toBeGreaterThan(0.5);
    expect(r.passed).toBe(false);
    expect(r.grade).toBe('SUSPENSO, 3');
    expect(r.failedSkills).toEqual(['writing']);
    expect(r.weakest).toBe('writing');
  });
});

describe('oral', () => {
  it('requires the written pass and ≥50%', () => {
    expect(evaluateOral(p, 0.6, true).passed).toBe(true);
    expect(evaluateOral(p, 0.6, false).passed).toBe(false);
    const f = evaluateOral(p, 0.4, true);
    expect(f.grade).toBe('SUSPENSO, 4');
    expect(f.carriesWritten).toBe(true);
  });
});

it('converts 0–3 criteria to a fraction', () => {
  expect(criteriaToScore([3, 3, 3, 3])).toBe(1);
  expect(criteriaToScore([2, 1, 2, 1])).toBe(0.5);
});
