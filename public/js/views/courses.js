import { h, card, cardHeader, button, iconButton, chip, segmented, field, input, select, textarea, openSheet, toast, icon, progressBar } from '../ui.js';
import { fmtDay, toDay, toISO, isISODate } from '../dates.js';
import { uid } from '../parse.js';

export const TOPIC_STATUSES = [
  { id: 'not_started', label: 'Untouched', short: 'Untouched' },
  { id: 'studying', label: 'Studying', short: 'Studying' },
  { id: 'revised', label: 'Revised', short: 'Revised' },
  { id: 'confident', label: 'Confident', short: 'Confident' },
];

export const ACTIVITY_TYPES = [
  'Topic revision',
  'Course study session',
  'Problem-solving practice',
  'Assignment preparation',
  'Coursework and laboratory preparation',
  'Quiz and examination preparation',
  'University deadlines and assessments',
  'Reviewing lecture notes',
];

/** Calculate credit-weighted average across courses that have recorded assessment marks. */
export function calculateSemesterAverage(courses, assessments) {
  let totalWeightedScore = 0;
  let totalCreditsWithMarks = 0;

  for (const c of courses || []) {
    const courseAssessments = (assessments || []).filter(
      (a) => a.courseCode === c.code && Number.isFinite(Number(a.mark)) && Number.isFinite(Number(a.maxMark)) && Number(a.maxMark) > 0,
    );
    if (!courseAssessments.length) continue;

    const hasWeights = courseAssessments.every((a) => Number.isFinite(Number(a.weight)) && Number(a.weight) > 0);
    let courseScore = 0;
    if (hasWeights) {
      const totalWeight = courseAssessments.reduce((sum, a) => sum + Number(a.weight), 0);
      courseScore = courseAssessments.reduce(
        (sum, a) => sum + (Number(a.mark) / Number(a.maxMark)) * 100 * (Number(a.weight) / totalWeight),
        0,
      );
    } else {
      courseScore =
        courseAssessments.reduce((sum, a) => sum + (Number(a.mark) / Number(a.maxMark)) * 100, 0) /
        courseAssessments.length;
    }

    totalWeightedScore += courseScore * c.credits;
    totalCreditsWithMarks += c.credits;
  }

  if (totalCreditsWithMarks === 0) return null;
  return totalWeightedScore / totalCreditsWithMarks;
}

/** Get completion stats across all course topics. */
export function getTopicStats(courses, progress) {
  const counts = { not_started: 0, studying: 0, revised: 0, confident: 0, total: 0 };
  for (const c of courses || []) {
    const cProg = (progress && progress[c.code] && progress[c.code].topicStatus) || {};
    for (const t of c.topics || []) {
      counts.total++;
      const st = cProg[t.id] || 'not_started';
      counts[st] = (counts[st] || 0) + 1;
    }
  }
  return counts;
}

/** Render the Courses tab in the Track view. */
export function renderCoursesTab(app) {
  const courses = app.state.courses || [];
  const academic = app.state.academic || {};
  const progress = academic.progress || {};
  const assessments = academic.assessments || [];
  const studyTasks = academic.studyTasks || [];
  const totalCredits = courses.reduce((s, c) => s + (Number(c.credits) || 0), 0);

  const avg = calculateSemesterAverage(courses, assessments);
  const targetAvg = Number(academic.targetAverage) || 85;
  const topicStats = getTopicStats(courses, progress);

  return h(
    'div',
    { class: 'stack' },
    // Header & Performance Card
    card(
      cardHeader(
        'KNUST University Courses',
        h('span', { class: 'small muted' }, `${courses.length} courses · ${totalCredits} credits`),
        'First-Year Computer Science · Semester 1 (2026/27)',
      ),
      h(
        'div',
        { class: 'score-total' },
        h('span', { class: 'stat-value' }, avg !== null ? `${avg.toFixed(1)}%` : `${targetAvg}%`),
        h('span', { class: 'muted' }, avg !== null ? ' credit-weighted average' : ' target average (no marks yet)'),
      ),
      h(
        'div',
        { class: 'row-actions wrap' },
        chip(`${totalCredits} Credits Total`, { mode: 'normal' }),
        chip(`Target: ${targetAvg}% Average`, { mode: 'heavy' }),
        avg !== null ? chip(`Current: ${avg.toFixed(1)}%`, { mode: avg >= targetAvg ? 'good' : 'warning' }) : null,
        chip(`${courses.filter((c) => !c.outlinePending).length} Outlines Available`, { mode: 'break' }),
        chip(`${courses.filter((c) => c.outlinePending).length} Pending Outline / Roadmap`, { mode: 'off' }),
      ),
      topicStats.total > 0
        ? h(
            'div',
            { class: 'stack small' },
            h('span', { class: 'muted' }, `Topic Progress (${topicStats.confident + topicStats.revised + topicStats.studying}/${topicStats.total} active):`),
            progressBar((topicStats.confident + topicStats.revised * 0.7 + topicStats.studying * 0.3) / topicStats.total, 'Topic mastery'),
            h(
              'div',
              { class: 'row-actions wrap' },
              h('span', { class: 'small' }, `🟢 Confident: ${topicStats.confident}`),
              h('span', { class: 'small' }, `🟡 Revised: ${topicStats.revised}`),
              h('span', { class: 'small' }, `🔵 Studying: ${topicStats.studying}`),
              h('span', { class: 'small muted' }, `⚪ Untouched: ${topicStats.not_started}`),
            ),
          )
        : null,
      h(
        'div',
        { class: 'row-actions wrap', style: { marginTop: '12px' } },
        button('+ Schedule Study Session', () => openStudySessionEditor(app), { kind: 'primary', size: 'sm' }),
        button('+ Record Assessment Mark', () => openAssessmentEditor(app), { kind: 'secondary', size: 'sm' }),
      ),
    ),

    // Notice on academic scheduling cap
    h(
      'div',
      { class: 'card', style: { padding: '12px 16px', background: 'var(--surface-2)', border: '1px solid var(--line)' } },
      h('p', { class: 'small', style: { margin: 0 } }, h('strong', null, 'Academic Scheduling: '), 'University study activities (topic revision, problem-solving, lecture review, lab and exam prep) have ', h('strong', null, 'no three-task daily limit'), '. The 3-activity cap applies exclusively to personal activities.'),
    ),

    // Course Cards
    h(
      'div',
      { class: 'stack' },
      h('h2', { class: 'eyebrow' }, 'Courses & Syllabus Tracker'),
      courses.map((c) => renderCourseCard(app, c, progress[c.code] || {}, assessments.filter((a) => a.courseCode === c.code))),
    ),

    // Upcoming Academic Deadlines & Scheduled Sessions
    renderUpcomingAcademicCard(app, studyTasks, assessments),
  );
}

/** Render individual course card. */
function renderCourseCard(app, course, courseProg, courseAssessments) {
  const topicStatus = courseProg.topicStatus || {};
  const topics = course.topics || [];
  const knownCount = course.topics && course.topics.length ? course.topics.length : course.topicCount || (course.outlinePending ? 'Pending official outline' : 0);
  const unitLabel = course.topicUnit || 'topics';

  const confident = topics.filter((t) => topicStatus[t.id] === 'confident').length;
  const revised = topics.filter((t) => topicStatus[t.id] === 'revised').length;
  const studying = topics.filter((t) => topicStatus[t.id] === 'studying').length;

  return card(
    h(
      'div',
      { class: 'course-card-head' },
      h(
        'div',
        null,
        h('div', { class: 'row-actions wrap' }, h('h3', { class: 'card-title' }, `${course.code}: ${course.title}`)),
        h(
          'div',
          { class: 'row-actions wrap', style: { marginTop: '6px' } },
          chip(`${course.credits} ${course.credits === 1 ? 'Credit' : 'Credits'}`, { mode: 'normal' }),
          course.outlinePending
            ? chip(course.code === 'CSM 281' ? 'Roadmap Track (Outline Pending)' : 'Outline Pending', { mode: 'off' })
            : chip('Outline Available', { mode: 'break' }),
          typeof knownCount === 'number'
            ? chip(`${knownCount} ${unitLabel}`, { mode: 'normal' })
            : chip(String(knownCount), { mode: 'off' }),
          course.durationWeeks ? chip(`${course.durationWeeks} weeks duration`, { mode: 'off' }) : null,
        ),
      ),
    ),

    course.notes ? h('p', { class: 'small muted', style: { margin: '8px 0 4px 0' } }, course.notes) : null,

    // Topic Progress bar if topics exist
    topics.length
      ? h(
          'div',
          { class: 'stack small', style: { marginTop: '8px' } },
          progressBar((confident + revised * 0.7 + studying * 0.3) / topics.length, 'Course topic progress'),
          h('span', { class: 'small muted' }, `${confident} confident · ${revised} revised · ${studying} studying · ${topics.length - confident - revised - studying} untouched`),
        )
      : null,

    // External resources / Links
    course.resources && course.resources.length
      ? h(
          'div',
          { class: 'row-actions wrap', style: { marginTop: '8px' } },
          course.resources.map((r) =>
            h(
              'a',
              { href: r.url, target: '_blank', rel: 'noopener', class: 'button button-sm button-ghost' },
              icon('book', { size: 14 }),
              h('span', null, `${r.title} ↗`),
            ),
          ),
        )
      : null,

    // If CSM 281, provide link to Java Track
    course.code === 'CSM 281'
      ? h(
          'div',
          { class: 'row-actions wrap', style: { marginTop: '8px' } },
          button('Open Java Track (58 Lessons) →', () => app.nav('plan/learn'), { kind: 'secondary', size: 'sm' }),
        )
      : null,

    // Action buttons
    h(
      'div',
      { class: 'row-actions wrap', style: { marginTop: '12px' } },
      button('View Outline & Details', () => openCourseDetails(app, course), { kind: 'secondary', size: 'sm' }),
      button('+ Schedule Study', () => openStudySessionEditor(app, { courseCode: course.code }), { kind: 'ghost', size: 'sm' }),
      button('+ Record Mark', () => openAssessmentEditor(app, { courseCode: course.code }), { kind: 'ghost', size: 'sm' }),
    ),
  );
}

/** Render Upcoming Academic Card. */
function renderUpcomingAcademicCard(app, studyTasks, assessments) {
  if (!studyTasks.length && !assessments.length) return null;
  return card(
    cardHeader('Academic Study & Deadlines', h('span', { class: 'small muted' }, `${studyTasks.length} scheduled`)),
    h(
      'ul',
      { class: 'list' },
      studyTasks.map((t) =>
        h(
          'li',
          { class: 'list-row' },
          h(
            'div',
            { class: 'list-body' },
            h('strong', null, `${t.courseCode}: ${t.title}`),
            h('span', { class: 'small muted' }, `${fmtDay(toDay(t.date))} · ${t.min || 45} min`),
            t.desc ? h('p', { class: 'small', style: { margin: '2px 0 0 0' } }, t.desc) : null,
          ),
          iconButton('trash', () => {
            app.update((s) => {
              s.academic.studyTasks = (s.academic.studyTasks || []).filter((x) => x.id !== t.id);
            });
            toast('Academic study task removed.');
          }, 'Remove task'),
        ),
      ),
    ),
  );
}

/** Bottom sheet: View Course Details, full topic outline, assessments, notes. */
export function openCourseDetails(app, course) {
  const courses = app.state.courses || [];
  const academic = app.state.academic || {};
  const progress = (academic.progress && academic.progress[course.code]) || {};
  const topicStatus = progress.topicStatus || {};
  const assessments = (academic.assessments || []).filter((a) => a.courseCode === course.code);
  const topics = course.topics || [];

  openSheet({
    title: `${course.code}: ${course.title}`,
    content: (close) => {
      const setTopic = (topicId, status) => {
        app.update((s) => {
          const ac = (s.academic = s.academic || {});
          const pr = (ac.progress = ac.progress || {});
          const cp = (pr[course.code] = pr[course.code] || {});
          const ts = (cp.topicStatus = cp.topicStatus || {});
          ts[topicId] = status;
        });
        toast(`Updated status to ${status}.`);
        close();
        openCourseDetails(app, course);
      };

      return h(
        'div',
        { class: 'sheet-form stack' },
        h(
          'div',
          { class: 'row-actions wrap' },
          chip(`${course.credits} Credits`, { mode: 'normal' }),
          course.outlinePending ? chip('Outline Pending', { mode: 'off' }) : chip('Outline Available', { mode: 'break' }),
          topics.length ? chip(`${topics.length} ${course.topicUnit || 'topics'}`, { mode: 'normal' }) : null,
          course.durationWeeks ? chip(`${course.durationWeeks} weeks total duration`, { mode: 'off' }) : null,
        ),

        course.notes ? h('div', { class: 'card', style: { padding: '10px 14px' } }, h('p', { class: 'small muted', style: { margin: 0 } }, course.notes)) : null,

        // External learning resources
        course.resources && course.resources.length
          ? h(
              'div',
              { class: 'stack small' },
              h('strong', null, 'Learning Resources:'),
              course.resources.map((r) =>
                h(
                  'a',
                  { href: r.url, target: '_blank', rel: 'noopener', class: 'button button-sm button-ghost' },
                  icon('book', { size: 14 }),
                  h('span', null, `${r.title} ↗`),
                ),
              ),
            )
          : null,

        // Topics / Units Outline
        topics.length
          ? h(
              'div',
              { class: 'stack' },
              h('h3', { class: 'eyebrow' }, `Official Syllabus (${course.topicUnit || 'Topics'}):`),
              topics.map((t, idx) => {
                const st = topicStatus[t.id] || 'not_started';
                return h(
                  'div',
                  { class: 'card', style: { padding: '10px 14px', marginBottom: '8px' } },
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' } },
                    h('div', null,
                      h('strong', null, `${idx + 1}. ${t.title}`),
                      t.duration ? h('span', { class: 'small muted' }, ` (${t.duration})`) : null,
                      t.desc ? h('p', { class: 'small muted', style: { margin: '4px 0 0 0' } }, t.desc) : null,
                    ),
                    select(
                      TOPIC_STATUSES.map((s) => ({ value: s.id, label: s.label })),
                      st,
                      (e) => setTopic(t.id, e.target.value),
                      { size: 'sm' },
                    ),
                  ),
                );
              }),
            )
          : h(
              'div',
              { class: 'card', style: { padding: '14px' } },
              h('p', { class: 'muted small', style: { margin: 0 } }, course.code === 'CSM 281' ? 'Java is covered by your existing learning roadmap (58 lessons). Open the Java track in Plan → Learn to study.' : 'Official course outline is pending. Topics will be listed here once the syllabus is confirmed.'),
            ),

        // Assessments Section
        h(
          'div',
          { class: 'stack' },
          h('h3', { class: 'eyebrow' }, 'Assessments & Marks:'),
          assessments.length
            ? h(
                'ul',
                { class: 'list' },
                assessments.map((a) =>
                  h(
                    'li',
                    { class: 'list-row' },
                    h('div', null, h('strong', null, a.title), h('span', { class: 'small muted' }, ` · ${a.mark}/${a.maxMark} (${((Number(a.mark) / Number(a.maxMark)) * 100).toFixed(1)}%)${a.weight ? ` · weight ${a.weight}%` : ''}`)),
                    iconButton('trash', () => {
                      app.update((s) => {
                        s.academic.assessments = (s.academic.assessments || []).filter((x) => x.id !== a.id);
                      });
                      toast('Assessment removed.');
                      close();
                      openCourseDetails(app, course);
                    }, 'Delete'),
                  ),
                ),
              )
            : h('p', { class: 'small muted' }, 'No assessment marks recorded yet.'),
          button('+ Add Assessment Mark', () => {
            close();
            openAssessmentEditor(app, { courseCode: course.code });
          }, { kind: 'secondary', size: 'sm' }),
        ),

        h(
          'div',
          { class: 'row-actions', style: { marginTop: '14px' } },
          button('Schedule Study Session', () => {
            close();
            openStudySessionEditor(app, { courseCode: course.code });
          }, { kind: 'primary' }),
          button('Done', close, { kind: 'ghost' }),
        ),
      );
    },
  });
}

/** Bottom sheet: Schedule academic study session. */
export function openStudySessionEditor(app, { courseCode = '', defaultDate = '' } = {}) {
  const courses = app.state.courses || [];
  const today = toISO(app.today);
  const dateVal = defaultDate || (today >= '2026-10-13' && today <= '2027-02-13' ? today : '2026-10-19');

  openSheet({
    title: 'Schedule Academic Study Session',
    content: (close) => {
      let selectedCourse = courseCode || (courses[0] ? courses[0].code : 'CSM 273');
      let actType = ACTIVITY_TYPES[0];
      let title = '';
      let date = dateVal;
      let min = 45;
      let desc = '';

      const submit = () => {
        if (!title.trim()) title = `${actType}: ${selectedCourse}`;
        const task = {
          id: uid('acad'),
          courseCode: selectedCourse,
          type: 'academic',
          activityType: actType,
          title: title.trim(),
          date,
          min: Number(min) || 45,
          desc: desc.trim(),
        };

        app.update((s) => {
          const ac = (s.academic = s.academic || {});
          const st = (ac.studyTasks = ac.studyTasks || []);
          st.push(task);
        });

        toast(`Academic task scheduled for ${fmtDay(toDay(date))}. No 3-task limit applied.`);
        close();
        app.rerender();
      };

      return h(
        'form',
        {
          class: 'sheet-form stack',
          onsubmit: (e) => {
            e.preventDefault();
            submit();
          },
        },
        field(
          'University Course',
          select(
            courses.map((c) => ({ value: c.code, label: `${c.code} · ${c.title} (${c.credits} cr)` })),
            selectedCourse,
            (e) => {
              selectedCourse = e.target.value;
            },
          ),
        ),
        field(
          'Activity Category',
          select(
            ACTIVITY_TYPES.map((t) => ({ value: t, label: t })),
            actType,
            (e) => {
              actType = e.target.value;
            },
          ),
        ),
        field(
          'Task Title',
          input({
            type: 'text',
            placeholder: `e.g. ${selectedCourse} lecture notes revision or past questions`,
            oninput: (e) => {
              title = e.target.value;
            },
          }),
        ),
        field(
          'Date (Semester 1: 13 Oct 2026 – 13 Feb 2027)',
          input({
            type: 'date',
            value: date,
            min: '2026-10-13',
            max: '2027-02-13',
            oninput: (e) => {
              date = e.target.value;
            },
          }),
        ),
        field(
          'Duration (minutes)',
          input({
            type: 'number',
            value: min,
            min: '10',
            max: '240',
            step: '5',
            oninput: (e) => {
              min = e.target.value;
            },
          }),
        ),
        field(
          'Notes / Learning Goals (optional)',
          textarea({
            placeholder: 'Key concepts to practice, lecture notes to review, or problems to solve...',
            rows: 2,
            oninput: (e) => {
              desc = e.target.value;
            },
          }),
        ),
        h(
          'div',
          { class: 'row-actions', style: { marginTop: '12px' } },
          button('Schedule Academic Activity', submit, { kind: 'primary' }),
          button('Cancel', close, { kind: 'ghost' }),
        ),
      );
    },
  });
}

/** Bottom sheet: Record assessment mark. */
export function openAssessmentEditor(app, { courseCode = '' } = {}) {
  const courses = app.state.courses || [];
  openSheet({
    title: 'Record Assessment Mark',
    content: (close) => {
      let selectedCourse = courseCode || (courses[0] ? courses[0].code : 'CSM 273');
      let title = '';
      let mark = '';
      let maxMark = 100;
      let weight = '';
      let date = toISO(app.today);

      const submit = () => {
        if (!title.trim()) title = 'Assessment';
        if (!Number.isFinite(Number(mark)) || Number(mark) < 0) {
          toast('Please enter a valid mark.');
          return;
        }

        const asm = {
          id: uid('asm'),
          courseCode: selectedCourse,
          title: title.trim(),
          mark: Number(mark),
          maxMark: Number(maxMark) || 100,
          weight: weight ? Number(weight) : null,
          date,
        };

        app.update((s) => {
          const ac = (s.academic = s.academic || {});
          const as = (ac.assessments = ac.assessments || []);
          as.push(asm);
        });

        toast('Assessment mark recorded. Credit-weighted average updated.');
        close();
        app.rerender();
      };

      return h(
        'form',
        {
          class: 'sheet-form stack',
          onsubmit: (e) => {
            e.preventDefault();
            submit();
          },
        },
        field(
          'University Course',
          select(
            courses.map((c) => ({ value: c.code, label: `${c.code} · ${c.title}` })),
            selectedCourse,
            (e) => {
              selectedCourse = e.target.value;
            },
          ),
        ),
        field(
          'Assessment Title',
          input({
            type: 'text',
            placeholder: 'e.g. Mid-semester Exam, Assignment 1, Lab 1, Quiz 1',
            oninput: (e) => {
              title = e.target.value;
            },
          }),
        ),
        field(
          'Score / Mark Earned',
          input({
            type: 'number',
            placeholder: 'e.g. 85',
            step: '0.1',
            oninput: (e) => {
              mark = e.target.value;
            },
          }),
        ),
        field(
          'Out of (Max Mark)',
          input({
            type: 'number',
            value: maxMark,
            oninput: (e) => {
              maxMark = e.target.value;
            },
          }),
        ),
        field(
          'Weighting % (optional, if known)',
          input({
            type: 'number',
            placeholder: 'e.g. 30 (leave blank if unconfirmed)',
            step: '1',
            oninput: (e) => {
              weight = e.target.value;
            },
          }),
        ),
        h(
          'div',
          { class: 'row-actions', style: { marginTop: '12px' } },
          button('Save Assessment', submit, { kind: 'primary' }),
          button('Cancel', close, { kind: 'ghost' }),
        ),
      );
    },
  });
}

/** Academic summary widget for the Today screen. */
export function academicTodayWidget(app) {
  const courses = app.state.courses || [];
  const academic = app.state.academic || {};
  const assessments = academic.assessments || [];
  const totalCredits = courses.reduce((s, c) => s + (Number(c.credits) || 0), 0);
  const avg = calculateSemesterAverage(courses, assessments);
  const targetAvg = Number(academic.targetAverage) || 85;

  return card(
    cardHeader(
      'KNUST Academics',
      button('View All Courses →', () => app.nav('track/courses'), { kind: 'ghost', size: 'sm' }),
      `${courses.length} Courses · ${totalCredits} Credits · Target: ${targetAvg}% Average`,
    ),
    h(
      'div',
      { class: 'row-actions wrap', style: { marginTop: '4px' } },
      avg !== null
        ? chip(`Current Avg: ${avg.toFixed(1)}%`, { mode: avg >= targetAvg ? 'good' : 'warning' })
        : chip(`Target: ${targetAvg}% (No marks yet)`, { mode: 'normal' }),
      chip('8 Courses · 17 Credits', { mode: 'off' }),
      button('+ Schedule Study', () => openStudySessionEditor(app), { kind: 'ghost', size: 'sm' }),
    ),
  );
}
