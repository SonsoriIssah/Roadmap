// Seed data. On first launch this is copied into local storage, after which
// everything (calendar, timetable, roadmap modules) is editable in the app.
// "Reset" actions in Settings restore these values.

export const DATA_VERSION = 3;

// ---------------------------------------------------------------------------
// Modes: how much career preparation a period can carry.
// `pace` is roadmap modules completed per week in that mode (used by the
// forecast). `hours` is the guidance shown to you.
// ---------------------------------------------------------------------------
export const MODES = {
  normal: { label: 'Normal week', short: 'Normal', hours: '3–5 h', pace: 1 },
  heavy: { label: 'Heavy coursework', short: 'Heavy', hours: '1–2 h', pace: 0.4 },
  exam: { label: 'Exams', short: 'Exams', hours: '0–1 h', pace: 0 },
  break: { label: 'Break', short: 'Break', hours: '8–12 h', pace: 2 },
  off: { label: 'Off week', short: 'Off', hours: '0 h', pace: 0 },
};

export const MODE_ORDER = ['normal', 'heavy', 'exam', 'break', 'off'];

// Calendar event kinds. Kinds with a `mode` change your weekly capacity.
// `priority` decides which wins when periods overlap (higher wins).
export const KINDS = {
  exam: { label: 'Examinations', short: 'Exams', mode: 'exam', priority: 50 },
  midsem: { label: 'Mid-semester exams', short: 'Mid-sems', mode: 'exam', priority: 40 },
  break: { label: 'Break / vacation', short: 'Break', mode: 'break', priority: 30 },
  teaching: { label: 'Teaching period', short: 'Teaching', mode: 'normal', priority: 20 },
  semester: { label: 'Semester', short: 'Semester', mode: null, priority: 0 },
  admin: { label: 'Admin window', short: 'Admin', mode: null, priority: 0 },
  milestone: { label: 'Milestone', short: 'Date', mode: null, priority: 0 },
};

export const KIND_ORDER = ['teaching', 'midsem', 'exam', 'break', 'semester', 'admin', 'milestone'];

export const DEFAULT_SETTINGS = {
  theme: 'system', // system | light | dark
  planStart: '2026-10-05',
  targetEnd: '2027-06-30',
  pace: { normal: 1, heavy: 0.4, exam: 0, break: 2, off: 0 },
  defaultMode: 'normal', // mode for days not covered by any calendar period
  preExamDays: 7, // days before an exam period that count as "heavy" (0 = off)
  previewDate: null, // "pretend today is" for exploring future weeks
  daily: {
    // Per day, by mode. learn = max minutes of lessons; lecture = minutes to
    // revise each course you had a lecture in; rotate = courses revised in
    // rotation on days without lectures (and every day before/during exams).
    break: { problems: 4, revisits: 3, learn: 150, lecture: 0, rotate: 1, rotateMin: 45, module: 60, kickoff: 4 },
    normal: { problems: 2, revisits: 2, learn: 60, lecture: 25, rotate: 2, rotateMin: 40, module: 30, kickoff: 2 },
    heavy: { problems: 1, revisits: 1, learn: 20, lecture: 0, rotate: 2, rotateMin: 60, module: 0, kickoff: 0 },
    exam: { problems: 0, revisits: 1, learn: 0, lecture: 0, rotate: 3, rotateMin: 90, module: 0, kickoff: 0 },
    off: { problems: 0, revisits: 0, learn: 0, lecture: 0, rotate: 0, rotateMin: 0, module: 0, kickoff: 0 },
  },
  courseBoost: 2, // extra learning on days you have a lecture in the same subject
  problemOrder: 'roadmap', // roadmap: current topic first | sheet: your sheet's priority and order
};

export const DAILY_FIELDS = [
  { key: 'problems', label: 'New problems', unit: '' },
  { key: 'revisits', label: 'Revisits (max)', unit: '' },
  { key: 'learn', label: 'Learning (max)', unit: 'min' },
  { key: 'lecture', label: 'Revise each lecture', unit: 'min' },
  { key: 'rotate', label: 'Courses in rotation', unit: '' },
  { key: 'rotateMin', label: 'Per rotated course', unit: 'min' },
  { key: 'module', label: 'Roadmap task', unit: 'min' },
  { key: 'kickoff', label: 'First-week tasks', unit: '' },
];

// ---------------------------------------------------------------------------
// KNUST 2026/2027 academic calendar (student-relevant entries).
// ---------------------------------------------------------------------------
export const DEFAULT_CALENDAR = [
  { id: 'c-pre', title: 'Free time before the semester', start: '2026-10-05', end: '2026-10-18', kind: 'break' },
  { id: 'c-sem1', title: 'First Semester', start: '2026-10-13', end: '2027-02-13', kind: 'semester' },
  { id: 'c-reg1', title: 'Online course registration (continuing students)', start: '2026-10-12', end: '2026-10-29', kind: 'admin' },
  { id: 'c-arr1', title: 'Arrival of continuing students', start: '2026-10-17', end: '2026-10-17', kind: 'milestone' },
  { id: 'c-bio1', title: 'Biometric registration', start: '2026-10-19', end: '2026-11-12', kind: 'admin' },
  { id: 'c-teach1', title: 'Teaching period: 1st semester', start: '2026-10-19', end: '2027-01-22', kind: 'teaching' },
  { id: 'c-mid1', title: 'Mid-semester examinations', start: '2026-12-14', end: '2026-12-18', kind: 'midsem' },
  { id: 'c-xmas', title: 'Christmas break', start: '2026-12-19', end: '2027-01-03', kind: 'break' },
  { id: 'c-ass1', title: 'Assessment of lecturers by students', start: '2026-12-16', end: '2027-01-23', kind: 'admin' },
  { id: 'c-res1', title: 'Resumption of lectures', start: '2027-01-04', end: '2027-01-04', kind: 'milestone' },
  { id: 'c-exam1', title: 'First semester examinations', start: '2027-01-25', end: '2027-02-12', kind: 'exam' },
  { id: 'c-dep1', title: 'Students depart', start: '2027-02-13', end: '2027-02-13', kind: 'milestone' },
  { id: 'c-inter', title: 'Inter-semester break', start: '2027-02-14', end: '2027-03-14', kind: 'break' },
  { id: 'c-sem2', title: 'Second Semester', start: '2027-03-13', end: '2027-06-26', kind: 'semester' },
  { id: 'c-reg2', title: 'Online course registration', start: '2027-03-01', end: '2027-04-02', kind: 'admin' },
  { id: 'c-arr2', title: 'Arrival of students', start: '2027-03-13', end: '2027-03-13', kind: 'milestone' },
  { id: 'c-bio2', title: 'Biometric registration', start: '2027-03-15', end: '2027-04-02', kind: 'admin' },
  { id: 'c-teach2', title: 'Teaching period: 2nd semester', start: '2027-03-15', end: '2027-06-04', kind: 'teaching' },
  { id: 'c-mid2', title: 'Mid-semester examinations', start: '2027-04-26', end: '2027-04-30', kind: 'midsem' },
  { id: 'c-ass2', title: 'Assessment of lecturers by students', start: '2027-05-31', end: '2027-06-05', kind: 'admin' },
  { id: 'c-exam2', title: 'Second semester examinations', start: '2027-06-07', end: '2027-06-25', kind: 'exam' },
  { id: 'c-dep2', title: 'Students depart', start: '2027-06-26', end: '2027-06-26', kind: 'milestone' },
  { id: 'c-long', title: 'Long vacation', start: '2027-06-27', end: '2027-09-20', kind: 'break' },
  { id: 'c-ay28', title: '2027/2028 academic year starts', start: '2027-09-21', end: '2027-09-21', kind: 'milestone' },
];

// ---------------------------------------------------------------------------
// Timetables are tied to a date range so each semester can have its own.
// day: 0 = Monday ... 6 = Sunday
// ---------------------------------------------------------------------------
export const DEFAULT_TIMETABLES = [
  {
    id: 't-sem1',
    name: 'Group 1 · First Semester 2026/27',
    from: '2026-10-19',
    to: '2027-01-22',
    sessions: [
      { id: 's1', day: 0, start: '08:00', end: '09:55', code: 'CSM 273', title: 'Linear and Numerical Algebra', lecturer: 'G. O. Fosu', venue: 'SCB-SF20' },
      { id: 's2', day: 0, start: '10:30', end: '12:25', code: 'CSM 251', title: 'Introductory Electronics I', lecturer: 'F. K. Ampong', venue: 'SCB-SF1' },
      { id: 's3', day: 0, start: '13:00', end: '14:55', code: 'ENGL 263', title: 'Literature in English I', lecturer: 'T. Oduro-Kwarteng', venue: 'SCB-SF19' },
      { id: 's4', day: 1, start: '13:00', end: '14:55', code: 'CSM 291', title: 'System Analysis and Design I', lecturer: 'Y. M. Missah', venue: 'SCB-GF1' },
      { id: 's5', day: 2, start: '10:30', end: '12:25', code: 'CS-SEMINAR', title: 'Departmental Seminar (Combined)', lecturer: 'All Lecturers', venue: 'SCB-FF5' },
      { id: 's6', day: 2, start: '15:00', end: '16:55', code: 'CSM 265', title: 'Ethical and Legal Implication of Computing', lecturer: 'E. Osei', venue: 'SCB-SF8' },
      { id: 's7', day: 3, start: '08:00', end: '09:55', code: 'CSM 255', title: 'Open Source Operating Systems', lecturer: 'K. Takyi', venue: 'SCB-SF19' },
      { id: 's8', day: 3, start: '15:00', end: '16:55', code: 'CSM 281', title: 'Object Oriented Programming with Java', lecturer: 'F. Twum', venue: 'SCB-FF1' },
      { id: 's9', day: 3, start: '17:00', end: '18:55', code: 'CSM 297', title: 'Database Concepts and Technologies I', lecturer: 'K. O. Peasah', venue: 'SCB-FF1' },
      { id: 's10', day: 4, start: '17:00', end: '18:55', code: 'CSM 273', title: 'Linear and Numerical Algebra (Combined)', lecturer: 'G. O. Fosu', venue: '' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Roadmap modules. Sequential; the forecast places them on future weeks
// according to each week's capacity. `keywords` link a module to courses in
// your timetable that cover the same ground.
// ---------------------------------------------------------------------------
export const PHASES = {
  p1: { name: 'Foundation and diagnostics', span: 'M1–2', exit: 'Diagnostic scores recorded, flagship chosen, first project tests added, resume updated.' },
  p2: { name: 'Engineering depth', span: 'M3–4', exit: 'Reproducible project tests, documented architecture, measurable DSA improvement.' },
  p3: { name: 'Interview readiness', span: 'M5–6', exit: 'Multiple mock interviews completed, weak patterns documented, project walkthrough rehearsed.' },
  p4: { name: 'Recruitment execution', span: 'M7–9', exit: 'Applications tracked, interview weaknesses addressed, no unnecessary project rebuilds.' },
};

export const TRACKS = {
  dsa: 'DSA',
  cs: 'Core CS',
  project: 'Project',
  interview: 'Interview',
  career: 'Career',
};

// Words matched against the Pattern / Topic columns of your problem sheet, so
// the roadmap's current topic decides which problems come next.
export const MODULE_PATTERNS = {
  W3: ['array', 'hash', 'frequency', 'prefix', 'running state', 'kadane', 'string'],
  W5: ['two pointer'],
  W6: ['sliding window'],
  W7: ['stack', 'queue', 'monotonic'],
  W9: ['binary search'],
  W10: ['linked list', 'recursion'],
  W13: ['tree', 'trie', 'bst'],
  W14: ['heap', 'priority queue', 'interval', 'top k'],
  W15: ['graph', 'island', 'union find', 'matrix'],
  W21: ['topological', 'shortest path', 'dijkstra', 'advanced graph'],
  W22: ['greedy', 'backtrack'],
  W25: ['dynamic programming', 'dp'],
};

const m = (id, phase, track, title, objective, exit, extra = {}) => ({ id, phase, track, title, objective, exit, weight: 1, keywords: [], patterns: MODULE_PATTERNS[id] || [], ...extra });

export const DEFAULT_MODULES = [
  m('W1', 'p1', 'dsa', 'Baseline', 'Solve two unseen DSA problems; record time, hints and complexity.', 'Write your starting scorecard.'),
  m('W2', 'p1', 'dsa', 'Python and debugging', 'Implement a small function with edge cases and debug a deliberately faulty version.', 'Review strings, lists, dictionaries and testing.'),
  m('W3', 'p1', 'dsa', 'Arrays and hashing', 'Practise frequency maps, sets and prefix sums.', 'Re-solve one Week 1 problem without notes.'),
  m('W4', 'p1', 'project', 'Project audit', 'Trace one LedgerCore transfer end to end and identify unverified claims.', 'Write a one-page architecture diagram.'),
  m('W5', 'p1', 'dsa', 'Two pointers', 'Practise sorted arrays, pairs and in-place operations.', 'Redo one hashing problem.'),
  m('W6', 'p1', 'dsa', 'Sliding windows', 'Practise fixed and variable windows.', 'Explain the window invariant aloud.'),
  m('W7', 'p1', 'dsa', 'Stacks and queues', 'Implement stack/queue patterns and recognise monotonic-stack use cases.', 'Review complexity and boundary cases.'),
  m('W8', 'p1', 'cs', 'SQL foundations', 'Practise joins, grouping, subqueries and NULL behaviour.', 'Record SQL diagnostic results.', { keywords: ['database', 'sql'] }),
  m('W9', 'p2', 'dsa', 'Binary search', 'Practise boundary search and monotonic predicates.', 'Re-solve one sliding-window problem.'),
  m('W10', 'p2', 'dsa', 'Linked lists and recursion', 'Practise pointer changes, recursion bases and call-stack tracing.', 'Review stack and queue problems.'),
  m('W11', 'p2', 'cs', 'Database transactions', 'Study atomicity, isolation, locks and serialization failures.', "Write down LedgerCore's consistency guarantees.", { keywords: ['database', 'sql'] }),
  m('W12', 'p2', 'project', 'Project test sprint', 'Add tests for duplicate requests, rollback and concurrent debits.', 'Run the full suite and record failures honestly.'),
  m('W13', 'p2', 'dsa', 'Trees', 'Practise traversal, recursion and tree properties.', 'Re-solve two older problems.'),
  m('W14', 'p2', 'dsa', 'Heaps and intervals', 'Practise top-k, merging and interval overlaps.', 'Explain why the chosen data structure fits.'),
  m('W15', 'p2', 'dsa', 'Graphs', 'Practise BFS, DFS and visited-state correctness.', 'Review trees and queues.'),
  m('W16', 'p2', 'project', 'Aggregation API reliability', 'Test duplicate messages, provider timeouts and worker restarts.', 'Document idempotency and recovery behaviour.'),
  m('W17', 'p3', 'cs', 'Core networking', 'Study HTTP, DNS, TCP, TLS and connection lifecycles.', 'Explain one API request from client to database.', { keywords: ['network'] }),
  m('W18', 'p3', 'cs', 'Operating systems', 'Study processes, threads, memory and context switching.', 'Review concurrency terminology.', { keywords: ['operating system'] }),
  m('W19', 'p3', 'cs', 'Concurrency', 'Study races, locks, deadlocks and transaction conflicts.', 'Explain a race condition from a concrete example.', { keywords: ['operating system', 'concurren'] }),
  m('W20', 'p3', 'interview', 'First mock interview', 'Complete a timed coding session and project discussion.', 'Write three specific improvement actions.'),
  m('W21', 'p3', 'dsa', 'Graphs and algorithms', 'Practise topological sorting and shortest-path fundamentals.', 'Review the weakest graph pattern.', { keywords: ['algorithm'] }),
  m('W22', 'p3', 'dsa', 'Greedy and backtracking', 'Practise decision reasoning and state-space exploration.', 'Explain why greedy choices work or fail.'),
  m('W23', 'p3', 'cs', 'Java and OOP diagnostic', 'Review classes, interfaces, collections and exceptions if Python is stable.', 'Choose whether Java deserves a larger allocation.', { keywords: ['java', 'object oriented'] }),
  m('W24', 'p3', 'interview', 'Behavioural preparation', 'Draft truthful STAR stories for leadership, failure and teamwork.', 'Practise a concise project explanation.'),
  m('W25', 'p4', 'dsa', 'Dynamic programming introduction', 'Practise state definition, transitions and base cases.', 'Re-solve a graph or tree problem.'),
  m('W26', 'p4', 'interview', 'Timed assessments', 'Complete a realistic timed coding set.', 'Analyse accuracy, speed and avoidable errors.'),
  m('W27', 'p4', 'project', 'Project interview defence', 'Explain architecture, schema, failure modes and trade-offs without notes.', 'Verify all resume metrics.', { keywords: ['system analysis', 'design'] }),
  m('W28', 'p4', 'career', 'Company-specific preparation', 'Choose two active applications and review their actual job requirements.', 'Tailor resumes and schedule mock interviews.'),
  m('W29', 'p4', 'dsa', 'Weakest DSA patterns', 'Use scorecard evidence to target recurring mistakes.', 'Revisit problems after a delay.'),
  m('W30', 'p4', 'cs', 'Database and performance', 'Study indexes, EXPLAIN plans and bottleneck measurement.', 'Record one defensible benchmark if useful.', { keywords: ['database'] }),
  m('W31', 'p4', 'interview', 'Mock interview cycle', 'Complete coding and behavioural mocks where available.', 'Convert feedback into three concrete changes.'),
  m('W32', 'p4', 'career', 'Recruitment sprint', 'Prioritise active roles, applications, referrals and assessments.', 'Review deadlines and eligibility.'),
  m('W37', 'p4', 'dsa', 'Targeted revision', 'Use actual interview feedback or diagnostic weaknesses.', 'Re-solve previously missed problems.'),
  m('W38', 'p4', 'career', 'Portfolio and applications', 'Polish documentation and verify application records.', 'Remove unsupported resume claims.'),
  m('W39', 'p4', 'career', 'Retrospective', 'Evaluate outcomes, eligibility blockers and time allocation.', 'Build the next plan from evidence.'),
];

// ---------------------------------------------------------------------------
// Learning tracks. Lessons are spread over the track's weeks; days with a
// lecture matching `keywords` (CSM 281) get more. Video lessons carry their
// chapter timestamps, so the daily list says "Watch 26:02 → 34:32".
// ---------------------------------------------------------------------------
const L = (id, title, min, practice, extra = {}) => ({ id, title, min, practice, ...extra });

const secs = (t) => t.split(':').map(Number).reduce((acc, n) => acc * 60 + n, 0);

// Chapters of "Java Tutorial for Beginners" (Programming with Mosh, YouTube).
// [id, start, title, practice?, practice minutes?, extra?]. Each chapter ends
// where the next begins; the free video stops before "Clean Coding".
const MOSH_CHAPTERS = [
  ['mo1', '0:00', 'Introduction'],
  ['mo2', '1:48', 'Installing Java'],
  ['mo3', '4:02', 'Anatomy of a Java Program'],
  ['mo4', '8:46', 'Your First Java Program', 'Create a HelloWorld project in IntelliJ and run it.', 10, { match: ['first'] }],
  ['mo5', '16:01', 'Cheat Sheet'],
  ['mo6', '16:29', 'How Java Code Gets Executed', 'Compile Main.java with javac and run it with java from the terminal.', 10, { match: ['execut', 'compil'] }],
  ['mo7', '22:56', 'Course Structure'],
  ['mo8', '25:24', 'Types'],
  ['mo9', '26:02', 'Variables'],
  ['mo10', '29:14', 'Primitive Types', 'Declare one variable of every primitive type (note the L and F suffixes).', 10, { match: ['primitive'] }],
  ['mo11', '34:32', 'Reference Types'],
  ['mo12', '39:19', 'Primitive Types vs Reference Types', 'Show in code that copying a Point shares one object but copying an int does not.', 10, { match: ['reference'] }],
  ['mo13', '43:42', 'Strings', 'Reverse a String and check if it is a palindrome; try trim, replace and indexOf.', 15, { match: ['string'] }],
  ['mo14', '50:49', 'Escape Sequences'],
  ['mo15', '53:25', 'Arrays', 'Solve Contains Duplicate in Java using Arrays.sort.', 20, { match: ['array'] }],
  ['mo16', '58:50', 'Multi-Dimensional Arrays'],
  ['mo17', '1:01:30', 'Constants'],
  ['mo18', '1:03:18', 'Arithmetic Expressions'],
  ['mo19', '1:07:25', 'Order of Operations'],
  ['mo20', '1:08:45', 'Casting', 'Read "1.5" as a String, parse it, and add it to an int.', 10, { match: ['cast'] }],
  ['mo21', '1:15:14', 'The Math Class'],
  ['mo22', '1:19:56', 'Formatting Numbers'],
  ['mo23', '1:25:46', 'Reading Input', 'Read a name and an age with Scanner and print a formatted greeting.', 10, { match: ['input'] }],
  ['mo24', '1:30:48', 'Project: Mortgage Calculator', 'Build the mortgage calculator yourself before watching the solution.', 45, { match: ['mortgage'], breakAfter: true }],
  ['mo25', '1:32:58', 'Solution: Mortgage Calculator'],
  ['mo26', '1:37:17', 'Types Summary'],
  ['mo27', '1:38:45', 'Control Flow'],
  ['mo28', '1:39:34', 'Comparison Operators'],
  ['mo29', '1:41:21', 'Logical Operators', 'Write the loan-eligibility rule with &&, || and !.', 10, { match: ['logical'] }],
  ['mo30', '1:45:57', 'If Statements'],
  ['mo31', '1:50:23', 'Simplifying If Statements'],
  ['mo32', '1:53:52', 'The Ternary Operator'],
  ['mo33', '1:56:19', 'Switch Statements'],
  ['mo34', '2:00:10', 'Exercise: FizzBuzz', 'Pause at 2:00:55 and solve FizzBuzz before watching the solution.', 15, { match: ['fizz'] }],
  ['mo35', '2:06:10', 'For Loops', 'Print a 1–10 multiplication table with nested for loops.', 10, { match: ['for loop'] }],
  ['mo36', '2:09:57', 'While Loops'],
  ['mo37', '2:14:26', 'Do...While Loops'],
  ['mo38', '2:15:39', 'Break and Continue', 'Write a loop that echoes input until the user types quit.', 10, { match: ['break', 'continue'] }],
  ['mo39', '2:18:55', 'For-Each Loop'],
  ['mo40', '2:22:02', 'Project: Mortgage Calculator (validation)', 'Add input validation to your calculator yourself before watching the solution.', 30, { match: ['mortgage'], breakAfter: true }],
  ['mo41', '2:23:30', 'Solution: Mortgage Calculator (validation)'],
  ['mo42', '2:28:28', 'Control Flow Summary'],
];
const MOSH_END = '2:29:26';

export function moshLessons() {
  return MOSH_CHAPTERS.map(([id, start, title, practice = '', practiceMin = 0, extra = {}], i) => ({
    id,
    title,
    start: secs(start),
    end: secs(i + 1 < MOSH_CHAPTERS.length ? MOSH_CHAPTERS[i + 1][1] : MOSH_END),
    video: true,
    practice,
    practiceMin,
    ...extra,
  }));
}

export const JAVA_VIDEO = {
  resource: 'Mosh',
  url: 'https://www.youtube.com/watch?v=eIrMbAQSU34',
};

export const JAVA_STUDY_LESSONS = [
  L('j7', 'Methods: parameters, return values, overloading, static', 40, 'Refactor your mortgage calculator into methods: readNumber(prompt, min, max), calculateMortgage(...).'),
  L('j8', 'Classes and objects: fields, constructors, this, toString', 45, 'Model a Student class with a constructor and toString.'),
  L('j9', 'Encapsulation: access modifiers, getters/setters, final', 40, 'BankAccount with a private balance and validated deposit/withdraw.'),
  L('j10', 'Inheritance: extends, super, overriding, equals and hashCode', 50, 'Shape → Circle and Rectangle with area(); override equals/hashCode on Circle.'),
  L('j11', 'Polymorphism and abstract classes', 45, 'Store Shapes in a List<Shape> and total their areas polymorphically.'),
  L('j12', 'Interfaces, default methods, Comparable vs Comparator', 45, 'Sort Students by GPA (descending), then by name.'),
  L('j13', 'Exceptions: try/catch/finally, checked vs unchecked, custom, try-with-resources', 45, 'Throw an InsufficientFundsException from BankAccount.withdraw.'),
  L('j14', 'Collections I: List, ArrayList, LinkedList, iterating', 40, 'Remove duplicates from an ArrayList while keeping order.'),
  L('j15', 'Collections II: HashMap, HashSet, TreeMap; the equals/hashCode contract', 50, 'Solve Two Sum and Valid Anagram in Java with HashMap.'),
  L('j16', 'Stack, Queue and Deque (ArrayDeque); PriorityQueue', 40, 'Solve Valid Parentheses in Java with ArrayDeque.'),
  L('j17', 'Generics: classes, methods, bounded types', 40, 'Write a generic Pair<A, B> and max(List<T extends Comparable<T>>).'),
  L('j18', 'Enums, records and nested classes', 30, 'An enum Direction with a turnRight() method; a record Point(int x, int y).'),
  L('j19', 'Lambdas and streams: map, filter, sorted, collect', 45, 'From a List<Student>, collect the names with GPA > 3.5, sorted.'),
  L('j20', 'Testing with JUnit 5 and a Maven/Gradle project', 45, 'Write five JUnit tests for BankAccount, including the exception.'),
  L('j21', 'DSA in Java: re-solve three problems you solved before', 60, 'Time each one; list the Java syntax you still had to look up.'),
  L('j22', 'Checkpoint: small CLI app (library or bank) with classes, collections and exceptions', 90, 'Push it to GitHub with a README.'),
];

export const DEFAULT_TRACKS = [
  {
    id: 'java',
    name: 'Java',
    start: '2026-10-07',
    weeks: 3,
    active: true,
    keywords: ['java', 'object oriented'],
    ...JAVA_VIDEO,
    lessons: [...moshLessons(), ...JAVA_STUDY_LESSONS],
  },
];

// Saves from before the Mosh course used topic placeholders for the first
// lessons. If those are still untouched they are swapped for the chapters,
// and lessons already ticked carry over to the chapters covering that topic.
export const OLD_JAVA_PLACEHOLDERS = {
  j1: ['mo1', 'mo2', 'mo3', 'mo4', 'mo5', 'mo6', 'mo7'],
  j2: ['mo8', 'mo9', 'mo10', 'mo11', 'mo12'],
  j3: ['mo13', 'mo14'],
  j4: ['mo17', 'mo18', 'mo19', 'mo20', 'mo21', 'mo22', 'mo28', 'mo29', 'mo32'],
  j5: ['mo30', 'mo31', 'mo33', 'mo34'],
  j6: ['mo15', 'mo16', 'mo35', 'mo36', 'mo37', 'mo38', 'mo39'],
  j7: ['mo23'],
};

// Weeks of the original plan that depend on the calendar rather than on
// sequence. They appear automatically when their trigger fires.
export const RITUALS = {
  exam: {
    title: 'Exam mode',
    from: 'W33 · W34',
    items: [
      'Maintain DSA recall only if coursework permits: short review sessions, no new topics.',
      'Pause nonessential project work around examinations.',
      'Keep an application checklist for urgent deadlines only.',
    ],
  },
  preExam: {
    title: 'Exams are close',
    from: 'Workload rule',
    items: [
      'This week counts as heavy: 1–2 hours of career work at most.',
      'Keep one short DSA session so recall does not decay.',
      'Move anything optional until after the exams.',
    ],
  },
  interview: {
    title: 'Interview mode',
    from: 'W35',
    items: [
      'Prepare for the scheduled interview or assessment only.',
      'Review the patterns and project questions relevant to that role.',
      'Re-read the job description; rehearse three STAR stories aloud.',
    ],
  },
  semesterEnd: {
    title: 'Semester review',
    from: 'W36',
    items: [
      'Compare DSA, CS and project evidence against your October baseline.',
      'Choose the highest-value gaps for the next quarter.',
      "Add next semester's timetable and check the calendar for changes.",
    ],
  },
  monthEnd: {
    title: 'Monthly review',
    from: 'Monthly decision rules',
    items: [
      'What improved this month?',
      'What remains weak?',
      'Which applications progressed?',
      'What must change next month?',
    ],
  },
  weekly: {
    title: 'Weekly check-in',
    from: 'Progress scorecard',
    items: [
      "Rate this week's scorecard (Track tab).",
      'Review new openings and upcoming deadlines.',
      'Select the three highest-impact tasks for next week.',
    ],
  },
};

// ---------------------------------------------------------------------------
// Scorecard areas (0–4 each, 28 total).
// ---------------------------------------------------------------------------
export const SCORE_AREAS = [
  { id: 'dsa', label: 'Independent DSA problems', hint: 'Solved without hints and explained correctly' },
  { id: 'timed', label: 'Timed coding performance', hint: 'Accuracy, time and avoidable errors' },
  { id: 'cs', label: 'Core CS understanding', hint: 'Concepts explained without notes' },
  { id: 'project', label: 'Project engineering quality', hint: 'Tests, defects fixed, reproducible evidence' },
  { id: 'interview', label: 'Interview practice', hint: 'Coding or behavioural simulations' },
  { id: 'recruitment', label: 'Recruitment actions', hint: 'Eligible applications, referrals and follow-ups' },
  { id: 'academic', label: 'Academic progress', hint: 'Coursework, assignments and exam preparation' },
];

export const DSA_PATTERNS = [
  'Arrays & hashing', 'Two pointers', 'Sliding window', 'Stack / queue', 'Binary search',
  'Linked list', 'Recursion', 'Trees', 'Heaps', 'Intervals', 'Graphs (BFS/DFS)',
  'Topological sort', 'Shortest path', 'Greedy', 'Backtracking', 'Dynamic programming',
  'SQL', 'Other',
];

export const APP_STATUSES = ['researching', 'applied', 'OA', 'interview', 'rejected', 'offer'];

export const ELIGIBILITY_CHECKS = [
  { id: 'grad', text: 'Accepts a student graduating in May 2029' },
  { id: 'ghana', text: 'Accepts applicants studying at KNUST in Ghana' },
  { id: 'loc', text: 'Open to applicants based outside the advertised country' },
  { id: 'auth', text: 'Work authorisation / sponsorship is provided or not needed' },
  { id: 'dates', text: 'Internship dates fit university obligations' },
  { id: 'reqs', text: 'Academic requirements, programme restrictions and deadline checked' },
];

// ---------------------------------------------------------------------------
// Checklists (evidence you build over time).
// ---------------------------------------------------------------------------
export const CHECKLISTS = {
  kickoff: {
    title: 'First seven days',
    items: [
      { id: 'k1', text: 'Create the application tracker: every current application, deadline, location, eligibility and next action.' },
      { id: 'k2', text: 'Run the DSA baseline: two unseen problems, no solutions first. Record approach, complexity and mistakes.' },
      { id: 'k3', text: 'Audit LedgerCore: trace a transfer from validation to commit (idempotency, isolation, retries, integrity).' },
      { id: 'k4', text: 'Test SQL and database fundamentals: joins, grouping, indexes, isolation.' },
      { id: 'k5', text: 'Update your resume: add Ecobank accurately, verify metrics, qualify claims you cannot defend.' },
      { id: 'k6', text: 'Explain LedgerCore aloud in five minutes, then answer duplicate-request and concurrency questions.' },
      { id: 'k7', text: 'Review and plan: baseline, coursework load, applications. Pick three tasks for next week.' },
    ],
  },
  resume: {
    title: 'Resume actions',
    items: [
      { id: 'r1', text: 'Add the current Ecobank Personalisation Team internship with real responsibilities and technologies.' },
      { id: 'r2', text: 'Verify the LedgerCore 98.5% concurrency figure: define the workload and explain the other 1.5%.' },
      { id: 'r3', text: 'Make the aggregation failure injection reproducible; report sample size, duplicates and recovery.' },
      { id: 'r4', text: 'Show what GitHub Actions actually runs (tests, lint) instead of listing CI/CD as a keyword.' },
      { id: 'r5', text: 'Keep skills defensible: be able to explain your real use of Kafka, Redis and PostgreSQL.' },
      { id: 'r6', text: 'Maintain role-specific versions (backend/infrastructure vs general SWE).' },
      { id: 'r7', text: 'Treat the FarmLink 25% income figure as a pilot estimate, not a measured result.' },
    ],
  },
  ledger: {
    title: 'LedgerCore defence',
    items: [
      { id: 'l1', text: 'What exactly is atomic about a transfer?' },
      { id: 'l2', text: 'How do you prevent duplicate transfers when clients retry requests?' },
      { id: 'l3', text: 'Why SERIALIZABLE isolation, and what happens when a transaction aborts?' },
      { id: 'l4', text: 'What causes a retry, and how do you prevent retry storms?' },
      { id: 'l5', text: "How do you prove every completed transfer preserves the ledger's invariants?" },
      { id: 'l6', text: 'Tests exist for concurrent debits, duplicate idempotency keys, insufficient funds, rollback, serialization failures and interruption.' },
      { id: 'l7', text: 'Consistency guarantees and failure modes are documented.' },
    ],
  },
  aggregation: {
    title: 'Aggregation API defence',
    items: [
      { id: 'a1', text: 'What happens if a worker crashes after processing a message but before acknowledging it?' },
      { id: 'a2', text: 'How do you prevent duplicate database records after redelivery?' },
      { id: 'a3', text: 'What happens when a provider times out but later completes the request?' },
      { id: 'a4', text: 'How do you handle rate limits and a growing Kafka consumer backlog?' },
      { id: 'a5', text: 'What guarantees does your implementation actually provide?' },
      { id: 'a6', text: 'Tests exist for worker restarts, duplicates, out-of-order updates, provider timeouts and database failures.' },
    ],
  },
  studypair: {
    title: 'StudyPair walkthrough',
    items: [
      { id: 'sp1', text: 'Explain the authentication model.' },
      { id: 'sp2', text: 'Explain the database schema.' },
      { id: 'sp3', text: 'Explain the notification flow.' },
      { id: 'sp4', text: 'Describe the two integration bugs you caught and how.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Playbook (reference content from your master plan).
// ---------------------------------------------------------------------------
export const PLAYBOOK = {
  priorities: [
    ['DSA and coding interviews', 'Build independent problem-solving ability and speed — the broadest interview bottleneck.'],
    ['Academic performance', 'Protect your CWA. Coursework constrains the time available for everything else.'],
    ['Project correctness', 'Make LedgerCore and the aggregation API reproducible, testable and defensible.'],
    ['Applications and eligibility', 'Apply as roles open. Graduation year, location, authorisation and dates can rule you out.'],
    ['Core computer science', 'Databases, networking, operating systems and concurrency alongside project work.'],
    ['Behavioural interviews', 'Ownership, teamwork, failure, conflict and learning stories from real experience.'],
    ['Java and Spring Boot', 'After a basic Java diagnostic and once higher priorities are sustainable.'],
    ['Advanced systems programming', 'Defer deep C++, lock-free structures and advanced theory unless a role needs them.'],
  ],
  dsaStages: [
    ['Foundation', 'Solve common array, string and hash-map problems independently and explain complexity.'],
    ['Intermediate', 'Recognise the right pattern in unfamiliar problems and implement a correct solution with tests.'],
    ['Timed', 'Solve appropriately selected interview problems within a realistic time limit without hints.'],
    ['Interview-ready', 'Explain the approach before coding, reason about alternatives, test edge cases, recover calmly.'],
  ],
  syllabus: [
    ['Databases', 'Relational modelling, joins, indexes, query plans, ACID, isolation levels, locks and deadlocks.'],
    ['Networking', 'HTTP semantics, DNS, TCP, TLS, timeouts, connection pooling and retries.'],
    ['Operating systems', 'Processes, threads, memory, scheduling, synchronization and deadlocks.'],
    ['Concurrency', 'Race conditions, thread safety, atomicity, asynchronous I/O and backpressure.'],
    ['Distributed systems', 'Duplicate delivery, idempotency, replication, consistency, failure recovery, observability.'],
    ['System design', 'Requirements, APIs, data models, bottlenecks, caching, queues, rate limiting, trade-offs.'],
  ],
  decisionRules: [
    ['DSA accuracy is low', 'Reduce new topics and return to foundational patterns.'],
    ['Accuracy high, timed performance poor', 'Practise timed sets, implementation speed and edge cases.'],
    ["You can't explain a project decision", 'Revisit the implementation before adding another feature.'],
    ['Backend strong, CS answers weak', 'Shift project time toward networking, databases and OS.'],
    ['An interview is scheduled', "Temporarily prioritise that interview's requirements."],
    ['Coursework is falling behind', 'Reduce career preparation immediately.'],
    ['Repeated rejections', 'Diagnose the stage of rejection before changing the whole strategy.'],
  ],
  topActions: [
    'Establish your actual DSA baseline.',
    'Make LedgerCore technically defensible.',
    'Update your resume with your real Ecobank experience.',
    'Apply continuously and resolve eligibility early.',
    'Protect your KNUST academic performance.',
  ],
  networking: [
    'Prioritise alumni, KNUST graduates, former interns and engineers in relevant teams.',
    'Ask informed questions about the work, selection criteria and technical expectations.',
    'Use your mentor to practise technical explanations and get honest feedback.',
    'Request a referral only for a suitable role and when the person is comfortable.',
    'Track follow-ups; avoid repeated messages that add no new information.',
    'At Ecobank, seek a small backend-oriented assignment or an intro to a services team.',
  ],
  archetypes: [
    { id: 'A', name: 'Financial-services technology', priority: 'High', focus: 'DSA, clean coding, OOP, SQL, debugging, project walkthroughs and behavioural interviews. Add Java when relevant. Bloomberg and infrastructure teams: systems fundamentals and performance.' },
    { id: 'B', name: 'General technology and product engineering', priority: 'High', focus: 'Independent DSA, coding accuracy, data structures, testing, debugging and clear technical communication.' },
    { id: 'C', name: 'Infrastructure, data systems and developer platforms', priority: 'Medium–high', focus: 'Programming fundamentals, networking, OS, concurrency and performance reasoning. Deepen distributed systems where the role justifies it.' },
    { id: 'D', name: 'Quantitative trading and research engineering', priority: 'Selective', focus: 'Programming depth, algorithms, mathematical reasoning. C++ and low-level performance for some roles — establish the DSA baseline first.' },
    { id: 'E', name: 'Early-insight and pre-internship programmes', priority: 'When eligible', focus: 'Motivation, teamwork examples and fundamentals. Verify academic-year and location eligibility separately.' },
  ],
  companies: [
    ['Goldman Sachs', 'A', 'OOP, clean implementation, SQL, debugging and structured behavioural answers'],
    ['JPMorgan Chase', 'A', 'DSA, Java fundamentals where relevant, project explanation and coding-assessment practice'],
    ['Bloomberg', 'A', 'Strong DSA, code quality, debugging, systems fundamentals and detailed project defence'],
    ['Bank of America', 'A', 'Coding fundamentals, OOP, databases, communication and role-specific technology'],
    ['Morgan Stanley', 'A', 'DSA, OOP, Java where relevant, project discussion and behavioural preparation'],
    ['Morgan Stanley early-insight', 'E', 'Programme-specific eligibility, motivation and evidence of initiative'],
    ['Citi', 'A', 'DSA, OOP, SQL, debugging and team-based project examples'],
    ['Palantir', 'B', 'Problem-solving, practical coding, project depth and explaining engineering trade-offs'],
    ['Microsoft', 'B', 'DSA, problem decomposition, testing and behavioural examples'],
    ['Google', 'B', 'Strong DSA, algorithmic reasoning, coding accuracy and complexity analysis'],
    ['Amazon', 'B', 'DSA, coding, ownership stories and role-relevant behavioural preparation'],
    ['Meta', 'B', 'DSA speed, algorithmic reasoning and clear coding explanations'],
    ['NVIDIA', 'C', 'Programming fundamentals, systems concepts relevant to the role and technical project depth'],
    ['NVIDIA Ignite', 'E', 'Programme eligibility, motivation, teamwork examples and fundamentals'],
    ['Apple', 'B', 'Role-specific technical fundamentals, implementation quality and attention to detail'],
    ['Databricks', 'C', 'Distributed data processing, databases, concurrency and relevant systems concepts'],
    ['Stripe', 'B', 'API design, correctness, testing, failure handling and clear engineering reasoning'],
    ['Two Sigma', 'D', 'Programming, DSA and mathematical reasoning appropriate to the exact role'],
    ['Jane Street', 'D', 'Programming depth and mathematical reasoning where required; verify the engineering role'],
    ['Capital One', 'B', 'DSA, practical software engineering, SQL, testing and behavioural communication'],
    ['Uber', 'B', 'DSA, backend architecture, reliability and service-level trade-offs where relevant'],
    ['Cloudflare', 'C', 'Networking, operating systems, performance and systems fundamentals for the team'],
    ['Hudson River Trading', 'D', 'Algorithms, programming depth, concurrency and C++ or performance engineering where relevant'],
  ],
  recruitment: [
    ['October', 'Review live applications (NVIDIA Ignite, Google, banking technology). Confirm eligibility and deadlines; submit roles that are already open.'],
    ['November – January', 'Check careers pages regularly, prepare for assessments, request referrals where appropriate, follow up professionally.'],
    ['February – April', 'Continue with roles still accepting candidates. Reallocate time immediately when interviews are scheduled.'],
    ['May – June', 'Prioritise confirmed interviews and urgent deadlines. Resolve internship date conflicts before accepting an offer.'],
  ],
};
