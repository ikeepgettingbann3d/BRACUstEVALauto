// ==UserScript==
// @name         BRACU Student Evaluation Helper
// @namespace    local.bracu.evalhelper
// @version      2.0.0
// @description  Template-based BRACU course evaluation helper. Fills answers and stops at BRACU's own review screen. Never auto-submits.
// @match        https://courseevaluation.bracu.ac.bd/studentdashboard*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // BUILT-IN TEMPLATES
  // ---------------------------------------------------------------------------
  // Q1-Q10 are ratings from 1 to 5.
  // Attendance: 1=0-25%, 2=26-50%, 3=51-75%, 4=76-100%
  // Hours/week: 1=0-2, 2=2-3, 3=3-4, 4=4-5, 5=5-6, 6=7+
  //
  // Attendance is intentionally kept at 76-100% for all templates because it
  // describes YOUR attendance, not how good/bad the course was.
  // Suggestions are blank by default for every built-in template.
  // ---------------------------------------------------------------------------
  const TEMPLATES = Object.freeze({
    default: Object.freeze({
      name: 'Default',
      ratings: [5, 5, 5, 5, 5, 4, 3, 4, 5, 4],
      attendance: '4',
      hoursPerWeek: '6',
      instructorSuggestion: '',
      courseSuggestion: ''
    }),

    best: Object.freeze({
      name: 'Best outcome',
      ratings: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      attendance: '4',
      hoursPerWeek: '6',
      instructorSuggestion: '',
      courseSuggestion: ''
    }),

    average: Object.freeze({
      name: 'Average',
      ratings: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      attendance: '4',
      hoursPerWeek: '6',
      instructorSuggestion: '',
      courseSuggestion: ''
    }),

    worst: Object.freeze({
      name: 'Worst outcome',
      ratings: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      attendance: '4',
      hoursPerWeek: '6',
      instructorSuggestion: '',
      courseSuggestion: ''
    })
  });

  const STORAGE_KEY = 'bracuEvalHelper.customPreset.v2';

  const IDS = Object.freeze({
    root: 'bracu-eval-helper-root',
    fill: 'bracu-eval-helper-fill',
    template: 'bracu-eval-helper-template',
    customize: 'bracu-eval-helper-customize',
    editor: 'bracu-eval-helper-editor',
    note: 'bracu-eval-helper-note',
    style: 'bracu-eval-helper-style',
    saveCustom: 'bracu-eval-helper-save-custom',
    resetEditor: 'bracu-eval-helper-reset-editor'
  });

  let busy = false;
  let selectedTemplateKey = 'default';
  let workingPreset = clonePreset(TEMPLATES.default);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function clonePreset(preset) {
    return {
      name: preset.name || 'Custom',
      ratings: [...preset.ratings],
      attendance: String(preset.attendance),
      hoursPerWeek: String(preset.hoursPerWeek),
      instructorSuggestion: preset.instructorSuggestion || '',
      courseSuggestion: preset.courseSuggestion || ''
    };
  }

  function sanitizePreset(candidate) {
    if (!candidate || typeof candidate !== 'object') return null;

    const ratings = Array.isArray(candidate.ratings)
      ? candidate.ratings.map((v) => Number.parseInt(v, 10))
      : [];

    if (
      ratings.length !== 10 ||
      ratings.some((v) => !Number.isInteger(v) || v < 1 || v > 5)
    ) {
      return null;
    }

    const attendance = String(candidate.attendance ?? '');
    const hoursPerWeek = String(candidate.hoursPerWeek ?? '');

    if (!['1', '2', '3', '4'].includes(attendance)) return null;
    if (!['1', '2', '3', '4', '5', '6'].includes(hoursPerWeek)) return null;

    return {
      name: 'Custom',
      ratings,
      attendance,
      hoursPerWeek,
      instructorSuggestion: String(candidate.instructorSuggestion || ''),
      courseSuggestion: String(candidate.courseSuggestion || '')
    };
  }

  function loadSavedCustomPreset() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return sanitizePreset(JSON.parse(raw));
    } catch (error) {
      console.warn('[BRACU Evaluation Helper] Could not load custom preset:', error);
      return null;
    }
  }

  function saveCustomPreset(preset) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ratings: preset.ratings,
      attendance: preset.attendance,
      hoursPerWeek: preset.hoursPerWeek,
      instructorSuggestion: preset.instructorSuggestion,
      courseSuggestion: preset.courseSuggestion
    }));
  }

  function getModal() {
    return document.querySelector('#modal-large');
  }

  function getNextButton() {
    return document.querySelector('#nextstep');
  }

  function getPrevButton() {
    return document.querySelector('#prevstep');
  }

  function getActiveStep() {
    const active = document.querySelector('.steps .step-item.active');
    const value = Number.parseInt(active?.textContent?.trim() || '', 10);
    return Number.isFinite(value) ? value : 1;
  }

  function setRadio(questionNumber, value) {
    const input = document.querySelector(
      `input[name="answer${questionNumber}"][value="${value}"]`
    );

    if (!input) {
      throw new Error(`Could not find answer control for question ${questionNumber}.`);
    }

    input.checked = true;
  }

  function setSelect(id, value) {
    const select = document.querySelector(id);
    if (!select) throw new Error(`Could not find ${id}.`);
    select.value = String(value);
  }

  function setTextarea(id, value) {
    const textarea = document.querySelector(id);
    if (!textarea) throw new Error(`Could not find ${id}.`);
    textarea.value = value;
  }

  async function rewindToQuestionOne() {
    const prev = getPrevButton();
    if (!prev) throw new Error('Previous button was not found.');

    for (let guard = 0; guard < 20; guard += 1) {
      const step = getActiveStep();
      if (step <= 1) return;
      prev.click();
      await sleep(35);
    }

    throw new Error('Could not return the evaluation to question 1.');
  }

  function applyPresetToControls(preset) {
    preset.ratings.forEach((rating, index) => {
      setRadio(index + 1, rating);
    });

    setSelect('#answerDropdown11', preset.attendance);
    setSelect('#answerDropdown12', preset.hoursPerWeek);
    setTextarea('#textAnswer13', preset.instructorSuggestion);
    setTextarea('#textAnswer14', preset.courseSuggestion);

    // BRACU disables Next until Q1 changes. We do NOT dispatch change events,
    // because the site's radio handler auto-advances when those events fire.
    const next = getNextButton();
    if (!next) throw new Error('Next button was not found.');
    next.disabled = false;
  }

  async function advanceToOfficialReview() {
    const next = getNextButton();
    if (!next) throw new Error('Next button was not found.');

    // Fourteen controlled clicks make BRACU collect Q1-Q14 into its own
    // allResponse object. The final click opens BRACU's native review dialog.
    // We stop there. This script NEVER confirms/submits the evaluation.
    for (let i = 0; i < 14; i += 1) {
      if (next.disabled) next.disabled = false;
      next.click();
      await sleep(45);
    }
  }

  function attendanceLabel(value) {
    return ({
      '1': '0–25%',
      '2': '26–50%',
      '3': '51–75%',
      '4': '76–100%'
    })[String(value)] || String(value);
  }

  function hoursLabel(value) {
    return ({
      '1': '0–2 hrs',
      '2': '2–3 hrs',
      '3': '3–4 hrs',
      '4': '4–5 hrs',
      '5': '5–6 hrs',
      '6': '7+ hrs'
    })[String(value)] || String(value);
  }

  function updateNote() {
    const note = document.getElementById(IDS.note);
    if (!note) return;

    const comments =
      workingPreset.instructorSuggestion || workingPreset.courseSuggestion
        ? 'Comments included'
        : 'Suggestions blank';

    note.textContent =
      `Ratings: ${workingPreset.ratings.join(',')} • ` +
      `Attendance ${attendanceLabel(workingPreset.attendance)} • ` +
      `${hoursLabel(workingPreset.hoursPerWeek)}/week • ${comments} • No auto-submit`;
  }

  function updateFillButton() {
    const button = document.getElementById(IDS.fill);
    if (!button || busy) return;

    const label =
      selectedTemplateKey === 'custom'
        ? 'Custom'
        : TEMPLATES[selectedTemplateKey]?.name || 'Preset';

    button.textContent = `⚡ Fill ${label} & review`;
  }

  function setHelperState(text, disabled = false) {
    const button = document.getElementById(IDS.fill);
    if (!button) return;
    button.textContent = text;
    button.disabled = disabled;
  }

  function getTemplatePreset(key) {
    if (key === 'custom') {
      return loadSavedCustomPreset() || clonePreset(TEMPLATES.default);
    }

    return clonePreset(TEMPLATES[key] || TEMPLATES.default);
  }

  function loadTemplate(key) {
    selectedTemplateKey = key;
    workingPreset = getTemplatePreset(key);

    const select = document.getElementById(IDS.template);
    if (select) select.value = key;

    populateEditorFromWorkingPreset();
    updateFillButton();
    updateNote();
  }

  function editorRatingId(index) {
    return `bracu-eval-helper-q${index}`;
  }

  function populateEditorFromWorkingPreset() {
    const editor = document.getElementById(IDS.editor);
    if (!editor) return;

    workingPreset.ratings.forEach((rating, index) => {
      const control = document.getElementById(editorRatingId(index + 1));
      if (control) control.value = String(rating);
    });

    const attendance = document.getElementById('bracu-eval-helper-attendance');
    const hours = document.getElementById('bracu-eval-helper-hours');
    const instructor = document.getElementById('bracu-eval-helper-instructor-comment');
    const course = document.getElementById('bracu-eval-helper-course-comment');

    if (attendance) attendance.value = workingPreset.attendance;
    if (hours) hours.value = workingPreset.hoursPerWeek;
    if (instructor) instructor.value = workingPreset.instructorSuggestion;
    if (course) course.value = workingPreset.courseSuggestion;
  }

  function readEditorIntoWorkingPreset() {
    const ratings = [];

    for (let i = 1; i <= 10; i += 1) {
      const control = document.getElementById(editorRatingId(i));
      ratings.push(Number.parseInt(control?.value || '5', 10));
    }

    const attendance = document.getElementById('bracu-eval-helper-attendance');
    const hours = document.getElementById('bracu-eval-helper-hours');
    const instructor = document.getElementById('bracu-eval-helper-instructor-comment');
    const course = document.getElementById('bracu-eval-helper-course-comment');

    workingPreset = {
      name: 'Custom',
      ratings,
      attendance: attendance?.value || '4',
      hoursPerWeek: hours?.value || '5',
      instructorSuggestion: instructor?.value || '',
      courseSuggestion: course?.value || ''
    };

    selectedTemplateKey = 'custom';
    const templateSelect = document.getElementById(IDS.template);
    if (templateSelect) templateSelect.value = 'custom';

    updateFillButton();
    updateNote();
  }

  function onEditorChanged() {
    readEditorIntoWorkingPreset();
  }

  function toggleEditor() {
    const editor = document.getElementById(IDS.editor);
    const button = document.getElementById(IDS.customize);
    if (!editor || !button) return;

    const willOpen = editor.hidden;
    editor.hidden = !willOpen;
    button.textContent = willOpen ? '✕ Close editor' : '⚙ Customize';

    if (willOpen) populateEditorFromWorkingPreset();
  }

  function saveCurrentAsCustom() {
    readEditorIntoWorkingPreset();
    saveCustomPreset(workingPreset);

    const button = document.getElementById(IDS.saveCustom);
    if (button) {
      const old = button.textContent;
      button.textContent = '✓ Saved';
      setTimeout(() => {
        if (button) button.textContent = old;
      }, 900);
    }
  }

  function resetEditorToSelectedBase() {
    if (selectedTemplateKey === 'custom') {
      workingPreset = loadSavedCustomPreset() || clonePreset(TEMPLATES.default);
    } else {
      workingPreset = clonePreset(TEMPLATES[selectedTemplateKey] || TEMPLATES.default);
    }

    populateEditorFromWorkingPreset();
    updateNote();
  }

  async function fillAndReview() {
    if (busy) return;
    busy = true;
    setHelperState('Filling…', true);

    try {
      // If the editor is open, capture any text that may still have focus.
      if (!document.getElementById(IDS.editor)?.hidden) {
        readEditorIntoWorkingPreset();
      }

      await rewindToQuestionOne();
      applyPresetToControls(workingPreset);
      await sleep(80);
      await advanceToOfficialReview();

      setHelperState('✓ Loaded — review it', true);
      await sleep(900);
      updateFillButton();
      const button = document.getElementById(IDS.fill);
      if (button) button.disabled = false;
    } catch (error) {
      console.error('[BRACU Evaluation Helper]', error);
      setHelperState('⚠ Could not fill', false);

      const message =
        'BRACU Evaluation Helper could not complete the form. The website may have changed.\n\n' +
        (error?.message || String(error));

      if (window.Swal?.fire) {
        window.Swal.fire({
          icon: 'error',
          title: 'Evaluation Helper',
          text: message
        });
      } else {
        window.alert(message);
      }
    } finally {
      busy = false;
    }
  }

  function makeOption(value, label) {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = label;
    return option;
  }

  function createRatingEditor() {
    const grid = document.createElement('div');
    grid.className = 'bracu-eval-helper-rating-grid';

    for (let i = 1; i <= 10; i += 1) {
      const wrap = document.createElement('label');
      wrap.className = 'bracu-eval-helper-mini-field';
      wrap.textContent = `Q${i}`;

      const select = document.createElement('select');
      select.id = editorRatingId(i);
      select.className = 'form-select form-select-sm';
      select.setAttribute('aria-label', `Question ${i} rating`);

      for (let rating = 1; rating <= 5; rating += 1) {
        select.appendChild(makeOption(rating, String(rating)));
      }

      select.addEventListener('change', onEditorChanged);
      wrap.appendChild(select);
      grid.appendChild(wrap);
    }

    return grid;
  }

  function createEditor() {
    const editor = document.createElement('div');
    editor.id = IDS.editor;
    editor.className = 'bracu-eval-helper-editor';
    editor.hidden = true;

    const title = document.createElement('div');
    title.className = 'bracu-eval-helper-editor-title';
    title.textContent = 'Custom answers';
    editor.appendChild(title);

    editor.appendChild(createRatingEditor());

    const row = document.createElement('div');
    row.className = 'bracu-eval-helper-editor-row';

    const attendanceWrap = document.createElement('label');
    attendanceWrap.className = 'bracu-eval-helper-field';
    attendanceWrap.textContent = 'Attendance';

    const attendance = document.createElement('select');
    attendance.id = 'bracu-eval-helper-attendance';
    attendance.className = 'form-select form-select-sm';
    attendance.append(
      makeOption('1', '0–25%'),
      makeOption('2', '26–50%'),
      makeOption('3', '51–75%'),
      makeOption('4', '76–100%')
    );
    attendance.addEventListener('change', onEditorChanged);
    attendanceWrap.appendChild(attendance);

    const hoursWrap = document.createElement('label');
    hoursWrap.className = 'bracu-eval-helper-field';
    hoursWrap.textContent = 'Hours / week';

    const hours = document.createElement('select');
    hours.id = 'bracu-eval-helper-hours';
    hours.className = 'form-select form-select-sm';
    hours.append(
      makeOption('1', '0–2 Hours'),
      makeOption('2', '2–3 Hours'),
      makeOption('3', '3–4 Hours'),
      makeOption('4', '4–5 Hours'),
      makeOption('5', '5–6 Hours'),
      makeOption('6', '7+ Hours')
    );
    hours.addEventListener('change', onEditorChanged);
    hoursWrap.appendChild(hours);

    row.append(attendanceWrap, hoursWrap);
    editor.appendChild(row);

    const commentsRow = document.createElement('div');
    commentsRow.className = 'bracu-eval-helper-editor-row bracu-eval-helper-comments';

    const instructorWrap = document.createElement('label');
    instructorWrap.className = 'bracu-eval-helper-field';
    instructorWrap.textContent = 'Instructor suggestion';
    const instructor = document.createElement('textarea');
    instructor.id = 'bracu-eval-helper-instructor-comment';
    instructor.className = 'form-control form-control-sm';
    instructor.rows = 2;
    instructor.placeholder = 'Blank by default';
    instructor.addEventListener('input', onEditorChanged);
    instructorWrap.appendChild(instructor);

    const courseWrap = document.createElement('label');
    courseWrap.className = 'bracu-eval-helper-field';
    courseWrap.textContent = 'Course suggestion';
    const course = document.createElement('textarea');
    course.id = 'bracu-eval-helper-course-comment';
    course.className = 'form-control form-control-sm';
    course.rows = 2;
    course.placeholder = 'Blank by default';
    course.addEventListener('input', onEditorChanged);
    courseWrap.appendChild(course);

    commentsRow.append(instructorWrap, courseWrap);
    editor.appendChild(commentsRow);

    const actions = document.createElement('div');
    actions.className = 'bracu-eval-helper-editor-actions';

    const save = document.createElement('button');
    save.type = 'button';
    save.id = IDS.saveCustom;
    save.className = 'btn btn-sm btn-outline-success';
    save.textContent = '💾 Save custom';
    save.title = 'Save these custom values in this browser';
    save.addEventListener('click', saveCurrentAsCustom);

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.id = IDS.resetEditor;
    reset.className = 'btn btn-sm btn-outline-secondary';
    reset.textContent = '↺ Reset';
    reset.addEventListener('click', resetEditorToSelectedBase);

    actions.append(save, reset);
    editor.appendChild(actions);

    return editor;
  }

  function addStyles() {
    if (document.getElementById(IDS.style)) return;

    const style = document.createElement('style');
    style.id = IDS.style;
    style.textContent = `
      #${IDS.root} {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 6px;
      }

      .bracu-eval-helper-toolbar {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }

      .bracu-eval-helper-template-wrap {
        display: flex;
        align-items: center;
        gap: 7px;
        min-width: 230px;
        flex: 1 1 260px;
        margin: 0;
      }

      .bracu-eval-helper-template-wrap > span {
        font-size: 12px;
        font-weight: 700;
        opacity: .8;
        white-space: nowrap;
      }

      #${IDS.template} {
        min-width: 150px;
      }

      #${IDS.fill} {
        font-weight: 700;
        white-space: nowrap;
      }

      #${IDS.note} {
        font-size: 11px;
        line-height: 1.35;
        opacity: .72;
      }

      .bracu-eval-helper-editor {
        width: 100%;
        padding: 10px;
        border: 1px solid rgba(127,127,127,.28);
        border-radius: 8px;
        background: rgba(127,127,127,.05);
      }

      .bracu-eval-helper-editor-title {
        font-size: 12px;
        font-weight: 800;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: .04em;
        opacity: .8;
      }

      .bracu-eval-helper-rating-grid {
        display: grid;
        grid-template-columns: repeat(10, minmax(48px, 1fr));
        gap: 6px;
      }

      .bracu-eval-helper-mini-field,
      .bracu-eval-helper-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 0;
        font-size: 11px;
        font-weight: 650;
      }

      .bracu-eval-helper-editor-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 8px;
      }

      .bracu-eval-helper-editor-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 8px;
      }

      #modal-large .modal-footer {
        align-items: center;
        flex-wrap: wrap;
      }

      @media (max-width: 767.98px) {
        .bracu-eval-helper-rating-grid {
          grid-template-columns: repeat(5, minmax(48px, 1fr));
        }

        .bracu-eval-helper-editor-row {
          grid-template-columns: 1fr;
        }

        .bracu-eval-helper-toolbar > button,
        .bracu-eval-helper-template-wrap {
          flex: 1 1 auto;
        }

        #${IDS.fill} {
          width: 100%;
        }
      }

      @media (max-width: 420px) {
        .bracu-eval-helper-rating-grid {
          grid-template-columns: repeat(2, minmax(48px, 1fr));
        }
      }
    `;

    document.head.appendChild(style);
  }

  function installHelperUI() {
    if (document.getElementById(IDS.root)) return true;

    const modal = getModal();
    const footer = modal?.querySelector('.modal-footer');
    if (!modal || !footer || !getNextButton() || !getPrevButton()) return false;

    const root = document.createElement('div');
    root.id = IDS.root;

    const toolbar = document.createElement('div');
    toolbar.className = 'bracu-eval-helper-toolbar';

    const templateWrap = document.createElement('label');
    templateWrap.className = 'bracu-eval-helper-template-wrap';

    const templateLabel = document.createElement('span');
    templateLabel.textContent = 'Template';

    const templateSelect = document.createElement('select');
    templateSelect.id = IDS.template;
    templateSelect.className = 'form-select form-select-sm';
    templateSelect.append(
      makeOption('default', 'Default'),
      makeOption('best', 'Best outcome'),
      makeOption('average', 'Average'),
      makeOption('worst', 'Worst outcome'),
      makeOption('custom', 'Custom (saved)')
    );
    templateSelect.value = selectedTemplateKey;
    templateSelect.addEventListener('change', () => loadTemplate(templateSelect.value));

    templateWrap.append(templateLabel, templateSelect);

    const customize = document.createElement('button');
    customize.type = 'button';
    customize.id = IDS.customize;
    customize.className = 'btn btn-sm btn-outline-secondary';
    customize.textContent = '⚙ Customize';
    customize.addEventListener('click', toggleEditor);

    const fill = document.createElement('button');
    fill.type = 'button';
    fill.id = IDS.fill;
    fill.className = 'btn btn-success';
    fill.addEventListener('click', fillAndReview);

    toolbar.append(templateWrap, customize, fill);
    root.appendChild(toolbar);
    root.appendChild(createEditor());

    const note = document.createElement('div');
    note.id = IDS.note;
    root.appendChild(note);

    // Keep BRACU's own Previous/Next buttons untouched below our helper.
    footer.insertBefore(root, footer.firstChild);

    modal.addEventListener('shown.bs.modal', () => {
      if (!busy) {
        updateFillButton();
        updateNote();
      }
    });

    populateEditorFromWorkingPreset();
    updateFillButton();
    updateNote();
    return true;
  }

  function init() {
    addStyles();

    if (installHelperUI()) return;

    const observer = new MutationObserver(() => {
      if (installHelperUI()) observer.disconnect();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }

  init();
})();
