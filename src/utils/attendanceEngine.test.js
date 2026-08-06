import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSessionLabelForClass,
  getActiveClasses,
  getUnmarkedClasses,
  getClassResolutionWarning,
  getFlexiDisplay,
  describeAttendanceResult
} from './attendanceEngine.js';
import { FALLBACK_SESSION_LABEL, CLASS_TYPES } from './attendanceConstants.js';

test('getSessionLabelForClass buckets flex-time classes by start time', () => {
  const morning = getSessionLabelForClass({ classType: CLASS_TYPES.FLEX_TIME, startTime: '09:00' }, {});
  const afternoon = getSessionLabelForClass({ classType: CLASS_TYPES.FLEX_TIME, startTime: '13:30' }, {});
  const evening = getSessionLabelForClass({ classType: CLASS_TYPES.FLEX_TIME, startTime: '16:30' }, {});

  assert.equal(morning, 'MORNING');
  assert.equal(afternoon, 'AFTERNOON');
  assert.equal(evening, 'EVENING');
});

test('getActiveClasses returns separate active classes and flags session conflicts', () => {
  const student = {
    classIds: ['c1', 'c2'],
    classTimings: {
      c1: { startTime: '09:00', endTime: '12:00' },
      c2: { startTime: '09:00', endTime: '12:00' }
    }
  };
  const classesData = [
    { id: 'c1', name: 'Book Writing', classType: CLASS_TYPES.FIXED_TIME, startTime: '09:00', endTime: '12:00' },
    { id: 'c2', name: 'PG', classType: CLASS_TYPES.FIXED_TIME, startTime: '09:00', endTime: '12:00' }
  ];

  const active = getActiveClasses(student, classesData, new Date('2026-07-04T09:30:00'));
  assert.equal(active.length, 2);
  assert.equal(active[0].sessionLabel, 'MORNING');
  assert.equal(active[1].sessionLabel, 'MORNING');
  assert.equal(active[0].conflict, true);
  assert.equal(active[1].conflict, true);
});

test('getUnmarkedClasses filters out already marked rows by classId', () => {
  const active = [{ classId: 'c1' }, { classId: 'c2' }];
  const records = [{ classId: 'c1' }];
  assert.deepEqual(getUnmarkedClasses(active, records), [{ classId: 'c2' }]);
});

test('getClassResolutionWarning only warns for multi-class admin scans', () => {
  const student = { classIds: ['c1', 'c2'] };
  assert.match(getClassResolutionWarning(student, 'admin', [{ id: 'c1', name: 'Book Writing' }, { id: 'c2', name: 'PG' }]), /Book Writing/);
  assert.equal(getClassResolutionWarning(student, 'teacher', [{ id: 'c1', name: 'Book Writing' }]), null);
});

test('getFlexiDisplay follows the same paid/free/used/left convention', () => {
  const student = { classIds: ['c1'], classTimings: { c1: { paidFlexiHours: 10, freeFlexiHours: 5, consumedFlexiHours: 3 } }, consumedFlexiHours: 2 };
  const result = getFlexiDisplay(student, [{ id: 'c1' }]);
  assert.equal(result.hasPlan, true);
  assert.equal(result.paid, 10);
  assert.equal(result.free, 5);
  assert.equal(result.used, 3);
  assert.equal(result.left, 12);
  assert.equal(result.overstayHours, 2);
  assert.equal(result.hasOverstay, false);
});

test('describeAttendanceResult uses the shared copy rules', () => {
  const res = describeAttendanceResult('INVALID_QR');
  assert.equal(res.tone, 'error');
  assert.match(res.message, /valid student QR/);
  assert.equal(res.title, 'Invalid QR');
});

test('hours based classes fall back to FULL_DAY when no time is available', () => {
  const label = getSessionLabelForClass({ classType: CLASS_TYPES.HOURS_BASED });
  assert.equal(label, FALLBACK_SESSION_LABEL);
});
