// ─── Shared Daily Activity Data & Store ──────────────────────────────────────
// Single source of truth used by:
//   TeacherClassActivities.jsx  → reads/writes records
//   TeacherNotifications.jsx    → reads notifications + ignore store
//   AdminDailyActivity.jsx      → reads all records by date
//   ParentDailyActivity.jsx     → reads today's record for child

export const TODAY = new Date().toISOString().split('T')[0];

// ─── Option Arrays ────────────────────────────────────────────────────────────
export const SLEEP_OPTIONS = [
  { id: 'not_sleeping', label: 'Not Sleeping',      short: 'None'   },
  { id: 'less_1hr',     label: 'Less than 1 Hour',  short: '< 1 Hr' },
  { id: 'less_2hr',     label: 'Less than 2 Hours', short: '< 2 Hr' },
  { id: 'less_3hr',     label: 'Less than 3 Hours', short: '< 3 Hr' },
  { id: '3hr_plus',     label: '3 Hours+',           short: '3 Hr+'  },
];

export const FOOD_TIME_OPTIONS = [
  { id: 'before_12', label: 'Before 12 PM',   short: 'Bfr 12' },
  { id: '12_to_3',   label: '12 PM – 3 PM',   short: '12–3'   },
  { id: 'after_3',   label: 'After 3 PM',      short: 'Aftr 3' },
];

export const FOOD_QTY_OPTIONS = [
  { id: 'full',        label: 'Full Meal',  short: 'Full' },
  { id: 'half',        label: 'Half Meal',  short: 'Half' },
  { id: 'not_eating',  label: 'Not Eating', short: 'None' },
];

export const DIAPER_STATUS_OPTIONS = [
  { id: 'na',  label: 'N/A',         short: 'N/A'  },
  { id: 'yes', label: 'Changed',     short: 'Done' },
  { id: 'no',  label: 'Not Changed', short: 'No'   },
];

export const DIAPER_TIME_OPTIONS = [
  { id: 'before_12', label: 'Before 12 PM',  short: 'Bfr 12' },
  { id: '12_to_3',   label: '12 PM – 3 PM',  short: '12–3'   },
  { id: 'after_3',   label: 'After 3 PM',     short: 'Aftr 3' },
];

export const MOOD_OPTIONS = [
  { id: 'happy',  label: 'Happy',  short: 'Happy'  },
  { id: 'calm',   label: 'Calm',   short: 'Calm'   },
  { id: 'cranky', label: 'Cranky', short: 'Cranky' },
  { id: 'sad',    label: 'Sad',    short: 'Sad'    },
  { id: 'unwell', label: 'Unwell', short: 'Unwell' },
];

export const ACTIVITY_OPTIONS = [
  { id: 'drawing',  label: 'Drawing & Coloring', short: 'Drawing'  },
  { id: 'reading',  label: 'Story / Reading',    short: 'Reading'  },
  { id: 'outdoor',  label: 'Outdoor Play',       short: 'Outdoor'  },
  { id: 'music',    label: 'Music & Rhymes',     short: 'Music'    },
  { id: 'dance',    label: 'Dance & Movement',   short: 'Dance'    },
  { id: 'craft',    label: 'Arts & Craft',       short: 'Craft'    },
  { id: 'puzzle',   label: 'Puzzle / Games',     short: 'Puzzle'   },
  { id: 'exercise', label: 'Exercise / Yoga',    short: 'Exercise' },
];

export const HEALTH_OPTIONS = [
  { id: 'fever',        label: 'Fever'            },
  { id: 'cough',        label: 'Cough'            },
  { id: 'cold',         label: 'Cold / Runny Nose'},
  { id: 'vomiting',     label: 'Vomiting'         },
  { id: 'stomach_ache', label: 'Stomach Ache'     },
];

// ─── Default record shape ─────────────────────────────────────────────────────
export const DEFAULT_RECORD = {
  sleep:          null,
  foodTime:       null,
  foodQty:        null,
  foodNote:       '',
  diaperStatus:   'na',
  diaperTime:     null,
  mood:           null,
  activities:     [],
  healthConcerns: [],
  teacherNote:    '',
  updatedAt:      null,
  updatedBy:      '',
};

// ─── Notification rules ───────────────────────────────────────────────────────
export const NOTIFICATION_RULES = [
  {
    id: 'food_not_eating',
    label: 'Not Eating',
    description: 'Student has not eaten food today',
    check: (r) => r?.foodQty === 'not_eating',
    severity: 'high',
    icon: 'Coffee',
    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA',
  },
  {
    id: 'food_half_only',
    label: 'Eating Very Little',
    description: 'Student ate only half meal today',
    check: (r) => r?.foodQty === 'half',
    severity: 'medium',
    icon: 'Coffee',
    color: '#D97706', bg: '#FFFBEB', border: '#FCD34D',
  },
  {
    id: 'diaper_not_changed',
    label: 'Diaper Not Changed',
    description: 'Diaper / dress marked as not changed',
    check: (r) => r?.diaperStatus === 'no',
    severity: 'high',
    icon: 'Shirt',
    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA',
  },
  {
    id: 'diaper_not_recorded',
    label: 'Diaper Not Updated',
    description: 'Diaper / dress change not recorded yet today',
    check: (r) => !r || (r.diaperStatus === null || r.diaperStatus === undefined),
    severity: 'low',
    icon: 'Shirt',
    color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0',
  },
  {
    id: 'not_sleeping',
    label: 'No Sleep Today',
    description: 'Student has not slept at all today',
    check: (r) => r?.sleep === 'not_sleeping',
    severity: 'medium',
    icon: 'Moon',
    color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE',
  },
  {
    id: 'health_concern',
    label: 'Health Concern',
    description: 'Teacher marked a health issue for this student',
    check: (r) => r?.healthConcerns?.length > 0,
    severity: 'high',
    icon: 'Heart',
    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA',
  },
  {
    id: 'mood_unwell',
    label: 'Child Unwell / Upset',
    description: "Student's mood marked as Unwell or Sad",
    check: (r) => r?.mood === 'unwell' || r?.mood === 'sad',
    severity: 'medium',
    icon: 'Smile',
    color: '#9333EA', bg: '#F3E8FF', border: '#E9D5FF',
  },
  {
    id: 'report_not_updated',
    label: 'Report Not Updated',
    description: "Teacher has not updated this student's report today",
    check: (r) => !r,
    severity: 'low',
    icon: 'ClipboardList',
    color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0',
  },
];

// ─── Teacher classes ──────────────────────────────────────────────────────────
export const TEACHER_CLASSES = [
  {
    id: 'CLS001',
    name: 'Nursery A',
    type: 'Daycare',
    classType: 'FIXED_TIME',
    section: 'A',
    color: '#6D28D9',
    bg: '#F5F3FF',
    students: [
      { id: 'STU001', name: 'Aarav Sharma', age: 2, parent: 'Priya Sharma',  avatar: 'AS' },
      { id: 'STU002', name: 'Diya Patel',   age: 3, parent: 'Rajan Patel',   avatar: 'DP' },
      { id: 'STU003', name: 'Rohan Verma',  age: 2, parent: 'Rahul Verma',   avatar: 'RV' },
      { id: 'STU004', name: 'Anaya Joshi',  age: 3, parent: 'Kavita Joshi',  avatar: 'AJ' },
      { id: 'STU005', name: 'Vihaan Reddy', age: 2, parent: 'Anjali Reddy',  avatar: 'VR' },
    ],
  },
  {
    id: 'CLS003',
    name: 'KG A',
    type: 'Hours Based',
    classType: 'HOURS_BASED',
    section: 'A',
    color: '#0F766E',
    bg: '#F0FDFA',
    students: [
      { id: 'STU006', name: 'Sneha Gupta', age: 4, parent: 'Mahesh Gupta',  avatar: 'SG' },
      { id: 'STU007', name: 'Arjun Singh', age: 5, parent: 'Amit Singh',    avatar: 'AS' },
      { id: 'STU008', name: 'Kavya Mehta', age: 4, parent: 'Suresh Mehta',  avatar: 'KM' },
    ],
  },
];

// ─── In-memory record store  key = `${studentId}_${date}` ───────────────────
const _records = {};

// Pre-fill demo data
const _seed = () => {
  const s = (sid, data) => {
    _records[`${sid}_${TODAY}`] = {
      ...DEFAULT_RECORD, ...data,
      updatedAt: '10:30 AM',
      updatedBy: 'Ms. Kavita',
    };
  };
  s('STU001', { sleep: 'less_1hr',  foodTime: 'before_12', foodQty: 'full',        diaperStatus: 'yes', diaperTime: '12_to_3', mood: 'happy',  activities: ['drawing','music'],   teacherNote: 'Very active today! Great time with art.' });
  s('STU002', { sleep: 'less_2hr',  foodTime: '12_to_3',   foodQty: 'half',        diaperStatus: 'na',  diaperTime: null,      mood: 'calm',   activities: ['reading','puzzle'],  teacherNote: '' });
  s('STU004', { sleep: '3hr_plus',  foodTime: 'after_3',   foodQty: 'not_eating',  diaperStatus: 'yes', diaperTime: 'after_3', mood: 'cranky', activities: ['outdoor'],           healthConcerns: ['cold'], teacherNote: 'Slight cold noticed. Parents informed.' });
};
_seed();

// ─── Record CRUD ──────────────────────────────────────────────────────────────
/** Get record for a student on a given date. Returns null if not found. */
export const getRecord = (studentId, date = TODAY) =>
  _records[`${studentId}_${date}`] || null;

/** Save / update record for a student. */
export const saveRecord = (studentId, data, date = TODAY) => {
  _records[`${studentId}_${date}`] = {
    ...DEFAULT_RECORD,
    ...data,
    updatedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    updatedBy: 'Ms. Kavita',
  };
  return _records[`${studentId}_${date}`];
};

/** Check if a record exists for a student on a date. */
export const hasRecord = (studentId, date = TODAY) =>
  !!_records[`${studentId}_${date}`];

/**
 * Get ALL records for a given date.
 * Returns an object keyed by `${studentId}_${date}`.
 * Used by AdminDailyActivity.
 */
export const getAllRecords = (date = TODAY) => {
  const result = {};
  Object.keys(_records).forEach((key) => {
    if (key.endsWith(`_${date}`)) {
      result[key] = _records[key];
    }
  });
  return result;
};

// ─── Option helpers ───────────────────────────────────────────────────────────
/**
 * Returns the `short` value for an option by id.
 * Used by TeacherClassActivities, AdminDailyActivity student rows.
 */
export const getOptionShort = (options, id) =>
  options.find((o) => o.id === id)?.short || id;

/**
 * Returns the full `label` for an option by id.
 * Used by ParentDailyActivity, AdminDailyActivity modal.
 */
export const getOptionLabel = (options, id) =>
  options.find((o) => o.id === id)?.label || id;

// ─── Ignore store  key = `${studentId}_${ruleId}_${date}` ───────────────────
const _ignores = {};

// Pre-fill 2 demo ignores
_ignores[`STU003_food_not_eating_${TODAY}`] = {
  reason:    'Parent informed — child fasting today due to religious reason.',
  ignoredBy: 'Ms. Kavita',
  ignoredAt: '11:15 AM',
  date:       TODAY,
};
_ignores[`STU001_not_sleeping_${TODAY}`] = {
  reason:    'Child was unwell in the morning — parent approved rest at home.',
  ignoredBy: 'Ms. Kavita',
  ignoredAt: '09:45 AM',
  date:       TODAY,
};

export const setIgnore = (studentId, ruleId, reason, ignoredBy = 'Teacher', date = TODAY) => {
  _ignores[`${studentId}_${ruleId}_${date}`] = {
    reason,
    ignoredBy,
    ignoredAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    date,
  };
};

export const removeIgnore = (studentId, ruleId, date = TODAY) => {
  delete _ignores[`${studentId}_${ruleId}_${date}`];
};

export const getIgnore = (studentId, ruleId, date = TODAY) =>
  _ignores[`${studentId}_${ruleId}_${date}`] || null;

export const isIgnored = (studentId, ruleId, date = TODAY) =>
  !!_ignores[`${studentId}_${ruleId}_${date}`];

// ─── Notification generator ───────────────────────────────────────────────────
/**
 * Loops all classes → all students → all rules.
 * Returns array of notification objects.
 * Used by TeacherNotifications and AdminNotifications.
 */
export const generateNotifications = (date = TODAY) => {
  const notifications = [];

  TEACHER_CLASSES.forEach((cls) => {
    cls.students.forEach((student) => {
      const record = getRecord(student.id, date);

      NOTIFICATION_RULES.forEach((rule) => {
        if (rule.check(record)) {
          const ignored    = isIgnored(student.id, rule.id, date);
          const ignoreData = getIgnore(student.id, rule.id, date);

          notifications.push({
            id:              `${student.id}_${rule.id}_${date}`,
            studentId:       student.id,
            studentName:     student.name,
            studentAvatar:   student.avatar,
            classId:         cls.id,
            className:       cls.name,
            classType:       cls.type,
            classColor:      cls.color,
            ruleId:          rule.id,
            ruleLabel:       rule.label,
            ruleDescription: rule.description,
            ruleSeverity:    rule.severity,
            ruleIcon:        rule.icon,
            ruleColor:       rule.color,
            ruleBg:          rule.bg,
            ruleBorder:      rule.border,
            date,
            record,           // attach full record so modals can display it
            ignored,
            ignoreData:      ignoreData || null,
          });
        }
      });
    });
  });

  return notifications;
};