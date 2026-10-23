# Master Software Engineering & Academic Preparation Roadmap (October 2026 – June 2027)

> **Document Status**: Complete Comprehensive Master Plan  
> **Student Profile**: 1st-Year Computer Science Student, Kwame Nkrumah University of Science and Technology (KNUST), Kumasi, Ghana  
> **Graduation Class**: Expected May 2029 (Undergraduate)  
> **Target Academic Standing**: First Class Honours / 85+ Semester CWA  
> **Primary Career Goal**: Be fully prepared for the software engineering internship applications that open from July 2027 (Focus: Backend & Systems Engineering). This season's open roles are not the target.  
> **DSA Target**: Comfortable with Mediums by April 30, 2027: 7 of your last 10 unseen Mediums solved alone in 25 minutes or less (tracked in the app under Track → Problems).  
> **Active Planning Horizon**: October 5, 2026 – July 31, 2027 (10 Months / 43 Weeks)  
> **Workspace Location**: `c:\Users\HP\Roadmap`  
> **Core Applications**: [Phone Web App / PWA](file:///c:/Users/HP/Roadmap/README.md) & [2027 Recruiting Tracker](file:///c:/Users/HP/Roadmap/2027_software_engineering_recruiting_tracker.xlsx)

---

## 1. Executive Summary & Architecture of the Plan

This roadmap unifies two vital, non-negotiable pursuits into a single self-adapting operational plan:
1. **Academic Excellence at KNUST**: Carrying 17 credits across 8 first-semester courses with a minimum semester CWA target of 85.
2. **Top-Tier Software Engineering Recruiting**: Systematically preparing for competitive 2027 SWE internships across North America, the UK, Europe, and APAC in backend engineering, distributed systems, and infrastructure.

The roadmap is engineered to eliminate context switching, burnout, and unrealistic expectations. It automatically adapts to university lecture schedules, mid-semester tests, and final exam periods.

```
                                  MASTER TIMELINE ARCHITECTURE
   OCT 2026          DEC 2026          FEB 2027          APR 2027          JUN 2027
+-------------+   +-------------+   +-------------+   +-------------+   +-------------+
|   PHASE 1   |   |   PHASE 2   |   |   PHASE 3   |   |   PHASE 4   |   | TRANSITION  |
| Foundation  |-->| Engineering |-->|  Interview  |-->| Recruitment |-->| Internship  |
| Diagnostics |   |    Depth    |   |  Readiness  |   |  Execution  |   |   Launch    |
+-------------+   +-------------+   +-------------+   +-------------+   +-------------+
 [Break & Sem1]   [Midsem & Xmas]   [Exams & Break]   [Sem 2 Midsem]    [Sem 2 Exams]
```

---

## 2. Operating Rhythm & Daily Planning System

The system operates on an automated scheduling engine that generates your daily to-do list every morning based on the academic calendar, current date, timetable, and learning progress.

### 2.1 Daily Capacity Modes & Workload Matrix

Every calendar day is assigned a specific operational mode that dictates the maximum preparation load:

| Mode | Calendar Context | Weekly Workload | Daily LeetCode (New) | Daily Revisits (Max) | Daily Learn Min | Daily Lecture Rev | Daily Module Task | Rotated Courses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Break** | Vacations & pre-semester free days | 8–12 hours/wk | 4 problems | 3 problems | 150 min | 0 min | 60 min | 1 course (45 min) |
| **Normal** | Regular university teaching weeks | 3–5 hours/wk | 2 problems | 2 problems | 60 min | 25 min/class | 30 min | 2 courses (40 min)* |
| **Heavy** | Pre-exam week (7 days prior) | 1–2 hours/wk | 1 problem | 1 problem | 20 min | 0 min | 0 min | 2 courses (60 min) |
| **Exam** | Mid-semesters & final exam periods | 0–1 hours/wk | 0 problems | 1 problem | 0 min | 0 min | 0 min | 3 courses (90 min) |
| **Off** | Rest weeks / exceptional periods | 0 hours | 0 problems | 0 problems | 0 min | 0 min | 0 min | 0 courses |

**Note: Rotated courses on normal days only apply to days without scheduled lectures or over the weekend.*

### 2.2 Category-Specific Scheduling Rules & Task Limit Policy

> [!IMPORTANT]
> **Strict Category Limit Distinction**:
> 1. **Personal Activities Category**: Strictly capped at a maximum of **three (3) activities per day** to preserve mental bandwidth and prevent burnout.
> 2. **Academic Studies Category**: **NO LIMIT**. University studies must never be blocked by a global cap. A single day can contain 4 or more academic activities, including multiple university course study sessions, topic revisions, lab prep, problem solving practice, assignment drafting, quiz/exam revision, and lecture note reviews.
> 3. **Career Roadmap & DSA**: Progresses independently according to the daily capacity mode.

### 2.3 Spaced Repetition Review Engine

DSA mastery is built on structured revisit intervals rather than raw volume. When a problem is marked as solved, the engine books revisits using a spaced-repetition ladder:

```
       SPACED REPETITION MASTERY LADDER
   [Problem Solved]
          │
          ▼
   [3-Day Blank Redo]  --> Re-implement from scratch with zero hints or notes
          │
          ▼
   [Timed Redo]        --> Easy: 15 min | Medium: 25 min | Hard: 40 min
          │
          ▼
   [Explain Aloud]     --> Articulate time/space complexity & trade-offs verbally
          │
          ▼
   [Mastered]          --> Re-appears after 21 days, then 45, then every 90 days for retention
```

#### Adaptive Scheduling on Review Feedback:
- **Could not solve**: Re-scheduled for **tomorrow** (1 day).
- **Solved with hints or low confidence (score $\le 2$)**: Re-scheduled in **2 days**.
- **Medium confidence (score 3)**: Re-scheduled in **5 days**.
- **High confidence (score 4)**: Re-scheduled in **10 days**.
- **Complete mastery (score 5)**: Re-scheduled in **14 days**.
- **Daily execution order**: Overdue reviews come first, followed by due reviews, followed by new pattern problems. One slot is always kept for the day's lesson and one for a new problem, so reviews never push learning or new DSA off the list entirely.
- **Fresh start**: If you fall behind, Settings → Start fresh from today restarts unfinished learning tracks today and spreads overdue reviews from today (2 a day), keeping everything already done.
- **Why mastered gaps grow**: With a fixed 21-day gap, 60+ mastered problems would fill most daily slots on their own and stall new problems at about 60 by April. Growing gaps (21 → 45 → 90) keep the ladder moving.

### 2.4 Weekly Scorecard System

Every Sunday evening, complete the 7-factor scorecard in the application tracking view. Each area is scored from **0 to 4**, yielding a maximum score of **28**:

| Dimension | Evaluation Criteria | Scoring Guidelines (0 to 4) |
| :--- | :--- | :--- |
| **1. Independent DSA** | Unseen problems solved independently without hints; clear complexity analysis. | 0: None | 1: Heavy hints | 2: Solved with minor hints | 3: Clean independent solve | 4: Multi-solution analysis |
| **2. Timed Coding** | Performance under realistic constraints (15m Easy, 25m Medium). | 0: Unattempted | 1: Exceeded time significantly | 2: Solved near time limit | 3: Solid timed solve | 4: Fast with tests |
| **3. Core CS Understanding** | Articulating concepts in OS, Networking, Databases, and Concurrency without notes. | 0: No recall | 1: Vague notions | 2: Basic textbook recall | 3: Deep conceptual clarity | 4: System design trade-offs |
| **4. Project Engineering Quality** | Test coverage, edge-case handling, bug fixes, reproducible benchmarks. | 0: No progress | 1: Superficial code | 2: Feature built without tests | 3: Thorough tests added | 4: Stress/concurrency verified |
| **5. Interview Practice** | Live or recorded technical walkthroughs, STAR behavioural questions, mock sessions. | 0: None | 1: Rehearsed alone | 2: Recorded self-review | 3: Peer mock completed | 4: Senior/Mentor mock with feedback |
| **6. Recruitment Actions** | Eligible applications submitted, recruiter networking, referral conversations. | 0: No actions | 1: Research only | 2: 1-2 applications | 3: Target volume reached + tracking | 4: Referral secured & applied |
| **7. Academic Progress** | Lecture attendance, coursework completion, lab exercises, exam preparation. | 0: Severe backlog | 1: Behind on readings | 2: Keeping up with lectures | 3: Fully up-to-date | 4: Ahead of syllabus / revision done |

---

## 3. KNUST Academic Calendar (2026/2027 Academic Year)

The official academic calendar for Kwame Nkrumah University of Science and Technology directly governs all mode transitions in the roadmap:

| Calendar Period / Event | Start Date | End Date | Calendar Kind | Operational Mode | Impact on Daily Plan |
| :--- | :--- | :--- | :--- | :--- | :--- |

| **Free time before the semester** | `2026-10-05` | `2026-10-18` | Break / vacation | Break | Full capacity (8–12 h/wk). Peak sprint window. |
| **First Semester** | `2026-10-13` | `2027-02-13` | Semester | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Online course registration (continuing students)** | `2026-10-12` | `2026-10-29` | Admin window | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Arrival of continuing students** | `2026-10-17` | `2026-10-17` | Milestone | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Biometric registration** | `2026-10-19` | `2026-11-12` | Admin window | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Teaching period: 1st semester** | `2026-10-19` | `2027-01-22` | Teaching period | Normal week | Teaching period. Normal mode (3–5 h/wk). Lecture revision active. |
| **Mid-semester examinations** | `2026-12-14` | `2026-12-18` | Mid-semester exams | Exams | Exams mode (0–1 h/wk). 3 courses rotated daily. No new DSA. |
| **Christmas break** | `2026-12-19` | `2027-01-03` | Break / vacation | Break | Full capacity (8–12 h/wk). Peak sprint window. |
| **Assessment of lecturers by students** | `2026-12-16` | `2027-01-23` | Admin window | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Resumption of lectures** | `2027-01-04` | `2027-01-04` | Milestone | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **First semester examinations** | `2027-01-25` | `2027-02-12` | Examinations | Exams | Exams mode (0–1 h/wk). 3 courses rotated daily. No new DSA. |
| **Students depart** | `2027-02-13` | `2027-02-13` | Milestone | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Inter-semester break** | `2027-02-14` | `2027-03-14` | Break / vacation | Break | Full capacity (8–12 h/wk). Peak sprint window. |
| **Second Semester** | `2027-03-13` | `2027-06-26` | Semester | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Online course registration** | `2027-03-01` | `2027-04-02` | Admin window | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Arrival of students** | `2027-03-13` | `2027-03-13` | Milestone | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Biometric registration** | `2027-03-15` | `2027-04-02` | Admin window | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Teaching period: 2nd semester** | `2027-03-15` | `2027-06-04` | Teaching period | Normal week | Teaching period. Normal mode (3–5 h/wk). Lecture revision active. |
| **Mid-semester examinations** | `2027-04-26` | `2027-04-30` | Mid-semester exams | Exams | Exams mode (0–1 h/wk). 3 courses rotated daily. No new DSA. |
| **Assessment of lecturers by students** | `2027-05-31` | `2027-06-05` | Admin window | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Second semester examinations** | `2027-06-07` | `2027-06-25` | Examinations | Exams | Exams mode (0–1 h/wk). 3 courses rotated daily. No new DSA. |
| **Students depart** | `2027-06-26` | `2027-06-26` | Milestone | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |
| **Long vacation** | `2027-06-27` | `2027-09-20` | Break / vacation | Break | Full capacity (8–12 h/wk). Peak sprint window. |
| **2027/2028 academic year starts** | `2027-09-21` | `2027-09-21` | Milestone | Normal (default) | Administrative or milestone event. Maintains prevailing mode. |


---

## 4. KNUST Semester 1 Timetable & Course Syllabi

### 4.1 Semester 1 Group 1 Lecture Timetable
*Teaching Period: October 19, 2026 – January 22, 2027*

| Day of Week | Time Slot | Course Code | Course Title | Lecturer | Venue |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Monday** | 08:00 – 09:55 | `CSM 273` | Linear and Numerical Algebra | G. O. Fosu | SCB-SF20 |
| **Monday** | 10:30 – 12:25 | `CSM 251` | Introductory Electronics I | F. K. Ampong | SCB-SF1 |
| **Monday** | 13:00 – 14:55 | `ENGL 263` | Literature in English I | T. Oduro-Kwarteng | SCB-SF19 |
| **Tuesday** | 13:00 – 14:55 | `CSM 291` | System Analysis and Design I | Y. M. Missah | SCB-GF1 |
| **Wednesday**| 10:30 – 12:25 | `CS-SEMINAR`| Departmental Seminar (Combined) | All Lecturers | SCB-FF5 |
| **Wednesday**| 15:00 – 16:55 | `CSM 265` | Ethical and Legal Implication of Computing | E. Osei | SCB-SF8 |
| **Thursday** | 08:00 – 09:55 | `CSM 255` | Open Source Operating Systems | K. Takyi | SCB-SF19 |
| **Thursday** | 15:00 – 16:55 | `CSM 281` | Object Oriented Programming with Java | F. Twum | SCB-FF1 |
| **Thursday** | 17:00 – 18:55 | `CSM 297` | Database Concepts and Technologies I | K. O. Peasah | SCB-FF1 |
| **Friday**   | 18:00 – 18:55 | `CSM 273` | Linear and Numerical Algebra (Combined) | G. O. Fosu | Online / SCB |

### 4.2 Comprehensive 8-Course Academic Syllabus (17 Credits Total)


#### CSM 251: Introductory Electronics I
- **Credits**: 2
- **Outline Status**: **Official Syllabus Confirmed**
- **Curriculum Unit**: topics (7 total)
- **Official Notes**: 7 topics covered in the official syllabus.


**Course Syllabus / Breakdown**:
1. **Basic Semiconductor Physics**
2. **The PN Junction**
3. **Analysis of Diode Circuits**
4. **Applications of Diode Circuits**
5. **Bipolar Junction Transistor (BJT): Analysis and Applications**
6. **MOSFETs**
7. **Operational Amplifiers**

#### CSM 255: Open Source Operating Systems
- **Credits**: 2
- **Outline Status**: **Official Syllabus Confirmed**
- **Curriculum Unit**: units (6 total)
- **Official Notes**: Preserved lecturer's official 6 unit titles.


**Course Syllabus / Breakdown**:
1. **Introduction to Operating Systems and Linux**
2. **Files, Users and Groups**
3. **Networking and Printing in Linux**
4. **Advanced Concepts in Linux**
5. **Introduction to Outsourcing**
6. **Advanced Concepts in Outsourcing**

#### CSM 265: Ethical and Legal Implications of Computing
- **Credits**: 2
- **Outline Status**: **Official Syllabus Confirmed**
- **Curriculum Unit**: strands (4 total)
- **Official Notes**: 4 strands with a total stated duration of 11 weeks (weeks are duration, not additional topics).


**Course Syllabus / Breakdown**:
1. **Ethical Knowledge Area** (*Duration: 3 weeks*)
2. **Legal Knowledge Area** (*Duration: 3 weeks*)
3. **Computing Knowledge Area** (*Duration: 3 weeks*)
4. **Ethics Research Practice** (*Duration: 2 weeks*)

#### CSM 273: Linear and Numerical Algebra
- **Credits**: 3
- **Outline Status**: **Official Syllabus Confirmed**
- **Curriculum Unit**: topics (10 total)
- **Official Notes**: 10 comprehensive topics covering vectors, matrices, algorithms and numerical methods.


**Course Syllabus / Breakdown**:
1. **Vectors in Two and Three Dimensional Spaces**
  > Vector addition, scalar multiplication, component form, magnitude, parallel vectors, orthogonality, unit vectors, dot product and vector projection.
2. **Matrices**
  > Definitions, operations, algebraic properties, linear transformations, matrix powers, nonsingular matrices, tridiagonal matrices, quadratic forms, symmetric matrices, orthogonal matrices and complex matrices.
3. **Systems of Linear Equations**
  > Square linear systems, Gaussian elimination, Gauss-Jordan method, inverse approach and homogeneous systems.
4. **Vector Spaces**
  > Subspaces of Rⁿ, linear independence, basis and matrix rank.
5. **Determinants**
  > Determinants of 2 × 2 and 3 × 3 matrices and their properties.
6. **Eigenvalues and Eigenvectors**
  > Definitions, selected properties, diagonalization and orthogonal matrices.
7. **Vector and Matrix Norms**
  > Vector norms, matrix norms, submultiplicative matrix norms, computing the matrix 2-norm and its properties.
8. **Conditioning of Problems and Stability of Algorithms**
  > Computation errors, algorithm stability, conditioning and perturbation analysis for solving linear systems.
9. **Decomposition Methods**
  > LU decomposition using Gaussian elimination, Doolittle, Crout, Cholesky, tridiagonal systems, Gaussian elimination with partial pivoting and QR decomposition.
10. **Iterative Methods for Solving Systems of Equations**
  > Jacobi method and Gauss-Seidel iterative method.

#### CSM 281: Object-Oriented Programming with Java
- **Credits**: 3
- **Outline Status**: **Official Weekly Scheme Confirmed** (key text: *Java How To Program*; venue: Aboagye Menyeh Complex, SF 7)
- **Curriculum Unit**: topics (8 total; week 7 is the mid-semester exam)

**Course Syllabus / Breakdown** (with the Java track lessons that cover each topic):
1. **Overview of Java as an object-oriented language** (Week 1 · Ch 1): Mosh chapters 1–7. *Due before mid-sems.*
2. **Identifiers, variables, constants, data types and operators** (Weeks 2–3 · Ch 1–2): Mosh chapters 8–22, 26, 28–29. *Due before mid-sems.*
3. **Control structures** (Weeks 4–5 · Ch 2–3): Mosh chapters 27, 30–39, 42. *Due before mid-sems.*
4. **Arrays** (Week 6 · Ch 4): Mosh chapters 15–16. *Due before mid-sems.*
5. **Methods** (Week 8 · Ch 5): study lesson j7. *Due before first-semester exams.*
6. **Handling exceptions** (Week 9 · Ch 6): study lesson j13. *Due before first-semester exams.*
7. **Files** (Week 10 · Ch 7): study lesson j13f, added for this outline. *Due before first-semester exams.*
8. **Object-oriented concepts** (Weeks 11–12 · Ch 8): study lessons j8–j11. *Due before first-semester exams.*

- **Supplementary Learning Resources**:
  - [Programming with Mosh: Java Tutorial for Beginners](https://www.youtube.com/watch?v=eIrMbAQSU34)

**Integrated Learning Track**: The 59-lesson Java track (42 Mosh chapters + 17 study lessons) keeps its own pace. The outline only sets deadlines: Track → Courses shows whether each topic's lessons are planned before its exam.

#### CSM 291: System Analysis and Design I
- **Credits**: 2
- **Outline Status**: **Outline Pending Confirmation**
- **Curriculum Unit**: topics (Pending syllabus confirmation)
- **Official Notes**: Official course outline pending. Supplementary YouTube playlist available above.

- **Supplementary Learning Resources**:
  - [System Analysis and Design Playlist](https://youtube.com/playlist?list=PL5q3E8eRUieWtYLmRU3z94-vGRcwKr9tM&si=SLNLiiCV2xRPecQu)

*Official topic list is pending and will be populated upon release of the official syllabus outline.*

#### CSM 297: Database Concepts and Technologies I
- **Credits**: 2
- **Outline Status**: **Official Syllabus Confirmed**
- **Curriculum Unit**: topics (7 total)
- **Official Notes**: Notes place the mid-semester examination after Topic 3 (ER Model) in course sequence (not a confirmed date).


**Course Syllabus / Breakdown**:
1. **Database Terminologies and Definitions**
2. **Database System Concepts and Architecture**
3. **Data Modelling Using the Entity-Relationship (ER) Model**
4. **Relational Model: Concepts**
5. **Relational Algebra and Relational Calculus**
6. **SQL-99: Schema Definition, Constraints, Queries and Views**
7. **Functional Dependencies and Normalisation for Relational Databases**

#### ENGL 263: Literature in English I
- **Credits**: 1
- **Outline Status**: **Outline Pending Confirmation**
- **Curriculum Unit**: topics (Pending syllabus confirmation)
- **Official Notes**: Official course outline pending. No topics or study content invented.


*Official topic list is pending and will be populated upon release of the official syllabus outline.*

### 4.3 University Coursework Revision Strategy
- **Lecture-Day Revision (25 min/lecture)**: Every lecture day includes a mandatory 25-minute revision slot per lecture to rewrite class examples, review code/proofs, and summarise new concepts immediately.
- **Thursday Java Lecture Boost**: On Thursdays, when `CSM 281` meets, daily Java learning minutes are doubled from 60 to 120 min to reinforce lecture material in code.
- **Weekend Coursework Rotation**: Non-lecture days rotate through all courses to ensure equal academic coverage and prevent last-minute cramming.
- **Pre-Exam & Exam Rotation**: During heavy pre-exam weeks (7 days before exams) and exam periods, the system switches to 3 rotated courses per day (90 min each) with zero new LeetCode or side-project features.

---

## 5. Month-by-Month Master Plan (October 2026 – June 2027)


### Month 1: October 2026 — Baseline, Java Kickoff & Diagnostics
- **Academic Context**: Oct 5–18 is Break (8–12 h/wk capacity); Oct 19 begins Semester 1 Teaching (CSM 281 Java, CSM 255 OS, CSM 297 DB).
- **Strategic Phase**: *Phase 1 — Foundation & Diagnostics*

| Area | Focus & Concrete Deliverables |
| :--- | :--- |
| **Kickoff Tasks** | • Complete the 7-day kickoff: audit resume, establish application tracker, define project claims.<br>• Add Ecobank Personalisation Team internship with real responsibilities and defensible tech stack. |
| **DSA & Algorithms** | • **W1 (Baseline)**: Solve 2 unseen problems without hints. Record time, complexity, and mistakes.<br>• **W2**: Python debugging, edge-case testing.<br>• **W3 (Arrays & Hashing)**: Frequency maps, hash sets, prefix sums, Kadane’s algorithm.<br>• **W5 (Two Pointers)**: Sorted arrays, pair sums, in-place manipulation. |
| **Learn Track** | • **Java in 3 Weeks (Mosh Chapters 1–25)**: Setup, primitives, reference types, control flow, clean coding, and build the Mortgage Calculator project. |
| **Project Engineering** | • **W4 (LedgerCore Audit)**: Trace a transfer end-to-end. Document invariants, validation, and error states. Draw a one-page architecture diagram. |
| **Recruitment** | • Check live early-insight and summer openings (Google, NVIDIA Ignite, banking technology).<br>• Verify eligibility: May 2029 graduation, Ghana/KNUST location, visa rules. |
| **Month-End Milestone** | *Baseline diagnostic recorded, Java fundamentals solid, LedgerCore architecture diagram finished.* |

---

### Month 2: November 2026 — Core Data Structures & SQL Foundations
- **Academic Context**: Normal Teaching weeks (3–5 h/wk capacity). Heavy coursework load.
- **Strategic Phase**: *Phase 1 — Foundation & Diagnostics*

| Area | Focus & Concrete Deliverables |
| :--- | :--- |
| **DSA & Algorithms** | • **W6 (Sliding Window)**: Fixed vs variable windows, substring problems. Practice explaining invariants aloud.<br>• **W7 (Stacks & Queues)**: Monotonic stack patterns, parenthesis matching, min-stacks.<br>• **W8 (SQL Foundations)**: Complex joins, grouping, window functions, and NULL semantics. |
| **Learn Track** | • **Java OOP & Checkpoint**: Finish Mosh (Classes, interfaces, inheritance, exceptions, collections, generics).<br>• Setup **JUnit 5** and Gradle/Maven; write your first unit tests in Java. |
| **Project Engineering** | • **LedgerCore**: Add test cases for duplicate requests, rollback mechanisms, and constraint violations.<br>• Synchronize with CSM 297 (Databases): test PostgreSQL ACID properties and isolation levels hands-on. |
| **Recruitment** | • Continue submitting active applications. Track recruiter and alumni contacts for referrals.<br>• Keep your resume updated and tailored for backend vs general SWE roles. |
| **Month-End Milestone** | *Zero backlog on two-pointer/window reviews; SQL diagnostic completed; first Java test suite running.* |

---

### Month 3: December 2026 — Trees, Binary Search & Mid-Semesters
- **Academic Context**: Dec 14–18 is Mid-sem Exams (career prep pauses); Dec 19–Jan 3 is Christmas Break (8–12 h/wk).
- **Strategic Phase**: *Phase 2 — Engineering Depth*

| Area | Focus & Concrete Deliverables |
| :--- | :--- |
| **DSA & Algorithms** | • **W9 (Binary Search)**: Boundary conditions, monotonic predicates, rotated sorted arrays.<br>• **W10 (Linked Lists & Recursion)**: Pointer updates, cycle detection, call-stack tracing.<br>• **W13 (Trees)**: BFS/DFS traversals, BST properties, tree recursion, lowest common ancestor. |
| **CS & Systems** | • **W11 (Database Transactions)**: Study atomicity, dirty reads, non-repeatable reads, serialization anomalies, and row-level locks. |
| **Project Engineering** | • **W12 (Project Test Sprint)**: Build stress tests for LedgerCore: concurrent debit attempts, duplicate idempotency keys, and network timeouts. |
| **Mid-Sem Rule** | • *During Dec 14–18*: Pause all new LeetCode and side projects. Shift daily list to 100% course revision. |
| **Month-End Milestone** | *Mid-sems cleared; LedgerCore tests pass against concurrent transactions; tree traversals mastered.* |

---

### Month 4: January 2027 — Graphs, Aggregation API & Semester 1 Exams
- **Academic Context**: Teaching resumes Jan 4–22. Pre-exam heavy week starts Jan 18. Exams: Jan 25 – Feb 12.
- **Strategic Phase**: *Phase 2 — Engineering Depth*

| Area | Focus & Concrete Deliverables |
| :--- | :--- |
| **DSA & Algorithms** | • **W14 (Heaps & Intervals)**: Top-K elements, merge intervals, heap sort.<br>• **W15 (Graphs Foundations)**: Adjacency lists, BFS, DFS, cycle detection, connected components.<br>• *(Pauses Jan 25 for Exams)*. |
| **Project Engineering** | • **W16 (Aggregation API Reliability)**: Test failure injection with Kafka/message queues: worker crashes before ACK, consumer backlogs, and out-of-order event delivery. |
| **Exam Period Protocol** | • From Jan 25: App enters **Exam Mode**.<br>• **0 new DSA problems**, **0 new lessons**.<br>• Exactly 3 KNUST courses rotated daily for comprehensive exam revision. Maintain only critical DSA recall. |
| **Recruitment** | • Log any incoming Online Assessments (OAs). Schedule them outside exam weeks if allowed. |
| **Month-End Milestone** | *Aggregation API failure recovery documented; semester 1 exams actively managed without career burnout.* |

---

### Month 5: February 2027 — Inter-Semester Break Sprint & Networking
- **Academic Context**: Exams finish Feb 12. Inter-Semester Break: Feb 14 – Mar 14 (Peak preparation window: 8–12 h/wk).
- **Strategic Phase**: *Phase 3 — Interview Readiness*

| Area | Focus & Concrete Deliverables |
| :--- | :--- |
| **DSA & Algorithms** | • **W21 (Advanced Graphs)**: Topological sort (Kahn's algorithm), Dijkstra's shortest path.<br>• **W22 (Greedy & Backtracking)**: Decision trees, pruning, state-space exploration.<br>• Clear all overdue reviews accumulated during exams. |
| **CS & Systems** | • **W17 (Core Networking)**: HTTP/1.1 vs HTTP/2, TCP 3-way handshake, TLS lifecycle, DNS resolution.<br>• Trace one API request completely from browser socket to database commit. |
| **Interviews & Mocks** | • **W20 (First Full Mock Interview)**: 45-minute timed coding + project explanation. Write down 3 critical gaps. |
| **Recruitment** | • Target EMEA summer internships and APAC rolling roles.<br>• Reach out to KNUST alumni and former interns at target firms for technical feedback and referrals. |
| **Month-End Milestone** | *First mock completed; networking/TCP fundamentals explained aloud; all break modules completed.* |

---

### Month 6: March 2027 — OS, Concurrency & Behavioural Mastery
- **Academic Context**: Semester 2 starts Mar 15. New lecture timetable added to the app (Normal Teaching).
- **Strategic Phase**: *Phase 3 — Interview Readiness*

| Area | Focus & Concrete Deliverables |
| :--- | :--- |
| **DSA & Algorithms** | • Timed sets on Medium problems: aim for 20–25 minutes without hints.<br>• Focus on weak patterns identified in February mocks. |
| **CS & Systems** | • **W18 (Operating Systems)**: Processes vs threads, virtual memory, paging, context switches.<br>• **W19 (Concurrency)**: Race conditions, deadlocks, mutexes, semaphores, producer-consumer queues.<br>• **W23 (Java/OOP Diagnostic)**: Deep dive into Java memory model and collection internals. |
| **Behavioural Prep** | • **W24 (STAR Stories)**: Write 5 rock-solid stories: technical challenge, failure, disagreement, leadership, and tight deadline. Base them on Ecobank and LedgerCore. |
| **Month-End Milestone** | *STAR stories written and rehearsed; concurrency primitives understood; Semester 2 timetable synced.* |

---

### Month 7: April 2027 — Dynamic Programming & Project Defense
- **Academic Context**: Teaching period. Mid-sem exams: Apr 26–30.
- **Strategic Phase**: *Phase 4 — Recruitment Execution*

| Area | Focus & Concrete Deliverables |
| :--- | :--- |
| **DSA & Algorithms** | • **W25 (Dynamic Programming)**: 1D DP, memoization vs tabulation, knapsack, LCS.<br>• Re-solve previously failed problems from blank without notes. |
| **Interview Readiness** | • **W26 (Timed Assessments)**: Simulate realistic 60-90 min online assessments (HackerRank/Codesignal style).<br>• **W27 (Project Interview Defense)**: Defend LedgerCore and Aggregation API aloud without notes.<br>  *Be ready to answer: "What happens when a transaction aborts during high load?"* |
| **Recruitment** | • Review live applications and interviews scheduled for Q2. Reallocate daily hours to active interview prep if an invite arrives. |
| **Month-End Milestone** | *Defended flagship project architecture without notes; DP base cases and transitions internalized; every DSA topic covered and Medium readiness at 7/10 (unseen Mediums solved alone in ≤ 25 min).* |

---

### Month 8: May 2027 — Mock Cycles & Company-Specific Tailoring
- **Academic Context**: Teaching ends late May / early June. Pre-exam prep begins.
- **Strategic Phase**: *Phase 4 — Recruitment Execution*

| Area | Focus & Concrete Deliverables |
| :--- | :--- |
| **DSA & Algorithms** | • **W29 (Weakest Patterns)**: Filter problem bank by lowest confidence scores (scores 1–2).<br>• **W37 (Targeted Revision)**: Revisit problems that caused errors in previous mocks. |
| **System & DB** | • **W30 (Database & Performance)**: B-Trees vs LSM Trees, composite indexes, query optimization using `EXPLAIN ANALYZE`. |
| **Mock Interviews** | • **W28 & W31 (Mock Interview Cycle)**: Conduct 2 peer mocks (1 technical coding, 1 system design/architecture). |
| **Recruitment** | • Confirm internship start/end dates against university opening dates for 2027/2028 academic year to prevent clashes. |
| **Month-End Milestone** | *2 mock interviews completed; top 3 recurring DSA weaknesses eliminated; index internals mastered.* |

---

### Month 9: June 2027 — Semester 2 Finals, Retrospective & Launch
- **Academic Context**: Teaching concludes June 4. Exams: June 7 – 25. Long vacation begins June 27.
- **Strategic Phase**: *Phase 4 — Recruitment Execution*

| Area | Focus & Concrete Deliverables |
| :--- | :--- |
| **Academics** | • **W33/W34 (Exam Mode)**: Protect your CWA. Career work throttled down to maintain recall only. Focus on KNUST semester exams. |
| **Career Finalization** | • **W38 (Portfolio Polish)**: Verify all GitHub READMEs, tests, and documentation are clean, public, and reproducible. |
| **Month-End Milestone** | *Exams completed; portfolio battle-tested.* |

---

### Month 10: July 2027 — Application-Ready
- **Academic Context**: Long vacation (June 27 – September 20): full Break capacity. Target plan finish: July 31, 2027.
- **Strategic Phase**: *Phase 4 — Recruitment Execution*

| Area | Focus & Concrete Deliverables |
| :--- | :--- |
| **DSA & Interviews** | • Timed sets of unseen, company-tagged Mediums (see `dsa/company-extras.csv` and `dsa/top20-by-company.csv`).<br>• Online-assessment practice and one mock a week. Refresh the company lists using the last-3-months data. |
| **Applications** | • Set a reminder for each target company's opening date from its live posting. Apply in the first weeks, since many roles fill on a rolling basis.<br>• **W39 (Retrospective)**: Review scorecard progress and readiness against the April baseline. |
| **Month-End Milestone** | *Mediums timed, projects defended, resumes tailored, and applications going out as each cycle opens.* |

---

## 6. The Complete 35-Module Curriculum Matrix (W1 to W39)

The sequential modules define your core career preparation curriculum. Modules are assigned to weeks based on capacity and scheduled automatically.

| Module ID | Phase | Track | Module Title | Core Learning Objective | Required Exit Criteria | Topic Patterns / Matched Keywords |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |

| **W1** | Foundation and diagnostics | DSA | **Baseline** | Solve two unseen DSA problems; record time, hints and complexity. | Write your starting scorecard. | `` |
| **W2** | Foundation and diagnostics | DSA | **Python and debugging** | Implement a small function with edge cases and debug a deliberately faulty version. | Review strings, lists, dictionaries and testing. | `` |
| **W3** | Foundation and diagnostics | DSA | **Arrays and hashing** | Practise frequency maps, sets and prefix sums. | Re-solve one Week 1 problem without notes. | `array, hash, frequency, prefix, running state, kadane, string` |
| **W4** | Foundation and diagnostics | Project | **Project audit** | Trace one LedgerCore transfer end to end and identify unverified claims. | Write a one-page architecture diagram. | `` |
| **W5** | Foundation and diagnostics | DSA | **Two pointers** | Practise sorted arrays, pairs and in-place operations. | Redo one hashing problem. | `two pointer` |
| **W6** | Foundation and diagnostics | DSA | **Sliding windows** | Practise fixed and variable windows. | Explain the window invariant aloud. | `sliding window` |
| **W7** | Foundation and diagnostics | DSA | **Stacks and queues** | Implement stack/queue patterns and recognise monotonic-stack use cases. | Review complexity and boundary cases. | `stack, queue, monotonic` |
| **W8** | Foundation and diagnostics | Core CS | **SQL foundations** | Practise joins, grouping, subqueries and NULL behaviour. | Record SQL diagnostic results. | `database, sql` |
| **W9** | Engineering depth | DSA | **Binary search** | Practise boundary search and monotonic predicates. | Re-solve one sliding-window problem. | `binary search` |
| **W10** | Engineering depth | DSA | **Linked lists and recursion** | Practise pointer changes, recursion bases and call-stack tracing. | Review stack and queue problems. | `linked list, recursion` |
| **W11** | Engineering depth | Core CS | **Database transactions** | Study atomicity, isolation, locks and serialization failures. | Write down LedgerCore's consistency guarantees. | `database, sql` |
| **W12** | Engineering depth | Project | **Project test sprint** | Add tests for duplicate requests, rollback and concurrent debits. | Run the full suite and record failures honestly. | `` |
| **W13** | Engineering depth | DSA | **Trees** | Practise traversal, recursion and tree properties. | Re-solve two older problems. | `tree, trie, bst` |
| **W14** | Engineering depth | DSA | **Heaps and intervals** | Practise top-k, merging and interval overlaps. | Explain why the chosen data structure fits. | `heap, priority queue, interval, top k` |
| **W15** | Engineering depth | DSA | **Graphs** | Practise BFS, DFS and visited-state correctness. | Review trees and queues. | `graph, island, union find, matrix` |
| **W16** | Engineering depth | Project | **Aggregation API reliability** | Test duplicate messages, provider timeouts and worker restarts. | Document idempotency and recovery behaviour. | `` |
| **W17** | Interview readiness | Core CS | **Core networking** | Study HTTP, DNS, TCP, TLS and connection lifecycles. | Explain one API request from client to database. | `network` |
| **W18** | Interview readiness | Core CS | **Operating systems** | Study processes, threads, memory and context switching. | Review concurrency terminology. | `operating system` |
| **W19** | Interview readiness | Core CS | **Concurrency** | Study races, locks, deadlocks and transaction conflicts. | Explain a race condition from a concrete example. | `operating system, concurren` |
| **W20** | Interview readiness | Interview | **First mock interview** | Complete a timed coding session and project discussion. | Write three specific improvement actions. | `` |
| **W21** | Interview readiness | DSA | **Graphs and algorithms** | Practise topological sorting and shortest-path fundamentals. | Review the weakest graph pattern. | `topological, shortest path, dijkstra, advanced graph` |
| **W22** | Interview readiness | DSA | **Greedy and backtracking** | Practise decision reasoning and state-space exploration. | Explain why greedy choices work or fail. | `greedy, backtrack` |
| **W23** | Interview readiness | Core CS | **Java and OOP diagnostic** | Review classes, interfaces, collections and exceptions if Python is stable. | Choose whether Java deserves a larger allocation. | `java, object oriented` |
| **W24** | Interview readiness | Interview | **Behavioural preparation** | Draft truthful STAR stories for leadership, failure and teamwork. | Practise a concise project explanation. | `` |
| **W25** | Recruitment execution | DSA | **Dynamic programming introduction** | Practise state definition, transitions and base cases. | Re-solve a graph or tree problem. | `dynamic programming, dp` |
| **W26** | Recruitment execution | Interview | **Timed assessments** | Complete a realistic timed coding set. | Analyse accuracy, speed and avoidable errors. | `` |
| **W27** | Recruitment execution | Project | **Project interview defence** | Explain architecture, schema, failure modes and trade-offs without notes. | Verify all resume metrics. | `system analysis, design` |
| **W28** | Recruitment execution | Career | **Company-specific preparation** | Choose two active applications and review their actual job requirements. | Tailor resumes and schedule mock interviews. | `` |
| **W29** | Recruitment execution | DSA | **Weakest DSA patterns** | Use scorecard evidence to target recurring mistakes. | Revisit problems after a delay. | `` |
| **W30** | Recruitment execution | Core CS | **Database and performance** | Study indexes, EXPLAIN plans and bottleneck measurement. | Record one defensible benchmark if useful. | `database` |
| **W31** | Recruitment execution | Interview | **Mock interview cycle** | Complete coding and behavioural mocks where available. | Convert feedback into three concrete changes. | `` |
| **W32** | Recruitment execution | Career | **Recruitment sprint** | Prioritise active roles, applications, referrals and assessments. | Review deadlines and eligibility. | `` |
| **W37** | Recruitment execution | DSA | **Targeted revision** | Use actual interview feedback or diagnostic weaknesses. | Re-solve previously missed problems. | `` |
| **W38** | Recruitment execution | Career | **Portfolio and applications** | Polish documentation and verify application records. | Remove unsupported resume claims. | `` |
| **W39** | Recruitment execution | Career | **Retrospective** | Evaluate outcomes, eligibility blockers and time allocation. | Build the next plan from evidence. | `` |


### 6.1 Calendar-Triggered & Periodic Rituals

These specialized modules fire automatically when their specific calendar or performance trigger is met:

| Ritual | Trigger | Scope & Strategy | Prescribed Actions |
| :--- | :--- | :--- | :--- |
| **Exam Mode** (`W33 · W34`) | Calendar enters `exam` kind | Pauses all new learning and LeetCode; protects academic grades. | Maintain DSA recall only if coursework permits: short review sessions, no new topics.<br>Pause nonessential project work around examinations.<br>Keep an application checklist for urgent deadlines only. |
| **Pre-Exam Week** | 7 days prior to any exam period | Enters `heavy` mode (1–2 h/wk max career work). | This week counts as heavy: 1–2 hours of career work at most.<br>Keep one short DSA session so recall does not decay.<br>Move anything optional until after the exams. |
| **Interview Mode** (`W35`) | Confirmed interview scheduled | Temporarily replaces regular curriculum with company-specific prep. | Prepare for the scheduled interview or assessment only.<br>Review the patterns and project questions relevant to that role.<br>Re-read the job description; rehearse three STAR stories aloud. |
| **Semester Review** (`W36`) | End of academic semester | Evaluates growth, adjusts target gaps, updates timetable. | Compare DSA, CS and project evidence against your October baseline.<br>Choose the highest-value gaps for the next quarter.<br>Add next semester's timetable and check the calendar for changes. |
| **Monthly Review** | End of each calendar month | Diagnostics against monthly milestones and application funnel. | What improved this month?<br>What remains weak?<br>Which applications progressed?<br>What must change next month? |
| **Weekly Check-In** | Every Sunday evening | Logs the 7-area scorecard and chooses top 3 priorities. | Rate this week's scorecard (Track tab).<br>Review new openings and upcoming deadlines.<br>Select the three highest-impact tasks for next week. |

---

## 7. Complete Java Learning Track Curriculum (58 Lessons)

> **Track Target**: Finish foundational Java in 3 weeks (with 2-week sprint and 4-week flexible pacing options).  
> **Course Alignment**: Maps directly to `CSM 281: Object-Oriented Programming with Java`. Doubled allocation on Thursdays.  
> **Primary Video Resource**: [Programming with Mosh: Java Tutorial for Beginners (YouTube)](https://www.youtube.com/watch?v=eIrMbAQSU34)

### 7.1 Part 1: Programming with Mosh — Java for Beginners (42 Video Chapters)

| Chapter ID | Video Range | Chapter Title | Hands-On Practice Task | Est. Practice | Video Timestamp Link |
| :--- | :--- | :--- | :--- | :--- | :--- |

| **MO1** | `0:00` → `1:48` | **Introduction** | *Watch & transcribe concepts* | 0 min | [Watch at 0:00 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=0s) |
| **MO2** | `1:48` → `4:02` | **Installing Java** | *Watch & transcribe concepts* | 0 min | [Watch at 1:48 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=108s) |
| **MO3** | `4:02` → `8:46` | **Anatomy of a Java Program** | *Watch & transcribe concepts* | 0 min | [Watch at 4:02 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=242s) |
| **MO4** | `8:46` → `16:01` | **Your First Java Program** | Create a HelloWorld project in IntelliJ and run it. | 10 min | [Watch at 8:46 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=526s) |
| **MO5** | `16:01` → `16:29` | **Cheat Sheet** | *Watch & transcribe concepts* | 0 min | [Watch at 16:01 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=961s) |
| **MO6** | `16:29` → `22:56` | **How Java Code Gets Executed** | Compile Main.java with javac and run it with java from the terminal. | 10 min | [Watch at 16:29 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=989s) |
| **MO7** | `22:56` → `25:24` | **Course Structure** | *Watch & transcribe concepts* | 0 min | [Watch at 22:56 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=1376s) |
| **MO8** | `25:24` → `26:02` | **Types** | *Watch & transcribe concepts* | 0 min | [Watch at 25:24 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=1524s) |
| **MO9** | `26:02` → `29:14` | **Variables** | *Watch & transcribe concepts* | 0 min | [Watch at 26:02 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=1562s) |
| **MO10** | `29:14` → `34:32` | **Primitive Types** | Declare one variable of every primitive type (note the L and F suffixes). | 10 min | [Watch at 29:14 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=1754s) |
| **MO11** | `34:32` → `39:19` | **Reference Types** | *Watch & transcribe concepts* | 0 min | [Watch at 34:32 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=2072s) |
| **MO12** | `39:19` → `43:42` | **Primitive Types vs Reference Types** | Show in code that copying a Point shares one object but copying an int does not. | 10 min | [Watch at 39:19 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=2359s) |
| **MO13** | `43:42` → `50:49` | **Strings** | Reverse a String and check if it is a palindrome; try trim, replace and indexOf. | 15 min | [Watch at 43:42 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=2622s) |
| **MO14** | `50:49` → `53:25` | **Escape Sequences** | *Watch & transcribe concepts* | 0 min | [Watch at 50:49 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=3049s) |
| **MO15** | `53:25` → `58:50` | **Arrays** | Solve Contains Duplicate in Java using Arrays.sort. | 20 min | [Watch at 53:25 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=3205s) |
| **MO16** | `58:50` → `1:01:30` | **Multi-Dimensional Arrays** | *Watch & transcribe concepts* | 0 min | [Watch at 58:50 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=3530s) |
| **MO17** | `1:01:30` → `1:03:18` | **Constants** | *Watch & transcribe concepts* | 0 min | [Watch at 1:01:30 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=3690s) |
| **MO18** | `1:03:18` → `1:07:25` | **Arithmetic Expressions** | *Watch & transcribe concepts* | 0 min | [Watch at 1:03:18 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=3798s) |
| **MO19** | `1:07:25` → `1:08:45` | **Order of Operations** | *Watch & transcribe concepts* | 0 min | [Watch at 1:07:25 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=4045s) |
| **MO20** | `1:08:45` → `1:15:14` | **Casting** | Read "1.5" as a String, parse it, and add it to an int. | 10 min | [Watch at 1:08:45 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=4125s) |
| **MO21** | `1:15:14` → `1:19:56` | **The Math Class** | *Watch & transcribe concepts* | 0 min | [Watch at 1:15:14 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=4514s) |
| **MO22** | `1:19:56` → `1:25:46` | **Formatting Numbers** | *Watch & transcribe concepts* | 0 min | [Watch at 1:19:56 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=4796s) |
| **MO23** | `1:25:46` → `1:30:48` | **Reading Input** | Read a name and an age with Scanner and print a formatted greeting. | 10 min | [Watch at 1:25:46 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=5146s) |
| **MO24** | `1:30:48` → `1:32:58` | **Project: Mortgage Calculator** | Build the mortgage calculator yourself before watching the solution. | 45 min | [Watch at 1:30:48 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=5448s) |
| **MO25** | `1:32:58` → `1:37:17` | **Solution: Mortgage Calculator** | *Watch & transcribe concepts* | 0 min | [Watch at 1:32:58 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=5578s) |
| **MO26** | `1:37:17` → `1:38:45` | **Types Summary** | *Watch & transcribe concepts* | 0 min | [Watch at 1:37:17 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=5837s) |
| **MO27** | `1:38:45` → `1:39:34` | **Control Flow** | *Watch & transcribe concepts* | 0 min | [Watch at 1:38:45 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=5925s) |
| **MO28** | `1:39:34` → `1:41:21` | **Comparison Operators** | *Watch & transcribe concepts* | 0 min | [Watch at 1:39:34 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=5974s) |
| **MO29** | `1:41:21` → `1:45:57` | **Logical Operators** | Write the loan-eligibility rule with &&, || and !. | 10 min | [Watch at 1:41:21 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=6081s) |
| **MO30** | `1:45:57` → `1:50:23` | **If Statements** | *Watch & transcribe concepts* | 0 min | [Watch at 1:45:57 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=6357s) |
| **MO31** | `1:50:23` → `1:53:52` | **Simplifying If Statements** | *Watch & transcribe concepts* | 0 min | [Watch at 1:50:23 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=6623s) |
| **MO32** | `1:53:52` → `1:56:19` | **The Ternary Operator** | *Watch & transcribe concepts* | 0 min | [Watch at 1:53:52 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=6832s) |
| **MO33** | `1:56:19` → `2:00:10` | **Switch Statements** | *Watch & transcribe concepts* | 0 min | [Watch at 1:56:19 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=6979s) |
| **MO34** | `2:00:10` → `2:06:10` | **Exercise: FizzBuzz** | Pause at 2:00:55 and solve FizzBuzz before watching the solution. | 15 min | [Watch at 2:00:10 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=7210s) |
| **MO35** | `2:06:10` → `2:09:57` | **For Loops** | Print a 1–10 multiplication table with nested for loops. | 10 min | [Watch at 2:06:10 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=7570s) |
| **MO36** | `2:09:57` → `2:14:26` | **While Loops** | *Watch & transcribe concepts* | 0 min | [Watch at 2:09:57 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=7797s) |
| **MO37** | `2:14:26` → `2:15:39` | **Do...While Loops** | *Watch & transcribe concepts* | 0 min | [Watch at 2:14:26 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=8066s) |
| **MO38** | `2:15:39` → `2:18:55` | **Break and Continue** | Write a loop that echoes input until the user types quit. | 10 min | [Watch at 2:15:39 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=8139s) |
| **MO39** | `2:18:55` → `2:22:02` | **For-Each Loop** | *Watch & transcribe concepts* | 0 min | [Watch at 2:18:55 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=8335s) |
| **MO40** | `2:22:02` → `2:23:30` | **Project: Mortgage Calculator (validation)** | Add input validation to your calculator yourself before watching the solution. | 30 min | [Watch at 2:22:02 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=8522s) |
| **MO41** | `2:23:30` → `2:28:28` | **Solution: Mortgage Calculator (validation)** | *Watch & transcribe concepts* | 0 min | [Watch at 2:23:30 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=8610s) |
| **MO42** | `2:28:28` → `2:29:26` | **Control Flow Summary** | *Watch & transcribe concepts* | 0 min | [Watch at 2:28:28 ↗](https://www.youtube.com/watch?v=eIrMbAQSU34&t=8908s) |


### 7.2 Part 2: Advanced OOP & Backend Study Lessons (16 Lessons)

After completing the Mosh beginner chapters, these 16 deep-dive lessons build advanced OOP, data structures, testing, and backend foundations:

| Lesson ID | Lesson Title | Study Time | Required Hands-On Implementation Task |
| :--- | :--- | :--- | :--- |

| **J7** | **Methods: parameters, return values, overloading, static** | 40 min | Refactor your mortgage calculator into methods: readNumber(prompt, min, max), calculateMortgage(...). |
| **J8** | **Classes and objects: fields, constructors, this, toString** | 45 min | Model a Student class with a constructor and toString. |
| **J9** | **Encapsulation: access modifiers, getters/setters, final** | 40 min | BankAccount with a private balance and validated deposit/withdraw. |
| **J10** | **Inheritance: extends, super, overriding, equals and hashCode** | 50 min | Shape → Circle and Rectangle with area(); override equals/hashCode on Circle. |
| **J11** | **Polymorphism and abstract classes** | 45 min | Store Shapes in a List<Shape> and total their areas polymorphically. |
| **J12** | **Interfaces, default methods, Comparable vs Comparator** | 45 min | Sort Students by GPA (descending), then by name. |
| **J13** | **Exceptions: try/catch/finally, checked vs unchecked, custom, try-with-resources** | 45 min | Throw an InsufficientFundsException from BankAccount.withdraw. |
| **J14** | **Collections I: List, ArrayList, LinkedList, iterating** | 40 min | Remove duplicates from an ArrayList while keeping order. |
| **J15** | **Collections II: HashMap, HashSet, TreeMap; the equals/hashCode contract** | 50 min | Solve Two Sum and Valid Anagram in Java with HashMap. |
| **J16** | **Stack, Queue and Deque (ArrayDeque); PriorityQueue** | 40 min | Solve Valid Parentheses in Java with ArrayDeque. |
| **J17** | **Generics: classes, methods, bounded types** | 40 min | Write a generic Pair<A, B> and max(List<T extends Comparable<T>>). |
| **J18** | **Enums, records and nested classes** | 30 min | An enum Direction with a turnRight() method; a record Point(int x, int y). |
| **J19** | **Lambdas and streams: map, filter, sorted, collect** | 45 min | From a List<Student>, collect the names with GPA > 3.5, sorted. |
| **J20** | **Testing with JUnit 5 and a Maven/Gradle project** | 45 min | Write five JUnit tests for BankAccount, including the exception. |
| **J21** | **DSA in Java: re-solve three problems you solved before** | 60 min | Time each one; list the Java syntax you still had to look up. |
| **J22** | **Checkpoint: small CLI app (library or bank) with classes, collections and exceptions** | 90 min | Push it to GitHub with a README. |


---

## 8. Upsoma Fundamentals Track (35 Topics Daily Rotation)

To ensure foundational Python and software engineering concepts stay fresh, the system rotates through these 35 topics on [Upsoma](https://www.upsoma.com/home) at **one topic per day**:

### 8.1 Python Fundamentals Rotation (18 Topics)

1. - [ ] **Python variables, data types and type conversion**
2. - [ ] **Python strings and string methods**
3. - [ ] **Python operators and conditionals**
4. - [ ] **Python loops, break and continue**
5. - [ ] **Python functions: arguments, *args/**kwargs, scope, return values**
6. - [ ] **Python lists and tuples**
7. - [ ] **Python dictionaries and sets**
8. - [ ] **Python comprehensions**
9. - [ ] **Python iterators and generators**
10. - [ ] **Python file I/O and context managers**
11. - [ ] **Python exceptions and error handling**
12. - [ ] **Python modules, packages and virtual environments**
13. - [ ] **Python OOP: classes, inheritance, dunder methods**
14. - [ ] **Python decorators**
15. - [ ] **Python type hints**
16. - [ ] **Python async/await**
17. - [ ] **Python testing with pytest**
18. - [ ] **Python built-in operations and their time complexity**

### 8.2 Software Engineering & Systems Fundamentals Rotation (17 Topics)

1. - [ ] **Big-O and complexity analysis**
2. - [ ] **SOLID principles**
3. - [ ] **DRY, KISS and YAGNI**
4. - [ ] **Separation of concerns, composition vs inheritance**
5. - [ ] **Common design patterns: factory, strategy, observer, singleton**
6. - [ ] **Clean code: naming, small functions, readability**
7. - [ ] **Unit vs integration testing and mocking**
8. - [ ] **Git workflow: branching, merging, rebasing**
9. - [ ] **HTTP and REST API design**
10. - [ ] **SQL basics, normalization and indexes**
11. - [ ] **Transactions and ACID**
12. - [ ] **Caching**
13. - [ ] **Concurrency basics**
14. - [ ] **Idempotency and retries**
15. - [ ] **Logging and error handling**
16. - [ ] **CI/CD basics**
17. - [ ] **System design basics: scaling and the CAP theorem**


---

## 9. Technical Projects Portfolio & Defense Specifications

Your portfolio must stand up to rigorous scrutiny by senior engineers and hiring managers. Every metric on your resume must be technically defensible, backed by reproducible automated tests and clear architectural rationale.

### 9.1 Flagship Project 1: LedgerCore (High-Throughput Financial Ledger)
- **Core Purpose**: A high-integrity, high-throughput distributed transaction ledger engine built to guarantee financial consistency under high concurrency.
- **Key Architectural Decisions**:
  - **SERIALIZABLE Isolation**: Applied to critical ledger balance updates to eliminate write skew, phantom reads, and non-repeatable reads.
  - **Concurrency Benchmark (98.5% Throughput)**: Under stress testing with conflicting transfers on hot accounts, 98.5% of transactions commit successfully.
  - **The 1.5% Abort Explanation**: The remaining 1.5% represents transactions intentionally aborted by PostgreSQL due to serialization conflicts under heavy contention. These are handled gracefully via randomized exponential backoff retries without data corruption.
  - **Idempotency Keys**: Unique client request keys prevent duplicate debits on network retry storms.

#### LedgerCore Defense Checklist:

- [ ] **L1**: What exactly is atomic about a transfer?
- [ ] **L2**: How do you prevent duplicate transfers when clients retry requests?
- [ ] **L3**: Why SERIALIZABLE isolation, and what happens when a transaction aborts?
- [ ] **L4**: What causes a retry, and how do you prevent retry storms?
- [ ] **L5**: How do you prove every completed transfer preserves the ledger's invariants?
- [ ] **L6**: Tests exist for concurrent debits, duplicate idempotency keys, insufficient funds, rollback, serialization failures and interruption.
- [ ] **L7**: Consistency guarantees and failure modes are documented.


### 9.2 Flagship Project 2: Financial Aggregation API (Event-Driven Data Pipeline)
- **Core Purpose**: Event-driven backend service processing multi-bank financial transactions and statement aggregation across asynchronous message queues.
- **Key Architectural Decisions**:
  - **Kafka Consumer Worker Crashes**: Designed to survive worker crashes between message consumption and DB commit without data duplication or loss.
  - **Deduplication Strategy**: Relies on transactional outbox patterns and unique idempotency keys in PostgreSQL.
  - **Provider Timeouts**: Out-of-order webhook delivery and downstream timeout reconciliation using deterministic state transitions.

#### Aggregation API Defense Checklist:

- [ ] **A1**: What happens if a worker crashes after processing a message but before acknowledging it?
- [ ] **A2**: How do you prevent duplicate database records after redelivery?
- [ ] **A3**: What happens when a provider times out but later completes the request?
- [ ] **A4**: How do you handle rate limits and a growing Kafka consumer backlog?
- [ ] **A5**: What guarantees does your implementation actually provide?
- [ ] **A6**: Tests exist for worker restarts, duplicates, out-of-order updates, provider timeouts and database failures.


### 9.3 Supporting Project 3: StudyPair (Collaborative Peer Learning Platform)
- **Core Purpose**: A collaborative matching platform for university students.
- **Key Architectural Highlights**:
  - Secure session/token-based authentication.
  - Relational PostgreSQL schema with foreign key cascades and composite indexes.
  - Background asynchronous notification workers.
  - Documented two specific integration race condition bugs and their resolution.

#### StudyPair Walkthrough Checklist:

- [ ] **SP1**: Explain the authentication model.
- [ ] **SP2**: Explain the database schema.
- [ ] **SP3**: Explain the notification flow.
- [ ] **SP4**: Describe the two integration bugs you caught and how.


### 9.4 Work Experience & Supporting Metrics
- **Ecobank Ghana (Personalisation Team Internship)**:
  - Add real responsibilities: backend service development, data pipeline maintenance, API integrations.
  - Defensible skills only: practical production usage of Java, Spring Boot, Kafka, Redis, and PostgreSQL.
- **FarmLink (Academic Project)**:
  - Treat the 25% farmer income improvement metric as a *pilot project estimate*, not an audited production result.
- **GitHub Actions & CI/CD**:
  - Show the actual automated workflow file running linter, unit tests, and integration test suites on every pull request.

#### Master Kickoff Checklist (First 7 Days):

- [ ] **K1**: Create the application tracker: every current application, deadline, location, eligibility and next action.
- [ ] **K2**: Run the DSA baseline: two unseen problems, no solutions first. Record approach, complexity and mistakes.
- [ ] **K3**: Audit LedgerCore: trace a transfer from validation to commit (idempotency, isolation, retries, integrity).
- [ ] **K4**: Test SQL and database fundamentals: joins, grouping, indexes, isolation.
- [ ] **K5**: Update your resume: add Ecobank accurately, verify metrics, qualify claims you cannot defend.
- [ ] **K6**: Explain LedgerCore aloud in five minutes, then answer duplicate-request and concurrency questions.
- [ ] **K7**: Review and plan: baseline, coursework load, applications. Pick three tasks for next week.

#### Resume Action Checklist:

- [ ] **R1**: Add the current Ecobank Personalisation Team internship with real responsibilities and technologies.
- [ ] **R2**: Verify the LedgerCore 98.5% concurrency figure: define the workload and explain the other 1.5%.
- [ ] **R3**: Make the aggregation failure injection reproducible; report sample size, duplicates and recovery.
- [ ] **R4**: Show what GitHub Actions actually runs (tests, lint) instead of listing CI/CD as a keyword.
- [ ] **R5**: Keep skills defensible: be able to explain your real use of Kafka, Redis and PostgreSQL.
- [ ] **R6**: Maintain role-specific versions (backend/infrastructure vs general SWE).
- [ ] **R7**: Treat the FarmLink 25% income figure as a pilot estimate, not a measured result.


---

## 10. Recruitment Strategy, Company Matrix & Global Tracker

### 10.1 Company Archetype Framework

| Archetype | Focus Area | Priority | Technical Preparation Focus |
| :--- | :--- | :--- | :--- |
| **Archetype A** | Financial-Services Technology | **High** | DSA, clean coding, OOP, SQL, debugging, project walkthroughs and behavioural interviews. Add Java when relevant. Bloomberg and infrastructure teams: systems fundamentals and performance. |
| **Archetype B** | General Technology & Product Engineering | **High** | Independent DSA, coding accuracy, data structures, testing, debugging and clear technical communication. |
| **Archetype C** | Infrastructure, Data Systems & Developer Platforms | **Medium–High** | Programming fundamentals, networking, OS, concurrency and performance reasoning. Deepen distributed systems where the role justifies it. |
| **Archetype D** | Quantitative Trading & Research Engineering | **Selective** | Programming depth, algorithms, mathematical reasoning. C++ and low-level performance for some roles — establish the DSA baseline first. |
| **Archetype E** | Early-Insight & Pre-Internship Programmes | **When eligible** | Motivation, teamwork examples and fundamentals. Verify academic-year and location eligibility separately. |

### 10.2 Top 21 Priority Target Companies Matrix

The original 21 target companies represent your primary focus across North America, the UK, and global hubs:

| ID | Company | Archetype | Target Role | Country / City | Visa Sponsorship | Technical Focus & Prep Guidance | Careers / Posting Links |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

| **C001** | **Goldman Sachs** | Archetype A | Summer Analyst - Global Markets / Core Engineering (Distributed Systems) | United States / United Kingdom (New York, London, Salt Lake City) | Sponsorship explicitly offered | OOP, clean implementation, SQL, debugging and structured behavioural answers | [Portal](https://www.goldmansachs.com/careers/) · [Role](https://www.goldmansachs.com/careers/students/programs/) |
| **C002** | **JPMorgan Chase** | Archetype A | Software Engineer Program (SEP) Summer Analyst - Distributed Backend | United States / United Kingdom (New York, Jersey City, London, Bournemouth) | Sponsorship explicitly offered | DSA, Java fundamentals where relevant, project explanation and coding-assessment practice | [Portal](https://careers.jpmorgan.com/) · [Role](https://careers.jpmorgan.com/global/en/students/programs/software-engineer-summer-analyst) |
| **C003** | **Bloomberg** | Archetype A | Software Engineering Intern - Real-Time Distributed Systems / Infrastructure | United States / United Kingdom (New York, London) | Sponsorship explicitly offered | Strong DSA, code quality, debugging, systems fundamentals and detailed project defence | [Portal](https://www.bloomberg.com/company/careers/) · [Role](https://www.bloomberg.com/company/careers/early-career/) |
| **C004** | **Bank of America** | Archetype A | Global Technology Summer Analyst - Backend & Systems | United States / United Kingdom (Charlotte, New York, London) | Role-specific; verify | Coding fundamentals, OOP, databases, communication and role-specific technology | [Portal](https://careers.bankofamerica.com/) · [Role](https://campus.bankofamerica.com/) |
| **C005** | **Morgan Stanley** | Archetype A | Technology Summer Analyst - Core Engineering & Infrastructure | United States / United Kingdom (New York, London, Glasgow) | Role-specific; verify | DSA, OOP, Java where relevant, project discussion and behavioural preparation | [Portal](https://www.morganstanley.com/careers) · [Role](https://www.morganstanley.com/people-opportunities/students-graduates) |
| **C006** | **Citi** | Archetype A | Technology Summer Analyst - Enterprise Platforms & Distributed Backend | United States / United Kingdom (New York, Jersey City, London, Belfast) | Role-specific; verify | DSA, OOP, SQL, debugging and team-based project examples | [Portal](https://careers.citigroup.com/) · [Role](https://careers.citigroup.com/students-and-graduates/) |
| **C007** | **Palantir** | Archetype B | Software Engineer Intern - Apollo / Foundry Infrastructure & Distributed Platforms | United States / United Kingdom (New York, Washington D.C., London) | Sponsorship explicitly offered | Problem-solving, practical coding, project depth and explaining engineering trade-offs | [Portal](https://www.palantir.com/careers/) · [Role](https://www.palantir.com/careers/students/) |
| **C008** | **Microsoft** | Archetype B | Software Engineering Intern / Explore Intern (Azure Core & Cloud Infra) | United States / Ireland / Global (Redmond, Dublin, Global Tech Hubs) | Sponsorship explicitly offered | DSA, problem decomposition, testing and behavioural examples | [Portal](https://careers.microsoft.com/) · [Role](https://careers.microsoft.com/v2/global/en/students-and-graduates.html) |
| **C009** | **Google** | Archetype B | Software Engineering Intern / STEP Intern (Distributed Systems & Cloud Infrastructure) | United States / Europe / Global (Mountain View, New York, Zurich, Dublin) | Sponsorship explicitly offered | Strong DSA, algorithmic reasoning, coding accuracy and complexity analysis | [Portal](https://careers.google.com/) · [Role](https://www.google.com/about/careers/applications/students/) |
| **C010** | **Amazon** | Archetype B | Software Development Engineer (SDE) Intern - AWS Infrastructure & Cloud Services | United States / Europe / Global (Seattle, Arlington, Dublin, Luxembourg) | Sponsorship explicitly offered | DSA, coding, ownership stories and role-relevant behavioural preparation | [Portal](https://www.amazon.jobs/) · [Role](https://www.amazon.jobs/en/business_categories/student-programs) |
| **C011** | **Meta** | Archetype B | Software Engineer Intern / Meta University Intern (Core Systems & Infrastructure) | United States / United Kingdom (Menlo Park, New York, London) | Sponsorship explicitly offered | DSA speed, algorithmic reasoning and clear coding explanations | [Portal](https://www.metacareers.com/) · [Role](https://www.metacareers.com/students-and-grads/) |
| **C012** | **NVIDIA** | Archetype C | Software Engineering Intern - Cloud Platform, Systems Software & Distributed AI Infrastructure | United States / Germany / Global (Santa Clara, Austin, Munich, Global) | Sponsorship explicitly offered | Programming fundamentals, systems concepts relevant to the role and technical project depth | [Portal](https://www.nvidia.com/en-us/about-nvidia/careers/) · [Role](https://www.nvidia.com/en-us/about-nvidia/careers/university-recruiting/) |
| **C013** | **Apple** | Archetype B | Software Engineering Intern - Core OS, Cloud Infrastructure & Distributed Services | United States / United Kingdom / Germany (Cupertino, Austin, London, Munich) | Sponsorship explicitly offered | Role-specific technical fundamentals, implementation quality and attention to detail | [Portal](https://www.apple.com/careers/) · [Role](https://www.apple.com/careers/us/students.html) |
| **C014** | **Databricks** | Archetype C | Software Engineering Intern - Distributed Systems & Cloud Infrastructure | United States / Netherlands / United Kingdom (San Francisco, Mountain View, Amsterdam) | Sponsorship explicitly offered | Distributed data processing, databases, concurrency and relevant systems concepts | [Portal](https://www.databricks.com/company/careers) · [Role](https://www.databricks.com/company/careers/university-recruiting) |
| **C015** | **Stripe** | Archetype B | Software Engineering Intern - Infrastructure, Distributed Systems & Platform | United States / Ireland / United Kingdom (San Francisco, Seattle, Dublin, London) | Sponsorship explicitly offered | API design, correctness, testing, failure handling and clear engineering reasoning | [Portal](https://stripe.com/jobs) · [Role](https://stripe.com/jobs/university) |
| **C016** | **Two Sigma** | Archetype D | Software Engineering Intern - High-Performance Distributed Compute & Core Platforms | United States / United Kingdom (New York, London) | Sponsorship explicitly offered | Programming, DSA and mathematical reasoning appropriate to the exact role | [Portal](https://www.twosigma.com/careers/) · [Role](https://www.twosigma.com/careers/students-and-graduates/) |
| **C017** | **Jane Street** | Archetype D | Software Engineering Intern / Infrastructure Intern (Systems & OCaml Distributed Platforms) | United States / United Kingdom / Hong Kong / Singapore (New York, London, Hong Kong, Singapore) | Sponsorship explicitly offered | Programming depth and mathematical reasoning where required; verify the engineering role | [Portal](https://www.janestreet.com/join-jane-street/) · [Role](https://www.janestreet.com/join-jane-street/internships/) |
| **C018** | **Capital One** | Archetype B | Technology Internship Program (TIP) - Software Engineering | United States (McLean, Richmond, Plano) | Sponsorship explicitly unavailable | DSA, practical software engineering, SQL, testing and behavioural communication | [Portal](https://www.capitalonecareers.com/) · [Role](https://www.capitalonecareers.com/students) |
| **C019** | **Uber** | Archetype B | Software Engineer Intern / Uber STAR Intern - Distributed Infrastructure & Backend | United States / Netherlands (San Francisco, Sunnyvale, Amsterdam) | Sponsorship explicitly offered | DSA, backend architecture, reliability and service-level trade-offs where relevant | [Portal](https://www.uber.com/us/en/careers/) · [Role](https://www.uber.com/us/en/careers/teams/university/) |
| **C020** | **Cloudflare** | Archetype C | Software Engineering Intern - Distributed Systems, Edge Network & Core Platform | United States / United Kingdom / Portugal (San Francisco, Austin, London, Lisbon) | Sponsorship explicitly offered | Networking, operating systems, performance and systems fundamentals for the team | [Portal](https://www.cloudflare.com/careers/) · [Role](https://www.cloudflare.com/careers/jobs/) |
| **C021** | **Hudson River Trading** | Archetype D | Core Engineering Intern - Ultra-Low Latency C++ & Distributed Trading Systems | United States / United Kingdom / Singapore (New York, London, Singapore) | Sponsorship explicitly offered | Algorithms, programming depth, concurrency and C++ or performance engineering where relevant | [Portal](https://www.hudsonrivertrading.com/careers/) · [Role](https://www.hudsonrivertrading.com/campus/) |


### 10.3 Global 101-Company Recruiting Tracker Overview

To maximize your odds as an international candidate from KNUST (Ghana), your recruiting tracker has been expanded to **101 target employers** actively sponsoring international students across three primary geographic regions:
- **North America (US & Canada)**: 35 companies (Tech giants, quantitative trading firms, financial technology).
- **United Kingdom & Europe (EMEA)**: 45 companies (London fintech, Dublin tech hubs, Amsterdam market makers, Berlin infrastructure).
- **Asia-Pacific (APAC)**: 21 companies (Singapore and Tokyo financial technology and global engineering offices).

All 101 companies are tracked in your dedicated workbook: [2027_software_engineering_recruiting_tracker.xlsx](file:///c:/Users/HP/Roadmap/2027_software_engineering_recruiting_tracker.xlsx).

#### Complete Regional Directory of 101 Target Companies:

| Company ID | Company Name | Region | Priority | Country / Cities | 2027 Opening Window | Official Careers URL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |

| `C001` | **Goldman Sachs** | North America / Global | Priority A | United States / United Kingdom | Aug 2026 | [Careers Link ↗](https://www.goldmansachs.com/careers/) |
| `C002` | **JPMorgan Chase** | North America / Global | Priority A | United States / United Kingdom | Jul 2026 | [Careers Link ↗](https://careers.jpmorgan.com/) |
| `C003` | **Bloomberg** | North America / Global | Priority A | United States / United Kingdom | Aug 2026 | [Careers Link ↗](https://www.bloomberg.com/company/careers/) |
| `C004` | **Bank of America** | North America / Global | Priority B | United States / United Kingdom | Aug 2026 | [Careers Link ↗](https://careers.bankofamerica.com/) |
| `C005` | **Morgan Stanley** | North America / Global | Priority B | United States / United Kingdom | Aug 2026 | [Careers Link ↗](https://www.morganstanley.com/careers) |
| `C006` | **Citi** | North America / Global | Priority B | United States / United Kingdom | Aug 2026 | [Careers Link ↗](https://careers.citigroup.com/) |
| `C007` | **Palantir** | North America / Global | Priority A | United States / United Kingdom | Aug 2026 | [Careers Link ↗](https://www.palantir.com/careers/) |
| `C008` | **Microsoft** | North America / Global | Priority A | United States / Ireland / Global | Aug 2026 | [Careers Link ↗](https://careers.microsoft.com/) |
| `C009` | **Google** | North America / Global | Priority A | United States / Europe / Global | Sep 2026 | [Careers Link ↗](https://careers.google.com/) |
| `C010` | **Amazon** | North America / Global | Priority A | United States / Europe / Global | Jul 2026 | [Careers Link ↗](https://www.amazon.jobs/) |
| `C011` | **Meta** | North America / Global | Priority A | United States / United Kingdom | Aug 2026 | [Careers Link ↗](https://www.metacareers.com/) |
| `C012` | **NVIDIA** | North America / Global | Priority A | United States / Germany / Global | Aug 2026 | [Careers Link ↗](https://www.nvidia.com/en-us/about-nvidia/careers/) |
| `C013` | **Apple** | North America / Global | Priority A | United States / United Kingdom / Germany | Sep 2026 | [Careers Link ↗](https://www.apple.com/careers/) |
| `C014` | **Databricks** | North America / Global | Priority A | United States / Netherlands / United Kingdom | Aug 2026 | [Careers Link ↗](https://www.databricks.com/company/careers) |
| `C015` | **Stripe** | North America / Global | Priority A | United States / Ireland / United Kingdom | Aug 2026 | [Careers Link ↗](https://stripe.com/jobs) |
| `C016` | **Two Sigma** | North America / Global | Priority A | United States / United Kingdom | Jul 2026 | [Careers Link ↗](https://www.twosigma.com/careers/) |
| `C017` | **Jane Street** | North America / Global | Priority A | United States / United Kingdom / Hong Kong / Singapore | Jun 2026 | [Careers Link ↗](https://www.janestreet.com/join-jane-street/) |
| `C018` | **Capital One** | North America | Priority B | United States | Jul 2026 | [Careers Link ↗](https://www.capitalonecareers.com/) |
| `C019` | **Uber** | North America / Global | Priority A | United States / Netherlands | Aug 2026 | [Careers Link ↗](https://www.uber.com/us/en/careers/) |
| `C020` | **Cloudflare** | North America / Global | Priority A | United States / United Kingdom / Portugal | Aug 2026 | [Careers Link ↗](https://www.cloudflare.com/careers/) |
| `C021` | **Hudson River Trading** | North America / Global | Priority A | United States / United Kingdom / Singapore | Jun 2026 | [Careers Link ↗](https://www.hudsonrivertrading.com/careers/) |
| `C022` | **Revolut** | Europe | Priority A | United Kingdom / Poland | Sep 2026 | [Careers Link ↗](https://www.revolut.com/careers/) |
| `C023` | **Wise** | Europe | Priority A | United Kingdom / Estonia / Hungary | Oct 2026 | [Careers Link ↗](https://www.wise.jobs/) |
| `C024` | **Monzo** | Europe | Priority A | United Kingdom | Oct 2026 | [Careers Link ↗](https://monzo.com/careers/) |
| `C025` | **Starling Bank** | Europe | Priority B | United Kingdom | Oct 2026 | [Careers Link ↗](https://www.starlingbank.com/careers/) |
| `C026` | **Checkout.com** | Europe | Priority B | United Kingdom / France | Nov 2026 | [Careers Link ↗](https://www.checkout.com/careers) |
| `C027` | **Adyen** | Europe | Priority A | Netherlands | Sep 2026 | [Careers Link ↗](https://careers.adyen.com/) |
| `C028` | **Spotify** | Europe | Priority A | Sweden / United Kingdom | Oct 2026 | [Careers Link ↗](https://www.lifeatspotify.com/jobs) |
| `C029` | **Klarna** | Europe | Priority B | Sweden / Germany | Oct 2026 | [Careers Link ↗](https://www.klarna.com/careers/) |
| `C030` | **Booking.com** | Europe | Priority A | Netherlands | Sep 2026 | [Careers Link ↗](https://jobs.booking.com/) |
| `C031` | **Elastic** | Europe / Global | Priority A | Netherlands / Global / Remote | Oct 2026 | [Careers Link ↗](https://www.elastic.co/about/careers) |
| `C032` | **Canonical** | Europe / Remote / Global | Priority A | Remote / United Kingdom | Open Year-Round | [Careers Link ↗](https://canonical.com/careers) |
| `C033` | **Arm** | Europe | Priority A | United Kingdom | Sep 2026 | [Careers Link ↗](https://www.arm.com/company/careers) |
| `C034` | **Ocado Technology** | Europe | Priority B | United Kingdom / Poland | Oct 2026 | [Careers Link ↗](https://www.ocado.com/careers/) |
| `C035` | **Deliveroo** | Europe | Priority B | United Kingdom | Oct 2026 | [Careers Link ↗](https://deliveroo.engineering/) |
| `C036` | **Just Eat Takeaway.com** | Europe | Priority B | Netherlands / United Kingdom | Oct 2026 | [Careers Link ↗](https://careers.justeattakeaway.com/) |
| `C037` | **Skyscanner** | Europe | Priority B | United Kingdom | Sep 2026 | [Careers Link ↗](https://www.skyscanner.net/jobs/) |
| `C038` | **Trainline** | Europe | Priority B | United Kingdom | Oct 2026 | [Careers Link ↗](https://www.thetrainline.com/careers/) |
| `C039` | **Expedia Group** | North America / Europe / Global | Priority B | United States / United Kingdom / Switzerland | Sep 2026 | [Careers Link ↗](https://www.expediagroup.com/careers/) |
| `C040` | **Mollie** | Europe | Priority B | Netherlands | Oct 2026 | [Careers Link ↗](https://jobs.mollie.com/) |
| `C041` | **Miro** | Europe / Global | Priority B | Netherlands / Germany / Remote | Oct 2026 | [Careers Link ↗](https://miro.com/careers/) |
| `C042` | **SumUp** | Europe | Priority B | Germany / United Kingdom | Nov 2026 | [Careers Link ↗](https://www.sumup.com/careers/) |
| `C043` | **N26** | Europe | Priority B | Germany / Austria / Spain | Oct 2026 | [Careers Link ↗](https://n26.com/en-eu/careers) |
| `C044` | **Zalando** | Europe | Priority B | Germany / Ireland | Sep 2026 | [Careers Link ↗](https://jobs.zalando.com/) |
| `C045` | **HelloFresh** | Europe | Priority B | Germany | Oct 2026 | [Careers Link ↗](https://careers.hellofresh.com/) |
| `C046` | **Delivery Hero** | Europe | Priority B | Germany | Oct 2026 | [Careers Link ↗](https://careers.deliveryhero.com/) |
| `C047` | **Flix** | Europe | Priority B | Germany | Nov 2026 | [Careers Link ↗](https://www.flixbus.com/company/careers) |
| `C048` | **Celonis** | Europe | Priority B | Germany / Spain | Sep 2026 | [Careers Link ↗](https://www.celonis.com/careers/) |
| `C049` | **SAP** | Europe / Global | Priority A | Germany / Ireland / Global | Aug 2026 | [Careers Link ↗](https://jobs.sap.com/) |
| `C050` | **Siemens** | Europe / Global | Priority B | Germany | Sep 2026 | [Careers Link ↗](https://www.siemens.com/global/en/company/jobs.html) |
| `C051` | **Bosch** | Europe / Global | Priority B | Germany | Sep 2026 | [Careers Link ↗](https://www.bosch.com/careers/) |
| `C052` | **Ericsson** | Europe / Global | Priority B | Sweden | Oct 2026 | [Careers Link ↗](https://www.ericsson.com/en/careers) |
| `C053` | **Nokia** | Europe / Global | Priority B | Finland / Germany | Dec 2026 | [Careers Link ↗](https://www.nokia.com/about-us/careers/) |
| `C054` | **Unity** | Europe / North America | Priority B | Denmark / United Kingdom / United States | Sep 2026 | [Careers Link ↗](https://careers.unity.com/) |
| `C055` | **King** | Europe | Priority B | United Kingdom / Sweden | Oct 2026 | [Careers Link ↗](https://careers.king.com/) |
| `C056` | **Supercell** | Europe | Priority B | Finland | Nov 2026 | [Careers Link ↗](https://supercell.com/en/careers/) |
| `C057` | **Wolt** | Europe | Priority B | Finland / Germany | Oct 2026 | [Careers Link ↗](https://wolt.com/en/jobs) |
| `C058` | **Pleo** | Europe | Priority B | Denmark / United Kingdom | Nov 2026 | [Careers Link ↗](https://www.pleo.io/en/careers) |
| `C059` | **Trustpilot** | Europe | Priority B | Denmark / United Kingdom | Nov 2026 | [Careers Link ↗](https://business.trustpilot.com/jobs) |
| `C060` | **GitLab** | Global / Remote | Priority A | Remote Global | Sep 2026 | [Careers Link ↗](https://about.gitlab.com/jobs/) |
| `C061` | **Red Hat** | North America / Europe / Global | Priority A | United States / Czech Republic / Germany | Sep 2026 | [Careers Link ↗](https://www.redhat.com/en/jobs) |
| `C062` | **SUSE** | Europe / Global | Priority A | Germany / Czech Republic / Remote | Oct 2026 | [Careers Link ↗](https://www.suse.com/careers/) |
| `C063` | **Optiver** | Europe / Asia / Global | Priority A | Netherlands / United Kingdom / Singapore | Jun 2026 | [Careers Link ↗](https://optiver.com/working-at-optiver/career-opportunities/) |
| `C064` | **IMC Trading** | Europe / Asia / Global | Priority A | Netherlands / United States / Australia | Jul 2026 | [Careers Link ↗](https://www.imc.com/careers/) |
| `C065` | **Flow Traders** | Europe / Global | Priority A | Netherlands / United Kingdom | Jul 2026 | [Careers Link ↗](https://www.flowtraders.com/careers) |
| `C066` | **Susquehanna International Group (SIG)** | North America / Europe / Global | Priority A | Ireland / United States / Australia | Jul 2026 | [Careers Link ↗](https://sig.com/careers/) |
| `C067` | **Grab** | Asia | Priority A | Singapore | Oct 2026 | [Careers Link ↗](https://grab.careers/) |
| `C068` | **Sea Limited (Shopee)** | Asia | Priority A | Singapore | Nov 2026 | [Careers Link ↗](https://careers.shopee.com/) |
| `C069` | **ByteDance** | Asia / Global | Priority A | Singapore / United Kingdom / United States | Aug 2026 | [Careers Link ↗](https://jobs.bytedance.com/en) |
| `C070` | **Tencent** | Asia / Global | Priority A | Singapore / China | Sep 2026 | [Careers Link ↗](https://careers.tencent.com/en-us/home.html) |
| `C071` | **Alibaba Group** | Asia / Global | Priority A | Singapore / United States | Aug 2026 | [Careers Link ↗](https://talent.alibaba.com/) |
| `C072` | **Ant Group** | Asia | Priority B | Singapore / China | Sep 2026 | [Careers Link ↗](https://www.antgroup.com/en/careers) |
| `C073` | **Huawei** | Asia / Global | Priority B | Germany / Singapore | Oct 2026 | [Careers Link ↗](https://career.huawei.com/) |
| `C074` | **Xiaomi** | Asia / Global | Priority B | China / Singapore | Oct 2026 | [Careers Link ↗](https://hr.xiaomi.net/) |
| `C075` | **Baidu** | Asia | Priority B | China | Sep 2026 | [Careers Link ↗](https://talent.baidu.com/) |
| `C076` | **JD.com** | Asia | Priority B | China | Oct 2026 | [Careers Link ↗](https://corporate.jd.com/careers) |
| `C077` | **Meituan** | Asia | Priority B | China | Sep 2026 | [Careers Link ↗](https://zhaopin.meituan.com/) |
| `C078` | **Trip.com Group** | Asia / Global | Priority B | Singapore / United Kingdom | Oct 2026 | [Careers Link ↗](https://careers.trip.com/) |
| `C079` | **Samsung Electronics** | Asia / Global | Priority A | South Korea / United States | Aug 2026 | [Careers Link ↗](https://www.samsung.com/global/business/careers/) |
| `C080` | **NAVER** | Asia | Priority B | South Korea | Oct 2026 | [Careers Link ↗](https://recruit.navercorp.com/) |
| `C081` | **Kakao** | Asia | Priority B | South Korea | Nov 2026 | [Careers Link ↗](https://careers.kakao.com/) |
| `C082` | **LY Corporation (LINE Yahoo)** | Asia | Priority B | Japan | Oct 2026 | [Careers Link ↗](https://www.lycorp.co.jp/en/recruit/) |
| `C083` | **Rakuten** | Asia / Global | Priority B | Japan | Sep 2026 | [Careers Link ↗](https://corp.rakuten.co.jp/careers/) |
| `C084` | **Mercari** | Asia / Global | Priority B | Japan | Aug 2026 | [Careers Link ↗](https://careers.mercari.com/) |
| `C085` | **Sony** | Asia / Global | Priority A | Japan / United States / United Kingdom | Sep 2026 | [Careers Link ↗](https://www.sony.com/en/SonyInfo/Careers/) |
| `C086` | **Fujitsu** | Asia / Global | Priority B | Japan | Oct 2026 | [Careers Link ↗](https://www.fujitsu.com/global/about/careers/) |
| `C087` | **NEC** | Asia / Global | Priority B | Japan | Nov 2026 | [Careers Link ↗](https://www.nec.com/en/global/careers/) |
| `C088` | **Hitachi** | Asia / Global | Priority B | Japan / United States | Oct 2026 | [Careers Link ↗](https://www.hitachi.com/corporate/careers/) |
| `C089` | **Panasonic** | Asia / Global | Priority B | Japan | Nov 2026 | [Careers Link ↗](https://holdings.panasonic/global/careers.html) |
| `C090` | **Toyota Connected** | Asia / North America | Priority B | Japan / United States | Sep 2026 | [Careers Link ↗](https://www.toyotaconnected.com/careers) |
| `C091` | **PayPay** | Asia | Priority B | Japan | Oct 2026 | [Careers Link ↗](https://about.paypay.ne.jp/career/en/) |
| `C092` | **Agoda** | Asia | Priority A | Thailand / Singapore | Sep 2026 | [Careers Link ↗](https://careersatagoda.com/) |
| `C093` | **Lazada** | Asia | Priority B | Singapore | Oct 2026 | [Careers Link ↗](https://www.lazada.com/en/careers/) |
| `C094` | **Carousell** | Asia | Priority B | Singapore | Oct 2026 | [Careers Link ↗](https://careers.carousell.com/) |
| `C095` | **GovTech Singapore** | Asia | Priority B | Singapore | Dec 2026 | [Careers Link ↗](https://www.tech.gov.sg/careers/overview/) |
| `C096` | **DBS Bank** | Asia | Priority B | Singapore | Dec 2026 | [Careers Link ↗](https://www.dbs.com/careers/index.html) |
| `C097` | **OCBC** | Asia | Priority B | Singapore | Dec 2026 | [Careers Link ↗](https://www.ocbc.com/group/careers/) |
| `C098` | **UOB** | Asia | Priority B | Singapore | Dec 2026 | [Careers Link ↗](https://www.uobgroup.com/careers/) |
| `C099` | **GoTo Group (Gojek/Tokopedia)** | Asia | Priority B | Indonesia / Singapore | Nov 2026 | [Careers Link ↗](https://www.gotocompany.com/careers) |
| `C100` | **Zoho** | Asia / Global | Priority B | India / United States | Nov 2026 | [Careers Link ↗](https://www.zoho.com/careers/) |
| `C101` | **Freshworks** | Asia / Global | Priority B | India / United States | Oct 2026 | [Careers Link ↗](https://www.freshworks.com/company/careers/) |


### 10.4 Application Eligibility Verification Gates

Before submitting any application, verify all six eligibility criteria to avoid automatic rejections:


- [ ] **GRAD**: Accepts a student graduating in May 2029
- [ ] **GHANA**: Accepts applicants studying at KNUST in Ghana
- [ ] **LOC**: Open to applicants based outside the advertised country
- [ ] **AUTH**: Work authorisation / sponsorship is provided or not needed
- [ ] **DATES**: Internship dates fit university obligations
- [ ] **REQS**: Academic requirements, programme restrictions and deadline checked


---

## 11. Master Playbook & Strategic Decision Framework

### 11.1 Ranked Core Priorities
1. **DSA and Coding Interviews**: Build independent problem-solving ability and speed — the single broadest interview bottleneck.
2. **Academic Performance**: Protect your CWA (target 85+). Coursework failure terminates all career opportunities.
3. **Project Correctness**: Make LedgerCore and the aggregation API reproducible, testable, and defensible.
4. **Applications and Eligibility**: Apply as roles open. Graduation year, location, authorisation, and dates can rule you out immediately.
5. **Core Computer Science**: Master databases, networking, operating systems, and concurrency alongside project work.
6. **Behavioural Interviews**: Structure ownership, teamwork, failure, conflict, and learning stories from real experience.
7. **Java and Spring Boot**: Deepen after establishing a stable DSA baseline and while supporting `CSM 281`.
8. **Advanced Systems Programming**: Defer deep C++, lock-free structures, and advanced theory unless a specific role requires them.

### 11.2 The Four DSA Mastery Stages
- **Stage 1: Foundation**: Solve common array, string, and hash-map problems independently; accurately explain asymptotic time and space complexity.
- **Stage 2: Intermediate**: Recognise the correct pattern in unfamiliar problems and implement a clean, bug-free solution with edge-case tests.
- **Stage 3: Timed Performance**: Solve appropriately selected interview problems within a realistic time limit (15 min Easy, 25 min Medium) without hints.
- **Stage 4: Interview-Ready**: Articulate high-level approaches before coding, reason about trade-offs, test edge cases aloud, and recover calmly from hints.

### 11.3 Core Computer Science Syllabus
- **Databases**: Relational modelling, joins, indexes, query plans (`EXPLAIN ANALYZE`), ACID, isolation levels, locks, and deadlocks.
- **Networking**: HTTP/1.1 vs HTTP/2, DNS, TCP three-way handshake, TLS lifecycle, timeouts, connection pooling, and retries.
- **Operating Systems**: Processes vs threads, memory virtualization, paging, CPU scheduling, synchronization primitives, and deadlocks.
- **Concurrency**: Race conditions, thread safety, atomicity, asynchronous I/O, event loops, and backpressure.
- **Distributed Systems**: Duplicate delivery, idempotency, replication, CAP theorem, consistency models, failure recovery, observability.
- **System Design**: Functional/non-functional requirements, API design, data models, bottlenecks, caching strategies, message queues, rate limiting, and trade-offs.

### 11.4 Strict Decision Rules for Diagnosing Bottlenecks
- **If DSA accuracy is low**: Reduce new topics immediately and return to foundational pattern revision.
- **If accuracy is high but timed performance is poor**: Practise timed problem sets, implementation speed, and template muscle memory.
- **If you cannot explain a project decision**: Revisit the implementation and write out the trade-off rationale before adding another feature.
- **If backend implementation is strong but CS answers are weak**: Shift project development time directly toward networking, databases, and OS fundamentals.
- **If an interview is scheduled**: Temporarily drop secondary roadmap tasks and prioritise that specific interview's requirements.
- **If university coursework is falling behind**: Reduce career preparation immediately. Academic standing is non-negotiable.
- **If facing repeated rejections**: Diagnose the exact stage of rejection (Resume screen, Online Assessment, Technical Phone Screen, or Onsite) before altering the strategy.

### 11.5 Professional Networking & Referral Framework
- Prioritise outreach to KNUST alumni, Ghanaian engineers working abroad, former interns, and engineers on target teams.
- Ask informed, thoughtful questions regarding technical expectations, team culture, and selection criteria rather than immediately asking for a referral.
- Use mentor sessions to practice technical explanations aloud and solicit direct, unfiltered feedback.
- Request a referral only for a verified open role where your background directly aligns and the contact feels comfortable vouching for you.
- Maintain a strict follow-up log; never send repetitive messages that provide no new context.
- At Ecobank, seek out a small backend-oriented assignment or an introduction to the core services and payments architecture teams.

---

## 12. Missing Information & Unconfirmed University Items

In accordance with strict verification standards, the following items are currently pending official university confirmation and must not be fabricated:

1. **CSM 281 (Object-Oriented Programming with Java)**: *Resolved.* The official weekly scheme has been added (8 topics; see section 4.2).
2. **CSM 291 (System Analysis and Design I) Official Outline**:
   - Official course outline has not yet been distributed.
   - *Current Operating Plan*: Course marked as **Outline Pending**. Using the supplementary YouTube playlist ([System Analysis and Design Playlist](https://youtube.com/playlist?list=PL5q3E8eRUieWtYLmRU3z94-vGRcwKr9tM&si=SLNLiiCV2xRPecQu)) for background study without assuming it represents the official exam syllabus.
3. **ENGL 263 (Literature in English I) Official Outline**:
   - Course outline, reading lists, and assessment structures are pending.
   - *Current Operating Plan*: Course registered with 1 credit. Zero topics or study tasks will be invented until the syllabus is distributed.
4. **KNUST Mid-Semester & Final Examination Individual Dates**:
   - The university academic calendar confirms the examination periods (Mid-sems: Dec 14–18, 2026; Finals: Jan 25 – Feb 12, 2027), but the specific day-by-day paper timetable has not yet been published.
5. **Semester 2 Timetable & Syllabi**:
   - Semester 2 begins on March 15, 2027. The official lecture timetable and second-semester course outlines will be provided by the department closer to that date.

---

*Roadmap file compiled and extracted into `six-month-roadmap.md` from active repository configurations, academic calendar, timetable, data models, and recruiting database.*
